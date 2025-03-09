/**
 * Platform class representing a solid surface
 */
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // Store original position for resizing
        this.originalX = x;
        this.originalY = y;
    }
    
    draw(ctx) {
        // Draw platform base
        ctx.fillStyle = '#555555';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add a subtle top edge highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.x, this.y, this.width, 2);
        
        // Add a subtle bottom edge shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x, this.y + this.height - 2, this.width, 2);
    }
} 