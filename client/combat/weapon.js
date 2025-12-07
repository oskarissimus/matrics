import * as THREE from 'three';
import { sceneState, weaponState, gameState } from '../state.js';
import { WEAPONS, DEFAULT_WEAPON, WEAPON_SWITCH_DURATION } from '../constants.js';

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
    const weapon = getCurrentWeapon();
    const now = Date.now();
    return now - weaponState.lastFireTime >= weapon.fireRate;
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
