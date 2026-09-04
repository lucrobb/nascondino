class FacingAngles:
    def __init__(self, horizontal: float, vertical: float):
        self.horizontal = horizontal
        self.vertical = vertical

class Position:
    def __init__(self, x: float, y: int, z: int):
        self.x = x
        self.y = y
        self.z = z

class Obstacle:
    def __init__(self, obstacle: dict):
        self.position = Position(
            x=obstacle["position"]["x"],
            y=obstacle["position"]["y"],
            z=obstacle["position"]["z"]
        )

        self.width = obstacle["width"]
        self.height = obstacle["height"]
        self.depth = obstacle["depth"]

        self.blocks_vision = obstacle["blocksVision"]
        self.blocks_movement = obstacle["blocksMovement"]

class Player:
    def __init__(self, player: dict):
        self.position = Position(
            x=player["position"]["x"],
            y=player["position"]["y"],
            z=player["position"]["z"]
        )
        self.facing = FacingAngles(
            horizontal=player["facing"]["horizontal"],
            vertical=player["facing"]["vertical"]
        )

        self.id = player["id"]
        self.name = player["name"]

        self.is_hunter = player["isHunter"]
        self.is_found = player["isFound"]