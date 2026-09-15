/* ============================================================
   Seed the Iron Never Changes Stripe account.

   Creates a Product for all 24 shirts (stable ids, so re-running
   updates instead of duplicating), a $100/month coaching Product
   with a recurring Price, and a Payment Link for the coaching
   subscription — that link is what The Corner's button points at.

   The shirt checkout does NOT need any of this: api/checkout.js
   builds its line items from js/products.js at request time. This
   script exists so the Stripe dashboard has a real catalog for
   reporting, and because a subscription needs a recurring Price.

   Run it yourself so the key never leaves your machine:

     STRIPE_SECRET_KEY=sk_test_... node tools/stripe-seed.mjs

   Sandbox key seeds the sandbox, live key seeds live. Safe to run
   more than once. Zero dependencies.
   ============================================================ */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { CATALOG } = require('../js/products.js');

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error('Set STRIPE_SECRET_KEY first. See the header of this file.');
  process.exit(1);
}
const MODE = KEY.startsWith('sk_live') ? 'LIVE' : 'test';
const COACHING_CENTS = 10000;

function encodeForm(value, prefix, pairs) {
  if (value === null || value === undefined) return pairs;
  if (Array.isArray(value)) value.forEach((v, i) => encodeForm(v, `${prefix}[${i}]`, pairs));
  else if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) encodeForm(v, prefix ? `${prefix}[${k}]` : k, pairs);
  } else pairs.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  return pairs;
}

async function stripe(method, path, params) {
  const url = `https://api.stripe.com/v1/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params ? encodeForm(params, '', []).join('&') : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error((json.error && json.error.message) || `HTTP ${res.status}`);
    err.code = json.error && json.error.code;
    throw err;
  }
  return json;
}

/* Stable product ids let a second run update rather than duplicate. */
async function upsertProduct(id, params) {
  try {
    return await stripe('POST', 'products', { id, ...params });
  } catch (e) {
    if (e.code === 'resource_already_exists') return stripe('POST', `products/${id}`, params);
    throw e;
  }
}

/* Prices are immutable, so reuse a matching one instead of stacking new ones. */
async function ensurePrice(productId, cents, recurring) {
  const existing = await stripe('GET', `prices?product=${productId}&active=true&limit=100`);
  const match = (existing.data || []).find((p) =>
    p.unit_amount === cents &&
    p.currency === 'usd' &&
    (recurring ? p.recurring && p.recurring.interval === 'month' : !p.recurring));
  if (match) return match;
  const params = { product: productId, currency: 'usd', unit_amount: cents };
  if (recurring) params.recurring = { interval: 'month' };
  return stripe('POST', 'prices', params);
}

console.log(`Seeding the ${MODE} account.\n`);

let made = 0;
for (const [sku, item] of Object.entries(CATALOG)) {
  const id = `inc_${sku.replace('INC-', '')}`;
  await upsertProduct(id, {
    name: item.name,
    description: `Heavyweight garment-dyed tee, ${sku}.`,
    metadata: { sku },
    shippable: 'true',
  });
  const price = await ensurePrice(id, item.price * 100, false);
  console.log(`  ${sku}  $${item.price}  ${price.id}`);
  made += 1;
}
console.log(`\n${made} shirts in the catalog.\n`);

const coaching = await upsertProduct('inc_coaching', {
  name: 'IRON NEVER CHANGES · COACHING',
  description: 'Monthly coaching with Zac. Food plans, lifting programs, unlimited talk and text, form checks, progress portfolio. Month to month, cancel anytime.',
  metadata: { kind: 'coaching' },
});
const coachingPrice = await ensurePrice(coaching.id, COACHING_CENTS, true);

const links = await stripe('GET', 'payment_links?limit=100&active=true');
let link = (links.data || []).find((l) =>
  (l.line_items && l.line_items.data || []).some((li) => li.price && li.price.id === coachingPrice.id));
if (!link) {
  link = await stripe('POST', 'payment_links', {
    line_items: [{ price: coachingPrice.id, quantity: 1 }],
    after_completion: {
      type: 'redirect',
      redirect: { url: 'https://www.ironneverchanges.com/?coaching=1' },
    },
  });
}

console.log(`Coaching  $${COACHING_CENTS / 100}/month  ${coachingPrice.id}`);
console.log(`\nCoaching payment link:\n  ${link.url}\n`);
console.log('Paste that URL into The Corner’s button in index.html when coaching opens.');
