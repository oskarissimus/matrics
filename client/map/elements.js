import * as THREE from 'three';
import { sceneState, entityState } from '../state.js';

export function createFloor(floorDef) {
    const floorGeometry = new THREE.PlaneGeometry(floorDef.size, floorDef.size);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: floorDef.color });
    sceneState.floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    sceneState.floorMesh.rotation.x = -Math.PI / 2;
    sceneState.floorMesh.receiveShadow = true;
    sceneState.scene.add(sceneState.floorMesh);

    sceneState.gridHelper = new THREE.GridHelper(floorDef.size, floorDef.gridDivisions, floorDef.gridColor1, floorDef.gridColor2);
    sceneState.scene.add(sceneState.gridHelper);
}

export function createMapElement(elementDef) {
    let geometry, mesh;

    if (elementDef.type === 'box') {
        geometry = new THREE.BoxGeometry(
            elementDef.geometry.width,
            elementDef.geometry.height,
            elementDef.geometry.depth
        );
    }

    const material = new THREE.MeshPhongMaterial({ color: elementDef.material.color });
    mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(elementDef.position.x, elementDef.position.y, elementDef.position.z);
    if (elementDef.rotation) {
        mesh.rotation.set(
            elementDef.rotation.x || 0,
            elementDef.rotation.y || 0,
            elementDef.rotation.z || 0
        );
    }

    mesh.castShadow = elementDef.castShadow !== false;
    mesh.receiveShadow = elementDef.receiveShadow !== false;

    sceneState.scene.add(mesh);
    entityState.mapElements.push(mesh);
    entityState.obstacleMeshes.push(mesh);

    if (elementDef.collision && !elementDef.noCollision) {
        entityState.collisionObstacles.push(elementDef.collision);
    }

    return mesh;
}
