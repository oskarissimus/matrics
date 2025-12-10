import { gameState, performanceState } from '../state.js';
import { HP } from '../constants.js';

let perfElement = null;
let accumulatedTime = 0;
let frameCount = 0;

export function updateHPDisplay() {
    document.getElementById('hpText').textContent = `HP: ${gameState.currentHP}`;
    document.getElementById('hpFill').style.width = `${gameState.currentHP}%`;

    const hpFill = document.getElementById('hpFill');
    if (gameState.currentHP > HP.GREEN_THRESHOLD) {
        hpFill.style.background = 'linear-gradient(90deg, #00ff00, #44ff44)';
    } else if (gameState.currentHP > HP.YELLOW_THRESHOLD) {
        hpFill.style.background = 'linear-gradient(90deg, #ffff00, #ffff44)';
    } else {
        hpFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
    }
}

export function updateFPS(deltaTime) {
    frameCount++;
    accumulatedTime += deltaTime;

    if (accumulatedTime >= 0.5) {
        performanceState.fps = Math.round(frameCount / accumulatedTime);
        frameCount = 0;
        accumulatedTime = 0;
        updatePerfDisplay();
    }
}

export function updatePing(ping) {
    performanceState.ping = ping;
    updatePerfDisplay();
}

function updatePerfDisplay() {
    if (!perfElement) {
        perfElement = document.getElementById('perfStats');
        if (!perfElement) {
            perfElement = document.createElement('div');
            perfElement.id = 'perfStats';
            document.body.appendChild(perfElement);
        }
    }
    perfElement.textContent = `FPS: ${performanceState.fps} | Ping: ${performanceState.ping}ms`;
}
