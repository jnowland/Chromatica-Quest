# Chromatica Quest

A 2D platformer game where you restore color to a black and white world by collecting color orbs.

## Game Description

In Chromatica Quest, you control a character in a grayscale world. As you collect color orbs scattered throughout the level, color gradually returns to the world. Your mission is to collect all the orbs and fully restore the vibrant colors to the environment.

## Features

- **Character Movement**: Use arrow keys or WASD to move and jump
- **Color Restoration**: Watch as the world transforms from grayscale to full color as you collect orbs
- **Smooth Transitions**: Color fades in gradually rather than instantly switching
- **Collectibles**: 10 color orbs to find and collect
- **Score Counter**: Tracks how many orbs you've collected
- **Evolving Audio**: Background music and sound effects that evolve as color is restored

## Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`

### Production Deployment
To start the production server:
```
npm start
```

## How to Play

1. Open the game in a web browser
2. Press any key to start the game
3. Use the arrow keys or WASD to move:
   - Left Arrow / A: Move left
   - Right Arrow / D: Move right
   - Up Arrow / W / Space: Jump
4. Collect all 10 color orbs to fully restore color to the world

## Technical Details

- Built with HTML5 Canvas and JavaScript
- Uses Howler.js for audio management
- Express.js for serving the game
- No additional dependencies required for gameplay

## Audio Credits

For the full experience, you'll need to add audio files:
- `assets/sounds/background.mp3` - Background music
- `assets/sounds/collect.mp3` - Sound when collecting an orb
- `assets/sounds/jump.mp3` - Sound when jumping

## License

This game is provided as-is for educational and entertainment purposes. 