// Makes the web copies of Webb's Pillars of Creation in public/sky/ from the original image, which is not
// kept in the repository. Get weic2216b.jpg (the "publication" JPEG, 2309 × 4000) from
// https://esawebb.org/images/weic2216b/ and run:
//   node scripts/make-pillars.mjs path/to/weic2216b.jpg
// Credit (required wherever it is shown): NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI).
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { mapCrops, PILLARS } from '../src/data/pillars.ts';

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/make-pillars.mjs path/to/weic2216b.jpg');
  process.exit(1);
}
const out = fileURLToPath(new URL('../public/sky/', import.meta.url));
await mkdir(out, { recursive: true });

const meta = await sharp(src).metadata();
if (meta.width !== PILLARS.size.w || meta.height !== PILLARS.size.h)
  throw new Error(`expected ${PILLARS.size.w} × ${PILLARS.size.h}, got ${meta.width} × ${meta.height}`);

const box = ([x0, y0, x1, y1]) => {
  const left = Math.round(x0 * meta.width);
  const top = Math.round(y0 * meta.height);
  return { left, top, width: Math.round(x1 * meta.width) - left, height: Math.round(y1 * meta.height) - top };
};

for (const [name, v] of Object.entries(PILLARS.variants)) {
  const file = `${out}pillars-${name}.webp`;
  await sharp(src).extract(box(v.crop)).resize({ width: v.width }).webp({ quality: 76, effort: 6 }).toFile(file);
  console.log(`[pillars] ${file}`);
}

// star map backdrops: a little darker and softer, so labels stay readable on top
for (const [id, crop] of Object.entries(mapCrops)) {
  const file = `${out}map-${id}.webp`;
  await sharp(src).extract(box(crop)).resize({ width: 1400 }).modulate({ brightness: 0.72 }).blur(0.6).webp({ quality: 70, effort: 6 }).toFile(file);
  console.log(`[pillars] ${file}`);
}
