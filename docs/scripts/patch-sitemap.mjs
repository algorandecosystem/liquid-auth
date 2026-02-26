#!/usr/bin/env node
// Patch @astrojs/sitemap so it doesn't crash when astro:routes:resolved
// is not fired (Astro 4.x doesn't have this hook; it was added in Astro 5.x).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const candidates = [
  resolve(__dirname, '../node_modules/@astrojs/starlight/node_modules/@astrojs/sitemap/dist/index.js'),
  resolve(__dirname, '../node_modules/@astrojs/sitemap/dist/index.js'),
];

for (const file of candidates) {
  let src;
  try { src = readFileSync(file, 'utf8'); } catch { continue; }

  const patched = src.replace(
    'const routeUrls = _routes.reduce(',
    'const routeUrls = (_routes ?? []).reduce(',
  );

  if (patched === src) {
    console.log(`sitemap patch: already applied or pattern not found in ${file}`);
  } else {
    writeFileSync(file, patched);
    console.log(`sitemap patch: applied to ${file}`);
  }
}
