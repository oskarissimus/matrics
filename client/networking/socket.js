import { networkState, gameState } from '../state.js';
import { setupSocketEvents } from './events.js';

export function connectToServer() {
    networkState.socket = io({
        query: { playerName: gameState.pendingPlayerName || '' }
    });

    setupSocketEvents();
}

export function emit(event, data) {
    if (networkState.socket && networkState.socket.connected) {
        networkState.socket.emit(event, data);
    }
}
