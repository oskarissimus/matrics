import * as THREE from 'three';
import { sceneState, inputState, networkState, gameState } from '../state.js';
import { MOVE_SPEED } from '../constants.js';
import { checkCollision } from '../map/collision.js';

export function updateMovement() {
    if (gameState.isDead) {
        return;
    }
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();

    direction.x = Math.sin(inputState.yaw);
    direction.z = Math.cos(inputState.yaw);
    direction.normalize();

    right.x = Math.sin(inputState.yaw + Math.PI / 2);
    right.z = Math.cos(inputState.yaw + Math.PI / 2);
    right.normalize();

    let newX = sceneState.camera.position.x;
    let newZ = sceneState.camera.position.z;

    if (inputState.moveForward) {
        newX -= direction.x * MOVE_SPEED;
        newZ -= direction.z * MOVE_SPEED;
    }
    if (inputState.moveBackward) {
        newX += direction.x * MOVE_SPEED;
        newZ += direction.z * MOVE_SPEED;
    }
    if (inputState.moveLeft) {
        newX -= right.x * MOVE_SPEED;
        newZ -= right.z * MOVE_SPEED;
    }
    if (inputState.moveRight) {
        newX += right.x * MOVE_SPEED;
        newZ += right.z * MOVE_SPEED;
    }

    if (!checkCollision(newX, sceneState.camera.position.z)) {
        sceneState.camera.position.x = newX;
    }
    if (!checkCollision(sceneState.camera.position.x, newZ)) {
        sceneState.camera.position.z = newZ;
    }

    sceneState.camera.rotation.order = 'YXZ';
    sceneState.camera.rotation.y = inputState.yaw;
    sceneState.camera.rotation.x = inputState.pitch;

    if (networkState.socket && networkState.socket.connected) {
        networkState.socket.emit('move', {
            position: {
                x: sceneState.camera.position.x,
                y: sceneState.camera.position.y,
                z: sceneState.camera.position.z
            },
            rotation: {
                x: sceneState.camera.rotation.x,
                y: sceneState.camera.rotation.y,
                z: sceneState.camera.rotation.z
            }
        });
    }
}
