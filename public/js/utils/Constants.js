/**
 * Game constants
 */
// Define constants in the global scope
window.GRAVITY = 0.5;
window.WALK_ANIMATION_SPEED = 500; // ms per cycle
window.LEG_SWING_ANGLE = Math.PI / 6; // 30 degrees
window.MOVE_SPEED = 5;
window.JUMP_FORCE = -15;
window.DRAIN_EFFECT_QUALITY = 6; // Lower = better quality, higher = better performance (adjusted from 8 to 6)
window.COLOR_DRAIN_RADIUS = 180; // Increased from 150 to 180 for better drain coverage
window.LASER_WIDTH = 10;
window.LASER_COLOR = "rgba(255, 0, 0, 0.7)";
window.PROCESS_EVERY_N_FRAMES = 2; // Reduced from 3 to 2 for more responsive effects
window.MAX_FPS = 60; // Cap the frame rate 