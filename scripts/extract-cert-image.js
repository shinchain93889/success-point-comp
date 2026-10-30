const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const sharp = require('sharp');

async function extract() {
  const pdfPath = 'C:\\Users\\Owner\\Downloads\\Certificate_SP-320_DEEKSHA_GANGWAR.pdf';
  if (!fs.existsSync(pdfPath)) {
    console.log('File not found:', pdfPath);
    return;
  }
  const buf = fs.readFileSync(pdfPath);
  console.log('PDF loaded, size:', buf.length);

  // Look for /Width \d+ /Height \d+
  const str = buf.toString('latin1');
  const wMatch = str.match(/\/Width\s+(\d+)/);
  const hMatch = str.match(/\/Height\s+(\d+)/);
  if (!wMatch || !hMatch) {
    console.log('Width or Height not found');
    return;
  }
  const width = parseInt(wMatch[1], 10);
  const height = parseInt(hMatch[1], 10);
  console.log(`Image dimensions: ${width}x${height}`);

  // Find all streams and pick the largest one (the image)
  let bestStart = -1, bestEnd = -1, maxLen = 0;
  let idx = 0;
  while ((idx = buf.indexOf(Buffer.from('stream'), idx)) !== -1) {
    const sStart = idx + (buf[idx + 6] === 13 && buf[idx + 7] === 10 ? 8 : (buf[idx + 6] === 10 ? 7 : 6));
    const sEnd = buf.indexOf(Buffer.from('endstream'), sStart);
    if (sEnd !== -1) {
      const len = sEnd - sStart;
      if (len > maxLen) {
        maxLen = len;
        bestStart = sStart;
        bestEnd = sEnd;
      }
      idx = sEnd + 9;
    } else {
      break;
    }
  }

  console.log(`Largest stream: ${bestStart} to ${bestEnd} (length: ${maxLen})`);
  let raw = buf.subarray(bestStart, bestEnd);
  if (raw.length > width * height * 3) {
    raw = raw.subarray(0, width * height * 3);
  }
  console.log(`Raw length: ${raw.length} bytes (expected ${width * height * 3})`);

  const channels = raw.length === width * height * 4 ? 4 : 3;
  const outPath = path.join(__dirname, '..', 'img', 'extracted_pdf_render.png');

  await sharp(raw, {
    raw: {
      width,
      height,
      channels,
    }
  }).png().toFile(outPath);

  console.log('Successfully saved to:', outPath);

  // Also crop around CERTIFICATE to see exactly what happened:
  // CERTIFICATE is roughly around y = 20% to 35%, x = 25% to 75%
  const cropY = Math.round(height * 0.18);
  const cropH = Math.round(height * 0.18);
  const cropX = Math.round(width * 0.2);
  const cropW = Math.round(width * 0.6);

  const cropOut = path.join(__dirname, '..', 'img', 'extracted_crop.png');
  await sharp(outPath)
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .toFile(cropOut);

  console.log('Successfully saved crop to:', cropOut);
}

extract().catch(console.error);
