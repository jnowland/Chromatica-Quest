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
        this.pulseOffset = Math.random() * 1000; // Randomize pulse timing
        this.isVisible = true; // For culling
    }
    
    update(deltaTime) {
        if (!this.moving) return;
        
        // Use deltaTime for smoother movement
        const frameSpeed = this.speed * (deltaTime / 16.67); // Normalize to 60fps
        
        if (this.direction === 1) { // Horizontal laser
            this.x += frameSpeed * this.moveDirection;
            
            // Check boundaries and reverse direction if needed
            if (this.x <= this.minX || this.x + this.width >= this.maxX) {
                this.moveDirection *= -1;
            }
        } else if (this.direction === 2) { // Vertical laser
            this.y += frameSpeed * this.moveDirection;
            
            // Check boundaries and reverse direction if needed
            if (this.y <= 0 || this.y + this.height >= window.innerHeight) {
                this.moveDirection *= -1;
            }
        }
        
        // Visibility culling - check if laser is on screen
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        this.isVisible = !(
            this.x + this.width < 0 ||
            this.x > screenWidth ||
            this.y + this.height < 0 ||
            this.y > screenHeight
        );
    }
    
    draw(ctx) {
        // Skip drawing if not visible
        if (!this.isVisible) return;
        
        // Base laser
        ctx.fillStyle = LASER_COLOR;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add glow effect only if shadows are enabled
        if (window.ENABLE_SHADOWS) {
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 15;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.shadowBlur = 0;
        }
        
        // Add pulsating core with optimized calculation
        const pulseSize = Math.sin((Date.now() + this.pulseOffset) / 200) * 0.2 + 0.8;
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