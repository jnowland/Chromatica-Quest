const fs = require('fs');
const path = require('path');
const https = require('https');

// Create directories if they don't exist
const imagesDir = path.join(__dirname, 'assets', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Image files to download (free for personal use)
const imageFiles = [
  {
    // Colorful city skyline silhouette
    url: 'https://raw.githubusercontent.com/jamesqquick/javascript-game-development-course/master/assets/city.png',
    filename: 'city.png',
    description: 'Colorful city background'
  }
];

// Download each image file
imageFiles.forEach(image => {
  const filePath = path.join(imagesDir, image.filename);
  console.log(`Downloading ${image.description} (${image.filename})...`);
  
  const file = fs.createWriteStream(filePath);
  https.get(image.url, response => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${image.filename} successfully!`);
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {}); // Delete the file if there's an error
    console.error(`Error downloading ${image.filename}: ${err.message}`);
  });
});

console.log('Starting download of image assets...');
console.log('Note: These images are for demonstration purposes only.'); 