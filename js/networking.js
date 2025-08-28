class NetworkManager {
    constructor(serverUrl, playerName) {
        this.serverUrl = serverUrl;
        this.playerName = playerName;
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        
        // Message queue for when disconnected
        this.messageQueue = [];
        
        // Callbacks
        this.onPlayerJoin = null;
        this.onPlayerLeave = null;
        this.onPlayerUpdate = null;
        this.onBulletFired = null;
        this.onGameStateUpdate = null;
        this.onConnectionStatusChange = null;
        
        // Rate limiting
        this.lastUpdateSent = 0;
        this.updateInterval = 50; // Send updates every 50ms (20 FPS)
        
        // Interpolation buffer for smooth movement
        this.playerStates = new Map();
        this.interpolationDelay = 100; // 100ms delay for interpolation
    }
    
    connect() {
        try {
            this.socket = new WebSocket(this.serverUrl);
            this.setupEventHandlers();
            
            // Connection timeout
            setTimeout(() => {
                if (!this.isConnected) {
                    console.log('Connection timeout, switching to offline mode');
                    this.handleOfflineMode();
                }
            }, 5000);
            
        } catch (error) {
            console.error('Failed to connect to server:', error);
            this.handleOfflineMode();
        }
    }
    
    setupEventHandlers() {
        this.socket.onopen = () => {
            console.log('Connected to game server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Send join message
            this.sendMessage({
                type: 'join',
                playerName: this.playerName,
                timestamp: Date.now()
            });
            
            // Process queued messages
            this.processMessageQueue();
            
            this.updateConnectionStatus('Connected');
        };
        
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
        
        this.socket.onclose = (event) => {
            console.log('Disconnected from server:', event.code, event.reason);
            this.isConnected = false;
            this.updateConnectionStatus('Disconnected');
            
            // Attempt to reconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.attemptReconnect();
            } else {
                this.handleOfflineMode();
            }
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('Connection Error');
        };
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'joined':
                this.playerId = message.playerId;
                console.log(`Joined game with ID: ${this.playerId}`);
                break;
                
            case 'playerJoined':
                if (this.onPlayerJoin) {
                    this.onPlayerJoin(message.player);
                }
                break;
                
            case 'playerLeft':
                if (this.onPlayerLeave) {
                    this.onPlayerLeave(message.playerId);
                }
                break;
                
            case 'playerUpdate':
                this.handlePlayerUpdate(message);
                break;
                
            case 'bulletFired':
                if (this.onBulletFired) {
                    this.onBulletFired(message.bullet);
                }
                break;
                
            case 'gameState':
                if (this.onGameStateUpdate) {
                    this.onGameStateUpdate(message.state);
                }
                break;
                
            case 'playerHit':
                this.handlePlayerHit(message);
                break;
                
            case 'playerDied':
                this.handlePlayerDied(message);
                break;
                
            case 'gameMode':
                this.handleGameModeUpdate(message);
                break;
                
            case 'ping':
                this.sendMessage({ type: 'pong', timestamp: message.timestamp });
                break;
                
            case 'pong':
                this.handlePong(message);
                break;
                
            default:
                console.log('Unknown message type:', message.type);
        }
    }
    
    handlePlayerUpdate(message) {
        if (message.playerId === this.playerId) return; // Ignore own updates
        
        // Store player state with timestamp for interpolation
        if (!this.playerStates.has(message.playerId)) {
            this.playerStates.set(message.playerId, []);
        }
        
        const states = this.playerStates.get(message.playerId);
        states.push({
            ...message.player,
            timestamp: Date.now()
        });
        
        // Keep only recent states (last 500ms)
        const cutoff = Date.now() - 500;
        this.playerStates.set(message.playerId, 
            states.filter(state => state.timestamp > cutoff)
        );
        
        if (this.onPlayerUpdate) {
            this.onPlayerUpdate(message.player);
        }
    }
    
    handlePlayerHit(message) {
        console.log(`Player ${message.playerId} was hit for ${message.damage} damage`);
        // Handle hit feedback, blood effects, etc.
    }
    
    handlePlayerDied(message) {
        console.log(`Player ${message.playerId} died`);
        // Handle death effects, respawn timer, etc.
    }
    
    handleGameModeUpdate(message) {
        console.log('Game mode update:', message.mode);
        // Handle game mode changes (team deathmatch, bomb defusal, etc.)
    }
    
    handlePong(message) {
        const latency = Date.now() - message.timestamp;
        console.log(`Ping: ${latency}ms`);
        // Update latency display
    }
    
    sendMessage(message) {
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            // Queue message for later
            this.messageQueue.push(message);
        }
    }
    
    sendPlayerUpdate(playerData) {
        const now = Date.now();
        if (now - this.lastUpdateSent < this.updateInterval) {
            return; // Rate limiting
        }
        
        this.lastUpdateSent = now;
        
        this.sendMessage({
            type: 'playerUpdate',
            player: {
                id: this.playerId,
                name: playerData.name,
                position: {
                    x: playerData.position.x,
                    y: playerData.position.y,
                    z: playerData.position.z
                },
                rotation: {
                    pitch: playerData.rotation.pitch,
                    yaw: playerData.rotation.yaw
                },
                health: playerData.health,
                weapon: playerData.weapon
            },
            timestamp: now
        });
    }
    
    sendBulletFired(bulletData) {
        this.sendMessage({
            type: 'bulletFired',
            bullet: {
                position: {
                    x: bulletData.position.x,
                    y: bulletData.position.y,
                    z: bulletData.position.z
                },
                direction: {
                    x: bulletData.direction.x,
                    y: bulletData.direction.y,
                    z: bulletData.direction.z
                },
                damage: bulletData.damage,
                speed: bulletData.speed,
                playerId: this.playerId
            },
            timestamp: Date.now()
        });
    }
    
    sendPlayerHit(targetPlayerId, damage, weaponType) {
        this.sendMessage({
            type: 'playerHit',
            targetPlayerId: targetPlayerId,
            damage: damage,
            weaponType: weaponType,
            shooterId: this.playerId,
            timestamp: Date.now()
        });
    }
    
    sendChatMessage(message) {
        this.sendMessage({
            type: 'chat',
            message: message,
            playerId: this.playerId,
            playerName: this.playerName,
            timestamp: Date.now()
        });
    }
    
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.sendMessage(message);
        }
    }
    
    attemptReconnect() {
        this.reconnectAttempts++;
        this.updateConnectionStatus(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            console.log(`Reconnection attempt ${this.reconnectAttempts}`);
            this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
    }
    
    handleOfflineMode() {
        console.log('Switching to offline mode');
        this.isConnected = false;
        this.updateConnectionStatus('Offline Mode');
    }
    
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = status;
            
            // Color coding
            if (status.includes('Connected')) {
                statusElement.style.color = '#00ff00';
            } else if (status.includes('Reconnecting')) {
                statusElement.style.color = '#ffff00';
            } else {
                statusElement.style.color = '#ff0000';
            }
        }
        
        if (this.onConnectionStatusChange) {
            this.onConnectionStatusChange(status);
        }
    }
    
    // Get interpolated player position for smooth movement
    getInterpolatedPlayerState(playerId) {
        const states = this.playerStates.get(playerId);
        if (!states || states.length === 0) return null;
        
        const now = Date.now() - this.interpolationDelay;
        
        // Find the two states to interpolate between
        let before = null;
        let after = null;
        
        for (let i = 0; i < states.length - 1; i++) {
            if (states[i].timestamp <= now && states[i + 1].timestamp >= now) {
                before = states[i];
                after = states[i + 1];
                break;
            }
        }
        
        if (!before || !after) {
            return states[states.length - 1]; // Return latest state
        }
        
        // Interpolate between the two states
        const timeDiff = after.timestamp - before.timestamp;
        const factor = (now - before.timestamp) / timeDiff;
        
        return {
            name: after.name,
            position: {
                x: this.lerp(before.position.x, after.position.x, factor),
                y: this.lerp(before.position.y, after.position.y, factor),
                z: this.lerp(before.position.z, after.position.z, factor)
            },
            rotation: {
                pitch: this.lerpAngle(before.rotation.pitch, after.rotation.pitch, factor),
                yaw: this.lerpAngle(before.rotation.yaw, after.rotation.yaw, factor)
            },
            health: after.health,
            weapon: after.weapon
        };
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    lerpAngle(a, b, t) {
        // Handle angle wrapping
        let diff = b - a;
        if (diff > Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        return a + diff * t;
    }
    
    update() {
        // Clean up old player states
        const cutoff = Date.now() - 1000; // Keep states for 1 second
        this.playerStates.forEach((states, playerId) => {
            const filtered = states.filter(state => state.timestamp > cutoff);
            if (filtered.length === 0) {
                this.playerStates.delete(playerId);
            } else {
                this.playerStates.set(playerId, filtered);
            }
        });
        
        // Send periodic ping
        if (this.isConnected && Date.now() % 5000 < 50) { // Every 5 seconds
            this.sendMessage({ type: 'ping', timestamp: Date.now() });
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
        this.playerId = null;
        this.playerStates.clear();
        this.messageQueue = [];
    }
    
    // Utility methods for game integration
    isPlayerConnected(playerId) {
        return this.playerStates.has(playerId);
    }
    
    getConnectedPlayers() {
        return Array.from(this.playerStates.keys());
    }
    
    getPlayerCount() {
        return this.playerStates.size + (this.isConnected ? 1 : 0); // +1 for local player
    }
}

// Simple WebSocket server implementation for local testing
class SimpleGameServer {
    constructor(port = 8080) {
        this.port = port;
        this.players = new Map();
        this.gameState = {
            mode: 'deathmatch',
            timeLeft: 300, // 5 minutes
            scores: new Map()
        };
        
        console.log('Note: This is a client-side mock server for demonstration.');
        console.log('For real multiplayer, you would need a proper Node.js WebSocket server.');
    }
    
    // Mock server methods for demonstration
    start() {
        console.log(`Mock server would start on port ${this.port}`);
        console.log('In a real implementation, you would use Node.js with ws library:');
        console.log(`
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: ${this.port} });

server.on('connection', (ws) => {
    console.log('Player connected');
    
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        // Handle different message types
        // Broadcast to other players
    });
    
    ws.on('close', () => {
        console.log('Player disconnected');
        // Remove player from game
    });
});
        `);
    }
    
    // Example server message handlers
    handlePlayerJoin(playerId, playerData) {
        this.players.set(playerId, playerData);
        this.broadcastToAll({
            type: 'playerJoined',
            player: playerData
        });
    }
    
    handlePlayerUpdate(playerId, playerData) {
        if (this.players.has(playerId)) {
            this.players.set(playerId, { ...this.players.get(playerId), ...playerData });
            this.broadcastToOthers(playerId, {
                type: 'playerUpdate',
                playerId: playerId,
                player: playerData
            });
        }
    }
    
    handleBulletFired(playerId, bulletData) {
        this.broadcastToOthers(playerId, {
            type: 'bulletFired',
            bullet: bulletData
        });
    }
    
    broadcastToAll(message) {
        // In real implementation, send to all connected WebSocket clients
        console.log('Broadcasting to all players:', message);
    }
    
    broadcastToOthers(excludePlayerId, message) {
        // In real implementation, send to all except the specified player
        console.log(`Broadcasting to others (excluding ${excludePlayerId}):`, message);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NetworkManager, SimpleGameServer };
}
