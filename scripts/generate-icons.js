import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('public/favicon.svg');
const svgBuffer = fs.readFileSync(svgPath);

// Sync vector app-icon.svg
fs.writeFileSync(path.resolve('public/app-icon.svg'), svgBuffer);

async function generateIcons() {
  console.log('Generating high-resolution icons from vector SVG...');

  const targets = [
    { name: 'favicon-16.png', size: 16 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'favicon.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'app-icon.png', size: 512 },
  ];

  for (const target of targets) {
    const outPath = path.resolve('public', target.name);
    await sharp(svgBuffer)
      .resize(target.size, target.size)
      .png({ quality: 100 })
      .toFile(outPath);
    console.log(`Generated ${target.name} (${target.size}x${target.size})`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});


