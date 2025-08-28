class Player {
    constructor(data) {
        this.id = data.id;
        this.name = data.name || 'Player';
        this.x = data.x || 400;
        this.y = data.y || 300;
        this.angle = data.angle || 0;
        this.team = data.team || 'terrorist'; // terrorist or counter-terrorist
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        this.speed = 3;
        this.radius = 15;
        
        // Health and armor
        this.health = 100;
        this.armor = 0;
        this.maxHealth = 100;
        
        // Weapon
        this.weapon = new Weapon('ak47');
        this.weapons = [this.weapon];
        this.currentWeaponIndex = 0;
        
        // State
        this.isAlive = true;
        this.isMoving = false;
        this.isCrouching = false;
        this.isRunning = false;
        
        // Animation
        this.walkCycle = 0;
        this.lastShotTime = 0;
        
        // Network sync
        this.lastUpdate = Date.now();
        this.interpolationBuffer = [];
    }
    
    update(keys) {
        if (!this.isAlive) return;
        
        this.handleInput(keys);
        this.updateMovement();
        this.updateWeapon();
        this.updateAnimation();
    }
    
    handleInput(keys) {
        if (!keys) return;
        
        let moveX = 0;
        let moveY = 0;
        
        // Movement input
        if (keys['KeyW'] || keys['ArrowUp']) {
            moveY = -1;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            moveY = 1;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
            moveX = -1;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            moveX = 1;
        }
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }
        
        // Apply movement relative to player rotation
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        this.vx = (moveX * cos - moveY * sin) * this.speed;
        this.vy = (moveX * sin + moveY * cos) * this.speed;
        
        this.isMoving = moveX !== 0 || moveY !== 0;
        
        // Crouching
        this.isCrouching = keys['KeyC'] || keys['ControlLeft'];
        if (this.isCrouching) {
            this.vx *= 0.5;
            this.vy *= 0.5;
        }
        
        // Running
        this.isRunning = keys['ShiftLeft'] && this.isMoving;
        if (this.isRunning) {
            this.vx *= 1.5;
            this.vy *= 1.5;
        }
        
        // Weapon switching
        if (keys['Digit1']) {
            this.switchWeapon(0);
        }
        if (keys['Digit2']) {
            this.switchWeapon(1);
        }
        if (keys['Digit3']) {
            this.switchWeapon(2);
        }
        
        // Reload
        if (keys['KeyR']) {
            this.reload();
        }
    }
    
    updateMovement() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply friction
        this.vx *= 0.8;
        this.vy *= 0.8;
    }
    
    updateWeapon() {
        if (this.weapon) {
            this.weapon.update();
        }
    }
    
    updateAnimation() {
        if (this.isMoving) {
            this.walkCycle += 0.2;
        }
    }
    
    rotate(deltaX, deltaY) {
        this.angle += deltaX * 0.002;
        
        // Keep angle in range [0, 2π]
        if (this.angle < 0) this.angle += Math.PI * 2;
        if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
    }
    
    shoot() {
        if (!this.weapon || !this.weapon.canShoot()) return;
        
        const bulletData = this.weapon.shoot(this.x, this.y, this.angle, this.id);
        if (bulletData && window.game) {
            window.game.addBullet(bulletData);
            
            // Send to network if connected
            if (window.network && window.network.isConnected()) {
                window.network.sendShoot(bulletData);
            }
        }
        
        this.lastShotTime = Date.now();
    }
    
    reload() {
        if (this.weapon) {
            this.weapon.reload();
        }
    }
    
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.currentWeaponIndex = index;
            this.weapon = this.weapons[index];
        }
    }
    
    takeDamage(damage) {
        if (!this.isAlive) return;
        
        // Apply armor reduction
        let actualDamage = damage;
        if (this.armor > 0) {
            const armorReduction = Math.min(damage * 0.5, this.armor);
            actualDamage -= armorReduction;
            this.armor -= armorReduction;
        }
        
        this.health -= actualDamage;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        
        // Update HUD if this is local player
        if (window.game && window.game.localPlayer === this) {
            window.game.updateHUD();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        
        if (window.game && window.game.localPlayer === this) {
            window.game.updateHUD();
        }
    }
    
    die() {
        this.isAlive = false;
        this.vx = 0;
        this.vy = 0;
        
        // Death effects could be added here
        console.log(`${this.name} has been eliminated`);
    }
    
    respawn(x, y) {
        this.x = x || 400;
        this.y = y || 300;
        this.health = this.maxHealth;
        this.armor = 0;
        this.isAlive = true;
        this.vx = 0;
        this.vy = 0;
        
        // Reset weapon
        if (this.weapon) {
            this.weapon.reload();
        }
    }
    
    render(ctx, camera) {
        // Only render if in view
        const dx = this.x - camera.x;
        const dy = this.y - camera.y;
        if (Math.abs(dx) > 1000 || Math.abs(dy) > 1000) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Player body
        if (this.isAlive) {
            // Team colors
            ctx.fillStyle = this.team === 'terrorist' ? '#ff4444' : '#4444ff';
            
            // Crouching effect
            const bodyHeight = this.isCrouching ? this.radius * 0.7 : this.radius;
            
            // Body
            ctx.fillRect(-this.radius * 0.8, -bodyHeight, this.radius * 1.6, bodyHeight * 2);
            
            // Direction indicator
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.radius * 0.5, -2, this.radius * 0.5, 4);
            
            // Weapon
            if (this.weapon) {
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(this.radius * 0.8, 0);
                ctx.lineTo(this.radius * 1.5, 0);
                ctx.stroke();
            }
            
            // Walking animation
            if (this.isMoving) {
                const bobOffset = Math.sin(this.walkCycle) * 2;
                ctx.translate(0, bobOffset);
            }
        } else {
            // Dead player
            ctx.fillStyle = '#666';
            ctx.fillRect(-this.radius, -4, this.radius * 2, 8);
        }
        
        ctx.restore();
        
        // Name tag
        if (this.isAlive) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, this.x, this.y - this.radius - 10);
            
            // Health bar
            if (this.health < this.maxHealth) {
                const barWidth = 30;
                const barHeight = 4;
                const healthPercent = this.health / this.maxHealth;
                
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x - barWidth/2, this.y - this.radius - 25, barWidth, barHeight);
                
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(this.x - barWidth/2, this.y - this.radius - 25, barWidth * healthPercent, barHeight);
            }
        }
    }
    
    // Network synchronization methods
    getState() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            angle: this.angle,
            health: this.health,
            isAlive: this.isAlive,
            isMoving: this.isMoving,
            isCrouching: this.isCrouching,
            weapon: this.weapon ? this.weapon.name : null,
            team: this.team
        };
    }
    
    setState(state) {
        // Interpolate position for smooth movement
        this.interpolationBuffer.push({
            x: state.x,
            y: state.y,
            angle: state.angle,
            timestamp: Date.now()
        });
        
        // Keep buffer size manageable
        if (this.interpolationBuffer.length > 10) {
            this.interpolationBuffer.shift();
        }
        
        // Update other properties immediately
        this.health = state.health;
        this.isAlive = state.isAlive;
        this.isMoving = state.isMoving;
        this.isCrouching = state.isCrouching;
        this.team = state.team;
    }
    
    interpolatePosition() {
        if (this.interpolationBuffer.length < 2) return;
        
        const now = Date.now();
        const renderTime = now - 100; // 100ms behind for smooth interpolation
        
        // Find the two states to interpolate between
        let before = null;
        let after = null;
        
        for (let i = 0; i < this.interpolationBuffer.length - 1; i++) {
            if (this.interpolationBuffer[i].timestamp <= renderTime && 
                this.interpolationBuffer[i + 1].timestamp >= renderTime) {
                before = this.interpolationBuffer[i];
                after = this.interpolationBuffer[i + 1];
                break;
            }
        }
        
        if (before && after) {
            const timeDiff = after.timestamp - before.timestamp;
            const progress = (renderTime - before.timestamp) / timeDiff;
            
            this.x = before.x + (after.x - before.x) * progress;
            this.y = before.y + (after.y - before.y) * progress;
            this.angle = before.angle + (after.angle - before.angle) * progress;
        }
    }
}
