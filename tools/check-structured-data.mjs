/* The JSON-LD in index.html, llms.txt and llms-full.txt restate the catalog
   for search engines and AI answers. js/products.js stays the price truth;
   this fails loudly the moment they drift apart.

     node tools/check-structured-data.mjs

   Checks: the JSON-LD parses; one Product per catalog SKU with the catalog
   name and price; its @id is a real card id (#inc004); its image exists;
   both llms files carry every SKU at the right price. Zero dependencies. */
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { CATALOG } = createRequire(import.meta.url)(path.join(ROOT, 'js/products.js'));
const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const bad = [];

const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
const graph = blocks.flatMap((m) => JSON.parse(m[1])['@graph'] || []);
const walk = (o, out = []) => {
  if (Array.isArray(o)) o.forEach((x) => walk(x, out));
  else if (o && typeof o === 'object') { if (o['@type'] === 'Product') out.push(o); Object.values(o).forEach((x) => walk(x, out)); }
  return out;
};
const products = walk(graph);
const ids = new Set([...html.matchAll(/<article class="prod[^"]*"[^>]*\sid="(inc\d+)"/g)].map((m) => m[1]));

for (const [sku, { name, price }] of Object.entries(CATALOG)) {
  const anchor = sku.toLowerCase().replace('-', '');
  const p = products.filter((x) => x.sku === sku);
  if (p.length !== 1) { bad.push(`${sku}: ${p.length} Products in the JSON-LD`); continue; }
  const offer = [].concat(p[0].offers || [])[0] || {};
  if (p[0].name !== name) bad.push(`${sku}: JSON-LD name "${p[0].name}" != "${name}"`);
  if (Number(offer.price) !== price) bad.push(`${sku}: JSON-LD price ${offer.price} != ${price}`);
  if (!String(p[0]['@id']).endsWith(`#${anchor}`) || !ids.has(anchor)) bad.push(`${sku}: no card with id="${anchor}"`);
  const img = String(p[0].image || '').replace(/^https:\/\/www\.ironneverchanges\.com\//, '');
  if (!existsSync(path.join(ROOT, img))) bad.push(`${sku}: image ${img} missing`);
  for (const f of ['llms.txt', 'llms-full.txt']) {
    const t = readFileSync(path.join(ROOT, f), 'utf8');
    if (!t.includes(`#${anchor}`)) bad.push(`${f}: no link to #${anchor}`);
    if (!new RegExp(`\\$${price}\\b`).test(t)) bad.push(`${f}: price $${price} never appears`);
  }
}
if (products.length !== Object.keys(CATALOG).length) bad.push(`${products.length} Products vs ${Object.keys(CATALOG).length} SKUs`);
console.log(bad.length ? bad.join('\n') : `structured data matches the catalog (${products.length} products)`);
process.exit(bad.length ? 1 : 0);
