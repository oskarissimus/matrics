class Weapon {
    constructor(type) {
        this.type = type;
        this.setupWeapon(type);
        
        // Current state
        this.ammo = this.maxAmmo;
        this.reserveAmmo = this.maxReserveAmmo;
        this.lastShotTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
    }
    
    setupWeapon(type) {
        const weapons = {
            ak47: {
                name: 'AK-47',
                damage: 36,
                fireRate: 600, // rounds per minute
                maxAmmo: 30,
                maxReserveAmmo: 90,
                reloadTime: 2500, // milliseconds
                accuracy: 0.85,
                range: 800,
                bulletSpeed: 15,
                automatic: true,
                sound: 'ak47_shot'
            },
            m4a4: {
                name: 'M4A4',
                damage: 33,
                fireRate: 666,
                maxAmmo: 30,
                maxReserveAmmo: 90,
                reloadTime: 3100,
                accuracy: 0.9,
                range: 850,
                bulletSpeed: 16,
                automatic: true,
                sound: 'm4a4_shot'
            },
            awp: {
                name: 'AWP',
                damage: 115,
                fireRate: 41,
                maxAmmo: 10,
                maxReserveAmmo: 30,
                reloadTime: 3700,
                accuracy: 0.99,
                range: 1200,
                bulletSpeed: 25,
                automatic: false,
                sound: 'awp_shot'
            },
            glock: {
                name: 'Glock-18',
                damage: 28,
                fireRate: 400,
                maxAmmo: 20,
                maxReserveAmmo: 120,
                reloadTime: 2200,
                accuracy: 0.75,
                range: 400,
                bulletSpeed: 12,
                automatic: false,
                sound: 'glock_shot'
            },
            usp: {
                name: 'USP-S',
                damage: 35,
                fireRate: 352,
                maxAmmo: 12,
                maxReserveAmmo: 24,
                reloadTime: 2700,
                accuracy: 0.8,
                range: 450,
                bulletSpeed: 13,
                automatic: false,
                sound: 'usp_shot'
            },
            knife: {
                name: 'Knife',
                damage: 65,
                fireRate: 0,
                maxAmmo: 0,
                maxReserveAmmo: 0,
                reloadTime: 0,
                accuracy: 1.0,
                range: 50,
                bulletSpeed: 0,
                automatic: false,
                sound: 'knife_slash'
            }
        };
        
        const weaponData = weapons[type] || weapons.glock;
        
        this.name = weaponData.name;
        this.damage = weaponData.damage;
        this.fireRate = weaponData.fireRate;
        this.maxAmmo = weaponData.maxAmmo;
        this.maxReserveAmmo = weaponData.maxReserveAmmo;
        this.reloadTime = weaponData.reloadTime;
        this.accuracy = weaponData.accuracy;
        this.range = weaponData.range;
        this.bulletSpeed = weaponData.bulletSpeed;
        this.automatic = weaponData.automatic;
        this.sound = weaponData.sound;
        
        // Calculate time between shots in milliseconds
        this.shotInterval = this.fireRate > 0 ? (60 / this.fireRate) * 1000 : 0;
    }
    
    update() {
        // Handle reload completion
        if (this.isReloading) {
            const now = Date.now();
            if (now - this.reloadStartTime >= this.reloadTime) {
                this.completeReload();
            }
        }
    }
    
    canShoot() {
        if (this.isReloading) return false;
        if (this.ammo <= 0) return false;
        
        const now = Date.now();
        return now - this.lastShotTime >= this.shotInterval;
    }
    
    shoot(x, y, angle, playerId) {
        if (!this.canShoot()) return null;
        
        // Special case for knife
        if (this.type === 'knife') {
            return this.meleeAttack(x, y, angle, playerId);
        }
        
        this.ammo--;
        this.lastShotTime = Date.now();
        
        // Calculate bullet trajectory with accuracy
        const spread = (1 - this.accuracy) * 0.2; // Max spread of 0.2 radians
        const actualAngle = angle + (Math.random() - 0.5) * spread;
        
        const bulletVx = Math.cos(actualAngle) * this.bulletSpeed;
        const bulletVy = Math.sin(actualAngle) * this.bulletSpeed;
        
        // Spawn bullet slightly in front of player
        const spawnDistance = 20;
        const bulletX = x + Math.cos(angle) * spawnDistance;
        const bulletY = y + Math.sin(angle) * spawnDistance;
        
        // Play sound effect
        this.playSound();
        
        // Create muzzle flash effect
        this.createMuzzleFlash(x, y, angle);
        
        return {
            x: bulletX,
            y: bulletY,
            vx: bulletVx,
            vy: bulletVy,
            damage: this.damage,
            playerId: playerId,
            weaponType: this.type
        };
    }
    
    meleeAttack(x, y, angle, playerId) {
        // Knife attack - check for players in range
        const attackRange = this.range;
        const attackAngle = angle;
        const attackArc = Math.PI / 4; // 45 degree arc
        
        this.lastShotTime = Date.now();
        this.playSound();
        
        return {
            type: 'melee',
            x: x,
            y: y,
            angle: attackAngle,
            arc: attackArc,
            range: attackRange,
            damage: this.damage,
            playerId: playerId
        };
    }
    
    reload() {
        if (this.isReloading || this.ammo === this.maxAmmo || this.reserveAmmo <= 0) {
            return false;
        }
        
        this.isReloading = true;
        this.reloadStartTime = Date.now();
        
        // Play reload sound
        this.playReloadSound();
        
        return true;
    }
    
    completeReload() {
        const ammoNeeded = this.maxAmmo - this.ammo;
        const ammoToReload = Math.min(ammoNeeded, this.reserveAmmo);
        
        this.ammo += ammoToReload;
        this.reserveAmmo -= ammoToReload;
        this.isReloading = false;
        
        // Update HUD
        if (window.game && window.game.localPlayer && window.game.localPlayer.weapon === this) {
            window.game.updateHUD();
        }
    }
    
    addAmmo(amount) {
        this.reserveAmmo = Math.min(this.reserveAmmo + amount, this.maxReserveAmmo);
    }
    
    getReloadProgress() {
        if (!this.isReloading) return 0;
        
        const elapsed = Date.now() - this.reloadStartTime;
        return Math.min(elapsed / this.reloadTime, 1);
    }
    
    playSound() {
        // In a real implementation, this would play actual sound files
        console.log(`Playing sound: ${this.sound}`);
        
        // Create a simple beep sound using Web Audio API
        if (window.AudioContext || window.webkitAudioContext) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Different frequencies for different weapons
                const frequencies = {
                    ak47_shot: 200,
                    m4a4_shot: 250,
                    awp_shot: 150,
                    glock_shot: 300,
                    usp_shot: 280,
                    knife_slash: 400
                };
                
                oscillator.frequency.setValueAtTime(frequencies[this.sound] || 200, audioContext.currentTime);
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (e) {
                // Audio context not available
            }
        }
    }
    
    playReloadSound() {
        console.log(`Reloading ${this.name}...`);
        
        // Simple reload sound effect
        if (window.AudioContext || window.webkitAudioContext) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.2);
                oscillator.type = 'sawtooth';
                
                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } catch (e) {
                // Audio context not available
            }
        }
    }
    
    createMuzzleFlash(x, y, angle) {
        // Create a visual muzzle flash effect
        if (window.game && window.game.ctx) {
            const ctx = window.game.ctx;
            const camera = window.game.camera;
            
            // Only create flash if weapon is visible
            const dx = x - camera.x;
            const dy = y - camera.y;
            if (Math.abs(dx) > 1000 || Math.abs(dy) > 1000) return;
            
            // This would be better implemented as a particle system
            setTimeout(() => {
                ctx.save();
                ctx.translate(x - camera.x + window.game.width / 2, y - camera.y + window.game.height / 2);
                ctx.rotate(angle);
                
                // Muzzle flash
                ctx.fillStyle = '#ffff00';
                ctx.globalAlpha = 0.8;
                ctx.fillRect(15, -3, 20, 6);
                
                ctx.fillStyle = '#ff8800';
                ctx.fillRect(20, -2, 15, 4);
                
                ctx.restore();
            }, 0);
            
            // Clear the flash after a short time
            setTimeout(() => {
                if (window.game && window.game.gameState === 'playing') {
                    // The flash will be cleared by the normal render cycle
                }
            }, 50);
        }
    }
    
    // Get weapon stats for UI display
    getStats() {
        return {
            name: this.name,
            damage: this.damage,
            fireRate: this.fireRate,
            accuracy: Math.round(this.accuracy * 100),
            range: this.range,
            ammo: this.ammo,
            maxAmmo: this.maxAmmo,
            reserveAmmo: this.reserveAmmo,
            maxReserveAmmo: this.maxReserveAmmo,
            reloadTime: this.reloadTime / 1000, // Convert to seconds
            isReloading: this.isReloading,
            reloadProgress: this.getReloadProgress()
        };
    }
    
    // Create weapon from type string
    static create(type) {
        return new Weapon(type);
    }
    
    // Get all available weapon types
    static getAvailableTypes() {
        return ['ak47', 'm4a4', 'awp', 'glock', 'usp', 'knife'];
    }
}
