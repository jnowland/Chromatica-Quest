/**
 * Main entry point for the game
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing Chromatica Quest...");
    
    // Create and initialize the game
    const game = new Game('gameCanvas');
    game.init();
    
    // Make game accessible globally for debugging
    window.game = game;
    
    console.log("Game initialized successfully!");
}); 