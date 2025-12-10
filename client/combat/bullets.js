import * as THREE from 'three';
import { sceneState, entityState } from '../state.js';
import { BULLET } from '../constants.js';

export function createBullet(origin, direction, color = BULLET.COLOR, speed = BULLET.SPEED) {
    const bulletGeometry = new THREE.CylinderGeometry(BULLET.RADIUS, BULLET.RADIUS, BULLET.LENGTH);
    const bulletMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 2.5,
        metalness: 0.3,
        roughness: 0.2,
        transparent: true,
        opacity: 1.0
    });
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

    bulletMesh.position.copy(origin);

    const lookAtPoint = new THREE.Vector3();
    lookAtPoint.addVectors(origin, direction);
    bulletMesh.lookAt(lookAtPoint);
    bulletMesh.rotateX(Math.PI / 2);

    sceneState.scene.add(bulletMesh);

    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(BULLET.TRAIL_LENGTH * 3);

    for (let i = 0; i < BULLET.TRAIL_LENGTH; i++) {
        trailPositions[i * 3] = origin.x;
        trailPositions[i * 3 + 1] = origin.y;
        trailPositions[i * 3 + 2] = origin.z;
    }
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
    });

    const trailLine = new THREE.Line(trailGeometry, trailMaterial);
    sceneState.scene.add(trailLine);

    const bullet = {
        mesh: bulletMesh,
        direction: direction.clone(),
        speed: speed,
        lifetime: BULLET.LIFETIME,
        age: 0,
        trail: trailLine,
        trailPositions: [origin.clone()],
        trailUpdateCounter: 0
    };

    entityState.bullets.push(bullet);
    return bullet;
}

export function removeBullet(bullet, index) {
    sceneState.scene.remove(bullet.mesh);
    sceneState.scene.remove(bullet.trail);
    bullet.mesh.geometry.dispose();
    bullet.mesh.material.dispose();
    bullet.trail.geometry.dispose();
    bullet.trail.material.dispose();
    entityState.bullets.splice(index, 1);
}

export function updateBullets(deltaTime) {
    const bulletRaycaster = new THREE.Raycaster();

    for (let i = entityState.bullets.length - 1; i >= 0; i--) {
        const bullet = entityState.bullets[i];
        bullet.age += deltaTime;

        if (bullet.age > bullet.lifetime) {
            removeBullet(bullet, i);
            continue;
        }

        const oldPosition = bullet.mesh.position.clone();
        const moveDistance = bullet.speed * deltaTime;
        bullet.mesh.position.addScaledVector(bullet.direction, moveDistance);

        bulletRaycaster.set(oldPosition, bullet.direction);
        bulletRaycaster.far = moveDistance;
        const hits = bulletRaycaster.intersectObjects(entityState.obstacleMeshes, false);
        if (hits.length > 0) {
            removeBullet(bullet, i);
            continue;
        }

        bullet.trailUpdateCounter++;
        if (bullet.trailUpdateCounter >= BULLET.TRAIL_UPDATE_INTERVAL) {
            bullet.trailPositions.unshift(bullet.mesh.position.clone());
            if (bullet.trailPositions.length > BULLET.TRAIL_LENGTH) {
                bullet.trailPositions.pop();
            }
            bullet.trailUpdateCounter = 0;

            const positions = bullet.trail.geometry.attributes.position.array;
            for (let j = 0; j < bullet.trailPositions.length; j++) {
                positions[j * 3] = bullet.trailPositions[j].x;
                positions[j * 3 + 1] = bullet.trailPositions[j].y;
                positions[j * 3 + 2] = bullet.trailPositions[j].z;
            }
            bullet.trail.geometry.attributes.position.needsUpdate = true;
        }

        const t = bullet.age / bullet.lifetime;
        let opacity;

        if (t < BULLET.FADE_START_PERCENT) {
            opacity = 1.0;
        } else {
            const fadeT = (t - BULLET.FADE_START_PERCENT) / (1.0 - BULLET.FADE_START_PERCENT);
            opacity = 1 - Math.pow(fadeT, 3);
        }

        bullet.mesh.material.opacity = opacity;
        bullet.trail.material.opacity = opacity * 0.6;
    }
}
