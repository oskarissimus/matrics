import { sceneState, gameState, networkState } from '../state.js';
import { onKeyDown, onKeyUp } from './keyboard.js';
import { onMouseMove, onMouseDown } from './mouse.js';
import { showClickToPlayOverlay, hideClickToPlayOverlay } from '../ui/overlay.js';
import { startInlineEdit, saveInlineEdit, cancelInlineEdit } from '../ui/username.js';
import { connectToServer } from '../networking/socket.js';

export function setupControls() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    sceneState.renderer.domElement.addEventListener('click', () => {
        sceneState.renderer.domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === sceneState.renderer.domElement) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mousedown', onMouseDown);
            hideClickToPlayOverlay();
        } else {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousedown', onMouseDown);
            if (gameState.gameStarted) {
                showClickToPlayOverlay();
            }
        }
    });

    document.getElementById('clickToPlayOverlay').addEventListener('click', (e) => {
        const clickedId = e.target.id;
        const ignoreIds = ['editUsernameBtn', 'saveUsernameBtn', 'cancelUsernameBtn', 'inlineNameInput'];
        if (!ignoreIds.includes(clickedId)) {
            hideClickToPlayOverlay();
            if (!networkState.socket || !networkState.socket.connected) {
                connectToServer();
            }
            sceneState.renderer.domElement.requestPointerLock();
        }
    });

    document.getElementById('editUsernameBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        startInlineEdit();
    });

    document.getElementById('saveUsernameBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        saveInlineEdit();
    });

    document.getElementById('cancelUsernameBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        cancelInlineEdit();
    });

    document.getElementById('inlineNameInput').addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            saveInlineEdit();
        }
        if (e.key === 'Escape') {
            cancelInlineEdit();
        }
    });

    document.getElementById('inlineNameInput').addEventListener('click', (e) => {
        e.stopPropagation();
    });
}
