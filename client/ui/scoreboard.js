import { gameState, uiState } from '../state.js';

export function updateScoreboardVisibility() {
    const scoreboard = document.getElementById('scoreboard');
    const deathMessage = document.getElementById('deathMessage');

    if (gameState.showScoreboard || gameState.isDead) {
        scoreboard.classList.add('visible');
        renderScoreboard();
    } else {
        scoreboard.classList.remove('visible');
    }

    if (gameState.isDead) {
        deathMessage.classList.add('visible');
    } else {
        deathMessage.classList.remove('visible');
    }
}

export function renderScoreboard() {
    const tbody = document.getElementById('scoreboardBody');
    tbody.innerHTML = '';

    uiState.scoreboardData.forEach(player => {
        const row = document.createElement('tr');
        if (player.id === gameState.myPlayerId) {
            row.className = 'me';
        }
        row.innerHTML = `<td>${player.name}</td><td>${player.kills}</td><td>${player.deaths}</td>`;
        tbody.appendChild(row);
    });
}
