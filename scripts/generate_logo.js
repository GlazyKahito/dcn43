const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a valid 128x128 PNG image with Somaiya emblem colors (maroon/crimson and gold)
function createSomaiyaPlaceholderPng() {
  const width = 128;
  const height = 128;

  // Uncompressed scanlines: each row has 1 filter byte (0) followed by 128 RGBA pixels
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - 64;
      const dy = y - 64;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 56) {
        // Maroon / Red somaiya background
        if (dist >= 50 && dist <= 54) {
          // Gold outer border
          rawData[pxOffset] = 220;     // R
          rawData[pxOffset + 1] = 175; // G
          rawData[pxOffset + 2] = 55;  // B
          rawData[pxOffset + 3] = 255; // A
        } else if (Math.abs(dx) < 18 && Math.abs(dy) < 32 && (
          // Stylized 'S'
          (dy >= -26 && dy <= -18 && dx >= -14 && dx <= 14) || // Top bar
          (dy >= -18 && dy <= 0 && dx >= -14 && dx <= -4) ||   // Upper left
          (dy >= -4 && dy <= 4 && dx >= -12 && dx <= 12) ||    // Middle bar
          (dy >= 0 && dy <= 22 && dx >= 4 && dx <= 14) ||      // Lower right
          (dy >= 18 && dy <= 26 && dx >= -14 && dx <= 14)      // Bottom bar
        )) {
          // Gold S
          rawData[pxOffset] = 245;
          rawData[pxOffset + 1] = 200;
          rawData[pxOffset + 2] = 60;
          rawData[pxOffset + 3] = 255;
        } else {
          // Somaiya Maroon #A01D24
          rawData[pxOffset] = 160;
          rawData[pxOffset + 1] = 29;
          rawData[pxOffset + 2] = 36;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        let bit = (byte ^ crc) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ -1) >>> 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'somaiya-logo.png'), pngBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pngBuffer);
  console.log('Successfully wrote placeholder somaiya-logo.png and favicon.ico');
}

createSomaiyaPlaceholderPng();
