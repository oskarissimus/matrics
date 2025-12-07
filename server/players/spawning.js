const MapDefinitions = require('../../maps.js');
const serverState = require('../state.js');
const { PLAYER_RADIUS, EYE_HEIGHT, COLOR_PALETTES } = require('../constants.js');

function getCollisionObstacles() {
    const mapDef = MapDefinitions.maps[serverState.currentMap];
    return mapDef ? mapDef.collisionData : [];
}

function checkCollision(x, z) {
    const obstacles = getCollisionObstacles();
    for (const obs of obstacles) {
        const dx = Math.abs(x - obs.x);
        const dz = Math.abs(z - obs.z);
        if (dx < obs.halfW + PLAYER_RADIUS && dz < obs.halfD + PLAYER_RADIUS) {
            return true;
        }
    }
    return false;
}

function getSpawnPosition() {
    const mapDef = MapDefinitions.maps[serverState.currentMap];
    const spawnArea = mapDef ? mapDef.spawnArea : { minX: -40, maxX: 40, minZ: -40, maxZ: 40 };

    let x, z;
    let attempts = 0;
    do {
        x = Math.random() * (spawnArea.maxX - spawnArea.minX) + spawnArea.minX;
        z = Math.random() * (spawnArea.maxZ - spawnArea.minZ) + spawnArea.minZ;
        attempts++;
    } while (checkCollision(x, z) && attempts < 100);
    return { x, y: EYE_HEIGHT, z };
}

function getColorScheme() {
    return COLOR_PALETTES[serverState.playerCount % COLOR_PALETTES.length];
}

module.exports = {
    getSpawnPosition,
    getColorScheme,
    checkCollision
};
