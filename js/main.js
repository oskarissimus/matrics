// Main game initialization and control
let game = null;
let isGameRunning = false;

function startGame() {
    const playerName = document.getElementById('playerName').value || 'Player';
    const serverUrl = document.getElementById('serverUrl').value;
    
    // Hide menu and show HUD
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    
    // Initialize the game
    game = new Game(playerName, serverUrl);
    window.game = game; // Make game globally accessible
    game.init();
    isGameRunning = true;
    
    // Start game loop
    gameLoop();
}

function createServer() {
    alert('Server hosting functionality would require a backend server. For now, use "Start Game" to play locally or connect to an existing server.');
}

function gameLoop() {
    if (!isGameRunning || !game) return;
    
    game.update();
    game.render();
    
    requestAnimationFrame(gameLoop);
}

// Handle window resize
window.addEventListener('resize', () => {
    if (game) {
        game.handleResize();
    }
});

// Handle visibility change (pause when tab is not active)
document.addEventListener('visibilitychange', () => {
    if (game) {
        if (document.hidden) {
            game.pause();
        } else {
            game.resume();
        }
    }
});

// Prevent context menu on right click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Handle pointer lock for FPS controls
document.addEventListener('click', () => {
    if (isGameRunning && game) {
        game.requestPointerLock();
    }
});
