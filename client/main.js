import { initRenderer } from './core/renderer.js';
import { startGameLoop } from './core/game-loop.js';
import { setupControls } from './input/controls.js';
import { setupConsoleInput } from './ui/console.js';
import { initUsername } from './ui/username.js';
import { loadMap } from './map/loader.js';
import { initWeapons } from './combat/weapon.js';
import { initWeaponDebug } from './debug/weapon-debug.js';

function init() {
    initRenderer();
    loadMap('default');
    initWeapons();
    setupControls();
    setupConsoleInput();
    initUsername();
    initWeaponDebug();
    startGameLoop();
}

init();
