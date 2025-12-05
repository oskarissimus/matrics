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

const bullets = [];

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

    createWeapon();
    
    scene.add(camera);

    setupControls();

    connectToServer();

    window.addEventListener('resize', onWindowResize);

    animate();
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

function createBlockyCharacter(color, playerName) {
    const playerGroup = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({ color: color });

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMesh = new THREE.Mesh(headGeo, material);
    headMesh.position.set(0, 1.45, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    playerGroup.add(headMesh);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const torsoMesh = new THREE.Mesh(torsoGeo, material);
    torsoMesh.position.set(0, 0.9, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    playerGroup.add(torsoMesh);

    // Left Arm
    const armGeo = new THREE.BoxGeometry(0.25, 0.7, 0.25);
    const leftArmMesh = new THREE.Mesh(armGeo, material);
    leftArmMesh.position.set(-0.45, 0.95, 0);
    leftArmMesh.castShadow = true;
    leftArmMesh.receiveShadow = true;
    playerGroup.add(leftArmMesh);

    // Right Arm
    const rightArmMesh = new THREE.Mesh(armGeo, material);
    rightArmMesh.position.set(0.45, 0.95, 0);
    rightArmMesh.castShadow = true;
    rightArmMesh.receiveShadow = true;
    playerGroup.add(rightArmMesh);

    // Left Leg
    const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    const leftLegMesh = new THREE.Mesh(legGeo, material);
    leftLegMesh.position.set(-0.175, 0.375, 0);
    leftLegMesh.castShadow = true;
    leftLegMesh.receiveShadow = true;
    playerGroup.add(leftLegMesh);

    // Right Leg
    const rightLegMesh = new THREE.Mesh(legGeo, material);
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
    const bulletGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.3);
    const bulletMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00
    });
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bulletMesh.position.copy(origin);
    
    const lookAtPoint = new THREE.Vector3();
    lookAtPoint.addVectors(origin, direction);
    bulletMesh.lookAt(lookAtPoint);
    bulletMesh.rotateX(Math.PI / 2);
    
    scene.add(bulletMesh);
    
    const bullet = {
        mesh: bulletMesh,
        direction: direction.clone(),
        speed: 2,
        lifetime: 1,
        age: 0
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
            bullets.splice(i, 1);
        } else {
            bullet.mesh.position.addScaledVector(bullet.direction, bullet.speed);
            
            const opacity = 1 - (bullet.age / bullet.lifetime);
            bullet.mesh.material.opacity = opacity;
            bullet.mesh.material.transparent = true;
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
    camera.getWorldDirection(shootDirection);
    
    const bulletOrigin = new THREE.Vector3();
    camera.getWorldPosition(bulletOrigin);
    createBullet(bulletOrigin, shootDirection);
    
    raycaster.set(camera.position, shootDirection);

    const intersects = [];
    for (let playerId in players) {
        if (playerId !== myPlayerId && players[playerId].mesh) {
            intersects.push(...raycaster.intersectObject(players[playerId].mesh, true));
        }
    }

    if (intersects.length > 0) {
        const hit = intersects[0];
        // hit.object is the individual body part, get parent group
        const hitGroup = hit.object.parent;
        const hitPlayerId = Object.keys(players).find(id =>
            players[id].mesh === hitGroup
        );

        if (hitPlayerId) {
            socket.emit('hit', {
                playerId: hitPlayerId,
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
    socket = io();
    
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
        } else if (players[data.playerId]) {
            players[data.playerId].mesh.visible = false;
        }
    });
    
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
    const playerGroup = createBlockyCharacter(playerData.color, playerData.name);
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
