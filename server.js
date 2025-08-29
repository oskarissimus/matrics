const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static('.'));

// Game rooms
const rooms = new Map();

class Room {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = new Map();
        this.bullets = [];
        this.gameStarted = false;
    }

    addPlayer(id, playerData) {
        this.players.set(id, {
            id,
            name: playerData.name,
            position: { x: 0, y: 2, z: 0 },
            rotation: { x: 0, y: 0 },
            health: 100,
            alive: true
        });
    }

    removePlayer(id) {
        this.players.delete(id);
    }

    updatePlayer(id, data) {
        const player = this.players.get(id);
        if (player) {
            if (data.position) player.position = data.position;
            if (data.rotation) player.rotation = data.rotation;
            if (data.health !== undefined) player.health = data.health;
            if (data.alive !== undefined) player.alive = data.alive;
        }
    }

    getPlayersArray() {
        return Array.from(this.players.values());
    }
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    let currentRoom = null;
    let playerData = null;

    // Host a new game
    socket.on('hostGame', (data) => {
        const roomCode = generateRoomCode();
        const room = new Room(roomCode, socket.id);
        rooms.set(roomCode, room);
        
        currentRoom = roomCode;
        playerData = data;
        room.addPlayer(socket.id, data);
        
        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode, playerId: socket.id });
        
        console.log(`Room ${roomCode} created by ${socket.id}`);
    });

    // Join an existing game
    socket.on('joinGame', (data) => {
        const { roomCode, player } = data;
        const room = rooms.get(roomCode);
        
        if (room && !room.gameStarted) {
            currentRoom = roomCode;
            playerData = player;
            room.addPlayer(socket.id, player);
            
            socket.join(roomCode);
            socket.emit('joinedRoom', { 
                roomCode, 
                playerId: socket.id,
                players: room.getPlayersArray()
            });
            
            // Notify other players
            socket.to(roomCode).emit('playerJoined', {
                id: socket.id,
                name: player.name,
                position: { x: 0, y: 2, z: 0 },
                rotation: { x: 0, y: 0 },
                health: 100
            });
            
            console.log(`Player ${socket.id} joined room ${roomCode}`);
        } else {
            socket.emit('joinError', { message: 'Room not found or game already started' });
        }
    });

    // Start the game
    socket.on('startGame', () => {
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room && room.hostId === socket.id) {
                room.gameStarted = true;
                io.to(currentRoom).emit('gameStarted');
            }
        }
    });

    // Update player position and rotation
    socket.on('playerUpdate', (data) => {
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.updatePlayer(socket.id, data);
                
                // Broadcast to other players
                socket.to(currentRoom).emit('playerMoved', {
                    id: socket.id,
                    position: data.position,
                    rotation: data.rotation
                });
            }
        }
    });

    // Handle shooting
    socket.on('shoot', (bulletData) => {
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                const bullet = {
                    id: Date.now() + Math.random(),
                    ownerId: socket.id,
                    position: bulletData.position,
                    direction: bulletData.direction,
                    timestamp: Date.now()
                };
                
                room.bullets.push(bullet);
                
                // Broadcast to all players including sender
                io.to(currentRoom).emit('bulletFired', bullet);
                
                // Clean up old bullets after 5 seconds
                setTimeout(() => {
                    const index = room.bullets.findIndex(b => b.id === bullet.id);
                    if (index !== -1) {
                        room.bullets.splice(index, 1);
                    }
                }, 5000);
            }
        }
    });

    // Handle player hit
    socket.on('playerHit', (data) => {
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                const { playerId, damage } = data;
                const player = room.players.get(playerId);
                
                if (player) {
                    player.health = Math.max(0, player.health - damage);
                    
                    io.to(currentRoom).emit('playerDamaged', {
                        id: playerId,
                        health: player.health,
                        alive: player.health > 0
                    });
                    
                    if (player.health <= 0) {
                        // Handle player death
                        setTimeout(() => {
                            player.health = 100;
                            player.position = { 
                                x: (Math.random() - 0.5) * 20, 
                                y: 2, 
                                z: (Math.random() - 0.5) * 20 
                            };
                            
                            io.to(currentRoom).emit('playerRespawned', {
                                id: playerId,
                                position: player.position,
                                health: player.health
                            });
                        }, 3000);
                    }
                }
            }
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.removePlayer(socket.id);
                
                // Notify other players
                socket.to(currentRoom).emit('playerLeft', { id: socket.id });
                
                // If room is empty or host left, delete room
                if (room.players.size === 0 || room.hostId === socket.id) {
                    rooms.delete(currentRoom);
                    io.to(currentRoom).emit('roomClosed');
                    console.log(`Room ${currentRoom} closed`);
                }
            }
        }
    });

    // Chat messages
    socket.on('chatMessage', (message) => {
        if (currentRoom && playerData) {
            io.to(currentRoom).emit('chatMessage', {
                playerId: socket.id,
                playerName: playerData.name,
                message: message,
                timestamp: Date.now()
            });
        }
    });
});

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
