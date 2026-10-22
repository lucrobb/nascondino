use crate::types::{
    Vector3,
    FacingAngles,
    Obstacle,
    Region,
    Player
};
use crate::constants::{MAX_DISTANCE, HOR_FOV, VER_FOV};

pub struct Vision<'a> {
    position: &'a Vector3,
    facing: &'a FacingAngles,
    obstacles: &'a [Obstacle],
}
impl<'a> Vision<'a> {
    pub fn new(
        position: &'a Vector3, 
        facing: &'a FacingAngles, 
        obstacles: &'a [Obstacle], 
    ) -> Self {
        Self {
            position,
            facing,
            obstacles,
        }
    }

    fn relative_angle(&self, angle: f64, facing: f64) -> f64 {
        let delta_angle = angle - facing;
        return delta_angle.sin().atan2(delta_angle.cos());
    }

    fn angle_range_from(&self, center: &Vector3, dimensions: &Vector3) -> (f64, f64, f64, f64) {
        //We return the angle interval for both horizontal and vertical FOV

        let dw = dimensions.x / 2.0;
        let dh = dimensions.y / 2.0;
        let dd = dimensions.z / 2.0;

        let xs = vec![center.x - dw, center.x + dw];
        let ys = vec![center.y - dh, center.y + dh];
        let zs = vec![center.z - dd, center.z + dd];

        let mut hor_angles: Vec<f64> = Vec::new();
        let mut ver_angles: Vec<f64> = Vec::new();

        for x in &xs {
            for y in &ys {
                for z in &zs {
                    let dx = x - self.position.x;
                    let dy = y - self.position.y;
                    let dz = z - self.position.z;

                    let horizontal = self.relative_angle(
                        dz.atan2(dx),
                        self.facing.horizontal,
                    );
                    let vertical = self.relative_angle(
                        dy.atan2(dx.hypot(dz)),
                        self.facing.vertical,
                    );

                    hor_angles.push(horizontal);
                    ver_angles.push(vertical);
                }
            }
        }

        //we know the vectors are not empty so we can unwrap the max and min results from the Option returned
        let h_min = hor_angles.iter().copied().reduce(f64::min).unwrap();
        let h_max = hor_angles.iter().copied().reduce(f64::max).unwrap();
        let v_min = ver_angles.iter().copied().reduce(f64::min).unwrap();
        let v_max = ver_angles.iter().copied().reduce(f64::max).unwrap();

        return (h_min, h_max, v_min, v_max);
    }

    fn split_region(
        &self,
        region: Region,
        obstacle: (f64, f64, f64, f64), //angle range the obstacle occupies
    )-> Vec<Region> {

        let Region { h_start, h_end, v_start, v_end, is_obstacle } = region;
        let (oh_start, oh_end, ov_start, ov_end) = obstacle;

        //If the region is already an obstacle or there is no overlap between the region and the obstacle
        if is_obstacle 
            || h_end <= oh_start
            || h_start >= oh_end
            || v_start >= ov_end 
            || v_end <= ov_start
        {
            return vec![region];
        }

        //Points where region and obstacle overlap
        let overlap_h_start = h_start.max(oh_start);
        let overlap_h_end = h_end.min(oh_end);
        let overlap_v_start = v_start.max(ov_start);
        let overlap_v_end = v_end.min(ov_end);

        //Add the overlapping region (we know it is an obstacle)
        let mut fragments: Vec<Region> = vec![Region {
            h_start: overlap_h_start,
            h_end: overlap_h_end,
            v_start: overlap_v_start,
            v_end: overlap_v_end,
            is_obstacle: true,
        }];

        //Push leftover segments if not fully covered by obstacle, left of the region
        //Top and bottom segments only use overlapping width as to not cover the corner areas more than once

        //Left
        if h_start < overlap_h_start {
            fragments.push(Region { h_start, h_end: overlap_h_start, v_start, v_end, is_obstacle });
        }

        //Right
        if h_end > overlap_h_end {
            fragments.push(Region { h_start: overlap_h_end, h_end, v_start, v_end, is_obstacle });
        }

        //Bottom
        if v_start < overlap_v_start {
            fragments.push(Region { h_start: overlap_h_start, h_end: overlap_h_end, v_start, v_end: overlap_v_start, is_obstacle });
        }

        //Top
        if v_end > overlap_v_end {
            fragments.push(Region { h_start: overlap_h_start, h_end: overlap_h_end, v_start: overlap_v_end, v_end, is_obstacle });
        }

        return fragments;
    }

    pub fn is_player_visible(&self, target: &Player) -> bool {
        //We subtract 0.5 from the target height to calculate the distance from the center
        let target_dist = (target.position.x - self.position.x)
            .hypot(target.position.y - 0.5 - self.position.y)
            .hypot(target.position.z - self.position.z);
        if target_dist > MAX_DISTANCE {
            return false;
        }

        let mut obstacles: Vec<(f64, &Obstacle)> = Vec::new();
        for obstacle in self.obstacles {
            if !obstacle.blocks_vision {
                continue;
            }

            //We calculate the distance between the obstacles and the player by subtracting half of the length on each side for the closest point
            let dx = ((self.position.x - obstacle.position.x).abs() - obstacle.width / 2.0).max(0.0);
            let dy = ((self.position.y - obstacle.position.y).abs() - obstacle.height / 2.0).max(0.0);
            let dz = ((self.position.z - obstacle.position.z).abs() - obstacle.depth / 2.0).max(0.0);

            let dist = dx.hypot(dy).hypot(dz);
            if dist <= MAX_DISTANCE {
                obstacles.push((dist, obstacle));
            }
        }
        //We sort in order of the distance from the obstacles because we cannot consider obstacles more distant than the target 
        obstacles.sort_by(|a, b| a.0.total_cmp(&b.0)); //compare two tuples a and b, sort based on the tuple's first value (distance)

        let mut regions: Vec<Region> = vec![Region {
            h_start: -HOR_FOV / 2.0,
            h_end: HOR_FOV / 2.0,
            v_start: -VER_FOV / 2.0,
            v_end: VER_FOV / 2.0,
            is_obstacle: false,
        }];

        let target_position = Vector3 { x: target.position.x, y: target.position.y - 0.5, z: target.position.z };
        let (target_h_start, target_h_end, target_v_start, target_v_end) = self.angle_range_from(
            &target_position,
            &Vector3 { x: 0.5, y: 1.0, z: 0.5 },
        );

        for (dist, obstacle) in obstacles {
            if dist >= target_dist {
                break;
            }

            let angle_box = self.angle_range_from(
                &obstacle.position,
                &Vector3 { x: obstacle.width, y: obstacle.height, z: obstacle.depth },
            );

            //For each current region we split it into fragments if the obstacle overlaps with it
            let mut new_regions: Vec<Region> = Vec::new();
            for region in regions {
                let mut split_regions = self.split_region(region, angle_box);
                new_regions.append(&mut split_regions);
            }
            //Replace old fragments with the updated ones 
            regions = new_regions;
        }

        for region in &regions {
            if region.is_obstacle {
                continue;
            }

            //If target is within a visible region we return true
            if target_h_start < region.h_end 
                && target_h_end > region.h_start
                && target_v_start < region.v_end 
                && target_v_end > region.v_start
            {
                return true;
            }
        }
        return false;
    }
}