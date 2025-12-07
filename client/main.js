import { initRenderer } from './core/renderer.js';
import { startGameLoop } from './core/game-loop.js';
import { setupControls } from './input/controls.js';
import { setupConsoleInput } from './ui/console.js';
import { initUsername } from './ui/username.js';
import { loadMap } from './map/loader.js';
import { createWeapon } from './combat/weapon.js';

function init() {
    initRenderer();
    loadMap('default');
    createWeapon();
    setupControls();
    setupConsoleInput();
    initUsername();
    startGameLoop();
}

init();
