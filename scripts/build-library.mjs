#!/usr/bin/env node
// Builds the manifest for the default costume library.
//
// Scans a folder laid out like 3D_Export:
//   <library>/<character>/<item>/<name>.obj
//   <library>/<character>/<item>/<name>_texture.png   (optional)
// and writes <library>/index.json, which the page loads on startup.
//
// Usage: node scripts/build-library.mjs [library-dir]   (default: site/library)
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep, basename } from 'node:path';

const root = process.argv[2] || 'site/library';
if (!existsSync(root)) { console.error(`Library folder not found: ${root}`); process.exit(1); }

const toUrl = p => relative(root, p).split(sep).map(encodeURIComponent).join('/');
const items = [];

function walk(dir, depth) {
  if (depth > 6) return;
  const entries = readdirSync(dir, { withFileTypes: true }).filter(e => !e.name.startsWith('.'));
  const files = entries.filter(e => e.isFile()).map(e => e.name);
  const objs = files.filter(f => /\.obj$/i.test(f));
  const pngs = files.filter(f => /\.png$/i.test(f));
  const path = relative(root, dir).split(sep).filter(Boolean);
  for (const obj of objs) {
    const base = obj.replace(/\.obj$/i, '');
    const png = pngs.find(f => f.toLowerCase() === `${base}_texture.png`.toLowerCase())
             || pngs.find(f => f.toLowerCase().startsWith(base.toLowerCase()))
             || (objs.length === 1 ? pngs[0] : undefined);
    items.push({
      path,                                   // folder path inside the library, e.g. ["Cat","Cat_legend"]
      obj: toUrl(join(dir, obj)),             // URL relative to index.json
      png: png ? toUrl(join(dir, png)) : null,
      pngName: png || `${base}_texture.png`,
      bytes: statSync(join(dir, obj)).size + (png ? statSync(join(dir, png)).size : 0),
    });
  }
  for (const e of entries) if (e.isDirectory()) walk(join(dir, e.name), depth + 1);
}
walk(root, 0);
items.sort((a, b) => a.path.join('/').localeCompare(b.path.join('/')));

const out = { name: basename(root.replace(/[\\/]+$/, '')) === 'library' ? 'คลังเริ่มต้น' : basename(root), items };
writeFileSync(join(root, 'index.json'), JSON.stringify(out, null, 1) + '\n');
const chars = new Set(items.map(i => i.path.length >= 2 ? i.path[i.path.length - 2] : '(root)'));
console.log(`Library: ${items.length} item(s) in ${chars.size} character folder(s), ${items.filter(i => i.png).length} with PNG -> ${join(root, 'index.json')}`);
