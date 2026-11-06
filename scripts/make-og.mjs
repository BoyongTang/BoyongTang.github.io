// Renders public/og.png (1200 × 630): the home page as a wide screen shows it. The Pillars of Creation
// fill the frame, the five parts of me sit on their spots, and the name is one line of spaced
// capitals at the bottom centre, with the image credit. Built from public/sky/pillars-max.webp.
// Run: npm run og   (needs Node ≥ 23.6 to import the .ts data files directly)
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { facets } from '../src/data/facets.ts';
import { creditLine, spots } from '../src/data/pillars.ts';
import { profile } from '../src/data/profile.ts';
import { fitPillars } from '../src/lib/pillars-fit.ts';

const W = 1200;
const H = 630;
const mono = "'IBM Plex Mono', Menlo, 'Courier New', monospace";
const sans = "'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const full = fileURLToPath(new URL('../public/sky/pillars-wide.webp', import.meta.url));

// where the whole image lands for a 1200 × 630 screen
const fit = fitPillars(W, H, 'wide');
const [x0, y0] = fit.at(0, 0);
const [x1, y1] = fit.at(1, 1);
const iw = Math.round(x1 - x0);
const ih = Math.round(y1 - y0);
// the framed image, with the sky continuing on either side (a soft, dark wash of the image itself)
const top = Math.round(-y0);
const left = Math.round(x0);
const strip = await sharp(full).resize(iw, ih, { fit: 'fill' }).extract({ left: 0, top, width: iw, height: Math.min(H, ih - top) }).toBuffer();
const fadeW = Math.round(iw * 0.12);
const fade = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${iw}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${(fadeW / iw).toFixed(3)}" stop-color="#fff"/><stop offset="${(1 - fadeW / iw).toFixed(3)}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${iw}" height="${H}" fill="url(#g)"/></svg>`,
);
const front = await sharp(strip).ensureAlpha().composite([{ input: fade, blend: 'dest-in' }]).png().toBuffer();
const back = await sharp(full).resize(W, H, { fit: 'cover', position: 'top' }).blur(24).modulate({ brightness: 0.45 }).toBuffer();
const photo = await sharp(back)
  .composite([{ input: front, left: Math.max(0, left), top: 0 }])
  .toBuffer();

const parts = facets
  .map((f) => {
    const [x, y] = fit.at(...spots[f.id]);
    if (x < 0 || y < 0 || x > W || y > H) return '';
    const flip = x > W * 0.78;
    const lx = flip ? x - 16 : x + 16;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" fill="url(#halo-${f.id})"/>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="${f.color}" stroke-opacity="0.8"/>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="#fff"/>
    <text x="${lx.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${flip ? 'end' : 'start'}" font-family="${mono}" font-size="10.5" letter-spacing="2.4" fill="${f.color}" stroke="#020308" stroke-width="3" paint-order="stroke">${f.name.toUpperCase()}</text>`;
  })
  .join('');

const name = profile.name.toUpperCase();
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${facets.map((f) => `<radialGradient id="halo-${f.id}"><stop offset="0" stop-color="${f.color}" stop-opacity="0.5"/><stop offset="1" stop-color="${f.color}" stop-opacity="0"/></radialGradient>`).join('')}
    <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#010206" stop-opacity="0.35"/>
      <stop offset="0.18" stop-color="#010206" stop-opacity="0"/>
      <stop offset="0.66" stop-color="#010206" stop-opacity="0"/>
      <stop offset="1" stop-color="#010206" stop-opacity="0.78"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#veil)"/>
  ${parts}
  <text x="${W / 2 + 8}" y="${H - 74}" text-anchor="middle" font-family="${sans}" font-size="22" font-weight="500" letter-spacing="9" fill="#f4f2ee">${name}</text>
  ${profile.tagline ? `<text x="${W / 2}" y="${H - 46}" text-anchor="middle" font-family="${mono}" font-size="12" letter-spacing="2" fill="#e6e2dc" fill-opacity="0.7">${profile.tagline}</text>` : ''}
  <text x="${W / 2}" y="${H - 16}" text-anchor="middle" font-family="${mono}" font-size="9" fill="#b7c6da" fill-opacity="0.75">${creditLine}</text>
</svg>`);

const out = fileURLToPath(new URL('../public/og.png', import.meta.url));
await writeFile(out, await sharp(photo).composite([{ input: overlay, left: 0, top: 0 }]).png({ compressionLevel: 9 }).toBuffer());
console.log(`[og] wrote ${out}`);
