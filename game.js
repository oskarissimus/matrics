let scene, camera, renderer;
let socket;
let players = {};
let myPlayerId;
let myPlayerData;
let myPlayerMesh;
let labelRenderer;

const moveSpeed = 0.15;
const mouseSensitivity = 0.002;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let pitch = 0;
let yaw = 0;

let weaponMesh;

const raycaster = new THREE.Raycaster();
const shootDirection = new THREE.Vector3();

let currentHP = 100;
let isDead = false;

const bullets = [];

const collisionObstacles = [];
const obstacleMeshes = [];
const MAP_BOUNDARY = 48;
const PLAYER_RADIUS = 0.5;

const STORAGE_KEY = 'matrics_player_name';
let pendingPlayerName = null;

// Bullet visual constants
const BULLET_RADIUS = 0.05;
const BULLET_LENGTH = 0.4;
const BULLET_LIFETIME = 2.5;
const BULLET_COLOR = 0x00FFFF;
const FADE_START_PERCENT = 0.6;
const BULLET_TRAIL_LENGTH = 6;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 100);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.6, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameCanvas').appendChild(renderer.domElement);

    // Setup CSS2D renderer for name tags
    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('gameCanvas').appendChild(labelRenderer.domElement);

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

    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x666666);
    scene.add(gridHelper);

    createMapElements();

    createWeapon();
    
    scene.add(camera);

    setupControls();

    showNameModal();

    window.addEventListener('resize', onWindowResize);

    animate();
}

function loadSavedName() {
    try {
        return localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
        return '';
    }
}

function saveName(name) {
    try {
        localStorage.setItem(STORAGE_KEY, name);
    } catch (e) {
    }
}

function validatePlayerName(name) {
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
        return { valid: false, error: 'Name must be at least 3 characters' };
    }
    if (trimmedName.length > 20) {
        return { valid: false, error: 'Name must be 20 characters or less' };
    }
    const validPattern = /^[a-zA-Z0-9 .,!?'-]+$/;
    if (!validPattern.test(trimmedName)) {
        return { valid: false, error: 'Only letters, numbers, spaces, and basic punctuation allowed' };
    }
    return { valid: true, name: trimmedName };
}

function showNameModal() {
    const modal = document.getElementById('nameModal');
    const input = document.getElementById('nameInput');
    const joinButton = document.getElementById('joinButton');
    const errorDiv = document.getElementById('nameError');

    const savedName = loadSavedName();
    if (savedName) {
        input.value = savedName;
    }

    input.focus();

    const handleJoin = () => {
        const validation = validatePlayerName(input.value);
        if (validation.valid) {
            errorDiv.textContent = '';
            pendingPlayerName = validation.name;
            saveName(validation.name);
            hideNameModal();
            connectToServer();
        } else {
            errorDiv.textContent = validation.error;
        }
    };

    joinButton.addEventListener('click', handleJoin);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleJoin();
        }
    });
}

function hideNameModal() {
    const modal = document.getElementById('nameModal');
    modal.classList.add('hidden');
}

function createMapElements() {
    const boundaryMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const boundaryHeight = 6;
    const boundaryThickness = 2;
    const boundaryLength = 100;

    const northWall = new THREE.Mesh(
        new THREE.BoxGeometry(boundaryLength, boundaryHeight, boundaryThickness),
        boundaryMat
    );
    northWall.position.set(0, boundaryHeight / 2, -50);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    obstacleMeshes.push(northWall);
    collisionObstacles.push({ x: 0, z: -50, halfW: 50, halfD: 1 });

    const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(boundaryLength, boundaryHeight, boundaryThickness),
        boundaryMat
    );
    southWall.position.set(0, boundaryHeight / 2, 50);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);
    obstacleMeshes.push(southWall);
    collisionObstacles.push({ x: 0, z: 50, halfW: 50, halfD: 1 });

    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(boundaryThickness, boundaryHeight, boundaryLength),
        boundaryMat
    );
    eastWall.position.set(50, boundaryHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    obstacleMeshes.push(eastWall);
    collisionObstacles.push({ x: 50, z: 0, halfW: 1, halfD: 50 });

    const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(boundaryThickness, boundaryHeight, boundaryLength),
        boundaryMat
    );
    westWall.position.set(-50, boundaryHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
    obstacleMeshes.push(westWall);
    collisionObstacles.push({ x: -50, z: 0, halfW: 1, halfD: 50 });

    const towerGeo = new THREE.BoxGeometry(5, 10, 5);
    const towerMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 5, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    obstacleMeshes.push(tower);
    collisionObstacles.push({ x: 0, z: 0, halfW: 2.5, halfD: 2.5 });

    const bunkerGeo = new THREE.BoxGeometry(3, 3, 3);
    const bunkerMat = new THREE.MeshPhongMaterial({ color: 0xFF6633 });
    const bunkerPositions = [
        [25, 1.5, 25],
        [-25, 1.5, 25],
        [25, 1.5, -25],
        [-25, 1.5, -25]
    ];
    bunkerPositions.forEach(pos => {
        const bunker = new THREE.Mesh(bunkerGeo, bunkerMat);
        bunker.position.set(pos[0], pos[1], pos[2]);
        bunker.castShadow = true;
        bunker.receiveShadow = true;
        scene.add(bunker);
        obstacleMeshes.push(bunker);
        collisionObstacles.push({ x: pos[0], z: pos[2], halfW: 1.5, halfD: 1.5 });
    });

    const wallMat = new THREE.MeshPhongMaterial({ color: 0x2C5AA0 });
    const wall1Geo = new THREE.BoxGeometry(1.5, 4, 20);
    const wall1 = new THREE.Mesh(wall1Geo, wallMat);
    wall1.position.set(15, 2, 0);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);
    obstacleMeshes.push(wall1);
    collisionObstacles.push({ x: 15, z: 0, halfW: 0.75, halfD: 10 });

    const wall2Geo = new THREE.BoxGeometry(20, 4, 1.5);
    const wall2 = new THREE.Mesh(wall2Geo, wallMat);
    wall2.position.set(0, 2, 15);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);
    obstacleMeshes.push(wall2);
    collisionObstacles.push({ x: 0, z: 15, halfW: 10, halfD: 0.75 });

    const rampMat = new THREE.MeshPhongMaterial({ color: 0x33DD99 });
    const ramp1Geo = new THREE.BoxGeometry(3, 0.5, 6);
    const ramp1 = new THREE.Mesh(ramp1Geo, rampMat);
    ramp1.position.set(-20, 1, -20);
    ramp1.rotation.x = Math.PI / 6;
    ramp1.castShadow = true;
    ramp1.receiveShadow = true;
    scene.add(ramp1);
    obstacleMeshes.push(ramp1);

    const ramp2Geo = new THREE.BoxGeometry(3, 0.5, 6);
    const ramp2 = new THREE.Mesh(ramp2Geo, rampMat);
    ramp2.position.set(20, 1.5, -20);
    ramp2.rotation.x = Math.PI / 6;
    ramp2.castShadow = true;
    ramp2.receiveShadow = true;
    scene.add(ramp2);
    obstacleMeshes.push(ramp2);
}

function checkCollision(newX, newZ) {
    for (const obs of collisionObstacles) {
        const dx = Math.abs(newX - obs.x);
        const dz = Math.abs(newZ - obs.z);
        if (dx < obs.halfW + PLAYER_RADIUS && dz < obs.halfD + PLAYER_RADIUS) {
            return true;
        }
    }
    return false;
}

function createWeapon() {
    const weaponGroup = new THREE.Group();
    
    const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(0, 0, -0.2);
    weaponGroup.add(bodyMesh);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
    const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0.02, -0.75);
    weaponGroup.add(barrelMesh);
    
    const handleGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
    const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3c28 });
    const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.position.set(0, -0.1, 0.1);
    weaponGroup.add(handleMesh);
    
    const scopeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15);
    const scopeMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const scopeMesh = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scopeMesh.rotation.x = Math.PI / 2;
    scopeMesh.position.set(0, 0.1, -0.3);
    weaponGroup.add(scopeMesh);
    
    weaponGroup.position.set(0.3, -0.3, -0.5);
    weaponGroup.rotation.y = -0.1;
    
    camera.add(weaponGroup);
    weaponMesh = weaponGroup;
}

function createBlockyCharacter(colorScheme, playerName) {
    const playerGroup = new THREE.Group();

    const headMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.primary,
        shininess: 80,
        specular: 0x444444
    });
    const torsoMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.primary,
        shininess: 20,
        specular: 0x111111
    });
    const armMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.secondary,
        shininess: 50,
        specular: 0x333333
    });
    const legMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.accent,
        shininess: 40,
        specular: 0x222222
    });

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMesh = new THREE.Mesh(headGeo, headMaterial);
    headMesh.position.set(0, 1.45, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    playerGroup.add(headMesh);

    const faceMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        shininess: 100,
        specular: 0x333333
    });

    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
    const leftEyeMesh = new THREE.Mesh(eyeGeo, faceMaterial);
    leftEyeMesh.position.set(-0.1, 1.5, -0.26);
    leftEyeMesh.castShadow = true;
    leftEyeMesh.receiveShadow = true;
    playerGroup.add(leftEyeMesh);

    const rightEyeMesh = new THREE.Mesh(eyeGeo, faceMaterial);
    rightEyeMesh.position.set(0.1, 1.5, -0.26);
    rightEyeMesh.castShadow = true;
    rightEyeMesh.receiveShadow = true;
    playerGroup.add(rightEyeMesh);

    const mouthGeo = new THREE.BoxGeometry(0.15, 0.04, 0.02);
    const mouthMesh = new THREE.Mesh(mouthGeo, faceMaterial);
    mouthMesh.position.set(0, 1.38, -0.26);
    mouthMesh.castShadow = true;
    mouthMesh.receiveShadow = true;
    playerGroup.add(mouthMesh);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMaterial);
    torsoMesh.position.set(0, 0.9, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    playerGroup.add(torsoMesh);

    // Left Arm
    const armGeo = new THREE.BoxGeometry(0.25, 0.7, 0.25);
    const leftArmMesh = new THREE.Mesh(armGeo, armMaterial);
    leftArmMesh.position.set(-0.45, 0.95, 0);
    leftArmMesh.castShadow = true;
    leftArmMesh.receiveShadow = true;
    playerGroup.add(leftArmMesh);

    // Right Arm
    const rightArmMesh = new THREE.Mesh(armGeo, armMaterial);
    rightArmMesh.position.set(0.45, 0.95, 0);
    rightArmMesh.castShadow = true;
    rightArmMesh.receiveShadow = true;
    playerGroup.add(rightArmMesh);

    // Left Leg
    const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    const leftLegMesh = new THREE.Mesh(legGeo, legMaterial);
    leftLegMesh.position.set(-0.175, 0.375, 0);
    leftLegMesh.castShadow = true;
    leftLegMesh.receiveShadow = true;
    playerGroup.add(leftLegMesh);

    // Right Leg
    const rightLegMesh = new THREE.Mesh(legGeo, legMaterial);
    rightLegMesh.position.set(0.175, 0.375, 0);
    rightLegMesh.castShadow = true;
    rightLegMesh.receiveShadow = true;
    playerGroup.add(rightLegMesh);

    // Name Tag (CSS2DObject)
    const nameDiv = document.createElement('div');
    nameDiv.className = 'player-nametag';
    nameDiv.textContent = playerName;
    const nameLabel = new THREE.CSS2DObject(nameDiv);
    nameLabel.position.set(0, 2.4, 0);
    playerGroup.add(nameLabel);

    return playerGroup;
}

function createBullet(origin, direction) {
    const bulletGeometry = new THREE.CylinderGeometry(BULLET_RADIUS, BULLET_RADIUS, BULLET_LENGTH);
    const bulletMaterial = new THREE.MeshStandardMaterial({
        color: BULLET_COLOR,
        emissive: BULLET_COLOR,
        emissiveIntensity: 2.5,
        metalness: 0.3,
        roughness: 0.2,
        transparent: true,
        opacity: 1.0
    });
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bulletMesh.position.copy(origin);
    
    const lookAtPoint = new THREE.Vector3();
    lookAtPoint.addVectors(origin, direction);
    bulletMesh.lookAt(lookAtPoint);
    bulletMesh.rotateX(Math.PI / 2);
    
    scene.add(bulletMesh);

    // Create trail line
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(BULLET_TRAIL_LENGTH * 3);

    // Initialize all positions to origin
    for (let i = 0; i < BULLET_TRAIL_LENGTH; i++) {
        trailPositions[i * 3] = origin.x;
        trailPositions[i * 3 + 1] = origin.y;
        trailPositions[i * 3 + 2] = origin.z;
    }
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMaterial = new THREE.LineBasicMaterial({
        color: BULLET_COLOR,
        transparent: true,
        opacity: 0.6
    });

    const trailLine = new THREE.Line(trailGeometry, trailMaterial);
    scene.add(trailLine);

    const bullet = {
        mesh: bulletMesh,
        direction: direction.clone(),
        speed: 2,
        lifetime: BULLET_LIFETIME,
        age: 0,
        trail: trailLine,
        trailPositions: [origin.clone()],
        trailUpdateCounter: 0
    };
    
    bullets.push(bullet);
    return bullet;
}

function updateBullets(deltaTime) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.age += deltaTime;
        
        if (bullet.age > bullet.lifetime) {
            scene.remove(bullet.mesh);
            scene.remove(bullet.trail);

            // Dispose geometries and materials to free memory
            bullet.mesh.geometry.dispose();
            bullet.mesh.material.dispose();
            bullet.trail.geometry.dispose();
            bullet.trail.material.dispose();

            bullets.splice(i, 1);
        } else {
            bullet.mesh.position.addScaledVector(bullet.direction, bullet.speed);

            // Update trail every 2 frames
            bullet.trailUpdateCounter++;
            if (bullet.trailUpdateCounter >= 2) {
                bullet.trailPositions.unshift(bullet.mesh.position.clone());
                if (bullet.trailPositions.length > BULLET_TRAIL_LENGTH) {
                    bullet.trailPositions.pop();
                }
                bullet.trailUpdateCounter = 0;

                // Update trail geometry
                const positions = bullet.trail.geometry.attributes.position.array;
                for (let i = 0; i < bullet.trailPositions.length; i++) {
                    positions[i * 3] = bullet.trailPositions[i].x;
                    positions[i * 3 + 1] = bullet.trailPositions[i].y;
                    positions[i * 3 + 2] = bullet.trailPositions[i].z;
                }
                bullet.trail.geometry.attributes.position.needsUpdate = true;
            }

            // Slower cubic easeOut fade
            const t = bullet.age / bullet.lifetime;
            let opacity;

            if (t < FADE_START_PERCENT) {
                opacity = 1.0;  // Full opacity for first 60%
            } else {
                const fadeT = (t - FADE_START_PERCENT) / (1.0 - FADE_START_PERCENT);
                opacity = 1 - Math.pow(fadeT, 3);  // Cubic easeOut
            }

            bullet.mesh.material.opacity = opacity;
            bullet.trail.material.opacity = opacity * 0.6;  // Trail slightly more transparent
        }
    }
}

function setupControls() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
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

function onMouseMove(event) {
    yaw -= event.movementX * mouseSensitivity;
    pitch -= event.movementY * mouseSensitivity;
    
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
}

function onMouseDown(event) {
    if (event.button === 0) {
        shoot();
    }
}

function shoot() {
    if (isDead) return;

    camera.getWorldDirection(shootDirection);

    const bulletOrigin = new THREE.Vector3();
    camera.getWorldPosition(bulletOrigin);
    createBullet(bulletOrigin, shootDirection);

    raycaster.set(camera.position, shootDirection);

    const wallHits = raycaster.intersectObjects(obstacleMeshes, false);
    const wallDistance = wallHits.length > 0 ? wallHits[0].distance : Infinity;

    const playerHits = [];
    for (let playerId in players) {
        if (playerId !== myPlayerId && players[playerId].mesh) {
            const hits = raycaster.intersectObject(players[playerId].mesh, true);
            hits.forEach(hit => {
                playerHits.push({ hit, playerId });
            });
        }
    }

    if (playerHits.length > 0) {
        playerHits.sort((a, b) => a.hit.distance - b.hit.distance);
        const closest = playerHits[0];

        if (closest.hit.distance < wallDistance) {
            socket.emit('hit', {
                playerId: closest.playerId,
                damage: 25
            });
        }
    }

    socket.emit('shoot', {
        ray: {
            origin: camera.position.toArray(),
            direction: shootDirection.toArray()
        }
    });

    if (weaponMesh) {
        weaponMesh.position.z += 0.05;
        setTimeout(() => {
            weaponMesh.position.z -= 0.05;
        }, 100);
    }
}

function connectToServer() {
    socket = io({
        query: { playerName: pendingPlayerName || '' }
    });

    socket.on('init', (data) => {
        myPlayerId = data.id;
        myPlayerData = data.playerData;
        
        document.getElementById('playerName').textContent = myPlayerData.name;
        
        camera.position.set(
            myPlayerData.position.x,
            myPlayerData.position.y,
            myPlayerData.position.z
        );
        
        for (let id in data.players) {
            if (id !== myPlayerId) {
                addPlayer(data.players[id]);
            }
        }
    });
    
    socket.on('playerJoined', (playerData) => {
        addPlayer(playerData);
    });
    
    socket.on('playerMoved', (data) => {
        if (players[data.id]) {
            players[data.id].mesh.position.set(
                data.position.x,
                data.position.y - 1.0,  // Offset so feet touch ground
                data.position.z
            );
            players[data.id].mesh.rotation.y = data.rotation.y;
        }
    });
    
    socket.on('playerShot', (data) => {
        const origin = new THREE.Vector3().fromArray(data.ray.origin);
        const direction = new THREE.Vector3().fromArray(data.ray.direction);
        createBullet(origin, direction);
    });
    
    socket.on('hpUpdate', (data) => {
        if (data.playerId === myPlayerId) {
            currentHP = data.hp;
            updateHPDisplay();
        }
    });
    
    socket.on('playerDied', (data) => {
        if (data.playerId === myPlayerId) {
            isDead = true;
        } else if (players[data.playerId]) {
            players[data.playerId].mesh.visible = false;
        }
    });
    
    socket.on('playerRespawn', (data) => {
        if (data.playerId === myPlayerId) {
            isDead = false;
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
                data.position.y - 1.0,  // Offset so feet touch ground
                data.position.z
            );
        }
    });
    
    socket.on('playerLeft', (playerId) => {
        removePlayer(playerId);
    });
}

function addPlayer(playerData) {
    const playerGroup = createBlockyCharacter(playerData.colorScheme, playerData.name);
    playerGroup.position.set(
        playerData.position.x,
        playerData.position.y - 1.0,  // Offset so feet touch ground
        playerData.position.z
    );
    scene.add(playerGroup);

    players[playerData.id] = {
        mesh: playerGroup,
        data: playerData
    };
}

function removePlayer(playerId) {
    if (players[playerId]) {
        scene.remove(players[playerId].mesh);
        delete players[playerId];
    }
}

function updateHPDisplay() {
    document.getElementById('hpText').textContent = `HP: ${currentHP}`;
    document.getElementById('hpFill').style.width = `${currentHP}%`;
    
    const hpFill = document.getElementById('hpFill');
    if (currentHP > 60) {
        hpFill.style.background = 'linear-gradient(90deg, #00ff00, #44ff44)';
    } else if (currentHP > 30) {
        hpFill.style.background = 'linear-gradient(90deg, #ffff00, #ffff44)';
    } else {
        hpFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
    }
}

function updateMovement() {
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();

    direction.x = Math.sin(yaw);
    direction.z = Math.cos(yaw);
    direction.normalize();

    right.x = Math.sin(yaw + Math.PI / 2);
    right.z = Math.cos(yaw + Math.PI / 2);
    right.normalize();

    let newX = camera.position.x;
    let newZ = camera.position.z;

    if (moveForward) {
        newX -= direction.x * moveSpeed;
        newZ -= direction.z * moveSpeed;
    }
    if (moveBackward) {
        newX += direction.x * moveSpeed;
        newZ += direction.z * moveSpeed;
    }
    if (moveLeft) {
        newX -= right.x * moveSpeed;
        newZ -= right.z * moveSpeed;
    }
    if (moveRight) {
        newX += right.x * moveSpeed;
        newZ += right.z * moveSpeed;
    }

    if (!checkCollision(newX, camera.position.z)) {
        camera.position.x = newX;
    }
    if (!checkCollision(camera.position.x, newZ)) {
        camera.position.z = newZ;
    }

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

let clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    updateMovement();
    updateBullets(deltaTime);

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

init();
