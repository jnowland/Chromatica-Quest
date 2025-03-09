/**
 * Deployment script for Chromatica Quest
 * This script automates the process of deploying to GitHub Pages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GITHUB_REPO = 'git@github.com:jnowland/Chromatica-Quest.git';
const BRANCH_NAME = 'gh-pages';
const BUILD_DIR = 'build';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper function to execute shell commands
function runCommand(command, errorMessage) {
  try {
    console.log(`${colors.cyan}> ${command}${colors.reset}`);
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`${colors.red}${errorMessage}${colors.reset}`);
    process.exit(1);
  }
}

// Helper function to ensure a directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Main deployment function
async function deploy() {
  console.log(`\n${colors.bright}${colors.green}=== CHROMATICA QUEST DEPLOYMENT ====${colors.reset}\n`);
  
  // Step 1: Clean or create build directory
  console.log(`\n${colors.yellow}Step 1: Preparing build directory...${colors.reset}`);
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  ensureDirectoryExists(BUILD_DIR);
  
  // Step 2: Copy all necessary files to build directory
  console.log(`\n${colors.yellow}Step 2: Copying files to build directory...${colors.reset}`);
  
  // Copy HTML, CSS, and assets
  fs.copyFileSync('index.html', path.join(BUILD_DIR, 'index.html'));
  fs.copyFileSync('style.css', path.join(BUILD_DIR, 'style.css'));
  
  // Copy public directory
  ensureDirectoryExists(path.join(BUILD_DIR, 'public'));
  runCommand(`cp -R public ${BUILD_DIR}/`, 'Failed to copy public directory');
  
  // Copy assets directory if it exists
  if (fs.existsSync('assets')) {
    ensureDirectoryExists(path.join(BUILD_DIR, 'assets'));
    runCommand(`cp -R assets ${BUILD_DIR}/`, 'Failed to copy assets directory');
  }
  
  // Step 3: Initialize git in the build directory
  console.log(`\n${colors.yellow}Step 3: Setting up Git repository in build directory...${colors.reset}`);
  process.chdir(BUILD_DIR);
  runCommand('git init', 'Failed to initialize git repository');
  runCommand('git add .', 'Failed to add files to git repository');
  runCommand('git commit -m "Deploy to GitHub Pages"', 'Failed to commit files');
  
  // Step 4: Push to GitHub Pages
  console.log(`\n${colors.yellow}Step 4: Pushing to GitHub Pages...${colors.reset}`);
  runCommand(`git remote add origin ${GITHUB_REPO}`, 'Failed to add remote repository');
  runCommand(`git checkout -b ${BRANCH_NAME}`, 'Failed to create branch');
  runCommand(`git push -f origin ${BRANCH_NAME}`, 'Failed to push to GitHub');
  
  // Step 5: Clean up
  console.log(`\n${colors.yellow}Step 5: Cleaning up...${colors.reset}`);
  process.chdir('..');
  
  console.log(`\n${colors.bright}${colors.green}✅ Deployment complete!${colors.reset}`);
  console.log(`\n${colors.cyan}Your game should be available at: https://jnowland.github.io/Chromatica-Quest/${colors.reset}\n`);
}

// Run the deployment
deploy().catch(error => {
  console.error(`${colors.red}Deployment failed: ${error.message}${colors.reset}`);
  process.exit(1);
}); 