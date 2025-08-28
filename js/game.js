class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused
        this.players = new Map();
        this.bullets = [];
        this.map = null;
        this.localPlayer = null;
        
        // Game settings
        this.roundTime = 120; // 2 minutes
        this.currentRound = 1;
        this.tScore = 0;
        this.ctScore = 0;
        this.timeLeft = this.roundTime;
        
        // Rendering
        this.camera = { x: 0, y: 0 };
        this.viewDistance = 800;
        
        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, locked: false };
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Chat toggle
            if (e.code === 'KeyT' && this.gameState === 'playing') {
                e.preventDefault();
                this.toggleChat();
            }
            
            // Menu navigation
            if (e.code === 'Escape') {
                if (this.gameState === 'playing') {
                    this.gameState = 'paused';
                    document.exitPointerLock();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse events
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing' && !this.mouse.locked) {
                this.canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === this.canvas;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.mouse.locked && this.localPlayer) {
                this.localPlayer.rotate(e.movementX, e.movementY);
            }
        });
        
        document.addEventListener('mousedown', (e) => {
            if (this.mouse.locked && this.localPlayer && e.button === 0) {
                this.localPlayer.shoot();
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        });
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update local player
        if (this.localPlayer) {
            this.localPlayer.update(this.keys);
            this.updateCamera();
        }
        
        // Update all players
        for (let player of this.players.values()) {
            player.update();
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return bullet.isAlive();
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Update timer
        this.updateTimer();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'playing') {
            this.renderGame();
        }
    }
    
    renderGame() {
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.translate(-this.camera.x + this.width / 2, -this.camera.y + this.height / 2);
        
        // Render map
        if (this.map) {
            this.map.render(this.ctx, this.camera);
        }
        
        // Render players
        for (let player of this.players.values()) {
            if (player !== this.localPlayer) {
                player.render(this.ctx, this.camera);
            }
        }
        
        // Render bullets
        this.bullets.forEach(bullet => {
            bullet.render(this.ctx, this.camera);
        });
        
        // Render local player (last, for proper depth)
        if (this.localPlayer) {
            this.localPlayer.render(this.ctx, this.camera);
        }
        
        this.ctx.restore();
        
        // Render minimap
        this.renderMinimap();
    }
    
    renderMinimap() {
        const minimapSize = 150;
        const minimapX = this.width - minimapSize - 20;
        const minimapY = 20;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // Render players on minimap
        if (this.map) {
            const scale = minimapSize / Math.max(this.map.width, this.map.height);
            
            for (let player of this.players.values()) {
                const x = minimapX + (player.x * scale);
                const y = minimapY + (player.y * scale);
                
                this.ctx.fillStyle = player.team === 'terrorist' ? '#ff0000' : '#0000ff';
                this.ctx.fillRect(x - 2, y - 2, 4, 4);
            }
        }
    }
    
    updateCamera() {
        if (this.localPlayer) {
            this.camera.x = this.localPlayer.x;
            this.camera.y = this.localPlayer.y;
        }
    }
    
    checkCollisions() {
        // Bullet-player collisions
        this.bullets.forEach((bullet, bulletIndex) => {
            for (let player of this.players.values()) {
                if (player.id !== bullet.playerId && this.isColliding(bullet, player)) {
                    player.takeDamage(bullet.damage);
                    this.bullets.splice(bulletIndex, 1);
                    break;
                }
            }
        });
        
        // Player-map collisions
        if (this.map) {
            for (let player of this.players.values()) {
                this.map.checkCollision(player);
            }
        }
    }
    
    isColliding(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius || 5) + (obj2.radius || 15);
    }
    
    updateTimer() {
        // This would be synced with server in real implementation
        this.timeLeft -= 1/60; // Assuming 60 FPS
        if (this.timeLeft <= 0) {
            this.endRound();
        }
        
        // Update UI
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = Math.floor(this.timeLeft % 60);
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    endRound() {
        // Determine winner and update scores
        // This is simplified - real CS has more complex win conditions
        this.currentRound++;
        this.timeLeft = this.roundTime;
        
        document.getElementById('round').textContent = this.currentRound;
    }
    
    toggleChat() {
        const chatInput = document.getElementById('chatInput');
        if (chatInput.style.display === 'none') {
            chatInput.style.display = 'block';
            chatInput.focus();
            document.exitPointerLock();
        } else {
            chatInput.style.display = 'none';
            this.canvas.requestPointerLock();
        }
    }
    
    addPlayer(playerData) {
        const player = new Player(playerData);
        this.players.set(playerData.id, player);
        return player;
    }
    
    removePlayer(playerId) {
        this.players.delete(playerId);
    }
    
    addBullet(bulletData) {
        this.bullets.push(new Bullet(bulletData));
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('menu').classList.add('hidden');
        this.canvas.requestPointerLock();
    }
    
    updateHUD() {
        if (this.localPlayer) {
            document.getElementById('health').textContent = this.localPlayer.health;
            document.getElementById('ammo').textContent = 
                `${this.localPlayer.weapon.ammo}/${this.localPlayer.weapon.reserveAmmo}`;
            document.getElementById('weapon').textContent = this.localPlayer.weapon.name;
        }
    }
}

// Bullet class
class Bullet {
    constructor(data) {
        this.x = data.x;
        this.y = data.y;
        this.vx = data.vx;
        this.vy = data.vy;
        this.damage = data.damage || 25;
        this.playerId = data.playerId;
        this.radius = 2;
        this.life = 120; // frames
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    render(ctx, camera) {
        // Only render if in view
        const dx = this.x - camera.x;
        const dy = this.y - camera.y;
        if (Math.abs(dx) > 1000 || Math.abs(dy) > 1000) return;
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    isAlive() {
        return this.life > 0;
    }
}
