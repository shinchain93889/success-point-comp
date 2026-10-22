const path = require('path');
const sharp = require('sharp');

async function main() {
  const pdfPath = path.join(__dirname, '..', 'img', 'Certificate_SP-2024-1234_Pooja_maurya (1).pdf');
  const outPng = path.join(__dirname, '..', 'img', 'pdf_page1.png');

  try {
    await sharp(pdfPath, { page: 0, density: 150 })
      .png()
      .toFile(outPng);
    console.log('PDF Page 1 rendered to', outPng);
  } catch (err) {
    console.error('Failed to render PDF:', err);
  }
}

main();
