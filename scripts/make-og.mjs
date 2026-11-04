// Renders public/og.png (1200 × 630): the home page's star band with its five nebulae, from the same
// band shape and nebula data as the site, so the social preview never drifts from it.
// Run: npm run og   (needs Node ≥ 23.6 to import the .ts data files directly)
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { facets } from '../src/data/facets.ts';
import { bandAt, bandNormal, bandWidth, BANDS, spotAt } from '../src/lib/band.ts';
import { seeded, starColor, starKind } from '../src/lib/stars.ts';

const W = 1200;
const H = 630;
const c = { bg: '#04070c', hair: '#385467', star: '#ecf3f0', muted: '#b9cfd6', dim: '#8fa9b3', gold: '#e9c18f' };
const sans = "'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const mono = "'IBM Plex Mono', Menlo, 'Courier New', monospace";

const b = BANDS.wide;
const BW = bandWidth(W, H);
const rand = seeded(2027);
const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
const at = (t, off) => {
  const [x, y] = bandAt(b, t, W, H);
  const [nx, ny] = bandNormal(b, t, W, H);
  return [x + nx * off, y + ny * off];
};
const f1 = (v) => v.toFixed(1);

// the glow along the band, warm in the middle
const glow = Array.from({ length: 60 }, (_, i) => {
  const t = -0.05 + (i / 59) * 1.1;
  const warm = Math.exp(-(((t - 0.5) / 0.3) ** 2));
  const [x, y] = at(t, gauss() * BW * 0.15);
  const col = `rgb(${Math.round(130 + 125 * warm)},${Math.round(150 + 60 * warm)},${Math.round(205 - 45 * warm)})`;
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(BW * (0.7 + rand() * 0.5))}" fill="${col}" opacity="${(0.05 + 0.04 * warm).toFixed(3)}"/>`;
}).join('');

// stars: thick at the band's centre, thinner wide of it, a few anywhere
const stars = Array.from({ length: 2600 }, () => {
  let x;
  let y;
  let near = 0;
  const r0 = rand();
  if (r0 < 0.14) {
    x = rand() * W;
    y = rand() * H;
  } else {
    const off = gauss() * BW * (r0 < 0.7 ? 0.36 : 0.9);
    [x, y] = at(-0.04 + rand() * 1.08, off);
    near = Math.exp(-((off / BW) ** 2) * 2.2);
  }
  const big = rand() ** 6;
  const r = 0.35 + big * 1.3 + near * 0.25;
  const o = Math.min(1, (0.2 + rand() * 0.4 + near * 0.28) * (0.6 + big));
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r.toFixed(2)}" fill="${starColor[starKind(rand())]}" opacity="${o.toFixed(2)}"/>`;
}).join('');

// the dust lane
const ph = rand() * 6;
const dust = Array.from({ length: 120 }, () => {
  const t = rand() * 1.1 - 0.05;
  const wander = Math.sin(t * 7 + ph) * 0.16 + Math.sin(t * 17 + ph * 2) * 0.06;
  const [x, y] = at(t, (wander + gauss() * 0.07) * BW);
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(BW * (0.04 + rand() ** 2 * 0.18))}" fill="#03050a" opacity="${(0.18 + rand() * 0.24).toFixed(2)}"/>`;
}).join('');

// the five nebulae
const nebulae = facets
  .map((f) => {
    const [x, y] = spotAt(b, f.t, f.side, W, H);
    const flip = x > W * 0.8;
    const lx = flip ? x - 22 : x + 22;
    const anchor = flip ? 'end' : 'start';
    return `<circle cx="${f1(x)}" cy="${f1(y)}" r="70" fill="url(#neb-${f.id})"/>
    <circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="#fff"/>
    <text x="${f1(lx)}" y="${f1(y + 18)}" text-anchor="${anchor}" font-family="${mono}" font-size="12" letter-spacing="3" fill="${f.color}">${f.name.toUpperCase()}</text>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f1(BW * 0.25)}"/></filter>
    <filter id="dusty" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
    ${facets
      .map(
        (f) => `<radialGradient id="neb-${f.id}"><stop offset="0" stop-color="#ffffff" stop-opacity="0.7"/><stop offset="0.15" stop-color="${f.color}" stop-opacity="0.5"/><stop offset="0.5" stop-color="${f.deep}" stop-opacity="0.25"/><stop offset="1" stop-color="${f.deep}" stop-opacity="0"/></radialGradient>`,
      )
      .join('')}
  </defs>
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <g filter="url(#soft)">${glow}</g>
  ${stars}
  <g filter="url(#dusty)">${dust}</g>
  ${nebulae}
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${c.hair}" stroke-opacity="0.5"/>
  <text x="72" y="96" font-family="${mono}" font-size="15" letter-spacing="4" fill="${c.dim}">O / Q · OBSERVATORY OF QUESTIONS</text>
  <text x="72" y="196" font-family="${sans}" font-size="78" font-weight="600" fill="${c.star}">Boyong Tang</text>
  <text x="72" y="240" font-family="${mono}" font-size="15" letter-spacing="3" fill="${c.muted}">APPLIED MATHEMATICS &amp; AI · SICHUAN UNIVERSITY</text>
  <rect x="72" y="272" width="80" height="2" fill="${c.gold}"/>
  <text x="72" y="316" font-family="${sans}" font-size="28" font-weight="400" fill="${c.star}">Observe the unanswered.</text>
  <text x="${W - 72}" y="580" text-anchor="end" font-family="${mono}" font-size="12" letter-spacing="3" fill="${c.dim}">BOYONGTANG.GITHUB.IO</text>
</svg>`;

const out = fileURLToPath(new URL('../public/og.png', import.meta.url));
await writeFile(out, await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer());
console.log(`[og] wrote ${out}`);
