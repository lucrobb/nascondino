import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .room import Room
from .types import Obstacle, Player, Position, FacingAngles
from ..lobbies.models import Lobby

rooms: dict[str, Room] = {}

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

        await self.send(text_data=json.dumps({
            "type": "assigned_id",
            "playerId": self.player_id
        }))

    @database_sync_to_async
    def get_lobby_data(self, room_code: str) -> dict | None:
        try:
            lobby = Lobby.objects.get(room_code=room_code)
            return lobby.obstacles
        except Lobby.DoesNotExist:
            return None

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")

        if msg_type == "join":
            player_data = data["player"]
            player_data["id"] = self.player_id  # server-assigned id, don't trust client's
            self.room.add_player(Player(player_data))

        elif msg_type == "move":
            player = self.room.players.get(self.player_id)
            if player is None:
                return
            player.position = Position(**data["position"])
            player.facing = FacingAngles(**data["facing"])

            if player.is_hunter:
                self.room.check_found(self.player_id)

        elif msg_type == "start_game":
            self.room.start_game()

        await self.broadcast_state()

    async def disconnect(self, close_code):
        if hasattr(self, "room"):
            self.room.remove_player(self.player_id)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self.broadcast_state()

    async def broadcast_state(self):
        state = self.room.get_state()
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "room.message", "payload": state},
        )

    async def room_message(self, event):
        await self.send(text_data=json.dumps(event["payload"]))