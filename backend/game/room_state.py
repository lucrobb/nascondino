rooms: dict[str, dict] = {}

def init_room(room_code: str) -> dict:
    if room_code not in rooms:
        rooms[room_code] = {
            "players": {},
            "found": set(),
            "status": "waiting",
        }
    return rooms[room_code]

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

def add_player(room_code: str, player_id: str, name: str) -> None:
    room = rooms.get(room_code)
    if not room:
        return

    room["players"][player_id] = {
        "name": name,
        "position": {},
        "is_hunter": False
    }

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
                "name": player["name"],
                "position": player["position"],
                "isHunter": player["is_hunter"],
                "isFound": pid in room["found"],
            })
    return {"type": "state_update", "players": players, "status": room["status"]}
