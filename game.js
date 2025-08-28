// Game state
let scene, camera, renderer;
let player = {
    position: { x: 0, y: 2, z: 0 },
    rotation: { x: 0, y: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    health: 100,
    ammo: 30,
    maxAmmo: 30,
    name: 'Player',
    id: null
};
let players = new Map();
let weapon;
let floor;
let walls = [];
let socket;
let isConnected = false;
let keys = {};
let mouseMovement = { x: 0, y: 0 };
let isPointerLocked = false;
let clock;
let bullets = [];

// Constants
const MOVE_SPEED = 10;
const JUMP_FORCE = 8;
const GRAVITY = -20;
const MOUSE_SENSITIVITY = 0.002;
const PLAYER_HEIGHT = 2;
const PLAYER_RADIUS = 0.5;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 10, 100);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, PLAYER_HEIGHT, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create floor
    const floorGeometry = new THREE.BoxGeometry(100, 1, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create walls for the map
    createMap();

    // Create weapon model
    createWeapon();

    // Add camera to scene (needed for weapon to be visible)
    scene.add(camera);

    // Initialize clock
    clock = new THREE.Clock();

    // Set up event listeners
    setupEventListeners();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start game loop
    animate();
}

// Create the weapon model
function createWeapon() {
    const weaponGroup = new THREE.Group();
    
    // Gun body
    const bodyGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, -0.2);
    weaponGroup.add(body);

    // Gun barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6);
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, -0.6);
    weaponGroup.add(barrel);

    // Gun handle
    const handleGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.15);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, -0.15, 0.1);
    weaponGroup.add(handle);

    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
    const magMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
    const magazine = new THREE.Mesh(magGeometry, magMaterial);
    magazine.position.set(0, -0.1, 0.05);
    weaponGroup.add(magazine);

    // Position weapon in view
    weaponGroup.position.set(0.3, -0.3, -0.5);
    weaponGroup.rotation.y = -0.1;
    
    weapon = weaponGroup;
    camera.add(weapon);
}

// Create map with walls
function createMap() {
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.9,
        metalness: 0.1
    });

    // Create walls
    const wallPositions = [
        { x: 0, z: -50, width: 100, height: 10, depth: 2 }, // Back wall
        { x: 0, z: 50, width: 100, height: 10, depth: 2 },  // Front wall
        { x: -50, z: 0, width: 2, height: 10, depth: 100 }, // Left wall
        { x: 50, z: 0, width: 2, height: 10, depth: 100 },  // Right wall
        
        // Interior walls for cover
        { x: -20, z: -20, width: 20, height: 5, depth: 2 },
        { x: 20, z: -20, width: 20, height: 5, depth: 2 },
        { x: -20, z: 20, width: 20, height: 5, depth: 2 },
        { x: 20, z: 20, width: 20, height: 5, depth: 2 },
        { x: 0, z: 0, width: 2, height: 5, depth: 20 },
    ];

    wallPositions.forEach(pos => {
        const wallGeometry = new THREE.BoxGeometry(pos.width, pos.height, pos.depth);
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(pos.x, pos.height / 2, pos.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
        walls.push(wall);
    });

    // Add some boxes for cover
    const boxMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x654321,
        roughness: 0.8,
        metalness: 0.2
    });

    for (let i = 0; i < 10; i++) {
        const size = 1 + Math.random() * 2;
        const boxGeometry = new THREE.BoxGeometry(size, size, size);
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(
            (Math.random() - 0.5) * 80,
            size / 2,
            (Math.random() - 0.5) * 80
        );
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
        walls.push(box);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // Mouse controls
    document.addEventListener('mousemove', onMouseMove);
    
    // Pointer lock
    document.addEventListener('click', () => {
        if (!isPointerLocked && !document.getElementById('menu').style.display) {
            document.body.requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === document.body;
    });

    // Shooting
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && isPointerLocked && player.ammo > 0) {
            shoot();
        }
    });

    // Reload
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'r' && player.ammo < player.maxAmmo) {
            reload();
        }
    });
}

// Mouse movement handler
function onMouseMove(e) {
    if (!isPointerLocked) return;

    mouseMovement.x = e.movementX;
    mouseMovement.y = e.movementY;

    // Apply mouse movement to camera rotation
    player.rotation.y -= mouseMovement.x * MOUSE_SENSITIVITY;
    player.rotation.x -= mouseMovement.y * MOUSE_SENSITIVITY;

    // Clamp vertical rotation
    player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.rotation.x));

    // Apply rotation to camera
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.rotation.y;
    camera.rotation.x = player.rotation.x;
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update player movement
function updateMovement(deltaTime) {
    const moveVector = new THREE.Vector3();

    // Calculate movement direction
    if (keys['w']) moveVector.z -= 1;
    if (keys['s']) moveVector.z += 1;
    if (keys['a']) moveVector.x -= 1;
    if (keys['d']) moveVector.x += 1;

    // Normalize and apply speed
    if (moveVector.length() > 0) {
        moveVector.normalize();
        moveVector.multiplyScalar(MOVE_SPEED * deltaTime);

        // Rotate movement vector by player's Y rotation
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
    }

    // Apply gravity
    player.velocity.y += GRAVITY * deltaTime;

    // Jump
    if (keys[' '] && Math.abs(player.position.y - PLAYER_HEIGHT) < 0.1) {
        player.velocity.y = JUMP_FORCE;
    }

    // Update position
    const newPosition = {
        x: player.position.x + moveVector.x,
        y: player.position.y + player.velocity.y * deltaTime,
        z: player.position.z + moveVector.z
    };

    // Check collisions
    if (!checkCollision(newPosition)) {
        player.position.x = newPosition.x;
        player.position.z = newPosition.z;
    }

    // Ground collision
    if (newPosition.y <= PLAYER_HEIGHT) {
        player.position.y = PLAYER_HEIGHT;
        player.velocity.y = 0;
    } else {
        player.position.y = newPosition.y;
    }

    // Update camera position
    camera.position.set(player.position.x, player.position.y, player.position.z);

    // Send position update to server
    if (isConnected && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'move',
            position: player.position,
            rotation: player.rotation
        }));
    }
}

// Check collision with walls
function checkCollision(position) {
    const playerBox = new THREE.Box3(
        new THREE.Vector3(position.x - PLAYER_RADIUS, position.y - PLAYER_HEIGHT, position.z - PLAYER_RADIUS),
        new THREE.Vector3(position.x + PLAYER_RADIUS, position.y, position.z + PLAYER_RADIUS)
    );

    for (const wall of walls) {
        const wallBox = new THREE.Box3().setFromObject(wall);
        if (playerBox.intersectsBox(wallBox)) {
            return true;
        }
    }
    return false;
}

// Shooting mechanics
function shoot() {
    if (player.ammo <= 0) return;

    player.ammo--;
    updateHUD();

    // Create bullet
    const bulletGeometry = new THREE.SphereGeometry(0.05);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Set bullet position at gun barrel
    const bulletStartPos = new THREE.Vector3(0.3, -0.1, -1);
    bulletStartPos.applyQuaternion(camera.quaternion);
    bulletStartPos.add(camera.position);
    bullet.position.copy(bulletStartPos);

    // Set bullet velocity
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    bullet.velocity = direction.multiplyScalar(50);

    scene.add(bullet);
    bullets.push(bullet);

    // Weapon recoil animation
    if (weapon) {
        weapon.position.z += 0.1;
        weapon.rotation.x -= 0.1;
        setTimeout(() => {
            weapon.position.z -= 0.1;
            weapon.rotation.x += 0.1;
        }, 100);
    }

    // Send shoot event to server
    if (isConnected && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'shoot',
            position: bulletStartPos,
            direction: bullet.velocity
        }));
    }
}

// Reload weapon
function reload() {
    player.ammo = player.maxAmmo;
    updateHUD();
}

// Update bullets
function updateBullets(deltaTime) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.velocity.clone().multiplyScalar(deltaTime));

        // Remove bullets that are too far
        if (bullet.position.distanceTo(camera.position) > 100) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

// Update HUD
function updateHUD() {
    document.getElementById('health').textContent = player.health;
    document.getElementById('ammo').textContent = player.ammo;
    document.getElementById('maxAmmo').textContent = player.maxAmmo;
}

// Update other players
function updatePlayers() {
    players.forEach((otherPlayer, id) => {
        if (otherPlayer.mesh) {
            otherPlayer.mesh.position.set(
                otherPlayer.position.x,
                otherPlayer.position.y - 1,
                otherPlayer.position.z
            );
            otherPlayer.mesh.rotation.y = otherPlayer.rotation.y;
        }
    });
}

// Create player mesh
function createPlayerMesh() {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2;
    head.castShadow = true;
    group.add(head);

    return group;
}

// WebSocket functions
function hostGame() {
    const playerName = document.getElementById('playerName').value;
    player.name = playerName;
    document.getElementById('menu').style.display = 'none';
    
    // In a real implementation, you would start a WebSocket server here
    // For now, we'll just start the game in single-player mode
    console.log('Host mode - WebSocket server should be started');
    updateConnectionStatus('Hosting (Single Player)');
}

function joinGame() {
    const playerName = document.getElementById('playerName').value;
    const serverUrl = document.getElementById('serverUrl').value;
    player.name = playerName;

    socket = new WebSocket(serverUrl);

    socket.onopen = () => {
        isConnected = true;
        document.getElementById('menu').style.display = 'none';
        updateConnectionStatus('Connected');
        
        // Send join message
        socket.send(JSON.stringify({
            type: 'join',
            name: player.name,
            position: player.position
        }));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
    };

    socket.onclose = () => {
        isConnected = false;
        updateConnectionStatus('Disconnected');
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus('Connection Error');
        // Start in single-player mode if connection fails
        document.getElementById('menu').style.display = 'none';
    };
}

function handleServerMessage(data) {
    switch (data.type) {
        case 'playerJoined':
            const newPlayer = {
                name: data.name,
                position: data.position,
                rotation: data.rotation || { x: 0, y: 0 },
                mesh: createPlayerMesh()
            };
            players.set(data.id, newPlayer);
            scene.add(newPlayer.mesh);
            updatePlayerList();
            break;

        case 'playerLeft':
            const leftPlayer = players.get(data.id);
            if (leftPlayer && leftPlayer.mesh) {
                scene.remove(leftPlayer.mesh);
            }
            players.delete(data.id);
            updatePlayerList();
            break;

        case 'playerMove':
            const movedPlayer = players.get(data.id);
            if (movedPlayer) {
                movedPlayer.position = data.position;
                movedPlayer.rotation = data.rotation;
            }
            break;

        case 'playerShoot':
            // Create bullet from other player
            const bulletGeometry = new THREE.SphereGeometry(0.05);
            const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
            bullet.position.copy(data.position);
            bullet.velocity = new THREE.Vector3().copy(data.direction);
            scene.add(bullet);
            bullets.push(bullet);
            break;
    }
}

function updateConnectionStatus(status) {
    document.getElementById('connectionStatus').textContent = status;
}

function updatePlayerList() {
    const playerListDiv = document.getElementById('playerList');
    playerListDiv.innerHTML = '<h3>Players:</h3>';
    playerListDiv.innerHTML += `<div>${player.name} (You)</div>`;
    players.forEach((p) => {
        playerListDiv.innerHTML += `<div>${p.name}</div>`;
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    // Update game state
    updateMovement(deltaTime);
    updateBullets(deltaTime);
    updatePlayers();

    // Render scene
    renderer.render(scene, camera);
}

// Start the game when the page loads
window.addEventListener('load', init);
