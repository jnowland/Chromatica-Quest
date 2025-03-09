/**
 * Dog class representing the companion character
 */
class Dog {
    constructor(game, player) {
        this.game = game;
        this.player = player;
        
        // Initial position behind the player
        this.x = player.x - 100;
        this.y = player.y;
        
        // Dog properties
        this.width = 40;
        this.height = 40;
        this.speedX = 0;
        this.speedY = 0;
        this.maxSpeed = 3; // Slower than player for realistic following
        this.color = '#8B4513'; // Brown color for the dog
        
        // Following behavior properties
        this.followDistance = 100; // Distance to maintain from player
        this.followDistanceY = 10; // Vertical distance to maintain
        this.isJumping = false;
        this.jumpForce = -12;
        this.gravity = 0.4; // Slightly less than player gravity
        this.onGround = false;
        
        // Animation properties
        this.facingRight = true;
        this.idleTime = 0;
        this.isIdle = false;
        this.waggingTail = false;
        this.tailWagTimer = 0;
        this.tailWagInterval = 500; // ms
        
        // State tracking
        this.lastPlayerX = player.x;
        this.lastPlayerY = player.y;
    }

    update() {
        // Check if player has moved significantly
        const playerMoved = Math.abs(this.player.x - this.lastPlayerX) > 5 || 
                           Math.abs(this.player.y - this.lastPlayerY) > 5;
        
        if (playerMoved) {
            this.idleTime = 0;
            this.isIdle = false;
        } else {
            this.idleTime += 16; // Assuming ~60fps
            if (this.idleTime > 1000) { // 1 second of no movement
                this.isIdle = true;
            }
        }
        
        // Update tail wagging
        this.tailWagTimer += 16;
        if (this.tailWagTimer > this.tailWagInterval) {
            this.tailWagTimer = 0;
            this.waggingTail = !this.waggingTail;
        }
        
        // Calculate target position based on player position
        let targetX, targetY;
        
        // If player is moving right, dog should be to the left
        // If player is moving left, dog should be to the right
        const playerMovingRight = this.player.x > this.lastPlayerX;
        const playerMovingLeft = this.player.x < this.lastPlayerX;
        
        if (playerMovingRight) {
            targetX = this.player.x - this.followDistance;
            this.facingRight = true;
        } else if (playerMovingLeft) {
            targetX = this.player.x + this.followDistance;
            this.facingRight = false;
        } else {
            // If player isn't moving horizontally, keep dog on the same side
            targetX = this.facingRight ? 
                this.player.x - this.followDistance : 
                this.player.x + this.followDistance;
        }
        
        // Target Y should be the same as player's Y, adjusted for ground level
        targetY = this.player.y + this.followDistanceY;
        
        // Calculate distance to target
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only move if we're not close enough to the target
        if (distance > 10) {
            // Calculate normalized direction vector
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Set speed based on distance (faster when further away)
            const speedFactor = Math.min(1, distance / 200);
            this.speedX = dirX * this.maxSpeed * speedFactor;
            
            // Only adjust Y speed if we're on the ground
            if (this.onGround) {
                // If player is significantly higher, jump
                if (dy < -50 && !this.isJumping) {
                    this.speedY = this.jumpForce;
                    this.isJumping = true;
                    this.onGround = false;
                }
            }
        } else {
            // Slow down when close to target
            this.speedX *= 0.8;
        }
        
        // Apply gravity
        if (!this.onGround) {
            this.speedY += this.gravity;
        }
        
        // Update position
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Check for collisions with platforms
        this.checkCollisions();
        
        // Update last known player position
        this.lastPlayerX = this.player.x;
        this.lastPlayerY = this.player.y;
    }
    
    checkCollisions() {
        // Reset ground state
        this.onGround = false;
        
        // Check collision with platforms
        for (const platform of this.game.platforms) {
            if (this.x + this.width > platform.x && 
                this.x < platform.x + platform.width &&
                this.y + this.height >= platform.y && 
                this.y + this.height <= platform.y + 10) {
                
                // Land on platform
                this.y = platform.y - this.height;
                this.speedY = 0;
                this.onGround = true;
                this.isJumping = false;
                break;
            }
        }
        
        // Check collision with ground
        if (this.y + this.height > this.game.height) {
            this.y = this.game.height - this.height;
            this.speedY = 0;
            this.onGround = true;
            this.isJumping = false;
        }
        
        // Prevent going off screen
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
    }

    draw(ctx) {
        // Draw dog body (oval shape)
        ctx.fillStyle = this.color;
        
        // Save context for rotation/transformation
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Draw body
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width/2, this.height/3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw head
        const headX = this.facingRight ? this.width/3 : -this.width/3;
        ctx.beginPath();
        ctx.ellipse(headX, -this.height/6, this.width/4, this.height/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw ears
        const earX = this.facingRight ? this.width/2 : -this.width/2;
        ctx.beginPath();
        ctx.ellipse(earX, -this.height/4, this.width/8, this.height/6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = 'white';
        const eyeX = this.facingRight ? this.width/3 + 5 : -this.width/3 - 5;
        ctx.beginPath();
        ctx.arc(eyeX, -this.height/6, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tail with wagging animation
        ctx.fillStyle = this.color;
        const tailX = this.facingRight ? -this.width/2 : this.width/2;
        const tailWagOffset = this.waggingTail ? 5 : -5;
        
        ctx.beginPath();
        ctx.moveTo(tailX, 0);
        ctx.quadraticCurveTo(
            tailX - (this.facingRight ? 15 : -15), 
            -10 + tailWagOffset, 
            tailX - (this.facingRight ? 25 : -25), 
            -5
        );
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw legs
        const frontLegX = this.facingRight ? this.width/4 : -this.width/4;
        const backLegX = this.facingRight ? -this.width/4 : this.width/4;
        const legY = this.height/3;
        
        // Front leg
        ctx.fillStyle = this.color;
        ctx.fillRect(frontLegX - 3, legY, 6, this.height/3);
        
        // Back leg
        ctx.fillRect(backLegX - 3, legY, 6, this.height/3);
        
        // Restore context
        ctx.restore();
    }
} 