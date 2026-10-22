const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processSignature() {
  // Source: vairagi.jpg — WHITE background + solid BLACK signature strokes
  const src = path.join(__dirname, '..', 'img', 'vairagi.jpg');
  const destPng = path.join(__dirname, '..', 'public', 'img', 'vairagi.png');

  const image = sharp(src);
  const metadata = await image.metadata();
  console.log('Source image metadata:', metadata);

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels; // 3 for RGB
  const w = info.width;
  const h = info.height;
  console.log(`Processing ${w}x${h} image with ${channels} channels`);

  // Strategy for WHITE background + BLACK ink signature:
  //   - High brightness pixels (white/near-white background) → fully transparent
  //   - Low brightness pixels (dark ink strokes) → solid BLACK ink, opaque
  //     with anti-aliasing: mid-brightness pixels get proportional alpha

  const rgba = Buffer.alloc(w * h * 4);
  let strokePixels = 0;

  for (let i = 0; i < w * h; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];

    // Perceived luminance
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    const outIdx = i * 4;

    if (brightness > 220) {
      // Very bright pixel = white background → fully transparent
      rgba[outIdx]     = 0;
      rgba[outIdx + 1] = 0;
      rgba[outIdx + 2] = 0;
      rgba[outIdx + 3] = 0;
    } else {
      // Ink stroke pixel → black ink, alpha inversely proportional to brightness
      // brightness 0 (pure black) → alpha 255 (fully opaque)
      // brightness 220 (light gray edge) → alpha ~0 (anti-aliased edge)
      const alpha = Math.min(255, Math.round(((220 - brightness) / 220) * 255));
      strokePixels++;

      rgba[outIdx]     = 0;     // R - pure black
      rgba[outIdx + 1] = 0;     // G - pure black
      rgba[outIdx + 2] = 0;     // B - pure black
      rgba[outIdx + 3] = alpha;
    }
  }

  console.log(`Found ${strokePixels} stroke pixels out of ${w * h} total`);

  await sharp(rgba, {
    raw: { width: w, height: h, channels: 4 }
  })
    .trim({ threshold: 10 })
    .png({ compressionLevel: 9 })
    .toFile(destPng);

  console.log('Successfully created vairagi transparent PNG at:', destPng);
}

processSignature().catch(console.error);
