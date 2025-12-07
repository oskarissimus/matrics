const serverState = require('../state.js');

function isNameTaken(name, excludeSocketId = null) {
    const normalizedName = name.toLowerCase();
    for (const [socketId, player] of Object.entries(serverState.players)) {
        if (excludeSocketId && socketId === excludeSocketId) continue;
        if (player.name.toLowerCase() === normalizedName) {
            return true;
        }
    }
    return false;
}

function validatePlayerName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false };
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 20) {
        return { valid: false };
    }
    const validPattern = /^[a-zA-Z0-9 .,!?'-]+$/;
    if (!validPattern.test(trimmedName)) {
        return { valid: false };
    }
    return { valid: true, name: trimmedName };
}

module.exports = { validatePlayerName, isNameTaken };
