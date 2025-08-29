// Game state
let scene, camera, renderer;
let player = {
    position: { x: 0, y: 2, z: 0 },
    rotation: { x: 0, y: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    health: 100,
    maxHealth: 100,
    name: 'Player',
    id: null,
    canJump: true
};

let weapon = null;
let players = {};
let bullets = [];
let socket = null;
let roomCode = null;
let isHost = false;
let gameStarted = false;

// Controls
let keys = {};
let mouseMovementX = 0;
let mouseMovementY = 0;
let isPointerLocked = false;

// Constants
const MOVE_SPEED = 0.1;
const JUMP_VELOCITY = 0.15;
const GRAVITY = -0.005;
const MOUSE_SENSITIVITY = 0.002;
const BULLET_SPEED = 1;
const BULLET_DAMAGE = 20;
const FIRE_RATE = 200; // milliseconds
let lastFireTime = 0;

// Initialize the game
function init() {
    setupMenuHandlers();
}

function setupMenuHandlers() {
    document.getElementById('host-game').addEventListener('click', hostGame);
    document.getElementById('join-game').addEventListener('click', showJoinSection);
    document.getElementById('connect').addEventListener('click', joinGame);
}

function hostGame() {
    const playerName = document.getElementById('player-name').value || 'Player';
    player.name = playerName;
    isHost = true;
    
    // Connect to server
    connectToServer(() => {
        socket.emit('hostGame', { name: player.name });
    });
}

function showJoinSection() {
    document.getElementById('join-section').classList.remove('hidden');
    document.querySelector('#menu > div:nth-child(3)').classList.add('hidden');
}

function joinGame() {
    const playerName = document.getElementById('player-name').value || 'Player';
    const code = document.getElementById('room-code').value;
    
    if (!code) {
        alert('Please enter a room code');
        return;
    }
    
    player.name = playerName;
    roomCode = code;
    
    // Connect to server
    connectToServer(() => {
        socket.emit('joinGame', { roomCode: code, player: { name: player.name } });
    });
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function startGame() {
    gameStarted = true;
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    
    setupThreeJS();
    setupControls();
    setupNetworking();
    animate();
}

function setupThreeJS() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 0);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('canvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Add grid for visual reference
    const gridHelper = new THREE.GridHelper(100, 50);
    scene.add(gridHelper);
    
    // Create some obstacles/walls
    createEnvironment();
    
    // Create weapon model
    createWeapon();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function createEnvironment() {
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const wallHeight = 5;
    
    // Create some walls
    const walls = [
        { x: 20, z: 0, width: 2, depth: 40 },
        { x: -20, z: 0, width: 2, depth: 40 },
        { x: 0, z: 20, width: 40, depth: 2 },
        { x: 0, z: -20, width: 40, depth: 2 },
        // Some interior walls
        { x: 0, z: 0, width: 10, depth: 2 },
        { x: 10, z: -10, width: 2, depth: 20 }
    ];
    
    walls.forEach(wall => {
        const geometry = new THREE.BoxGeometry(wall.width, wallHeight, wall.depth);
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.set(wall.x, wallHeight / 2, wall.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
    });
    
    // Add some boxes as cover
    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    for (let i = 0; i < 10; i++) {
        const size = Math.random() * 2 + 1;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const box = new THREE.Mesh(geometry, boxMaterial);
        box.position.set(
            (Math.random() - 0.5) * 30,
            size / 2,
            (Math.random() - 0.5) * 30
        );
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
    }
}

function createWeapon() {
    // Create a simple weapon model (rifle-like shape)
    const weaponGroup = new THREE.Group();
    
    // Main body of the weapon
    const bodyGeometry = new THREE.BoxGeometry(0.15, 0.15, 1.2);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2c2c2c });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.z = -0.3;
    weaponGroup.add(body);
    
    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8);
    const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.9;
    weaponGroup.add(barrel);
    
    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.3);
    const stock = new THREE.Mesh(stockGeometry, bodyMaterial);
    stock.position.z = 0.3;
    stock.position.y = -0.05;
    weaponGroup.add(stock);
    
    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.1);
    const mag = new THREE.Mesh(magGeometry, bodyMaterial);
    mag.position.y = -0.1;
    mag.position.z = -0.1;
    weaponGroup.add(mag);
    
    // Position weapon relative to camera
    weaponGroup.position.set(0.3, -0.2, -0.5);
    weaponGroup.rotation.y = 0;
    
    weapon = weaponGroup;
    camera.add(weapon);
}

function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        // Space for jump
        if (e.key === ' ' && player.canJump) {
            player.velocity.y = JUMP_VELOCITY;
            player.canJump = false;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    // Mouse controls
    document.addEventListener('click', () => {
        if (!isPointerLocked && gameStarted) {
            document.body.requestPointerLock();
        }
    });
    
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === document.body;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isPointerLocked) {
            mouseMovementX += e.movementX;
            mouseMovementY += e.movementY;
        }
    });
    
    // Shooting
    document.addEventListener('mousedown', (e) => {
        if (isPointerLocked && e.button === 0) {
            shoot();
        }
    });
}

function shoot() {
    const now = Date.now();
    if (now - lastFireTime < FIRE_RATE) return;
    
    lastFireTime = now;
    
    // Create bullet
    const bulletGeometry = new THREE.SphereGeometry(0.05);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    // Position bullet at weapon barrel
    bullet.position.copy(camera.position);
    bullet.position.y -= 0.1;
    
    // Set bullet direction based on camera rotation
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(camera.rotation);
    
    bullet.userData = {
        velocity: direction.multiplyScalar(BULLET_SPEED),
        owner: player.id,
        life: 100
    };
    
    scene.add(bullet);
    bullets.push(bullet);
    
    // Send bullet info to other players
    if (socket) {
        socket.emit('shoot', {
            position: bullet.position,
            direction: bullet.userData.velocity
        });
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.userData.life--;
        
        // Update position
        bullet.position.add(bullet.userData.velocity);
        
        // Check collision with self
        if (Math.abs(bullet.position.x - camera.position.x) < 0.5 &&
            Math.abs(bullet.position.y - camera.position.y) < 1 &&
            Math.abs(bullet.position.z - camera.position.z) < 0.5 &&
            bullet.userData.owner !== player.id) {
            
            // Hit player
            takeDamage(BULLET_DAMAGE);
            if (socket) {
                socket.emit('playerHit', { playerId: player.id, damage: BULLET_DAMAGE });
            }
            scene.remove(bullet);
            bullets.splice(i, 1);
            continue;
        }
        
        // Check collision with other players
        for (let playerId in players) {
            const otherPlayer = players[playerId];
            if (Math.abs(bullet.position.x - otherPlayer.mesh.position.x) < 0.5 &&
                Math.abs(bullet.position.y - otherPlayer.mesh.position.y) < 1 &&
                Math.abs(bullet.position.z - otherPlayer.mesh.position.z) < 0.5 &&
                bullet.userData.owner === player.id) {
                
                // Hit other player
                if (socket) {
                    socket.emit('playerHit', { playerId: playerId, damage: BULLET_DAMAGE });
                }
                scene.remove(bullet);
                bullets.splice(i, 1);
                break;
            }
        }
        
        // Remove old bullets
        if (bullet.userData.life <= 0 || bullet.position.y < -10) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

function takeDamage(amount) {
    player.health = Math.max(0, player.health - amount);
    updateHealthDisplay();
    
    if (player.health <= 0) {
        respawn();
    }
}

function updateHealthDisplay() {
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('health-fill').style.width = healthPercent + '%';
    document.getElementById('health-text').textContent = `HP: ${player.health}`;
}

function respawn() {
    player.health = player.maxHealth;
    player.position = { x: 0, y: 2, z: 0 };
    camera.position.set(0, 2, 0);
    updateHealthDisplay();
}

function connectToServer(callback) {
    // Connect to the server
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        if (callback) callback();
    });
    
    socket.on('roomCreated', (data) => {
        roomCode = data.roomCode;
        player.id = data.playerId;
        document.getElementById('display-room-code').textContent = roomCode;
        document.getElementById('join-section').classList.add('hidden');
        document.getElementById('room-info').classList.remove('hidden');
        document.querySelector('#menu > div:nth-child(3)').classList.add('hidden');
        
        // Add start button for host
        if (isHost) {
            const startBtn = document.createElement('button');
            startBtn.textContent = 'Start Game';
            startBtn.onclick = () => {
                socket.emit('startGame');
            };
            document.getElementById('room-info').appendChild(startBtn);
        }
    });
    
    socket.on('joinedRoom', (data) => {
        player.id = data.playerId;
        players = {};
        
        // Add existing players
        data.players.forEach(p => {
            if (p.id !== player.id) {
                addOtherPlayer(p);
            }
        });
        
        document.getElementById('menu').style.display = 'none';
        document.getElementById('room-info').classList.remove('hidden');
        document.getElementById('display-room-code').textContent = roomCode;
    });
    
    socket.on('joinError', (data) => {
        alert(data.message);
    });
    
    socket.on('gameStarted', () => {
        startGame();
    });
    
    socket.on('playerJoined', (playerData) => {
        addOtherPlayer(playerData);
    });
    
    socket.on('playerLeft', (data) => {
        removePlayer(data.id);
    });
    
    socket.on('playerMoved', (data) => {
        updateOtherPlayer(data.id, data.position, data.rotation);
    });
    
    socket.on('bulletFired', (bulletData) => {
        if (bulletData.ownerId !== player.id) {
            createRemoteBullet(bulletData);
        }
    });
    
    socket.on('playerDamaged', (data) => {
        if (data.id === player.id) {
            player.health = data.health;
            updateHealthDisplay();
            if (!data.alive) {
                // Handle death
                setTimeout(() => {
                    respawn();
                }, 3000);
            }
        } else {
            // Update other player's health
            const otherPlayer = players[data.id];
            if (otherPlayer) {
                otherPlayer.health = data.health;
            }
        }
    });
    
    socket.on('playerRespawned', (data) => {
        if (data.id === player.id) {
            player.health = data.health;
            player.position = data.position;
            camera.position.set(data.position.x, data.position.y, data.position.z);
            updateHealthDisplay();
        } else {
            const otherPlayer = players[data.id];
            if (otherPlayer) {
                otherPlayer.health = data.health;
                otherPlayer.mesh.position.set(data.position.x, data.position.y, data.position.z);
            }
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
    
    socket.on('roomClosed', () => {
        alert('Room closed');
        location.reload();
    });
}

function setupNetworking() {
    if (!socket) return;
    
    // Send position updates periodically
    setInterval(() => {
        if (socket && gameStarted) {
            socket.emit('playerUpdate', {
                position: player.position,
                rotation: player.rotation
            });
        }
    }, 50); // 20 updates per second
}

function addOtherPlayer(playerData) {
    // Create mesh for other player
    const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    const playerMesh = new THREE.Mesh(geometry, material);
    playerMesh.position.set(playerData.position.x, playerData.position.y, playerData.position.z);
    playerMesh.castShadow = true;
    scene.add(playerMesh);
    
    // Store player data
    players[playerData.id] = {
        mesh: playerMesh,
        name: playerData.name,
        health: playerData.health,
        position: playerData.position,
        rotation: playerData.rotation
    };
    
    updatePlayerCount();
}

function removePlayer(playerId) {
    const player = players[playerId];
    if (player) {
        scene.remove(player.mesh);
        delete players[playerId];
        updatePlayerCount();
    }
}

function updateOtherPlayer(playerId, position, rotation) {
    const otherPlayer = players[playerId];
    if (otherPlayer) {
        otherPlayer.position = position;
        otherPlayer.rotation = rotation;
        otherPlayer.mesh.position.set(position.x, position.y, position.z);
        otherPlayer.mesh.rotation.y = rotation.y;
    }
}

function updatePlayerCount() {
    const count = Object.keys(players).length + 1; // +1 for self
    document.getElementById('player-count').textContent = `Players: ${count}`;
}

function createRemoteBullet(bulletData) {
    const bulletGeometry = new THREE.SphereGeometry(0.05);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bullet.position.set(bulletData.position.x, bulletData.position.y, bulletData.position.z);
    
    bullet.userData = {
        velocity: new THREE.Vector3(bulletData.direction.x, bulletData.direction.y, bulletData.direction.z),
        owner: bulletData.ownerId,
        life: 100
    };
    
    scene.add(bullet);
    bullets.push(bullet);
}

function updatePlayer() {
    // Apply mouse rotation
    player.rotation.y -= mouseMovementX * MOUSE_SENSITIVITY;
    player.rotation.x -= mouseMovementY * MOUSE_SENSITIVITY;
    
    // Clamp vertical rotation
    player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.rotation.x));
    
    // Apply rotation to camera
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.rotation.y;
    camera.rotation.x = player.rotation.x;
    
    // Reset mouse movement
    mouseMovementX = 0;
    mouseMovementY = 0;
    
    // Calculate movement direction
    const moveVector = new THREE.Vector3();
    
    if (keys['w']) moveVector.z -= 1;
    if (keys['s']) moveVector.z += 1;
    if (keys['a']) moveVector.x -= 1;
    if (keys['d']) moveVector.x += 1;
    
    // Normalize and apply speed
    if (moveVector.length() > 0) {
        moveVector.normalize();
        moveVector.multiplyScalar(MOVE_SPEED);
        
        // Rotate movement vector by player Y rotation
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
    }
    
    // Update position
    player.velocity.x = moveVector.x;
    player.velocity.z = moveVector.z;
    
    // Apply gravity
    if (!player.canJump) {
        player.velocity.y += GRAVITY;
    }
    
    // Update position
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;
    player.position.z += player.velocity.z;
    
    // Ground collision
    if (player.position.y <= 2) {
        player.position.y = 2;
        player.velocity.y = 0;
        player.canJump = true;
    }
    
    // Apply position to camera
    camera.position.x = player.position.x;
    camera.position.y = player.position.y;
    camera.position.z = player.position.z;
    
    // Weapon sway
    if (weapon) {
        const swayAmount = 0.002;
        const bobAmount = 0.01;
        const time = Date.now() * 0.001;
        
        weapon.rotation.z = -mouseMovementX * swayAmount;
        weapon.rotation.x = mouseMovementY * swayAmount;
        
        if (moveVector.length() > 0) {
            weapon.position.y = -0.2 + Math.sin(time * 10) * bobAmount;
            weapon.position.x = 0.3 + Math.cos(time * 10) * bobAmount * 0.5;
        } else {
            weapon.position.y += (-0.2 - weapon.position.y) * 0.1;
            weapon.position.x += (0.3 - weapon.position.x) * 0.1;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (gameStarted) {
        updatePlayer();
        updateBullets();
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start the game
init();
