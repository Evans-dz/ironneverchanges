# DESIGN.md — Iron Never Changes

> Reverse-derived 2026-09-14 by the adopt pass, from `css/main.css`, `js/main.js`,
> `index.html`, `README.md` and `brand/BRAND-GUIDE.md`. The motion language was not
> invented here — the README declares it and the code implements it consistently.
> Confirm anything marked **proposed**.

---

## 1. Motion language

**Name:** Print strike.

**Where it comes from:** The screen-print press. Every shirt in the line is a
one-color screen print on a garment-dyed blank — the squeegee pulls, the ink
lands in one hit, and the print cracks and fades from there. Nothing about a
press glides. The site's README states this identity outright: "nothing eases:
content *stamps* in on two stepped frames like a screen-print strike."

**How it shows up:**
- **Entry and scroll reveals** — `stampIn`: two stepped frames, a misregistered
  ghost at 55% opacity offset (4px,-4px), then the ink. The hero lands in three
  press pulls (line 1, line 2, then the whole rest of the sheet in ONE strike —
  never an element-by-element stagger). Scroll reveals are the same stamp,
  fired once at `top 88%`.
- **Interaction feedback** — `hit`: a 2-frame rattle on wall slogans, the
  add-to-cart "RACKED." beat, and the load meter's clank. Section rules load in
  8 discrete chunks (`ruleLoad`, `steps(8,end)`), not a sweep.
- **The load** — scroll progress drawn as plates going onto a bar, 45 → 495 LB
  in six discrete stages, one pair of plates at a time (never lopsided). The
  ticker ratchets on `steps(460)` like a chain drive instead of gliding.

**What it must never do:** Ease, glide, fade, drift or spring. No smooth-scroll
library (native scroll is the point — the brand is anti-glide), no parallax, no
opacity tweens, no cubic-bezier anywhere. Scroll-linked effects advance in
discrete slabs (the word scrub lights three words per press stroke), never
continuously.

**Easing token:** none exists — and that is the language. Every `transition` and
`animation` in `main.css` uses `steps(1|2|8, end)` inline; the two `ease`
declarations on `.pillar__plate`/`.pillar__body` hover colors are the only
exceptions (pre-date the rule; do not copy them). If a token is ever added it is
`--strike: steps(2,end)`, and nothing else. **[proposed]**

**Mechanism:** CSS keyframes (`stampIn`, `hit`, `ruleLoad`, `rack`) do all
visible motion; vendored GSAP ScrollTrigger (`vendor/`) only *triggers* — reveal
onEnter, nav active-section state, and the word-scrub progress. **Known
deviation from the lab's no-GSAP rule:** this build predates it and vendors the
library (no CDN). All three uses are replaceable with IntersectionObserver + a
scroll listener; do that only as a deliberate task, not in passing. No JS →
fully visible static page (the `js` class arms the hiding rules only when both
vendor files loaded). Reduced motion → everything visible, load meter parked at
495 LB, native jump scrolling.

> One named motion language per build. New animation joins the strike or it
> doesn't ship.

## 2. Palette & roles

Brand truth (`brand/BRAND-GUIDE.md`): #111111 / #FFFFFF / #8C8C8C **only** on
brand marks. Derived neutral tints are for UI surfaces — never on a mark.

| Role | Token | Value | Used for |
|---|---|---|---|
| surface | `--iron` | `#111111` | page ground (Iron Black) |
| raised | `--panel` / `--panel-2` | `#181818` / `#1e1e1e` | product cards, waitlist well / tee viewports, feed frames |
| ink | `--bone` | `#ffffff` | headlines, body on dark (Bone White) |
| muted | `--ash` | `#8c8c8c` | secondary copy — 5.6:1 on `--iron` ✓ |
| de-emphasis | `--ash-dim` | `#5a5a5a` | mono micro-labels, ticker — **2.7:1 on `--iron`, fails even the 3:1 floor; known audit debt** |
| accent | *(none)* | — | the accent is **inversion**: bone/iron flip. One job — the active thing (solid CTA, selected chip/face, pillar hover, the house-slogan bar) |
| line | `--hair` / `--hair-2` | `rgba(255,255,255,.10)` / `.06` | hairlines / interior dividers |

Single dark theme. `::selection` inverts. Garment colorways are the photo
blanks themselves (washed black / blue / grey / brown in `assets/shirts/`),
not UI palette. The wash chips under each card are the garment too: each fill
is sampled from its blank photo (`#3e4149` black, `#395dbe` blue, `#a58b81`
brown, `#90949a` grey), the only non-neutral fills in the UI, and only there.

## 3. Type

- **Display:** Archivo Black (weight 400 = the Black cut), uppercase everywhere,
  tight leading (hero .92, cards 1.2), near-zero tracking. Hero stops scaling at
  150px, section titles at 54px.
- **Body:** Archivo 400/500/600, 16px / 1.65; ledes 17px, max measure ~640px
  (≈70ch); brand voice = 600, never italics (`em` renders as weight 600).
- **Mono:** `ui-monospace/'SF Mono'/Menlo` for machine text — section numbers,
  SKUs, prices-as-labels, face tags, the load weight. Wide-tracked, 9.5–13px.
- **Scale:** no ratio — per-element `clamp()` steps: 150/74/64/54/52(hero-min)
  /48/44/42/34/26 display; 17/16/14.5/13.5 body; ≤12 mono labels.
- **Loading:** five self-hosted woff2, `font-display:swap`, the two
  above-the-fold cuts preloaded. No external requests of any kind, fonts or
  otherwise.

## 4. Components — what is different here

| Element | The decision | The reason |
|---|---|---|
| Garment photos | Real washed blanks (`assets/shirts/*.webp` — 4 colorways × front/back, ~120KB each), background-removed (Vision, `tools/cutout.swift`) and normalized into the 400×460 card space by `tools/normalize.mjs`: collar top at y=60, hem-width-anchored, ~10.2 units/inch; masters in `assets/shirts/raw/` (deploy-excluded) | The blanks are real now; the cards show the actual garment wash, and one blank image is reused across every SKU in that colorway |
| Print overlay | Prints stay LIVE: SVG `<image>` marks and page-font `<text>` in the `.pl` group at 97% opacity over the photo, never baked into the raster; placement = print spec in inches × measured units-per-inch (`assets/shirts/raw/placements.json`). One ink per wash, from `COLORS` in `js/products.js`: white on washed black and blue, black on washed brown and grey (brown moved to black ink 2026-10-13: black reads 5.7:1 on it, white 3.2:1). Text takes `--ink` through `.pr` (Archivo Black only: the site mono is a system font no printer can have), drawn shapes use `currentColor`, mark files come in `_white`/`_black` cuts that the JS swaps; never a hard-coded ink. Slogan-bar knockout text (`.prInv`) is the bare garment: `--knock` is the wash's sampled color. A thin slogan bar is live text between two drawn `<rect>` bars, never dash characters (INC-002). Type is stacked and fitted: each line sized so its ink matches the block width, the Iron Sanctuary-style heavy block the client asked for (2026-10-13) | Retina-crisp prints, slogans set in the site's own Archivo, and a print change is a markup edit, no reprocessing |
| Wash switcher | Four wash chips on every card (`.prod__color`). The card's prints are drawn on its default wash (`data-color-default`); picking another swaps the blank photo, the ink (`data-ink`), the mark cuts and the ground shadow, and refits the prints to that blank with one scale by the units-per-inch ratio about the collar centre (`GARMENT` in `js/main.js`: upi from placements.json, centre lines measured from the photos). Cart lines carry the wash and the checkout validates it | The client picks from the four washes they stock by seeing every design on every one; the print stays its real size in inches on each blank |
| Print wear | Every `.pl` group wears `mask="url(#wear)"`: a tiled luminance mask from `assets/brand/ink-wear.png` (`tools/ink-wear.py`, seeded, about 3% cracked), so prints read as a washed screen print, not a sticker. An image mask, never live turbulence. Screen only: print masters leave it off, a real print wears on its own | The worn feel of the vintage set without costing legibility at card size |
| Print masters | `tools/masters.mjs` turns a card face into the printer's files in `brand/09_SHIRT-ART/`: type outlined with fontkit, `.prInv` as a true knockout, marks inlined in the right cut, white and black, SVG + 1000px + 4000px, 100 units to the inch, trimmed to the ink. A face's second placement is its own `.pl`: `data-place="lower"` names it (INC-006's hem line) and `data-anchor="hem"` also refits it from the hem on other washes (INC-005's lower-back mark); each gets its own `-lower` file. Run it after any print change. Retired designs live in `09_SHIRT-ART/_retired/` | The site card and the file the printer gets can't drift apart |
| Ground shadow | `.tsh` ellipse per face, cy/rx from that colorway's measured hem, blurred by `#softHard` — the one filter left in `<defs>` | Cutouts need grounding on the panel or they float |
| Product card | Front/back cross-fade views + flip toggle; tapping the image flips; wash chips; size chips S–3X; `data-sku/name/price/color` on the article drive the cart | The card IS the product database (see §9) |
| Feed clips | Real training footage in the 9:16 frames (`assets/feed/week-*.mp4`, 540p H.264 ~1.4Mbps, AUDIO STRIPPED — reels carry licensed music; `tools/` has the AVFoundation pipeline); click-to-play one at a time, muted+looping, progress bar fills in 8 discrete notches; photos in `.feed__proof` | Proof of work, honest and silent; masters re-exportable from the Photos album (never committed) |
| Media = monochrome | Every photo and clip renders through `filter:grayscale(1)` | The palette rule (#111/#fff/#8C8C8C) extends to photography — color footage would be the only color on the page |
| The Corner | Coaching section (05): photo + `$100/MO` display + a `prod__spec`-style includes list; the CTA is "Email Zac About Coaching" (a mailto to ironneverchanges@gmail.com) until `FORMS_KEY` holds a Web3Forms key, then the `#coachForm` (name, email, message, honeypot) takes its place and sends to the same inbox | Coaching sells on the shirts' own deal: honest, monthly, no portal, a person on the other end |
| Cart drawer | Opens from the nav Cart button (the shop is open, §9). Client-side: localStorage `inc-cart`, qty/remove, subtotal; lines carry sku, size and wash; a checkout with no key shows an honest "isn't taking payments" note; focus-trapped dialog, Esc closes, refcounted scroll lock shared with the menu | Concept build never fakes a working checkout |
| The load | Fixed bottom-right barbell SVG; plates on in pairs per sixth of scroll, caption 45→495 LB, clank on change; hidden <900px and until half a viewport of scroll | Scroll progress in the brand's own units |
| The wall | Slogan cloud from the brand's slogan bank; click stamps a line permanently lit (`is-stamped`) + `hit` rattle | The merch pipeline as a page section |
| Ticker | Duplicated track, `xPercent:-50`, 52s loop ratcheting on `steps(460)` | The one continuously-running thing, and even it doesn't glide |
| Grain | Fixed full-viewport data-URI turbulence at 5% over everything, z-60 | Print texture on the whole "sheet"; z-index reference point |
| Hero "YOU DO." | Outline-only (`-webkit-text-stroke` ash) until the 620ms ink lands (`is-filled` + one `rack` tick) | The variable in the brand sentence gets inked last |

## 5. Layout

- Sections: `max-width:1460px`, centered; gutter `--pad: clamp(20px,5vw,72px)`;
  vertical rhythm `--sec-gap: clamp(90px,14vh,170px)`.
- Section head = mono number + display title + hairline rule filling the row.
- Grids: shop 4-col → 2 (≤1160) → 1 (≤640); pillars same; feed 3-col → 1-col
  capped 420px (≤880). Name split `minmax(260px,440px) 1fr` → stacked (≤880).
- Nav: fixed 76px → 64px solid-blurred after 40px scroll; links hide ≤880
  (burger + full-screen menu), wordmark hides ≤480. Anchor scroll offsets -70px.
- Breakpoints that exist: **1160, 880/900, 640, 480** — no others.

## 6. Depth

Flat. Hairline borders (`--hair`) and the two panel tints are the entire depth
system — **no box-shadows anywhere in the UI**, no radii (everything square).
The only shadows in the build are drawn inside the tee SVG (ground ellipse,
fabric shading) because a garment is an object, not a UI surface. Borders, not
elevation; keep it that way.

## 7. Do / Don't

**Do**
- Keep every animation on stepped frames; reuse `stampIn`/`hit` before writing
  anything new.
- Keep the page fully readable with JS off, and static-but-complete under
  reduced motion.
- Keep all assets local — fonts, GSAP, textures. Zero external requests,
  with TWO sanctioned exceptions, both gated so their absence degrades
  honestly: the form POST to api.web3forms.com (the coaching form and any
  future list, gated on one `FORMS_KEY` in `js/main.js`; no key = the mailto
  button) and the checkout POST to our own `/api/checkout`, which talks to
  Stripe server-side. No form widgets (Elfsight and the like): a third-party
  script, its branding and its tracking for what one POST already does.
- Keep closed states honest AND finished: say what is and isn't open in
  plain words ("Coaching sign-up isn't on the site yet.", the cart's "isn't
  taking payments" note). Never "coming soon", never a form that sends
  nowhere, never a "soon" label (`ezhd-lab/reference/professional-polish.md`).
  The line has no drops (2026-10-13): never write "Drop 001" or a drop
  number on the site again.
- Keep `.vercelignore` patterns root-anchored (`/brand/` once stripped
  `assets/brand/` too) and `"framework": null` in `vercel.json`.
- White marks on dark garments, black on light — never the black mark on a dark
  shirt (brand guide rule).

**Don't**
- No easing curves, no smooth-scroll/Lenis, no parallax, no fades, no springs.
- No color beyond #111/#fff/#8C8C8C + the derived neutrals; nothing tints a
  brand mark; no gradients/shadows/outlines on marks.
- No lowercase display type; no cursive/"motivation-speak"; no calling the
  customer weak (tone: "I didn't feel like it either", never "no excuses").
- No live SVG turbulence anywhere (it rasterizes into blocks on some GPUs —
  the old drawn flats learned this the hard way).
- No new npm deps, no build step, no CDN. (`tools/` may use npm — it never
  ships.)
- Don't bake prints into the shirt images — prints are live overlays; a new
  colorway photo goes through `tools/normalize.mjs` so the card geometry holds.

## 8. Responsive

- Mobile: single column, burger → full-screen stamp menu, native scroll, load
  meter off (<900px), nav wordmark off (<480px), CTAs wrap. The tee cards and
  cart drawer (`min(430px,94vw)`) are the real mobile surface.
- Desktop adds: the 4-col shop wall, pillar row, hero ring at half-off-screen,
  the load meter, inline nav with active-section state.
- Tap targets: 44px on phones (≤640px), audit-clean as of 2026-09-25. Size
  chips go equal-width `flex:1 0 44px` with 4px gaps and 16px card padding,
  so all six hold one row on a 360px phone; the flip toggle, cart controls,
  footer links and nav brand get 44px too. Wash chips go 44px square on
  phones (four plus the wash name fit a 360px card). Desktop keeps the
  compact chips.

## 9. Data source of truth

**File: `js/products.js`.** SKU → name and price for all 28 shirts, and the
four washes with their ink (`COLORS`), in one
file that is both loaded raw by the browser (`window.INC_CATALOG`) and
`require`d by `api/checkout.js` on the server. **Price lives here and
nowhere else.** The cart re-resolves name and price from it on every render,
and the checkout endpoint prices the order from it server-side, so a cart
edited in devtools buys nothing cheaper and shows nothing false. The `data-price`
attributes in markup are display copy only; keep them in step with this file.

Everything else still reads from markup: default wash, print spec, the why-copy.
Copy truth for slogans and placements is `brand/SHIRT-CONCEPTS.md`, identity
truth is `brand/BRAND-GUIDE.md`, print art is `brand/09_SHIRT-ART/`. Prices
($34–$42) were confirmed final by the owner on 2026-09-25. INC-025 to INC-028
(added 2026-10-13) are at $38, confirmed by the owner 2026-10-14 along with the
kept prices on the redrawn shirts. No sales tax is collected (owner's call,
2026-10-14): the cart says "Shipping at checkout." Turning on Stripe Tax later
needs Tax: Read on the key, state registrations, `automatic_tax` in
`api/checkout.js`, and the cart and terms copy changed back.

**Open shop, no drops (since 2026-10-13, owner's call).** The line is not sold
in drops: the shop stays open all the time. "Drop 001" is gone from the site.
Every card's foot carries `<button class="btn btn--tiny" type="button" data-add>Add to cart</button>`
(44px tall on phones), `#cartBtn` shows, the hero eyebrow reads
"HEAVYWEIGHT GYM WEAR · THE SHOP IS OPEN", and the `#list` block is the standing
promise ("NO DROPS. NO COUNTDOWN. THE SHOP STAYS OPEN."), still with no form. The
Corner's CTA emails Zac (or sends the coaching form once it is keyed). The
footer carries ironneverchanges@gmail.com for wholesale and collabs, and a LEGAL
column (Privacy, Terms). The cart's 503 note no longer names
a drop: it says checkout isn't taking payments and the cart is saved.

**Never deploy an open shop on a sandbox till.** Since 2026-10-14 (owner
deleted `STRIPE_SECRET_KEY_TEST` and redeployed) `GET /api/checkout` answers
`{"open":true,"mode":"live"}`. If it ever says `"test"` again, a test key is back
and a real card would be declined. Going live (§9a, §10): put the live restricted key in
`STRIPE_SECRET_KEY`, delete `STRIPE_SECRET_KEY_TEST`, redeploy, confirm the GET
says `"mode":"live"`, then place one real order and refund it.

## 9a. Payments

| Piece | Where | Note |
|---|---|---|
| Checkout endpoint | `api/checkout.js` | Vercel serverless, **zero deps** — Stripe's REST API is form-encoded HTTPS, so raw `fetch` keeps the no-build promise. Rejects non-POST, unknown SKU/size, non-integer or out-of-range qty, duplicate lines, and carts over 24 lines. |
| Price authority | server-side only | Client sends `{sku, size, color, qty}`. Never a price. `color` must be a key of `COLORS`; the Stripe line reads "Size M · WASHED BLUE". |
| Return URLs | origin allowlist in `api/checkout.js` | A forged `Origin` falls back to the canonical domain, so no open redirect. |
| Secret | `STRIPE_SECRET_KEY` env var in Vercel | A **restricted** key (`rk_`) with one permission: Checkout Sessions → Write. That is enough for the inline prices and shipping rate; it cannot refund, read customers, or move payouts. Never in the repo, never in a response body. Absent → 503 and the honest demo note. |
| Sandbox switch | `STRIPE_SECRET_KEY_TEST` env var | **Overrides the live key while it exists.** Set it and the shop physically cannot take money; delete it to open the till. Vercel binds env vars at deploy time, so adding or removing either one needs a redeploy before it takes effect. |
| Seeding key | separate, local, temporary | Restricted key with write on Products, Prices, Payment Links. Used once by `tools/stripe-seed.mjs`, then rolled. Never goes near Vercel. |
| Coaching | Stripe Payment Link | A subscription needs a recurring Price; `tools/stripe-seed.mjs` creates it and prints the link URL. The Corner has no button until that link exists; add one pointing at it. |
| Seeding | `tools/stripe-seed.mjs` | Repo-only, deploy-excluded. Stable product ids so re-running updates instead of duplicating. Run it yourself: the key stays on your machine. |
| Cart limits | `MAX_QTY` / `MAX_LINES` in `js/products.js` | Both sides read them, so the `+` button stops exactly where the server would refuse. |

**Known tradeoff, decided deliberately.** Checkout sends inline
`price_data.product_data` rather than referencing a seeded Price id. Stripe
treats that as "create a Product", so the dashboard catalog accumulates one
duplicate per line item sold. Accepted because the alternative costs the
customer their size on Stripe's payment page, and because it keeps checkout
working whether or not the seed script has been run. Size therefore lives in
the line's `description`, not its name, which holds the duplicates to one name
per SKU instead of one per SKU-and-size, and `metadata.sku` keeps every order
attributable. **Upgrade path if the catalog gets noisy:** seed a Product per
sku/size and reference it by id — that also buys per-size sales data, which is
what tells you which sizes to reorder.

## 9b. Site files (professional polish, 2026-09-25)

`404.html` (root-absolute paths, the hero's own strike via `body.go`, outlined
"BAR." because nothing is on it, reduced motion opts out in CSS), `robots.txt`
(crawl open so the noindex can be read; `/api/` disallowed), `sitemap.xml`,
`llms.txt`, and Organization + Brand + WebSite JSON-LD in the home `<head>`.
Schema and llms.txt carry brand truth only: the email ironneverchanges@gmail.com
(given 2026-10-13), and no address, phone or socials until the owner gives them.

**Privacy and terms (2026-10-13):** `privacy.html` and `terms.html`, plain
language, in this site's design, linked from every footer and the sitemap. The
contact on both is ironneverchanges@gmail.com (the owner's, 2026-10-13); no
address, phone or governing-law state, because none was given. What they say,
as decided:
all sales final unless an item arrives damaged or wrong; US shipping only,
flat $6 (`SHIPPING_CENTS` in `api/checkout.js`); payments by Stripe; hosting
and function logs by Vercel; the cart lives in the visitor's own localStorage
(`inc-cart`); fonts, video and images self-hosted; no analytics yet (add GA4
to the privacy page the day it goes in); Web3Forms carries the coaching
form. Neither page is lawyer-reviewed, and the owner has been told.

## 10. Launch checklist

- [x] Real prices confirmed, concept-placeholder notes removed (2026-09-25)
- [x] Owner confirmed $38 for INC-025 to INC-028 and the kept prices on the
      redrawn INC-011 ($42) and INC-014/015 ($40) (2026-10-14)
- [x] Privacy + terms pages written and linked from every footer (2026-10-13;
      home state not given, so no governing-law clause)
- [ ] Web3Forms access key for ironneverchanges@gmail.com pasted into
      `FORMS_KEY` (`js/main.js`): turns the Corner's mailto into the form
- [x] **`STRIPE_SECRET_KEY_TEST` deleted from Vercel, then redeployed**
      (2026-10-14; GET reports `"mode":"live"`)
- [ ] `STRIPE_SECRET_KEY` set in Vercel (live restricted key). The markup is
      already an open shop (2026-10-13, no drops); it ships only after this
- [ ] Optional: `tools/stripe-seed.mjs` run against the live key, if coaching
      is ever paid on the site (today it is arranged by email)
- [ ] One real test order placed and refunded, shipping rate confirmed
- [ ] Socials linked: add a SOCIAL footer column once real handles exist
      (the "soon" labels were removed 2026-09-25), plus `sameAs` in the JSON-LD
- [x] robots.txt + sitemap.xml added (2026-09-25)
- [ ] `noindex` removed and a canonical tag added (owner kept noindex on
      2026-09-25; flip both together, never canonical alongside noindex)
- [ ] GA4 (Armour Crete account) + Search Console + Bing — the standard EZHD
      analytics stack
- [ ] `node ~/Projects/EZHD/ezhd-lab/verify/audit.mjs --url https://www.ironneverchanges.com` clean
- [ ] Skill pass: `/web-design-guidelines index.html css/main.css`
