import { render, getDeltaTime } from './renderer.js';
import { updateMovement } from '../player/movement.js';
import { updateBullets } from '../combat/bullets.js';
import { updateLabelVisibility } from '../player/remote-players.js';
import { updateFPS } from '../ui/hud.js';

export function startGameLoop() {
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = getDeltaTime();

    updateMovement(deltaTime);
    updateBullets(deltaTime);

    render();
    updateLabelVisibility();
    updateFPS(deltaTime);
}
