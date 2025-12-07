export const MOVE_SPEED = 0.15;
export const MOUSE_SENSITIVITY = 0.002;
export const PLAYER_RADIUS = 0.5;
export const MAP_BOUNDARY = 48;
export const EYE_HEIGHT = 1.6;
export const CHARACTER_Y_OFFSET = -1.6;
export const DAMAGE_PER_HIT = 25;
export const RESPAWN_DELAY = 3000;

export const BULLET = {
    RADIUS: 0.05,
    LENGTH: 0.4,
    LIFETIME: 2.5,
    COLOR: 0x00FFFF,
    SPEED: 2,
    FADE_START_PERCENT: 0.6,
    TRAIL_LENGTH: 6,
    TRAIL_UPDATE_INTERVAL: 2
};

export const HP = {
    MAX: 100,
    GREEN_THRESHOLD: 60,
    YELLOW_THRESHOLD: 30
};

export const WEAPONS = {
    pistol: {
        id: 'pistol',
        name: 'Pistol',
        slot: 2,
        damage: 15,
        fireRate: 400,
        recoilOffset: 0.03,
        recoilDuration: 80,
        position: { x: 0.25, y: -0.25, z: -0.4 },
        rotationY: -0.1,
        bulletSpeed: 1.8,
        bulletColor: 0xFFFF00
    },
    rifle: {
        id: 'rifle',
        name: 'Rifle',
        slot: 3,
        damage: 25,
        fireRate: 200,
        recoilOffset: 0.05,
        recoilDuration: 100,
        position: { x: 0.3, y: -0.3, z: -0.5 },
        rotationY: -0.1,
        bulletSpeed: 2.0,
        bulletColor: 0x00FFFF
    }
};

export const DEFAULT_WEAPON = 'pistol';
export const WEAPON_SWITCH_DURATION = 200;

export const STORAGE_KEY = 'matrics_player_name';

export const SCENE = {
    BACKGROUND_COLOR: 0x87CEEB,
    FOG_NEAR: 10,
    FOG_FAR: 100
};

export const CAMERA = {
    FOV: 75,
    NEAR: 0.1,
    FAR: 1000
};

export const LIGHTING = {
    AMBIENT_INTENSITY: 0.6,
    DIRECTIONAL_INTENSITY: 0.8,
    SHADOW_MAP_SIZE: 2048,
    SHADOW_CAMERA_SIZE: 50
};

export const LABEL = {
    BASE_DISTANCE: 10,
    MAX_SCALE: 1.5,
    FADE_START_DISTANCE: 30,
    FADE_END_DISTANCE: 50
};
