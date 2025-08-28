class Player {
    constructor(name, camera, scene) {
        this.name = name;
        this.camera = camera;
        this.scene = scene;
        
        // Player stats
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 10;
        this.jumpHeight = 8;
        this.mouseSensitivity = 0.002;
        
        // Position and movement
        this.position = new THREE.Vector3(0, 2, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        this.canJump = true;
        
        // Camera rotation
        this.pitch = 0;
        this.yaw = 0;
        this.maxPitch = Math.PI / 2 - 0.1;
        
        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            crouch: false,
            run: false
        };
        
        this.mouseButtons = {
            left: false,
            right: false
        };
        
        // Weapons
        this.weapons = [];
        this.currentWeaponIndex = 0;
        this.isPointerLocked = false;
        
        // Player collision box
        this.boundingBox = new THREE.Box3();
        this.playerHeight = 1.8;
        this.playerRadius = 0.3;
        
        // Initialize weapons
        this.initWeapons();
        
        // Create weapon model
        this.createWeaponModel();
        
        // Set initial camera position
        this.updateCameraPosition();
    }
    
    initWeapons() {
        // Add default weapons
        this.weapons.push(new Weapon('AK-47', {
            damage: 35,
            fireRate: 600, // rounds per minute
            reloadTime: 2.5,
            maxAmmo: 30,
            totalAmmo: 90,
            accuracy: 0.95,
            range: 100
        }));
        
        this.weapons.push(new Weapon('Pistol', {
            damage: 25,
            fireRate: 400,
            reloadTime: 1.5,
            maxAmmo: 12,
            totalAmmo: 48,
            accuracy: 0.85,
            range: 50
        }));
    }
    
    update(deltaTime, map) {
        this.handleMovement(deltaTime, map);
        this.updateWeapons(deltaTime);
        this.updateCameraPosition();
        this.updateBoundingBox();
    }
    
    handleMovement(deltaTime, map) {
        const moveVector = new THREE.Vector3();
        const cameraDirection = new THREE.Vector3();
        
        // Get camera forward direction (without pitch)
        cameraDirection.set(
            -Math.sin(this.yaw),
            0,
            -Math.cos(this.yaw)
        ).normalize();
        
        // Get camera right direction
        const rightDirection = new THREE.Vector3();
        rightDirection.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
        
        // Calculate movement based on input
        if (this.keys.forward) {
            moveVector.add(cameraDirection);
        }
        if (this.keys.backward) {
            moveVector.sub(cameraDirection);
        }
        if (this.keys.left) {
            moveVector.sub(rightDirection);
        }
        if (this.keys.right) {
            moveVector.add(rightDirection);
        }
        
        // Normalize movement vector and apply speed
        if (moveVector.length() > 0) {
            moveVector.normalize();
            const currentSpeed = this.keys.run ? this.speed * 1.5 : this.speed;
            moveVector.multiplyScalar(currentSpeed * deltaTime);
        }
        
        // Apply gravity
        if (!this.onGround) {
            this.velocity.y -= 25 * deltaTime; // gravity
        }
        
        // Handle jumping
        if (this.keys.jump && this.onGround && this.canJump) {
            this.velocity.y = this.jumpHeight;
            this.onGround = false;
            this.canJump = false;
        }
        
        // Combine horizontal movement with vertical velocity
        const totalMovement = new THREE.Vector3(
            moveVector.x,
            this.velocity.y * deltaTime,
            moveVector.z
        );
        
        // Check collisions and move
        this.moveWithCollision(totalMovement, map);
        
        // Reset jump if not pressing jump key
        if (!this.keys.jump) {
            this.canJump = true;
        }
    }
    
    moveWithCollision(movement, map) {
        if (!map) {
            this.position.add(movement);
            return;
        }
        
        // Store original position
        const originalPosition = this.position.clone();
        
        // Try to move in each axis separately for better collision handling
        
        // Move horizontally first
        const horizontalMovement = new THREE.Vector3(movement.x, 0, movement.z);
        this.position.add(horizontalMovement);
        
        // Check horizontal collision
        if (map.checkPlayerCollision(this)) {
            // If collision, try moving in X only
            this.position.copy(originalPosition);
            this.position.x += movement.x;
            
            if (map.checkPlayerCollision(this)) {
                // If still collision, try Z only
                this.position.copy(originalPosition);
                this.position.z += movement.z;
                
                if (map.checkPlayerCollision(this)) {
                    // If still collision, don't move horizontally
                    this.position.copy(originalPosition);
                }
            }
        }
        
        // Move vertically
        this.position.y += movement.y;
        
        // Check vertical collision
        if (map.checkPlayerCollision(this)) {
            if (movement.y < 0) {
                // Hit ground
                this.position.y = originalPosition.y;
                this.velocity.y = 0;
                this.onGround = true;
            } else {
                // Hit ceiling
                this.position.y = originalPosition.y;
                this.velocity.y = 0;
            }
        } else if (movement.y < 0) {
            // Check if we're still on ground
            const testPosition = this.position.clone();
            testPosition.y -= 0.1;
            const tempPlayer = { position: testPosition, playerRadius: this.playerRadius, playerHeight: this.playerHeight };
            this.onGround = map.checkPlayerCollision(tempPlayer);
        }
        
        // Prevent falling through the world - hard floor at y = 0
        if (this.position.y < 0.1) {
            this.position.y = 0.1;
            this.velocity.y = 0;
            this.onGround = true;
        }
    }
    
    updateWeapons(deltaTime) {
        const currentWeapon = this.getCurrentWeapon();
        if (currentWeapon) {
            currentWeapon.update(deltaTime);
            
            // Handle shooting
            if (this.mouseButtons.left && currentWeapon.canFire()) {
                this.fire();
            }
            
            // Handle reloading
            if (this.keys.reload && currentWeapon.canReload()) {
                currentWeapon.reload();
            }
        }
    }
    
    updateCameraPosition() {
        // Set camera position to player position + eye height
        const eyeHeight = this.keys.crouch ? 1.2 : 1.6;
        this.camera.position.copy(this.position);
        this.camera.position.y += eyeHeight;
        
        // Apply rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }
    
    updateBoundingBox() {
        const height = this.keys.crouch ? this.playerHeight * 0.7 : this.playerHeight;
        this.boundingBox.setFromCenterAndSize(
            this.position.clone().add(new THREE.Vector3(0, height / 2, 0)),
            new THREE.Vector3(this.playerRadius * 2, height, this.playerRadius * 2)
        );
    }
    
    fire() {
        const weapon = this.getCurrentWeapon();
        if (!weapon || !weapon.canFire()) return;
        
        weapon.fire();
        
        // Create bullet
        const bulletData = {
            position: this.camera.position.clone(),
            direction: this.getAimDirection(),
            damage: weapon.damage,
            speed: 100,
            playerId: this.name
        };
        
        // Add bullet to scene (this would be handled by the game class)
        if (window.game) {
            window.game.addBullet(bulletData);
        }
        
        // Send to network if connected
        if (window.game && window.game.networking) {
            window.game.networking.sendBulletFired(bulletData);
        }
    }
    
    getAimDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Add some inaccuracy based on weapon
        const weapon = this.getCurrentWeapon();
        if (weapon) {
            const inaccuracy = (1 - weapon.accuracy) * 0.1;
            direction.x += (Math.random() - 0.5) * inaccuracy;
            direction.y += (Math.random() - 0.5) * inaccuracy;
            direction.z += (Math.random() - 0.5) * inaccuracy;
            direction.normalize();
        }
        
        return direction;
    }
    
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        console.log(`${this.name} died`);
        // Handle death logic
        setTimeout(() => {
            this.respawn();
        }, 3000);
    }
    
    respawn() {
        this.health = this.maxHealth;
        this.position.set(0, 2, 0);
        this.velocity.set(0, 0, 0);
        
        // Reset weapons
        this.weapons.forEach(weapon => weapon.reset());
        
        console.log(`${this.name} respawned`);
    }
    
    getCurrentWeapon() {
        return this.weapons[this.currentWeaponIndex] || null;
    }
    
    createWeaponModel() {
        // Create weapon models for first-person view
        this.weaponModels = [];
        
        // AK-47 model
        const ak47Group = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, 0, -0.3);
        ak47Group.add(body);
        
        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 8);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.6);
        ak47Group.add(barrel);
        
        // Stock
        const stockGeometry = new THREE.BoxGeometry(0.08, 0.04, 0.3);
        const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.set(0, -0.01, 0.1);
        ak47Group.add(stock);
        
        // Magazine
        const magGeometry = new THREE.BoxGeometry(0.06, 0.15, 0.2);
        const magMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const magazine = new THREE.Mesh(magGeometry, magMaterial);
        magazine.position.set(0, -0.08, -0.1);
        ak47Group.add(magazine);
        
        // Position the weapon in first-person view - make it more visible
        ak47Group.position.set(0.5, -0.4, -0.8);
        ak47Group.rotation.y = -0.2;
        ak47Group.rotation.x = 0.1;
        ak47Group.scale.set(2, 2, 2); // Make it bigger
        
        this.weaponModels.push(ak47Group);
        
        // Pistol model
        const pistolGroup = new THREE.Group();
        
        // Main body
        const pistolBodyGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.3);
        const pistolBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const pistolBody = new THREE.Mesh(pistolBodyGeometry, pistolBodyMaterial);
        pistolBody.position.set(0, 0, -0.1);
        pistolGroup.add(pistolBody);
        
        // Barrel
        const pistolBarrelGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.15, 8);
        const pistolBarrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const pistolBarrel = new THREE.Mesh(pistolBarrelGeometry, pistolBarrelMaterial);
        pistolBarrel.rotation.z = Math.PI / 2;
        pistolBarrel.position.set(0, 0.01, -0.22);
        pistolGroup.add(pistolBarrel);
        
        // Grip
        const gripGeometry = new THREE.BoxGeometry(0.04, 0.12, 0.06);
        const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(0, -0.06, 0.02);
        pistolGroup.add(grip);
        
        // Position the pistol in first-person view - make it more visible
        pistolGroup.position.set(0.4, -0.3, -0.6);
        pistolGroup.rotation.y = -0.1;
        pistolGroup.rotation.x = 0.05;
        pistolGroup.scale.set(3, 3, 3); // Make it bigger
        
        this.weaponModels.push(pistolGroup);
        
        // Add current weapon to camera
        this.currentWeaponModel = this.weaponModels[this.currentWeaponIndex];
        this.camera.add(this.currentWeaponModel);
    }
    
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            // Remove current weapon model
            if (this.currentWeaponModel) {
                this.camera.remove(this.currentWeaponModel);
            }
            
            // Switch weapon
            this.currentWeaponIndex = index;
            
            // Add new weapon model
            this.currentWeaponModel = this.weaponModels[this.currentWeaponIndex];
            this.camera.add(this.currentWeaponModel);
        }
    }
    
    getNetworkData() {
        return {
            name: this.name,
            position: this.position.clone(),
            rotation: { pitch: this.pitch, yaw: this.yaw },
            health: this.health,
            weapon: this.currentWeaponIndex
        };
    }
    
    setPointerLocked(locked) {
        this.isPointerLocked = locked;
    }
    
    // Event handlers
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.keys.forward = true;
                break;
            case 'KeyS':
                this.keys.backward = true;
                break;
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                event.preventDefault();
                break;
            case 'ShiftLeft':
                this.keys.run = true;
                break;
            case 'ControlLeft':
                this.keys.crouch = true;
                break;
            case 'KeyR':
                this.keys.reload = true;
                break;
            case 'Digit1':
                this.switchWeapon(0);
                break;
            case 'Digit2':
                this.switchWeapon(1);
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.keys.forward = false;
                break;
            case 'KeyS':
                this.keys.backward = false;
                break;
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
            case 'ShiftLeft':
                this.keys.run = false;
                break;
            case 'ControlLeft':
                this.keys.crouch = false;
                break;
            case 'KeyR':
                this.keys.reload = false;
                break;
        }
    }
    
    onMouseMove(event) {
        if (!this.isPointerLocked) return;
        
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        this.yaw -= movementX * this.mouseSensitivity;
        this.pitch -= movementY * this.mouseSensitivity;
        
        // Clamp pitch to prevent over-rotation
        this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
    }
    
    onMouseDown(event) {
        switch (event.button) {
            case 0: // Left click
                this.mouseButtons.left = true;
                break;
            case 2: // Right click
                this.mouseButtons.right = true;
                break;
        }
    }
    
    onMouseUp(event) {
        switch (event.button) {
            case 0: // Left click
                this.mouseButtons.left = false;
                break;
            case 2: // Right click
                this.mouseButtons.right = false;
                break;
        }
    }
    
    dispose() {
        // Clean up resources
        this.weapons.forEach(weapon => weapon.dispose());
        
        // Clean up weapon models
        if (this.weaponModels) {
            this.weaponModels.forEach(model => {
                if (model.parent) {
                    model.parent.remove(model);
                }
                model.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            });
        }
    }
}

// Remote player class for other players in multiplayer
class RemotePlayer {
    constructor(name, scene) {
        this.name = name;
        this.scene = scene;
        this.health = 100;
        this.maxHealth = 100;
        
        // Create visual representation
        this.createMesh();
        
        // Position and rotation
        this.position = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.rotation = { pitch: 0, yaw: 0 };
        this.targetRotation = { pitch: 0, yaw: 0 };
        
        // Interpolation
        this.lerpFactor = 0.1;
    }
    
    createMesh() {
        // Create a simple player representation
        const geometry = new THREE.CapsuleGeometry(0.3, 1.8, 4, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        // Add name tag
        this.createNameTag();
    }
    
    createNameTag() {
        // Create canvas for name tag
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.fillText(this.name, canvas.width / 2, canvas.height / 2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        this.nameTag = new THREE.Sprite(material);
        this.nameTag.scale.set(2, 0.5, 1);
        this.nameTag.position.y = 2.5;
        
        this.mesh.add(this.nameTag);
    }
    
    update(deltaTime) {
        // Interpolate position and rotation
        this.position.lerp(this.targetPosition, this.lerpFactor);
        this.rotation.pitch += (this.targetRotation.pitch - this.rotation.pitch) * this.lerpFactor;
        this.rotation.yaw += (this.targetRotation.yaw - this.rotation.yaw) * this.lerpFactor;
        
        // Update mesh position and rotation
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation.yaw;
    }
    
    updateFromNetwork(data) {
        this.targetPosition.copy(data.position);
        this.targetRotation.pitch = data.rotation.pitch;
        this.targetRotation.yaw = data.rotation.yaw;
        this.health = data.health;
    }
    
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        
        // Visual feedback for taking damage
        this.mesh.material.color.setHex(0xffffff);
        setTimeout(() => {
            this.mesh.material.color.setHex(0xff0000);
        }, 100);
    }
    
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.nameTag) {
            this.nameTag.material.map.dispose();
            this.nameTag.material.dispose();
        }
    }
}
