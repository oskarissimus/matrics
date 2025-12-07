import { gameState, networkState } from '../state.js';
import { STORAGE_KEY } from '../constants.js';
import { showClickToPlayOverlay } from './overlay.js';

export function loadSavedName() {
    try {
        return localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
        return '';
    }
}

export function saveName(name) {
    try {
        localStorage.setItem(STORAGE_KEY, name);
    } catch (e) {
    }
}

export function validatePlayerName(name) {
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
        return { valid: false, error: 'Name must be at least 3 characters' };
    }
    if (trimmedName.length > 20) {
        return { valid: false, error: 'Name must be 20 characters or less' };
    }
    const validPattern = /^[a-zA-Z0-9 .,!?'-]+$/;
    if (!validPattern.test(trimmedName)) {
        return { valid: false, error: 'Only letters, numbers, spaces, and basic punctuation allowed' };
    }
    return { valid: true, name: trimmedName };
}

export function generateDefaultName() {
    return 'Guest' + Math.floor(1000 + Math.random() * 9000);
}

export function initUsername() {
    let savedName = loadSavedName();
    let validation = validatePlayerName(savedName);

    if (!validation.valid) {
        savedName = generateDefaultName();
        saveName(savedName);
        validation = { valid: true, name: savedName };
    }

    gameState.pendingPlayerName = validation.name;
    document.getElementById('currentUsername').textContent = validation.name;
    showClickToPlayOverlay();
}

export function startInlineEdit() {
    const username = document.getElementById('currentUsername');
    const input = document.getElementById('inlineNameInput');
    const editBtn = document.getElementById('editUsernameBtn');
    const saveBtn = document.getElementById('saveUsernameBtn');
    const cancelBtn = document.getElementById('cancelUsernameBtn');

    input.value = username.textContent;
    username.classList.add('hidden');
    editBtn.classList.add('hidden');
    input.classList.remove('hidden');
    saveBtn.classList.remove('hidden');
    cancelBtn.classList.remove('hidden');
    input.focus();
    input.select();
}

export function saveInlineEdit() {
    const input = document.getElementById('inlineNameInput');
    const validation = validatePlayerName(input.value);

    if (validation.valid) {
        saveName(validation.name);
        document.getElementById('currentUsername').textContent = validation.name;

        if (networkState.socket && networkState.socket.connected) {
            networkState.socket.emit('changeName', validation.name);
        } else {
            gameState.pendingPlayerName = validation.name;
        }

        cancelInlineEdit();
    } else {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
    }
}

export function cancelInlineEdit() {
    const username = document.getElementById('currentUsername');
    const input = document.getElementById('inlineNameInput');
    const editBtn = document.getElementById('editUsernameBtn');
    const saveBtn = document.getElementById('saveUsernameBtn');
    const cancelBtn = document.getElementById('cancelUsernameBtn');

    username.classList.remove('hidden');
    editBtn.classList.remove('hidden');
    input.classList.add('hidden');
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    input.classList.remove('error');
}
