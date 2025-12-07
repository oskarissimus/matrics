const serverState = require('../state.js');
const { DEFAULT_HP } = require('../constants.js');
const { validatePlayerName } = require('./validation.js');
const { getSpawnPosition, getColorScheme } = require('./spawning.js');

function createPlayer(socketId, clientName) {
    const validation = validatePlayerName(clientName);
    serverState.playerCount++;
    const playerName = validation.valid ? validation.name : `Player${serverState.playerCount}`;

    const newPlayer = {
        id: socketId,
        name: playerName,
        position: getSpawnPosition(),
        rotation: { x: 0, y: 0, z: 0 },
        colorScheme: getColorScheme(),
        hp: DEFAULT_HP,
        isDead: false,
        kills: 0,
        deaths: 0
    };

    serverState.players[socketId] = newPlayer;
    return newPlayer;
}

function getPlayer(socketId) {
    return serverState.players[socketId];
}

function updatePlayerPosition(socketId, position, rotation) {
    if (serverState.players[socketId]) {
        serverState.players[socketId].position = position;
        serverState.players[socketId].rotation = rotation;
    }
}

function updatePlayerName(socketId, newName) {
    const validation = validatePlayerName(newName);
    if (validation.valid && serverState.players[socketId]) {
        serverState.players[socketId].name = validation.name;
        return validation.name;
    }
    return null;
}

function removePlayer(socketId) {
    delete serverState.players[socketId];
}

function getScoreboard() {
    return Object.values(serverState.players).map(p => ({
        id: p.id,
        name: p.name,
        kills: p.kills,
        deaths: p.deaths
    })).sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
}

function getAllPlayers() {
    return serverState.players;
}

module.exports = {
    createPlayer,
    getPlayer,
    updatePlayerPosition,
    updatePlayerName,
    removePlayer,
    getScoreboard,
    getAllPlayers
};
