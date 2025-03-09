/**
 * Main Game class managing game states and logic
 */
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // City configuration
        this.cityWidth = this.width;
        this.cityHeight = this.height * 0.95;
        this.cityCanvas = null;
        this.cityColorData = null;
        this.cityGrayscaleData = null;
        
        // Drain effect variables
        this.drainMap = null;
        this.drainedPixels = 0;
        this.totalPixels = this.cityWidth * this.cityHeight;
        this.colorPercentage = 0;
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;
        this.drainTrailPositions = [];

        // Game state
        this.gameState = 'levelSelect';
        this.selectedLevel = 1;
        this.config = {
            drainTarget: 100,
            laserSpeed: 5,
            dogEnabled: true
        };
        
        // Lives system
        this.lives = 3;
        this.maxLives = 3;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.invulnerableDuration = 1500; // 1.5 seconds of invulnerability after hit

        // Game entities
        this.player = new Player(this);
        this.dog = null;
        this.platforms = [];
        this.lasers = [];
        this.ui = new UI(this);
        
        // Game variables
        this.cityCenterX = this.width / 2;
        this.cityCenterY = this.height / 2;
        this.score = 0; // Score based on drained percentage
        
        // Performance variables
        this.showDebug = true;
        this.fps = 60;
        this.lastFrameTime = 0;
        this.skipFrameCount = 0;

        // Morse code easter egg
        this.morseCode = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 
            'Y': '-.--', 'Z': '--..', ' ': '/'
        };
        this.morseMessage = "YOUR ATTEMPT IS NOT ENOUGH";
        this.morseBlinkTimer = 0;
        this.morseBlinkState = true;
        this.morseBlinkSpeed = 500; // milliseconds
    }

    init() {
        // Initialize game state
        this.gameState = 'levelSelect';
        this.showDebug = false;
        this.score = 0;
        this.fps = 0;
        this.deltaTime = 0;
        this.lastFrameTime = 0;
        this.skipFrameCount = 0;
        
        // Initialize drain map
        this.initDrainMap();
        
        // Generate city background
        this.generateCityBackground();
        
        // Create platforms
        this.createPlatforms();
        
        // Create dog
        if (this.config.dogEnabled) {
            this.createDog();
        }
        
        // Create lasers (will be positioned based on game state)
        this.createLasers();
        
        // Set up input handlers
        this.setupInput();
        
        // Add click debugging
        this.lastClickX = 0;
        this.lastClickY = 0;
        this.clickDebugTimer = 0;
        
        // Start game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    setupPlayButton() {
        // Get the play button from the start screen
        const playButton = document.getElementById('play-button');
        const startScreen = document.getElementById('start-screen');
        
        if (playButton) {
            playButton.addEventListener('click', () => {
                // Hide the start screen
                if (startScreen) {
                    startScreen.style.display = 'none';
                }
                
                // Start the game
                this.gameState = "playing";
                
                // Focus on the canvas for keyboard input
                this.canvas.focus();
            });
        } else {
            console.warn("Play button not found, starting game directly");
            // If button not found, start game directly
            if (startScreen) {
                startScreen.style.display = 'none';
            }
            this.gameState = "playing";
        }
    }

    initDrainMap() {
        if (window.LOW_PERFORMANCE_MODE) {
            // In low performance mode, we use a simpler approach
            this.drainedPixels = 0;
            this.totalPixels = this.cityWidth * this.cityHeight;
            this.drainTrailPositions = [];
            return;
        }
        
        // Create a new drain map with reduced resolution for better performance
        const stepSize = DRAIN_EFFECT_QUALITY;
        const mapWidth = Math.ceil(this.cityWidth / stepSize);
        const mapHeight = Math.ceil(this.cityHeight / stepSize);
        
        this.drainMap = new Uint8Array(mapWidth * mapHeight);
        this.drainedPixels = 0;
        this.totalPixels = this.cityWidth * this.cityHeight;
        
        // Reset color percentage
        this.colorPercentage = 0;
    }

    generateCityBackground() {
        // Create an offscreen canvas for the city
        this.cityCanvas = document.createElement('canvas');
        this.cityCanvas.width = this.cityWidth;
        this.cityCanvas.height = this.cityHeight;
        const cityCtx = this.cityCanvas.getContext('2d');
        
        // Draw sky gradient background
        const skyGradient = cityCtx.createLinearGradient(0, 0, 0, this.cityHeight);
        skyGradient.addColorStop(0, '#1a2980');
        skyGradient.addColorStop(0.4, '#26d0ce');
        skyGradient.addColorStop(0.7, '#4a54a3');
        skyGradient.addColorStop(1, '#000000');
        cityCtx.fillStyle = skyGradient;
        cityCtx.fillRect(0, 0, this.cityWidth, this.cityHeight);
        
        // Add stars to the sky
        const starCount = Math.floor(this.cityWidth * this.cityHeight / 2000);
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * this.cityWidth;
            const y = Math.random() * this.cityHeight * 0.7;
            const size = Math.random() * 2 + 0.5;
            cityCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
            cityCtx.beginPath();
            cityCtx.arc(x, y, size, 0, Math.PI * 2);
            cityCtx.fill();
        }
        
        // Add a moon
        const moonX = this.cityWidth * 0.8;
        const moonY = this.cityHeight * 0.2;
        const moonRadius = Math.min(this.cityWidth, this.cityHeight) * 0.05;
        
        // Moon glow
        const moonGlow = cityCtx.createRadialGradient(
            moonX, moonY, 0,
            moonX, moonY, moonRadius * 3
        );
        moonGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        moonGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        cityCtx.fillStyle = moonGlow;
        cityCtx.beginPath();
        cityCtx.arc(moonX, moonY, moonRadius * 3, 0, Math.PI * 2);
        cityCtx.fill();
        
        // Moon
        cityCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        cityCtx.beginPath();
        cityCtx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        cityCtx.fill();
        
        // Building colors - darker grey and white tones
        const buildingColors = [
            '#FFFFFF', // Pure white
            '#F0F0F0', // White smoke
            '#E0E0E0', // Gainsboro
            '#A9A9A9', // Dark grey
            '#808080', // Grey
            '#696969', // Dim grey
            '#555555', // Medium grey
            '#333333'  // Dark charcoal
        ];
        
        // Calculate building parameters based on city size
        const buildingSpacing = Math.max(10, this.cityWidth / 80);
        const maxBuildingHeight = this.cityHeight * 0.7;
        const minBuildingHeight = this.cityHeight * 0.2;
        
        // Draw multiple buildings with different heights and darker grey/white colors
        for (let x = 0; x < this.cityWidth; x += buildingSpacing) {
            const buildingWidth = Math.random() * (this.cityWidth/30) + (this.cityWidth/60);
            const buildingHeight = Math.random() * (maxBuildingHeight - minBuildingHeight) + minBuildingHeight;
            
            // Use darker colors more frequently
            const colorIndex = Math.floor(Math.random() * buildingColors.length);
            cityCtx.fillStyle = buildingColors[colorIndex];
            
            // Draw the building
            cityCtx.fillRect(x, this.cityHeight - buildingHeight, buildingWidth, buildingHeight);
            
            // Add windows to buildings
            cityCtx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            const windowSize = Math.max(2, buildingWidth / 4);
            const windowSpacing = windowSize * 1.5;
            
            for (let wx = x + windowSize; wx < x + buildingWidth - windowSize; wx += windowSpacing) {
                for (let wy = this.cityHeight - buildingHeight + windowSize; wy < this.cityHeight - windowSize; wy += windowSpacing) {
                    // Only draw some windows (random pattern)
                    if (Math.random() > 0.3) {
                        cityCtx.fillRect(wx, wy, windowSize, windowSize);
                    }
                }
            }
        }
        
        // Store the color version of the city
        this.cityColorData = cityCtx.getImageData(0, 0, this.cityWidth, this.cityHeight);
        
        // Create a grayscale version
        const imageData = cityCtx.getImageData(0, 0, this.cityWidth, this.cityHeight);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;     // R
            data[i + 1] = avg; // G
            data[i + 2] = avg; // B
            // A remains unchanged
        }
        
        // Store the grayscale version
        this.cityGrayscaleData = imageData;
        
        // For low performance mode, create separate canvases for color and grayscale
        if (window.LOW_PERFORMANCE_MODE) {
            // Create color canvas
            this.cityColorCanvas = document.createElement('canvas');
            this.cityColorCanvas.width = this.cityWidth;
            this.cityColorCanvas.height = this.cityHeight;
            const colorCtx = this.cityColorCanvas.getContext('2d');
            colorCtx.putImageData(this.cityColorData, 0, 0);
            
            // Create grayscale canvas
            this.cityGrayscaleCanvas = document.createElement('canvas');
            this.cityGrayscaleCanvas.width = this.cityWidth;
            this.cityGrayscaleCanvas.height = this.cityHeight;
            const grayCtx = this.cityGrayscaleCanvas.getContext('2d');
            grayCtx.putImageData(this.cityGrayscaleData, 0, 0);
            
            // Initialize drain trail positions array
            this.drainTrailPositions = [];
        }
    }

    createPlatforms() {
        // Clear existing platforms
        this.platforms = [];
        
        // Create ground platform
        this.platforms.push(new Platform(0, this.height - 50, this.width, 50));
        
        // Create additional platforms with better distribution
        const platformCount = Math.floor(this.width / 300); // Scale with screen width
        const platformWidth = Math.min(200, this.width / 5);
        const platformHeight = 20;
        
        // Create platforms at different heights
        for (let i = 0; i < platformCount; i++) {
            // Distribute platforms horizontally
            const sectionWidth = this.width / platformCount;
            const x = (i * sectionWidth) + (Math.random() * (sectionWidth - platformWidth));
            
            // Distribute platforms vertically
            const minHeight = this.height * 0.3; // Platforms start at 30% of screen height
            const maxHeight = this.height * 0.8; // Platforms end at 80% of screen height
            const range = maxHeight - minHeight;
            const y = minHeight + (Math.random() * range);
            
            this.platforms.push(new Platform(x, y, platformWidth, platformHeight));
        }
        
        // Add some smaller platforms for variety
        for (let i = 0; i < platformCount / 2; i++) {
            const x = Math.random() * (this.width - platformWidth / 2);
            const y = (this.height * 0.2) + (Math.random() * (this.height * 0.6));
            const width = platformWidth / 2;
            
            this.platforms.push(new Platform(x, y, width, platformHeight));
        }
    }

    createDog() {
        this.dog = new Dog(this, this.player);
    }

    createLasers() {
        // Clear existing lasers
        this.lasers = [];
        
        if (this.gameState === 'level2') {
            // Create 5 lasers for level 2
            
            // Horizontal moving laser at the top
            this.lasers.push(new Laser(
                100, 150, 
                200, LASER_WIDTH, 
                1, true, this.config.laserSpeed, 
                50, this.width - 250
            ));
            
            // Horizontal moving laser in the middle
            this.lasers.push(new Laser(
                this.width - 300, this.height / 2, 
                200, LASER_WIDTH, 
                1, true, this.config.laserSpeed * 1.2, 
                this.width / 2, this.width - 200
            ));
            
            // Vertical moving laser on the left
            this.lasers.push(new Laser(
                200, 100, 
                LASER_WIDTH, 300, 
                2, true, this.config.laserSpeed * 0.8
            ));
            
            // Vertical moving laser on the right
            this.lasers.push(new Laser(
                this.width - 200, this.height / 2 - 150, 
                LASER_WIDTH, 300, 
                2, true, this.config.laserSpeed
            ));
            
            // Diagonal laser in the center (implemented as a horizontal laser that moves vertically)
            this.lasers.push(new Laser(
                this.width / 2 - 150, this.height / 2, 
                300, LASER_WIDTH, 
                2, true, this.config.laserSpeed * 1.5
            ));
        } else {
            // Just one laser for level 1 (for testing)
            this.lasers.push(new Laser(
                -500, -500, // Off-screen
                LASER_WIDTH, 200, 
                2, false, 0
            ));
        }
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState === 'playing' || this.gameState === 'level2') {
                if (e.key === 'ArrowLeft') this.player.speedX = -MOVE_SPEED;
                if (e.key === 'ArrowRight') this.player.speedX = MOVE_SPEED;
                
                // Jump handling with double jump and jump buffering
                if (e.key === ' ') {
                    // Set jump held state for variable jump height
                    this.player.isJumpHeld = true;
                    
                    // Handle jump based on player state
                    if (!this.player.isJumping && (this.player.coyoteTime > 0 || this.player.onGround)) {
                        // First jump - either on ground or within coyote time
                        this.player.jump();
                    } else if (this.player.isJumping && this.player.jumpCount < this.player.maxJumps) {
                        // Double jump - already jumping but haven't used all jumps
                        this.player.jump();
                    } else if (!this.player.onGround && this.player.jumpCount >= this.player.maxJumps) {
                        // Buffer the jump for when we land
                        this.player.jumpBufferTime = this.player.maxJumpBufferTime;
                    }
                }
            } else if (this.gameState === 'levelComplete') {
                // Handle keyboard navigation on victory screen
                if (e.key === '1' || e.key === 'Enter') {
                    // Start level 2
                    this.gameState = 'level2';
                    // Reset game state for level 2
                    this.initDrainMap();
                    this.createPlatforms();
                    this.createLasers();
                    // Reset lives
                    this.lives = this.maxLives;
                } else if (e.key === '2' || e.key === 'Escape') {
                    // Go back to menu
                    this.gameState = 'levelSelect';
                    // Reset game state
                    this.initDrainMap();
                    this.createPlatforms();
                }
            } else if (this.gameState === 'gameOver') {
                // Handle keyboard navigation on game over screen
                if (e.key === '1' || e.key === 'Enter') {
                    // Start level 1 instead of restarting level 2
                    this.gameState = 'playing';
                    // Reset game state
                    this.initDrainMap();
                    this.createPlatforms();
                    this.createLasers();
                    // Reset player position
                    this.player.x = 50;
                    this.player.y = 50;
                    this.player.speedX = 0;
                    this.player.speedY = 0;
                    // Reset lives
                    this.lives = this.maxLives;
                    // Reset score and drain percentage
                    this.score = 0;
                    this.colorPercentage = 0;
                } else if (e.key === '2' || e.key === 'Escape') {
                    // Go back to menu
                    this.gameState = 'levelSelect';
                    // Reset game state
                    this.initDrainMap();
                    this.createPlatforms();
                    // Reset lives
                    this.lives = this.maxLives;
                }
            } else if (this.gameState === 'levelSelect') {
                // Start game on Enter or Space
                if (e.key === 'Enter' || e.key === ' ') {
                    console.log("Starting game from keyboard input");
                    this.gameState = 'playing';
                    
                    // Reset game state when starting
                    this.initDrainMap();
                    this.createPlatforms();
                    this.createLasers();
                    
                    // Reset player position
                    this.player.x = 50;
                    this.player.y = 50;
                    this.player.speedX = 0;
                    this.player.speedY = 0;
                    
                    // Reset lives and score
                    this.lives = this.maxLives;
                    this.score = 0;
                    this.colorPercentage = 0;
                }
            }
            
            // Debug key
            if (e.key === 'd') {
                this.showDebug = !this.showDebug;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') this.player.speedX = 0;
            
            // Handle jump release for variable jump height
            if (e.key === ' ') {
                this.player.isJumpHeld = false;
                this.player.jumpReleased = true;
            }
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Store click position for debugging
            this.lastClickX = clickX;
            this.lastClickY = clickY;
            this.clickDebugTimer = 3000; // Show for 3 seconds
            
            console.log(`Click at ${clickX}, ${clickY} in game state: ${this.gameState}`);
            
            // Toggle debug mode on right side of screen
            if (clickX > this.width - 50 && clickY < 50) {
                this.showDebug = !this.showDebug;
            }
            
            this.ui.handleClick(clickX, clickY);
        });
    }

    checkCollisions(entity) {
        // Check platform collisions
        let onPlatform = false;
        
        this.platforms.forEach(platform => {
            if (entity.y + entity.height > platform.y &&
                entity.y + entity.height < platform.y + platform.height + 5 && // Add a small buffer
                entity.y < platform.y + platform.height &&
                entity.x + entity.width > platform.x &&
                entity.x < platform.x + platform.width) {
                
                // Only adjust position if falling or standing
                if (entity.speedY >= 0) {
                    entity.y = platform.y - entity.height;
                    entity.speedY = 0;
                    if (entity === this.player) {
                        entity.isJumping = false;
                        entity.onGround = true;
                    }
                    onPlatform = true;
                }
            }
        });
        
        // Check ground collision
        if (entity.y + entity.height > this.height) {
            entity.y = this.height - entity.height;
            entity.speedY = 0;
            if (entity === this.player) {
                entity.isJumping = false;
                entity.onGround = true;
            }
            onPlatform = true;
        } else if (entity === this.player && !onPlatform) {
            entity.onGround = false;
        }
        
        // Check wall collisions
        if (entity.x < 0) {
            entity.x = 0;
        } else if (entity.x + entity.width > this.width) {
            entity.x = this.width - entity.width;
        }
        
        return onPlatform;
    }

    updateDrainMap() {
        if (this.gameState !== 'playing' && this.gameState !== 'level2') return;
        
        // Process every frame for more consistent drain effect
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        // Check if player is in a new position
        const distMoved = Math.hypot(playerCenterX - this.lastPlayerX, playerCenterY - this.lastPlayerY);
        if (distMoved > 5) { // Reduced threshold back to 5 for more responsive draining
            this.lastPlayerX = playerCenterX;
            this.lastPlayerY = playerCenterY;
            this.drainTrailPositions.push({ x: playerCenterX, y: playerCenterY });
            
            // Limit the trail length
            if (this.drainTrailPositions.length > 50) {
                this.drainTrailPositions.shift();
            }
            
            // Apply drain effect at player position
            this.applyDrainEffect(playerCenterX, playerCenterY, COLOR_DRAIN_RADIUS);
        }
        
        // Check for victory - must be exactly 100% now
        const drainPercentage = Math.floor(this.colorPercentage * 100);
        if (drainPercentage >= this.config.drainTarget) {
            // Victory condition met
            if (this.gameState === 'playing') {
                this.gameState = 'levelComplete';
                
                // Play victory sound if available
                if (typeof Howl !== 'undefined' && this.sounds && this.sounds.victory) {
                    this.sounds.victory.play();
                }
            }
        }
    }
    
    applyDrainEffect(x, y, radius) {
        // Calculate position relative to the city
        const cityX = 0; // Start from left edge
        const cityY = this.height - this.cityHeight;
        
        const relativeX = x - cityX;
        const relativeY = y - cityY;
        
        // Only update if position is near or over the city
        if (relativeX >= -radius && 
            relativeX <= this.cityWidth + radius && 
            relativeY >= -radius && 
            relativeY <= this.cityHeight + radius) {
            
            // Mark pixels within radius as drained
            const effectiveRadius = Math.max(1, radius);
            const radiusSquared = effectiveRadius * effectiveRadius;
            
            // Use a larger step size for better performance
            const stepSize = Math.max(2, DRAIN_EFFECT_QUALITY / 2); // Reduced step size for better coverage
            
            // Calculate bounds to avoid unnecessary calculations
            const startX = Math.max(0, Math.floor(relativeX - effectiveRadius));
            const endX = Math.min(this.cityWidth, Math.ceil(relativeX + effectiveRadius));
            const startY = Math.max(0, Math.floor(relativeY - effectiveRadius));
            const endY = Math.min(this.cityHeight, Math.ceil(relativeY + effectiveRadius));
            
            let newDrainedPixels = 0;
            const cityWidthCeil = Math.ceil(this.cityWidth);
            
            // Process pixels for better performance with bounds checking
            for (let y = startY; y < endY; y += stepSize) {
                for (let x = startX; x < endX; x += stepSize) {
                    // Calculate distance from drain center
                    const dx = x - relativeX;
                    const dy = y - relativeY;
                    const distanceSquared = dx * dx + dy * dy;
                    
                    if (distanceSquared < radiusSquared) {
                        // Mark this pixel and surrounding pixels as drained
                        const mapIndex = Math.floor(y) * cityWidthCeil + Math.floor(x);
                        
                        // Only count if not already drained
                        if (this.drainMap[mapIndex] !== 1) {
                            this.drainMap[mapIndex] = 1;
                            newDrainedPixels++;
                        }
                        
                        // Mark surrounding pixels too for better coverage
                        for (let dy = 0; dy < stepSize && y + dy < endY; dy++) {
                            for (let dx = 0; dx < stepSize && x + dx < endX; dx++) {
                                const nearbyMapIndex = Math.floor(y + dy) * cityWidthCeil + Math.floor(x + dx);
                                
                                // Only count if not already drained
                                if (this.drainMap[nearbyMapIndex] !== 1) {
                                    this.drainMap[nearbyMapIndex] = 1;
                                    newDrainedPixels++;
                                }
                            }
                        }
                    }
                }
            }
            
            // Update the drained pixel count
            this.drainedPixels += newDrainedPixels;
            
            // Update progress immediately for more responsive UI
            this.colorPercentage = this.drainedPixels / this.totalPixels;
            this.score = Math.floor(this.colorPercentage * 1000);
        }
    }

    drawCityWithColorDrainEffect() {
        // In low performance mode, use a much simpler approach
        if (window.LOW_PERFORMANCE_MODE) {
            this.drawCityLowPerformance();
            return;
        }
        
        // Calculate city position (centered at bottom)
        const cityX = 0; // Start from left edge
        const cityY = this.height - this.cityHeight;
        
        // Create an offscreen canvas for manipulation if it doesn't exist
        if (!window.offscreenCityCanvas) {
            window.offscreenCityCanvas = document.createElement('canvas');
            window.offscreenCityCanvas.width = this.cityWidth;
            window.offscreenCityCanvas.height = this.cityHeight;
            window.lastProcessedFrame = -1; // Force processing on first frame
        }
        
        const offscreenCanvas = window.offscreenCityCanvas;
        const offCtx = offscreenCanvas.getContext('2d', { alpha: false });
        
        // Only process the image data on certain frames to improve performance
        const shouldProcessHeavyEffects = 
            window.lastProcessedFrame === -1 || // First frame
            this.skipFrameCount === 0 || // Regular processing frame
            window.lastCityWidth !== this.cityWidth || // City size changed
            window.lastCityHeight !== this.cityHeight; // City size changed
        
        // Update size tracking
        window.lastCityWidth = this.cityWidth;
        window.lastCityHeight = this.cityHeight;
        
        if (shouldProcessHeavyEffects) {
            window.lastProcessedFrame = Date.now();
            
            // Start with the colorful version
            offCtx.putImageData(this.cityColorData, 0, 0);
            
            // Get image data for manipulation
            const imageData = offCtx.getImageData(0, 0, this.cityWidth, this.cityHeight);
            const colorData = this.cityColorData.data;
            const grayData = this.cityGrayscaleData.data;
            const data = imageData.data;
            
            // Calculate player position relative to the city image for current drain effect
            const headRadius = 15;
            const bodyLength = this.player.height - headRadius * 2;
            const centerX = this.player.x + this.player.width/2;
            const centerY = this.player.y + headRadius + bodyLength/2;
            const relativeX = centerX - cityX;
            const relativeY = centerY - cityY;
            
            // Effective drain radius based on player's drain intensity
            const effectiveRadius = this.gameState === 'playing' || this.gameState === 'level2' ? 
                Math.max(1, COLOR_DRAIN_RADIUS) : 0;
            
            // Use a more efficient approach for the drain map
            // Process in larger chunks for better performance
            const stepSize = DRAIN_EFFECT_QUALITY; // Use the full quality setting
            const cityWidthCeil = Math.ceil(this.cityWidth);
            
            // Apply persistent drain effect from drain map - optimized with larger step size
            for (let y = 0; y < this.cityHeight; y += stepSize) {
                for (let x = 0; x < this.cityWidth; x += stepSize) {
                    const mapIndex = Math.floor(y / stepSize) * Math.ceil(this.cityWidth / stepSize) + Math.floor(x / stepSize);
                    
                    // If this pixel has been drained before
                    if (this.drainMap[mapIndex] === 1) {
                        // Apply grayscale effect to the entire block at once
                        for (let dy = 0; dy < stepSize && y + dy < this.cityHeight; dy += 2) {
                            for (let dx = 0; dx < stepSize && x + dx < this.cityWidth; dx += 2) {
                                const nearbyIndex = ((y + dy) * this.cityWidth + (x + dx)) * 4;
                                
                                data[nearbyIndex] = grayData[nearbyIndex];
                                data[nearbyIndex + 1] = grayData[nearbyIndex + 1];
                                data[nearbyIndex + 2] = grayData[nearbyIndex + 2];
                            }
                        }
                    }
                }
            }
            
            // Apply current drain effect around player only if in view
            if ((this.gameState === 'playing' || this.gameState === 'level2') && 
                relativeX >= -COLOR_DRAIN_RADIUS && 
                relativeX <= this.cityWidth + COLOR_DRAIN_RADIUS && 
                relativeY >= -COLOR_DRAIN_RADIUS && 
                relativeY <= this.cityHeight + COLOR_DRAIN_RADIUS) {
                
                // Calculate bounds to avoid unnecessary calculations
                const startX = Math.max(0, Math.floor(relativeX - effectiveRadius));
                const endX = Math.min(this.cityWidth, Math.ceil(relativeX + effectiveRadius));
                const startY = Math.max(0, Math.floor(relativeY - effectiveRadius));
                const endY = Math.min(this.cityHeight, Math.ceil(relativeY + effectiveRadius));
                
                // Apply color-draining effect with optimization - use larger step size
                for (let y = startY; y < endY; y += stepSize) {
                    for (let x = startX; x < endX; x += stepSize) {
                        const mapIndex = Math.floor(y / stepSize) * Math.ceil(this.cityWidth / stepSize) + Math.floor(x / stepSize);
                        
                        // Skip if already drained
                        if (this.drainMap[mapIndex] === 1) continue;
                        
                        // Calculate distance from player
                        const dx = x - relativeX;
                        const dy = y - relativeY;
                        const distanceSquared = dx * dx + dy * dy;
                        const radiusSquared = effectiveRadius * effectiveRadius;
                        
                        // Apply effect based on distance
                        if (distanceSquared < radiusSquared) {
                            // Mark this block as drained
                            this.drainMap[mapIndex] = 1;
                            this.drainedPixels += (stepSize * stepSize) / 4; // Approximate count
                            
                            // Apply to the entire block at once, but skip pixels for performance
                            for (let dy = 0; dy < stepSize && y + dy < endY; dy += 2) {
                                for (let dx = 0; dx < stepSize && x + dx < endX; dx += 2) {
                                    const blockX = x + dx;
                                    const blockY = y + dy;
                                    
                                    // Skip if out of bounds
                                    if (blockX < startX || blockX >= endX || blockY < startY || blockY >= endY) continue;
                                    
                                    const index = (blockY * this.cityWidth + blockX) * 4;
                                    
                                    // Inside the drain radius - fully grayscale
                                    data[index] = grayData[index];
                                    data[index + 1] = grayData[index + 1];
                                    data[index + 2] = grayData[index + 2];
                                }
                            }
                        }
                    }
                }
            }
            
            // Store the processed image data
            offCtx.putImageData(imageData, 0, 0);
            window.lastProcessedImageData = imageData;
        } else {
            // Reuse the last processed image data if available
            if (window.lastProcessedImageData) {
                offCtx.putImageData(window.lastProcessedImageData, 0, 0);
            }
        }
        
        // Draw the resulting image to the main canvas
        this.ctx.drawImage(offscreenCanvas, cityX, cityY);
    }
    
    // Low performance alternative that doesn't use pixel manipulation
    drawCityLowPerformance() {
        // Calculate city position
        const cityX = 0;
        const cityY = this.height - this.cityHeight;
        
        // Draw the grayscale version as the base
        this.ctx.drawImage(this.cityGrayscaleCanvas, cityX, cityY);
        
        // Calculate the percentage of color drained for UI
        this.colorPercentage = Math.min(100, (this.drainedPixels / this.totalPixels) * 100);
        
        // If we're not playing, just show the grayscale version
        if (this.gameState !== 'playing' && this.gameState !== 'level2') {
            return;
        }
        
        // Create a circular clipping region for the colored part
        this.ctx.save();
        
        // Create a path for the non-drained areas
        this.ctx.beginPath();
        
        // Add circles for each drain position
        for (let i = 0; i < this.drainTrailPositions.length; i++) {
            const pos = this.drainTrailPositions[i];
            this.ctx.rect(0, 0, this.width, this.height);
            this.ctx.arc(pos.x, pos.y, COLOR_DRAIN_RADIUS, 0, Math.PI * 2, true);
        }
        
        // Add circle for current player position
        const centerX = this.player.x + this.player.width/2;
        const centerY = this.player.y + this.player.height/2;
        this.ctx.arc(centerX, centerY, COLOR_DRAIN_RADIUS, 0, Math.PI * 2, true);
        
        this.ctx.clip();
        
        // Draw the colored version in the clipped region
        this.ctx.drawImage(this.cityColorCanvas, cityX, cityY);
        
        this.ctx.restore();
        
        // Update drain trail for next frame
        if (Math.abs(this.player.x - this.lastPlayerX) > 50 || 
            Math.abs(this.player.y - this.lastPlayerY) > 50) {
            
            // Add current position to drain trail
            this.drainTrailPositions.push({
                x: centerX,
                y: centerY
            });
            
            // Keep only the last 10 positions
            if (this.drainTrailPositions.length > 10) {
                this.drainTrailPositions.shift();
            }
            
            // Update last position
            this.lastPlayerX = this.player.x;
            this.lastPlayerY = this.player.y;
            
            // Increment drained pixels
            this.drainedPixels += Math.PI * COLOR_DRAIN_RADIUS * COLOR_DRAIN_RADIUS;
        }
    }

    update() {
        // Calculate delta time
        const now = performance.now();
        this.deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        // Skip update if we're not in a playable state
        if (this.gameState !== 'playing' && this.gameState !== 'level2') {
            return;
        }
        
        // Update player
        this.player.update(this.deltaTime);
        
        // Update dog if it exists
        if (this.dog) {
            this.dog.update(this.deltaTime);
        }
        
        // Update lasers
        this.lasers.forEach(laser => {
            laser.update && laser.update(this.deltaTime);
        });
        
        // Check for collisions with platforms
        this.checkCollisions(this.player);
        
        // Check for laser collisions
        this.checkLaserCollisions();
        
        // Update invulnerability timer
        this.updateInvulnerability(this.deltaTime);
        
        // Update drain map based on player position
        this.updateDrainMap();
        
        // Check if level is complete (100% drained)
        if (this.colorPercentage >= this.config.drainTarget) {
            this.gameState = 'levelComplete';
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.gameState === 'levelSelect') {
            this.ui.drawLevelSelect();
        } else if (this.gameState === 'levelComplete') {
            // Draw the background city first
            this.drawCityWithColorDrainEffect();
            
            // Draw the victory screen on top
            this.ui.drawVictoryScreen();
        } else if (this.gameState === 'gameOver') {
            // Draw the background city first
            this.drawCityWithColorDrainEffect();
            
            // Draw the game over screen on top
            this.ui.drawGameOverScreen();
        } else {
            // Draw city with drain effect
            this.drawCityWithColorDrainEffect();
            
            // Draw platforms
            this.platforms.forEach(platform => {
                platform.draw(this.ctx);
            });

            // Draw lasers
            this.lasers.forEach(laser => {
                laser.draw && laser.draw(this.ctx);
            });

            // Draw player (blinking when invulnerable)
            if (!this.invulnerable || Math.floor(Date.now() / 200) % 2 === 0) {
                this.player.draw(this.ctx);
            }

            // Draw dog AFTER player to ensure it's on top
            if (this.dog) {
                this.dog.draw(this.ctx);
            }
            
            // Draw morse code sign in Level 2
            if (this.gameState === 'level2') {
                this.drawMorseCodeSign();
            }

            // Draw debug info
            if (this.showDebug) {
                this.drawDebugInfo();
            }
            
            // Draw UI on top
            this.ui.drawUI();
            
            // Draw lives
            this.drawLives();
        }
    }

    drawLives() {
        const heartSize = 30;
        const spacing = 10;
        const startX = 20;
        const startY = 20;
        
        for (let i = 0; i < this.maxLives; i++) {
            const x = startX + i * (heartSize + spacing);
            
            if (i < this.lives) {
                // Draw filled heart
                this.ctx.fillStyle = '#ff3366';
                this.ctx.beginPath();
                this.ctx.moveTo(x + heartSize / 2, startY + heartSize / 5);
                this.ctx.bezierCurveTo(
                    x + heartSize / 2, startY, 
                    x, startY, 
                    x, startY + heartSize / 3
                );
                this.ctx.bezierCurveTo(
                    x, startY + heartSize / 1.5, 
                    x + heartSize / 2, startY + heartSize, 
                    x + heartSize / 2, startY + heartSize
                );
                this.ctx.bezierCurveTo(
                    x + heartSize / 2, startY + heartSize, 
                    x + heartSize, startY + heartSize / 1.5, 
                    x + heartSize, startY + heartSize / 3
                );
                this.ctx.bezierCurveTo(
                    x + heartSize, startY, 
                    x + heartSize / 2, startY, 
                    x + heartSize / 2, startY + heartSize / 5
                );
                this.ctx.fill();
            } else {
                // Draw empty heart
                this.ctx.strokeStyle = '#ff3366';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x + heartSize / 2, startY + heartSize / 5);
                this.ctx.bezierCurveTo(
                    x + heartSize / 2, startY, 
                    x, startY, 
                    x, startY + heartSize / 3
                );
                this.ctx.bezierCurveTo(
                    x, startY + heartSize / 1.5, 
                    x + heartSize / 2, startY + heartSize, 
                    x + heartSize / 2, startY + heartSize
                );
                this.ctx.bezierCurveTo(
                    x + heartSize / 2, startY + heartSize, 
                    x + heartSize, startY + heartSize / 1.5, 
                    x + heartSize, startY + heartSize / 3
                );
                this.ctx.bezierCurveTo(
                    x + heartSize, startY, 
                    x + heartSize / 2, startY, 
                    x + heartSize / 2, startY + heartSize / 5
                );
                this.ctx.stroke();
            }
        }
    }

    // Convert text to morse code
    textToMorse(text) {
        return text.toUpperCase().split('').map(char => {
            return this.morseCode[char] || char;
        }).join(' ');
    }
    
    // Draw morse code sign
    drawMorseCodeSign() {
        if (!window.ENABLE_MORSE_CODE || this.gameState !== 'level2') return;
        
        // Update blink timer
        this.morseBlinkTimer += this.deltaTime;
        if (this.morseBlinkTimer >= this.morseBlinkSpeed) {
            this.morseBlinkState = !this.morseBlinkState;
            this.morseBlinkTimer = 0;
        }
        
        // Only draw when blink state is true
        if (!this.morseBlinkState) return;
        
        const morse = this.textToMorse(this.morseMessage);
        const dotSize = 8;
        const dashLength = dotSize * 3;
        const spacing = dotSize;
        const charSpacing = dotSize * 3;
        const wordSpacing = dotSize * 7;
        
        // Position the morse code sign at the top of the screen
        let x = 50;
        const y = 80;
        
        this.ctx.fillStyle = '#ffcc00';
        
        // Draw morse code
        for (let i = 0; i < morse.length; i++) {
            const symbol = morse[i];
            
            if (symbol === '.') {
                // Draw dot
                this.ctx.beginPath();
                this.ctx.arc(x + dotSize/2, y, dotSize/2, 0, Math.PI * 2);
                this.ctx.fill();
                x += dotSize + spacing;
            } else if (symbol === '-') {
                // Draw dash
                this.ctx.fillRect(x, y - dotSize/2, dashLength, dotSize);
                x += dashLength + spacing;
            } else if (symbol === ' ') {
                // Character spacing
                x += charSpacing;
            } else if (symbol === '/') {
                // Word spacing
                x += wordSpacing;
            }
        }
        
        // Draw a small label to hint at the morse code
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('Morse Code:', 10, y);
    }

    gameLoop(timestamp) {
        // Calculate delta time and FPS
        if (this.lastFrameTime) {
            const deltaTime = timestamp - this.lastFrameTime;
            
            // Frame rate limiting
            if (MAX_FPS > 0) {
                const frameTime = 1000 / MAX_FPS;
                if (deltaTime < frameTime) {
                    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
                    return;
                }
            }
            
            // Calculate FPS for debug display
            this.fps = Math.round(1000 / deltaTime);
            
            // Limit delta time to prevent huge jumps after tab switch or lag
            this.deltaTime = Math.min(deltaTime, 100);
        } else {
            this.deltaTime = 16.67; // Default to 60fps on first frame
        }
        
        this.lastFrameTime = timestamp;
        
        // Update frame counter for processing heavy effects
        this.skipFrameCount = (this.skipFrameCount + 1) % PROCESS_EVERY_N_FRAMES;
        
        // Update game state
        this.update();
        
        // Draw game
        this.draw();
        
        // Request next frame with performance optimization
        if (window.requestAnimationFrame) {
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        } else {
            // Fallback for older browsers
            setTimeout(() => this.gameLoop(performance.now()), 1000 / MAX_FPS);
        }
    }

    drawDebugInfo() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`, 10, 60);
        
        if (this.dog) {
            this.ctx.fillText(`Dog: ${Math.round(this.dog.x)}, ${Math.round(this.dog.y)}`, 10, 80);
        }
        
        this.ctx.fillText(`FPS: ${Math.round(this.fps)}`, 10, 100);
        this.ctx.fillText(`Game State: ${this.gameState}`, 10, 120);
        this.ctx.fillText(`Drained: ${Math.round(this.colorPercentage)}%`, 10, 140);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 160);
        
        // Show click debug info
        if (this.clickDebugTimer > 0) {
            this.ctx.fillStyle = 'yellow';
            this.ctx.fillText(`Last Click: ${Math.round(this.lastClickX)}, ${Math.round(this.lastClickY)}`, 10, 180);
            this.clickDebugTimer -= this.deltaTime;
        }
        
        // Draw collision boxes
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 1;
        
        // Player collision box
        this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Platform collision boxes
        this.ctx.strokeStyle = 'green';
        this.platforms.forEach(platform => {
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // Laser collision boxes
        this.ctx.strokeStyle = 'yellow';
        this.lasers.forEach(laser => {
            this.ctx.strokeRect(laser.x, laser.y, laser.width, laser.height);
        });
    }

    checkLaserCollisions() {
        if (this.gameState !== 'level2' || this.invulnerable) return false;
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        // Check collision with each laser
        for (const laser of this.lasers) {
            // Simple rectangular collision detection
            if (this.player.x < laser.x + laser.width &&
                this.player.x + this.player.width > laser.x &&
                this.player.y < laser.y + laser.height &&
                this.player.y + this.player.height > laser.y) {
                
                // Player hit a laser
                this.handleLaserHit();
                return true;
            }
        }
        
        return false;
    }
    
    handleLaserHit() {
        // Reduce lives
        this.lives--;
        
        // Make player invulnerable temporarily
        this.invulnerable = true;
        this.invulnerableTimer = this.invulnerableDuration;
        
        // Check if game over
        if (this.lives <= 0) {
            this.gameState = 'gameOver';
        } else {
            // Reset player position
            this.player.x = 50;
            this.player.y = 50;
            this.player.speedX = 0;
            this.player.speedY = 0;
        }
    }
    
    updateInvulnerability(deltaTime) {
        if (this.invulnerable) {
            this.invulnerableTimer -= deltaTime;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }
} 