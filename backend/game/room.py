import random
from .types import Obstacle, Player
from ..lobbies.models import Lobby

rooms: dict[str, dict] = {}

def init_room(room_code: str) -> None:
    try:
        lobby = Lobby.objects.get(room_code=room_code)
    except Lobby.DoesNotExist:
        return
    
    if room_code not in rooms:
        rooms[room_code] = {
            "players": dict(str, Player),
            "found": set(),
            "status": "waiting",
            "hor_fov": lobby.horizontal_fov,
            "ver_fov": lobby.vertical_fov,
            "max_distance": lobby.max_distance,
            "obstacles": [Obstacle(obstacle) for obstacle in lobby.obstacles]
        }

    


def start_game(room_code: str) -> None:
    room = rooms.get(room_code)
    if not room:
        return
    
    player_ids = list(room["players"].keys())
    num_hunters = max(1, len(player_ids) // 4)
    hunters = set(random.sample(player_ids, num_hunters))

    for pid, player in room["players"].items():
        player["is_hunter"] = pid in hunters
    
    room["status"] = "in_progress"

def add_player(room_code: str, player: Player) -> None:
    room = rooms.get(room_code)
    if not room:
        return

    room["players"][player.id] = player

def remove_player(room_code: str, player_id: str) -> None:
    room = rooms.get(room_code)
    if not room:
        return

    room["players"].pop(player_id, None)
    room["found"].discard(player_id)

def get_state(room_code: str) -> dict:
    room = rooms.get(room_code)

    players = []
    if room is not None:
        for pid, player in room["players"].items():
            #I use camelCase because this will be sent to the frontend
            players.append({
                "id": pid,
                "name": player.name,
                "position": player.position,
                "facing": player.facing,
                "isHunter": player.is_hunter,
                "isFound": pid in room["found"],
            })
    return {"type": "state_update", "players": players, "status": room["status"]}
