// Renders public/og.png (1200 × 630) from the real galaxy data, so the social preview never drifts
// from the site. Run: npm run og   (needs Node ≥ 23.6 to import the .ts data file directly)
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { galaxies } from '../src/data/galaxies.ts';
import { galaxyStars, hueColor } from '../src/lib/stars.ts';

const W = 1200;
const H = 630;
const c = { bg: '#071320', panel: '#0b1d30', hair: '#385467', star: '#ecf3f0', muted: '#b9cfd6', dim: '#8fa9b3', cyan: '#82d0dc', green: '#8fc3b4', gold: '#e9c18f' };
const sans = "'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const mono = "'IBM Plex Mono', Menlo, 'Courier New', monospace";

// map the 1000 × 700 universe into the right-hand panel
const box = { x: 650, y: 60, w: 500, h: 510 };
const k = Math.min(box.w / 1000, box.h / 700) * 1.08;
const px = (x) => box.x + box.w / 2 + (x - 500) * k;
const py = (y) => box.y + box.h / 2 + (y - 350) * k;

// fixed-seed ambient stars (decorative only)
let s = 103;
const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const stars = Array.from({ length: 140 }, () => `<circle cx="${(rand() * W).toFixed(1)}" cy="${(rand() * H).toFixed(1)}" r="${(0.4 + rand() * 0.9).toFixed(2)}" fill="${c.star}" opacity="${(0.12 + rand() * 0.4).toFixed(2)}"/>`).join('');

const cx = px(500);
const cy = py(350);
const rings = `<circle cx="${cx}" cy="${cy}" r="${330 * k}" fill="none" stroke="${c.hair}" stroke-opacity="0.55" stroke-dasharray="2 6"/>`;

const glx = galaxies
  .map((g) => {
    const tint = hueColor[g.hue];
    const pts = galaxyStars(g)
      .map((st) => `<circle cx="${px(st.x).toFixed(1)}" cy="${py(st.y).toFixed(1)}" r="${(st.r * 0.9).toFixed(2)}" fill="${st.tint ? tint : '#e6f1ef'}" opacity="${st.o}"/>`)
      .join('');
    return `<ellipse cx="${px(g.x)}" cy="${py(g.y)}" rx="${g.r * k * 0.34}" ry="${g.r * k * 0.26}" fill="url(#core-${g.hue})" transform="rotate(${g.rotation} ${px(g.x)} ${py(g.y)})"/>${pts}`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${Object.entries(hueColor).map(([h, col]) => `<radialGradient id="core-${h}"><stop offset="0" stop-color="#fff6e8" stop-opacity="0.95"/><stop offset="0.35" stop-color="${col}" stop-opacity="0.45"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`).join('')}
    <radialGradient id="neb" cx="0.72" cy="0.5" r="0.6"><stop offset="0" stop-color="#163044" stop-opacity="0.9"/><stop offset="1" stop-color="${c.bg}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#neb)"/>
  ${stars}
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${c.hair}" stroke-opacity="0.6"/>
  ${rings}${glx}
  <text x="72" y="96" font-family="${mono}" font-size="15" letter-spacing="4" fill="${c.dim}">O / Q · OBSERVATORY OF QUESTIONS</text>
  <text x="72" y="214" font-family="${sans}" font-size="80" font-weight="600" fill="${c.star}">Boyong Tang</text>
  <text x="72" y="262" font-family="${mono}" font-size="16" letter-spacing="3" fill="${c.cyan}">APPLIED MATHEMATICS &amp; AI · SICHUAN UNIVERSITY</text>
  <rect x="72" y="300" width="96" height="2" fill="${c.gold}"/>
  <text x="72" y="350" font-family="${sans}" font-size="32" font-weight="500" fill="${c.star}">Observe the unanswered.</text>
  <text x="72" y="396" font-family="${sans}" font-size="21" fill="${c.muted}">Active learning for materials science:</text>
  <text x="72" y="426" font-family="${sans}" font-size="21" fill="${c.muted}">reproduce first, then build a loop that transfers.</text>
  <text x="72" y="560" font-family="${mono}" font-size="15" letter-spacing="3" fill="${c.dim}">BOYONGTANG.GITHUB.IO</text>
  <text x="${W - 72}" y="580" text-anchor="end" font-family="${mono}" font-size="11" letter-spacing="2" fill="${c.dim}">ONE GALAXY PER FIELD · NOT A SKY IMAGE</text>
</svg>`;

const out = fileURLToPath(new URL('../public/og.png', import.meta.url));
await writeFile(out, await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer());
console.log(`[og] wrote ${out}`);
