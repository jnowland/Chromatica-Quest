/**
 * UI class handling all user interface elements
 */
class UI {
    constructor(game) {
        this.game = game;
    }
    
    drawUI() {
        const ctx = this.game.ctx;
        
        // Create a semi-transparent background for the UI bar at the top
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.game.width, 40);
        
        // Draw color percentage (left side)
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText(`Screen Drained: ${Math.floor(this.game.colorPercentage * 100)}% / ${this.game.config.drainTarget}%`, 10, 25);
        
        // Draw score (right side) - now based on drainage
        ctx.textAlign = 'right';
        ctx.fillText(`Score: ${this.game.score}`, this.game.width - 10, 25);
        
        // Draw current level (center)
        ctx.textAlign = 'center';
        let currentLevelText = this.game.gameState === "playing" ? "Level 1: Color Drain" : 
                              this.game.gameState === "level2" ? "Level 2: Laser Zone" : "";
        
        if (currentLevelText) {
            ctx.fillStyle = 'white';
            ctx.fillText(currentLevelText, this.game.width / 2, 25);
        }
        
        // Draw a progress bar for the drain percentage
        const progressBarWidth = 200;
        const progressBarHeight = 6;
        const progressBarX = (this.game.width - progressBarWidth) / 2;
        const progressBarY = 30;
        
        // Draw background of progress bar
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
        
        // Draw filled portion of progress bar
        const fillWidth = (this.game.colorPercentage / (this.game.config.drainTarget / 100)) * progressBarWidth;
        ctx.fillStyle = this.game.gameState === "playing" ? 'rgba(100, 150, 255, 1)' : 'rgba(255, 100, 100, 1)';
        ctx.fillRect(progressBarX, progressBarY, Math.min(fillWidth, progressBarWidth), progressBarHeight);
        
        // Draw border around progress bar
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    }
    
    drawLevelSelect() {
        const ctx = this.game.ctx;
        
        // Simple level select screen
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('CHROMATICA QUEST', this.game.width / 2, this.game.height * 0.3);
        
        ctx.font = '24px Arial';
        ctx.fillText('Select a Level', this.game.width / 2, this.game.height * 0.4);
        
        // Level 1 button
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = (this.game.width - buttonWidth) / 2;
        const buttonY = this.game.height * 0.5;
        
        ctx.fillStyle = 'rgba(50, 50, 200, 0.8)';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Start Game', this.game.width / 2, buttonY + 40);
        
        // Instructions
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
        ctx.fillText('Use arrow keys to move, space to jump', this.game.width / 2, this.game.height * 0.7);
        ctx.fillText('Drain 100% of the city\'s color to complete the level', this.game.width / 2, this.game.height * 0.75);
    }
    
    drawVictoryScreen() {
        const ctx = this.game.ctx;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Victory message
        ctx.font = 'bold 72px Arial';
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', this.game.width / 2, this.game.height * 0.3);
        
        // Score display
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(`Final Score: ${this.game.score}`, this.game.width / 2, this.game.height * 0.4);
        
        // Completion message
        ctx.font = '24px Arial';
        ctx.fillStyle = '#8FBC8F'; // Light green
        ctx.fillText(`Congratulations! You've drained 100% of the city!`, 
                    this.game.width / 2, this.game.height * 0.5);
        
        // Button dimensions
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonSpacing = 30;
        const totalWidth = (buttonWidth * 2) + buttonSpacing;
        const startX = (this.game.width - totalWidth) / 2;
        const buttonY = this.game.height * 0.65;
        
        // Level 2 button
        ctx.fillStyle = 'rgba(50, 150, 50, 0.8)'; // Green
        ctx.fillRect(startX, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, buttonY, buttonWidth, buttonHeight);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Play Level 2', startX + buttonWidth/2, buttonY + 40);
        
        // Menu button
        ctx.fillStyle = 'rgba(50, 50, 200, 0.8)'; // Blue
        const menuButtonX = startX + buttonWidth + buttonSpacing;
        ctx.fillRect(menuButtonX, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(menuButtonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = 'white';
        ctx.fillText('Menu', menuButtonX + buttonWidth/2, buttonY + 40);
        
        // Store button positions for click handling
        this.level2ButtonBounds = {
            x: startX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        
        this.menuButtonBounds = {
            x: menuButtonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
    }
    
    drawGameOverScreen() {
        const ctx = this.game.ctx;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
        
        // Game Over message
        ctx.font = 'bold 72px Arial';
        ctx.fillStyle = '#FF0000'; // Red color
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.game.width / 2, this.game.height * 0.3);
        
        // Score display
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(`Final Score: ${this.game.score}`, this.game.width / 2, this.game.height * 0.4);
        
        // Failure message
        ctx.font = '24px Arial';
        ctx.fillStyle = '#FF9999'; // Light red
        ctx.fillText(`You were hit by too many lasers!`, 
                    this.game.width / 2, this.game.height * 0.5);
        
        // Button dimensions
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonSpacing = 30;
        const totalWidth = (buttonWidth * 2) + buttonSpacing;
        const startX = (this.game.width - totalWidth) / 2;
        const buttonY = this.game.height * 0.65;
        
        // Try Again button
        ctx.fillStyle = 'rgba(50, 150, 50, 0.8)'; // Green
        ctx.fillRect(startX, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, buttonY, buttonWidth, buttonHeight);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Try Again', startX + buttonWidth/2, buttonY + 40);
        
        // Menu button
        ctx.fillStyle = 'rgba(50, 50, 200, 0.8)'; // Blue
        const menuButtonX = startX + buttonWidth + buttonSpacing;
        ctx.fillRect(menuButtonX, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(menuButtonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = 'white';
        ctx.fillText('Menu', menuButtonX + buttonWidth/2, buttonY + 40);
        
        // Store button positions for click handling
        this.tryAgainButtonBounds = {
            x: startX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        
        this.gameOverMenuButtonBounds = {
            x: menuButtonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
    }
    
    handleClick(clickX, clickY) {
        // Handle level select screen clicks
        if (this.game.gameState === 'levelSelect') {
            const buttonWidth = 200;
            const buttonHeight = 60;
            const buttonX = (this.game.width - buttonWidth) / 2;
            const buttonY = this.game.height * 0.5;
            
            // Check if start button was clicked
            if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
                clickY >= buttonY && clickY <= buttonY + buttonHeight) {
                this.game.gameState = 'playing';
            }
        }
        // Handle victory screen clicks
        else if (this.game.gameState === 'levelComplete') {
            // Check if Level 2 button was clicked
            if (this.level2ButtonBounds && 
                clickX >= this.level2ButtonBounds.x && 
                clickX <= this.level2ButtonBounds.x + this.level2ButtonBounds.width &&
                clickY >= this.level2ButtonBounds.y && 
                clickY <= this.level2ButtonBounds.y + this.level2ButtonBounds.height) {
                // Start level 2
                this.game.gameState = 'level2';
                // Reset game state for level 2
                this.game.initDrainMap();
                this.game.createPlatforms();
                this.game.createLasers();
                // Reset lives
                this.game.lives = this.game.maxLives;
            }
            // Check if Menu button was clicked
            else if (this.menuButtonBounds && 
                    clickX >= this.menuButtonBounds.x && 
                    clickX <= this.menuButtonBounds.x + this.menuButtonBounds.width &&
                    clickY >= this.menuButtonBounds.y && 
                    clickY <= this.menuButtonBounds.y + this.menuButtonBounds.height) {
                // Go back to menu
                this.game.gameState = 'levelSelect';
                // Reset game state
                this.game.initDrainMap();
                this.game.createPlatforms();
            }
        }
        // Handle game over screen clicks
        else if (this.game.gameState === 'gameOver') {
            // Check if Try Again button was clicked
            if (this.tryAgainButtonBounds && 
                clickX >= this.tryAgainButtonBounds.x && 
                clickX <= this.tryAgainButtonBounds.x + this.tryAgainButtonBounds.width &&
                clickY >= this.tryAgainButtonBounds.y && 
                clickY <= this.tryAgainButtonBounds.y + this.tryAgainButtonBounds.height) {
                // Restart level 2
                this.game.gameState = 'level2';
                // Reset game state
                this.game.initDrainMap();
                this.game.createPlatforms();
                this.game.createLasers();
                // Reset player position
                this.game.player.x = 50;
                this.game.player.y = 50;
                this.game.player.speedX = 0;
                this.game.player.speedY = 0;
                // Reset lives
                this.game.lives = this.game.maxLives;
            }
            // Check if Menu button was clicked
            else if (this.gameOverMenuButtonBounds && 
                    clickX >= this.gameOverMenuButtonBounds.x && 
                    clickX <= this.gameOverMenuButtonBounds.x + this.gameOverMenuButtonBounds.width &&
                    clickY >= this.gameOverMenuButtonBounds.y && 
                    clickY <= this.gameOverMenuButtonBounds.y + this.gameOverMenuButtonBounds.height) {
                // Go back to menu
                this.game.gameState = 'levelSelect';
                // Reset game state
                this.game.initDrainMap();
                this.game.createPlatforms();
                // Reset lives
                this.game.lives = this.game.maxLives;
            }
        }
    }
} 