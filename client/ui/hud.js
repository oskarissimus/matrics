import { gameState } from '../state.js';
import { HP } from '../constants.js';

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
