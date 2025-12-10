import * as THREE from 'three';
import { sceneState, inputState, networkState, gameState } from '../state.js';
import { MOVE_SPEED, GRAVITY, EYE_HEIGHT } from '../constants.js';
import { checkCollision } from '../map/collision.js';

export function updateMovement(deltaTime) {
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
    const moveAmount = MOVE_SPEED * deltaTime;

    if (inputState.moveForward) {
        newX -= direction.x * moveAmount;
        newZ -= direction.z * moveAmount;
    }
    if (inputState.moveBackward) {
        newX += direction.x * moveAmount;
        newZ += direction.z * moveAmount;
    }
    if (inputState.moveLeft) {
        newX -= right.x * moveAmount;
        newZ -= right.z * moveAmount;
    }
    if (inputState.moveRight) {
        newX += right.x * moveAmount;
        newZ += right.z * moveAmount;
    }

    if (!checkCollision(newX, sceneState.camera.position.z)) {
        sceneState.camera.position.x = newX;
    }
    if (!checkCollision(sceneState.camera.position.x, newZ)) {
        sceneState.camera.position.z = newZ;
    }

    inputState.velocityY -= GRAVITY * deltaTime;
    sceneState.camera.position.y += inputState.velocityY * deltaTime;

    if (sceneState.camera.position.y <= EYE_HEIGHT) {
        sceneState.camera.position.y = EYE_HEIGHT;
        inputState.velocityY = 0;
        inputState.isGrounded = true;
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
