// Game constants
let CANVAS_WIDTH = window.innerWidth;
let CANVAS_HEIGHT = window.innerHeight;
const GRAVITY = 0.5;
const JUMP_FORCE = -15;
const MOVE_SPEED = 5;
const TOTAL_COLLECTIBLES = 10;
const COLOR_DRAIN_RADIUS = 150; // Radius of the color-draining effect

// City configuration
const CITY_WIDTH_PERCENTAGE = 100; // Percentage of canvas width
const CITY_HEIGHT_PERCENTAGE = 95; // Percentage of canvas height
let cityWidth = (CANVAS_WIDTH * CITY_WIDTH_PERCENTAGE) / 100;
let cityHeight = (CANVAS_HEIGHT * CITY_HEIGHT_PERCENTAGE) / 100;

// Performance optimization
const DRAIN_EFFECT_QUALITY = 2; // Higher number = lower quality but better performance (1 = full quality)
let lastFrameTime = 0;
let deltaTime = 0;
let fpsCounter = 0;
let fpsTimer = 0;
let currentFps = 0;
let showPerformanceStats = false;

// Game variables
let canvas, ctx;
let player;
let platforms = [];
let collectibles = [];
let colorPercentage = 0;
let score = 0;
let keys = {};
let gameStarted = false;
let cityCanvas = null;
let cityColorData = null;
let cityGrayscaleData = null;

// Persistent drain effect variables
let drainMap = null; // Will store which pixels have been drained
let lastPlayerX = 0;
let lastPlayerY = 0;
let drainTrailPositions = []; // Store positions where player has been

// Audio elements using Howler.js
let sounds = {};

// Game initialization
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');
    
    // Generate city background
    generateCityBackground();
    
    // Initialize drain map
    initDrainMap();
    
    // Initialize audio
    initAudio();
    
    // Create game objects
    createPlayer();
    createPlatforms();
    createCollectibles();
    
    // Event listeners
    window.addEventListener('keydown', function(e) {
        keys[e.key] = true;
        
        // Start game on any key press
        if (!gameStarted) {
            gameStarted = true;
            sounds.bgMusic.play();
            gameLoop(0);
        }
        
        // Jump when space, up arrow, or W is pressed
        if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && player.canJump) {
            player.velocityY = JUMP_FORCE;
            player.canJump = false;
            sounds.jump.play();
        }
        
        // Toggle performance stats with P key
        if (e.key === 'p' || e.key === 'P') {
            showPerformanceStats = !showPerformanceStats;
        }
        
        // Reset drain trail with R key (for testing)
        if (e.key === 'r' || e.key === 'R') {
            initDrainMap();
            drainTrailPositions = [];
        }
    });
    
    window.addEventListener('keyup', function(e) {
        keys[e.key] = false;
    });
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Draw initial screen
    drawStartScreen();
};

function initDrainMap() {
    // Create a map to track which pixels have been drained
    drainMap = new Uint8Array(Math.ceil(cityWidth) * Math.ceil(cityHeight));
}

function generateCityBackground() {
    // Create an offscreen canvas for the city
    cityCanvas = document.createElement('canvas');
    cityCanvas.width = cityWidth;
    cityCanvas.height = cityHeight;
    const cityCtx = cityCanvas.getContext('2d');
    
    // Draw sky gradient background
    const skyGradient = cityCtx.createLinearGradient(0, 0, 0, cityHeight);
    skyGradient.addColorStop(0, '#1a2980');
    skyGradient.addColorStop(0.4, '#26d0ce');
    skyGradient.addColorStop(0.7, '#4a54a3');
    skyGradient.addColorStop(1, '#000000');
    cityCtx.fillStyle = skyGradient;
    cityCtx.fillRect(0, 0, cityWidth, cityHeight);
    
    // Add stars to the sky
    const starCount = Math.floor(cityWidth * cityHeight / 2000); // Scale stars with city size
    for (let i = 0; i < starCount; i++) {
        const x = Math.random() * cityWidth;
        const y = Math.random() * cityHeight * 0.7;
        const size = Math.random() * 2 + 0.5;
        cityCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
        cityCtx.beginPath();
        cityCtx.arc(x, y, size, 0, Math.PI * 2);
        cityCtx.fill();
    }
    
    // Add a moon
    const moonX = cityWidth * 0.8;
    const moonY = cityHeight * 0.2;
    const moonRadius = Math.min(cityWidth, cityHeight) * 0.05;
    
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
    const buildingSpacing = Math.max(10, cityWidth / 80); // Adaptive spacing
    const maxBuildingHeight = cityHeight * 0.7; // Buildings take up to 70% of city height
    const minBuildingHeight = cityHeight * 0.2; // Minimum building height
    
    // Draw multiple buildings with different heights and darker grey/white colors
    for (let x = 0; x < cityWidth; x += buildingSpacing) {
        const buildingWidth = Math.random() * (cityWidth/30) + (cityWidth/60);
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
        cityCtx.fillRect(x, cityHeight - buildingHeight, buildingWidth, buildingHeight);
        
        // Add yellow windows to buildings
        cityCtx.fillStyle = 'rgba(255, 255, 0, 0.8)'; // Yellow windows
        const windowSize = Math.max(4, cityHeight / 100);
        const windowSpacing = windowSize * 2;
        
        for (let wy = cityHeight - buildingHeight + windowSpacing; wy < cityHeight - windowSpacing; wy += windowSpacing * 1.5) {
            for (let wx = x + windowSpacing/2; wx < x + buildingWidth - windowSpacing/2; wx += windowSpacing) {
                if (Math.random() > 0.3) { // Some windows are lit
                    cityCtx.fillRect(wx, wy, windowSize, windowSize * 1.5);
                }
            }
        }
        
        // Add building details
        cityCtx.strokeStyle = 'rgba(50, 50, 50, 0.7)';
        cityCtx.lineWidth = 1;
        cityCtx.strokeRect(x, cityHeight - buildingHeight, buildingWidth, buildingHeight);
        
        // Add roof details to some buildings
        if (Math.random() > 0.7) {
            // Use darker colors for roof structures
            const roofColorIndex = Math.floor(Math.random() * 3) + 5; // Indices 5-7 (darker)
            cityCtx.fillStyle = buildingColors[roofColorIndex];
            cityCtx.fillRect(x + buildingWidth/4, cityHeight - buildingHeight - windowSize*2, buildingWidth/2, windowSize*2);
        }
    }
    
    // Add some foreground details
    // Draw a silhouette of smaller buildings in front with darker colors
    const foregroundBuildingSpacing = buildingSpacing * 1.5;
    const foregroundMaxHeight = cityHeight * 0.3;
    
    for (let x = 0; x < cityWidth; x += foregroundBuildingSpacing) {
        const buildingWidth = Math.random() * (cityWidth/40) + (cityWidth/80);
        const buildingHeight = Math.random() * foregroundMaxHeight + (cityHeight * 0.05);
        
        // Use darker grey for foreground buildings
        const darkGreyColor = `rgba(${Math.floor(Math.random() * 50) + 30}, ${Math.floor(Math.random() * 50) + 30}, ${Math.floor(Math.random() * 50) + 30}, 0.9)`;
        cityCtx.fillStyle = darkGreyColor;
        cityCtx.fillRect(x, cityHeight - buildingHeight, buildingWidth, buildingHeight);
        
        // Add yellow windows to foreground buildings too
        cityCtx.fillStyle = 'rgba(255, 255, 0, 0.8)'; // Yellow windows
        const windowSize = Math.max(3, cityHeight / 120);
        const windowSpacing = windowSize * 1.5;
        
        for (let wy = cityHeight - buildingHeight + windowSpacing; wy < cityHeight - windowSpacing; wy += windowSpacing * 1.5) {
            for (let wx = x + windowSpacing/2; wx < x + buildingWidth - windowSpacing/2; wx += windowSpacing) {
                if (Math.random() > 0.4) { // More windows are lit in foreground
                    cityCtx.fillRect(wx, wy, windowSize, windowSize);
                }
            }
        }
    }
    
    // Ground - darker grey
    cityCtx.fillStyle = '#222222';
    cityCtx.fillRect(0, cityHeight - cityHeight * 0.05, cityWidth, cityHeight * 0.05);
    
    // Store the color version
    cityColorData = cityCtx.getImageData(0, 0, cityWidth, cityHeight);
    
    // Create grayscale version
    cityCtx.putImageData(cityColorData, 0, 0);
    const imageData = cityCtx.getImageData(0, 0, cityWidth, cityHeight);
    const data = imageData.data;
    
    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
    }
    
    cityGrayscaleData = imageData;
}

function handleResize() {
    CANVAS_WIDTH = window.innerWidth;
    CANVAS_HEIGHT = window.innerHeight;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Update city dimensions
    cityWidth = CANVAS_WIDTH;
    
    // Regenerate city with new dimensions
    generateCityBackground();
    
    // Adjust platform positions
    adjustPlatforms();
    
    // Redraw if not started
    if (!gameStarted) {
        drawStartScreen();
    }
}

function adjustPlatforms() {
    // Adjust ground
    platforms[0].width = CANVAS_WIDTH;
    platforms[0].y = CANVAS_HEIGHT - 50;
    
    // Scale other platforms based on canvas size
    const scaleX = CANVAS_WIDTH / 800;
    const scaleY = CANVAS_HEIGHT / 600;
    
    for (let i = 1; i < platforms.length; i++) {
        platforms[i].x = platforms[i].originalX * scaleX;
        platforms[i].y = platforms[i].originalY * scaleY;
    }
    
    // Adjust collectibles
    for (let i = 0; i < collectibles.length; i++) {
        if (collectibles[i].originalX) {
            collectibles[i].x = collectibles[i].originalX * scaleX;
            collectibles[i].y = collectibles[i].originalY * scaleY;
        }
    }
}

function initAudio() {
    // Background music - darker atmospheric sound
    sounds.bgMusic = new Howl({
        src: ['assets/sounds/background.mp3'],
        loop: true,
        volume: 0.4,
        autoplay: false,
        rate: 0.95, // Slightly slower for more ominous feel
        fade: [0, 0.4, 2000] // Fade in over 2 seconds
    });
    
    // Collect sound
    sounds.collect = new Howl({
        src: ['assets/sounds/collect.mp3'],
        volume: 0.7
    });
    
    // Jump sound
    sounds.jump = new Howl({
        src: ['assets/sounds/jump.mp3'],
        volume: 0.5
    });
    
    // Color-draining sound
    sounds.drain = new Howl({
        src: ['assets/sounds/drain.mp3'],
        volume: 0.3,
        loop: true,
        rate: 0.8
    });
}

function createPlayer() {
    player = {
        x: CANVAS_WIDTH * 0.1,
        y: CANVAS_HEIGHT * 0.5,
        width: 40,
        height: 60,
        velocityX: 0,
        velocityY: 0,
        canJump: false,
        color: 'rgba(150, 150, 150, 1)', // Darker grayscale
        isDraining: false, // Track if player is currently draining color
        drainIntensity: 0, // For smooth transition of drain effect
        update: function() {
            // Apply gravity
            this.velocityY += GRAVITY;
            
            // Apply horizontal movement
            if (keys['ArrowLeft'] || keys['a']) {
                this.velocityX = -MOVE_SPEED;
            } else if (keys['ArrowRight'] || keys['d']) {
                this.velocityX = MOVE_SPEED;
            } else {
                this.velocityX = 0;
            }
            
            // Store previous position
            const prevX = this.x;
            const prevY = this.y;
            
            // Update position
            this.x += this.velocityX;
            this.y += this.velocityY;
            
            // Check boundaries
            if (this.x < 0) this.x = 0;
            if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;
            
            // Check if player fell off the screen
            if (this.y > CANVAS_HEIGHT) {
                this.y = CANVAS_HEIGHT * 0.5;
                this.velocityY = 0;
            }
            
            // Update color based on collectibles
            this.updateColor();
            
            // Check if player is over the city for draining effect
            this.checkDraining();
            
            // Record player position for drain trail
            // Calculate the center of the player (stick figure)
            const headRadius = 15;
            const bodyLength = this.height - headRadius * 2;
            const centerX = this.x + this.width/2;
            const centerY = this.y + headRadius + bodyLength/2;
            
            // Calculate movement distance
            const movementDistance = Math.sqrt(
                Math.pow(centerX - lastPlayerX, 2) + 
                Math.pow(centerY - lastPlayerY, 2)
            );
            
            // If player has moved significantly or is at a new position
            if (gameStarted && (movementDistance > 3 || prevX !== this.x || prevY !== this.y)) {
                // For continuous coverage, create intermediate points if moved a lot
                if (movementDistance > COLOR_DRAIN_RADIUS * 0.3 && lastPlayerX !== 0) {
                    // Create intermediate points for smoother drain trail
                    const steps = Math.ceil(movementDistance / (COLOR_DRAIN_RADIUS * 0.2));
                    for (let i = 1; i < steps; i++) {
                        const t = i / steps;
                        const interpX = lastPlayerX + (centerX - lastPlayerX) * t;
                        const interpY = lastPlayerY + (centerY - lastPlayerY) * t;
                        
                        // Update drain map with intermediate position
                        updateDrainMap(interpX, interpY, COLOR_DRAIN_RADIUS * 0.4);
                        
                        // Add to drain trail positions
                        drainTrailPositions.push({
                            x: interpX,
                            y: interpY,
                            radius: COLOR_DRAIN_RADIUS * 0.4
                        });
                    }
                }
                
                // Update last position
                lastPlayerX = centerX;
                lastPlayerY = centerY;
                
                // Add current position to drain trail
                drainTrailPositions.push({
                    x: centerX,
                    y: centerY,
                    radius: COLOR_DRAIN_RADIUS * 0.5 // Smaller persistent drain radius
                });
                
                // Limit the number of positions to prevent memory issues
                if (drainTrailPositions.length > 200) {
                    drainTrailPositions.shift(); // Remove oldest position
                }
                
                // Update drain map with current position
                updateDrainMap(centerX, centerY, COLOR_DRAIN_RADIUS * 0.5);
            }
        },
        updateColor: function() {
            // Calculate RGB values based on color percentage - darker
            const r = Math.floor(150 + (55 * colorPercentage));
            const g = Math.floor(150 + (55 * colorPercentage));
            const b = Math.floor(150 + (55 * colorPercentage));
            this.color = `rgb(${r}, ${g}, ${b})`;
        },
        checkDraining: function() {
            // Check if player is over the city
            if (cityCanvas) {
                const cityX = 0; // Start from left edge
                const cityY = CANVAS_HEIGHT - cityHeight;
                
                // Calculate player center
                const playerCenterX = this.x + this.width/2;
                const playerCenterY = this.y + this.height/2;
                
                // Check if player is near the city
                const isNearCity = 
                    playerCenterX >= cityX - COLOR_DRAIN_RADIUS && 
                    playerCenterX <= cityX + cityWidth + COLOR_DRAIN_RADIUS && 
                    playerCenterY >= cityY - COLOR_DRAIN_RADIUS && 
                    playerCenterY <= cityY + cityHeight + COLOR_DRAIN_RADIUS;
                
                // Smooth transition for draining effect
                if (isNearCity) {
                    if (!this.isDraining) {
                        // Start draining sound if not already playing
                        try {
                            if (!sounds.drain.playing()) {
                                sounds.drain.play();
                            }
                        } catch (e) {
                            console.log("Error playing drain sound:", e);
                        }
                        this.isDraining = true;
                    }
                    
                    // Increase drain intensity gradually
                    this.drainIntensity = Math.min(1, this.drainIntensity + 0.05);
                    
                    // Adjust drain sound volume based on proximity
                    const centerX = cityX + cityWidth/2;
                    const centerY = cityY + cityHeight/2;
                    const distanceToCenter = Math.sqrt(
                        Math.pow(playerCenterX - centerX, 2) + 
                        Math.pow(playerCenterY - centerY, 2)
                    );
                    
                    // Normalize distance (0 = center, 1 = far)
                    // Use the larger dimension for normalization
                    const maxDimension = Math.max(cityWidth, cityHeight);
                    const normalizedDistance = Math.min(1, distanceToCenter / (maxDimension/3));
                    try {
                        sounds.drain.volume(0.3 * (1 - normalizedDistance * 0.7));
                    } catch (e) {
                        console.log("Error adjusting drain sound volume:", e);
                    }
                } else {
                    if (this.isDraining) {
                        // Fade out drain sound
                        try {
                            sounds.drain.fade(sounds.drain.volume(), 0, 500);
                            setTimeout(() => {
                                if (!this.isDraining) {
                                    try {
                                        if (sounds.drain.playing()) {
                                            sounds.drain.stop();
                                        }
                                    } catch (e) {
                                        console.log("Error stopping drain sound:", e);
                                    }
                                }
                            }, 500);
                        } catch (e) {
                            console.log("Error fading drain sound:", e);
                        }
                        this.isDraining = false;
                    }
                    
                    // Decrease drain intensity gradually
                    this.drainIntensity = Math.max(0, this.drainIntensity - 0.05);
                }
            }
        },
        draw: function() {
            // Use a thicker line for the stick figure
            ctx.lineWidth = 4;
            ctx.strokeStyle = this.color;
            
            // Determine if player is jumping
            const isJumping = !this.canJump;
            
            // Calculate stick figure dimensions
            const headRadius = 15;
            const bodyLength = this.height - headRadius * 2;
            const legLength = bodyLength * 0.4;
            const armLength = bodyLength * 0.35;
            
            // Calculate positions
            const headCenterX = this.x + this.width / 2;
            const headCenterY = this.y + headRadius;
            const bodyTopY = headCenterY + headRadius;
            const bodyBottomY = bodyTopY + bodyLength;
            
            // Draw head (circle)
            ctx.beginPath();
            ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw body (vertical line)
            ctx.beginPath();
            ctx.moveTo(headCenterX, bodyTopY);
            ctx.lineTo(headCenterX, bodyBottomY);
            ctx.stroke();
            
            // Draw legs
            // Left leg
            ctx.beginPath();
            ctx.moveTo(headCenterX, bodyBottomY);
            ctx.lineTo(headCenterX - legLength, bodyBottomY + legLength);
            ctx.stroke();
            
            // Right leg
            ctx.beginPath();
            ctx.moveTo(headCenterX, bodyBottomY);
            ctx.lineTo(headCenterX + legLength, bodyBottomY + legLength);
            ctx.stroke();
            
            // Draw arms based on jumping state
            if (isJumping) {
                // Arms up when jumping (V shape above head)
                // Left arm
                ctx.beginPath();
                ctx.moveTo(headCenterX, bodyTopY + bodyLength * 0.2);
                ctx.lineTo(headCenterX - armLength, bodyTopY - armLength * 0.8);
                ctx.stroke();
                
                // Right arm
                ctx.beginPath();
                ctx.moveTo(headCenterX, bodyTopY + bodyLength * 0.2);
                ctx.lineTo(headCenterX + armLength, bodyTopY - armLength * 0.8);
                ctx.stroke();
            } else {
                // Arms down when not jumping (hanging at sides)
                // Left arm
                ctx.beginPath();
                ctx.moveTo(headCenterX, bodyTopY + bodyLength * 0.2);
                ctx.lineTo(headCenterX - armLength, bodyTopY + armLength);
                ctx.stroke();
                
                // Right arm
                ctx.beginPath();
                ctx.moveTo(headCenterX, bodyTopY + bodyLength * 0.2);
                ctx.lineTo(headCenterX + armLength, bodyTopY + armLength);
                ctx.stroke();
            }
            
            // Draw face
            const faceColor = colorPercentage > 0.5 ? 'black' : 'white';
            ctx.fillStyle = faceColor;
            
            // Eyes
            const eyeSize = 3;
            ctx.fillRect(headCenterX - headRadius/2, headCenterY - 2, eyeSize, eyeSize);
            ctx.fillRect(headCenterX + headRadius/2 - eyeSize, headCenterY - 2, eyeSize, eyeSize);
            
            // Mouth - smile when jumping, neutral when not
            ctx.beginPath();
            ctx.lineWidth = 2; // Thinner line for mouth
            if (isJumping) {
                // Happy mouth when jumping
                ctx.arc(headCenterX, headCenterY + 5, headRadius/2, 0, Math.PI);
            } else {
                // Neutral mouth when not jumping
                ctx.moveTo(headCenterX - headRadius/3, headCenterY + 5);
                ctx.lineTo(headCenterX + headRadius/3, headCenterY + 5);
            }
            ctx.stroke();
            ctx.lineWidth = 4; // Restore line width
            
            // Draw drain effect if active
            if (this.drainIntensity > 0) {
                const centerX = headCenterX;
                const centerY = bodyTopY + bodyLength/2;
                
                // Draw pulsating drain aura
                const pulseSize = Math.sin(Date.now() / 200) * 10;
                const radius = Math.max(1, COLOR_DRAIN_RADIUS * this.drainIntensity + pulseSize);
                
                const gradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, radius
                );
                
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
                gradient.addColorStop(0.3, 'rgba(30, 30, 30, 0.5)');
                gradient.addColorStop(0.7, 'rgba(50, 50, 50, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.beginPath();
                ctx.fillStyle = gradient;
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw particles being absorbed - optimize by reducing particle count
                const particleCount = Math.floor(10 * this.drainIntensity); // Reduced from 20 to 10
                for (let i = 0; i < particleCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * radius;
                    
                    // Calculate particle position (moving toward player)
                    const progress = Date.now() / 1000 + i;
                    const moveFactor = (progress % 1); // 0 to 1
                    
                    const finalDistance = distance * (1 - moveFactor);
                    
                    const particleX = centerX + Math.cos(angle) * finalDistance;
                    const particleY = centerY + Math.sin(angle) * finalDistance;
                    
                    // Particle size and opacity based on distance
                    const size = Math.max(0.5, 2 * (1 - finalDistance / radius));
                    const opacity = Math.max(0.1, 0.8 * (1 - finalDistance / radius));
                    
                    // Draw particle
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(50, 50, 50, ${opacity})`;
                    ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    };
}

function createPlatforms() {
    // Ground
    platforms.push({
        x: 0,
        y: CANVAS_HEIGHT - 50,
        width: CANVAS_WIDTH,
        height: 50,
        originalX: 0,
        originalY: 550
    });
    
    // Platforms with original positions for scaling
    const platformPositions = [
        {x: 200, y: 450, width: 100, height: 20},
        {x: 400, y: 400, width: 100, height: 20},
        {x: 600, y: 350, width: 100, height: 20},
        {x: 300, y: 300, width: 100, height: 20},
        {x: 100, y: 250, width: 100, height: 20},
        {x: 500, y: 200, width: 100, height: 20}
    ];
    
    const scaleX = CANVAS_WIDTH / 800;
    const scaleY = CANVAS_HEIGHT / 600;
    
    for (let i = 0; i < platformPositions.length; i++) {
        const pos = platformPositions[i];
        platforms.push({
            x: pos.x * scaleX,
            y: pos.y * scaleY,
            width: pos.width,
            height: pos.height,
            originalX: pos.x,
            originalY: pos.y
        });
    }
}

function createCollectibles() {
    // Create color orbs
    const positions = [
        {x: 230, y: 420},
        {x: 450, y: 370},
        {x: 650, y: 320},
        {x: 350, y: 270},
        {x: 150, y: 220},
        {x: 550, y: 170},
        {x: 700, y: 500},
        {x: 300, y: 500},
        {x: 100, y: 500},
        {x: 400, y: 150}
    ];
    
    const scaleX = CANVAS_WIDTH / 800;
    const scaleY = CANVAS_HEIGHT / 600;
    
    for (let i = 0; i < positions.length; i++) {
        collectibles.push({
            x: positions[i].x * scaleX,
            y: positions[i].y * scaleY,
            originalX: positions[i].x,
            originalY: positions[i].y,
            radius: 15,
            collected: false,
            hue: (i * 36) % 360, // Distribute colors around the color wheel
            animation: 0,
            draw: function() {
                if (this.collected) return;
                
                // Pulsating animation
                this.animation += 0.05;
                const pulse = Math.sin(this.animation) * 2;
                
                // Draw glow - darker
                // Ensure radius is always positive
                const outerRadius = Math.max(1, this.radius + 10 + pulse);
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, outerRadius
                );
                
                // Use darker grayscale for outer glow and hint of color in center
                const colorIntensity = Math.min(0.2, colorPercentage);
                gradient.addColorStop(0, `hsla(${this.hue}, 80%, 40%, ${0.6 + colorIntensity})`);
                gradient.addColorStop(1, 'rgba(50, 50, 50, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, outerRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw orb - darker
                ctx.fillStyle = `hsla(${this.hue}, ${40 + colorPercentage * 40}%, ${30 + colorPercentage * 20}%, 1)`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw highlight - more subtle
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x - this.radius/3, this.y - this.radius/3, this.radius/4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}

function checkCollisions() {
    // Player-Platform collision
    player.canJump = false;
    
    // Calculate stick figure dimensions for collision
    const headRadius = 15;
    const bodyLength = player.height - headRadius * 2;
    const feetY = player.y + headRadius * 2 + bodyLength;
    
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        
        // Check if player's feet are on top of platform
        if (player.x + player.width/2 - headRadius > platform.x &&
            player.x + player.width/2 + headRadius < platform.x + platform.width &&
            feetY >= platform.y &&
            feetY <= platform.y + platform.height/2 &&
            player.velocityY >= 0) {
            
            player.canJump = true;
            player.velocityY = 0;
            player.y = platform.y - (headRadius * 2 + bodyLength);
        }
    }
    
    // Player-Collectible collision
    for (let i = 0; i < collectibles.length; i++) {
        const collectible = collectibles[i];
        
        if (!collectible.collected) {
            // Use the head center for collectible collision
            const headCenterX = player.x + player.width/2;
            const headCenterY = player.y + headRadius;
            
            const dx = headCenterX - collectible.x;
            const dy = headCenterY - collectible.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < headRadius + collectible.radius) {
                collectible.collected = true;
                score++;
                
                // Update color percentage
                colorPercentage = score / TOTAL_COLLECTIBLES;
                
                // Update score display
                document.getElementById('score').textContent = `Colors Collected: ${score}/${TOTAL_COLLECTIBLES}`;
                
                // Play collect sound
                sounds.collect.play();
                
                // Adjust background music based on color percentage - more subtle evolution
                const newVolume = 0.4 + (colorPercentage * 0.3);
                const newRate = 0.95 + (colorPercentage * 0.15);
                
                // Smoothly transition to new audio settings
                sounds.bgMusic.fade(sounds.bgMusic.volume(), newVolume, 1000);
                
                // Gradually increase the playback rate for a sense of progression
                if (colorPercentage > 0.5) {
                    sounds.bgMusic.rate(newRate);
                }
                
                // Add a subtle filter effect as more colors are collected
                if (score === Math.floor(TOTAL_COLLECTIBLES / 2)) {
                    // At halfway point, play a special sound to indicate progress
                    sounds.collect.play();
                    sounds.collect.rate(0.8);
                }
            }
        }
    }
}

function drawStartScreen() {
    // Create a very dark gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, 'rgb(3, 3, 5)');
    gradient.addColorStop(1, 'rgb(10, 10, 15)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Add some subtle stars
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        const size = Math.random() * 1.5 + 0.5;
        const alpha = Math.random() * 0.3;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Title with glow effect
    ctx.shadowColor = 'rgba(150, 150, 255, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Chromatica Quest', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    // Reset shadow for normal text
    ctx.shadowBlur = 0;
    
    ctx.font = '20px Arial';
    ctx.fillText('Restore color to the world by collecting color orbs', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    ctx.fillText('Use Arrow Keys or WASD to move and jump', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    // Pulsating text for start prompt
    const pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.fillText('Press any key to start', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
}

function drawBackground() {
    // Create gradient based on color percentage - even darker
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    
    // Start with much darker grayscale
    const r1 = Math.floor(5 + (colorPercentage * 25));
    const g1 = Math.floor(5 + (colorPercentage * 70));
    const b1 = Math.floor(8 + (colorPercentage * 120));
    
    const r2 = Math.floor(15 + (colorPercentage * 30));
    const g2 = Math.floor(15 + (colorPercentage * 60));
    const b2 = Math.floor(20 + (colorPercentage * 80));
    
    gradient.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
    gradient.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw stars/particles that become more visible with color
    // Optimize by reducing the number of stars and only drawing them when needed
    const starCount = Math.min(60, Math.floor(120 * colorPercentage)); // Fewer stars, scaled with color
    
    if (starCount > 0) { // Only draw stars if there are any visible
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * CANVAS_WIDTH;
            const y = Math.random() * CANVAS_HEIGHT * 0.7;
            const size = Math.random() * 2 + 0.5;
            const alpha = Math.random() * 0.4 * colorPercentage;
            
            if (alpha > 0.05) { // Only draw visible stars
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Draw city background if loaded
    if (cityCanvas) {
        drawCityWithColorDrainEffect();
    }
}

function drawCityWithColorDrainEffect() {
    // Calculate city position (centered at bottom)
    const cityX = 0; // Start from left edge
    const cityY = CANVAS_HEIGHT - cityHeight;
    
    // Create an offscreen canvas for manipulation
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = cityWidth;
    offscreenCanvas.height = cityHeight;
    const offCtx = offscreenCanvas.getContext('2d');
    
    // Start with the colorful version
    offCtx.putImageData(cityColorData, 0, 0);
    
    // Get image data for manipulation
    const imageData = offCtx.getImageData(0, 0, cityWidth, cityHeight);
    const colorData = cityColorData.data;
    const grayData = cityGrayscaleData.data;
    const data = imageData.data;
    
    // Apply persistent drain effect from drain map first
    const stepSize = Math.max(1, DRAIN_EFFECT_QUALITY - 1);
    for (let y = 0; y < cityHeight; y += stepSize) {
        for (let x = 0; x < cityWidth; x += stepSize) {
            const mapIndex = Math.floor(y) * Math.ceil(cityWidth) + Math.floor(x);
            
            // If this pixel has been drained before
            if (drainMap[mapIndex] === 1) {
                const index = (y * cityWidth + x) * 4;
                
                // Apply grayscale effect
                data[index] = grayData[index];
                data[index + 1] = grayData[index + 1];
                data[index + 2] = grayData[index + 2];
                
                // Apply to surrounding pixels too
                for (let dy = 0; dy < stepSize && y + dy < cityHeight; dy++) {
                    for (let dx = 0; dx < stepSize && x + dx < cityWidth; dx++) {
                        if (dx === 0 && dy === 0) continue; // Skip the pixel we already processed
                        
                        const nearbyIndex = ((y + dy) * cityWidth + (x + dx)) * 4;
                        data[nearbyIndex] = grayData[nearbyIndex];
                        data[nearbyIndex + 1] = grayData[nearbyIndex + 1];
                        data[nearbyIndex + 2] = grayData[nearbyIndex + 2];
                    }
                }
            }
        }
    }
    
    // Apply current drain effect around player
    if (gameStarted && player.drainIntensity > 0) {
        // Calculate player position relative to the city image
        const headRadius = 15;
        const bodyLength = player.height - headRadius * 2;
        const centerX = player.x + player.width/2;
        const centerY = player.y + headRadius + bodyLength/2;
        
        const relativeX = centerX - cityX;
        const relativeY = centerY - cityY;
        
        // Only apply effect if player is near or over the city
        if (relativeX >= -COLOR_DRAIN_RADIUS && 
            relativeX <= cityWidth + COLOR_DRAIN_RADIUS && 
            relativeY >= -COLOR_DRAIN_RADIUS && 
            relativeY <= cityHeight + COLOR_DRAIN_RADIUS) {
            
            // Effective drain radius based on player's drain intensity
            // Ensure radius is always positive
            const effectiveRadius = Math.max(1, COLOR_DRAIN_RADIUS * player.drainIntensity);
            
            // Apply color-draining effect with optimization
            // Process fewer pixels for better performance
            for (let y = 0; y < cityHeight; y += DRAIN_EFFECT_QUALITY) {
                for (let x = 0; x < cityWidth; x += DRAIN_EFFECT_QUALITY) {
                    const index = (y * cityWidth + x) * 4;
                    
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
                            for (let dy = 0; dy < DRAIN_EFFECT_QUALITY && y + dy < cityHeight; dy++) {
                                for (let dx = 0; dx < DRAIN_EFFECT_QUALITY && x + dx < cityWidth; dx++) {
                                    if (dx === 0 && dy === 0) continue; // Skip the pixel we already processed
                                    
                                    const nearbyIndex = ((y + dy) * cityWidth + (x + dx)) * 4;
                                    data[nearbyIndex] = grayData[nearbyIndex];
                                    data[nearbyIndex + 1] = grayData[nearbyIndex + 1];
                                    data[nearbyIndex + 2] = grayData[nearbyIndex + 2];
                                }
                            }
                        }
                        
                        // Also update the drain map for persistence
                        const mapIndex = Math.floor(y) * Math.ceil(cityWidth) + Math.floor(x);
                        drainMap[mapIndex] = 1;
                    } else if (distance < effectiveRadius * 1.5) {
                        // Transition zone - blend between grayscale and color
                        const blend = (distance - effectiveRadius) / (effectiveRadius * 0.5);
                        data[index] = grayData[index] * (1 - blend) + colorData[index] * blend;
                        data[index + 1] = grayData[index + 1] * (1 - blend) + colorData[index + 1] * blend;
                        data[index + 2] = grayData[index + 2] * (1 - blend) + colorData[index + 2] * blend;
                        
                        // Apply the same effect to nearby pixels (optimization)
                        if (DRAIN_EFFECT_QUALITY > 1) {
                            for (let dy = 0; dy < DRAIN_EFFECT_QUALITY && y + dy < cityHeight; dy++) {
                                for (let dx = 0; dx < DRAIN_EFFECT_QUALITY && x + dx < cityWidth; dx++) {
                                    if (dx === 0 && dy === 0) continue; // Skip the pixel we already processed
                                    
                                    const nearbyIndex = ((y + dy) * cityWidth + (x + dx)) * 4;
                                    data[nearbyIndex] = grayData[nearbyIndex] * (1 - blend) + colorData[nearbyIndex] * blend;
                                    data[nearbyIndex + 1] = grayData[nearbyIndex + 1] * (1 - blend) + colorData[nearbyIndex + 1] * blend;
                                    data[nearbyIndex + 2] = grayData[nearbyIndex + 2] * (1 - blend) + colorData[nearbyIndex + 2] * blend;
                                }
                            }
                        }
                    }
                    // Outside effect radius pixels remain unchanged (optimization)
                }
            }
        }
    }
    
    offCtx.putImageData(imageData, 0, 0);
    
    // Draw the resulting image to the main canvas
    ctx.drawImage(offscreenCanvas, cityX, cityY);
}

function drawPlatforms() {
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        
        // Calculate platform color based on color percentage - darker
        const r = Math.floor(70 + (colorPercentage * 40));
        const g = Math.floor(70 + (colorPercentage * 60));
        const b = Math.floor(70 + (colorPercentage * 50));
        
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Add texture/detail to platforms - darker
        ctx.strokeStyle = `rgba(30, 30, 30, ${0.4 + (colorPercentage * 0.3)})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        
        // Add top highlight - more subtle
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + (colorPercentage * 0.1)})`;
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
    }
}

function drawCollectibles() {
    for (let i = 0; i < collectibles.length; i++) {
        collectibles[i].draw();
    }
}

function update() {
    player.update();
    checkCollisions();
    
    // Update FPS counter
    fpsCounter++;
    fpsTimer += deltaTime;
    if (fpsTimer >= 1000) {
        currentFps = Math.round(fpsCounter * 1000 / fpsTimer);
        fpsCounter = 0;
        fpsTimer = 0;
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw game elements
    drawBackground();
    drawPlatforms();
    drawCollectibles();
    player.draw();
    
    // Draw victory message if all collectibles are collected
    if (score === TOTAL_COLLECTIBLES) {
        // Create semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Draw glowing text
        ctx.shadowColor = 'rgba(150, 200, 255, 0.8)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Color Restored!', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        
        // Reset shadow for subtitle
        ctx.shadowBlur = 10;
        ctx.font = '20px Arial';
        ctx.fillText('Thank you for playing!', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
        
        // Add a pulsating effect to encourage replay
        const pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(200, 200, 255, ${pulse})`;
        ctx.shadowBlur = 5;
        ctx.font = '16px Arial';
        ctx.fillText('Press F5 to play again', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    }
    
    // Draw performance stats if enabled
    if (showPerformanceStats) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 150, 60);
        
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${currentFps}`, 20, 30);
        ctx.fillText(`Quality: ${DRAIN_EFFECT_QUALITY === 1 ? 'High' : DRAIN_EFFECT_QUALITY === 2 ? 'Medium' : 'Low'}`, 20, 50);
        ctx.fillText('Press P to toggle stats', 20, 70);
    }
}

function gameLoop(timestamp) {
    // Calculate delta time for smooth animations
    if (lastFrameTime === 0) {
        lastFrameTime = timestamp;
    }
    deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Limit delta time to prevent large jumps after tab switch
    if (deltaTime > 100) {
        deltaTime = 16.67; // Cap at ~60fps equivalent
    }
    
    if (gameStarted) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

function updateDrainMap(x, y, radius) {
    // Calculate position relative to the city
    const cityX = 0; // Start from left edge
    const cityY = CANVAS_HEIGHT - cityHeight;
    
    const relativeX = x - cityX;
    const relativeY = y - cityY;
    
    // Only update if position is near or over the city
    if (relativeX >= -radius && 
        relativeX <= cityWidth + radius && 
        relativeY >= -radius && 
        relativeY <= cityHeight + radius) {
        
        // Mark pixels within radius as drained
        const effectiveRadius = Math.max(1, radius);
        const radiusSquared = effectiveRadius * effectiveRadius;
        
        // Use a smaller step size for better coverage
        const stepSize = Math.max(1, DRAIN_EFFECT_QUALITY - 1);
        
        // Process pixels for better performance but with better coverage
        for (let y = 0; y < cityHeight; y += stepSize) {
            for (let x = 0; x < cityWidth; x += stepSize) {
                // Calculate distance from drain center
                const dx = x - relativeX;
                const dy = y - relativeY;
                const distanceSquared = dx * dx + dy * dy;
                
                if (distanceSquared < radiusSquared) {
                    // Mark this pixel and surrounding pixels as drained
                    const index = Math.floor(y) * Math.ceil(cityWidth) + Math.floor(x);
                    drainMap[index] = 1;
                    
                    // Mark surrounding pixels too for better coverage
                    for (let dy = 0; dy < stepSize && y + dy < cityHeight; dy++) {
                        for (let dx = 0; dx < stepSize && x + dx < cityWidth; dx++) {
                            const nearbyIndex = Math.floor(y + dy) * Math.ceil(cityWidth) + Math.floor(x + dx);
                            drainMap[nearbyIndex] = 1;
                        }
                    }
                }
            }
        }
    }
} 