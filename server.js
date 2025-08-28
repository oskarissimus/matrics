const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static('public'));

// Game state
const players = {};
const bullets = [];

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);

    // Initialize new player
    players[socket.id] = {
        id: socket.id,
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        health: 100,
        score: 0,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    };

    // Send current players to new player
    socket.emit('currentPlayers', players);

    // Notify other players about new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Handle player movement
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].position = movementData.position;
            players[socket.id].rotation = movementData.rotation;
            
            // Broadcast updated position to other players
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                position: movementData.position,
                rotation: movementData.rotation
            });
        }
    });

    // Handle shooting
    socket.on('playerShoot', (shootData) => {
        const bullet = {
            id: Date.now() + Math.random(),
            playerId: socket.id,
            position: shootData.position,
            direction: shootData.direction,
            speed: 50,
            damage: 25
        };
        
        bullets.push(bullet);
        
        // Broadcast bullet to all players
        io.emit('bulletFired', bullet);
        
        // Remove bullet after 3 seconds
        setTimeout(() => {
            const index = bullets.findIndex(b => b.id === bullet.id);
            if (index !== -1) {
                bullets.splice(index, 1);
            }
        }, 3000);
    });

    // Handle player hit
    socket.on('playerHit', (data) => {
        if (players[data.playerId] && players[data.shooterId]) {
            players[data.playerId].health -= data.damage;
            
            if (players[data.playerId].health <= 0) {
                // Player died
                players[data.shooterId].score += 1;
                
                // Respawn player
                players[data.playerId].health = 100;
                players[data.playerId].position = {
                    x: (Math.random() - 0.5) * 20,
                    y: 1,
                    z: (Math.random() - 0.5) * 20
                };
                
                io.emit('playerDied', {
                    playerId: data.playerId,
                    killerId: data.shooterId,
                    newPosition: players[data.playerId].position
                });
            }
            
            io.emit('playerHealthUpdate', {
                playerId: data.playerId,
                health: players[data.playerId].health
            });
            
            io.emit('scoreUpdate', {
                playerId: data.shooterId,
                score: players[data.shooterId].score
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
