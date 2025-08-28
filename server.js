const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Game state
const players = new Map();
let nextPlayerId = 1;

// WebSocket connection handler
wss.on('connection', (ws) => {
    const playerId = nextPlayerId++;
    console.log(`Player ${playerId} connected`);

    // Handle messages from client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, playerId, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        console.log(`Player ${playerId} disconnected`);
        
        // Remove player from game state
        players.delete(playerId);
        
        // Notify other players
        broadcast({
            type: 'playerLeft',
            id: playerId
        }, playerId);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`Player ${playerId} error:`, error);
    });
});

// Handle incoming messages
function handleMessage(ws, playerId, data) {
    switch (data.type) {
        case 'join':
            // Add player to game state
            const newPlayer = {
                id: playerId,
                name: data.name,
                position: data.position,
                rotation: { x: 0, y: 0 },
                ws: ws
            };
            players.set(playerId, newPlayer);

            // Send player their ID
            ws.send(JSON.stringify({
                type: 'welcome',
                id: playerId
            }));

            // Send existing players to new player
            players.forEach((player, id) => {
                if (id !== playerId) {
                    ws.send(JSON.stringify({
                        type: 'playerJoined',
                        id: id,
                        name: player.name,
                        position: player.position,
                        rotation: player.rotation
                    }));
                }
            });

            // Notify other players of new player
            broadcast({
                type: 'playerJoined',
                id: playerId,
                name: data.name,
                position: data.position,
                rotation: { x: 0, y: 0 }
            }, playerId);
            break;

        case 'move':
            // Update player position
            const player = players.get(playerId);
            if (player) {
                player.position = data.position;
                player.rotation = data.rotation;

                // Broadcast to other players
                broadcast({
                    type: 'playerMove',
                    id: playerId,
                    position: data.position,
                    rotation: data.rotation
                }, playerId);
            }
            break;

        case 'shoot':
            // Broadcast shoot event to other players
            broadcast({
                type: 'playerShoot',
                id: playerId,
                position: data.position,
                direction: data.direction
            }, playerId);
            break;
    }
}

// Broadcast message to all players except sender
function broadcast(message, excludeId) {
    const messageStr = JSON.stringify(message);
    players.forEach((player, id) => {
        if (id !== excludeId && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(messageStr);
        }
    });
}

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
