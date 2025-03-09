/**
 * Game constants
 */
// Define constants in the global scope
window.GRAVITY = 0.5;
window.WALK_ANIMATION_SPEED = 500; // ms per cycle
window.LEG_SWING_ANGLE = Math.PI / 6; // 30 degrees
window.MOVE_SPEED = 5;
window.JUMP_FORCE = -15;
window.DRAIN_EFFECT_QUALITY = 24; // Lower = better quality, higher = better performance (significantly increased for performance)
window.COLOR_DRAIN_RADIUS = 100; // Significantly reduced radius for better performance
window.LASER_WIDTH = 10;
window.LASER_COLOR = "rgba(255, 0, 0, 0.7)";
window.PROCESS_EVERY_N_FRAMES = 6; // Process heavy effects much less frequently
window.MAX_FPS = 60; // Cap the frame rate
window.ENABLE_PARTICLE_EFFECTS = false; // Disable particle effects for performance
window.ENABLE_SHADOWS = false; // Disable shadows for better performance
window.ENABLE_MORSE_CODE = false; // Disable morse code for performance
window.LOW_PERFORMANCE_MODE = true; // Enable low performance mode 