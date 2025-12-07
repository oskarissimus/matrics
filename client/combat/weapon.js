import * as THREE from 'three';
import { sceneState } from '../state.js';
import { WEAPON } from '../constants.js';

export function createWeapon() {
    const weaponGroup = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(0, 0, -0.2);
    weaponGroup.add(bodyMesh);

    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
    const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0.02, -0.75);
    weaponGroup.add(barrelMesh);

    const handleGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
    const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3c28 });
    const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.position.set(0, -0.1, 0.1);
    weaponGroup.add(handleMesh);

    const scopeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15);
    const scopeMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const scopeMesh = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scopeMesh.rotation.x = Math.PI / 2;
    scopeMesh.position.set(0, 0.1, -0.3);
    weaponGroup.add(scopeMesh);

    weaponGroup.position.set(WEAPON.POSITION.x, WEAPON.POSITION.y, WEAPON.POSITION.z);
    weaponGroup.rotation.y = WEAPON.ROTATION_Y;

    sceneState.camera.add(weaponGroup);
    sceneState.weaponMesh = weaponGroup;
}

export function triggerRecoil() {
    if (sceneState.weaponMesh) {
        sceneState.weaponMesh.position.z += WEAPON.RECOIL_OFFSET;
        setTimeout(() => {
            sceneState.weaponMesh.position.z -= WEAPON.RECOIL_OFFSET;
        }, WEAPON.RECOIL_DURATION);
    }
}
