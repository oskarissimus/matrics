import * as THREE from 'three';
import { networkState, gameState, sceneState, entityState, uiState, inputState } from '../state.js';
import { HP, CHARACTER_Y_OFFSET, EYE_HEIGHT } from '../constants.js';
import { loadMap } from '../map/loader.js';
import { addPlayer, removePlayer, recreatePlayer } from '../player/remote-players.js';
import { createBullet } from '../combat/bullets.js';
import { updateHPDisplay } from '../ui/hud.js';
import { updateScoreboardVisibility, renderScoreboard } from '../ui/scoreboard.js';
import { addConsoleOutput } from '../ui/console.js';
import { createDeadBody } from '../player/character-model.js';
import { handleNameChangeRejected } from '../ui/username.js';
import { hideAllWeapons, showCurrentWeapon } from '../combat/weapon.js';

export function setupSocketEvents() {
    const socket = networkState.socket;

    socket.on('init', handleInit);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerMoved', handlePlayerMoved);
    socket.on('playerShot', handlePlayerShot);
    socket.on('hpUpdate', handleHpUpdate);
    socket.on('playerDied', handlePlayerDied);
    socket.on('scoreUpdate', handleScoreUpdate);
    socket.on('playerNameChanged', handlePlayerNameChanged);
    socket.on('nameChangeRejected', handleNameChangeRejected);
    socket.on('mapChange', handleMapChange);
    socket.on('consoleMessage', handleConsoleMessage);
    socket.on('playerRespawn', handlePlayerRespawn);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('playerSkinChanged', handlePlayerSkinChanged);
}

function handleInit(data) {
    gameState.myPlayerId = data.id;
    gameState.myPlayerData = data.playerData;
    gameState.gameStarted = true;
    gameState.isConnected = true;

    document.getElementById('playerName').textContent = gameState.myPlayerData.name;

    if (data.currentMap && data.currentMap !== gameState.currentMapName) {
        loadMap(data.currentMap);
    }

    sceneState.camera.position.set(
        gameState.myPlayerData.position.x,
        gameState.myPlayerData.position.y,
        gameState.myPlayerData.position.z
    );

    for (let id in data.players) {
        if (id !== gameState.myPlayerId) {
            addPlayer(data.players[id]);
        }
    }
}

function handlePlayerJoined(playerData) {
    addPlayer(playerData);
}

function handlePlayerMoved(data) {
    if (entityState.players[data.id]) {
        entityState.players[data.id].mesh.position.set(
            data.position.x,
            data.position.y + CHARACTER_Y_OFFSET,
            data.position.z
        );
        entityState.players[data.id].mesh.rotation.y = data.rotation.y;
    }
}

function handlePlayerShot(data) {
    const origin = new THREE.Vector3().fromArray(data.ray.origin);
    const direction = new THREE.Vector3().fromArray(data.ray.direction);
    createBullet(origin, direction);
}

function handleHpUpdate(data) {
    if (data.playerId === gameState.myPlayerId) {
        gameState.currentHP = data.hp;
        updateHPDisplay();
    }
}

function handlePlayerDied(data) {
    if (data.playerId === gameState.myPlayerId) {
        gameState.isDead = true;

        const deathPosition = new THREE.Vector3(
            data.deathPosition.x,
            0.01,
            data.deathPosition.z
        );

        const victimTextureStyle = data.victimTextureStyle || gameState.playerTextureStyle;
        const deadBody = createDeadBody(data.victimColorScheme, victimTextureStyle);
        deadBody.position.copy(deathPosition);
        sceneState.scene.add(deadBody);

        let cameraTargetPosition = new THREE.Vector3();
        let lookAtPoint = deathPosition.clone();
        lookAtPoint.y = 0.5;

        if (data.killerPosition && entityState.players[data.killerId]) {
            const killerPos = new THREE.Vector3(
                data.killerPosition.x,
                EYE_HEIGHT,
                data.killerPosition.z
            );

            const midPoint = new THREE.Vector3().lerpVectors(deathPosition, killerPos, 0.3);
            const perpendicular = new THREE.Vector3()
                .subVectors(killerPos, deathPosition)
                .normalize();
            const offset = new THREE.Vector3(-perpendicular.z, 0, perpendicular.x).multiplyScalar(3);

            cameraTargetPosition.copy(midPoint).add(offset);
            cameraTargetPosition.y = 4;

            lookAtPoint.lerpVectors(deathPosition, killerPos, 0.4);
            lookAtPoint.y = 1;
        } else {
            cameraTargetPosition.set(
                deathPosition.x + 3,
                4,
                deathPosition.z + 3
            );
        }

        sceneState.camera.position.copy(cameraTargetPosition);
        sceneState.camera.lookAt(lookAtPoint);

        gameState.deathData = {
            deadBody: deadBody,
            killerId: data.killerId
        };

        hideAllWeapons();

        updateScoreboardVisibility();
    } else if (entityState.players[data.playerId]) {
        const playerEntry = entityState.players[data.playerId];
        playerEntry.mesh.visible = false;

        const textureStyle = playerEntry.data.textureStyle || 'fabric';
        const deadBody = createDeadBody(playerEntry.data.colorScheme, textureStyle);
        deadBody.position.set(
            data.deathPosition.x,
            0.01,
            data.deathPosition.z
        );
        sceneState.scene.add(deadBody);
        playerEntry.deadBody = deadBody;
    }
}

function handlePlayerSkinChanged(data) {
    if (data.playerId === gameState.myPlayerId) {
        gameState.playerTextureStyle = data.textureStyle;
    } else if (entityState.players[data.playerId]) {
        entityState.players[data.playerId].data.textureStyle = data.textureStyle;
        recreatePlayer(data.playerId);
    }
}

function handleScoreUpdate(data) {
    uiState.scoreboardData = data;
    if (gameState.showScoreboard || gameState.isDead) {
        renderScoreboard();
    }
}

function handlePlayerNameChanged(data) {
    if (data.id === gameState.myPlayerId) {
        gameState.myPlayerData.name = data.name;
        document.getElementById('playerName').textContent = data.name;
        document.getElementById('currentUsername').textContent = data.name;
    } else if (entityState.players[data.id]) {
        entityState.players[data.id].data.name = data.name;
        const nameTag = entityState.players[data.id].mesh.children.find(child => child.isCSS2DObject);
        if (nameTag) {
            nameTag.element.textContent = data.name;
        }
    }
}

function handleMapChange(data) {
    addConsoleOutput('Map changed to: ' + data.mapName);
    loadMap(data.mapName);
    sceneState.camera.position.set(data.position.x, data.position.y, data.position.z);
    gameState.currentHP = HP.MAX;
    gameState.isDead = false;
    updateHPDisplay();
    updateScoreboardVisibility();
}

function handleConsoleMessage(message) {
    addConsoleOutput(message);
}

function handlePlayerRespawn(data) {
    if (data.playerId === gameState.myPlayerId) {
        if (gameState.deathData && gameState.deathData.deadBody) {
            sceneState.scene.remove(gameState.deathData.deadBody);
            gameState.deathData = null;
        }

        gameState.isDead = false;
        updateScoreboardVisibility();
        sceneState.camera.position.set(
            data.position.x,
            data.position.y,
            data.position.z
        );
        sceneState.camera.rotation.set(0, 0, 0);
        gameState.currentHP = data.hp;
        updateHPDisplay();

        showCurrentWeapon();

        inputState.pitch = 0;
        inputState.yaw = 0;
    } else if (entityState.players[data.playerId]) {
        const playerEntry = entityState.players[data.playerId];

        if (playerEntry.deadBody) {
            sceneState.scene.remove(playerEntry.deadBody);
            playerEntry.deadBody = null;
        }

        playerEntry.mesh.visible = true;
        playerEntry.mesh.position.set(
            data.position.x,
            data.position.y + CHARACTER_Y_OFFSET,
            data.position.z
        );
    }
}

function handlePlayerLeft(playerId) {
    removePlayer(playerId);
}
