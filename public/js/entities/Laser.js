/**
 * Laser class representing a deadly obstacle
 */
class Laser {
    constructor(x, y, width, height, direction, moving, speed, minX = 0, maxX = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.direction = direction; // 1 for horizontal, 2 for vertical
        this.moving = moving;
        this.speed = speed;
        this.minX = minX;
        this.maxX = maxX;
        this.moveDirection = 1; // 1 for right/down, -1 for left/up
    }
    
    update() {
        if (!this.moving) return;
        
        if (this.direction === 1) { // Horizontal laser
            this.x += this.speed * this.moveDirection;
            
            // Check boundaries and reverse direction if needed
            if (this.x <= this.minX || this.x + this.width >= this.maxX) {
                this.moveDirection *= -1;
            }
        } else if (this.direction === 2) { // Vertical laser
            this.y += this.speed * this.moveDirection;
            
            // Check boundaries and reverse direction if needed
            if (this.y <= 0 || this.y + this.height >= window.innerHeight) {
                this.moveDirection *= -1;
            }
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = LASER_COLOR;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add glow effect
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
        
        // Add pulsating core
        const pulseSize = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        ctx.fillStyle = 'rgba(255, 200, 200, 0.8)';
        
        if (this.direction === 1) { // Horizontal laser
            const coreHeight = this.height * 0.4 * pulseSize;
            const coreY = this.y + (this.height - coreHeight) / 2;
            ctx.fillRect(this.x, coreY, this.width, coreHeight);
        } else { // Vertical laser
            const coreWidth = this.width * 0.4 * pulseSize;
            const coreX = this.x + (this.width - coreWidth) / 2;
            ctx.fillRect(coreX, this.y, coreWidth, this.height);
        }
    }
} 