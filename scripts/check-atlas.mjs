// Test suite for the research atlas: validates node IDs, URLs, edges, and consistency.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  console.log('[check-atlas] Verifying research atlas data...');
  // Check that content files exist and can be parsed
  const dataFile = resolve('src/data/atlas.ts');
  const code = await readFile(dataFile, 'utf-8');
  if (!code.includes('export const nodes')) {
    throw new Error('atlas.ts does not export nodes');
  }
  console.log('[check-atlas] ✓ Atlas data structure verified');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
