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
app.use(express.static(__dirname));

// Game rooms
const rooms = {};

// Generate room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);
    
    let currentRoom = null;
    let playerInfo = null;
    
    socket.on('joinGame', (data) => {
        const { name, room } = data;
        playerInfo = {
            id: socket.id,
            name: name,
            position: { x: Math.random() * 40 - 20, y: 1.6, z: Math.random() * 40 - 20 },
            rotation: { x: 0, y: 0 }
        };
        
        // Join or create room
        if (room && rooms[room]) {
            currentRoom = room;
        } else {
            currentRoom = room || generateRoomCode();
            if (!rooms[currentRoom]) {
                rooms[currentRoom] = {};
            }
        }
        
        // Join the room
        socket.join(currentRoom);
        rooms[currentRoom][socket.id] = playerInfo;
        
        socket.emit('roomJoined', currentRoom);
        io.to(currentRoom).emit('playerUpdate', rooms[currentRoom]);
        
        console.log(`Player ${name} joined room ${currentRoom}`);
    });
    
    socket.on('updatePosition', (data) => {
        if (currentRoom && rooms[currentRoom] && rooms[currentRoom][socket.id]) {
            rooms[currentRoom][socket.id].position = data.position;
            rooms[currentRoom][socket.id].rotation = data.rotation;
            
            // Broadcast to other players in the room
            socket.to(currentRoom).emit('playerUpdate', rooms[currentRoom]);
        }
    });
    
    socket.on('shoot', (data) => {
        if (currentRoom) {
            // Broadcast bullet to other players in the room
            socket.to(currentRoom).emit('bulletFired', data);
        }
    });
    
    socket.on('disconnect', () => {
        if (currentRoom && rooms[currentRoom]) {
            delete rooms[currentRoom][socket.id];
            
            // If room is empty, delete it
            if (Object.keys(rooms[currentRoom]).length === 0) {
                delete rooms[currentRoom];
            } else {
                // Notify other players
                io.to(currentRoom).emit('playerUpdate', rooms[currentRoom]);
            }
        }
        
        console.log('Player disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
