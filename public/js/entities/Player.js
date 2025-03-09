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

    update() {
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        
        // Apply gravity
        this.speedY += window.GRAVITY; // Use window.GRAVITY
        this.x += this.speedX;
        this.y += this.speedY;

        // Check boundaries and collisions
        const onGround = this.game.checkCollisions(this);
        
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
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Particle gravity
            
            if (particle.life <= 0) {
                this.jumpParticles.splice(i, 1);
            }
        }

        // Update walk animation
        if (now - this.lastUpdateTime > 100) {
            if (this.speedX !== 0) {
                this.walkCycle += 0.2 * this.walkDirection;
                if (this.walkCycle > 1 || this.walkCycle < -1) {
                    this.walkDirection *= -1;
                }
            } else {
                this.walkCycle = 0;
            }
            this.lastUpdateTime = now;
        }

        // Update facing direction
        if (this.speedX > 0) this.facingRight = true;
        else if (this.speedX < 0) this.facingRight = false;

        // Check draining state
        this.checkDraining();
    }
    
    jump() {
        // Create jump particles
        this.createJumpParticles();
        
        // Apply jump force
        this.speedY = JUMP_FORCE;
        this.isJumping = true;
        this.jumpCount++;
        
        // Reset coyote time
        this.coyoteTime = 0;
    }
    
    createJumpParticles() {
        // Create particles at the player's feet
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * (i / particleCount)) + (Math.PI / particleCount);
            const speed = 1 + Math.random() * 2;
            
            this.jumpParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Initial upward velocity
                size: 2 + Math.random() * 3,
                life: 300 + Math.random() * 200,
                color: `rgba(255, 255, 255, ${0.7 + Math.random() * 0.3})`
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
        // Draw jump particles
        this.jumpParticles.forEach(particle => {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw player body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw player head
        ctx.fillRect(this.x + 5, this.y - 15, this.width - 10, 15);
        
        // Draw player eyes
        ctx.fillStyle = 'black';
        const eyeX = this.facingRight ? this.x + this.width - 15 : this.x + 5;
        ctx.fillRect(eyeX, this.y - 10, 5, 5);
        
        // Draw player legs with animation
        ctx.fillStyle = this.color;
        
        // Left leg
        ctx.save();
        ctx.translate(this.x + 5, this.y + this.height);
        ctx.rotate(this.walkCycle * 0.5);
        ctx.fillRect(-2, 0, 10, 15);
        ctx.restore();
        
        // Right leg
        ctx.save();
        ctx.translate(this.x + this.width - 5, this.y + this.height);
        ctx.rotate(-this.walkCycle * 0.5);
        ctx.fillRect(-8, 0, 10, 15);
        ctx.restore();
        
        // Draw player arms
        ctx.save();
        ctx.translate(this.x, this.y + 10);
        ctx.rotate(this.walkCycle * 0.3);
        ctx.fillRect(0, 0, 10, 5);
        ctx.restore();
        
        ctx.save();
        ctx.translate(this.x + this.width, this.y + 10);
        ctx.rotate(-this.walkCycle * 0.3);
        ctx.fillRect(-10, 0, 10, 5);
        ctx.restore();
        
        // Draw draining effect when near city center
        const distanceToCity = Math.hypot(this.x - this.game.cityCenterX, this.y - this.game.cityCenterY);
        if (distanceToCity < window.COLOR_DRAIN_RADIUS) {
            // Pulsating drain effect
            const pulseSize = 5 + Math.sin(Date.now() / 200) * 3;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, pulseSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw double jump indicator
        if (this.jumpCount === 1 && this.isJumping) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
} 