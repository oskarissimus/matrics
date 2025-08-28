// Game variables
let scene, camera, renderer;
let player = {
    position: new THREE.Vector3(0, 1.6, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: { x: 0, y: 0 },
    health: 100,
    ammo: 30,
    isGrounded: false
};

let weapon;
let bullets = [];
let players = {};
let socket;
let roomCode;
let playerName;
let isPointerLocked = false;

// Movement keys
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

// Game settings
const MOVE_SPEED = 5;
const JUMP_FORCE = 8;
const GRAVITY = -20;
const MOUSE_SENSITIVITY = 0.002;
const WEAPON_OFFSET = new THREE.Vector3(0.2, -0.2, -0.3);

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 10, 100);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(player.position);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

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
    scene.add(directionalLight);

    // Create floor
    const floorGeometry = new THREE.BoxGeometry(100, 1, 100);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create walls
    createWalls();

    // Create weapon
    createWeapon();

    // Add some obstacles
    createObstacles();

    // Set up controls
    setupControls();

    // Start animation loop
    animate();
}

function createWalls() {
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    
    // Front wall
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(100, 20, 1), wallMaterial);
    frontWall.position.set(0, 10, -50);
    frontWall.castShadow = true;
    scene.add(frontWall);
    
    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(100, 20, 1), wallMaterial);
    backWall.position.set(0, 10, 50);
    backWall.castShadow = true;
    scene.add(backWall);
    
    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 100), wallMaterial);
    leftWall.position.set(-50, 10, 0);
    leftWall.castShadow = true;
    scene.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 20, 100), wallMaterial);
    rightWall.position.set(50, 10, 0);
    rightWall.castShadow = true;
    scene.add(rightWall);
}

function createObstacles() {
    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x663300 });
    
    // Create some boxes as cover
    const positions = [
        { x: 10, z: 10 },
        { x: -15, z: 5 },
        { x: 20, z: -20 },
        { x: -25, z: -15 },
        { x: 0, z: 0 }
    ];
    
    positions.forEach(pos => {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 4),
            boxMaterial
        );
        box.position.set(pos.x, 1.5, pos.z);
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
    });
}

function createWeapon() {
    const weaponGroup = new THREE.Group();
    
    // Create simple weapon geometry (resembling an AK-47 shape)
    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
    const stockMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, 0, 0.15);
    weaponGroup.add(stock);
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, -0.1);
    weaponGroup.add(body);
    
    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4);
    const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.45);
    weaponGroup.add(barrel);
    
    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.03, 0.15, 0.1);
    const magMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const magazine = new THREE.Mesh(magGeometry, magMaterial);
    magazine.position.set(0, -0.1, -0.1);
    magazine.rotation.z = 0.1;
    weaponGroup.add(magazine);
    
    // Trigger guard
    const triggerGuardGeometry = new THREE.TorusGeometry(0.05, 0.01, 8, 16, Math.PI);
    const triggerGuardMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const triggerGuard = new THREE.Mesh(triggerGuardGeometry, triggerGuardMaterial);
    triggerGuard.position.set(0, -0.05, 0);
    triggerGuard.rotation.z = Math.PI;
    weaponGroup.add(triggerGuard);
    
    weapon = weaponGroup;
    scene.add(weapon);
}

function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case 'w': keys.w = true; break;
            case 'a': keys.a = true; break;
            case 's': keys.s = true; break;
            case 'd': keys.d = true; break;
            case ' ': keys.space = true; break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch(e.key.toLowerCase()) {
            case 'w': keys.w = false; break;
            case 'a': keys.a = false; break;
            case 's': keys.s = false; break;
            case 'd': keys.d = false; break;
            case ' ': keys.space = false; break;
        }
    });
    
    // Mouse controls
    renderer.domElement.addEventListener('click', () => {
        if (!isPointerLocked) {
            renderer.domElement.requestPointerLock();
        } else {
            shoot();
        }
    });
    
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === renderer.domElement;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isPointerLocked) {
            player.rotation.y -= e.movementX * MOUSE_SENSITIVITY;
            player.rotation.x -= e.movementY * MOUSE_SENSITIVITY;
            
            // Clamp vertical rotation
            player.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, player.rotation.x));
        }
    });
    
    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function updatePlayer(deltaTime) {
    // Get movement direction based on camera rotation
    const moveVector = new THREE.Vector3();
    
    if (keys.w) moveVector.z -= 1;
    if (keys.s) moveVector.z += 1;
    if (keys.a) moveVector.x -= 1;
    if (keys.d) moveVector.x += 1;
    
    // Normalize and apply speed
    if (moveVector.length() > 0) {
        moveVector.normalize();
        moveVector.multiplyScalar(MOVE_SPEED * deltaTime);
        
        // Rotate movement by player's Y rotation
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
        
        // Apply movement
        player.position.x += moveVector.x;
        player.position.z += moveVector.z;
    }
    
    // Apply gravity
    player.velocity.y += GRAVITY * deltaTime;
    
    // Jump
    if (keys.space && player.isGrounded) {
        player.velocity.y = JUMP_FORCE;
        player.isGrounded = false;
    }
    
    // Update vertical position
    player.position.y += player.velocity.y * deltaTime;
    
    // Ground collision
    if (player.position.y <= 1.6) {
        player.position.y = 1.6;
        player.velocity.y = 0;
        player.isGrounded = true;
    }
    
    // Keep player in bounds
    player.position.x = Math.max(-48, Math.min(48, player.position.x));
    player.position.z = Math.max(-48, Math.min(48, player.position.z));
    
    // Update camera position
    camera.position.copy(player.position);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.rotation.y;
    camera.rotation.x = player.rotation.x;
    
    // Update weapon position
    if (weapon) {
        weapon.position.copy(camera.position);
        weapon.position.add(WEAPON_OFFSET.clone().applyQuaternion(camera.quaternion));
        weapon.rotation.copy(camera.rotation);
    }
}

function shoot() {
    if (player.ammo <= 0) return;
    
    player.ammo--;
    updateHUD();
    
    // Create bullet
    const bulletGeometry = new THREE.SphereGeometry(0.05);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    // Position bullet at barrel tip
    bullet.position.copy(camera.position);
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    bullet.position.add(direction.clone().multiplyScalar(0.5));
    
    bullet.velocity = direction.multiplyScalar(50);
    bullet.lifetime = 2;
    
    scene.add(bullet);
    bullets.push(bullet);
    
    // Send shot to server
    if (socket && socket.connected) {
        socket.emit('shoot', {
            position: bullet.position,
            velocity: bullet.velocity
        });
    }
    
    // Recoil effect
    player.rotation.x -= 0.02;
    
    // Muzzle flash effect
    const flash = new THREE.PointLight(0xffff00, 2, 5);
    flash.position.copy(bullet.position);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 50);
}

function updateBullets(deltaTime) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.lifetime -= deltaTime;
        
        if (bullet.lifetime <= 0) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        } else {
            bullet.position.add(bullet.velocity.clone().multiplyScalar(deltaTime));
        }
    }
}

function updateHUD() {
    document.getElementById('health').textContent = player.health;
    document.getElementById('ammo').textContent = player.ammo;
}

function startGame() {
    playerName = document.getElementById('playerName').value || 'Player';
    roomCode = document.getElementById('roomCode').value;
    
    document.getElementById('menu').style.display = 'none';
    
    init();
    connectToServer();
}

function connectToServer() {
    socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
        socket.emit('joinGame', { name: playerName, room: roomCode });
    });
    
    socket.on('roomJoined', (room) => {
        roomCode = room;
        console.log('Joined room:', room);
    });
    
    socket.on('playerUpdate', (data) => {
        // Update other players
        Object.keys(data).forEach(id => {
            if (id !== socket.id) {
                if (!players[id]) {
                    // Create new player mesh
                    const playerMesh = new THREE.Mesh(
                        new THREE.CapsuleGeometry(0.5, 1, 4, 8),
                        new THREE.MeshPhongMaterial({ color: 0x0000ff })
                    );
                    players[id] = {
                        mesh: playerMesh,
                        name: data[id].name
                    };
                    scene.add(playerMesh);
                }
                
                // Update player position
                players[id].mesh.position.set(
                    data[id].position.x,
                    data[id].position.y,
                    data[id].position.z
                );
            }
        });
        
        // Remove disconnected players
        Object.keys(players).forEach(id => {
            if (!data[id]) {
                scene.remove(players[id].mesh);
                delete players[id];
            }
        });
        
        updatePlayerList(data);
    });
    
    socket.on('bulletFired', (data) => {
        // Create bullet from other player
        const bulletGeometry = new THREE.SphereGeometry(0.05);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        bullet.position.set(data.position.x, data.position.y, data.position.z);
        bullet.velocity = new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z);
        bullet.lifetime = 2;
        
        scene.add(bullet);
        bullets.push(bullet);
    });
    
    // Send position updates
    setInterval(() => {
        if (socket && socket.connected) {
            socket.emit('updatePosition', {
                position: player.position,
                rotation: player.rotation
            });
        }
    }, 50);
}

function updatePlayerList(playersData) {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '<h3>Players:</h3>';
    
    Object.keys(playersData).forEach(id => {
        const div = document.createElement('div');
        div.className = 'player-item';
        div.textContent = playersData[id].name;
        if (id === socket.id) {
            div.textContent += ' (You)';
        }
        playerList.appendChild(div);
    });
}

let clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    updatePlayer(deltaTime);
    updateBullets(deltaTime);
    
    renderer.render(scene, camera);
}
