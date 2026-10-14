/* Tell Bing (and every IndexNow engine: Yandex, Seznam, Naver) that pages
   changed, so they recrawl now instead of whenever. Bing's index is what
   ChatGPT search and Copilot answer from, so this is the fast lane into AI
   answers too. No account needed: the key file at the site root proves we
   own the domain.

   Run after a deploy that changed page content:
     node tools/indexnow.mjs            (every URL in sitemap.xml)
     node tools/indexnow.mjs /terms.html (just these paths)
   Zero dependencies. A 200 or 202 means accepted. */
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const HOST = 'www.ironneverchanges.com';
const key = (await readdir(ROOT)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, -4);
if (!key) throw new Error('no IndexNow key file (32 hex chars + .txt) at the repo root');

const args = process.argv.slice(2);
const urlList = args.length
  ? args.map((p) => `https://${HOST}${p.startsWith('/') ? p : '/' + p}`)
  : [...(await readFile(path.join(ROOT, 'sitemap.xml'), 'utf8')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const live = await fetch(`https://${HOST}/${key}.txt`).then((r) => (r.ok ? r.text() : ''));
if (live.trim() !== key) throw new Error(`https://${HOST}/${key}.txt is not live yet; deploy first`);

const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList }),
});
console.log(`IndexNow ${r.status} ${r.statusText} for ${urlList.length} URL(s):\n  ${urlList.join('\n  ')}`);
if (r.status >= 300) process.exit(1);
