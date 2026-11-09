// Post-build check (npm test, and CI): every internal link and #anchor in dist/ must resolve.
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

const pages = await walk(DIST);
const ids = new Map(); // route -> Set of element ids
const html = new Map();
const routeOf = (file) => '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\.html$/, '');

for (const file of pages) {
  const text = await readFile(file, 'utf8');
  html.set(file, text);
  ids.set(routeOf(file), new Set([...text.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

const exists = (p) => stat(p).then(() => true, () => false);

/** Whether a file at this site path exists in dist/ with exactly this spelling, capitals included. */
async function existsExactly(path) {
  let dir = DIST;
  for (const part of decodeURIComponent(path).split('/').filter(Boolean)) {
    const names = await readdir(dir).catch(() => []);
    if (!names.includes(part)) return false;
    dir = join(dir, part);
  }
  return true;
}
const problems = new Set();

for (const [file, text] of html) {
  const from = routeOf(file);
  for (const [, href] of text.matchAll(/\shref="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(href)) continue;
    const [path, hash] = href.split('#');
    const route = path === '' ? from : path;
    if (!route.startsWith('/')) continue;
    const target = join(DIST, route);
    const ok = (await exists(join(target, 'index.html'))) || (await exists(target)) || (await exists(target + '.html'));
    if (!ok) {
      problems.add(`${from} → ${href} (no such page)`);
      continue;
    }
    if (hash && ids.has(route) && !ids.get(route).has(decodeURIComponent(hash))) {
      problems.add(`${from} → ${href} (no #${hash} on that page)`);
    }
  }
  // files the page loads (images, figures): they must exist with exactly this spelling, capitals included,
  // since GitHub Pages tells kolta.svg and KolTa.svg apart even where this computer does not
  for (const [, src] of text.matchAll(/\s(?:src|href)="(\/[^"#?]+\.[a-z0-9]+)"/gi)) {
    if (!(await existsExactly(src))) problems.add(`${from} → ${src} (no file spelled exactly like that)`);
  }
}

if (problems.size) {
  console.error(`[check-links] ${problems.size} broken link(s):\n  · ${[...problems].join('\n  · ')}`);
  process.exit(1);
}
console.log(`[check-links] ✓ ${pages.length} pages, all internal links resolve`);
