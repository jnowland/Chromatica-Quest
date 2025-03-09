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
        this.width = 45; // Slightly larger for border collie
        this.height = 35;
        this.speedX = 0;
        this.speedY = 0;
        this.maxSpeed = 3; // Slower than player for realistic following
        this.mainColor = '#000000'; // Black main color for border collie
        this.secondaryColor = '#FFFFFF'; // White secondary color
        
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
        // Only update every other frame for performance
        if (window.skipDogFrames === undefined) {
            window.skipDogFrames = 0;
        }
        window.skipDogFrames = (window.skipDogFrames + 1) % 2;
        if (window.skipDogFrames !== 0) return;
        
        // Check if player has moved significantly
        const playerMoved = Math.abs(this.player.x - this.lastPlayerX) > 10 || 
                           Math.abs(this.player.y - this.lastPlayerY) > 10;
        
        if (playerMoved) {
            this.idleTime = 0;
            this.isIdle = false;
        } else {
            this.idleTime += 32; // Assuming ~30fps
            if (this.idleTime > 1000) { // 1 second of no movement
                this.isIdle = true;
            }
        }
        
        // Update tail wagging less frequently
        this.tailWagTimer += 32;
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
        if (distance > 20) {
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
        // Save context for rotation/transformation
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Draw body (black)
        ctx.fillStyle = this.mainColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width/2, this.height/3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw white chest/belly patch
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(0, this.height/8, this.width/3, this.height/5, 0, 0, Math.PI);
        ctx.fill();
        
        // Draw head
        const headX = this.facingRight ? this.width/3 : -this.width/3;
        
        // Black part of head
        ctx.fillStyle = this.mainColor;
        ctx.beginPath();
        ctx.ellipse(headX, -this.height/6, this.width/4, this.height/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // White muzzle/face patch
        ctx.fillStyle = this.secondaryColor;
        const muzzleX = this.facingRight ? headX + this.width/8 : headX - this.width/8;
        ctx.beginPath();
        ctx.ellipse(muzzleX, -this.height/8, this.width/6, this.height/6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pointed ears (border collie style)
        const earBaseX = this.facingRight ? headX + this.width/6 : headX - this.width/6;
        const earTipX = this.facingRight ? earBaseX + this.width/5 : earBaseX - this.width/5;
        
        // Left ear
        ctx.fillStyle = this.mainColor;
        ctx.beginPath();
        ctx.moveTo(earBaseX, -this.height/4);
        ctx.lineTo(earTipX, -this.height/2);
        ctx.lineTo(earBaseX - (this.facingRight ? this.width/10 : -this.width/10), -this.height/4);
        ctx.closePath();
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = 'white';
        const eyeX = this.facingRight ? headX + this.width/10 : headX - this.width/10;
        ctx.beginPath();
        ctx.arc(eyeX, -this.height/5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(eyeX + (this.facingRight ? 1 : -1), -this.height/5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = 'black';
        const noseX = this.facingRight ? muzzleX + this.width/10 : muzzleX - this.width/10;
        ctx.beginPath();
        ctx.arc(noseX, -this.height/10, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw fluffy tail with wagging animation
        const tailX = this.facingRight ? -this.width/2 : this.width/2;
        const tailWagOffset = this.waggingTail ? 5 : -5;
        
        // Fluffy tail base
        ctx.fillStyle = this.mainColor;
        ctx.beginPath();
        ctx.moveTo(tailX, 0);
        
        // Create a fluffy tail with multiple curves
        const tailLength = this.facingRight ? -30 : 30;
        const tailEnd = tailX + tailLength;
        
        ctx.beginPath();
        ctx.moveTo(tailX, 0);
        ctx.quadraticCurveTo(
            tailX + tailLength/2, 
            -10 + tailWagOffset, 
            tailEnd, 
            -5
        );
        ctx.quadraticCurveTo(
            tailX + tailLength/1.5,
            5 + tailWagOffset,
            tailX,
            0
        );
        ctx.fill();
        
        // White tip on tail
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(tailEnd, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw legs
        const frontLegX = this.facingRight ? this.width/4 : -this.width/4;
        const backLegX = this.facingRight ? -this.width/4 : this.width/4;
        const legY = this.height/3;
        
        // Front leg (black)
        ctx.fillStyle = this.mainColor;
        ctx.fillRect(frontLegX - 3, legY, 6, this.height/3);
        
        // Back leg (black)
        ctx.fillRect(backLegX - 3, legY, 6, this.height/3);
        
        // White socks on front paws
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(frontLegX - 3, legY + this.height/5, 6, this.height/8);
        
        // Restore context
        ctx.restore();
    }
} 