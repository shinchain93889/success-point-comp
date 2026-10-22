const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const src = path.join(__dirname, '..', 'img', 'signnn.jpg');
  const destDir = path.join(__dirname, '..', 'public', 'img');
  const destPng = path.join(destDir, 'signnn.png');
  const destJpg = path.join(destDir, 'signnn.jpg');

  // Ensure original is copied
  fs.copyFileSync(src, destJpg);

  const image = sharp(src);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Let's create two versions:
  // 1. signnn.png: Deep Royal Blue Ink (#0c2461 or #1e3799) with clean transparent background
  // 2. signnn-blue.png: Original blue hue with transparent background

  const rgbaInk = Buffer.alloc(w * h * 4);

  for (let i = 0; i < w * h; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    
    // Distance from black background
    const dist = Math.sqrt(r * r + g * g + b * b);
    const outIdx = i * 4;

    if (dist < 10) {
      rgbaInk[outIdx] = 0;
      rgbaInk[outIdx + 1] = 0;
      rgbaInk[outIdx + 2] = 0;
      rgbaInk[outIdx + 3] = 0;
    } else {
      // Smooth alpha ramp
      const alpha = Math.min(255, Math.round(((dist - 10) / 28) * 255));
      // Deep professional fountain-pen navy blue ink
      rgbaInk[outIdx] = 12;     // R
      rgbaInk[outIdx + 1] = 36; // G
      rgbaInk[outIdx + 2] = 97; // B (#0c2461)
      rgbaInk[outIdx + 3] = alpha;
    }
  }

  await sharp(rgbaInk, {
    raw: { width: w, height: h, channels: 4 }
  })
  .trim()
  .png()
  .toFile(destPng);

  console.log('Clean trimmed signature saved to:', destPng);
}

main().catch(console.error);
