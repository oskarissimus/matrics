import * as THREE from 'three';
import { networkState, gameState, sceneState, entityState, uiState } from '../state.js';
import { HP, CHARACTER_Y_OFFSET } from '../constants.js';
import { loadMap } from '../map/loader.js';
import { addPlayer, removePlayer } from '../player/remote-players.js';
import { createBullet } from '../combat/bullets.js';
import { updateHPDisplay } from '../ui/hud.js';
import { updateScoreboardVisibility, renderScoreboard } from '../ui/scoreboard.js';
import { addConsoleOutput } from '../ui/console.js';

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
    socket.on('mapChange', handleMapChange);
    socket.on('consoleMessage', handleConsoleMessage);
    socket.on('playerRespawn', handlePlayerRespawn);
    socket.on('playerLeft', handlePlayerLeft);
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
        updateScoreboardVisibility();
    } else if (entityState.players[data.playerId]) {
        entityState.players[data.playerId].mesh.visible = false;
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
        gameState.isDead = false;
        updateScoreboardVisibility();
        sceneState.camera.position.set(
            data.position.x,
            data.position.y,
            data.position.z
        );
        gameState.currentHP = data.hp;
        updateHPDisplay();
    } else if (entityState.players[data.playerId]) {
        entityState.players[data.playerId].mesh.visible = true;
        entityState.players[data.playerId].mesh.position.set(
            data.position.x,
            data.position.y + CHARACTER_Y_OFFSET,
            data.position.z
        );
    }
}

function handlePlayerLeft(playerId) {
    removePlayer(playerId);
}
