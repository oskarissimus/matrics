import { gameState } from '../state.js';

export function showClickToPlayOverlay() {
    if (gameState.myPlayerData) {
        document.getElementById('currentUsername').textContent = gameState.myPlayerData.name;
    }
    document.getElementById('clickToPlayOverlay').classList.remove('hidden');
}

export function hideClickToPlayOverlay() {
    document.getElementById('clickToPlayOverlay').classList.add('hidden');
}
