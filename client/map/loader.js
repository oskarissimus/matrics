import { sceneState, entityState, gameState } from '../state.js';
import { createFloor, createMapElement } from './elements.js';

export function loadMap(mapName) {
    const mapDef = MapDefinitions.maps[mapName];
    if (!mapDef) return false;

    clearMapElements();
    createFloor(mapDef.floor);

    mapDef.elements.forEach(element => {
        createMapElement(element);
    });

    gameState.currentMapName = mapName;
    return true;
}

export function clearMapElements() {
    entityState.mapElements.forEach(mesh => {
        sceneState.scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
    });
    entityState.mapElements = [];

    if (sceneState.floorMesh) {
        sceneState.scene.remove(sceneState.floorMesh);
        sceneState.floorMesh.geometry.dispose();
        sceneState.floorMesh.material.dispose();
        sceneState.floorMesh = null;
    }

    if (sceneState.gridHelper) {
        sceneState.scene.remove(sceneState.gridHelper);
        sceneState.gridHelper = null;
    }

    entityState.obstacleMeshes.length = 0;
    entityState.collisionObstacles.length = 0;
}
