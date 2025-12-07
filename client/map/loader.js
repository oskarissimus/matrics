import { sceneState, entityState, gameState } from '../state.js';
import { createFloor, createMapElement } from './elements.js';
import { applyAtmosphere } from '../core/renderer.js';
import { clearTextureCache } from '../core/texture-generator.js';

export function loadMap(mapName) {
    const mapDef = MapDefinitions.maps[mapName];
    if (!mapDef) return false;

    clearMapElements();
    applyAtmosphere(mapDef.atmosphere);
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
        if (mesh.material) {
            if (mesh.material.map) mesh.material.map.dispose();
            mesh.material.dispose();
        }
    });
    entityState.mapElements = [];

    if (sceneState.floorMesh) {
        sceneState.scene.remove(sceneState.floorMesh);
        sceneState.floorMesh.geometry.dispose();
        if (sceneState.floorMesh.material.map) {
            sceneState.floorMesh.material.map.dispose();
        }
        sceneState.floorMesh.material.dispose();
        sceneState.floorMesh = null;
    }

    if (sceneState.gridHelper) {
        sceneState.scene.remove(sceneState.gridHelper);
        sceneState.gridHelper = null;
    }

    entityState.obstacleMeshes.length = 0;
    entityState.collisionObstacles.length = 0;

    clearTextureCache();
}
