import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import asyncio

from .room import Room
from .types import Player, Position, FacingAngles
from lobbies.models import Lobby

#Lobby consumers handle specific connections with clients, delegating all group broadcasting to the room class
#We also store the rooms dict here which contains all active Rooms, easily retrieved using room_code stored in
#self.room_code at connection
rooms: dict[str, Room] = {}

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"]
        self.player_id = self.scope["url_route"]["kwargs"]["player_id"]

        self.group_name = f"lobby_{self.room_code}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        lobby = await self.get_lobby()
        if lobby is None:
            await self.send(text_data=json.dumps({
                "type": "kicked",
                "message": "Lobby non trovata."
            }))
            await self.close()
            return

        if self.room_code not in rooms:
            rooms[self.room_code] = Room(
                room_code=self.room_code,
                lobby=lobby, 
                on_remove_room=self.remove_room
            )

        self.room = rooms[self.room_code]
        self.room.player_channels[self.player_id] = self.channel_name

        self.player: Player | None = None

    @database_sync_to_async
    def get_lobby(self):
        try:
            return Lobby.objects.get(room_code=self.room_code)
        except Lobby.DoesNotExist:
            return None
            

#-----------------------------------------------------------------------------------------------------------------------
#-----------------------------------------------------------------------------------------------------------------------
    #Methods called by the room to communicate with consumers

    #Sends standard message
    async def room_message(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    #called by room when host kicks this client, causes disconnection of the websocket
    async def force_close(self, event):
        payload = event["payload"]
        await self.send(text_data=json.dumps({
            "type": "kicked",
            "message": payload["message"]
        }))
        await self.close()


    #We need to use the function as a callback in room to avoid circular imports
    async def remove_room(self, room_code: str):
        rooms.pop(room_code, None)

#-----------------------------------------------------------------------------------------------------------------------
#-----------------------------------------------------------------------------------------------------------------------

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data["type"]

        #The consumer hasn't joined the lobby yet, they can't send the other message types yet
        if msg_type != "join" and self.player is None:
            return

        if msg_type == "join":
            player_name = data["name"]
            await self.room.add_player(self.player_id, player_name)
            self.player = self.room.players.get(self.player_id)

        elif msg_type == "kick_player":
            if not self.player.is_creator:
                return
            
            id = data["id"]
            await self.room.force_disconnect(id, "L'host ti ha rimoss* dalla lobby")
            await self.room.broadcast_state()

        elif msg_type == "start_game":
            if not self.player.is_creator: 
                return
            
            await self.room.start_game()

        elif msg_type == "end_game":
            if not self.player.is_creator:
                return 
            
            await self.room.end_game()

        elif msg_type == "move":
            self.player.position = Position(data["position"])
            self.player.facing = FacingAngles(data["facing"])

            await self.room.broadcast_state()

        elif msg_type == "capture_attempt":
            await self.room.attempt_capture(self.player_id, data["targetId"])

#-----------------------------------------------------------------------------------------------------------------------
#-----------------------------------------------------------------------------------------------------------------------

    #Handles consumer disconnect, cleaning up the room from rooms if all players have disconnected
    async def disconnect(self, close_code):
        current_channel = self.room.player_channels.get(self.player_id)
        #Only mark player as disconnected if there is not yet a channel that has recovered the same player
        if current_channel != self.channel_name:
            return
        
        if self.player is not None:
            self.player.disconnect_task = asyncio.create_task(
                self.room.remove_after_timeout(self.player_id)
            )
            self.player.connected = False
            await self.room.check_game_over()


        await self.channel_layer.group_discard(self.group_name, self.channel_name)

