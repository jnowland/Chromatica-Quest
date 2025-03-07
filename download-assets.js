const fs = require('fs');
const path = require('path');
const https = require('https');

// Create directories if they don't exist
const soundsDir = path.join(__dirname, 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Free sound effects from freesound.org (Creative Commons licensed)
const soundFiles = [
  {
    url: 'https://cdn.freesound.org/previews/396/396741_7479096-lq.mp3',
    filename: 'background.mp3',
    description: 'Dark atmospheric background music'
  },
  {
    url: 'https://cdn.freesound.org/previews/270/270304_5123851-lq.mp3',
    filename: 'collect.mp3',
    description: 'Collect sound'
  },
  {
    url: 'https://cdn.freesound.org/previews/369/369515_6687661-lq.mp3',
    filename: 'jump.mp3',
    description: 'Jump sound'
  },
  {
    url: 'https://cdn.freesound.org/previews/323/323505_5260872-lq.mp3',
    filename: 'drain.mp3',
    description: 'Color-draining sound effect'
  }
];

// Download each sound file
soundFiles.forEach(sound => {
  const filePath = path.join(soundsDir, sound.filename);
  console.log(`Downloading ${sound.description} (${sound.filename})...`);
  
  const file = fs.createWriteStream(filePath);
  https.get(sound.url, response => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${sound.filename} successfully!`);
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {}); // Delete the file if there's an error
    console.error(`Error downloading ${sound.filename}: ${err.message}`);
  });
});

console.log('Starting download of sound assets...');
console.log('Note: These are preview-quality sounds from freesound.org for demonstration purposes.');
console.log('For a production game, consider using higher quality audio files.'); 