# IRON NEVER CHANGES — concept site

Concept/dummy site for the Iron Never Changes gym-wear brand, built by EZHD as a
real-prospect pitch. Heavyweight single-page static build: vanilla HTML/CSS/JS,
vendored GSAP + ScrollTrigger, no build step, no external requests.

**Motion identity — deliberately unlike the other EZHD demos:** native scroll (no
Lenis, on purpose — the brand is anti-glide), and nothing eases: content *stamps*
in on two stepped frames like a screen-print strike (`stampIn`/`hit`/`ruleLoad`
keyframes). The scroll-progress indicator is a barbell that loads plates as you
go (45 → 495 LB at the footer). Keep new animation in this language.

- **Run locally:** `node server.js` → http://localhost:4175
- **Deploy:** Vercel, static. `.vercelignore` keeps `brand/` (the 31 MB print-ready
  logo package), this README and the dev server out of the deploy.
- **Brand truth:** `brand/BRAND-GUIDE.md` and `brand/SHIRT-CONCEPTS.md` are the
  client's source material — colors (#111 / #fff / #8C8C8C only), Archivo type,
  the eight shirt designs, and the slogan bank all come from there.
- **Shop:** framed as a shop, not drops (client's call). Working client-side demo
  cart — size chips, quantities, subtotal, localStorage — with an honest "checkout
  isn't wired up yet" state. Prices are concept placeholders ($34–$42).
- **Status:** no real domain yet (lives on a vercel.app URL), page is `noindex`,
  the waitlist form is intentionally unwired, socials are dead links until the
  client's handles are confirmed.
