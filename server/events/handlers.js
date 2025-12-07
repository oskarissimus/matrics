const MapDefinitions = require('../../maps.js');
const serverState = require('../state.js');
const { DEFAULT_HP } = require('../constants.js');
const {
    createPlayer,
    getPlayer,
    updatePlayerPosition,
    updatePlayerName,
    removePlayer,
    getScoreboard,
    getAllPlayers
} = require('../players/manager.js');
const { getSpawnPosition } = require('../players/spawning.js');
const { handleHit } = require('../combat/handler.js');

function setupSocketHandlers(io, socket) {
    const clientName = socket.handshake.query.playerName;
    const newPlayer = createPlayer(socket.id, clientName);

    console.log('Player connected:', socket.id);

    socket.emit('init', {
        id: socket.id,
        players: getAllPlayers(),
        playerData: newPlayer,
        currentMap: serverState.currentMap
    });

    socket.broadcast.emit('playerJoined', newPlayer);

    socket.on('move', (data) => {
        updatePlayerPosition(socket.id, data.position, data.rotation);
        socket.broadcast.emit('playerMoved', {
            id: socket.id,
            position: data.position,
            rotation: data.rotation
        });
    });

    socket.on('shoot', (data) => {
        socket.broadcast.emit('playerShot', {
            shooterId: socket.id,
            ray: data.ray
        });
    });

    socket.on('hit', (data) => {
        handleHit(io, socket.id, data.playerId, data.damage);
    });

    socket.on('requestScoreboard', () => {
        socket.emit('scoreUpdate', getScoreboard());
    });

    socket.on('changeName', (newName) => {
        const result = updatePlayerName(socket.id, newName);
        if (result.success) {
            io.emit('playerNameChanged', { id: socket.id, name: result.name });
        } else {
            socket.emit('nameChangeRejected', { reason: result.reason });
        }
    });

    socket.on('changeSkin', (textureStyle) => {
        const validStyles = ['fabric', 'camo', 'tech', 'organic'];
        if (!validStyles.includes(textureStyle)) {
            socket.emit('consoleMessage', `Unknown skin: ${textureStyle}`);
            return;
        }

        const player = getPlayer(socket.id);
        if (player) {
            player.textureStyle = textureStyle;
            io.emit('playerSkinChanged', {
                playerId: socket.id,
                textureStyle: textureStyle
            });
        }
    });

    socket.on('changeMap', (mapName) => {
        if (!MapDefinitions.maps[mapName]) {
            socket.emit('consoleMessage', `Unknown map: ${mapName}`);
            return;
        }

        serverState.currentMap = mapName;
        const player = getPlayer(socket.id);
        console.log(`Map changed to: ${mapName} by ${player?.name || socket.id}`);

        for (let playerId in serverState.players) {
            serverState.players[playerId].position = getSpawnPosition();
            serverState.players[playerId].hp = DEFAULT_HP;
            serverState.players[playerId].isDead = false;
        }

        for (let playerId in serverState.players) {
            io.to(playerId).emit('mapChange', {
                mapName: mapName,
                position: serverState.players[playerId].position
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        removePlayer(socket.id);
        socket.broadcast.emit('playerLeft', socket.id);
    });
}

module.exports = { setupSocketHandlers };
