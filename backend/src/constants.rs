use crate::types::{Obstacle, Terrain, Vector3, MaterialType};
use std::time::Duration;

pub const DEFAULT_OBSTACLES: &[Obstacle] = &[
    // Central structure
    Obstacle {
        position: Vector3 { x: 0.0, y: 1.0, z: -6.0 },
        width: 10.0,
        height: 2.0,
        depth: 1.0,
        material: MaterialType::Concrete,
        blocks_vision: true,
        blocks_movement: true,
    },
    Obstacle {
        position: Vector3 { x: 0.0, y: 1.0, z: 6.0 },
        width: 10.0,
        height: 2.0,
        depth: 1.0,
        material: MaterialType::Brick,
        blocks_vision: true,
        blocks_movement: true,
    },

    // Side structures
    Obstacle {
        position: Vector3 { x: -10.0, y: 1.0, z: 0.0 },
        width: 1.0,
        height: 2.0,
        depth: 8.0,
        material: MaterialType::Concrete,
        blocks_vision: true,
        blocks_movement: true,
    },
    Obstacle {
        position: Vector3 { x: 10.0, y: 1.0, z: 0.0 },
        width: 1.0,
        height: 2.0,
        depth: 8.0,
        material: MaterialType::Stone,
        blocks_vision: true,
        blocks_movement: true,
    },

    // Interior cover
    Obstacle {
        position: Vector3 { x: -5.0, y: 1.0, z: -1.0 },
        width: 2.0,
        height: 2.0,
        depth: 4.0,
        material: MaterialType::Brick,
        blocks_vision: true,
        blocks_movement: true,
    },
    Obstacle {
        position: Vector3 { x: 5.0, y: 1.0, z: 1.0 },
        width: 2.0,
        height: 2.0,
        depth: 4.0,
        material: MaterialType::Concrete,
        blocks_vision: true,
        blocks_movement: true,
    },

    // Low cover
    Obstacle {
        position: Vector3 { x: -4.0, y: 0.5, z: 7.0 },
        width: 3.0,
        height: 1.0,
        depth: 1.0,
        material: MaterialType::Wood,
        blocks_vision: true,
        blocks_movement: true,
    },
    Obstacle {
        position: Vector3 { x: 4.0, y: 0.5, z: -7.0 },
        width: 3.0,
        height: 1.0,
        depth: 1.0,
        material: MaterialType::Metal,
        blocks_vision: true,
        blocks_movement: true,
    },

    // Corner structures
    Obstacle {
        position: Vector3 { x: -13.0, y: 1.0, z: -10.0 },
        width: 5.0,
        height: 2.0,
        depth: 1.0,
        material: MaterialType::RustedMetal,
        blocks_vision: true,
        blocks_movement: true,
    },
    Obstacle {
        position: Vector3 { x: 13.0, y: 1.0, z: -10.0 },
        width: 5.0,
        height: 2.0,
        depth: 1.0,
        material: MaterialType::Brick,
        blocks_vision: true,
        blocks_movement: true,
    },
    Obstacle {
        position: Vector3 { x: -13.0, y: 1.0, z: 10.0 },
        width: 5.0,
        height: 2.0,
        depth: 1.0,
        material: MaterialType::Stone,
        blocks_vision: true,
        blocks_movement: true,
    },
    Obstacle {
        position: Vector3 { x: 13.0, y: 1.0, z: 10.0 },
        width: 5.0,
        height: 2.0,
        depth: 1.0,
        material: MaterialType::Concrete,
        blocks_vision: true,
        blocks_movement: true,
    },
];


pub const DEFAULT_TERRAIN: &[Terrain] = &[
    // Ramp up to a raised platform on the east side
    Terrain {
        position: Vector3 { x: 20.0, y: 1.5, z: 0.0 },
        rotation: Vector3 { x: 0.0, y: 0.0, z: -0.35 },
        width: 6.0,
        height: 0.4,
        depth: 4.0,
    },

    // Platform at the top of the ramp
    Terrain {
        position: Vector3 { x: 16.0, y: 3.0, z: 0.0 },
        rotation: Vector3 { x: 0.0, y: 0.0, z: 0.0 },
        width: 6.0,
        height: 0.4,
        depth: 6.0,
    },

    // Second ramp on the west side
    Terrain {
        position: Vector3 { x: -20.0, y: 1.5, z: 5.0 },
        rotation: Vector3 { x: 0.35, y: 0.0, z: 0.0 },
        width: 4.0,
        height: 0.4,
        depth: 6.0,
    },

    // Second raised platform
    Terrain {
        position: Vector3 { x: -20.0, y: 3.0, z: 2.0 },
        rotation: Vector3 { x: 0.0, y: 0.0, z: 0.0 },
        width: 4.0,
        height: 0.4,
        depth: 4.0,
    },
];

pub const DEFAULT_SPAWN_POSITION: &Vector3 = &Vector3 {
    x: 0.0,
    y: 1.0,
    z: 0.0,
};

pub const RECONNECT_TIMEOUT: Duration = Duration::from_secs(20);
pub const ROUND_DURATION: Duration = Duration::from_secs(600);
pub const MAX_DISTANCE: f64 = 15.0;
pub const HOR_FOV: f64 = 90.0_f64.to_radians();
pub const VER_FOV: f64 = 75.0_f64.to_radians();