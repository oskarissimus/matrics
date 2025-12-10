import { inputState } from '../state.js';
import { shoot } from '../combat/shooting.js';
import { meleeAttack } from '../combat/melee.js';
import { getCurrentWeapon } from '../combat/weapon.js';
import { MOUSE_SENSITIVITY } from '../constants.js';

export function onMouseMove(event) {
    inputState.yaw -= event.movementX * MOUSE_SENSITIVITY;
    inputState.pitch -= event.movementY * MOUSE_SENSITIVITY;
    inputState.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, inputState.pitch));
}

export function onMouseDown(event) {
    if (event.button === 0) {
        const weapon = getCurrentWeapon();
        if (weapon && weapon.isMelee) {
            meleeAttack();
        } else {
            shoot();
        }
    }
}
