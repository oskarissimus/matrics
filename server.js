const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 3000;

app.use(express.static(__dirname));

const players = {};
let playerCount = 0;

const PLAYER_RADIUS = 0.5;
const collisionObstacles = [
    { x: 0, z: -50, halfW: 50, halfD: 1 },
    { x: 0, z: 50, halfW: 50, halfD: 1 },
    { x: 50, z: 0, halfW: 1, halfD: 50 },
    { x: -50, z: 0, halfW: 1, halfD: 50 },
    { x: 0, z: 0, halfW: 2.5, halfD: 2.5 },
    { x: 25, z: 25, halfW: 1.5, halfD: 1.5 },
    { x: -25, z: 25, halfW: 1.5, halfD: 1.5 },
    { x: 25, z: -25, halfW: 1.5, halfD: 1.5 },
    { x: -25, z: -25, halfW: 1.5, halfD: 1.5 },
    { x: 15, z: 0, halfW: 0.75, halfD: 10 },
    { x: 0, z: 15, halfW: 10, halfD: 0.75 }
];

function checkCollision(x, z) {
    for (const obs of collisionObstacles) {
        const dx = Math.abs(x - obs.x);
        const dz = Math.abs(z - obs.z);
        if (dx < obs.halfW + PLAYER_RADIUS && dz < obs.halfD + PLAYER_RADIUS) {
            return true;
        }
    }
    return false;
}

function getSpawnPosition() {
    let x, z;
    let attempts = 0;
    do {
        x = Math.random() * 80 - 40;
        z = Math.random() * 80 - 40;
        attempts++;
    } while (checkCollision(x, z) && attempts < 100);
    return { x, y: 1, z };
}

const COLOR_PALETTES = [
  { primary: 0xff3333, secondary: 0x3366ff, accent: 0xffcc00 },
  { primary: 0x00cc66, secondary: 0xff6600, accent: 0x9933ff },
  { primary: 0x3399ff, secondary: 0xff3399, accent: 0x66ff66 },
  { primary: 0xff9900, secondary: 0x00ccff, accent: 0xff3366 },
  { primary: 0xcc33ff, secondary: 0xffcc33, accent: 0x33ff99 },
  { primary: 0xff6633, secondary: 0x33ffcc, accent: 0x6633ff },
  { primary: 0x66ff33, secondary: 0xff3399, accent: 0x3366ff },
  { primary: 0xff3366, secondary: 0x66ff99, accent: 0xffaa00 },
  { primary: 0x33ccff, secondary: 0xff6633, accent: 0xcc33ff },
  { primary: 0xffcc00, secondary: 0x00ff99, accent: 0xff0066 }
];

function validatePlayerName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false };
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 20) {
        return { valid: false };
    }
    const validPattern = /^[a-zA-Z0-9 .,!?'-]+$/;
    if (!validPattern.test(trimmedName)) {
        return { valid: false };
    }
    return { valid: true, name: trimmedName };
}

function getScoreboard() {
    return Object.values(players).map(p => ({
        id: p.id,
        name: p.name,
        kills: p.kills,
        deaths: p.deaths
    })).sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
}

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    const clientName = socket.handshake.query.playerName;
    const validation = validatePlayerName(clientName);
    playerCount++;
    const playerName = validation.valid ? validation.name : `Player${playerCount}`;

    const newPlayer = {
        id: socket.id,
        name: playerName,
        position: getSpawnPosition(),
        rotation: { x: 0, y: 0, z: 0 },
        colorScheme: COLOR_PALETTES[playerCount % COLOR_PALETTES.length],
        hp: 100,
        isDead: false,
        kills: 0,
        deaths: 0
    };
    
    players[socket.id] = newPlayer;
    
    // Send current player data to the new player
    socket.emit('init', {
        id: socket.id,
        players: players,
        playerData: newPlayer
    });
    
    // Notify other players about the new player
    socket.broadcast.emit('playerJoined', newPlayer);
    
    // Handle player movement
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].position = data.position;
            players[socket.id].rotation = data.rotation;
            
            // Broadcast position to other players
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                position: data.position,
                rotation: data.rotation
            });
        }
    });
    
    // Handle shooting
    socket.on('shoot', (data) => {
        // Broadcast shot to all other players
        socket.broadcast.emit('playerShot', {
            shooterId: socket.id,
            ray: data.ray
        });
    });
    
    // Handle player hit
    socket.on('hit', (data) => {
        if (players[data.playerId] && !players[data.playerId].isDead) {
            players[data.playerId].hp -= data.damage;

            // Broadcast HP update to all players
            io.emit('hpUpdate', {
                playerId: data.playerId,
                hp: players[data.playerId].hp
            });

            // Check if player died
            if (players[data.playerId].hp <= 0) {
                players[data.playerId].isDead = true;
                players[data.playerId].deaths++;
                if (players[socket.id]) {
                    players[socket.id].kills++;
                }
                io.emit('playerDied', {
                    playerId: data.playerId,
                    killerId: socket.id
                });
                io.emit('scoreUpdate', getScoreboard());

                // Respawn player after 3 seconds
                setTimeout(() => {
                    if (players[data.playerId]) {
                        players[data.playerId].hp = 100;
                        players[data.playerId].isDead = false;
                        players[data.playerId].position = getSpawnPosition();
                        io.emit('playerRespawn', {
                            playerId: data.playerId,
                            position: players[data.playerId].position,
                            hp: 100
                        });
                    }
                }, 3000);
            }
        }
    });

    socket.on('requestScoreboard', () => {
        socket.emit('scoreUpdate', getScoreboard());
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        socket.broadcast.emit('playerLeft', socket.id);
    });
});

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

server.listen(PORT, () => {
    const localIP = getLocalIP();
    console.log(`Server running on:`);
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://${localIP}:${PORT}`);
});
