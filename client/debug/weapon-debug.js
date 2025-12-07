import { weaponState, sceneState } from '../state.js';
import { WEAPONS } from '../constants.js';

let debugPanel = null;
let isDebugMode = false;

export function initWeaponDebug() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'F9') {
            toggleDebugMode();
        }
    });
}

function toggleDebugMode() {
    isDebugMode = !isDebugMode;
    if (isDebugMode) {
        createDebugPanel();
    } else {
        removeDebugPanel();
    }
}

function createDebugPanel() {
    if (debugPanel) return;

    debugPanel = document.createElement('div');
    debugPanel.id = 'weaponDebug';
    debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.85);
        color: #0f0;
        padding: 15px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        border: 1px solid #0f0;
        min-width: 300px;
    `;

    debugPanel.innerHTML = `
        <div style="margin-bottom:10px;font-size:14px;color:#ff0">WEAPON DEBUG (F9 to close)</div>
        <div style="margin-bottom:10px">
            <label>Weapon: </label>
            <select id="debugWeaponSelect" style="background:#222;color:#0f0;border:1px solid #0f0">
                ${Object.keys(WEAPONS).map(w => `<option value="${w}">${w}</option>`).join('')}
            </select>
        </div>
        <div style="display:grid;grid-template-columns:80px 1fr 60px;gap:5px;align-items:center">
            <label>Pos X:</label>
            <input type="range" id="debugPosX" min="-1" max="1" step="0.01" value="0.3">
            <span id="debugPosXVal">0.30</span>

            <label>Pos Y:</label>
            <input type="range" id="debugPosY" min="-1" max="1" step="0.01" value="-0.15">
            <span id="debugPosYVal">-0.15</span>

            <label>Pos Z:</label>
            <input type="range" id="debugPosZ" min="-1" max="0.5" step="0.01" value="-0.35">
            <span id="debugPosZVal">-0.35</span>

            <label>Rot X:</label>
            <input type="range" id="debugRotX" min="-3.14" max="3.14" step="0.05" value="0">
            <span id="debugRotXVal">0.00</span>

            <label>Rot Y:</label>
            <input type="range" id="debugRotY" min="-3.14" max="3.14" step="0.05" value="-0.2">
            <span id="debugRotYVal">-0.20</span>

            <label>Rot Z:</label>
            <input type="range" id="debugRotZ" min="-3.14" max="3.14" step="0.05" value="0">
            <span id="debugRotZVal">0.00</span>

            <label>Scale:</label>
            <input type="range" id="debugScale" min="0.5" max="3" step="0.1" value="1">
            <span id="debugScaleVal">1.0</span>
        </div>
        <div style="margin-top:15px">
            <button id="debugCopyConfig" style="background:#333;color:#0f0;border:1px solid #0f0;padding:5px 10px;cursor:pointer">
                Copy Config
            </button>
            <button id="debugResetPos" style="background:#333;color:#0f0;border:1px solid #0f0;padding:5px 10px;cursor:pointer;margin-left:5px">
                Reset
            </button>
        </div>
        <pre id="debugOutput" style="margin-top:10px;font-size:10px;color:#888"></pre>
    `;

    document.body.appendChild(debugPanel);

    const weaponSelect = document.getElementById('debugWeaponSelect');
    weaponSelect.value = weaponState.currentWeaponId;

    loadCurrentWeaponValues();

    weaponSelect.addEventListener('change', (e) => {
        import('../combat/weapon.js').then(mod => {
            mod.switchWeapon(e.target.value);
            setTimeout(loadCurrentWeaponValues, 250);
        });
    });

    ['PosX', 'PosY', 'PosZ', 'RotX', 'RotY', 'RotZ', 'Scale'].forEach(prop => {
        const input = document.getElementById(`debug${prop}`);
        const valSpan = document.getElementById(`debug${prop}Val`);
        input.addEventListener('input', () => {
            valSpan.textContent = parseFloat(input.value).toFixed(2);
            updateWeaponTransform();
        });
    });

    document.getElementById('debugCopyConfig').addEventListener('click', copyConfig);
    document.getElementById('debugResetPos').addEventListener('click', resetPosition);
}

function loadCurrentWeaponValues() {
    const mesh = weaponState.weapons[weaponState.currentWeaponId];
    if (!mesh) return;

    document.getElementById('debugPosX').value = mesh.position.x;
    document.getElementById('debugPosXVal').textContent = mesh.position.x.toFixed(2);
    document.getElementById('debugPosY').value = mesh.position.y;
    document.getElementById('debugPosYVal').textContent = mesh.position.y.toFixed(2);
    document.getElementById('debugPosZ').value = mesh.position.z;
    document.getElementById('debugPosZVal').textContent = mesh.position.z.toFixed(2);

    document.getElementById('debugRotX').value = mesh.rotation.x;
    document.getElementById('debugRotXVal').textContent = mesh.rotation.x.toFixed(2);
    document.getElementById('debugRotY').value = mesh.rotation.y;
    document.getElementById('debugRotYVal').textContent = mesh.rotation.y.toFixed(2);
    document.getElementById('debugRotZ').value = mesh.rotation.z;
    document.getElementById('debugRotZVal').textContent = mesh.rotation.z.toFixed(2);

    document.getElementById('debugScale').value = mesh.scale.x;
    document.getElementById('debugScaleVal').textContent = mesh.scale.x.toFixed(1);
}

function updateWeaponTransform() {
    const mesh = weaponState.weapons[weaponState.currentWeaponId];
    if (!mesh) return;

    mesh.position.x = parseFloat(document.getElementById('debugPosX').value);
    mesh.position.y = parseFloat(document.getElementById('debugPosY').value);
    mesh.position.z = parseFloat(document.getElementById('debugPosZ').value);

    mesh.rotation.x = parseFloat(document.getElementById('debugRotX').value);
    mesh.rotation.y = parseFloat(document.getElementById('debugRotY').value);
    mesh.rotation.z = parseFloat(document.getElementById('debugRotZ').value);

    const scale = parseFloat(document.getElementById('debugScale').value);
    mesh.scale.set(scale, scale, scale);

    updateDebugOutput();
}

function updateDebugOutput() {
    const mesh = weaponState.weapons[weaponState.currentWeaponId];
    if (!mesh) return;

    const output = document.getElementById('debugOutput');
    output.textContent = `position: { x: ${mesh.position.x.toFixed(2)}, y: ${mesh.position.y.toFixed(2)}, z: ${mesh.position.z.toFixed(2)} }
rotationY: ${mesh.rotation.y.toFixed(2)}
rotationX: ${mesh.rotation.x.toFixed(2)}
rotationZ: ${mesh.rotation.z.toFixed(2)}
scale: ${mesh.scale.x.toFixed(1)}`;
}

function copyConfig() {
    const mesh = weaponState.weapons[weaponState.currentWeaponId];
    if (!mesh) return;

    const config = `position: { x: ${mesh.position.x.toFixed(2)}, y: ${mesh.position.y.toFixed(2)}, z: ${mesh.position.z.toFixed(2)} },
rotationY: ${mesh.rotation.y.toFixed(2)},`;

    navigator.clipboard.writeText(config).then(() => {
        const btn = document.getElementById('debugCopyConfig');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Config', 1000);
    });
}

function resetPosition() {
    const config = WEAPONS[weaponState.currentWeaponId];
    const mesh = weaponState.weapons[weaponState.currentWeaponId];
    if (!mesh || !config) return;

    mesh.position.set(config.position.x, config.position.y, config.position.z);
    mesh.rotation.set(0, config.rotationY, 0);
    mesh.scale.set(1, 1, 1);

    loadCurrentWeaponValues();
    updateDebugOutput();
}

function removeDebugPanel() {
    if (debugPanel) {
        debugPanel.remove();
        debugPanel = null;
    }
}
