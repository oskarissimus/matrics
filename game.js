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
let scoreboardData = [];
let showScoreboard = false;

const bullets = [];

const collisionObstacles = [];
const obstacleMeshes = [];
const MAP_BOUNDARY = 48;
const PLAYER_RADIUS = 0.5;

let currentMapName = 'default';
let mapElements = [];
let floorMesh = null;
let gridHelper = null;
let consoleOpen = false;
let consoleHistory = [];
let consoleHistoryIndex = -1;

const STORAGE_KEY = 'matrics_player_name';
let pendingPlayerName = null;
let gameStarted = false;

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

    loadMap('default');

    createWeapon();
    
    scene.add(camera);

    setupControls();
    setupConsoleInput();

    initUsername();

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

function generateDefaultName() {
    return 'Guest' + Math.floor(1000 + Math.random() * 9000);
}

function initUsername() {
    let savedName = loadSavedName();
    let validation = validatePlayerName(savedName);

    if (!validation.valid) {
        savedName = generateDefaultName();
        saveName(savedName);
        validation = { valid: true, name: savedName };
    }

    pendingPlayerName = validation.name;
    document.getElementById('currentUsername').textContent = validation.name;
    showClickToPlayOverlay();
}

function startInlineEdit() {
    const username = document.getElementById('currentUsername');
    const input = document.getElementById('inlineNameInput');
    const editBtn = document.getElementById('editUsernameBtn');
    const saveBtn = document.getElementById('saveUsernameBtn');
    const cancelBtn = document.getElementById('cancelUsernameBtn');

    input.value = username.textContent;
    username.classList.add('hidden');
    editBtn.classList.add('hidden');
    input.classList.remove('hidden');
    saveBtn.classList.remove('hidden');
    cancelBtn.classList.remove('hidden');
    input.focus();
    input.select();
}

function saveInlineEdit() {
    const input = document.getElementById('inlineNameInput');
    const validation = validatePlayerName(input.value);

    if (validation.valid) {
        saveName(validation.name);
        document.getElementById('currentUsername').textContent = validation.name;

        if (socket && socket.connected) {
            socket.emit('changeName', validation.name);
        } else {
            pendingPlayerName = validation.name;
        }

        cancelInlineEdit();
    } else {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
    }
}

function cancelInlineEdit() {
    const username = document.getElementById('currentUsername');
    const input = document.getElementById('inlineNameInput');
    const editBtn = document.getElementById('editUsernameBtn');
    const saveBtn = document.getElementById('saveUsernameBtn');
    const cancelBtn = document.getElementById('cancelUsernameBtn');

    username.classList.remove('hidden');
    editBtn.classList.remove('hidden');
    input.classList.add('hidden');
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    input.classList.remove('error');
}

function showClickToPlayOverlay() {
    if (myPlayerData) {
        document.getElementById('currentUsername').textContent = myPlayerData.name;
    }
    document.getElementById('clickToPlayOverlay').classList.remove('hidden');
}

function hideClickToPlayOverlay() {
    document.getElementById('clickToPlayOverlay').classList.add('hidden');
}

function toggleConsole() {
    consoleOpen = !consoleOpen;
    const consoleEl = document.getElementById('gameConsole');

    if (consoleOpen) {
        document.exitPointerLock();
        consoleEl.classList.add('visible');
        document.getElementById('consoleInput').focus();
    } else {
        consoleEl.classList.remove('visible');
        if (gameStarted && document.getElementById('clickToPlayOverlay').classList.contains('hidden')) {
            renderer.domElement.requestPointerLock();
        }
    }
}

function handleConsoleCommand(command) {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === 'map' && parts[1]) {
        const mapName = parts[1].toLowerCase();
        if (MapDefinitions.maps[mapName]) {
            socket.emit('changeMap', mapName);
            addConsoleOutput('Requesting map change to: ' + mapName);
        } else {
            addConsoleOutput('Unknown map: ' + mapName + '. Available: ' + Object.keys(MapDefinitions.maps).join(', '));
        }
    } else if (cmd === 'maps') {
        addConsoleOutput('Available maps: ' + Object.keys(MapDefinitions.maps).join(', '));
    } else if (cmd === 'help') {
        addConsoleOutput('Commands: map <name>, maps, help, clear');
    } else if (cmd === 'clear') {
        document.getElementById('consoleOutput').innerHTML = '';
    } else if (cmd) {
        addConsoleOutput('Unknown command: ' + cmd);
    }

    if (command.trim()) {
        consoleHistory.unshift(command);
        consoleHistoryIndex = -1;
    }
}

function addConsoleOutput(text) {
    const output = document.getElementById('consoleOutput');
    const line = document.createElement('div');
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function setupConsoleInput() {
    const input = document.getElementById('consoleInput');

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleConsoleCommand(input.value);
            input.value = '';
        } else if (e.key === 'Escape' || e.code === 'Backquote') {
            e.preventDefault();
            toggleConsole();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (consoleHistory.length > 0 && consoleHistoryIndex < consoleHistory.length - 1) {
                consoleHistoryIndex++;
                input.value = consoleHistory[consoleHistoryIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (consoleHistoryIndex > 0) {
                consoleHistoryIndex--;
                input.value = consoleHistory[consoleHistoryIndex];
            } else if (consoleHistoryIndex === 0) {
                consoleHistoryIndex = -1;
                input.value = '';
            }
        }
        e.stopPropagation();
    });
}

function loadMap(mapName) {
    const mapDef = MapDefinitions.maps[mapName];
    if (!mapDef) return false;

    clearMapElements();
    createFloor(mapDef.floor);

    mapDef.elements.forEach(element => {
        createMapElement(element);
    });

    currentMapName = mapName;
    return true;
}

function clearMapElements() {
    mapElements.forEach(mesh => {
        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
    });
    mapElements = [];

    if (floorMesh) {
        scene.remove(floorMesh);
        floorMesh.geometry.dispose();
        floorMesh.material.dispose();
        floorMesh = null;
    }

    if (gridHelper) {
        scene.remove(gridHelper);
        gridHelper = null;
    }

    obstacleMeshes.length = 0;
    collisionObstacles.length = 0;
}

function createFloor(floorDef) {
    const floorGeometry = new THREE.PlaneGeometry(floorDef.size, floorDef.size);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: floorDef.color });
    floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    gridHelper = new THREE.GridHelper(floorDef.size, floorDef.gridDivisions, floorDef.gridColor1, floorDef.gridColor2);
    scene.add(gridHelper);
}

function createMapElement(elementDef) {
    let geometry, mesh;

    if (elementDef.type === 'box') {
        geometry = new THREE.BoxGeometry(
            elementDef.geometry.width,
            elementDef.geometry.height,
            elementDef.geometry.depth
        );
    }

    const material = new THREE.MeshPhongMaterial({ color: elementDef.material.color });
    mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(elementDef.position.x, elementDef.position.y, elementDef.position.z);
    if (elementDef.rotation) {
        mesh.rotation.set(
            elementDef.rotation.x || 0,
            elementDef.rotation.y || 0,
            elementDef.rotation.z || 0
        );
    }

    mesh.castShadow = elementDef.castShadow !== false;
    mesh.receiveShadow = elementDef.receiveShadow !== false;

    scene.add(mesh);
    mapElements.push(mesh);
    obstacleMeshes.push(mesh);

    if (elementDef.collision && !elementDef.noCollision) {
        collisionObstacles.push(elementDef.collision);
    }

    return mesh;
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

function removeBullet(bullet, index) {
    scene.remove(bullet.mesh);
    scene.remove(bullet.trail);
    bullet.mesh.geometry.dispose();
    bullet.mesh.material.dispose();
    bullet.trail.geometry.dispose();
    bullet.trail.material.dispose();
    bullets.splice(index, 1);
}

function updateBullets(deltaTime) {
    const bulletRaycaster = new THREE.Raycaster();

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.age += deltaTime;

        if (bullet.age > bullet.lifetime) {
            removeBullet(bullet, i);
            continue;
        }

        const oldPosition = bullet.mesh.position.clone();
        bullet.mesh.position.addScaledVector(bullet.direction, bullet.speed);

        bulletRaycaster.set(oldPosition, bullet.direction);
        bulletRaycaster.far = bullet.speed;
        const hits = bulletRaycaster.intersectObjects(obstacleMeshes, false);
        if (hits.length > 0) {
            removeBullet(bullet, i);
            continue;
        }

        bullet.trailUpdateCounter++;
        if (bullet.trailUpdateCounter >= 2) {
            bullet.trailPositions.unshift(bullet.mesh.position.clone());
            if (bullet.trailPositions.length > BULLET_TRAIL_LENGTH) {
                bullet.trailPositions.pop();
            }
            bullet.trailUpdateCounter = 0;

            const positions = bullet.trail.geometry.attributes.position.array;
            for (let j = 0; j < bullet.trailPositions.length; j++) {
                positions[j * 3] = bullet.trailPositions[j].x;
                positions[j * 3 + 1] = bullet.trailPositions[j].y;
                positions[j * 3 + 2] = bullet.trailPositions[j].z;
            }
            bullet.trail.geometry.attributes.position.needsUpdate = true;
        }

        const t = bullet.age / bullet.lifetime;
        let opacity;

        if (t < FADE_START_PERCENT) {
            opacity = 1.0;
        } else {
            const fadeT = (t - FADE_START_PERCENT) / (1.0 - FADE_START_PERCENT);
            opacity = 1 - Math.pow(fadeT, 3);
        }

        bullet.mesh.material.opacity = opacity;
        bullet.trail.material.opacity = opacity * 0.6;
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
            hideClickToPlayOverlay();
        } else {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousedown', onMouseDown);
            if (gameStarted) {
                showClickToPlayOverlay();
            }
        }
    });

    document.getElementById('clickToPlayOverlay').addEventListener('click', (e) => {
        const clickedId = e.target.id;
        const ignoreIds = ['editUsernameBtn', 'saveUsernameBtn', 'cancelUsernameBtn', 'inlineNameInput'];
        if (!ignoreIds.includes(clickedId)) {
            hideClickToPlayOverlay();
            if (!socket || !socket.connected) {
                connectToServer();
            }
            renderer.domElement.requestPointerLock();
        }
    });

    document.getElementById('editUsernameBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        startInlineEdit();
    });

    document.getElementById('saveUsernameBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        saveInlineEdit();
    });

    document.getElementById('cancelUsernameBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        cancelInlineEdit();
    });

    document.getElementById('inlineNameInput').addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            saveInlineEdit();
        }
        if (e.key === 'Escape') {
            cancelInlineEdit();
        }
    });

    document.getElementById('inlineNameInput').addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

function onKeyDown(event) {
    if (event.code === 'Backquote') {
        event.preventDefault();
        toggleConsole();
        return;
    }

    if (consoleOpen) return;

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
        case 'Tab':
            event.preventDefault();
            showScoreboard = true;
            if (socket && socket.connected) {
                socket.emit('requestScoreboard');
            }
            updateScoreboardVisibility();
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
        case 'Tab':
            event.preventDefault();
            showScoreboard = false;
            updateScoreboardVisibility();
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
    if (isDead || consoleOpen) return;

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
        gameStarted = true;

        document.getElementById('playerName').textContent = myPlayerData.name;

        if (data.currentMap && data.currentMap !== currentMapName) {
            loadMap(data.currentMap);
        }

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
            updateScoreboardVisibility();
        } else if (players[data.playerId]) {
            players[data.playerId].mesh.visible = false;
        }
    });

    socket.on('scoreUpdate', (data) => {
        scoreboardData = data;
        if (showScoreboard || isDead) {
            renderScoreboard();
        }
    });

    socket.on('playerNameChanged', (data) => {
        if (data.id === myPlayerId) {
            myPlayerData.name = data.name;
            document.getElementById('playerName').textContent = data.name;
            document.getElementById('currentUsername').textContent = data.name;
        } else if (players[data.id]) {
            players[data.id].data.name = data.name;
            const nameTag = players[data.id].mesh.children.find(child => child.isCSS2DObject);
            if (nameTag) {
                nameTag.element.textContent = data.name;
            }
        }
    });

    socket.on('mapChange', (data) => {
        addConsoleOutput('Map changed to: ' + data.mapName);
        loadMap(data.mapName);
        camera.position.set(data.position.x, data.position.y, data.position.z);
        currentHP = 100;
        isDead = false;
        updateHPDisplay();
        updateScoreboardVisibility();
    });

    socket.on('consoleMessage', (message) => {
        addConsoleOutput(message);
    });

    socket.on('playerRespawn', (data) => {
        if (data.playerId === myPlayerId) {
            isDead = false;
            updateScoreboardVisibility();
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

function updateScoreboardVisibility() {
    const scoreboard = document.getElementById('scoreboard');
    const deathMessage = document.getElementById('deathMessage');

    if (showScoreboard || isDead) {
        scoreboard.classList.add('visible');
        renderScoreboard();
    } else {
        scoreboard.classList.remove('visible');
    }

    if (isDead) {
        deathMessage.classList.add('visible');
    } else {
        deathMessage.classList.remove('visible');
    }
}

function renderScoreboard() {
    const tbody = document.getElementById('scoreboardBody');
    tbody.innerHTML = '';

    scoreboardData.forEach(player => {
        const row = document.createElement('tr');
        if (player.id === myPlayerId) {
            row.className = 'me';
        }
        row.innerHTML = `<td>${player.name}</td><td>${player.kills}</td><td>${player.deaths}</td>`;
        tbody.appendChild(row);
    });
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
