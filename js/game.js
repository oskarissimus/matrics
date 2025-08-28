class Game {
    constructor(playerName, serverUrl) {
        this.playerName = playerName;
        this.serverUrl = serverUrl;
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Game objects
        this.player = null;
        this.map = null;
        this.players = new Map();
        this.bullets = [];
        this.networking = null;
        
        // Game state
        this.isPaused = false;
        this.isPointerLocked = false;
        
        // Performance tracking
        this.lastTime = 0;
        this.frameCount = 0;
        this.fps = 0;
    }
    
    init() {
        this.initThreeJS();
        this.initLighting();
        this.initPlayer();
        this.initMap();
        this.initNetworking();
        this.setupEventListeners();
        
        console.log('Game initialized successfully');
    }
    
    initThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x404040, 50, 200);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add renderer to DOM
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    }
    
    initLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // Point lights for indoor areas
        const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 50);
        pointLight1.position.set(0, 10, 0);
        this.scene.add(pointLight1);
    }
    
    initPlayer() {
        this.player = new Player(this.playerName, this.camera, this.scene);
        this.player.position.set(0, 2, 0);
    }
    
    initMap() {
        this.map = new GameMap(this.scene);
        this.map.generate();
    }
    
    initNetworking() {
        if (this.serverUrl && this.serverUrl.startsWith('ws://')) {
            this.networking = new NetworkManager(this.serverUrl, this.playerName);
            this.networking.connect();
            
            // Set up networking callbacks
            this.networking.onPlayerJoin = (playerData) => {
                this.addRemotePlayer(playerData);
            };
            
            this.networking.onPlayerLeave = (playerId) => {
                this.removeRemotePlayer(playerId);
            };
            
            this.networking.onPlayerUpdate = (playerData) => {
                this.updateRemotePlayer(playerData);
            };
            
            this.networking.onBulletFired = (bulletData) => {
                this.addBullet(bulletData);
            };
        } else {
            // Local/offline mode
            document.getElementById('connectionStatus').textContent = 'Offline Mode';
        }
    }
    
    setupEventListeners() {
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
            if (this.player) {
                this.player.setPointerLocked(this.isPointerLocked);
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            if (this.player && this.isPointerLocked) {
                this.player.onKeyDown(event);
            }
            
            // ESC to exit pointer lock
            if (event.code === 'Escape') {
                document.exitPointerLock();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (this.player && this.isPointerLocked) {
                this.player.onKeyUp(event);
            }
        });
        
        // Mouse events
        document.addEventListener('mousemove', (event) => {
            if (this.player && this.isPointerLocked) {
                this.player.onMouseMove(event);
            }
        });
        
        document.addEventListener('mousedown', (event) => {
            if (this.player && this.isPointerLocked) {
                this.player.onMouseDown(event);
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (this.player && this.isPointerLocked) {
                this.player.onMouseUp(event);
            }
        });
    }
    
    update() {
        if (this.isPaused) return;
        
        const deltaTime = this.clock.getDelta();
        
        // Update player
        if (this.player) {
            this.player.update(deltaTime, this.map);
        }
        
        // Update bullets
        this.updateBullets(deltaTime);
        
        // Update remote players
        this.players.forEach(player => {
            player.update(deltaTime);
        });
        
        // Update networking
        if (this.networking) {
            this.networking.update();
            
            // Send player position to server
            if (this.player) {
                this.networking.sendPlayerUpdate(this.player.getNetworkData());
            }
        }
        
        // Update HUD
        this.updateHUD();
        
        // Calculate FPS
        this.calculateFPS();
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(deltaTime);
            
            // Check collision with map
            if (this.map.checkBulletCollision(bullet)) {
                this.removeBullet(i);
                continue;
            }
            
            // Check collision with players
            this.players.forEach(player => {
                if (bullet.checkPlayerCollision(player)) {
                    player.takeDamage(bullet.damage);
                    this.removeBullet(i);
                }
            });
            
            // Remove bullet if it's too far
            if (bullet.distanceTraveled > 200) {
                this.removeBullet(i);
            }
        }
    }
    
    updateHUD() {
        if (this.player) {
            // Update health bar
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            document.getElementById('healthFill').style.width = healthPercent + '%';
            
            // Update ammo counter
            const weapon = this.player.getCurrentWeapon();
            if (weapon) {
                document.getElementById('ammoCounter').textContent = 
                    `${weapon.currentAmmo} / ${weapon.totalAmmo}`;
            }
        }
        
        // Update player list
        let playerListHTML = '<strong>Players:</strong><br>';
        playerListHTML += `${this.playerName} (You)<br>`;
        this.players.forEach(player => {
            playerListHTML += `${player.name}<br>`;
        });
        document.getElementById('playerList').innerHTML = playerListHTML;
    }
    
    calculateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
    
    render() {
        if (this.isPaused) return;
        
        this.renderer.render(this.scene, this.camera);
    }
    
    addRemotePlayer(playerData) {
        const remotePlayer = new RemotePlayer(playerData.name, this.scene);
        remotePlayer.position.copy(playerData.position);
        this.players.set(playerData.id, remotePlayer);
    }
    
    removeRemotePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.dispose();
            this.players.delete(playerId);
        }
    }
    
    updateRemotePlayer(playerData) {
        const player = this.players.get(playerData.id);
        if (player) {
            player.updateFromNetwork(playerData);
        }
    }
    
    addBullet(bulletData) {
        const bullet = new Bullet(bulletData, this.scene);
        this.bullets.push(bullet);
        return bullet;
    }
    
    removeBullet(index) {
        const bullet = this.bullets[index];
        if (bullet) {
            bullet.dispose();
            this.bullets.splice(index, 1);
        }
    }
    
    requestPointerLock() {
        this.renderer.domElement.requestPointerLock();
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
        this.clock.start();
    }
    
    dispose() {
        // Clean up resources
        if (this.networking) {
            this.networking.disconnect();
        }
        
        this.bullets.forEach(bullet => bullet.dispose());
        this.players.forEach(player => player.dispose());
        
        if (this.player) {
            this.player.dispose();
        }
        
        if (this.map) {
            this.map.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}
