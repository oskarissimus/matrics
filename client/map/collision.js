import { entityState } from '../state.js';
import { PLAYER_RADIUS } from '../constants.js';

export function checkCollision(newX, newZ) {
    for (const obs of entityState.collisionObstacles) {
        const dx = Math.abs(newX - obs.x);
        const dz = Math.abs(newZ - obs.z);
        if (dx < obs.halfW + PLAYER_RADIUS && dz < obs.halfD + PLAYER_RADIUS) {
            return true;
        }
    }
    return false;
}
