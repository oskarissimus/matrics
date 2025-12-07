import { gameState, uiState, sceneState, networkState } from '../state.js';

export function toggleConsole() {
    gameState.consoleOpen = !gameState.consoleOpen;
    const consoleEl = document.getElementById('gameConsole');

    if (gameState.consoleOpen) {
        document.exitPointerLock();
        consoleEl.classList.add('visible');
        document.getElementById('consoleInput').focus();
    } else {
        consoleEl.classList.remove('visible');
        if (gameState.gameStarted && document.getElementById('clickToPlayOverlay').classList.contains('hidden')) {
            sceneState.renderer.domElement.requestPointerLock();
        }
    }
}

export function handleConsoleCommand(command) {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === 'map' && parts[1]) {
        const mapName = parts[1].toLowerCase();
        if (MapDefinitions.maps[mapName]) {
            networkState.socket.emit('changeMap', mapName);
            addConsoleOutput('Requesting map change to: ' + mapName);
        } else {
            addConsoleOutput('Unknown map: ' + mapName + '. Available: ' + Object.keys(MapDefinitions.maps).join(', '));
        }
    } else if (cmd === 'maps') {
        addConsoleOutput('Available maps: ' + Object.keys(MapDefinitions.maps).join(', '));
    } else if (cmd === 'help') {
        addConsoleOutput('Commands: map <name>, maps, help, clear');
    } else if (cmd === 'clear') {
        document.getElementById('consoleOutput').innerHTML = '';
    } else if (cmd) {
        addConsoleOutput('Unknown command: ' + cmd);
    }

    if (command.trim()) {
        uiState.consoleHistory.unshift(command);
        uiState.consoleHistoryIndex = -1;
    }
}

export function addConsoleOutput(text) {
    const output = document.getElementById('consoleOutput');
    const line = document.createElement('div');
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

export function setupConsoleInput() {
    const input = document.getElementById('consoleInput');

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleConsoleCommand(input.value);
            input.value = '';
        } else if (e.key === 'Escape' || e.code === 'Backquote') {
            e.preventDefault();
            toggleConsole();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (uiState.consoleHistory.length > 0 && uiState.consoleHistoryIndex < uiState.consoleHistory.length - 1) {
                uiState.consoleHistoryIndex++;
                input.value = uiState.consoleHistory[uiState.consoleHistoryIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (uiState.consoleHistoryIndex > 0) {
                uiState.consoleHistoryIndex--;
                input.value = uiState.consoleHistory[uiState.consoleHistoryIndex];
            } else if (uiState.consoleHistoryIndex === 0) {
                uiState.consoleHistoryIndex = -1;
                input.value = '';
            }
        }
        e.stopPropagation();
    });
}
