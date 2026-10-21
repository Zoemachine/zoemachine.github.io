// Builds the small web images used below the hero and in the page head, from the originals.
//   NODE_PATH=<folder with sharp> node tools/make-site-images.js
// Every output stays well under 200 KB.
const path = require('path');
const sharp = require('sharp');

const A = (f) => path.join(__dirname, '..', 'assets', f);
const OUT = (f) => path.join(__dirname, '..', 'assets', 'site', f);

(async () => {
  require('fs').mkdirSync(OUT(''), { recursive: true });
  const jobs = [
    // On-premises server render, transparency kept for the black page.
    sharp(A('ZOEAI_SERVER_CLOSED.png')).resize(720).webp({ quality: 80, alphaQuality: 90 }).toFile(OUT('server.webp')),
    sharp(A('william-wei.png')).resize(480).webp({ quality: 82 }).toFile(OUT('william-wei.webp')),
    sharp(A('aaron-vanblarcom.jpg')).resize(480).webp({ quality: 82 }).toFile(OUT('aaron-vanblarcom.webp')),
    sharp(A('nvidia-inception.png.jpg')).resize(386).webp({ quality: 85 }).toFile(OUT('nvidia-inception.webp')),
    // The dark wordmark turned light for the black page (colour negated, transparency kept).
    sharp(A('logo-static-transparent.png')).resize(466).negate({ alpha: false }).png({ compressionLevel: 9 }).toFile(OUT('wordmark-light.png')),
    // The same wordmark, small, for the hero's bare opening: it must not slow the first paint.
    sharp(A('logo-static-transparent.png')).resize(280).negate({ alpha: false }).webp({ quality: 80, alphaQuality: 80 }).toFile(OUT('wordmark-light-280.webp')),
    // Social card: the closed laptop, cropped to 1200×630.
    sharp(A('poster-closed.jpg')).resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 82, mozjpeg: true }).toFile(OUT('og-image.jpg')),
    // Home-screen icon: the favicon mark centred on black.
    sharp(A('favicon-96.png')).resize(150, null, { fit: 'inside' }).toBuffer().then((mark) =>
      sharp({ create: { width: 180, height: 180, channels: 4, background: '#000000' } })
        .composite([{ input: mark, gravity: 'centre' }]).png().toFile(OUT('apple-touch-icon.png'))),
  ];
  const done = await Promise.all(jobs);
  done.forEach((d, i) => console.log(i, d.width, d.height, Math.round(d.size / 1024), 'KB'));
})().catch((e) => { console.error(e); process.exit(1); });
