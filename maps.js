(function(root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.MapDefinitions = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {
    return {
        maps: {
            default: {
                name: 'default',
                displayName: 'Default Map',
                floorSize: 100,
                mapBoundary: 48,
                spawnArea: { minX: -40, maxX: 40, minZ: -40, maxZ: 40 },
                floor: {
                    size: 100,
                    color: 0x808080,
                    gridDivisions: 50,
                    gridColor1: 0x444444,
                    gridColor2: 0x666666
                },
                collisionData: [
                    { x: 0, z: -50, halfW: 50, halfD: 1 },
                    { x: 0, z: 50, halfW: 50, halfD: 1 },
                    { x: 50, z: 0, halfW: 1, halfD: 50 },
                    { x: -50, z: 0, halfW: 1, halfD: 50 },
                    { x: 0, z: 0, halfW: 2.5, halfD: 2.5 },
                    { x: 25, z: 25, halfW: 1.5, halfD: 1.5 },
                    { x: -25, z: 25, halfW: 1.5, halfD: 1.5 },
                    { x: 25, z: -25, halfW: 1.5, halfD: 1.5 },
                    { x: -25, z: -25, halfW: 1.5, halfD: 1.5 },
                    { x: 15, z: 0, halfW: 0.75, halfD: 10 },
                    { x: 0, z: 15, halfW: 10, halfD: 0.75 }
                ],
                elements: [
                    {
                        type: 'box',
                        geometry: { width: 100, height: 6, depth: 2 },
                        material: { color: 0x8B4513 },
                        position: { x: 0, y: 3, z: -50 },
                        collision: { x: 0, z: -50, halfW: 50, halfD: 1 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 100, height: 6, depth: 2 },
                        material: { color: 0x8B4513 },
                        position: { x: 0, y: 3, z: 50 },
                        collision: { x: 0, z: 50, halfW: 50, halfD: 1 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 2, height: 6, depth: 100 },
                        material: { color: 0x8B4513 },
                        position: { x: 50, y: 3, z: 0 },
                        collision: { x: 50, z: 0, halfW: 1, halfD: 50 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 2, height: 6, depth: 100 },
                        material: { color: 0x8B4513 },
                        position: { x: -50, y: 3, z: 0 },
                        collision: { x: -50, z: 0, halfW: 1, halfD: 50 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 5, height: 10, depth: 5 },
                        material: { color: 0x444444 },
                        position: { x: 0, y: 5, z: 0 },
                        collision: { x: 0, z: 0, halfW: 2.5, halfD: 2.5 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 3, height: 3, depth: 3 },
                        material: { color: 0xFF6633 },
                        position: { x: 25, y: 1.5, z: 25 },
                        collision: { x: 25, z: 25, halfW: 1.5, halfD: 1.5 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 3, height: 3, depth: 3 },
                        material: { color: 0xFF6633 },
                        position: { x: -25, y: 1.5, z: 25 },
                        collision: { x: -25, z: 25, halfW: 1.5, halfD: 1.5 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 3, height: 3, depth: 3 },
                        material: { color: 0xFF6633 },
                        position: { x: 25, y: 1.5, z: -25 },
                        collision: { x: 25, z: -25, halfW: 1.5, halfD: 1.5 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 3, height: 3, depth: 3 },
                        material: { color: 0xFF6633 },
                        position: { x: -25, y: 1.5, z: -25 },
                        collision: { x: -25, z: -25, halfW: 1.5, halfD: 1.5 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 1.5, height: 4, depth: 20 },
                        material: { color: 0x2C5AA0 },
                        position: { x: 15, y: 2, z: 0 },
                        collision: { x: 15, z: 0, halfW: 0.75, halfD: 10 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 20, height: 4, depth: 1.5 },
                        material: { color: 0x2C5AA0 },
                        position: { x: 0, y: 2, z: 15 },
                        collision: { x: 0, z: 15, halfW: 10, halfD: 0.75 }
                    },
                    {
                        type: 'box',
                        geometry: { width: 3, height: 0.5, depth: 6 },
                        material: { color: 0x33DD99 },
                        position: { x: -20, y: 1, z: -20 },
                        rotation: { x: Math.PI / 6, y: 0, z: 0 },
                        noCollision: true
                    },
                    {
                        type: 'box',
                        geometry: { width: 3, height: 0.5, depth: 6 },
                        material: { color: 0x33DD99 },
                        position: { x: 20, y: 1.5, z: -20 },
                        rotation: { x: Math.PI / 6, y: 0, z: 0 },
                        noCollision: true
                    }
                ]
            }
        }
    };
}));
