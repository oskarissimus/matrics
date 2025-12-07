import * as THREE from 'three';

const textureCache = new Map();

function createNoiseData(width, height) {
    const data = new Float32Array(width * height);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random();
    }
    return data;
}

function smoothNoise(noise, width, x, y) {
    const x0 = Math.floor(x) % width;
    const y0 = Math.floor(y) % width;
    const x1 = (x0 + 1) % width;
    const y1 = (y0 + 1) % width;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const v00 = noise[y0 * width + x0];
    const v10 = noise[y0 * width + x1];
    const v01 = noise[y1 * width + x0];
    const v11 = noise[y1 * width + x1];
    const i1 = v00 * (1 - fx) + v10 * fx;
    const i2 = v01 * (1 - fx) + v11 * fx;
    return i1 * (1 - fy) + i2 * fy;
}

function generateSandTexture(size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const baseR = 212, baseG = 184, baseB = 150;
    const noise = createNoiseData(size, size);
    const imageData = ctx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;

            const n1 = smoothNoise(noise, size, x * 0.05, y * 0.05);
            const n2 = smoothNoise(noise, size, x * 0.1, y * 0.1) * 0.5;
            const n3 = smoothNoise(noise, size, x * 0.2, y * 0.2) * 0.25;
            const combined = (n1 + n2 + n3) / 1.75;

            const variation = (combined - 0.5) * 60;
            const grain = (Math.random() - 0.5) * 15;

            imageData.data[i] = Math.min(255, Math.max(0, baseR + variation + grain));
            imageData.data[i + 1] = Math.min(255, Math.max(0, baseG + variation * 0.9 + grain));
            imageData.data[i + 2] = Math.min(255, Math.max(0, baseB + variation * 0.8 + grain));
            imageData.data[i + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function generateBrickTexture(size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const mortarColor = '#8B7355';
    ctx.fillStyle = mortarColor;
    ctx.fillRect(0, 0, size, size);

    const brickHeight = size / 8;
    const brickWidth = size / 4;
    const mortarWidth = 3;

    const brickColors = ['#B8956E', '#C4A07A', '#A88B62', '#D4A882', '#BE9872'];

    for (let row = 0; row < 8; row++) {
        const offset = (row % 2) * (brickWidth / 2);
        const y = row * brickHeight;

        for (let col = -1; col < 5; col++) {
            const x = col * brickWidth + offset;

            const colorIndex = Math.floor(Math.random() * brickColors.length);
            ctx.fillStyle = brickColors[colorIndex];

            ctx.fillRect(
                x + mortarWidth / 2,
                y + mortarWidth / 2,
                brickWidth - mortarWidth,
                brickHeight - mortarWidth
            );

            const gradient = ctx.createLinearGradient(x, y, x, y + brickHeight);
            gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
            gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
            ctx.fillStyle = gradient;
            ctx.fillRect(
                x + mortarWidth / 2,
                y + mortarWidth / 2,
                brickWidth - mortarWidth,
                brickHeight - mortarWidth
            );
        }
    }

    return canvas;
}

function generateConcreteTexture(size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const baseR = 139, baseG = 123, baseB = 107;
    const noise = createNoiseData(size, size);
    const imageData = ctx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;

            const n1 = smoothNoise(noise, size, x * 0.03, y * 0.03);
            const n2 = smoothNoise(noise, size, x * 0.08, y * 0.08) * 0.4;
            const combined = (n1 + n2) / 1.4;

            const variation = (combined - 0.5) * 40;
            const speckle = (Math.random() - 0.5) * 10;

            imageData.data[i] = Math.min(255, Math.max(0, baseR + variation + speckle));
            imageData.data[i + 1] = Math.min(255, Math.max(0, baseG + variation + speckle));
            imageData.data[i + 2] = Math.min(255, Math.max(0, baseB + variation + speckle));
            imageData.data[i + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    ctx.strokeStyle = 'rgba(60, 50, 40, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const startX = Math.random() * size;
        const startY = Math.random() * size;
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + (Math.random() - 0.5) * 60, startY + (Math.random() - 0.5) * 60);
        ctx.stroke();
    }

    return canvas;
}

function generateCrateTexture(size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#9C7B5C';
    ctx.fillRect(0, 0, size, size);

    const plankHeight = size / 6;
    const plankColors = ['#A88B6C', '#8C7256', '#B8956C', '#967B5A'];

    for (let i = 0; i < 6; i++) {
        const y = i * plankHeight;
        ctx.fillStyle = plankColors[i % plankColors.length];
        ctx.fillRect(0, y + 1, size, plankHeight - 2);

        ctx.strokeStyle = 'rgba(60, 40, 20, 0.3)';
        ctx.lineWidth = 1;
        for (let j = 0; j < 8; j++) {
            ctx.beginPath();
            const grainY = y + Math.random() * plankHeight;
            ctx.moveTo(0, grainY);
            ctx.bezierCurveTo(
                size * 0.25, grainY + (Math.random() - 0.5) * 3,
                size * 0.75, grainY + (Math.random() - 0.5) * 3,
                size, grainY + (Math.random() - 0.5) * 5
            );
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, y, size, 2);
        ctx.fillRect(0, y + plankHeight - 2, size, 2);
    }

    const frameWidth = 12;
    ctx.fillStyle = '#6B4423';
    ctx.fillRect(0, 0, frameWidth, size);
    ctx.fillRect(size - frameWidth, 0, frameWidth, size);
    ctx.fillRect(0, 0, size, frameWidth);
    ctx.fillRect(0, size - frameWidth, size, frameWidth);

    const nailPositions = [
        [frameWidth / 2, frameWidth / 2],
        [size - frameWidth / 2, frameWidth / 2],
        [frameWidth / 2, size - frameWidth / 2],
        [size - frameWidth / 2, size - frameWidth / 2],
        [frameWidth / 2, size / 2],
        [size - frameWidth / 2, size / 2]
    ];

    ctx.fillStyle = '#3A3A3A';
    nailPositions.forEach(([nx, ny]) => {
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    return canvas;
}

export function getTexture(type, repeatX = 1, repeatY = 1) {
    const cacheKey = `${type}_${repeatX}_${repeatY}`;

    if (textureCache.has(cacheKey)) {
        return textureCache.get(cacheKey);
    }

    let canvas;
    switch (type) {
        case 'sand':
            canvas = generateSandTexture();
            break;
        case 'brick':
            canvas = generateBrickTexture();
            break;
        case 'concrete':
            canvas = generateConcreteTexture();
            break;
        case 'crate':
            canvas = generateCrateTexture();
            break;
        default:
            return null;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.colorSpace = THREE.SRGBColorSpace;

    textureCache.set(cacheKey, texture);
    return texture;
}

export function clearTextureCache() {
    textureCache.forEach(texture => texture.dispose());
    textureCache.clear();
}
