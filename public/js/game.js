// Game variables
let scene, camera, renderer;
let player, otherPlayers = {};
let socket;
let controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    canJump: true
};
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let bullets = {};
let weapon;
let clock = new THREE.Clock();

// Player settings
const PLAYER_SPEED = 10;
const JUMP_VELOCITY = 10;
const GRAVITY = -30;
const PLAYER_HEIGHT = 2;
const WEAPON_OFFSET = new THREE.Vector3(0.5, -0.5, -1);

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
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Add lighting
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
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add grid for visual reference
    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x666666);
    scene.add(gridHelper);

    // Create some obstacles/walls
    createMap();

    // Create weapon model
    createWeapon();

    // Initialize player
    player = {
        position: new THREE.Vector3(0, PLAYER_HEIGHT, 0),
        rotation: new THREE.Euler(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0)
    };

    // Set up controls
    setupControls();

    // Connect to server
    connectToServer();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start game loop
    animate();
}

function createMap() {
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        roughness: 0.9,
        metalness: 0.1
    });

    // Create walls
    const walls = [
        { pos: [0, 2.5, -25], size: [50, 5, 1] },  // Back wall
        { pos: [0, 2.5, 25], size: [50, 5, 1] },   // Front wall
        { pos: [-25, 2.5, 0], size: [1, 5, 50] },  // Left wall
        { pos: [25, 2.5, 0], size: [1, 5, 50] },   // Right wall
        
        // Some cover objects
        { pos: [-10, 1.5, -10], size: [4, 3, 4] },
        { pos: [10, 1.5, -10], size: [4, 3, 4] },
        { pos: [-10, 1.5, 10], size: [4, 3, 4] },
        { pos: [10, 1.5, 10], size: [4, 3, 4] },
        { pos: [0, 1.5, 0], size: [6, 3, 6] }
    ];

    walls.forEach(wall => {
        const geometry = new THREE.BoxGeometry(...wall.size);
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.set(...wall.pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
    });
}

function createWeapon() {
    // Create a simple weapon model (rifle-like shape)
    const weaponGroup = new THREE.Group();

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.x = 0.75;
    weaponGroup.add(barrel);

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        metalness: 0.6,
        roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    weaponGroup.add(body);

    // Handle
    const handleGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.1);
    const handle = new THREE.Mesh(handleGeometry, bodyMaterial);
    handle.position.set(-0.2, -0.25, 0);
    weaponGroup.add(handle);

    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.1, 0.25, 0.08);
    const magazine = new THREE.Mesh(magGeometry, bodyMaterial);
    magazine.position.set(0.1, -0.225, 0);
    weaponGroup.add(magazine);

    weapon = weaponGroup;
    scene.add(weapon);
}

function setupControls() {
    // Mouse controls
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;

    document.addEventListener('mousemove', (event) => {
        if (document.pointerLockElement === renderer.domElement) {
            mouseX -= event.movementX * 0.002;
            mouseY -= event.movementY * 0.002;
            mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseY));
        }
    });

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyW': controls.moveForward = true; break;
            case 'KeyS': controls.moveBackward = true; break;
            case 'KeyA': controls.moveLeft = true; break;
            case 'KeyD': controls.moveRight = true; break;
            case 'Space': 
                if (controls.canJump && player.velocity.y === 0) {
                    player.velocity.y = JUMP_VELOCITY;
                    controls.canJump = false;
                }
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW': controls.moveForward = false; break;
            case 'KeyS': controls.moveBackward = false; break;
            case 'KeyA': controls.moveLeft = false; break;
            case 'KeyD': controls.moveRight = false; break;
        }
    });

    // Mouse click to shoot
    renderer.domElement.addEventListener('click', () => {
        if (document.pointerLockElement === renderer.domElement) {
            shoot();
        }
    });

    // Pointer lock
    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    // Update camera rotation
    function updateCameraRotation() {
        targetRotationX = mouseX;
        targetRotationY = mouseY;
        
        camera.rotation.x += (targetRotationY - camera.rotation.x) * 0.1;
        camera.rotation.y += (targetRotationX - camera.rotation.y) * 0.1;
        
        player.rotation.x = camera.rotation.x;
        player.rotation.y = camera.rotation.y;
    }

    // Store the update function for use in animate loop
    window.updateCameraRotation = updateCameraRotation;
}

function connectToServer() {
    socket = io();

    socket.on('currentPlayers', (players) => {
        Object.keys(players).forEach(id => {
            if (id !== socket.id) {
                addOtherPlayer(players[id]);
            }
        });
        updatePlayerList();
    });

    socket.on('newPlayer', (playerInfo) => {
        addOtherPlayer(playerInfo);
        updatePlayerList();
    });

    socket.on('playerMoved', (data) => {
        if (otherPlayers[data.id]) {
            otherPlayers[data.id].position.copy(data.position);
            otherPlayers[data.id].rotation.copy(data.rotation);
        }
    });

    socket.on('playerDisconnected', (id) => {
        if (otherPlayers[id]) {
            scene.remove(otherPlayers[id]);
            delete otherPlayers[id];
            updatePlayerList();
        }
    });

    socket.on('bulletFired', (bullet) => {
        if (bullet.playerId !== socket.id) {
            createBullet(bullet);
        }
    });

    socket.on('playerHealthUpdate', (data) => {
        if (data.playerId === socket.id) {
            updateHealth(data.health);
        }
    });

    socket.on('scoreUpdate', (data) => {
        if (data.playerId === socket.id) {
            updateScore(data.score);
        }
    });

    socket.on('playerDied', (data) => {
        if (data.playerId === socket.id) {
            player.position.copy(data.newPosition);
            updateHealth(100);
        }
    });
}

function addOtherPlayer(playerInfo) {
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: playerInfo.color });
    const playerMesh = new THREE.Mesh(geometry, material);
    playerMesh.castShadow = true;
    playerMesh.receiveShadow = true;
    
    playerMesh.position.copy(playerInfo.position);
    playerMesh.rotation.copy(playerInfo.rotation);
    
    otherPlayers[playerInfo.id] = playerMesh;
    scene.add(playerMesh);
}

function shoot() {
    const bullet = {
        position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        },
        direction: {
            x: -Math.sin(camera.rotation.y) * Math.cos(camera.rotation.x),
            y: Math.sin(camera.rotation.x),
            z: -Math.cos(camera.rotation.y) * Math.cos(camera.rotation.x)
        }
    };

    socket.emit('playerShoot', bullet);
    createBullet({ ...bullet, playerId: socket.id });
}

function createBullet(bulletData) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 1
    });
    const bulletMesh = new THREE.Mesh(geometry, material);
    
    bulletMesh.position.copy(bulletData.position);
    scene.add(bulletMesh);
    
    bullets[bulletData.id] = {
        mesh: bulletMesh,
        direction: bulletData.direction,
        playerId: bulletData.playerId,
        speed: bulletData.speed || 50
    };

    // Remove bullet after 3 seconds
    setTimeout(() => {
        if (bullets[bulletData.id]) {
            scene.remove(bullets[bulletData.id].mesh);
            delete bullets[bulletData.id];
        }
    }, 3000);
}

function updateBullets(delta) {
    Object.keys(bullets).forEach(id => {
        const bullet = bullets[id];
        bullet.mesh.position.x += bullet.direction.x * bullet.speed * delta;
        bullet.mesh.position.y += bullet.direction.y * bullet.speed * delta;
        bullet.mesh.position.z += bullet.direction.z * bullet.speed * delta;

        // Check collision with other players
        Object.keys(otherPlayers).forEach(playerId => {
            const player = otherPlayers[playerId];
            const distance = bullet.mesh.position.distanceTo(player.position);
            
            if (distance < 1 && bullet.playerId === socket.id) {
                socket.emit('playerHit', {
                    playerId: playerId,
                    shooterId: socket.id,
                    damage: 25
                });
                
                // Remove bullet
                scene.remove(bullet.mesh);
                delete bullets[id];
            }
        });
    });
}

function updateMovement(delta) {
    // Apply gravity
    player.velocity.y += GRAVITY * delta;

    // Movement
    direction.z = Number(controls.moveForward) - Number(controls.moveBackward);
    direction.x = Number(controls.moveRight) - Number(controls.moveLeft);
    direction.normalize();

    if (controls.moveForward || controls.moveBackward) {
        player.velocity.z = -direction.z * PLAYER_SPEED;
    } else {
        player.velocity.z *= 0.9;
    }

    if (controls.moveLeft || controls.moveRight) {
        player.velocity.x = direction.x * PLAYER_SPEED;
    } else {
        player.velocity.x *= 0.9;
    }

    // Apply movement
    const moveX = player.velocity.x * delta;
    const moveZ = player.velocity.z * delta;
    
    player.position.x += moveX * Math.cos(camera.rotation.y) - moveZ * Math.sin(camera.rotation.y);
    player.position.z += moveX * Math.sin(camera.rotation.y) + moveZ * Math.cos(camera.rotation.y);
    player.position.y += player.velocity.y * delta;

    // Ground collision
    if (player.position.y <= PLAYER_HEIGHT) {
        player.position.y = PLAYER_HEIGHT;
        player.velocity.y = 0;
        controls.canJump = true;
    }

    // Boundary collision
    player.position.x = Math.max(-24, Math.min(24, player.position.x));
    player.position.z = Math.max(-24, Math.min(24, player.position.z));

    // Update camera position
    camera.position.copy(player.position);

    // Update weapon position
    if (weapon) {
        weapon.position.copy(camera.position);
        weapon.position.add(WEAPON_OFFSET.clone().applyEuler(camera.rotation));
        weapon.rotation.copy(camera.rotation);
    }

    // Send position to server
    if (socket && socket.connected) {
        socket.emit('playerMovement', {
            position: player.position,
            rotation: player.rotation
        });
    }
}

function updateHealth(health) {
    const healthFill = document.getElementById('health-fill');
    healthFill.style.width = health + '%';
    
    if (health > 60) {
        healthFill.style.backgroundColor = '#00ff00';
    } else if (health > 30) {
        healthFill.style.backgroundColor = '#ffff00';
    } else {
        healthFill.style.backgroundColor = '#ff0000';
    }
}

function updateScore(score) {
    document.getElementById('score').textContent = 'Score: ' + score;
}

function updatePlayerList() {
    const playersList = document.getElementById('players');
    playersList.innerHTML = '';
    
    // Add self
    const selfEntry = document.createElement('div');
    selfEntry.className = 'player-entry';
    selfEntry.textContent = 'You';
    selfEntry.style.color = '#00ff00';
    playersList.appendChild(selfEntry);
    
    // Add other players
    Object.keys(otherPlayers).forEach(id => {
        const entry = document.createElement('div');
        entry.className = 'player-entry';
        entry.textContent = 'Player ' + id.substring(0, 6);
        playersList.appendChild(entry);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    if (document.pointerLockElement === renderer.domElement) {
        window.updateCameraRotation();
        updateMovement(delta);
    }
    
    updateBullets(delta);
    
    renderer.render(scene, camera);
}

// Start game when clicking start button
document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    init();
});
