class FacingAngles:
    def __init__(self, horizontal: float, vertical: float):
        self.horizontal = horizontal
        self.vertical = vertical

    def to_dict(self) -> dict:
        return {"horizontal": self.horizontal, "vertical": self.vertical}

class Position:
    def __init__(self, x: float, y: float, z: float):
        self.x = x
        self.y = y
        self.z = z

    def to_dict(self) -> dict:
        return {"x": self.x, "y": self.y, "z": self.z}
    

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
        self.material = obstacle["material"]

    def to_dict(self) -> dict:
        return {
            "position": self.position.to_dict(),
            "width": self.width,
            "height": self.height,
            "depth": self.depth,
            "blocksVision": self.blocks_vision,
            "blocksMovement": self.blocks_movement,
            "material": self.material
        }

class Terrain:
    def __init__(self, terrain: dict):
        self.position = Position(
            x=terrain["position"]["x"],
            y=terrain["position"]["y"],
            z=terrain["position"]["z"]
        )
        self.rotation = Position(
            x=terrain["rotation"]["x"],
            y=terrain["rotation"]["y"],
            z=terrain["rotation"]["z"]
        )

        self.width = terrain["width"]
        self.height = terrain["height"]
        self.depth = terrain["depth"]

    def to_dict(self) -> dict:
        return {
            "position": self.position.to_dict(),
            "rotation": self.rotation.to_dict(),
            "width": self.width,
            "height": self.height,
            "depth": self.depth
        }

class Player:
    def __init__(
        self,
        name: str,
        position: Position,
        facing: FacingAngles,
        is_hunter: bool,
        is_found: bool,
    ):
        self.position = position
        self.facing = facing

        self.name = name

        self.is_hunter = is_hunter
        self.is_found = is_found

        self.disconnect_task = None
        self.connected = True
        self.is_creator = False

    def to_dict_for_initialization(self) -> dict:
        return {
            "name": self.name,
            "isHunter": self.is_hunter,
            "isFound": self.is_found,
            "isCreator": self.is_creator
        }
    def to_dict_for_user_state(self) -> dict:
        return {
            "isHunter": self.is_hunter,
            "isFound": self.is_found
        }
    def to_dict_for_others(self) -> dict:
        return {
            "name": self.name,
            "position": self.position.to_dict(),
            "facing": self.facing.to_dict(),
            "isHunter": self.is_hunter,
            "isFound": self.is_found
        }

class Dimension:
    def __init__(self, width: float, height: float, depth: float):
        self.width = width
        self.height = height
        self.depth = depth