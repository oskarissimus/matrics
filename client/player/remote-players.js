import * as THREE from 'three';
import { sceneState, entityState, gameState } from '../state.js';
import { CHARACTER_Y_OFFSET } from '../constants.js';
import { createBlockyCharacter } from './character-model.js';

const raycaster = new THREE.Raycaster();

export function addPlayer(playerData) {
    const playerGroup = createBlockyCharacter(playerData.colorScheme, playerData.name);
    playerGroup.position.set(
        playerData.position.x,
        playerData.position.y + CHARACTER_Y_OFFSET,
        playerData.position.z
    );
    sceneState.scene.add(playerGroup);

    entityState.players[playerData.id] = {
        mesh: playerGroup,
        data: playerData
    };
}

export function removePlayer(playerId) {
    if (entityState.players[playerId]) {
        sceneState.scene.remove(entityState.players[playerId].mesh);
        delete entityState.players[playerId];
    }
}

export function updateLabelVisibility() {
    const cameraPosition = new THREE.Vector3();
    sceneState.camera.getWorldPosition(cameraPosition);

    const labelPosition = new THREE.Vector3();
    const direction = new THREE.Vector3();

    for (let playerId in entityState.players) {
        if (playerId === gameState.myPlayerId || !entityState.players[playerId] || !entityState.players[playerId].mesh) {
            continue;
        }

        const playerMesh = entityState.players[playerId].mesh;
        if (!playerMesh.visible) {
            continue;
        }

        const nameLabel = playerMesh.children.find(child => child.isCSS2DObject);
        if (!nameLabel) {
            continue;
        }

        nameLabel.getWorldPosition(labelPosition);
        direction.subVectors(labelPosition, cameraPosition);
        const distance = direction.length();
        direction.normalize();

        raycaster.set(cameraPosition, direction);
        raycaster.far = distance - 0.1;

        const hits = raycaster.intersectObjects(entityState.obstacleMeshes, false);

        nameLabel.element.style.display = hits.length > 0 ? 'none' : '';
    }
}
