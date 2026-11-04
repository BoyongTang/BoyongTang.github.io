// Renders public/og.png (1200 × 630) from the real atlas data, so the social preview never drifts
// from the site. Run: npm run og   (needs Node ≥ 23.6 to import the .ts data file directly)
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { edges, nodes } from '../src/data/atlas.ts';

const W = 1200;
const H = 630;
const c = { bg: '#071320', panel: '#0b1d30', hair: '#385467', star: '#ecf3f0', muted: '#b9cfd6', dim: '#8fa9b3', cyan: '#82d0dc', green: '#8fc3b4', gold: '#e9c18f' };
const sans = "'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const mono = "'IBM Plex Mono', Menlo, 'Courier New', monospace";

// map the 1000 × 700 atlas into the right-hand panel
const box = { x: 690, y: 80, w: 460, h: 470 };
const k = Math.min(box.w / 860, box.h / 560);
const px = (x) => box.x + box.w / 2 + (x - 500) * k;
const py = (y) => box.y + box.h / 2 + (y - 400) * k;
const byId = new Map(nodes.map((n) => [n.id, n]));

// fixed-seed ambient stars (decorative only)
let s = 103;
const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const stars = Array.from({ length: 140 }, () => `<circle cx="${(rand() * W).toFixed(1)}" cy="${(rand() * H).toFixed(1)}" r="${(0.4 + rand() * 0.9).toFixed(2)}" fill="${c.star}" opacity="${(0.12 + rand() * 0.4).toFixed(2)}"/>`).join('');

const cx = px(520);
const cy = py(360);
const rings = [70, 140, 220].map((r, i) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c.hair}" stroke-opacity="${i === 2 ? 0.7 : 0.45}" ${i === 2 ? 'stroke-dasharray="2 6"' : ''}/>`).join('');

const lines = edges
  .map((e) => {
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    return `<line x1="${px(a.x)}" y1="${py(a.y)}" x2="${px(b.x)}" y2="${py(b.y)}" stroke="${c.green}" stroke-opacity="0.5" stroke-width="1.2"/>`;
  })
  .join('');

const dots = nodes
  .map((n) => {
    const x = px(n.x);
    const y = py(n.y);
    if (n.featured)
      return `<circle cx="${x}" cy="${y}" r="26" fill="${c.gold}" opacity="0.14"/><circle cx="${x}" cy="${y}" r="15" fill="none" stroke="${c.gold}" stroke-opacity="0.6"/><circle cx="${x}" cy="${y}" r="6" fill="${c.gold}"/>`;
    if (n.type === 'question' || n.type === 'method')
      return `<circle cx="${x}" cy="${y}" r="5" fill="${c.panel}" stroke="${c.cyan}" stroke-width="1.6"/>`;
    return `<circle cx="${x}" cy="${y}" r="4.5" fill="${c.star}"/>`;
  })
  .join('');

const featured = nodes.find((n) => n.featured);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="neb" cx="0.72" cy="0.5" r="0.6"><stop offset="0" stop-color="#163044" stop-opacity="0.9"/><stop offset="1" stop-color="${c.bg}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#neb)"/>
  ${stars}
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${c.hair}" stroke-opacity="0.6"/>
  ${rings}${lines}${dots}
  <text x="${px(featured.x)}" y="${py(featured.y) + 44}" text-anchor="middle" font-family="${mono}" font-size="13" letter-spacing="2" fill="${c.gold}">ACTIVE LEARNING · MATERIALS</text>
  <text x="72" y="96" font-family="${mono}" font-size="15" letter-spacing="4" fill="${c.dim}">O / Q · OBSERVATORY OF QUESTIONS</text>
  <text x="72" y="214" font-family="${sans}" font-size="80" font-weight="600" fill="${c.star}">Boyong Tang</text>
  <text x="72" y="262" font-family="${mono}" font-size="16" letter-spacing="3" fill="${c.cyan}">APPLIED MATHEMATICS &amp; AI · SICHUAN UNIVERSITY</text>
  <rect x="72" y="300" width="96" height="2" fill="${c.gold}"/>
  <text x="72" y="350" font-family="${sans}" font-size="32" font-weight="500" fill="${c.star}">Observe the unanswered.</text>
  <text x="72" y="396" font-family="${sans}" font-size="21" fill="${c.muted}">Active learning for materials science:</text>
  <text x="72" y="426" font-family="${sans}" font-size="21" fill="${c.muted}">reproduce first, then build a loop that transfers.</text>
  <text x="72" y="560" font-family="${mono}" font-size="15" letter-spacing="3" fill="${c.dim}">BOYONGTANG.GITHUB.IO</text>
  <text x="${W - 72}" y="580" text-anchor="end" font-family="${mono}" font-size="11" letter-spacing="2" fill="${c.dim}">CONCEPTUAL LAYOUT · NOT SKY COORDINATES</text>
</svg>`;

const out = fileURLToPath(new URL('../public/og.png', import.meta.url));
await writeFile(out, await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer());
console.log(`[og] wrote ${out}`);
