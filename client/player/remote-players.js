import * as THREE from 'three';
import { sceneState, entityState, gameState } from '../state.js';
import { CHARACTER_Y_OFFSET, LABEL } from '../constants.js';
import { createBlockyCharacter } from './character-model.js';

const raycaster = new THREE.Raycaster();

export function addPlayer(playerData) {
    const textureStyle = playerData.textureStyle || 'fabric';
    const playerGroup = createBlockyCharacter(playerData.colorScheme, playerData.name, textureStyle);
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

export function recreatePlayer(playerId) {
    const playerEntry = entityState.players[playerId];
    if (!playerEntry) return;

    const oldMesh = playerEntry.mesh;
    const position = oldMesh.position.clone();
    const rotation = oldMesh.rotation.clone();

    sceneState.scene.remove(oldMesh);

    const textureStyle = playerEntry.data.textureStyle || 'fabric';
    const newMesh = createBlockyCharacter(playerEntry.data.colorScheme, playerEntry.data.name, textureStyle);
    newMesh.position.copy(position);
    newMesh.rotation.copy(rotation);
    sceneState.scene.add(newMesh);

    playerEntry.mesh = newMesh;
}

export function removePlayer(playerId) {
    if (entityState.players[playerId]) {
        sceneState.scene.remove(entityState.players[playerId].mesh);
        if (entityState.players[playerId].deadBody) {
            sceneState.scene.remove(entityState.players[playerId].deadBody);
        }
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

        if (hits.length > 0 || distance >= LABEL.FADE_END_DISTANCE) {
            nameLabel.element.style.display = 'none';
        } else {
            nameLabel.element.style.display = '';
            const scale = Math.min(LABEL.MAX_SCALE, LABEL.BASE_DISTANCE / distance);
            const baseFontSize = 14;
            nameLabel.element.style.fontSize = (baseFontSize * scale) + 'px';

            if (distance > LABEL.FADE_START_DISTANCE) {
                const fadeProgress = (distance - LABEL.FADE_START_DISTANCE) / (LABEL.FADE_END_DISTANCE - LABEL.FADE_START_DISTANCE);
                nameLabel.element.style.opacity = 1 - fadeProgress;
            } else {
                nameLabel.element.style.opacity = 1;
            }
        }
    }
}
