import * as THREE from 'three';
import { sceneState, entityState } from '../state.js';
import { getTexture } from '../core/texture-generator.js';

export function createFloor(floorDef) {
    const floorGeometry = new THREE.PlaneGeometry(floorDef.size, floorDef.size);

    const materialOptions = { color: floorDef.color };

    if (floorDef.textureType) {
        const repeatScale = floorDef.size / 10;
        const texture = getTexture(floorDef.textureType, repeatScale, repeatScale);
        if (texture) {
            materialOptions.map = texture;
        }
    }

    const floorMaterial = new THREE.MeshLambertMaterial(materialOptions);
    sceneState.floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    sceneState.floorMesh.rotation.x = -Math.PI / 2;
    sceneState.floorMesh.receiveShadow = true;
    sceneState.scene.add(sceneState.floorMesh);

    if (!floorDef.hideGrid) {
        sceneState.gridHelper = new THREE.GridHelper(floorDef.size, floorDef.gridDivisions, floorDef.gridColor1, floorDef.gridColor2);
        sceneState.scene.add(sceneState.gridHelper);
    }
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

    const materialOptions = { color: elementDef.material.color };

    if (elementDef.material.textureType) {
        let repeatX = 1, repeatY = 1;

        if (elementDef.type === 'box') {
            const maxDim = Math.max(elementDef.geometry.width, elementDef.geometry.depth);
            repeatX = maxDim / 8;
            repeatY = elementDef.geometry.height / 4;
        }

        const texture = getTexture(elementDef.material.textureType, repeatX, repeatY);
        if (texture) {
            materialOptions.map = texture;
        }
    }

    const material = new THREE.MeshPhongMaterial(materialOptions);
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
