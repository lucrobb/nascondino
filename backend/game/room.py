from .types import Player, Position, FacingAngles, Obstacle, Terrain
import random
from .vision import Vision
from .constants import ROUND_DURATION

from channels.layers import get_channel_layer
import asyncio
from lobbies.models import Lobby


#Rooms own all data inside a lobby, handling all group broadcasting and async states relative to the whole lobby
#Functions are called by the websocket consumer messages, handling all game logic relevant for the entire lobby

class Room:
    def __init__(self, room_code: str, lobby: Lobby, on_remove_room=None) -> None:
        self.room_code = room_code
        self.group_name = f"lobby_{self.room_code}"
        self.channel_layer = get_channel_layer()
        self.on_remove_room = on_remove_room

        self.players: dict[str, Player] = {}
        self.player_channels: dict[str, str] = {}

        self.obstacles: list[Obstacle] = [Obstacle(obstacle) for obstacle in lobby.obstacles]
        self.terrain: list[Terrain] = [Terrain(terrain) for terrain in lobby.terrain]
        self.spawn_position: Position = Position(**lobby.spawn_position)

        self.status = "waiting"
        self.timer_task: asyncio.Task | None = None
        
#-----------------------------------------------------------------------------------------------------------------------
#-----------------------------------------------------------------------------------------------------------------------

    #Methods to send messages via broadcast (sending to group) or singular channel messages

    #Handle websocket broadcasting from within the room, don't depend on consumer connection
    async def broadcast(self, type: str, payload: dict):
        #Gets channel layer from Django settings, can broadcast like the consumer class
        await self.channel_layer.group_send(
            self.group_name,
            {"type": type, "payload": payload}
        )

    async def send_to_consumer(self, player_id: str, type: str, payload: dict):
        channel_name = self.player_channels.get(player_id)

        if channel_name:
            await self.channel_layer.send(channel_name, {
                "type": type,
                "payload": payload
            })
            
#-----------------------------------------------------------------------------------------------------------------------
#-----------------------------------------------------------------------------------------------------------------------
    #Functions for sending state updates

    async def broadcast_state(self):
        idx = {}
        players = []
        for pid, player in self.players.items():
            if player.connected:
                curr = player.to_dict_for_others()
                curr["id"] = pid
                players.append(curr)
                idx[pid] = len(players) - 1

        for pid, player in self.players.items():
            player_idx = idx.get(pid)
            if player_idx is None:
                continue
            
            #We return the players excluding the user
            other_players = players[:player_idx] + players[player_idx + 1:]
            await self.send_to_consumer(
                pid, 
                "room.message", 
                {
                    "type": "state_update",
                    "status": self.status,
                    "player": player.to_dict_for_user_state(),
                    "otherPlayers": other_players
                }
            )

    async def send_initial_state(self, player_id: str):
        player = self.players.get(player_id)
        if not player:
            return

        other_players = []
        for pid, player in self.players.items():
            if player.connected and pid != player_id:
                curr = player.to_dict_for_others()
                curr["id"] = pid
                other_players.append(curr)

        await self.send_to_consumer(
            player_id, 
            "room.message", 
            {
                "type": "initial_state",
                "lobby": {
                    "obstacles": [obstacle.to_dict() for obstacle in self.obstacles],
                    "terrain": [terrain.to_dict() for terrain in self.terrain],
                    "status": self.status
                },
                "player": player.to_dict_for_initialization(),
                "position": player.position.to_dict(),
                "facing": player.facing.to_dict(),
                "otherPlayers": other_players
            }
        )

#-----------------------------------------------------------------------------------------------------------------------
    #Player handling

    async def add_player(self, player_id: str, name: str):
        #Player disconnected and came back within the disconnection time window
        if player_id in self.players:
            existing_player = self.players.get(player_id)
            existing_player.connected = True

            if existing_player.disconnect_task:
                existing_player.disconnect_task.cancel()
                existing_player.disconnect_task = None

        else:
            if self.status == "in_progress":
                await self.force_disconnect(player_id, "La partita è già iniziata")
                return

            new_player = Player(
                position=self.spawn_position,
                facing=FacingAngles(horizontal=0, vertical=0),
                name=name,
                is_hunter=False,
                is_found=False,
            )
            if not self.players:
                #user is creator of lobby
                new_player.is_creator = True
            self.players[player_id] = new_player

        await self.send_initial_state(player_id)
        await self.broadcast_state()

    async def remove_after_timeout(self, player_id: str):
        await asyncio.sleep(20)

        player = self.players.get(player_id)

        if player is not None and not player.connected:
            self.players.pop(player_id, None)
            self.player_channels.pop(player_id, None)
            await self.broadcast_state()

            if not self.players:
                if self.timer_task:
                    self.timer_task.cancel()

                if self.on_remove_room:
                    #Delete room with callback from consumers
                    await self.on_remove_room(self.room_code)

    async def force_disconnect(self, player_id: str, message: str):
        await self.send_to_consumer(
            player_id, 
            "force.close", 
            {"message": message}
        )

        self.players.pop(player_id, None)
        self.player_channels.pop(player_id, None)

#-----------------------------------------------------------------------------------------------------------------------
    #Round status handling

    async def start_round_timer(self):
        remaining = ROUND_DURATION
        while remaining > 0:
            await self.broadcast("room.message", {
                "type": "time_update", 
                "remaining": remaining
            })
            await asyncio.sleep(1)
            remaining -= 1
        await self.end_game()

    async def start_game(self):
        if self.status == "in_progress":
            return
        
        player_ids = [pid for pid, player in self.players.items() if player.connected]
        if not player_ids:
            return
        
        num_hunters = max(1, len(player_ids) // 4)
        hunter_ids = set(random.sample(player_ids, num_hunters))
        for pid, player in self.players.items():
            player.is_hunter = pid in hunter_ids

        self.status = "in_progress"
        self.timer_task = asyncio.create_task(self.start_round_timer())

        await self.broadcast_state()

    async def end_game(self):
        if self.status != "in_progress":
            return
        self.status = "ended"
        winner = "hunters" if self.hunters_won() else "hiders"
        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()

        for player in self.players.values():
            player.is_found = False
            player.is_hunter = False

        await self.broadcast("room.message", {
            "type": "game_over",
            "winner": winner
        })
        await self.broadcast_state()

#-----------------------------------------------------------------------------------------------------------------------
    #Player actions

    async def attempt_capture(self, hunter_id: str, target_id: str):
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
            return

        vision = Vision(
            hor_facing=hunter.facing.horizontal,
            ver_facing=hunter.facing.vertical,
            x=hunter.position.x,
            y=hunter.position.y,
            z=hunter.position.z,
            obstacles=self.obstacles
        )

        success = vision.is_player_visible(target)

        target.is_found = success
        await self.send_to_consumer(
            hunter_id, 
            "room.message", 
            {
                "type": "capture_result",
                "success": success,
                "targetName": target.name
            }
        )

        if success:
            await self.check_game_over()
            await self.broadcast_state()


#-----------------------------------------------------------------------------------------------------------------------
#-----------------------------------------------------------------------------------------------------------------------
    #Helper functions
    def alive_and_hunters(self):
        alive, hunters = 0, 0
        for player in self.players.values():
            if player.is_hunter: 
                hunters += 1
            else: 
                if not player.is_found and player.connected: alive += 1 

        return (alive, hunters)       

    def hunters_won(self) -> bool:
        alive, hunters = self.alive_and_hunters()
        return alive == 0 and hunters > 0

    async def check_game_over(self):
        alive, hunters = self.alive_and_hunters()
        if alive == 0 or hunters == 0:
            await self.end_game()


    