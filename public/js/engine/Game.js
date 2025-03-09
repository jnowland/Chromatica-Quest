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
            drainTarget: 60,
            laserSpeed: 5,
            dogEnabled: true
        };

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
    }

    init() {
        // Generate city background
        this.generateCityBackground();
        
        // Initialize drain map
        this.initDrainMap();
        
        // Create game objects
        this.createPlatforms();
        this.createDog();
        
        this.setupInput();
        this.setupPlayButton();
        this.gameLoop();
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
        // Create a map to track which pixels have been drained
        this.drainMap = new Uint8Array(Math.ceil(this.cityWidth) * Math.ceil(this.cityHeight));
        this.drainedPixels = 0;
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
            let colorIndex;
            if (Math.random() > 0.4) {
                // 60% chance of darker colors (indices 3-7)
                colorIndex = Math.floor(Math.random() * 5) + 3;
            } else {
                // 40% chance of lighter colors (indices 0-2)
                colorIndex = Math.floor(Math.random() * 3);
            }
            
            // Draw building with darker grey/white color
            cityCtx.fillStyle = buildingColors[colorIndex];
            cityCtx.fillRect(x, this.cityHeight - buildingHeight, buildingWidth, buildingHeight);
            
            // Add yellow windows to buildings
            cityCtx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            const windowSize = Math.max(4, this.cityHeight / 100);
            const windowSpacing = windowSize * 2;
            
            for (let wy = this.cityHeight - buildingHeight + windowSpacing; wy < this.cityHeight - windowSpacing; wy += windowSpacing * 1.5) {
                for (let wx = x + windowSpacing/2; wx < x + buildingWidth - windowSpacing/2; wx += windowSpacing) {
                    if (Math.random() > 0.3) { // Some windows are lit
                        cityCtx.fillRect(wx, wy, windowSize, windowSize * 1.5);
                    }
                }
            }
            
            // Add building details
            cityCtx.strokeStyle = 'rgba(50, 50, 50, 0.7)';
            cityCtx.lineWidth = 1;
            cityCtx.strokeRect(x, this.cityHeight - buildingHeight, buildingWidth, buildingHeight);
            
            // Add roof details to some buildings
            if (Math.random() > 0.7) {
                // Use darker colors for roof structures
                const roofColorIndex = Math.floor(Math.random() * 3) + 5;
                cityCtx.fillStyle = buildingColors[roofColorIndex];
                cityCtx.fillRect(x + buildingWidth/4, this.cityHeight - buildingHeight - windowSize*2, buildingWidth/2, windowSize*2);
            }
        }
        
        // Add some foreground details
        const foregroundBuildingSpacing = buildingSpacing * 1.5;
        const foregroundMaxHeight = this.cityHeight * 0.3;
        
        for (let x = 0; x < this.cityWidth; x += foregroundBuildingSpacing) {
            const buildingWidth = Math.random() * (this.cityWidth/40) + (this.cityWidth/80);
            const buildingHeight = Math.random() * foregroundMaxHeight + (this.cityHeight * 0.05);
            
            // Use darker grey for foreground buildings
            const darkGreyColor = `rgba(${Math.floor(Math.random() * 50) + 30}, ${Math.floor(Math.random() * 50) + 30}, ${Math.floor(Math.random() * 50) + 30}, 0.9)`;
            cityCtx.fillStyle = darkGreyColor;
            cityCtx.fillRect(x, this.cityHeight - buildingHeight, buildingWidth, buildingHeight);
            
            // Add yellow windows to foreground buildings too
            cityCtx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            const windowSize = Math.max(3, this.cityHeight / 120);
            const windowSpacing = windowSize * 1.5;
            
            for (let wy = this.cityHeight - buildingHeight + windowSpacing; wy < this.cityHeight - windowSpacing; wy += windowSpacing * 1.5) {
                for (let wx = x + windowSpacing/2; wx < x + buildingWidth - windowSpacing/2; wx += windowSpacing) {
                    if (Math.random() > 0.4) { // More windows are lit in foreground
                        cityCtx.fillRect(wx, wy, windowSize, windowSize);
                    }
                }
            }
        }
        
        // Ground - darker grey
        cityCtx.fillStyle = '#222222';
        cityCtx.fillRect(0, this.cityHeight - this.cityHeight * 0.05, this.cityWidth, this.cityHeight * 0.05);
        
        // Store the color version
        this.cityColorData = cityCtx.getImageData(0, 0, this.cityWidth, this.cityHeight);
        
        // Create grayscale version
        cityCtx.putImageData(this.cityColorData, 0, 0);
        const imageData = cityCtx.getImageData(0, 0, this.cityWidth, this.cityHeight);
        const data = imageData.data;
        
        // Convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;     // red
            data[i + 1] = avg; // green
            data[i + 2] = avg; // blue
        }
        
        this.cityGrayscaleData = imageData;
        
        // Calculate the actual number of pixels in the city
        this.totalPixels = this.cityWidth * this.cityHeight;
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
        this.lasers.push(new Laser(100, 100, LASER_WIDTH, 200, 2, true, this.config.laserSpeed));
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
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
        
        // Only process every N frames for performance
        this.skipFrameCount = (this.skipFrameCount + 1) % DRAIN_EFFECT_QUALITY;
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        // Check if player is in a new position
        const distMoved = Math.hypot(playerCenterX - this.lastPlayerX, playerCenterY - this.lastPlayerY);
        if (distMoved > 5) {
            this.lastPlayerX = playerCenterX;
            this.lastPlayerY = playerCenterY;
            this.drainTrailPositions.push({ x: playerCenterX, y: playerCenterY });
            
            // Limit the trail length
            if (this.drainTrailPositions.length > 100) {
                this.drainTrailPositions.shift();
            }
        }
        
        // Check for victory
        if (this.colorPercentage * 100 >= this.config.drainTarget) {
            // Victory condition met
            if (this.gameState === 'playing') {
                this.gameState = 'levelComplete';
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
            const stepSize = Math.max(2, DRAIN_EFFECT_QUALITY);
            
            // Calculate bounds to avoid unnecessary calculations
            const startX = Math.max(0, Math.floor(relativeX - effectiveRadius));
            const endX = Math.min(this.cityWidth, Math.ceil(relativeX + effectiveRadius));
            const startY = Math.max(0, Math.floor(relativeY - effectiveRadius));
            const endY = Math.min(this.cityHeight, Math.ceil(relativeY + effectiveRadius));
            
            let newDrainedPixels = 0;
            
            // Process pixels for better performance with bounds checking
            for (let y = startY; y < endY; y += stepSize) {
                for (let x = startX; x < endX; x += stepSize) {
                    // Calculate distance from drain center
                    const dx = x - relativeX;
                    const dy = y - relativeY;
                    const distanceSquared = dx * dx + dy * dy;
                    
                    if (distanceSquared < radiusSquared) {
                        // Mark this pixel and surrounding pixels as drained
                        const mapIndex = Math.floor(y) * Math.ceil(this.cityWidth) + Math.floor(x);
                        
                        // Only count if not already drained
                        if (this.drainMap[mapIndex] !== 1) {
                            this.drainMap[mapIndex] = 1;
                            newDrainedPixels++;
                        }
                        
                        // Mark surrounding pixels too for better coverage
                        for (let dy = 0; dy < stepSize && y + dy < endY; dy++) {
                            for (let dx = 0; dx < stepSize && x + dx < endX; dx++) {
                                const nearbyMapIndex = Math.floor(y + dy) * Math.ceil(this.cityWidth) + Math.floor(x + dx);
                                
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
        }
    }

    drawCityWithColorDrainEffect() {
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
        // But store the result to prevent flickering
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
            
            // Create a temporary map to track which pixels we've processed
            // to avoid processing the same pixel multiple times
            const processedMap = new Uint8Array(Math.ceil(this.cityWidth) * Math.ceil(this.cityHeight));
            
            // Apply persistent drain effect from drain map first
            const stepSize = Math.max(1, DRAIN_EFFECT_QUALITY);
            for (let y = 0; y < this.cityHeight; y += stepSize) {
                for (let x = 0; x < this.cityWidth; x += stepSize) {
                    const mapIndex = Math.floor(y) * Math.ceil(this.cityWidth) + Math.floor(x);
                    
                    // If this pixel has been drained before
                    if (this.drainMap[mapIndex] === 1) {
                        const index = (y * this.cityWidth + x) * 4;
                        
                        // Apply grayscale effect
                        data[index] = grayData[index];
                        data[index + 1] = grayData[index + 1];
                        data[index + 2] = grayData[index + 2];
                        
                        // Mark as processed
                        processedMap[mapIndex] = 1;
                        
                        // Apply to surrounding pixels too
                        for (let dy = 0; dy < stepSize && y + dy < this.cityHeight; dy++) {
                            for (let dx = 0; dx < stepSize && x + dx < this.cityWidth; dx++) {
                                if (dx === 0 && dy === 0) continue; // Skip the pixel we already processed
                                
                                const nearbyIndex = ((y + dy) * this.cityWidth + (x + dx)) * 4;
                                const nearbyMapIndex = Math.floor(y + dy) * Math.ceil(this.cityWidth) + Math.floor(x + dx);
                                
                                data[nearbyIndex] = grayData[nearbyIndex];
                                data[nearbyIndex + 1] = grayData[nearbyIndex + 1];
                                data[nearbyIndex + 2] = grayData[nearbyIndex + 2];
                                
                                // Mark as processed
                                processedMap[nearbyMapIndex] = 1;
                            }
                        }
                    }
                }
            }
            
            // Apply current drain effect around player
            if ((this.gameState === 'playing' || this.gameState === 'level2')) {
                // Only apply effect if player is near or over the city
                if (relativeX >= -COLOR_DRAIN_RADIUS && 
                    relativeX <= this.cityWidth + COLOR_DRAIN_RADIUS && 
                    relativeY >= -COLOR_DRAIN_RADIUS && 
                    relativeY <= this.cityHeight + COLOR_DRAIN_RADIUS) {
                    
                    // Calculate bounds to avoid unnecessary calculations
                    const startX = Math.max(0, Math.floor(relativeX - effectiveRadius * 1.5));
                    const endX = Math.min(this.cityWidth, Math.ceil(relativeX + effectiveRadius * 1.5));
                    const startY = Math.max(0, Math.floor(relativeY - effectiveRadius * 1.5));
                    const endY = Math.min(this.cityHeight, Math.ceil(relativeY + effectiveRadius * 1.5));
                    
                    // Apply color-draining effect with optimization
                    // Process fewer pixels for better performance
                    for (let y = startY; y < endY; y += DRAIN_EFFECT_QUALITY) {
                        for (let x = startX; x < endX; x += DRAIN_EFFECT_QUALITY) {
                            const mapIndex = Math.floor(y) * Math.ceil(this.cityWidth) + Math.floor(x);
                            
                            // Skip if already processed by drain map
                            if (processedMap[mapIndex] === 1) continue;
                            
                            const index = (y * this.cityWidth + x) * 4;
                            
                            // Calculate distance from player
                            const dx = x - relativeX;
                            const dy = y - relativeY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            // Apply effect based on distance
                            if (distance < effectiveRadius) {
                                // Inside the drain radius - fully grayscale
                                data[index] = grayData[index];
                                data[index + 1] = grayData[index + 1];
                                data[index + 2] = grayData[index + 2];
                                
                                // Apply the same effect to nearby pixels (optimization)
                                if (DRAIN_EFFECT_QUALITY > 1) {
                                    for (let dy = 0; dy < DRAIN_EFFECT_QUALITY && y + dy < endY; dy++) {
                                        for (let dx = 0; dx < DRAIN_EFFECT_QUALITY && x + dx < endX; dx++) {
                                            if (dx === 0 && dy === 0) continue; // Skip the pixel we already processed
                                            
                                            const nearbyIndex = ((y + dy) * this.cityWidth + (x + dx)) * 4;
                                            const nearbyMapIndex = Math.floor(y + dy) * Math.ceil(this.cityWidth) + Math.floor(x + dx);
                                            
                                            // Skip if already processed
                                            if (processedMap[nearbyMapIndex] === 1) continue;
                                            
                                            data[nearbyIndex] = grayData[nearbyIndex];
                                            data[nearbyIndex + 1] = grayData[nearbyIndex + 1];
                                            data[nearbyIndex + 2] = grayData[nearbyIndex + 2];
                                            
                                            // Mark as processed
                                            processedMap[nearbyMapIndex] = 1;
                                        }
                                    }
                                }
                                
                                // Also update the drain map for persistence
                                this.drainMap[mapIndex] = 1;
                                processedMap[mapIndex] = 1;
                            } else if (distance < effectiveRadius * 1.5) {
                                // Transition zone - blend between grayscale and color
                                const blend = (distance - effectiveRadius) / (effectiveRadius * 0.5);
                                data[index] = grayData[index] * (1 - blend) + colorData[index] * blend;
                                data[index + 1] = grayData[index + 1] * (1 - blend) + colorData[index + 1] * blend;
                                data[index + 2] = grayData[index + 2] * (1 - blend) + colorData[index + 2] * blend;
                                
                                // Apply the same effect to nearby pixels (optimization)
                                if (DRAIN_EFFECT_QUALITY > 1) {
                                    for (let dy = 0; dy < DRAIN_EFFECT_QUALITY && y + dy < endY; dy++) {
                                        for (let dx = 0; dx < DRAIN_EFFECT_QUALITY && x + dx < endX; dx++) {
                                            if (dx === 0 && dy === 0) continue; // Skip the pixel we already processed
                                            
                                            const nearbyIndex = ((y + dy) * this.cityWidth + (x + dx)) * 4;
                                            const nearbyMapIndex = Math.floor(y + dy) * Math.ceil(this.cityWidth) + Math.floor(x + dx);
                                            
                                            // Skip if already processed
                                            if (processedMap[nearbyMapIndex] === 1) continue;
                                            
                                            data[nearbyIndex] = grayData[nearbyIndex] * (1 - blend) + colorData[nearbyIndex] * blend;
                                            data[nearbyIndex + 1] = grayData[nearbyIndex + 1] * (1 - blend) + colorData[nearbyIndex + 1] * blend;
                                            data[nearbyIndex + 2] = grayData[nearbyIndex + 2] * (1 - blend) + colorData[nearbyIndex + 2] * blend;
                                            
                                            // Mark as processed
                                            processedMap[nearbyMapIndex] = 1;
                                        }
                                    }
                                }
                            }
                            // Outside effect radius pixels remain unchanged (optimization)
                        }
                    }
                }
            }
            
            // Apply a final pass to ensure all windows are properly drained
            // This specifically targets yellow windows that might be missed
            // Only do this check periodically to improve performance
            const currentTime = Date.now();
            if (!window.lastWindowCheckTime || currentTime - window.lastWindowCheckTime > 500) {
                window.lastWindowCheckTime = currentTime;
                
                for (let y = 0; y < this.cityHeight; y += DRAIN_EFFECT_QUALITY * 2) {
                    for (let x = 0; x < this.cityWidth; x += DRAIN_EFFECT_QUALITY * 2) {
                        const index = (y * this.cityWidth + x) * 4;
                        const mapIndex = Math.floor(y) * Math.ceil(this.cityWidth) + Math.floor(x);
                        
                        // Skip if already processed
                        if (processedMap[mapIndex] === 1) continue;
                        
                        // Check if this is a yellow window (high red and green, low blue)
                        const isYellowWindow = data[index] > 200 && data[index + 1] > 200 && data[index + 2] < 100;
                        
                        // If it's a yellow window and it's near a drained pixel, drain it too
                        if (isYellowWindow) {
                            let nearDrainedPixel = false;
                            
                            // Check surrounding pixels
                            const checkRadius = DRAIN_EFFECT_QUALITY * 2;
                            for (let dy = -checkRadius; dy <= checkRadius && !nearDrainedPixel; dy += 2) {
                                for (let dx = -checkRadius; dx <= checkRadius && !nearDrainedPixel; dx += 2) {
                                    if (dx === 0 && dy === 0) continue;
                                    
                                    const ny = y + dy;
                                    const nx = x + dx;
                                    
                                    if (ny >= 0 && ny < this.cityHeight && nx >= 0 && nx < this.cityWidth) {
                                        const nearbyMapIndex = Math.floor(ny) * Math.ceil(this.cityWidth) + Math.floor(nx);
                                        if (processedMap[nearbyMapIndex] === 1) {
                                            nearDrainedPixel = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // If near a drained pixel, drain this window too
                            if (nearDrainedPixel) {
                                data[index] = grayData[index];
                                data[index + 1] = grayData[index + 1];
                                data[index + 2] = grayData[index + 2];
                                
                                // Apply to surrounding pixels that might be part of the same window
                                for (let dy = -2; dy <= 2; dy++) {
                                    for (let dx = -2; dx <= 2; dx++) {
                                        const ny = y + dy;
                                        const nx = x + dx;
                                        
                                        if (ny >= 0 && ny < this.cityHeight && nx >= 0 && nx < this.cityWidth) {
                                            const nearbyIndex = (ny * this.cityWidth + nx) * 4;
                                            const nearbyIsYellow = data[nearbyIndex] > 200 && data[nearbyIndex + 1] > 200 && data[nearbyIndex + 2] < 100;
                                            
                                            if (nearbyIsYellow) {
                                                data[nearbyIndex] = grayData[nearbyIndex];
                                                data[nearbyIndex + 1] = grayData[nearbyIndex + 1];
                                                data[nearbyIndex + 2] = grayData[nearbyIndex + 2];
                                                
                                                // Update drain map
                                                const nearbyMapIndex = Math.floor(ny) * Math.ceil(this.cityWidth) + Math.floor(nx);
                                                this.drainMap[nearbyMapIndex] = 1;
                                            }
                                        }
                                    }
                                }
                                
                                // Update drain map
                                this.drainMap[mapIndex] = 1;
                            }
                        }
                    }
                }
            }
            
            // Store the processed image data
            offCtx.putImageData(imageData, 0, 0);
            window.lastProcessedImageData = imageData;
        }
        
        // Draw the resulting image to the main canvas
        this.ctx.drawImage(offscreenCanvas, cityX, cityY);
        
        // Update the drained pixel count
        this.drainedPixels = 0;
        for (let i = 0; i < this.drainMap.length; i++) {
            if (this.drainMap[i] === 1) {
                this.drainedPixels++;
            }
        }
        
        // Update progress and score
        this.colorPercentage = this.drainedPixels / this.totalPixels;
        this.score = Math.floor(this.colorPercentage * 1000); // Score based on drain percentage
    }

    update() {
        if (this.gameState === 'playing' || this.gameState === 'level2') {
            this.player.update();
            
            if (this.dog) {
                this.dog.update();
            }
            
            this.lasers.forEach(laser => laser.update && laser.update());
            
            // Update drain effect
            this.updateDrainMap();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.gameState === 'levelSelect') {
            this.ui.drawLevelSelect();
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

            // Draw player
            this.player.draw(this.ctx);

            // Draw dog AFTER player to ensure it's on top
            if (this.dog) {
                this.dog.draw(this.ctx);
            }

            // Draw debug info
            if (this.showDebug) {
                this.drawDebugInfo();
            }
            
            // Draw UI on top
            this.ui.drawUI();
        }
    }

    gameLoop(timestamp) {
        // Calculate FPS
        if (this.lastFrameTime) {
            const deltaTime = timestamp - this.lastFrameTime;
            this.fps = 1000 / deltaTime;
        }
        this.lastFrameTime = timestamp;
        
        this.update();
        this.draw();
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    drawDebugInfo() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`, 10, 60);
        
        if (this.dog) {
            this.ctx.fillText(`Dog: ${Math.round(this.dog.x)}, ${Math.round(this.dog.y)}`, 10, 80);
        }
        
        this.ctx.fillText(`Game State: ${this.gameState}`, 10, 100);
        this.ctx.fillText(`Drain: ${Math.floor(this.colorPercentage * 100)}%`, 10, 120);
        this.ctx.fillText(`Score: ${this.score}`, 10, 140);
        this.ctx.fillText(`FPS: ${Math.round(this.fps)}`, 10, 160);
    }
} 