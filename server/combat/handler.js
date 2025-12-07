const serverState = require('../state.js');
const { DEFAULT_HP, RESPAWN_DELAY } = require('../constants.js');
const { getSpawnPosition } = require('../players/spawning.js');
const { getScoreboard } = require('../players/manager.js');

function handleHit(io, attackerId, targetId, damage) {
    const target = serverState.players[targetId];
    if (!target || target.isDead) return;

    target.hp -= damage;

    io.emit('hpUpdate', {
        playerId: targetId,
        hp: target.hp
    });

    if (target.hp <= 0) {
        handleDeath(io, attackerId, targetId);
    }
}

function handleDeath(io, killerId, victimId) {
    const victim = serverState.players[victimId];
    const killer = serverState.players[killerId];

    victim.isDead = true;
    victim.deaths++;

    if (killer) {
        killer.kills++;
    }

    io.emit('playerDied', {
        playerId: victimId,
        killerId: killerId
    });

    io.emit('scoreUpdate', getScoreboard());

    scheduleRespawn(io, victimId);
}

function scheduleRespawn(io, playerId) {
    setTimeout(() => {
        const player = serverState.players[playerId];
        if (player) {
            player.hp = DEFAULT_HP;
            player.isDead = false;
            player.position = getSpawnPosition();

            io.emit('playerRespawn', {
                playerId: playerId,
                position: player.position,
                hp: DEFAULT_HP
            });
        }
    }, RESPAWN_DELAY);
}

module.exports = {
    handleHit
};
