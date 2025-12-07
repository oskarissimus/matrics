const PORT = process.env.PORT || 3000;
const PLAYER_RADIUS = 0.5;
const DEFAULT_HP = 100;
const RESPAWN_DELAY = 3000;
const EYE_HEIGHT = 1.6;

const COLOR_PALETTES = [
    { primary: 0xff3333, secondary: 0x3366ff, accent: 0xffcc00 },
    { primary: 0x00cc66, secondary: 0xff6600, accent: 0x9933ff },
    { primary: 0x3399ff, secondary: 0xff3399, accent: 0x66ff66 },
    { primary: 0xff9900, secondary: 0x00ccff, accent: 0xff3366 },
    { primary: 0xcc33ff, secondary: 0xffcc33, accent: 0x33ff99 },
    { primary: 0xff6633, secondary: 0x33ffcc, accent: 0x6633ff },
    { primary: 0x66ff33, secondary: 0xff3399, accent: 0x3366ff },
    { primary: 0xff3366, secondary: 0x66ff99, accent: 0xffaa00 },
    { primary: 0x33ccff, secondary: 0xff6633, accent: 0xcc33ff },
    { primary: 0xffcc00, secondary: 0x00ff99, accent: 0xff0066 }
];

module.exports = {
    PORT,
    PLAYER_RADIUS,
    DEFAULT_HP,
    RESPAWN_DELAY,
    EYE_HEIGHT,
    COLOR_PALETTES
};
