class GameMap {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];
        this.floors = [];
        this.obstacles = [];
        this.spawnPoints = [];
        this.weaponSpawns = [];
        
        // Map dimensions
        this.mapSize = 100;
        this.wallHeight = 5;
        this.floorY = 0;
        
        // Collision objects for raycasting
        this.collisionObjects = [];
    }
    
    generate() {
        this.createGround();
        this.createBoundaryWalls();
        this.createBuildings();
        this.createObstacles();
        this.createSpawnPoints();
        this.createWeaponSpawns();
        
        console.log('Map generated successfully');
    }
    
    createGround() {
        // Create main ground plane
        const groundGeometry = new THREE.PlaneGeometry(this.mapSize, this.mapSize);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a4a,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = this.floorY;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.floors.push(ground);
        
        // Add texture variation with smaller tiles
        for (let x = -this.mapSize/2; x < this.mapSize/2; x += 10) {
            for (let z = -this.mapSize/2; z < this.mapSize/2; z += 10) {
                if (Math.random() > 0.7) {
                    const tileGeometry = new THREE.PlaneGeometry(8, 8);
                    const tileMaterial = new THREE.MeshLambertMaterial({ 
                        color: Math.random() > 0.5 ? 0x3a3a3a : 0x5a5a5a,
                        side: THREE.DoubleSide
                    });
                    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
                    tile.rotation.x = -Math.PI / 2;
                    tile.position.set(x + 5, this.floorY + 0.01, z + 5);
                    tile.receiveShadow = true;
                    this.scene.add(tile);
                }
            }
        }
    }
    
    createBoundaryWalls() {
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const wallThickness = 1;
        
        // North wall
        this.createWall(
            new THREE.Vector3(0, this.wallHeight/2, -this.mapSize/2),
            new THREE.Vector3(this.mapSize, this.wallHeight, wallThickness),
            wallMaterial
        );
        
        // South wall
        this.createWall(
            new THREE.Vector3(0, this.wallHeight/2, this.mapSize/2),
            new THREE.Vector3(this.mapSize, this.wallHeight, wallThickness),
            wallMaterial
        );
        
        // East wall
        this.createWall(
            new THREE.Vector3(this.mapSize/2, this.wallHeight/2, 0),
            new THREE.Vector3(wallThickness, this.wallHeight, this.mapSize),
            wallMaterial
        );
        
        // West wall
        this.createWall(
            new THREE.Vector3(-this.mapSize/2, this.wallHeight/2, 0),
            new THREE.Vector3(wallThickness, this.wallHeight, this.mapSize),
            wallMaterial
        );
    }
    
    createBuildings() {
        // Create several buildings throughout the map
        const buildingConfigs = [
            { pos: new THREE.Vector3(-20, 0, -20), size: new THREE.Vector3(15, 8, 15) },
            { pos: new THREE.Vector3(25, 0, -15), size: new THREE.Vector3(12, 6, 20) },
            { pos: new THREE.Vector3(-15, 0, 25), size: new THREE.Vector3(18, 10, 12) },
            { pos: new THREE.Vector3(20, 0, 20), size: new THREE.Vector3(10, 7, 10) },
            { pos: new THREE.Vector3(0, 0, 0), size: new THREE.Vector3(8, 4, 8) }
        ];
        
        buildingConfigs.forEach(config => {
            this.createBuilding(config.pos, config.size);
        });
    }
    
    createBuilding(position, size) {
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const wallThickness = 0.5;
        
        // Building walls
        const walls = [
            // North wall
            {
                pos: new THREE.Vector3(position.x, position.y + size.y/2, position.z - size.z/2),
                size: new THREE.Vector3(size.x, size.y, wallThickness)
            },
            // South wall
            {
                pos: new THREE.Vector3(position.x, position.y + size.y/2, position.z + size.z/2),
                size: new THREE.Vector3(size.x, size.y, wallThickness)
            },
            // East wall
            {
                pos: new THREE.Vector3(position.x + size.x/2, position.y + size.y/2, position.z),
                size: new THREE.Vector3(wallThickness, size.y, size.z)
            },
            // West wall
            {
                pos: new THREE.Vector3(position.x - size.x/2, position.y + size.y/2, position.z),
                size: new THREE.Vector3(wallThickness, size.y, size.z)
            }
        ];
        
        walls.forEach(wall => {
            // Create doorways randomly
            if (Math.random() > 0.6) {
                this.createWallWithDoorway(wall.pos, wall.size, wallMaterial);
            } else {
                this.createWall(wall.pos, wall.size, wallMaterial);
            }
        });
        
        // Create roof
        const roofGeometry = new THREE.BoxGeometry(size.x + 1, 0.5, size.z + 1);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(position.x, position.y + size.y + 0.25, position.z);
        roof.castShadow = true;
        roof.receiveShadow = true;
        this.scene.add(roof);
    }
    
    createWallWithDoorway(position, size, material) {
        const doorwayWidth = 2;
        const doorwayHeight = 3;
        
        // Create wall segments around the doorway
        const segments = [
            // Left segment
            {
                pos: new THREE.Vector3(position.x - (size.x - doorwayWidth)/4, position.y, position.z),
                size: new THREE.Vector3((size.x - doorwayWidth)/2, size.y, size.z)
            },
            // Right segment
            {
                pos: new THREE.Vector3(position.x + (size.x - doorwayWidth)/4, position.y, position.z),
                size: new THREE.Vector3((size.x - doorwayWidth)/2, size.y, size.z)
            },
            // Top segment
            {
                pos: new THREE.Vector3(position.x, position.y + (size.y + doorwayHeight)/4, position.z),
                size: new THREE.Vector3(doorwayWidth, (size.y - doorwayHeight)/2, size.z)
            }
        ];
        
        segments.forEach(segment => {
            if (segment.size.x > 0 && segment.size.y > 0) {
                this.createWall(segment.pos, segment.size, material);
            }
        });
    }
    
    createWall(position, size, material) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const wall = new THREE.Mesh(geometry, material);
        wall.position.copy(position);
        wall.castShadow = true;
        wall.receiveShadow = true;
        
        this.scene.add(wall);
        this.walls.push(wall);
        this.collisionObjects.push(wall);
    }
    
    createObstacles() {
        // Create various obstacles throughout the map
        const obstacleConfigs = [
            // Crates
            { type: 'crate', pos: new THREE.Vector3(10, 1, 10), size: new THREE.Vector3(2, 2, 2) },
            { type: 'crate', pos: new THREE.Vector3(-10, 1, -10), size: new THREE.Vector3(2, 2, 2) },
            { type: 'crate', pos: new THREE.Vector3(15, 1, -5), size: new THREE.Vector3(1.5, 1.5, 1.5) },
            
            // Barrels
            { type: 'barrel', pos: new THREE.Vector3(-5, 1, 15), radius: 0.8, height: 2 },
            { type: 'barrel', pos: new THREE.Vector3(8, 1, -12), radius: 0.6, height: 1.5 },
            
            // Pillars
            { type: 'pillar', pos: new THREE.Vector3(0, 3, -30), radius: 1, height: 6 },
            { type: 'pillar', pos: new THREE.Vector3(-30, 3, 0), radius: 1, height: 6 },
            { type: 'pillar', pos: new THREE.Vector3(30, 3, 30), radius: 0.8, height: 5 }
        ];
        
        obstacleConfigs.forEach(config => {
            this.createObstacle(config);
        });
    }
    
    createObstacle(config) {
        let geometry, material, obstacle;
        
        switch (config.type) {
            case 'crate':
                geometry = new THREE.BoxGeometry(config.size.x, config.size.y, config.size.z);
                material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                obstacle = new THREE.Mesh(geometry, material);
                obstacle.position.copy(config.pos);
                break;
                
            case 'barrel':
                geometry = new THREE.CylinderGeometry(config.radius, config.radius, config.height, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
                obstacle = new THREE.Mesh(geometry, material);
                obstacle.position.copy(config.pos);
                break;
                
            case 'pillar':
                geometry = new THREE.CylinderGeometry(config.radius, config.radius, config.height, 8);
                material = new THREE.MeshLambertMaterial({ color: 0x696969 });
                obstacle = new THREE.Mesh(geometry, material);
                obstacle.position.copy(config.pos);
                break;
        }
        
        if (obstacle) {
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            this.scene.add(obstacle);
            this.obstacles.push(obstacle);
            this.collisionObjects.push(obstacle);
        }
    }
    
    createSpawnPoints() {
        // Define spawn points around the map
        this.spawnPoints = [
            new THREE.Vector3(-40, 2, -40),
            new THREE.Vector3(40, 2, -40),
            new THREE.Vector3(-40, 2, 40),
            new THREE.Vector3(40, 2, 40),
            new THREE.Vector3(0, 2, -45),
            new THREE.Vector3(0, 2, 45),
            new THREE.Vector3(-45, 2, 0),
            new THREE.Vector3(45, 2, 0)
        ];
        
        // Create visual indicators for spawn points (for debugging)
        this.spawnPoints.forEach((point, index) => {
            const geometry = new THREE.CylinderGeometry(1, 1, 0.1, 8);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                transparent: true,
                opacity: 0.3
            });
            const marker = new THREE.Mesh(geometry, material);
            marker.position.copy(point);
            marker.position.y = 0.05;
            // this.scene.add(marker); // Uncomment for debugging
        });
    }
    
    createWeaponSpawns() {
        // Define weapon spawn locations
        const weaponSpawnConfigs = [
            { pos: new THREE.Vector3(-30, 1, -30), weapon: 'ak47' },
            { pos: new THREE.Vector3(30, 1, -30), weapon: 'm4a4' },
            { pos: new THREE.Vector3(-30, 1, 30), weapon: 'awp' },
            { pos: new THREE.Vector3(30, 1, 30), weapon: 'glock' },
            { pos: new THREE.Vector3(0, 1, -35), weapon: 'usp' },
            { pos: new THREE.Vector3(0, 1, 35), weapon: 'random' },
            { pos: new THREE.Vector3(-35, 1, 0), weapon: 'random' },
            { pos: new THREE.Vector3(35, 1, 0), weapon: 'random' }
        ];
        
        weaponSpawnConfigs.forEach(config => {
            const weaponPickup = new WeaponPickup(config.weapon, config.pos, this.scene);
            this.weaponSpawns.push(weaponPickup);
        });
    }
    
    getRandomSpawnPoint() {
        const randomIndex = Math.floor(Math.random() * this.spawnPoints.length);
        return this.spawnPoints[randomIndex].clone();
    }
    
    checkPlayerCollision(player) {
        if (!player.position || !player.playerRadius || !player.playerHeight) {
            return false;
        }
        
        // Create player bounding box
        const playerBox = new THREE.Box3().setFromCenterAndSize(
            player.position.clone().add(new THREE.Vector3(0, player.playerHeight / 2, 0)),
            new THREE.Vector3(player.playerRadius * 2, player.playerHeight, player.playerRadius * 2)
        );
        
        // Check collision with hard floor at y = 0
        if (player.position.y - player.playerRadius < 0) {
            return true;
        }
        
        // Check collision with all collision objects
        for (let obj of this.collisionObjects) {
            const objBox = new THREE.Box3().setFromObject(obj);
            if (playerBox.intersectsBox(objBox)) {
                return true;
            }
        }
        
        return false;
    }
    
    checkBulletCollision(bullet) {
        if (!bullet || !bullet.position || !bullet.lastPosition) {
            return false;
        }
        
        // Use raycasting for bullet collision
        const direction = bullet.position.clone().sub(bullet.lastPosition).normalize();
        const distance = bullet.position.distanceTo(bullet.lastPosition);
        
        const raycaster = new THREE.Raycaster(bullet.lastPosition, direction, 0, distance);
        const intersects = raycaster.intersectObjects(this.collisionObjects, true);
        
        if (intersects.length > 0) {
            const intersection = intersects[0];
            
            // Create impact effect
            bullet.createImpactEffect(intersection.point, intersection.face.normal);
            
            return true;
        }
        
        return false;
    }
    
    getCollisionObjects() {
        return this.collisionObjects;
    }
    
    updateWeaponSpawns(player) {
        // Check if player can pick up any weapons
        this.weaponSpawns.forEach((weaponSpawn, index) => {
            if (weaponSpawn.checkPickup(player)) {
                const weapon = weaponSpawn.pickup();
                if (weapon) {
                    // Add weapon to player's inventory
                    if (player.weapons.length < 2) {
                        player.weapons.push(weapon);
                    } else {
                        // Replace current weapon
                        player.weapons[player.currentWeaponIndex] = weapon;
                    }
                    
                    // Remove from spawn list and respawn after delay
                    setTimeout(() => {
                        const newWeaponSpawn = new WeaponPickup(
                            weaponSpawn.weaponType,
                            weaponSpawn.position,
                            this.scene
                        );
                        this.weaponSpawns[index] = newWeaponSpawn;
                    }, 30000); // 30 second respawn
                }
            }
        });
    }
    
    dispose() {
        // Clean up all map objects
        [...this.walls, ...this.floors, ...this.obstacles].forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        
        this.weaponSpawns.forEach(spawn => spawn.dispose());
        
        this.walls = [];
        this.floors = [];
        this.obstacles = [];
        this.collisionObjects = [];
        this.weaponSpawns = [];
    }
}

// Minimap class for showing map overview
class Minimap {
    constructor(map, player) {
        this.map = map;
        this.player = player;
        this.canvas = null;
        this.context = null;
        this.scale = 2; // pixels per world unit
        this.size = 200; // minimap size in pixels
        
        this.createMinimapCanvas();
    }
    
    createMinimapCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '20px';
        this.canvas.style.left = '20px';
        this.canvas.style.border = '2px solid white';
        this.canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.canvas.style.zIndex = '150';
        
        this.context = this.canvas.getContext('2d');
        
        document.body.appendChild(this.canvas);
    }
    
    update() {
        if (!this.context) return;
        
        // Clear canvas
        this.context.clearRect(0, 0, this.size, this.size);
        
        // Draw map bounds
        this.context.strokeStyle = 'white';
        this.context.lineWidth = 2;
        this.context.strokeRect(10, 10, this.size - 20, this.size - 20);
        
        // Draw walls and obstacles
        this.context.fillStyle = 'gray';
        this.map.collisionObjects.forEach(obj => {
            const pos = this.worldToMinimap(obj.position);
            this.context.fillRect(pos.x - 2, pos.y - 2, 4, 4);
        });
        
        // Draw player
        if (this.player && this.player.position) {
            const playerPos = this.worldToMinimap(this.player.position);
            
            // Player dot
            this.context.fillStyle = 'lime';
            this.context.beginPath();
            this.context.arc(playerPos.x, playerPos.y, 3, 0, Math.PI * 2);
            this.context.fill();
            
            // Player direction indicator
            this.context.strokeStyle = 'lime';
            this.context.lineWidth = 2;
            this.context.beginPath();
            this.context.moveTo(playerPos.x, playerPos.y);
            this.context.lineTo(
                playerPos.x + Math.sin(this.player.yaw) * 10,
                playerPos.y + Math.cos(this.player.yaw) * 10
            );
            this.context.stroke();
        }
    }
    
    worldToMinimap(worldPos) {
        const mapSize = this.map.mapSize;
        const x = ((worldPos.x + mapSize / 2) / mapSize) * (this.size - 20) + 10;
        const y = ((worldPos.z + mapSize / 2) / mapSize) * (this.size - 20) + 10;
        return { x, y };
    }
    
    dispose() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}
