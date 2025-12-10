import * as THREE from 'three';
import { sceneState, entityState, gameState, networkState, weaponState, meleeState } from '../state.js';
import { getCurrentWeapon, canFire, recordFire } from './weapon.js';
import { WEAPONS } from '../constants.js';

const attackDirection = new THREE.Vector3();
const playerPosition = new THREE.Vector3();
const targetPosition = new THREE.Vector3();
const toTarget = new THREE.Vector3();

let slashAnimationId = null;

export function meleeAttack() {
    if (gameState.isDead || gameState.consoleOpen) return;
    if (!canFire()) return;

    const weapon = getCurrentWeapon();
    if (!weapon.isMelee) return;

    recordFire();
    startSlashAnimation();

    sceneState.camera.getWorldDirection(attackDirection);
    sceneState.camera.getWorldPosition(playerPosition);

    const hits = detectMeleeHits(
        playerPosition,
        attackDirection,
        weapon.range,
        weapon.attackAngle
    );

    if (hits.length > 0) {
        hits.sort((a, b) => a.distance - b.distance);
        const closestHit = hits[0];

        networkState.socket.emit('meleeHit', {
            targetId: closestHit.playerId,
            damage: weapon.damage
        });
    }

    networkState.socket.emit('meleeAttack', {
        weaponId: weapon.id
    });
}

function detectMeleeHits(origin, direction, range, angleThreshold) {
    const hits = [];

    for (const playerId in entityState.players) {
        if (playerId === gameState.myPlayerId) continue;

        const playerEntry = entityState.players[playerId];
        if (!playerEntry.mesh || !playerEntry.mesh.visible) continue;

        targetPosition.copy(playerEntry.mesh.position);
        targetPosition.y += 0.9;

        toTarget.subVectors(targetPosition, origin);
        const distance = toTarget.length();

        if (distance > range) continue;

        toTarget.normalize();
        const angle = Math.acos(Math.min(1, Math.max(-1, direction.dot(toTarget))));

        if (angle <= angleThreshold / 2) {
            const raycaster = new THREE.Raycaster(origin, toTarget.clone(), 0, distance);
            const wallHits = raycaster.intersectObjects(entityState.obstacleMeshes, false);

            if (wallHits.length === 0 || wallHits[0].distance > distance) {
                hits.push({
                    playerId: playerId,
                    distance: distance
                });
            }
        }
    }

    return hits;
}

function startSlashAnimation() {
    if (slashAnimationId) {
        cancelAnimationFrame(slashAnimationId);
    }

    const weapon = getCurrentWeapon();
    const mesh = weaponState.weapons[weaponState.currentWeaponId];

    if (!mesh) return;

    meleeState.isAttacking = true;
    const startTime = Date.now();
    const startRotationZ = mesh.rotation.z;
    const startPositionZ = weapon.position.z;
    const swingAngle = Math.PI / 2;

    function animateSlash() {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / weapon.attackDuration, 1);

        const eased = 1 - Math.pow(1 - t, 3);

        mesh.rotation.z = startRotationZ + (swingAngle * 0.15) - (swingAngle * eased);
        mesh.position.z = startPositionZ - (0.1 * Math.sin(t * Math.PI));

        if (t < 1) {
            slashAnimationId = requestAnimationFrame(animateSlash);
        } else {
            startRecoveryAnimation(mesh, weapon, startRotationZ, startPositionZ);
        }
    }

    animateSlash();
}

function startRecoveryAnimation(mesh, weapon, targetRotation, targetPositionZ) {
    const startTime = Date.now();
    const currentRotation = mesh.rotation.z;
    const recoveryDuration = 100;

    function animateRecovery() {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / recoveryDuration, 1);

        const eased = t * (2 - t);

        mesh.rotation.z = currentRotation + (targetRotation - currentRotation) * eased;
        mesh.position.z = targetPositionZ;

        if (t < 1) {
            slashAnimationId = requestAnimationFrame(animateRecovery);
        } else {
            mesh.rotation.z = targetRotation;
            meleeState.isAttacking = false;
            slashAnimationId = null;
        }
    }

    animateRecovery();
}

export function cancelMeleeAnimation() {
    if (slashAnimationId) {
        cancelAnimationFrame(slashAnimationId);
        slashAnimationId = null;
        meleeState.isAttacking = false;

        const weapon = getCurrentWeapon();
        const mesh = weaponState.weapons[weaponState.currentWeaponId];
        if (mesh && weapon) {
            mesh.rotation.z = 0;
            mesh.position.z = weapon.position.z;
        }
    }
}
