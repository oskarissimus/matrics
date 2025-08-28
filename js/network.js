class NetworkManager {
    constructor() {
        this.socket = null;
        this.isHost = false;
        this.connected = false;
        this.playerId = null;
        this.serverUrl = null;
        
        // Message handlers
        this.messageHandlers = {
            'player_joined': this.handlePlayerJoined.bind(this),
            'player_left': this.handlePlayerLeft.bind(this),
            'player_update': this.handlePlayerUpdate.bind(this),
            'player_shoot': this.handlePlayerShoot.bind(this),
            'game_state': this.handleGameState.bind(this),
            'chat_message': this.handleChatMessage.bind(this),
            'round_start': this.handleRoundStart.bind(this),
            'round_end': this.handleRoundEnd.bind(this),
            'bomb_plant': this.handleBombPlant.bind(this),
            'bomb_defuse': this.handleBombDefuse.bind(this)
        };
        
        // Connection state
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        
        // Message queue for when disconnected
        this.messageQueue = [];
        
        // Ping/latency tracking
        this.lastPingTime = 0;
        this.latency = 0;
        this.pingInterval = null;
    }
    
    // Host a new game
    hostGame() {
        this.isHost = true;
        this.playerId = this.generatePlayerId();
        
        // In a real implementation, this would start a WebSocket server
        // For this demo, we'll simulate hosting by connecting to a local server
        this.connectToServer('ws://localhost:8080');
        
        console.log('Hosting game as player:', this.playerId);
        return this.playerId;
    }
    
    // Join an existing game
    joinGame(serverUrl) {
        this.isHost = false;
        this.playerId = this.generatePlayerId();
        this.connectToServer(serverUrl);
        
        console.log('Joining game at:', serverUrl, 'as player:', this.playerId);
        return this.playerId;
    }
    
    connectToServer(url) {
        this.serverUrl = url;
        
        try {
            this.socket = new WebSocket(url);
            this.setupSocketHandlers();
        } catch (error) {
            console.error('Failed to connect to server:', error);
            this.handleConnectionError();
        }
    }
    
    setupSocketHandlers() {
        this.socket.onopen = () => {
            console.log('Connected to server');
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // Send initial player data
            this.sendMessage('player_join', {
                id: this.playerId,
                name: this.getPlayerName(),
                team: this.getPlayerTeam()
            });
            
            // Start ping monitoring
            this.startPingMonitoring();
            
            // Process queued messages
            this.processMessageQueue();
        };
        
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Failed to parse message:', error);
            }
        };
        
        this.socket.onclose = () => {
            console.log('Disconnected from server');
            this.connected = false;
            this.stopPingMonitoring();
            this.handleDisconnection();
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleConnectionError();
        };
    }
    
    handleMessage(message) {
        const handler = this.messageHandlers[message.type];
        if (handler) {
            handler(message.data);
        } else {
            console.warn('Unknown message type:', message.type);
        }
    }
    
    sendMessage(type, data) {
        const message = {
            type: type,
            data: data,
            timestamp: Date.now(),
            playerId: this.playerId
        };
        
        if (this.connected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            // Queue message for later
            this.messageQueue.push(message);
        }
    }
    
    // Message handlers
    handlePlayerJoined(data) {
        console.log('Player joined:', data.name);
        
        if (window.game) {
            const player = window.game.addPlayer(data);
            this.addChatMessage(`${data.name} joined the game`, 'system');
        }
    }
    
    handlePlayerLeft(data) {
        console.log('Player left:', data.id);
        
        if (window.game) {
            const player = window.game.players.get(data.id);
            if (player) {
                this.addChatMessage(`${player.name} left the game`, 'system');
                window.game.removePlayer(data.id);
            }
        }
    }
    
    handlePlayerUpdate(data) {
        if (window.game && data.id !== this.playerId) {
            const player = window.game.players.get(data.id);
            if (player) {
                player.setState(data);
            }
        }
    }
    
    handlePlayerShoot(data) {
        if (window.game && data.playerId !== this.playerId) {
            window.game.addBullet(data);
        }
    }
    
    handleGameState(data) {
        if (window.game) {
            window.game.currentRound = data.round;
            window.game.tScore = data.tScore;
            window.game.ctScore = data.ctScore;
            window.game.timeLeft = data.timeLeft;
            
            // Update UI
            document.getElementById('round').textContent = data.round;
            document.getElementById('tScore').textContent = data.tScore;
            document.getElementById('ctScore').textContent = data.ctScore;
        }
    }
    
    handleChatMessage(data) {
        this.addChatMessage(`${data.playerName}: ${data.message}`, 'chat');
    }
    
    handleRoundStart(data) {
        console.log('Round started:', data.round);
        this.addChatMessage(`Round ${data.round} started!`, 'system');
        
        if (window.game) {
            window.game.currentRound = data.round;
            window.game.timeLeft = data.roundTime;
        }
    }
    
    handleRoundEnd(data) {
        console.log('Round ended:', data);
        this.addChatMessage(`Round ended! Winner: ${data.winner}`, 'system');
        
        if (window.game) {
            window.game.tScore = data.tScore;
            window.game.ctScore = data.ctScore;
        }
    }
    
    handleBombPlant(data) {
        this.addChatMessage(`Bomb planted at site ${data.site}!`, 'system');
    }
    
    handleBombDefuse(data) {
        this.addChatMessage(`Bomb defused by ${data.playerName}!`, 'system');
    }
    
    // Outgoing message methods
    sendPlayerUpdate(playerState) {
        this.sendMessage('player_update', playerState);
    }
    
    sendShoot(bulletData) {
        this.sendMessage('player_shoot', bulletData);
    }
    
    sendChatMessage(message) {
        this.sendMessage('chat_message', {
            message: message,
            playerName: this.getPlayerName()
        });
    }
    
    sendBombPlant(site) {
        this.sendMessage('bomb_plant', {
            site: site,
            playerName: this.getPlayerName()
        });
    }
    
    sendBombDefuse() {
        this.sendMessage('bomb_defuse', {
            playerName: this.getPlayerName()
        });
    }
    
    // Connection management
    handleDisconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connectToServer(this.serverUrl);
            }, this.reconnectDelay);
        } else {
            console.log('Max reconnection attempts reached');
            this.addChatMessage('Connection lost. Please refresh to reconnect.', 'error');
        }
    }
    
    handleConnectionError() {
        this.addChatMessage('Failed to connect to server. Please check the server address.', 'error');
    }
    
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify(message));
            } else {
                // Put it back if connection is lost
                this.messageQueue.unshift(message);
                break;
            }
        }
    }
    
    // Ping monitoring
    startPingMonitoring() {
        this.pingInterval = setInterval(() => {
            if (this.connected) {
                this.lastPingTime = Date.now();
                this.sendMessage('ping', { timestamp: this.lastPingTime });
            }
        }, 5000); // Ping every 5 seconds
    }
    
    stopPingMonitoring() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    
    handlePong(timestamp) {
        this.latency = Date.now() - timestamp;
        console.log('Latency:', this.latency + 'ms');
    }
    
    // Utility methods
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }
    
    getPlayerName() {
        return localStorage.getItem('playerName') || 'Anonymous';
    }
    
    setPlayerName(name) {
        localStorage.setItem('playerName', name);
    }
    
    getPlayerTeam() {
        // In a real game, this would be assigned by the server
        return Math.random() < 0.5 ? 'terrorist' : 'counter-terrorist';
    }
    
    addChatMessage(message, type = 'chat') {
        const chatDiv = document.getElementById('chat');
        if (!chatDiv) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.style.marginBottom = '2px';
        
        switch (type) {
            case 'system':
                messageDiv.style.color = '#ffff00';
                messageDiv.textContent = `[SYSTEM] ${message}`;
                break;
            case 'error':
                messageDiv.style.color = '#ff0000';
                messageDiv.textContent = `[ERROR] ${message}`;
                break;
            default:
                messageDiv.style.color = '#ffffff';
                messageDiv.textContent = message;
        }
        
        chatDiv.appendChild(messageDiv);
        chatDiv.scrollTop = chatDiv.scrollHeight;
        
        // Remove old messages to prevent memory issues
        while (chatDiv.children.length > 50) {
            chatDiv.removeChild(chatDiv.firstChild);
        }
    }
    
    // Public API
    isConnected() {
        return this.connected && this.socket && this.socket.readyState === WebSocket.OPEN;
    }
    
    getLatency() {
        return this.latency;
    }
    
    getPlayerId() {
        return this.playerId;
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
        this.stopPingMonitoring();
        this.connected = false;
        this.isHost = false;
    }
}

// Simple WebSocket server simulation for local testing
class SimpleGameServer {
    constructor(port = 8080) {
        this.port = port;
        this.clients = new Map();
        this.gameState = {
            round: 1,
            tScore: 0,
            ctScore: 0,
            timeLeft: 120,
            players: new Map()
        };
        
        // This would be a real WebSocket server in production
        console.log('Game server would be running on port:', port);
    }
    
    // Simulate server message broadcasting
    broadcast(message, excludeClient = null) {
        for (let [clientId, client] of this.clients) {
            if (client !== excludeClient) {
                // In real implementation, send via WebSocket
                console.log('Broadcasting to client:', clientId, message);
            }
        }
    }
    
    handleClientMessage(clientId, message) {
        switch (message.type) {
            case 'player_join':
                this.handlePlayerJoin(clientId, message.data);
                break;
            case 'player_update':
                this.handlePlayerUpdate(clientId, message.data);
                break;
            case 'player_shoot':
                this.handlePlayerShoot(clientId, message.data);
                break;
            case 'chat_message':
                this.handleChatMessage(clientId, message.data);
                break;
        }
    }
    
    handlePlayerJoin(clientId, data) {
        this.gameState.players.set(data.id, data);
        this.broadcast({
            type: 'player_joined',
            data: data
        });
    }
    
    handlePlayerUpdate(clientId, data) {
        if (this.gameState.players.has(data.id)) {
            this.gameState.players.set(data.id, { ...this.gameState.players.get(data.id), ...data });
            this.broadcast({
                type: 'player_update',
                data: data
            }, clientId);
        }
    }
    
    handlePlayerShoot(clientId, data) {
        this.broadcast({
            type: 'player_shoot',
            data: data
        }, clientId);
    }
    
    handleChatMessage(clientId, data) {
        this.broadcast({
            type: 'chat_message',
            data: data
        });
    }
}
