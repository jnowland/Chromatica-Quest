#!/bin/bash

# Display welcome message
echo "=== Chromatica Quest Setup ==="
echo "This script will set up the Chromatica Quest game."
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

# Download assets
echo "Downloading game assets..."
node download-assets.js

# Setup complete
echo ""
echo "Setup complete! You can now run the game with:"
echo "npm run dev"
echo ""
echo "Then open your browser to: http://localhost:3000"
echo ""
echo "Enjoy playing Chromatica Quest!" 