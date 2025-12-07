import { inputState, gameState, networkState } from '../state.js';
import { toggleConsole } from '../ui/console.js';
import { updateScoreboardVisibility } from '../ui/scoreboard.js';
import { JUMP_VELOCITY } from '../constants.js';

export function onKeyDown(event) {
    if (event.code === 'Backquote') {
        event.preventDefault();
        toggleConsole();
        return;
    }

    if (gameState.consoleOpen) return;

    switch (event.code) {
        case 'KeyW':
            inputState.moveForward = true;
            break;
        case 'KeyS':
            inputState.moveBackward = true;
            break;
        case 'KeyA':
            inputState.moveLeft = true;
            break;
        case 'KeyD':
            inputState.moveRight = true;
            break;
        case 'Tab':
            event.preventDefault();
            gameState.showScoreboard = true;
            if (networkState.socket && networkState.socket.connected) {
                networkState.socket.emit('requestScoreboard');
            }
            updateScoreboardVisibility();
            break;
        case 'Space':
            if (inputState.isGrounded) {
                inputState.velocityY = JUMP_VELOCITY;
                inputState.isGrounded = false;
            }
            break;
    }
}

export function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            inputState.moveForward = false;
            break;
        case 'KeyS':
            inputState.moveBackward = false;
            break;
        case 'KeyA':
            inputState.moveLeft = false;
            break;
        case 'KeyD':
            inputState.moveRight = false;
            break;
        case 'Tab':
            event.preventDefault();
            gameState.showScoreboard = false;
            updateScoreboardVisibility();
            break;
    }
}
