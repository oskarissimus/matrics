import { HP } from './constants.js';

export const gameState = {
    isConnected: false,
    isDead: false,
    gameStarted: false,
    consoleOpen: false,
    showScoreboard: false,
    currentMapName: 'default',
    myPlayerId: null,
    myPlayerData: null,
    currentHP: HP.MAX,
    pendingPlayerName: null
};

export const inputState = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    pitch: 0,
    yaw: 0
};

export const sceneState = {
    scene: null,
    camera: null,
    renderer: null,
    labelRenderer: null,
    weaponMesh: null,
    floorMesh: null,
    gridHelper: null,
    clock: null
};

export const entityState = {
    players: {},
    bullets: [],
    mapElements: [],
    obstacleMeshes: [],
    collisionObstacles: []
};

export const uiState = {
    scoreboardData: [],
    consoleHistory: [],
    consoleHistoryIndex: -1
};

export const networkState = {
    socket: null
};

export function resetGameState() {
    gameState.isDead = false;
    gameState.currentHP = HP.MAX;
}

export function clearEntityState() {
    entityState.mapElements = [];
    entityState.obstacleMeshes = [];
    entityState.collisionObstacles = [];
}
