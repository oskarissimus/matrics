// Game initialization
let scene, camera, renderer;
let socket;
let players = {};
let myPlayerId;
let myPlayerData;
let myPlayerMesh;

// Movement variables
const moveSpeed = 0.15;
const mouseSensitivity = 0.002;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let pitch = 0;
let yaw = 0;

// Weapon variables
let weaponMesh;

// Raycaster for shooting
const raycaster = new THREE.Raycaster();
const shootDirection = new THREE.Vector3();

// HP variables
let currentHP = 100;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 10, 100);

    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.6, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameCanvas').appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
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
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add grid for visual reference
    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x666666);
    scene.add(gridHelper);

    // Create weapon model
    createWeapon();

    // Setup controls
    setupControls();

    // Connect to server
    connectToServer();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start game loop
    animate();
}

// Create weapon model
function createWeapon() {
    const weaponGroup = new THREE.Group();
    
    // Weapon body (rifle-like shape)
    const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(0, 0, -0.2);
    weaponGroup.add(bodyMesh);
    
    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
    const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0.02, -0.75);
    weaponGroup.add(barrelMesh);
    
    // Handle
    const handleGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
    const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3c28 });
    const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.position.set(0, -0.1, 0.1);
    weaponGroup.add(handleMesh);
    
    // Scope
    const scopeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15);
    const scopeMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const scopeMesh = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scopeMesh.rotation.x = Math.PI / 2;
    scopeMesh.position.set(0, 0.1, -0.3);
    weaponGroup.add(scopeMesh);
    
    // Position weapon relative to camera
    weaponGroup.position.set(0.3, -0.3, -0.5);
    weaponGroup.rotation.y = -0.1;
    
    camera.add(weaponGroup);
    weaponMesh = weaponGroup;
}

// Setup controls
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Mouse controls - pointer lock
    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });
    
    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === renderer.domElement) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mousedown', onMouseDown);
        } else {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousedown', onMouseDown);
        }
    });
}

// Keyboard event handlers
function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

// Mouse event handlers
function onMouseMove(event) {
    yaw -= event.movementX * mouseSensitivity;
    pitch -= event.movementY * mouseSensitivity;
    
    // Clamp pitch to prevent over-rotation
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
}

function onMouseDown(event) {
    if (event.button === 0) { // Left click
        shoot();
    }
}

// Shooting function
function shoot() {
    // Get shoot direction from camera
    camera.getWorldDirection(shootDirection);
    
    // Set raycaster
    raycaster.set(camera.position, shootDirection);
    
    // Check for hits
    const intersects = [];
    for (let playerId in players) {
        if (playerId !== myPlayerId && players[playerId].mesh) {
            intersects.push(...raycaster.intersectObject(players[playerId].mesh));
        }
    }
    
    if (intersects.length > 0) {
        const hit = intersects[0];
        const hitPlayerId = Object.keys(players).find(id => 
            players[id].mesh === hit.object
        );
        
        if (hitPlayerId) {
            // Send hit to server
            socket.emit('hit', {
                playerId: hitPlayerId,
                damage: 25
            });
        }
    }
    
    // Send shoot event to other players
    socket.emit('shoot', {
        ray: {
            origin: camera.position.toArray(),
            direction: shootDirection.toArray()
        }
    });
    
    // Visual feedback - weapon recoil
    if (weaponMesh) {
        weaponMesh.position.z += 0.05;
        setTimeout(() => {
            weaponMesh.position.z -= 0.05;
        }, 100);
    }
}

// Connect to server
function connectToServer() {
    socket = io();
    
    // Initialize player
    socket.on('init', (data) => {
        myPlayerId = data.id;
        myPlayerData = data.playerData;
        
        // Set player name
        document.getElementById('playerName').textContent = myPlayerData.name;
        
        // Set initial position
        camera.position.set(
            myPlayerData.position.x,
            myPlayerData.position.y,
            myPlayerData.position.z
        );
        
        // Add existing players
        for (let id in data.players) {
            if (id !== myPlayerId) {
                addPlayer(data.players[id]);
            }
        }
    });
    
    // Player joined
    socket.on('playerJoined', (playerData) => {
        addPlayer(playerData);
    });
    
    // Player moved
    socket.on('playerMoved', (data) => {
        if (players[data.id]) {
            players[data.id].mesh.position.set(
                data.position.x,
                data.position.y,
                data.position.z
            );
            players[data.id].mesh.rotation.y = data.rotation.y;
        }
    });
    
    // Player shot
    socket.on('playerShot', (data) => {
        // Could add visual effects for other players shooting
    });
    
    // HP update
    socket.on('hpUpdate', (data) => {
        if (data.playerId === myPlayerId) {
            currentHP = data.hp;
            updateHPDisplay();
        }
    });
    
    // Player died
    socket.on('playerDied', (data) => {
        if (data.playerId === myPlayerId) {
            // Could add death screen
        } else if (players[data.playerId]) {
            // Hide dead player
            players[data.playerId].mesh.visible = false;
        }
    });
    
    // Player respawn
    socket.on('playerRespawn', (data) => {
        if (data.playerId === myPlayerId) {
            camera.position.set(
                data.position.x,
                data.position.y,
                data.position.z
            );
            currentHP = data.hp;
            updateHPDisplay();
        } else if (players[data.playerId]) {
            players[data.playerId].mesh.visible = true;
            players[data.playerId].mesh.position.set(
                data.position.x,
                data.position.y,
                data.position.z
            );
        }
    });
    
    // Player left
    socket.on('playerLeft', (playerId) => {
        removePlayer(playerId);
    });
}

// Add player to scene
function addPlayer(playerData) {
    const geometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const material = new THREE.MeshPhongMaterial({ 
        color: playerData.color 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
        playerData.position.x,
        playerData.position.y,
        playerData.position.z
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    
    players[playerData.id] = {
        mesh: mesh,
        data: playerData
    };
}

// Remove player from scene
function removePlayer(playerId) {
    if (players[playerId]) {
        scene.remove(players[playerId].mesh);
        delete players[playerId];
    }
}

// Update HP display
function updateHPDisplay() {
    document.getElementById('hpText').textContent = `HP: ${currentHP}`;
    document.getElementById('hpFill').style.width = `${currentHP}%`;
    
    // Change color based on HP
    const hpFill = document.getElementById('hpFill');
    if (currentHP > 60) {
        hpFill.style.background = 'linear-gradient(90deg, #00ff00, #44ff44)';
    } else if (currentHP > 30) {
        hpFill.style.background = 'linear-gradient(90deg, #ffff00, #ffff44)';
    } else {
        hpFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
    }
}

// Update player movement
function updateMovement() {
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    // Get forward direction based on yaw only (not pitch)
    direction.x = Math.sin(yaw);
    direction.z = Math.cos(yaw);
    direction.normalize();
    
    // Get right direction
    right.x = Math.sin(yaw + Math.PI / 2);
    right.z = Math.cos(yaw + Math.PI / 2);
    right.normalize();
    
    // Apply movement
    if (moveForward) {
        camera.position.x -= direction.x * moveSpeed;
        camera.position.z -= direction.z * moveSpeed;
    }
    if (moveBackward) {
        camera.position.x += direction.x * moveSpeed;
        camera.position.z += direction.z * moveSpeed;
    }
    if (moveLeft) {
        camera.position.x -= right.x * moveSpeed;
        camera.position.z -= right.z * moveSpeed;
    }
    if (moveRight) {
        camera.position.x += right.x * moveSpeed;
        camera.position.z += right.z * moveSpeed;
    }
    
    // Apply rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    
    // Send position to server
    if (socket && socket.connected) {
        socket.emit('move', {
            position: {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z
            },
            rotation: {
                x: camera.rotation.x,
                y: camera.rotation.y,
                z: camera.rotation.z
            }
        });
    }
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    updateMovement();
    
    renderer.render(scene, camera);
}

// Start the game
init();
