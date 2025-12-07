import * as THREE from 'three';
import { sceneState, entityState, gameState, networkState } from '../state.js';
import { createBullet } from './bullets.js';
import { getCurrentWeapon, canFire, recordFire, triggerRecoil } from './weapon.js';

const raycaster = new THREE.Raycaster();
const shootDirection = new THREE.Vector3();

export function shoot() {
    if (gameState.isDead || gameState.consoleOpen) return;
    if (!canFire()) return;

    const weapon = getCurrentWeapon();
    recordFire();

    sceneState.camera.getWorldDirection(shootDirection);

    const bulletOrigin = new THREE.Vector3();
    sceneState.camera.getWorldPosition(bulletOrigin);
    createBullet(bulletOrigin, shootDirection, weapon.bulletColor, weapon.bulletSpeed);

    raycaster.set(sceneState.camera.position, shootDirection);

    const wallHits = raycaster.intersectObjects(entityState.obstacleMeshes, false);
    const wallDistance = wallHits.length > 0 ? wallHits[0].distance : Infinity;

    const playerHits = [];
    for (let playerId in entityState.players) {
        if (playerId !== gameState.myPlayerId && entityState.players[playerId].mesh) {
            const hits = raycaster.intersectObject(entityState.players[playerId].mesh, true);
            hits.forEach(hit => {
                playerHits.push({ hit, playerId });
            });
        }
    }

    if (playerHits.length > 0) {
        playerHits.sort((a, b) => a.hit.distance - b.hit.distance);
        const closest = playerHits[0];

        if (closest.hit.distance < wallDistance) {
            networkState.socket.emit('hit', {
                playerId: closest.playerId,
                damage: weapon.damage
            });
        }
    }

    networkState.socket.emit('shoot', {
        ray: {
            origin: sceneState.camera.position.toArray(),
            direction: shootDirection.toArray()
        }
    });

    triggerRecoil();
}
