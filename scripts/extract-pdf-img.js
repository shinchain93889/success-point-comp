const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '..', 'img', 'Certificate_SP-2024-1234_Pooja_maurya (1).pdf');
const buf = fs.readFileSync(pdfPath);

console.log('PDF size:', buf.length);

// Look for JPEG markers: 0xFF 0xD8 0xFF
let count = 0;
let pos = 0;
while ((pos = buf.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]), pos)) !== -1) {
  // Find JPEG end: 0xFF 0xD9
  const end = buf.indexOf(Buffer.from([0xFF, 0xD9]), pos);
  if (end !== -1) {
    const jpegBuf = buf.subarray(pos, end + 2);
    const outName = path.join(__dirname, '..', 'img', `extracted_${count}.jpg`);
    fs.writeFileSync(outName, jpegBuf);
    console.log(`Extracted JPEG ${count}: ${jpegBuf.length} bytes -> ${outName}`);
    count++;
    pos = end + 2;
  } else {
    pos += 3;
  }
}
