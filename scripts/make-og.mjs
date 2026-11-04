// Renders public/og.png (1200 × 630): the home page as a wide screen shows it, with Webb's Pillars of
// Creation at full height on the right, the five parts of me on their spots, the name on the left and
// the image credit. Built from public/sky/pillars-wide.webp (make it first: scripts/make-pillars.mjs).
// Run: npm run og   (needs Node ≥ 23.6 to import the .ts data files directly)
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { facets } from '../src/data/facets.ts';
import { PILLARS, spots } from '../src/data/pillars.ts';
import { fitPillars } from '../src/lib/pillars-fit.ts';

const W = 1200;
const H = 630;
const c = { star: '#f4f7fb', muted: '#d5e0ec', dim: '#b7c6da', gold: '#e9c18f' };
const sans = "'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const mono = "'IBM Plex Mono', Menlo, 'Courier New', monospace";
const wide = fileURLToPath(new URL(`../public${PILLARS.variants.wide.src}`, import.meta.url));

const fit = fitPillars(W, H, 'wide');
const iw = Math.round(fit.iw);
const ox = Math.round(fit.ox);

// the soft, dark copy behind; the photo itself, fading in from the left
const back = await sharp(wide).resize(W, H, { fit: 'cover' }).blur(30).modulate({ brightness: 0.4, saturation: 1.15 }).toBuffer();
const fade = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${iw}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.24" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${iw}" height="${H}" fill="url(#g)"/></svg>`,
);
const front = await sharp(wide)
  .resize({ height: H, width: iw, fit: 'fill' })
  .ensureAlpha()
  .composite([{ input: fade, blend: 'dest-in' }])
  .png()
  .toBuffer();

const parts = facets
  .map((f) => {
    const [x, y] = fit.at(...spots[f.id]);
    const flip = x > W * 0.78;
    const lx = flip ? x - 18 : x + 18;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="26" fill="url(#halo-${f.id})"/>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="none" stroke="${f.color}" stroke-opacity="0.8"/>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="#fff"/>
    <text x="${lx.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${flip ? 'end' : 'start'}" font-family="${mono}" font-size="11" letter-spacing="2.6" fill="${f.color}" stroke="#030610" stroke-width="3" paint-order="stroke">${f.name.toUpperCase()}</text>`;
  })
  .join('');

const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${facets.map((f) => `<radialGradient id="halo-${f.id}"><stop offset="0" stop-color="${f.color}" stop-opacity="0.55"/><stop offset="1" stop-color="${f.color}" stop-opacity="0"/></radialGradient>`).join('')}
    <radialGradient id="veil" cx="0.15" cy="0.4" r="0.6"><stop offset="0" stop-color="#030610" stop-opacity="0.6"/><stop offset="1" stop-color="#030610" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#veil)"/>
  ${parts}
  <text x="64" y="120" font-family="${mono}" font-size="14" letter-spacing="4" fill="${c.dim}">O / Q · OBSERVATORY OF QUESTIONS</text>
  <text x="64" y="212" font-family="${sans}" font-size="76" font-weight="600" fill="${c.star}">Boyong Tang</text>
  <text x="64" y="254" font-family="${mono}" font-size="14" letter-spacing="2.6" fill="${c.muted}">APPLIED MATHEMATICS &amp; AI · SICHUAN UNIVERSITY</text>
  <rect x="64" y="284" width="76" height="2" fill="${c.gold}"/>
  <text x="64" y="326" font-family="${sans}" font-size="27" fill="${c.star}">Observe the unanswered.</text>
  <text x="64" y="368" font-family="${mono}" font-size="12" letter-spacing="2.4" fill="${c.dim}">FIVE PARTS OF ME, WHERE STARS ARE BORN.</text>
  <text x="64" y="574" font-family="${mono}" font-size="12" letter-spacing="2.4" fill="${c.dim}">BOYONGTANG.GITHUB.IO</text>
  <text x="${W - 24}" y="${H - 14}" text-anchor="end" font-family="${mono}" font-size="9.5" fill="${c.dim}" stroke="#030610" stroke-width="2.5" paint-order="stroke">${PILLARS.title} · ${PILLARS.credit} · ${PILLARS.license}</text>
</svg>`);

const out = fileURLToPath(new URL('../public/og.png', import.meta.url));
const png = await sharp(back)
  .composite([
    { input: front, left: ox, top: 0 },
    { input: overlay, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();
await writeFile(out, png);
console.log(`[og] wrote ${out}`);
