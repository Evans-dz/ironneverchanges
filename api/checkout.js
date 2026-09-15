/* ============================================================
   POST /api/checkout — turn the browser cart into a Stripe
   Checkout Session and hand back the hosted payment URL.

   No dependencies on purpose: Stripe's REST API is form-encoded
   HTTPS, so plain fetch keeps this site's promise of no build
   step and no npm packages in the deploy.

   The client sends SKUs, sizes and quantities. It never sends
   prices — those are read from js/products.js on this side, so a
   rewritten cart in somebody's devtools buys nothing cheaper.

   Needs one environment variable in Vercel: STRIPE_SECRET_KEY, a
   RESTRICTED key (rk_) whose only permission is Checkout Sessions:
   Write. That covers the inline prices and the inline shipping rate
   below; it cannot refund, read a customer, or move a payout, so a
   leak costs nothing but some junk payment pages. Turning on
   automatic_tax later would also need Tax: Read.

   Without the variable the endpoint reports itself closed and the
   site falls back to its honest "not wired up yet" note.
   ============================================================ */
'use strict';

const { SIZES, CATALOG, MAX_QTY, MAX_LINES } = require('../js/products.js');

const SHIPPING_CENTS = 600;    /* flat US rate; 0 ships free */
const CURRENCY = 'usd';

/* Where a session is allowed to send the customer back to. An
   origin off this list falls through to the canonical domain, so
   a forged Origin header can't aim the return trip somewhere else. */
const SITE = 'https://www.ironneverchanges.com';
const ALLOWED_ORIGINS = [
  SITE,
  'https://ironneverchanges.com',
  'http://localhost:4175',
];

/* Stripe takes nested params as bracketed form keys:
   line_items[0][price_data][unit_amount]=4200 */
function encodeForm(value, prefix, pairs) {
  if (value === null || value === undefined) return pairs;
  if (Array.isArray(value)) {
    value.forEach((v, i) => encodeForm(v, `${prefix}[${i}]`, pairs));
  } else if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      encodeForm(v, prefix ? `${prefix}[${k}]` : k, pairs);
    }
  } else {
    pairs.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  }
  return pairs;
}

function readBody(req) {
  const raw = req.body;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch (e) { return {}; }
  }
  return raw;
}

/* Throws on anything the catalog doesn't recognise. */
function buildLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('empty cart');
  if (items.length > MAX_LINES) throw new Error('too many lines');

  const seen = new Set();
  return items.map((item) => {
    const sku = String((item && item.sku) || '');
    const size = String((item && item.size) || '');
    const qty = Number((item && item.qty) || 0);
    const product = Object.prototype.hasOwnProperty.call(CATALOG, sku) ? CATALOG[sku] : null;

    if (!product) throw new Error('unknown item');
    if (!SIZES.includes(size)) throw new Error('unknown size');
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new Error('bad quantity');

    const line = `${sku}/${size}`;
    if (seen.has(line)) throw new Error('duplicate line');
    seen.add(line);

    return {
      quantity: qty,
      price_data: {
        currency: CURRENCY,
        /* Rounded, not truncated: a catalog price of 38.50 would otherwise
           float to 3850.0000000000005 and Stripe rejects a non-integer. */
        unit_amount: Math.round(product.price * 100),
        /* Inline product_data rather than a seeded price id, so checkout works
           without tools/stripe-seed.mjs having been run and so the customer
           sees their size before paying. The cost: Stripe mints a Product per
           line, so the dashboard catalog accumulates duplicates. Size lives in
           the description, not the name, to hold that at one name per SKU
           instead of one per SKU-and-size. Upgrade path when it gets noisy:
           seed a product per sku/size and reference it by id here. */
        product_data: {
          name: product.name,
          description: `Size ${size}`,
          metadata: { sku, size },
        },
      },
    };
  });
}

function pickOrigin(req) {
  const origin = req.headers && req.headers.origin;
  return ALLOWED_ORIGINS.includes(origin) ? origin : SITE;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only.' });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Checkout is not open yet.' });
  }

  let lineItems;
  try {
    lineItems = buildLineItems(readBody(req).items);
  } catch (e) {
    /* Deliberately vague: a probe shouldn't learn which check it tripped. */
    return res.status(400).json({ error: 'That cart could not be read. Refresh and try again.' });
  }

  const origin = pickOrigin(req);
  const params = {
    mode: 'payment',
    line_items: lineItems,
    success_url: `${origin}/?paid=1`,
    cancel_url: `${origin}/#shop`,
    submit_type: 'pay',
    shipping_address_collection: { allowed_countries: ['US'] },
    phone_number_collection: { enabled: false },
  };

  if (SHIPPING_CENTS > 0) {
    params.shipping_options = [{
      shipping_rate_data: {
        type: 'fixed_amount',
        display_name: 'Standard shipping',
        fixed_amount: { amount: SHIPPING_CENTS, currency: CURRENCY },
      },
    }];
  }

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-06-20',
      },
      body: encodeForm(params, '', []).join('&'),
      /* A hung Stripe call would otherwise pin this function open until the
         platform kills it, and the customer stares at a dead button. */
      signal: AbortSignal.timeout(15000),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok || !session.url) {
      /* Stripe's message goes to the server log, never to the browser. */
      console.error('stripe session failed', stripeRes.status, session && session.error);
      return res.status(502).json({ error: 'Checkout is having a moment. Try again shortly.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('stripe session error', e && e.message);
    return res.status(502).json({ error: 'Checkout is having a moment. Try again shortly.' });
  }
};
