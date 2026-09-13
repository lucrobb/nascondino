from .types import Obstacle, Player
import random
from .vision import Vision
from .constants import ROUND_DURATION

from channels.layers import get_channel_layer
import asyncio

#Rooms own all data inside a lobby, handling all group broadcasting and async states relative to the whole lobby
#Functions are called by the websocket consumer messages, handling all game logic relevant for the entire lobby

class Room:
    def __init__(self, room_code: str, obstacles: dict) -> None:
        self.room_code = room_code
        self.group_name = f"lobby_{self.room_code}"
        self.players: dict[str, Player] = {}
        self.creator_id: str | None = None
        self.obstacles: list[Obstacle] = [Obstacle(obstacle) for obstacle in obstacles]
        self.status = "waiting"
        self.timer_task: asyncio.Task | None = None

    #Handle websocket broadcasting from within the room, don't depend on consumer connection
    async def broadcast(self, payload: dict):
        #Gets channel layer from Django settings, can broadcast like the consumer class
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            self.group_name,
            {"type": "room.message", "payload": payload}
        )

    async def broadcast_state(self):
        state = {
            "type": "state_update",
            "status": self.status,
            "players": {pid: p.to_dict() for pid, p in self.players.items()}
        }
        await self.broadcast(state)

    async def start_round_timer(self):
        await asyncio.sleep(ROUND_DURATION)
        await self.end_game()

    async def end_game(self):
        if self.status == "ended":
            return
        self.status = "ended"
        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()
        await self.broadcast({
            "type": "game_over",
            "winner": "hunters" if self.hunters_won() else "hiders",
        })

    def start_game(self):
        player_ids = list(self.players.keys())
        num_hunters = max(1, len(player_ids) // 4)
        hunter_ids = set(random.sample(player_ids, num_hunters))

        for pid, player in self.players.items():
            player.is_hunter = pid in hunter_ids

        self.status = "in_progress"
        self.timer_task = asyncio.create_task(self.start_round_timer())


    def add_player(self, player_id: str, player: Player):
        if not self.players:
            #user is creator of lobby
            self.creator_id = player_id
        self.players[player_id] = player

    def remove_player(self, player_id: str):
        self.players.pop(player_id, None)

    def hunters_won(self) -> bool:
        hiders = [player for player in self.players.values() if not player.is_hunter]
        hunters = [player for player in self.players.values() if player.is_hunter]
        return (len(hiders) < 0 or all(player.is_found for player in hiders)) and len(hunters) > 0

    def attempt_capture(self, hunter_id: str, target_id: str) -> bool:
        hunter = self.players.get(hunter_id)
        target = self.players.get(target_id)

        if (
            hunter is None 
            or target is None 
            or not hunter.is_hunter 
            or target.is_hunter 
            or target.is_found
            or self.status != "in_progress"
            ):
            return False

        vision = Vision(
            hor_facing=hunter.facing.horizontal,
            ver_facing=hunter.facing.vertical,
            x=hunter.position.x,
            y=hunter.position.y,
            z=hunter.position.z,
            obstacles=self.obstacles
        )

        if vision.is_player_visible(target):
            self.players.get(target_id).is_found = True
            return True
        return False

    