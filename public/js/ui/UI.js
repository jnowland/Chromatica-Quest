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
        ctx.fillText('Collect color orbs and drain the city of its color', this.game.width / 2, this.game.height * 0.75);
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
    }
} 