class GameMap {
    constructor(mapData) {
        this.width = mapData.width || 1600;
        this.height = mapData.height || 1200;
        this.name = mapData.name || 'de_dust2_mini';
        
        // Map geometry - walls, obstacles, etc.
        this.walls = mapData.walls || this.generateDefaultWalls();
        this.spawnPoints = mapData.spawnPoints || this.generateDefaultSpawns();
        this.bombSites = mapData.bombSites || this.generateDefaultBombSites();
        
        // Visual elements
        this.textures = mapData.textures || {};
        this.decorations = mapData.decorations || [];
        
        // Collision grid for optimization
        this.gridSize = 50;
        this.collisionGrid = this.buildCollisionGrid();
    }
    
    generateDefaultWalls() {
        // Create a simple Counter-Strike inspired map layout
        const walls = [
            // Outer boundaries
            { x: 0, y: 0, width: this.width, height: 20, type: 'wall' },
            { x: 0, y: this.height - 20, width: this.width, height: 20, type: 'wall' },
            { x: 0, y: 0, width: 20, height: this.height, type: 'wall' },
            { x: this.width - 20, y: 0, width: 20, height: this.height, type: 'wall' },
            
            // Central structures (inspired by de_dust2)
            // Long corridor
            { x: 200, y: 200, width: 20, height: 400, type: 'wall' },
            { x: 220, y: 200, width: 600, height: 20, type: 'wall' },
            { x: 220, y: 580, width: 600, height: 20, type: 'wall' },
            { x: 800, y: 220, width: 20, height: 360, type: 'wall' },
            
            // Mid area
            { x: 400, y: 400, width: 200, height: 20, type: 'wall' },
            { x: 500, y: 300, width: 20, height: 100, type: 'wall' },
            
            // Bomb site A area
            { x: 1000, y: 100, width: 400, height: 20, type: 'wall' },
            { x: 1000, y: 120, width: 20, height: 200, type: 'wall' },
            { x: 1380, y: 120, width: 20, height: 200, type: 'wall' },
            { x: 1020, y: 300, width: 360, height: 20, type: 'wall' },
            
            // Bomb site B area
            { x: 100, y: 800, width: 400, height: 20, type: 'wall' },
            { x: 100, y: 820, width: 20, height: 200, type: 'wall' },
            { x: 480, y: 820, width: 20, height: 200, type: 'wall' },
            { x: 120, y: 1000, width: 360, height: 20, type: 'wall' },
            
            // Additional cover
            { x: 600, y: 600, width: 100, height: 20, type: 'cover' },
            { x: 900, y: 500, width: 20, height: 100, type: 'cover' },
            { x: 300, y: 700, width: 80, height: 80, type: 'cover' }
        ];
        
        return walls;
    }
    
    generateDefaultSpawns() {
        return {
            terrorist: [
                { x: 150, y: 150 },
                { x: 150, y: 200 },
                { x: 100, y: 175 },
                { x: 200, y: 150 },
                { x: 200, y: 200 }
            ],
            counterTerrorist: [
                { x: 1450, y: 1050 },
                { x: 1450, y: 1000 },
                { x: 1400, y: 1025 },
                { x: 1500, y: 1050 },
                { x: 1500, y: 1000 }
            ]
        };
    }
    
    generateDefaultBombSites() {
        return {
            A: {
                x: 1100,
                y: 150,
                width: 200,
                height: 150,
                name: 'Bomb Site A'
            },
            B: {
                x: 200,
                y: 850,
                width: 200,
                height: 150,
                name: 'Bomb Site B'
            }
        };
    }
    
    buildCollisionGrid() {
        const grid = [];
        const cols = Math.ceil(this.width / this.gridSize);
        const rows = Math.ceil(this.height / this.gridSize);
        
        for (let y = 0; y < rows; y++) {
            grid[y] = [];
            for (let x = 0; x < cols; x++) {
                grid[y][x] = [];
            }
        }
        
        // Add walls to grid
        this.walls.forEach((wall, index) => {
            const startX = Math.floor(wall.x / this.gridSize);
            const endX = Math.floor((wall.x + wall.width) / this.gridSize);
            const startY = Math.floor(wall.y / this.gridSize);
            const endY = Math.floor((wall.y + wall.height) / this.gridSize);
            
            for (let y = startY; y <= endY && y < rows; y++) {
                for (let x = startX; x <= endX && x < cols; x++) {
                    if (x >= 0 && y >= 0) {
                        grid[y][x].push(index);
                    }
                }
            }
        });
        
        return grid;
    }
    
    checkCollision(player) {
        const gridX = Math.floor(player.x / this.gridSize);
        const gridY = Math.floor(player.y / this.gridSize);
        
        // Check surrounding grid cells
        for (let y = gridY - 1; y <= gridY + 1; y++) {
            for (let x = gridX - 1; x <= gridX + 1; x++) {
                if (y >= 0 && y < this.collisionGrid.length && 
                    x >= 0 && x < this.collisionGrid[0].length) {
                    
                    const wallIndices = this.collisionGrid[y][x];
                    for (let wallIndex of wallIndices) {
                        const wall = this.walls[wallIndex];
                        if (this.isPlayerCollidingWithWall(player, wall)) {
                            this.resolveCollision(player, wall);
                        }
                    }
                }
            }
        }
        
        // Keep player within map bounds
        player.x = Math.max(player.radius, Math.min(this.width - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(this.height - player.radius, player.y));
    }
    
    isPlayerCollidingWithWall(player, wall) {
        // Check if player circle intersects with wall rectangle
        const closestX = Math.max(wall.x, Math.min(player.x, wall.x + wall.width));
        const closestY = Math.max(wall.y, Math.min(player.y, wall.y + wall.height));
        
        const dx = player.x - closestX;
        const dy = player.y - closestY;
        
        return (dx * dx + dy * dy) < (player.radius * player.radius);
    }
    
    resolveCollision(player, wall) {
        // Find the closest point on the wall to the player
        const closestX = Math.max(wall.x, Math.min(player.x, wall.x + wall.width));
        const closestY = Math.max(wall.y, Math.min(player.y, wall.y + wall.height));
        
        const dx = player.x - closestX;
        const dy = player.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius && distance > 0) {
            // Push player away from wall
            const pushX = (dx / distance) * (player.radius - distance);
            const pushY = (dy / distance) * (player.radius - distance);
            
            player.x += pushX;
            player.y += pushY;
            
            // Stop movement in collision direction
            if (Math.abs(pushX) > Math.abs(pushY)) {
                player.vx = 0;
            } else {
                player.vy = 0;
            }
        }
    }
    
    getSpawnPoint(team, index = 0) {
        const spawns = this.spawnPoints[team];
        if (!spawns || spawns.length === 0) {
            return { x: 400, y: 300 }; // Default spawn
        }
        
        const spawnIndex = index % spawns.length;
        return { ...spawns[spawnIndex] };
    }
    
    getRandomSpawnPoint(team) {
        const spawns = this.spawnPoints[team];
        if (!spawns || spawns.length === 0) {
            return { x: 400, y: 300 };
        }
        
        const randomIndex = Math.floor(Math.random() * spawns.length);
        return { ...spawns[randomIndex] };
    }
    
    isInBombSite(x, y, site) {
        const bombSite = this.bombSites[site];
        if (!bombSite) return false;
        
        return x >= bombSite.x && 
               x <= bombSite.x + bombSite.width &&
               y >= bombSite.y && 
               y <= bombSite.y + bombSite.height;
    }
    
    render(ctx, camera) {
        ctx.save();
        
        // Render background
        ctx.fillStyle = '#8B4513'; // Brown ground
        ctx.fillRect(-camera.x, -camera.y, this.width, this.height);
        
        // Render bomb sites
        this.renderBombSites(ctx, camera);
        
        // Render walls and obstacles
        this.renderWalls(ctx, camera);
        
        // Render decorations
        this.renderDecorations(ctx, camera);
        
        ctx.restore();
    }
    
    renderWalls(ctx, camera) {
        this.walls.forEach(wall => {
            // Only render walls that are visible
            if (wall.x + wall.width < camera.x - 500 || wall.x > camera.x + 500 ||
                wall.y + wall.height < camera.y - 500 || wall.y > camera.y + 500) {
                return;
            }
            
            // Different colors for different wall types
            switch (wall.type) {
                case 'wall':
                    ctx.fillStyle = '#666666';
                    break;
                case 'cover':
                    ctx.fillStyle = '#888888';
                    break;
                default:
                    ctx.fillStyle = '#555555';
            }
            
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            
            // Add some texture/detail
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
            
            // Add some visual depth
            if (wall.width > 40 || wall.height > 40) {
                ctx.fillStyle = '#777777';
                ctx.fillRect(wall.x + 2, wall.y + 2, wall.width - 4, wall.height - 4);
            }
        });
    }
    
    renderBombSites(ctx, camera) {
        Object.entries(this.bombSites).forEach(([site, data]) => {
            // Only render if visible
            if (data.x + data.width < camera.x - 500 || data.x > camera.x + 500 ||
                data.y + data.height < camera.y - 500 || data.y > camera.y + 500) {
                return;
            }
            
            // Bomb site background
            ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
            ctx.fillRect(data.x, data.y, data.width, data.height);
            
            // Bomb site border
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(data.x, data.y, data.width, data.height);
            ctx.setLineDash([]);
            
            // Bomb site label
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 20px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(
                `BOMB SITE ${site}`,
                data.x + data.width / 2,
                data.y + data.height / 2
            );
        });
    }
    
    renderDecorations(ctx, camera) {
        this.decorations.forEach(decoration => {
            // Only render if visible
            if (decoration.x < camera.x - 500 || decoration.x > camera.x + 500 ||
                decoration.y < camera.y - 500 || decoration.y > camera.y + 500) {
                return;
            }
            
            switch (decoration.type) {
                case 'crate':
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(decoration.x, decoration.y, decoration.width, decoration.height);
                    ctx.strokeStyle = '#654321';
                    ctx.strokeRect(decoration.x, decoration.y, decoration.width, decoration.height);
                    break;
                    
                case 'barrel':
                    ctx.fillStyle = '#444444';
                    ctx.beginPath();
                    ctx.arc(decoration.x, decoration.y, decoration.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#222222';
                    ctx.stroke();
                    break;
            }
        });
    }
    
    // Minimap rendering
    renderMinimap(ctx, x, y, size, camera, players) {
        const scale = size / Math.max(this.width, this.height);
        
        ctx.save();
        ctx.translate(x, y);
        
        // Map background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, size, size);
        
        // Map walls
        ctx.fillStyle = '#666666';
        this.walls.forEach(wall => {
            const wallX = wall.x * scale;
            const wallY = wall.y * scale;
            const wallW = wall.width * scale;
            const wallH = wall.height * scale;
            ctx.fillRect(wallX, wallY, wallW, wallH);
        });
        
        // Bomb sites
        Object.entries(this.bombSites).forEach(([site, data]) => {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(
                data.x * scale,
                data.y * scale,
                data.width * scale,
                data.height * scale
            );
            
            ctx.fillStyle = '#ffff00';
            ctx.font = '10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(
                site,
                (data.x + data.width / 2) * scale,
                (data.y + data.height / 2) * scale
            );
        });
        
        // Players
        if (players) {
            for (let player of players.values()) {
                const playerX = player.x * scale;
                const playerY = player.y * scale;
                
                ctx.fillStyle = player.team === 'terrorist' ? '#ff0000' : '#0000ff';
                ctx.beginPath();
                ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Player direction
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(playerX, playerY);
                ctx.lineTo(
                    playerX + Math.cos(player.angle) * 8,
                    playerY + Math.sin(player.angle) * 8
                );
                ctx.stroke();
            }
        }
        
        // Camera view indicator
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            (camera.x - 400) * scale,
            (camera.y - 300) * scale,
            800 * scale,
            600 * scale
        );
        
        ctx.restore();
    }
    
    // Line of sight calculation for AI or visibility checks
    hasLineOfSight(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / 10); // Check every 10 pixels
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + dx * t;
            const y = y1 + dy * t;
            
            // Check if this point intersects with any wall
            for (let wall of this.walls) {
                if (x >= wall.x && x <= wall.x + wall.width &&
                    y >= wall.y && y <= wall.y + wall.height) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Get map data for network synchronization
    getMapData() {
        return {
            name: this.name,
            width: this.width,
            height: this.height,
            walls: this.walls,
            spawnPoints: this.spawnPoints,
            bombSites: this.bombSites
        };
    }
}
