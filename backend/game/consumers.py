import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from . import room_state


class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"]
        self.group_name = f"lobby_{self.room_code}"
        self.player_id = str(uuid.uuid4())

        #Adds user to the group (group_name), self.channel_name identifies this connection automatically
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send(text_data=json.dumps({
            "type": "assigned_id",
            "playerId": self.player_id,
        }))

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")
        
        if msg_type == "join":
            room_state.init_room(self.room_code)
            room_state.add_player(
                self.room_code,
                data["player"]
            )

        elif msg_type == "move":
            #Data received is a Player type, containing all necessary information
            room_state.rooms[self.room_code]["players"][self.player_id]["position"] = data["position"]
            room_state.rooms[self.room_code]["players"][self.player_id]["facing"] = data["facing"]

            if data["isHunter"]:
                room_state.check_found(
                    self.room_code,
                    self.player_id,

                )

        elif msg_type == "start_game":
            room_state.start_game(self.room_code)
        
        await self.broadcast_state()

    async def disconnect(self, close_code):
        room_state.remove_player(self.room_code, self.player_id)
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await self.broadcast_state()

    async def broadcast_state(self):
        state = room_state.get_state(self.room_code)
        await self.channel_layer.group_send(
            self.group_name,
            #calls room_message function defined below for every consumer of the group
            {"type": "room.message", "payload": state}, 
        )

    async def room_message(self, event):
        await self.send(text_data=json.dumps(event["payload"]))