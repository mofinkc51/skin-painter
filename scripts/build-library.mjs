#!/usr/bin/env node
// Builds the manifest for the default costume library.
//
// Scans a folder laid out like 3D_Export:
//   <library>/<character>/<item>/<name>.obj   (or <name>.glb, texture embedded)
//   <library>/<character>/<item>/<name>_texture.png   (optional)
// and writes <library>/index.json, which the page loads on startup.
//
// Usage: node scripts/build-library.mjs [library-dir] [--pack]   (default: site/library)
//
// --pack (used by the Pages workflow): joins each character's files into one
// <library>/_packs/<character>.pack, points index.json at byte ranges inside it,
// and DELETES the loose files. GitHub Pages cancels a deploy that takes over
// 10 minutes, and thousands of small files sync far slower than a dozen big ones.
// Run it on a throwaway checkout (CI), never on your working copy.
import { readdirSync, statSync, writeFileSync, existsSync, readFileSync, mkdirSync, rmSync, openSync, writeSync, closeSync } from 'node:fs';
import { join, relative, sep, basename } from 'node:path';

const args = process.argv.slice(2);
const pack = args.includes('--pack');
const root = args.find(a => !a.startsWith('--')) || 'site/library';
if (!existsSync(root)) { console.error(`Library folder not found: ${root}`); process.exit(1); }

const toUrl = p => relative(root, p).split(sep).map(encodeURIComponent).join('/');
const items = [];

function walk(dir, depth) {
  if (depth > 6) return;
  const entries = readdirSync(dir, { withFileTypes: true }).filter(e => !e.name.startsWith('.'));
  const files = entries.filter(e => e.isFile()).map(e => e.name);
  const objs = files.filter(f => /\.(obj|glb)$/i.test(f));
  const pngs = files.filter(f => /\.png$/i.test(f));
  const path = relative(root, dir).split(sep).filter(Boolean);
  for (const obj of objs) {
    const base = obj.replace(/\.(obj|glb)$/i, '');
    const png = pngs.find(f => f.toLowerCase() === `${base}_texture.png`.toLowerCase())
             || pngs.find(f => f.toLowerCase().startsWith(base.toLowerCase()))
             || (objs.length === 1 ? pngs[0] : undefined);
    items.push({
      objName: obj,
      _obj: join(dir, obj), _png: png ? join(dir, png) : null,
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

if (pack) {
  const packDir = join(root, '_packs');
  rmSync(packDir, { recursive: true, force: true }); mkdirSync(packDir, { recursive: true });
  const groups = new Map();
  for (const it of items) { const k = it.path[0] || '_root'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
  let n = 0;
  for (const [k, list] of groups) {
    const name = k.replace(/[^\w.-]+/g, '_') + '-' + (++n) + '.pack';
    const fd = openSync(join(packDir, name), 'w'); let off = 0;
    const add = file => { const buf = readFileSync(file); writeSync(fd, buf); const r = `_packs/${encodeURIComponent(name)}#bytes=${off}-${off + buf.length - 1}`; off += buf.length; return r; };
    for (const it of list) { it.obj = add(it._obj); if (it._png) it.png = add(it._png); }
    closeSync(fd);
  }
  // keep only index.json, README and the packs
  for (const e of readdirSync(root, { withFileTypes: true }))
    if (e.isDirectory() && e.name !== '_packs') rmSync(join(root, e.name), { recursive: true, force: true });
  console.log(`Packed into ${groups.size} file(s) in ${packDir}`);
}
for (const it of items) { delete it._obj; delete it._png; }

const out = { name: basename(root.replace(/[\\/]+$/, '')) === 'library' ? 'คลังเริ่มต้น' : basename(root), items };
writeFileSync(join(root, 'index.json'), JSON.stringify(out, null, 1) + '\n');
const chars = new Set(items.map(i => i.path.length >= 2 ? i.path[i.path.length - 2] : '(root)'));
console.log(`Library: ${items.length} item(s) in ${chars.size} character folder(s), ${items.filter(i => i.png).length} with PNG, ${items.filter(i => /\.glb$/i.test(i.obj)).length} GLB -> ${join(root, 'index.json')}`);
