/* Product photos for search and AI answers → assets/products/<sku>.webp
   (inc001.webp …), the images the JSON-LD Products in index.html point at.

   Renders each card's hero face (data-view) on its default wash from the
   running dev server, with the site chrome and the card's own toggle hidden,
   then tools/product-images.py centres the shirt on the panel and writes an
   800px WebP. Re-run whenever a print changes, then commit the images.

     node tools/product-images.mjs [http://localhost:4175]

   Needs playwright-core (the EZHD lab has a copy; set PLAYWRIGHT to use
   another) and python3 with Pillow. Never ships: /tools/ is deploy-excluded. */
import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PW = process.env.PLAYWRIGHT || '/Users/dylanevans/Projects/EZHD/ezhd-lab/node_modules/playwright-core/index.mjs';
const { chromium } = await import(PW);
const url = process.argv[2] || 'http://localhost:4175';
const tmp = mkdtempSync(path.join(tmpdir(), 'inc-products-'));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: '.nav,.grain,.load,.ticker,.prod__flip,.prod__face{display:none!important}' });
const skus = await page.$$eval('.prod', (els) => els.map((e) => e.dataset.sku));
for (const sku of skus) {
  const card = page.locator(`.prod[data-sku="${sku}"]`);
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await card.locator('.prod__views').screenshot({ path: path.join(tmp, `${sku.toLowerCase().replace('-', '')}.png`) });
}
await browser.close();

execFileSync('python3', [path.join(ROOT, 'tools/product-images.py'), tmp, path.join(ROOT, 'assets/products')], { stdio: 'inherit' });
console.log(`${skus.length} product images → assets/products/`);
