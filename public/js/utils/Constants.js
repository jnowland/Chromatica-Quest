/**
 * Game constants
 */
// Define constants in the global scope
window.GRAVITY = 0.5;
window.WALK_ANIMATION_SPEED = 500; // ms per cycle
window.LEG_SWING_ANGLE = Math.PI / 6; // 30 degrees
window.MOVE_SPEED = 5;
window.JUMP_FORCE = -15;
window.DRAIN_EFFECT_QUALITY = 8; // Lower = better quality, higher = better performance (increased from 4 to 8)
window.COLOR_DRAIN_RADIUS = 150; // Reduced from 200 to 150 for better performance
window.LASER_WIDTH = 10;
window.LASER_COLOR = "rgba(255, 0, 0, 0.7)";
window.PROCESS_EVERY_N_FRAMES = 3; // Only process heavy effects every N frames
window.MAX_FPS = 60; // Cap the frame rate 