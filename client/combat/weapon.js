import * as THREE from 'three';
import { sceneState, weaponState, gameState, meleeState } from '../state.js';
import { WEAPONS, DEFAULT_WEAPON, WEAPON_SWITCH_DURATION } from '../constants.js';
import { getTexture } from '../core/texture-generator.js';

function createKnifeModel() {
    const group = new THREE.Group();

    const bladeMaterial = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        shininess: 150,
        specular: 0xffffff
    });

    const bladeGeometry = new THREE.BoxGeometry(0.12, 0.008, 0.025);
    const bladeMesh = new THREE.Mesh(bladeGeometry, bladeMaterial);
    bladeMesh.position.set(-0.08, 0, 0);
    group.add(bladeMesh);

    const edgeMaterial = new THREE.MeshPhongMaterial({
        color: 0xeeeeee,
        shininess: 200,
        specular: 0xffffff
    });
    const edgeGeometry = new THREE.BoxGeometry(0.12, 0.003, 0.008);
    const edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edgeMesh.position.set(-0.08, -0.004, -0.015);
    group.add(edgeMesh);

    const tipGeometry = new THREE.BufferGeometry();
    const tipVertices = new Float32Array([
        -0.14, 0.005, 0.015,
        -0.14, -0.005, 0.015,
        -0.18, 0, -0.01,
        -0.14, 0.005, -0.015,
        -0.14, -0.005, -0.015,
        -0.18, 0, -0.01,
    ]);
    tipGeometry.setAttribute('position', new THREE.BufferAttribute(tipVertices, 3));
    tipGeometry.computeVertexNormals();
    const tipMesh = new THREE.Mesh(tipGeometry, bladeMaterial);
    group.add(tipMesh);

    const tipBoxGeometry = new THREE.BoxGeometry(0.04, 0.008, 0.025);
    const tipBoxMesh = new THREE.Mesh(tipBoxGeometry, bladeMaterial);
    tipBoxMesh.position.set(-0.16, 0, 0);
    tipBoxMesh.rotation.z = 0.15;
    group.add(tipBoxMesh);

    const serrationMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        shininess: 100
    });
    for (let i = 0; i < 5; i++) {
        const toothGeometry = new THREE.ConeGeometry(0.004, 0.008, 3);
        const toothMesh = new THREE.Mesh(toothGeometry, serrationMaterial);
        toothMesh.rotation.z = -Math.PI / 2;
        toothMesh.position.set(-0.05 - i * 0.015, 0.008, 0);
        group.add(toothMesh);
    }

    const guardMaterial = new THREE.MeshPhongMaterial({
        color: 0x222222,
        shininess: 80,
        specular: 0x333333
    });
    const guardGeometry = new THREE.BoxGeometry(0.01, 0.035, 0.04);
    const guardMesh = new THREE.Mesh(guardGeometry, guardMaterial);
    guardMesh.position.set(-0.015, 0, 0);
    group.add(guardMesh);

    const handleMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        shininess: 20,
        specular: 0x222222
    });
    const handleGeometry = new THREE.BoxGeometry(0.09, 0.028, 0.032);
    const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.position.set(0.04, 0, 0);
    group.add(handleMesh);

    const gripMaterial = new THREE.MeshPhongMaterial({
        color: 0x2a2d2a,
        shininess: 10
    });
    for (let i = 0; i < 4; i++) {
        const gripGeometry = new THREE.BoxGeometry(0.015, 0.03, 0.034);
        const gripMesh = new THREE.Mesh(gripGeometry, gripMaterial);
        gripMesh.position.set(0.01 + i * 0.02, 0, 0);
        group.add(gripMesh);
    }

    const pommelMaterial = new THREE.MeshPhongMaterial({
        color: 0x222222,
        shininess: 60
    });
    const pommelGeometry = new THREE.BoxGeometry(0.015, 0.032, 0.036);
    const pommelMesh = new THREE.Mesh(pommelGeometry, pommelMaterial);
    pommelMesh.position.set(0.095, 0, 0);
    group.add(pommelMesh);

    group.rotation.y = Math.PI;

    return group;
}

function createPistolModel() {
    const group = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(0.06, 0.1, 0.25);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(0, 0, -0.05);
    group.add(bodyMesh);

    const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.15);
    const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0.02, -0.25);
    group.add(barrelMesh);

    const handleGeometry = new THREE.BoxGeometry(0.05, 0.12, 0.06);
    const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3c28 });
    const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.position.set(0, -0.08, 0.05);
    group.add(handleMesh);

    return group;
}

function createRifleModel() {
    const group = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(0, 0, -0.2);
    group.add(bodyMesh);

    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
    const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0.02, -0.75);
    group.add(barrelMesh);

    const handleGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
    const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3c28 });
    const handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.position.set(0, -0.1, 0.1);
    group.add(handleMesh);

    const scopeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15);
    const scopeMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const scopeMesh = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scopeMesh.rotation.x = Math.PI / 2;
    scopeMesh.position.set(0, 0.1, -0.3);
    group.add(scopeMesh);

    return group;
}

const weaponModelCreators = {
    knife: createKnifeModel,
    pistol: createPistolModel,
    rifle: createRifleModel
};

export function initWeapons() {
    for (const weaponId in WEAPONS) {
        const config = WEAPONS[weaponId];
        const createModel = weaponModelCreators[weaponId];
        if (createModel) {
            const mesh = createModel();
            mesh.position.set(config.position.x, config.position.y, config.position.z);
            mesh.rotation.y = config.rotationY;
            mesh.visible = false;
            sceneState.camera.add(mesh);
            weaponState.weapons[weaponId] = mesh;
        }
    }

    weaponState.currentWeaponId = DEFAULT_WEAPON;
    weaponState.previousWeaponId = DEFAULT_WEAPON;
    weaponState.weapons[DEFAULT_WEAPON].visible = true;
    sceneState.weaponMesh = weaponState.weapons[DEFAULT_WEAPON];
}

export function getCurrentWeapon() {
    return WEAPONS[weaponState.currentWeaponId];
}

export function canFire() {
    if (weaponState.isSwitching) return false;
    if (meleeState.isAttacking) return false;
    const weapon = getCurrentWeapon();
    const now = Date.now();
    const rate = weapon.attackRate || weapon.fireRate;
    return now - weaponState.lastFireTime >= rate;
}

export function recordFire() {
    weaponState.lastFireTime = Date.now();
}

function animateWeaponSwitch(fromMesh, toMesh, toConfig) {
    weaponState.isSwitching = true;
    const halfDuration = WEAPON_SWITCH_DURATION / 2;
    const lowerAmount = 0.3;

    const fromStartY = fromMesh.position.y;
    const toStartY = toConfig.position.y - lowerAmount;
    const toEndY = toConfig.position.y;

    toMesh.position.y = toStartY;

    const startTime = Date.now();

    function animateLower() {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / halfDuration, 1);
        const eased = t * t;
        fromMesh.position.y = fromStartY - (lowerAmount * eased);

        if (t < 1) {
            requestAnimationFrame(animateLower);
        } else {
            fromMesh.visible = false;
            toMesh.visible = true;
            animateRaise();
        }
    }

    function animateRaise() {
        const raiseStart = Date.now();

        function raise() {
            const elapsed = Date.now() - raiseStart;
            const t = Math.min(elapsed / halfDuration, 1);
            const eased = 1 - (1 - t) * (1 - t);
            toMesh.position.y = toStartY + ((toEndY - toStartY) * eased);

            if (t < 1) {
                requestAnimationFrame(raise);
            } else {
                toMesh.position.y = toEndY;
                weaponState.isSwitching = false;
            }
        }
        raise();
    }

    animateLower();
}

export function switchWeapon(weaponId) {
    if (weaponState.isSwitching) return;
    if (weaponId === weaponState.currentWeaponId) return;
    if (!WEAPONS[weaponId]) return;
    if (gameState.isDead) return;

    const fromMesh = weaponState.weapons[weaponState.currentWeaponId];
    const toMesh = weaponState.weapons[weaponId];
    const toConfig = WEAPONS[weaponId];

    weaponState.previousWeaponId = weaponState.currentWeaponId;
    weaponState.currentWeaponId = weaponId;
    sceneState.weaponMesh = toMesh;

    animateWeaponSwitch(fromMesh, toMesh, toConfig);
}

export function switchWeaponBySlot(slot) {
    for (const weaponId in WEAPONS) {
        if (WEAPONS[weaponId].slot === slot) {
            switchWeapon(weaponId);
            return;
        }
    }
}

export function switchToPreviousWeapon() {
    if (weaponState.previousWeaponId && weaponState.previousWeaponId !== weaponState.currentWeaponId) {
        switchWeapon(weaponState.previousWeaponId);
    }
}

export function triggerRecoil() {
    const weapon = getCurrentWeapon();
    const mesh = weaponState.weapons[weaponState.currentWeaponId];
    if (mesh && weapon) {
        mesh.position.z += weapon.recoilOffset;
        setTimeout(() => {
            mesh.position.z -= weapon.recoilOffset;
        }, weapon.recoilDuration);
    }
}

export function hideAllWeapons() {
    Object.values(weaponState.weapons).forEach(mesh => {
        mesh.visible = false;
    });
}

export function showCurrentWeapon() {
    hideAllWeapons();
    if (weaponState.weapons[weaponState.currentWeaponId]) {
        weaponState.weapons[weaponState.currentWeaponId].visible = true;
    }
}
