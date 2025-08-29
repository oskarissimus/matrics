const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));

// Game state
const players = {};
let playerCount = 0;

// Handle socket connections
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Create new player
    playerCount++;
    const newPlayer = {
        id: socket.id,
        name: `Player${playerCount}`,
        position: { 
            x: Math.random() * 20 - 10, 
            y: 1, 
            z: Math.random() * 20 - 10 
        },
        rotation: { x: 0, y: 0, z: 0 },
        color: Math.floor(Math.random() * 0xffffff),
        hp: 100
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
        if (players[data.playerId]) {
            players[data.playerId].hp -= data.damage;
            
            // Broadcast HP update to all players
            io.emit('hpUpdate', {
                playerId: data.playerId,
                hp: players[data.playerId].hp
            });
            
            // Check if player died
            if (players[data.playerId].hp <= 0) {
                io.emit('playerDied', { playerId: data.playerId });
                
                // Respawn player after 3 seconds
                setTimeout(() => {
                    if (players[data.playerId]) {
                        players[data.playerId].hp = 100;
                        players[data.playerId].position = {
                            x: Math.random() * 20 - 10,
                            y: 1,
                            z: Math.random() * 20 - 10
                        };
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
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        socket.broadcast.emit('playerLeft', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
