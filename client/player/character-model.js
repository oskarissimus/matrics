import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export function createBlockyCharacter(colorScheme, playerName) {
    const playerGroup = new THREE.Group();

    const headMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.primary,
        shininess: 80,
        specular: 0x444444
    });
    const torsoMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.primary,
        shininess: 20,
        specular: 0x111111
    });
    const armMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.secondary,
        shininess: 50,
        specular: 0x333333
    });
    const legMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.accent,
        shininess: 40,
        specular: 0x222222
    });

    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMesh = new THREE.Mesh(headGeo, headMaterial);
    headMesh.position.set(0, 1.45, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    playerGroup.add(headMesh);

    const faceMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        shininess: 100,
        specular: 0x333333
    });

    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
    const leftEyeMesh = new THREE.Mesh(eyeGeo, faceMaterial);
    leftEyeMesh.position.set(-0.1, 1.5, -0.26);
    leftEyeMesh.castShadow = true;
    leftEyeMesh.receiveShadow = true;
    playerGroup.add(leftEyeMesh);

    const rightEyeMesh = new THREE.Mesh(eyeGeo, faceMaterial);
    rightEyeMesh.position.set(0.1, 1.5, -0.26);
    rightEyeMesh.castShadow = true;
    rightEyeMesh.receiveShadow = true;
    playerGroup.add(rightEyeMesh);

    const mouthGeo = new THREE.BoxGeometry(0.15, 0.04, 0.02);
    const mouthMesh = new THREE.Mesh(mouthGeo, faceMaterial);
    mouthMesh.position.set(0, 1.38, -0.26);
    mouthMesh.castShadow = true;
    mouthMesh.receiveShadow = true;
    playerGroup.add(mouthMesh);

    const torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMaterial);
    torsoMesh.position.set(0, 0.9, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    playerGroup.add(torsoMesh);

    const armGeo = new THREE.BoxGeometry(0.25, 0.7, 0.25);
    const leftArmMesh = new THREE.Mesh(armGeo, armMaterial);
    leftArmMesh.position.set(-0.45, 0.95, 0);
    leftArmMesh.castShadow = true;
    leftArmMesh.receiveShadow = true;
    playerGroup.add(leftArmMesh);

    const rightArmMesh = new THREE.Mesh(armGeo, armMaterial);
    rightArmMesh.position.set(0.45, 0.95, 0);
    rightArmMesh.castShadow = true;
    rightArmMesh.receiveShadow = true;
    playerGroup.add(rightArmMesh);

    const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    const leftLegMesh = new THREE.Mesh(legGeo, legMaterial);
    leftLegMesh.position.set(-0.175, 0.375, 0);
    leftLegMesh.castShadow = true;
    leftLegMesh.receiveShadow = true;
    playerGroup.add(leftLegMesh);

    const rightLegMesh = new THREE.Mesh(legGeo, legMaterial);
    rightLegMesh.position.set(0.175, 0.375, 0);
    rightLegMesh.castShadow = true;
    rightLegMesh.receiveShadow = true;
    playerGroup.add(rightLegMesh);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'player-nametag';
    nameDiv.textContent = playerName;
    const nameLabel = new CSS2DObject(nameDiv);
    nameLabel.position.set(0, 2.4, 0);
    playerGroup.add(nameLabel);

    return playerGroup;
}

export function createDeadBody(colorScheme) {
    const bodyGroup = new THREE.Group();

    const headMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.primary,
        shininess: 80,
        specular: 0x444444
    });
    const torsoMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.primary,
        shininess: 20,
        specular: 0x111111
    });
    const armMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.secondary,
        shininess: 50,
        specular: 0x333333
    });
    const legMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.accent,
        shininess: 40,
        specular: 0x222222
    });

    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMesh = new THREE.Mesh(headGeo, headMaterial);
    headMesh.position.set(0, 0.25, -1.2);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    bodyGroup.add(headMesh);

    const torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMaterial);
    torsoMesh.position.set(0, 0.2, -0.5);
    torsoMesh.rotation.x = Math.PI / 2;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    const armGeo = new THREE.BoxGeometry(0.25, 0.7, 0.25);
    const leftArmMesh = new THREE.Mesh(armGeo, armMaterial);
    leftArmMesh.position.set(-0.45, 0.13, -0.5);
    leftArmMesh.rotation.x = Math.PI / 2;
    leftArmMesh.rotation.z = 0.3;
    leftArmMesh.castShadow = true;
    leftArmMesh.receiveShadow = true;
    bodyGroup.add(leftArmMesh);

    const rightArmMesh = new THREE.Mesh(armGeo, armMaterial);
    rightArmMesh.position.set(0.45, 0.13, -0.5);
    rightArmMesh.rotation.x = Math.PI / 2;
    rightArmMesh.rotation.z = -0.3;
    rightArmMesh.castShadow = true;
    rightArmMesh.receiveShadow = true;
    bodyGroup.add(rightArmMesh);

    const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    const leftLegMesh = new THREE.Mesh(legGeo, legMaterial);
    leftLegMesh.position.set(-0.175, 0.13, 0.3);
    leftLegMesh.rotation.x = Math.PI / 2;
    leftLegMesh.castShadow = true;
    leftLegMesh.receiveShadow = true;
    bodyGroup.add(leftLegMesh);

    const rightLegMesh = new THREE.Mesh(legGeo, legMaterial);
    rightLegMesh.position.set(0.175, 0.13, 0.3);
    rightLegMesh.rotation.x = Math.PI / 2;
    rightLegMesh.castShadow = true;
    rightLegMesh.receiveShadow = true;
    bodyGroup.add(rightLegMesh);

    return bodyGroup;
}
