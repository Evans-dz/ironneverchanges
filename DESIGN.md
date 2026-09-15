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
not UI palette.

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
| Print overlay | Prints stay LIVE — SVG `<image>` marks and page-font `<text>` in the `.pl` group at 93% opacity over the photo, never baked into the raster; placement = print spec in inches (`brand/SHIRT-CONCEPTS.md`) × measured units-per-inch (`assets/shirts/raw/placements.json`); white ink on the dark washes, black ink art on grey, slogan-bar text is a fixed dark knockout (`#2b2b2e`) | Retina-crisp prints, slogans set in the site's own Archivo, and a print change is a markup edit — no reprocessing |
| Ground shadow | `.tsh` ellipse per face, cy/rx from that colorway's measured hem, blurred by `#softHard` — the one filter left in `<defs>` | Cutouts need grounding on the panel or they float |
| Product card | Front/back cross-fade views + flip toggle; tapping the image flips; size chips S–3X; `data-sku/name/price` on the article drive the cart | The card IS the product database (see §9) |
| Cart drawer | Client-side demo: localStorage `inc-cart`, qty/remove, subtotal; checkout reveals an honest "isn't wired up yet" note; focus-trapped dialog, Esc closes, refcounted scroll lock shared with the menu | Concept build never fakes a working checkout |
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
- Keep all assets local — fonts, GSAP, textures. Zero external requests.
- Keep demo states honest ("checkout isn't wired up yet", "the list isn't wired
  up yet", footer "Concept build").
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
- Tap targets: chips/flip buttons run small (~26–32px) — audit flags them;
  known debt on the concept build.

## 9. Data source of truth

**File: none — `<TODO — decide before checkout wiring>`.** Product data
(SKU, name, price, colorway, print spec) lives inline on each `.prod` article
as `data-*` attributes + visible copy; the cart reads the DOM. Prices are
concept placeholders ($34–$42). Copy truth for slogans/placements is
`brand/SHIRT-CONCEPTS.md`; identity truth is `brand/BRAND-GUIDE.md`. If the
shop grows past 8 SKUs or checkout gets wired, extract `js/products.js` first.

## 10. Launch checklist

- [ ] Real prices confirmed, concept-placeholder notes removed
- [ ] Waitlist form wired (stays honestly unwired until then)
- [ ] Checkout wired or the shop framed as pre-order
- [ ] Socials linked (footer "soon" labels replaced)
- [ ] `noindex` removed; robots.txt + sitemap.xml added
- [ ] GA4 (Armour Crete account) + Search Console + Bing — the standard EZHD
      analytics stack
- [ ] `node /Users/dylanevans/Downloads/ezhd-lab/verify/audit.mjs --url http://localhost:4175` clean
- [ ] Skill pass: `/web-design-guidelines index.html css/main.css`
