#!/usr/bin/env node

/**
 * Simple WebSocket Game Server for Counter Strike 3D
 * 
 * To run this server:
 * 1. Install Node.js (https://nodejs.org/)
 * 2. Install dependencies: npm install ws
 * 3. Run the server: node server.js
 * 4. Players can connect to ws://localhost:8080
 */

const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 8080;
const HTTP_PORT = process.env.HTTP_PORT || 3000;

// Game state
const players = new Map();
const gameState = {
    mode: 'deathmatch',
    timeLeft: 300, // 5 minutes
    scores: new Map(),
    maxPlayers: 16
};

// Create HTTP server to serve the game files
const httpServer = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT });

console.log(`🎮 Counter Strike 3D Server Starting...`);
console.log(`📡 WebSocket Server: ws://localhost:${PORT}`);
console.log(`🌐 HTTP Server: http://localhost:${HTTP_PORT}`);
console.log(`👥 Max Players: ${gameState.maxPlayers}`);

// Start HTTP server
httpServer.listen(HTTP_PORT, () => {
    console.log(`✅ Game server ready! Open http://localhost:${HTTP_PORT} to play`);
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(`🔌 New connection from ${clientIP}`);
    
    let playerId = null;
    let playerData = null;

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(ws, message);
        } catch (error) {
            console.error('❌ Error parsing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    ws.on('close', () => {
        if (playerId) {
            console.log(`👋 Player ${playerData?.name || playerId} disconnected`);
            players.delete(playerId);
            
            // Notify other players
            broadcastToOthers(playerId, {
                type: 'playerLeft',
                playerId: playerId
            });
            
            updatePlayerCount();
        }
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
    });

    function handleMessage(ws, message) {
        switch (message.type) {
            case 'join':
                playerId = generatePlayerId();
                playerData = {
                    id: playerId,
                    name: message.playerName || `Player${playerId}`,
                    position: { x: 0, y: 2, z: 0 },
                    rotation: { pitch: 0, yaw: 0 },
                    health: 100,
                    weapon: 0,
                    score: 0,
                    ws: ws
                };
                
                players.set(playerId, playerData);
                console.log(`✅ Player ${playerData.name} joined (ID: ${playerId})`);
                
                // Send join confirmation
                ws.send(JSON.stringify({
                    type: 'joined',
                    playerId: playerId,
                    gameState: {
                        mode: gameState.mode,
                        timeLeft: gameState.timeLeft,
                        playerCount: players.size
                    }
                }));
                
                // Send existing players to new player
                players.forEach((player, id) => {
                    if (id !== playerId) {
                        ws.send(JSON.stringify({
                            type: 'playerJoined',
                            player: {
                                id: player.id,
                                name: player.name,
                                position: player.position,
                                rotation: player.rotation,
                                health: player.health,
                                weapon: player.weapon
                            }
                        }));
                    }
                });
                
                // Notify other players about new player
                broadcastToOthers(playerId, {
                    type: 'playerJoined',
                    player: {
                        id: playerData.id,
                        name: playerData.name,
                        position: playerData.position,
                        rotation: playerData.rotation,
                        health: playerData.health,
                        weapon: playerData.weapon
                    }
                });
                
                updatePlayerCount();
                break;

            case 'playerUpdate':
                if (playerId && players.has(playerId)) {
                    const player = players.get(playerId);
                    
                    // Update player data
                    player.position = message.player.position;
                    player.rotation = message.player.rotation;
                    player.health = message.player.health;
                    player.weapon = message.player.weapon;
                    
                    // Broadcast to other players
                    broadcastToOthers(playerId, {
                        type: 'playerUpdate',
                        playerId: playerId,
                        player: {
                            id: playerId,
                            name: player.name,
                            position: player.position,
                            rotation: player.rotation,
                            health: player.health,
                            weapon: player.weapon
                        }
                    });
                }
                break;

            case 'bulletFired':
                if (playerId && players.has(playerId)) {
                    // Broadcast bullet to all other players
                    broadcastToOthers(playerId, {
                        type: 'bulletFired',
                        bullet: {
                            ...message.bullet,
                            playerId: playerId
                        }
                    });
                }
                break;

            case 'playerHit':
                if (playerId && players.has(playerId)) {
                    const targetPlayer = players.get(message.targetPlayerId);
                    if (targetPlayer) {
                        targetPlayer.health = Math.max(0, targetPlayer.health - message.damage);
                        
                        // Notify target player
                        targetPlayer.ws.send(JSON.stringify({
                            type: 'playerHit',
                            damage: message.damage,
                            shooterId: playerId,
                            weaponType: message.weaponType
                        }));
                        
                        // Check if player died
                        if (targetPlayer.health <= 0) {
                            handlePlayerDeath(message.targetPlayerId, playerId);
                        }
                    }
                }
                break;

            case 'chat':
                if (playerId && players.has(playerId)) {
                    broadcastToAll({
                        type: 'chat',
                        playerId: playerId,
                        playerName: playerData.name,
                        message: message.message,
                        timestamp: Date.now()
                    });
                }
                break;

            case 'ping':
                ws.send(JSON.stringify({
                    type: 'pong',
                    timestamp: message.timestamp
                }));
                break;

            default:
                console.log(`❓ Unknown message type: ${message.type}`);
        }
    }

    function handlePlayerDeath(deadPlayerId, killerId) {
        const deadPlayer = players.get(deadPlayerId);
        const killer = players.get(killerId);
        
        if (deadPlayer && killer) {
            // Update scores
            killer.score += 1;
            gameState.scores.set(killerId, killer.score);
            
            console.log(`💀 ${deadPlayer.name} was killed by ${killer.name}`);
            
            // Broadcast death event
            broadcastToAll({
                type: 'playerDied',
                deadPlayerId: deadPlayerId,
                killerId: killerId,
                killerName: killer.name,
                deadPlayerName: deadPlayer.name
            });
            
            // Respawn player after delay
            setTimeout(() => {
                if (players.has(deadPlayerId)) {
                    const player = players.get(deadPlayerId);
                    player.health = 100;
                    player.position = getRandomSpawnPoint();
                    
                    player.ws.send(JSON.stringify({
                        type: 'respawn',
                        position: player.position
                    }));
                }
            }, 3000);
        }
    }

    function generatePlayerId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function getRandomSpawnPoint() {
        const spawnPoints = [
            { x: -40, y: 2, z: -40 },
            { x: 40, y: 2, z: -40 },
            { x: -40, y: 2, z: 40 },
            { x: 40, y: 2, z: 40 },
            { x: 0, y: 2, z: -45 },
            { x: 0, y: 2, z: 45 },
            { x: -45, y: 2, z: 0 },
            { x: 45, y: 2, z: 0 }
        ];
        
        return spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    }

    function broadcastToAll(message) {
        const messageStr = JSON.stringify(message);
        players.forEach((player) => {
            if (player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(messageStr);
            }
        });
    }

    function broadcastToOthers(excludePlayerId, message) {
        const messageStr = JSON.stringify(message);
        players.forEach((player, id) => {
            if (id !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(messageStr);
            }
        });
    }

    function updatePlayerCount() {
        console.log(`👥 Players online: ${players.size}/${gameState.maxPlayers}`);
    }
});

// Game loop for server-side game state updates
setInterval(() => {
    // Update game timer
    if (gameState.timeLeft > 0) {
        gameState.timeLeft--;
        
        // Broadcast game state every 30 seconds
        if (gameState.timeLeft % 30 === 0) {
            const message = JSON.stringify({
                type: 'gameState',
                state: {
                    mode: gameState.mode,
                    timeLeft: gameState.timeLeft,
                    playerCount: players.size,
                    scores: Array.from(gameState.scores.entries())
                }
            });
            
            players.forEach((player) => {
                if (player.ws.readyState === WebSocket.OPEN) {
                    player.ws.send(message);
                }
            });
        }
    }
}, 1000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    
    // Notify all players
    const shutdownMessage = JSON.stringify({
        type: 'serverShutdown',
        message: 'Server is shutting down'
    });
    
    players.forEach((player) => {
        if (player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(shutdownMessage);
            player.ws.close();
        }
    });
    
    wss.close(() => {
        httpServer.close(() => {
            console.log('✅ Server shut down gracefully');
            process.exit(0);
        });
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
