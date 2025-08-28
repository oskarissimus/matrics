// Global variables
let game = null;
let network = null;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Matrics game...');
    
    // Initialize network manager
    network = new NetworkManager();
    window.network = network;
    
    // Initialize game engine
    game = new Game();
    window.game = game;
    
    // Set up menu event listeners
    setupMenuHandlers();
    
    // Set up chat functionality
    setupChatHandlers();
    
    // Request player name if not set
    requestPlayerName();
    
    console.log('Game initialized successfully!');
});

function setupMenuHandlers() {
    const hostBtn = document.getElementById('hostBtn');
    const joinBtn = document.getElementById('joinBtn');
    const connectBtn = document.getElementById('connectBtn');
    const connectionInfo = document.getElementById('connectionInfo');
    
    hostBtn.addEventListener('click', () => {
        console.log('Host game clicked');
        hostGame();
    });
    
    joinBtn.addEventListener('click', () => {
        console.log('Join game clicked');
        connectionInfo.classList.remove('hidden');
    });
    
    connectBtn.addEventListener('click', () => {
        const serverInput = document.getElementById('serverInput');
        const serverUrl = serverInput.value.trim();
        
        if (serverUrl) {
            joinGame(serverUrl);
        } else {
            alert('Please enter a server address');
        }
    });
    
    // Allow Enter key to connect
    document.getElementById('serverInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            connectBtn.click();
        }
    });
}

function setupChatHandlers() {
    const chatInput = document.getElementById('chatInput');
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
            if (message) {
                sendChatMessage(message);
                chatInput.value = '';
            }
            chatInput.style.display = 'none';
            if (game.gameState === 'playing') {
                game.canvas.requestPointerLock();
            }
        } else if (e.key === 'Escape') {
            chatInput.style.display = 'none';
            if (game.gameState === 'playing') {
                game.canvas.requestPointerLock();
            }
        }
    });
}

function requestPlayerName() {
    let playerName = network.getPlayerName();
    
    if (playerName === 'Anonymous') {
        playerName = prompt('Enter your player name:', 'Player') || 'Anonymous';
        network.setPlayerName(playerName);
    }
    
    console.log('Player name set to:', playerName);
}

function hostGame() {
    console.log('Starting to host game...');
    
    // For demo purposes, we'll start a local game without network
    startLocalGame();
}

function joinGame(serverUrl) {
    console.log('Attempting to join game at:', serverUrl);
    
    // Try to connect to the server
    const playerId = network.joinGame(serverUrl);
    
    // For demo purposes, if connection fails, start local game
    setTimeout(() => {
        if (!network.isConnected()) {
            console.log('Failed to connect to server, starting local game instead');
            network.addChatMessage('Could not connect to server. Starting offline mode.', 'error');
            startLocalGame();
        }
    }, 3000);
}

function startLocalGame() {
    console.log('Starting local game...');
    
    // Create local player
    const playerId = network.generatePlayerId();
    const playerName = network.getPlayerName();
    const team = Math.random() < 0.5 ? 'terrorist' : 'counter-terrorist';
    
    // Create map
    game.map = new GameMap({});
    
    // Create local player
    const spawnPoint = game.map.getRandomSpawnPoint(team);
    const localPlayer = game.addPlayer({
        id: playerId,
        name: playerName,
        team: team,
        x: spawnPoint.x,
        y: spawnPoint.y,
        angle: 0
    });
    
    game.localPlayer = localPlayer;
    
    // Add some AI bots for testing
    addTestBots();
    
    // Start the game
    game.startGame();
    
    // Update HUD
    game.updateHUD();
    
    network.addChatMessage('Welcome to Matrics! Use WASD to move, mouse to look, click to shoot.', 'system');
    network.addChatMessage('Press T to chat, R to reload, 1-3 to switch weapons.', 'system');
}

function addTestBots() {
    // Add some AI bots for testing purposes
    const botCount = 3;
    
    for (let i = 0; i < botCount; i++) {
        const team = i % 2 === 0 ? 'terrorist' : 'counter-terrorist';
        const spawnPoint = game.map.getRandomSpawnPoint(team);
        
        const bot = game.addPlayer({
            id: `bot_${i}`,
            name: `Bot ${i + 1}`,
            team: team,
            x: spawnPoint.x + (Math.random() - 0.5) * 100,
            y: spawnPoint.y + (Math.random() - 0.5) * 100,
            angle: Math.random() * Math.PI * 2
        });
        
        // Simple AI behavior
        setInterval(() => {
            if (bot.isAlive && game.gameState === 'playing') {
                // Random movement
                const keys = {};
                if (Math.random() < 0.3) keys['KeyW'] = true;
                if (Math.random() < 0.2) keys['KeyA'] = true;
                if (Math.random() < 0.2) keys['KeyD'] = true;
                if (Math.random() < 0.1) keys['KeyS'] = true;
                
                bot.handleInput(keys);
                
                // Random rotation
                if (Math.random() < 0.1) {
                    bot.rotate((Math.random() - 0.5) * 0.2, 0);
                }
                
                // Random shooting
                if (Math.random() < 0.05 && game.localPlayer) {
                    const dx = game.localPlayer.x - bot.x;
                    const dy = game.localPlayer.y - bot.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Shoot if player is close and in line of sight
                    if (distance < 300 && game.map.hasLineOfSight(bot.x, bot.y, game.localPlayer.x, game.localPlayer.y)) {
                        bot.shoot();
                    }
                }
            }
        }, 100);
    }
}

function sendChatMessage(message) {
    if (network.isConnected()) {
        network.sendChatMessage(message);
    } else {
        // Local chat
        const playerName = network.getPlayerName();
        network.addChatMessage(`${playerName}: ${message}`, 'chat');
    }
}

// Game loop integration with network
function updateNetworking() {
    if (network.isConnected() && game.localPlayer) {
        // Send player state updates periodically
        const playerState = game.localPlayer.getState();
        network.sendPlayerUpdate(playerState);
    }
}

// Set up periodic network updates
setInterval(updateNetworking, 50); // 20 times per second

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause game when tab is not visible
        if (game && game.gameState === 'playing') {
            game.gameState = 'paused';
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (network) {
        network.disconnect();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Global shortcuts that work regardless of game state
    switch (e.code) {
        case 'F1':
            e.preventDefault();
            showHelp();
            break;
        case 'F11':
            e.preventDefault();
            toggleFullscreen();
            break;
    }
});

function showHelp() {
    const helpText = `
MATRICS - Counter-Strike Style Game

CONTROLS:
- WASD: Move
- Mouse: Look around
- Left Click: Shoot
- R: Reload
- T: Chat
- C: Crouch
- Shift: Run
- 1-3: Switch weapons
- Escape: Pause/Menu
- F1: Show this help
- F11: Toggle fullscreen

GAME MODES:
- Host Game: Start a local server
- Join Game: Connect to existing server

OBJECTIVE:
- Eliminate enemy team
- Plant/defuse bomb at designated sites
- Work with your team to win rounds
    `;
    
    alert(helpText);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Performance monitoring
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

function updatePerformanceStats() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastFrameTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastFrameTime));
        frameCount = 0;
        lastFrameTime = currentTime;
        
        // Update FPS display if element exists
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${fps}`;
        }
    }
}

// Add FPS counter to the game
setInterval(updatePerformanceStats, 16); // ~60 FPS

// Debug functions (available in console)
window.debugGame = {
    getGameState: () => game,
    getNetworkState: () => network,
    addBot: () => addTestBots(),
    setPlayerHealth: (health) => {
        if (game.localPlayer) {
            game.localPlayer.health = health;
            game.updateHUD();
        }
    },
    setPlayerAmmo: (ammo) => {
        if (game.localPlayer && game.localPlayer.weapon) {
            game.localPlayer.weapon.ammo = ammo;
            game.updateHUD();
        }
    },
    teleportPlayer: (x, y) => {
        if (game.localPlayer) {
            game.localPlayer.x = x;
            game.localPlayer.y = y;
        }
    },
    showPlayerInfo: () => {
        if (game.localPlayer) {
            console.log('Player Info:', {
                id: game.localPlayer.id,
                name: game.localPlayer.name,
                team: game.localPlayer.team,
                position: { x: game.localPlayer.x, y: game.localPlayer.y },
                health: game.localPlayer.health,
                weapon: game.localPlayer.weapon.name,
                ammo: game.localPlayer.weapon.ammo
            });
        }
    }
};

console.log('Debug functions available: window.debugGame');
console.log('Use window.debugGame.showPlayerInfo() to see player details');
