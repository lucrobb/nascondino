import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .room import Room
from .types import Obstacle, Player, Position, FacingAngles
from lobbies.models import Lobby


rooms: dict[str, Room] = {}

#Lobby consumers handle specific connections with clients, delegating all group broadcasting to the room class
#We also store the rooms dict here which contains all active Rooms, easily retrieved using room_code stored in
#self.room_code at connection

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"]

        obstacles = await self.get_lobby_data(self.room_code)
        if obstacles is None:
            await self.accept()
            await self.send(text_data=json.dumps({"type": "error", "message": "Lobby not found"}))
            await self.close()
            return

        if self.room_code not in rooms:
            rooms[self.room_code] = Room(self.room_code, obstacles)
        self.room = rooms[self.room_code]

        self.group_name = f"lobby_{self.room_code}"
        self.player_id = str(uuid.uuid4())

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        self.room.register_channel(self.player_id, self.channel_name)

        await self.send(text_data=json.dumps({
            "type": "assigned_id",
            "playerId": self.player_id,
        }))

    @database_sync_to_async
    def get_lobby_data(self, room_code: str) -> dict | None:
        try:
            lobby = Lobby.objects.get(room_code=room_code)
            return lobby.obstacles
        except Lobby.DoesNotExist:
            return None

    #called by room, allows to be called for each client of the channel
    async def room_message(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            "type": "error",
            "message": message
        }))

    #called by room when host kicks this client
    async def force_close(self):
        await self.send(text_data=json.dumps({
            "type": "kicked",
            "message": "L'host ti ha rimoss* dalla lobby"
        }))
        await self.close()


    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")

        if msg_type == "join":
            player_data = data["player"]
            self.room.add_player(self.player_id, Player(player_data))
            await self.send(text_data=json.dumps({
                "type": "is_creator",
                "isCreator": self.player_id == self.room.creator_id,
            }))

            await self.room.broadcast_state()

        elif msg_type == "kick_player":
            if self.player_id != self.room.creator_id:
                return
            id = data["id"]
            await self.room.force_disconnect(id)
            await self.room.broadcast_state()

        elif msg_type == "start_game":
            if self.player_id != self.room.creator_id: 
                return
            self.room.start_game()
            await self.room.broadcast_state()

        elif msg_type == "end_game":
            if self.player_id != self.room.creator_id:
                return
            await self.room.end_game()

        elif msg_type == "move":
            player = self.room.players.get(self.player_id)
            if player is None:
                return
            player.position = Position(**data["position"])
            player.facing = FacingAngles(**data["facing"])

            await self.room.broadcast_state()

        elif msg_type == "capture_attempt":
            success = self.room.attempt_capture(self.player_id, data["targetId"])
            await self.send(text_data=json.dumps({
                "type": "capture_result", "success": success
            }))

            if success:
                await self.room.broadcast_state()
                if self.room.hunters_won():
                    await self.room.end_game()

    #Handles consumer disconnect, cleaning up the room from rooms if all players have disconnected
    async def disconnect(self, close_code):
        if hasattr(self, "room"):
            self.room.remove_player(self.player_id)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            if not self.room.players:
                rooms.pop(self.room_code, None)
                if self.room.timer_task and not self.room.timer_task.done():
                    self.room.timer_task.cancel()
            else:
                await self.room.broadcast_state()

