import math
from .types import Obstacle, Player
from . import constants 
        

class Vision:
    def __init__(
        self, 
        hor_facing: float, 
        ver_facing, 
        x: float, 
        y: float, 
        z: float, 
        obstacles: list[Obstacle], 
    ):
        self.x = x
        self.y = y
        self.z = z

        self.hor_facing = hor_facing
        self.ver_facing = ver_facing

        self.hor_fov =constants.HORIZONTAL_FOV
        self.ver_fov = constants.VERTICAL_FOV
        self.max_distance = constants.MAX_VIEW_DISTANCE

        self.obstacles = obstacles

    def relative_angle(self, angle: float, facing: float) -> float:
        #Construct tan like normal, keep range in [-180, 180]
        return math.atan2(math.sin(angle - facing), math.cos(angle - facing)) 

    def angle_range_from(self, obstacle: Obstacle) -> tuple[float, float, float, float]:
        #we return the angle interval for both horizontal and vertical FOV

        #half of the shape's lengths, to allow to easily calculate superficial coordinate from center
        dw = obstacle.width / 2
        dh = obstacle.height / 2
        dd = obstacle.depth / 2

        xs = (obstacle.position.x - dw, obstacle.position.x + dw)
        ys = (obstacle.position.y - dh, obstacle.position.y + dh)
        zs = (obstacle.position.z - dd, obstacle.position.z + dd)


        hor_angles = []
        ver_angles = []

        #all combinations of coordinates for the different corners
        for x in xs:
            for y in ys:
                for z in zs:
                    dx = x - self.x
                    dy = y - self.y
                    dz = z - self.z

                    horizontal = self.relative_angle(
                        math.atan2(dz, dx),
                        self.hor_facing
                    )

                    horizontal_distance = math.hypot(dx, dz)
                    vertical = self.relative_angle(
                        math.atan2(dy, horizontal_distance),
                        self.ver_facing
                    )

                    hor_angles.append(horizontal)
                    ver_angles.append(vertical)

        return (
            min(hor_angles),
            max(hor_angles),
            min(ver_angles),
            max(ver_angles)
        )

    
    def split_region(
        self, 
        region: tuple[float, float, float, float, bool], 
        obstacle: tuple[float, float, float, float]
    ) -> list[tuple[float, float, float, float, bool]]:
        
        #We split the current region in new fragments
        h_start, h_end, v_start, v_end, is_obstacle = region
        oh_start, oh_end, ov_start, ov_end = obstacle

        #If the region is already an obstacle or the obstacle isn't in the region at all
        if (
            is_obstacle
            or h_end <= oh_start 
            or h_start >= oh_end
            or v_start >= ov_end
            or v_end <= ov_start
        ):
            return [region]

        #Points where the obstacle and the region overlap, keeping it within the region's bounds
        overlap_h_start = max(h_start, oh_start)
        overlap_h_end = min(h_end, oh_end)
        overlap_v_start = max(v_start, ov_start)
        overlap_v_end = min(v_end, ov_end)

        #We directly add the new obstacle to the region, eventually needing to add other fragments to fill in the space
        fragments = [(overlap_h_start, overlap_h_end, overlap_v_start, overlap_v_end, True)]

        #Append leftover segments not overlapped by the new obstacle
        #The vertical segments only use the overlapping width as to not overlap with other leftover fragments

        #Left
        if h_start < overlap_h_start:
            fragments.append((h_start, overlap_h_start, v_start, v_end, is_obstacle))

        #Right
        if h_end > overlap_h_end:
            fragments.append((overlap_h_end, h_end, v_start, v_end, is_obstacle))
        
        #Bottom
        if v_start < overlap_v_start:
            fragments.append((overlap_h_start, overlap_h_end, v_start, overlap_v_start, is_obstacle))

        #Top
        if v_end > overlap_v_end:
            fragments.append((overlap_h_start, overlap_h_end, overlap_v_end, v_end, is_obstacle))
        

        return fragments 
        
        
    def is_player_visible(self, target: Player) -> bool:
        #Check if the target player is visible to the hunter 

        target_dist = math.hypot(
            target.position.x - self.x, target.position.y - self.y, target.position.z - self.z
        )
        if target_dist > self.max_distance:
            return False

        obstacles = []
        for obstacle in self.obstacles:
            if not obstacle.blocks_vision:
                continue

            #For the obstacles we calculate dx and dz subtracting half of the length on each axis to reach the closest point to our current location
            dx = max(abs(self.x - obstacle.position.x) - obstacle.width / 2, 0)
            dy = max(abs(self.y - obstacle.position.y) - obstacle.height / 2, 0)
            dz = max(abs(self.z - obstacle.position.z) - obstacle.depth / 2, 0)

            #Distance to the closest point of the obstacle
            dist = math.hypot(dx, dy, dz)
            if dist <= self.max_distance:
                obstacles.append((dist, obstacle))

        players = []
        for player in self.players:
            dist = math.hypot(player.position.x - self.x, player.position.y - self.y, player.position.z - self.z)
            if dist <= self.max_distance:
                players.append((dist, "player", player))

        #We sort in order of distance, because we cannot consider more distant obstacles as such for the target player
        obstacles.sort(key=lambda o: o[0])

        #left and right horizontal angle extremities, bottom and top vertical angle extremities, is obstacle
        regions = [(-self.hor_fov / 2, self.hor_fov / 2, -self.ver_fov / 2, self.ver_fov / 2, False)] 
        dx, dy, dz = target.position.x - self.x, target.position.y - self.y, target.position.z - self.z
        hor_angle = self.relative_angle(math.atan2(dz, dx), self.hor_facing)
        ver_angle = self.relative_angle(math.atan2(dy, math.hypot(dx, dz)), self.ver_facing)

        for dist, obstacle in obstacles:
            if dist >= target_dist:
                #The target is closer, the obstacle can't be blocking it
                break

            #The angle spans from the current position
            angle_box = self.angle_range_from(obstacle)
            new_regions = []
            for region in regions:
                #Split the regions into obstructed and visible fragments
                new_regions += self.split_region(region, angle_box)
            regions = new_regions

        for h_start, h_end, v_start, v_end, is_obstacle in regions:
            if is_obstacle:
                continue

            #Target finds itself within the limits of a visible region
            if h_start <= hor_angle <= h_end and v_start <= ver_angle <= v_end:
                return True

        return False


