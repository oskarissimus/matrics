class Weapon {
    constructor(name, stats) {
        this.name = name;
        this.damage = stats.damage || 25;
        this.fireRate = stats.fireRate || 600; // rounds per minute
        this.reloadTime = stats.reloadTime || 2.0; // seconds
        this.maxAmmo = stats.maxAmmo || 30;
        this.totalAmmo = stats.totalAmmo || 90;
        this.accuracy = stats.accuracy || 0.9;
        this.range = stats.range || 100;
        
        // Current state
        this.currentAmmo = this.maxAmmo;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.lastFireTime = 0;
        this.fireCooldown = 60000 / this.fireRate; // Convert RPM to milliseconds between shots
    }
    
    update(deltaTime) {
        // Handle reloading
        if (this.isReloading) {
            this.reloadTimer -= deltaTime;
            if (this.reloadTimer <= 0) {
                this.finishReload();
            }
        }
    }
    
    canFire() {
        const now = Date.now();
        return !this.isReloading && 
               this.currentAmmo > 0 && 
               (now - this.lastFireTime) >= this.fireCooldown;
    }
    
    fire() {
        if (!this.canFire()) return false;
        
        this.currentAmmo--;
        this.lastFireTime = Date.now();
        
        // Auto-reload when empty
        if (this.currentAmmo === 0 && this.totalAmmo > 0) {
            setTimeout(() => {
                if (this.currentAmmo === 0) {
                    this.reload();
                }
            }, 500);
        }
        
        return true;
    }
    
    canReload() {
        return !this.isReloading && 
               this.currentAmmo < this.maxAmmo && 
               this.totalAmmo > 0;
    }
    
    reload() {
        if (!this.canReload()) return false;
        
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        return true;
    }
    
    finishReload() {
        const ammoNeeded = this.maxAmmo - this.currentAmmo;
        const ammoToAdd = Math.min(ammoNeeded, this.totalAmmo);
        
        this.currentAmmo += ammoToAdd;
        this.totalAmmo -= ammoToAdd;
        this.isReloading = false;
        this.reloadTimer = 0;
    }
    
    reset() {
        this.currentAmmo = this.maxAmmo;
        this.totalAmmo = this.maxAmmo * 3; // Reset to full ammo
        this.isReloading = false;
        this.reloadTimer = 0;
    }
    
    dispose() {
        // Clean up any resources if needed
    }
}

class Bullet {
    constructor(data, scene) {
        this.position = data.position.clone();
        this.direction = data.direction.clone().normalize();
        this.damage = data.damage || 25;
        this.speed = data.speed || 100;
        this.playerId = data.playerId;
        this.scene = scene;
        
        // Bullet physics
        this.velocity = this.direction.clone().multiplyScalar(this.speed);
        this.distanceTraveled = 0;
        this.maxDistance = 200;
        this.gravity = -9.8; // Slight bullet drop
        
        // Visual representation
        this.createMesh();
        
        // Collision detection
        this.raycaster = new THREE.Raycaster();
        this.lastPosition = this.position.clone();
    }
    
    createMesh() {
        // Create a small sphere to represent the bullet
        const geometry = new THREE.SphereGeometry(0.02, 8, 6);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0x444400
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Create bullet trail effect
        this.createTrail();
    }
    
    createTrail() {
        const trailGeometry = new THREE.BufferGeometry();
        const trailMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.6
        });
        
        const positions = new Float32Array(6); // 2 points * 3 coordinates
        positions[0] = this.position.x;
        positions[1] = this.position.y;
        positions[2] = this.position.z;
        positions[3] = this.position.x;
        positions[4] = this.position.y;
        positions[5] = this.position.z;
        
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trail = new THREE.Line(trailGeometry, trailMaterial);
        this.scene.add(this.trail);
    }
    
    update(deltaTime) {
        this.lastPosition.copy(this.position);
        
        // Apply gravity (slight bullet drop)
        this.velocity.y += this.gravity * deltaTime * 0.1;
        
        // Move bullet
        const movement = this.velocity.clone().multiplyScalar(deltaTime);
        this.position.add(movement);
        this.distanceTraveled += movement.length();
        
        // Update visual representation
        this.mesh.position.copy(this.position);
        
        // Update trail
        this.updateTrail();
        
        // Check if bullet has traveled too far
        return this.distanceTraveled < this.maxDistance;
    }
    
    updateTrail() {
        if (this.trail) {
            const positions = this.trail.geometry.attributes.position.array;
            
            // Move the trail back
            positions[0] = positions[3];
            positions[1] = positions[4];
            positions[2] = positions[5];
            
            // Set new front position
            positions[3] = this.position.x;
            positions[4] = this.position.y;
            positions[5] = this.position.z;
            
            this.trail.geometry.attributes.position.needsUpdate = true;
            
            // Fade trail over time
            this.trail.material.opacity *= 0.98;
        }
    }
    
    checkCollision(objects) {
        // Use raycasting to check for collisions
        const direction = this.position.clone().sub(this.lastPosition).normalize();
        const distance = this.position.distanceTo(this.lastPosition);
        
        this.raycaster.set(this.lastPosition, direction);
        const intersects = this.raycaster.intersectObjects(objects, true);
        
        if (intersects.length > 0 && intersects[0].distance <= distance) {
            return intersects[0];
        }
        
        return null;
    }
    
    checkPlayerCollision(player) {
        if (!player || !player.boundingBox) return false;
        
        // Check if bullet intersects with player's bounding box
        const bulletBox = new THREE.Box3().setFromCenterAndSize(
            this.position,
            new THREE.Vector3(0.04, 0.04, 0.04)
        );
        
        return bulletBox.intersectsBox(player.boundingBox);
    }
    
    createImpactEffect(position, normal) {
        // Create spark particles at impact point
        const particleCount = 10;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = position.x;
            positions[i3 + 1] = position.y;
            positions[i3 + 2] = position.z;
            
            // Random velocity for particles
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 5,
                (Math.random() - 0.5) * 10
            );
            
            // Reflect particles off the surface
            if (normal) {
                velocity.reflect(normal);
            }
            
            velocities.push(velocity);
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff6600,
            size: 0.1,
            transparent: true,
            opacity: 1.0
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
        
        // Animate particles
        let time = 0;
        const animateParticles = () => {
            time += 0.016; // ~60fps
            
            const positions = particleSystem.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                const velocity = velocities[i];
                
                positions[i3] += velocity.x * 0.016;
                positions[i3 + 1] += velocity.y * 0.016 - 9.8 * time * 0.016; // gravity
                positions[i3 + 2] += velocity.z * 0.016;
                
                // Slow down particles
                velocity.multiplyScalar(0.98);
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
            particleMaterial.opacity -= 0.02;
            
            if (particleMaterial.opacity > 0 && time < 2) {
                requestAnimationFrame(animateParticles);
            } else {
                // Clean up
                this.scene.remove(particleSystem);
                particleSystem.geometry.dispose();
                particleMaterial.dispose();
            }
        };
        
        animateParticles();
    }
    
    dispose() {
        // Remove bullet from scene
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        
        if (this.trail) {
            this.scene.remove(this.trail);
            this.trail.geometry.dispose();
            this.trail.material.dispose();
        }
    }
}

// Weapon factory for creating different weapon types
class WeaponFactory {
    static createAK47() {
        return new Weapon('AK-47', {
            damage: 35,
            fireRate: 600,
            reloadTime: 2.5,
            maxAmmo: 30,
            totalAmmo: 90,
            accuracy: 0.92,
            range: 150
        });
    }
    
    static createM4A4() {
        return new Weapon('M4A4', {
            damage: 33,
            fireRate: 666,
            reloadTime: 3.1,
            maxAmmo: 30,
            totalAmmo: 90,
            accuracy: 0.95,
            range: 160
        });
    }
    
    static createAWP() {
        return new Weapon('AWP', {
            damage: 115,
            fireRate: 41,
            reloadTime: 3.7,
            maxAmmo: 10,
            totalAmmo: 30,
            accuracy: 0.99,
            range: 300
        });
    }
    
    static createGlock() {
        return new Weapon('Glock-18', {
            damage: 28,
            fireRate: 400,
            reloadTime: 2.2,
            maxAmmo: 20,
            totalAmmo: 120,
            accuracy: 0.85,
            range: 50
        });
    }
    
    static createUSP() {
        return new Weapon('USP-S', {
            damage: 35,
            fireRate: 352,
            reloadTime: 2.7,
            maxAmmo: 12,
            totalAmmo: 24,
            accuracy: 0.90,
            range: 60
        });
    }
    
    static createRandomWeapon() {
        const weapons = [
            this.createAK47,
            this.createM4A4,
            this.createGlock,
            this.createUSP
        ];
        
        const randomIndex = Math.floor(Math.random() * weapons.length);
        return weapons[randomIndex]();
    }
}

// Weapon pickup system
class WeaponPickup {
    constructor(weaponType, position, scene) {
        this.weaponType = weaponType;
        this.position = position.clone();
        this.scene = scene;
        this.isPickedUp = false;
        
        this.createMesh();
        this.setupAnimation();
    }
    
    createMesh() {
        // Create a simple weapon representation
        const geometry = new THREE.BoxGeometry(0.8, 0.2, 0.1);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x444444,
            emissive: 0x222222
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.position.y += 0.5; // Hover above ground
        this.scene.add(this.mesh);
        
        // Add glow effect
        const glowGeometry = new THREE.BoxGeometry(1.0, 0.4, 0.3);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glow.position.copy(this.mesh.position);
        this.scene.add(this.glow);
    }
    
    setupAnimation() {
        // Floating animation
        this.animationTime = 0;
        this.originalY = this.mesh.position.y;
        
        const animate = () => {
            if (this.isPickedUp) return;
            
            this.animationTime += 0.016;
            
            // Floating motion
            this.mesh.position.y = this.originalY + Math.sin(this.animationTime * 2) * 0.1;
            this.glow.position.y = this.mesh.position.y;
            
            // Rotation
            this.mesh.rotation.y += 0.02;
            this.glow.rotation.y += 0.01;
            
            // Pulsing glow
            this.glow.material.opacity = 0.2 + Math.sin(this.animationTime * 4) * 0.1;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    checkPickup(player) {
        if (this.isPickedUp) return false;
        
        const distance = this.position.distanceTo(player.position);
        return distance < 2.0; // Pickup range
    }
    
    pickup() {
        if (this.isPickedUp) return null;
        
        this.isPickedUp = true;
        
        // Remove from scene
        this.scene.remove(this.mesh);
        this.scene.remove(this.glow);
        
        // Create weapon based on type
        switch (this.weaponType) {
            case 'ak47':
                return WeaponFactory.createAK47();
            case 'm4a4':
                return WeaponFactory.createM4A4();
            case 'awp':
                return WeaponFactory.createAWP();
            case 'glock':
                return WeaponFactory.createGlock();
            case 'usp':
                return WeaponFactory.createUSP();
            default:
                return WeaponFactory.createRandomWeapon();
        }
    }
    
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        
        if (this.glow) {
            this.scene.remove(this.glow);
            this.glow.geometry.dispose();
            this.glow.material.dispose();
        }
    }
}
