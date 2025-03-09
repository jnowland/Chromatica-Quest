/**
 * Player class representing the main character
 */
class Player {
    constructor(game) {
        this.game = game;
        this.x = 50;
        this.y = 50;
        this.width = 30;
        this.height = 50;
        this.speedX = 0;
        this.speedY = 0;
        this.isJumping = false;
        this.color = 'white';
        this.drainSound = null;
        this.lastUpdateTime = Date.now();
        this.walkCycle = 0;
        this.walkDirection = 1;
        this.facingRight = true;
        
        // New jump mechanics
        this.jumpCount = 0;
        this.maxJumps = 2; // Allow double jump
        this.coyoteTime = 0;
        this.maxCoyoteTime = 150; // milliseconds
        this.jumpBufferTime = 0;
        this.maxJumpBufferTime = 150; // milliseconds
        this.isJumpHeld = false;
        this.jumpReleased = true;
        this.minJumpForce = JUMP_FORCE * 0.6; // Minimum jump height (when tapping)
        this.jumpParticles = [];
        
        this.initAudio();
    }

    initAudio() {
        // Initialize audio if Howl is available
        try {
            if (typeof Howl !== 'undefined') {
                // Use a relative path from the root, not from the JS file
                this.drainSound = new Howl({
                    src: ['assets/sounds/drain.mp3'], // Updated path to the correct location
                    loop: true,
                    volume: 0,
                    onloaderror: function() {
                        console.warn("Could not load audio file. Using silent audio.");
                    }
                });
            } else {
                console.warn("Howl.js not loaded, audio disabled");
            }
        } catch (error) {
            console.error("Error initializing audio:", error);
            // Continue without audio
        }
    }

    update(deltaTime) {
        // Apply gravity with deltaTime for smoother movement
        const gravityForce = window.GRAVITY * (deltaTime / 16.67); // Normalize to 60fps
        this.speedY += gravityForce;
        
        // Apply movement with deltaTime
        this.x += this.speedX * (deltaTime / 16.67);
        this.y += this.speedY * (deltaTime / 16.67);

        // Check boundaries and collisions
        const onGround = this.game.checkCollisions(this);
        this.onGround = onGround; // Store for reference
        
        // Handle coyote time (time after walking off a platform where you can still jump)
        if (onGround) {
            this.jumpCount = 0; // Reset jump count when on ground
            this.coyoteTime = this.maxCoyoteTime;
        } else {
            this.coyoteTime = Math.max(0, this.coyoteTime - deltaTime);
        }
        
        // Handle jump buffer (pre-registering jump input before landing)
        if (this.jumpBufferTime > 0) {
            this.jumpBufferTime -= deltaTime;
            
            // If we landed while jump was buffered, perform the jump
            if (onGround && this.jumpBufferTime > 0) {
                this.jump();
                this.jumpBufferTime = 0;
            }
        }
        
        // Variable jump height - if jump button released early, reduce upward velocity
        if (!this.isJumpHeld && this.speedY < 0) {
            // Apply a stronger gravity when jump is released early
            this.speedY = Math.max(this.speedY, this.minJumpForce);
        }
        
        // Update jump particles
        for (let i = this.jumpParticles.length - 1; i >= 0; i--) {
            const particle = this.jumpParticles[i];
            particle.life -= deltaTime;
            particle.x += particle.vx * (deltaTime / 16.67);
            particle.y += particle.vy * (deltaTime / 16.67);
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.jumpParticles.splice(i, 1);
            }
        }
        
        // Update walk cycle for animation
        if (this.speedX !== 0) {
            this.walkCycle += deltaTime / 100;
            this.facingRight = this.speedX > 0;
        } else {
            this.walkCycle = 0;
        }
        
        // Check if player is draining color
        this.checkDraining();
    }
    
    jump() {
        // Only allow jumping if we haven't used all our jumps
        if (this.jumpCount < this.maxJumps) {
            this.speedY = JUMP_FORCE;
            this.isJumping = true;
            this.jumpCount++;
            this.jumpReleased = false;
            
            // Create jump particles if enabled
            if (window.ENABLE_PARTICLE_EFFECTS) {
                this.createJumpParticles();
            }
            
            // Play jump sound
            try {
                if (this.drainSound) {
                    this.drainSound.play();
                }
            } catch (e) {
                console.warn("Could not play jump sound", e);
            }
        }
    }
    
    createJumpParticles() {
        // Limit the number of particles for performance
        const particleCount = 10; // Reduced from original
        
        for (let i = 0; i < particleCount; i++) {
            this.jumpParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 2 + 1,
                life: Math.random() * 300 + 200,
                size: Math.random() * 4 + 2,
                color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
            });
        }
    }

    checkDraining() {
        if (!this.drainSound) return;
        
        try {
            const distanceToCity = Math.hypot(this.x - this.game.cityCenterX, this.y - this.game.cityCenterY);
            if (distanceToCity < window.COLOR_DRAIN_RADIUS) {
                if (!this.drainSound.playing()) this.drainSound.play();
                this.drainSound.volume(1 - distanceToCity / window.COLOR_DRAIN_RADIUS);
            } else {
                this.drainSound.volume(0);
            }
        } catch (error) {
            console.warn("Error in drain sound handling:", error);
        }
    }

    draw(ctx) {
        // Skip drawing if off-screen for performance
        if (this.x + this.width < 0 || this.x > ctx.canvas.width || 
            this.y + this.height < 0 || this.y > ctx.canvas.height) {
            return;
        }
        
        // Draw jump particles if enabled
        if (window.ENABLE_PARTICLE_EFFECTS && this.jumpParticles.length > 0) {
            for (const particle of this.jumpParticles) {
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw player body
        ctx.fillStyle = this.color;
        
        // Head (circle)
        const headRadius = 15;
        const headX = this.x + this.width / 2;
        const headY = this.y + headRadius;
        
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Body (rectangle)
        const bodyLength = this.height - headRadius * 2;
        ctx.fillRect(
            this.x + this.width / 4,
            this.y + headRadius * 2,
            this.width / 2,
            bodyLength
        );
        
        // Arms
        const armWidth = this.width / 4;
        const armHeight = bodyLength / 3;
        const armY = this.y + headRadius * 2 + bodyLength / 6;
        
        // Left arm
        ctx.fillRect(
            this.x,
            armY,
            armWidth,
            armHeight
        );
        
        // Right arm
        ctx.fillRect(
            this.x + this.width - armWidth,
            armY,
            armWidth,
            armHeight
        );
        
        // Legs
        const legWidth = this.width / 4;
        const legHeight = bodyLength / 2.5;
        const legY = this.y + headRadius * 2 + bodyLength;
        
        // Calculate leg swing based on walk cycle
        let leftLegOffset = 0;
        let rightLegOffset = 0;
        
        if (this.speedX !== 0) {
            const swingAmount = Math.sin(this.walkCycle) * 5;
            leftLegOffset = swingAmount;
            rightLegOffset = -swingAmount;
        }
        
        // Left leg
        ctx.fillRect(
            this.x + this.width / 4 - legWidth / 2 + leftLegOffset,
            legY,
            legWidth,
            legHeight
        );
        
        // Right leg
        ctx.fillRect(
            this.x + this.width * 3/4 - legWidth / 2 + rightLegOffset,
            legY,
            legWidth,
            legHeight
        );
        
        // Eyes
        ctx.fillStyle = 'black';
        const eyeRadius = 3;
        const eyeY = headY - 2;
        const eyeXOffset = 5;
        
        // Determine eye direction based on facing
        const eyeXDirection = this.facingRight ? 1 : -1;
        
        // Left eye
        ctx.beginPath();
        ctx.arc(
            headX - eyeXOffset * eyeXDirection, 
            eyeY, 
            eyeRadius, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(
            headX + eyeXOffset * eyeXDirection, 
            eyeY, 
            eyeRadius, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    }
} 