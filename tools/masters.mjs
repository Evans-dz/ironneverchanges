/* Print masters from the shop cards → brand/09_SHIRT-ART/

   The card prints in index.html ARE the designs: live SVG in each face's
   .pl group, drawn on the card's default wash. This turns a face into the
   file a screen printer wants, in the logo package's convention: type
   converted to outlines (Archivo Black, so nobody needs the font), one ink,
   white #ffffff and black #111111 cuts, an .svg plus 1000px and 4000px
   transparent PNGs, 100 units to the inch, trimmed to the ink.

   What it does to a face: drops the on-screen wear texture (a real print
   wears on its own), outlines every <text> with fontkit at the same size,
   spacing, anchor and transform the browser used, cuts prInv text out of
   the ink as a true knockout, inlines the mark files in the right cut, and
   scales card units to inches with the blank's measured units-per-inch.

   Needs fontkit and sharp, which never ship. Same as tools/art.mjs: install
   them in a scratch folder, copy this file there, and pass the repo path:
     npm i --no-save fontkit sharp && node masters.mjs "<repo>" [INC-004 ...]
   With no SKUs it builds every shirt in the page. --html <file> reads
   the cards from another page instead of index.html (to proof a draft). */
import * as fontkit from 'fontkit';
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const REPO = process.argv[2];
const args = process.argv.slice(3);
const htmlAt = args.indexOf('--html');       /* read cards from another page (a draft) */
const HTML = htmlAt >= 0 ? args.splice(htmlAt, 2)[1] : path.join(REPO, 'index.html');
const ONLY = args;
const OUT = path.join(REPO, 'brand', '09_SHIRT-ART');
const PX_PER_IN = 100;

/* Every face whose print is more than one logo-package file gets a master.
   A face that is a single mark (a skull on the chest) is skipped: the
   printer takes that file straight from the logo package. A second .pl on
   a face is its own placement and gets its own file: data-place names it
   (data-place="lower" → <file>-lower), and a hem-anchored one
   (data-anchor="hem") is a lower-back print, so -lower too. File names are <SKU>_<slug>; the slug
   comes from the shirt's name and face unless it is pinned here (these keep
   the names the September masters already had). */
const SLUGS = {
  'INC-004': { back: 'nobody-protected', front: 'i-do-now' },
  'INC-010': { back: 'success-stack' },
  'INC-017': { back: 'open-24' },
  'INC-018': { back: 'nobody-lifts' },
  'INC-019': { front: 'fixes-enough' },
  'INC-020': { back: 'stronger-year' },
  'INC-021': { front: 'spotter' },
  'INC-022': { back: 'showed-up' },
  'INC-023': { back: 'weight-never-lies' },
  'INC-024': { back: 'come-back' },
};
const slugify = (name) => name.toLowerCase().replace(/&rsquo;|'|\u2019/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* The site serves web-sized PNG marks; a printer gets the 4000px cut of the
   same art (same frame, checked pixel for pixel on 2026-10-13). */
const HIRES = [
  [/^assets\/brand\/INC_barbell_(white|black)\.png$/, 'brand/09_SHIRT-ART/INC_barbell-only_$1_4000px.png'],
  [/^assets\/brand\/vintage-badge_(white|black)\.png$/, 'brand/06_VINTAGE-DISTRESSED/INC_badge-primary_VINTAGE_$1_4000px.png'],
  [/^assets\/brand\/vintage-mark_(white|black)\.png$/, 'brand/06_VINTAGE-DISTRESSED/INC_mark-skull-barbell_VINTAGE_$1_4000px.png'],
  [/^assets\/brand\/vintage-wordmark-stacked_(white|black)\.png$/, 'brand/06_VINTAGE-DISTRESSED/INC_wordmark-stacked_VINTAGE_$1_4000px.png'],
];

/* units per inch of each blank, assets/shirts/raw/placements.json */
const UPI = JSON.parse(await readFile(path.join(REPO, 'assets/shirts/raw/placements.json'), 'utf8'));
const font = fontkit.openSync(path.join(REPO, 'assets/fonts/archivo-black-latin-400-normal.woff2'));
const UPM = font.unitsPerEm;

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
};
const decode = (s) => s
  .replace(/&rsquo;|&#8217;/g, '’').replace(/&lsquo;|&#8216;/g, '‘')
  .replace(/&ldquo;|&#8220;/g, '“').replace(/&rdquo;|&#8221;/g, '”')
  .replace(/&middot;/g, '·').replace(/&times;/g, '×').replace(/&#8243;/g, '″')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

/* one <text> → outlined glyph paths, laid out the way the browser does:
   letter-spacing after every glyph (the last one too, so a centred line
   sits where Chrome put it), kerning on, anchor start/middle/end */
function outline(tag, content) {
  if (/<tspan/.test(content)) throw new Error('tspan in a print: split it into separate <text> lines');
  const cls = attr(tag, 'class') || '';
  if (/prMono/.test(cls)) throw new Error('prMono text in a print: the site mono is a system font that cannot go to a printer');
  const str = decode(content);
  const fs = Number(attr(tag, 'font-size'));
  const ls = Number(attr(tag, 'letter-spacing') || 0);
  const anchor = attr(tag, 'text-anchor') || 'start';
  const s = fs / UPM;
  const run = font.layout(str);
  let adv = 0;
  const parts = [];
  run.glyphs.forEach((g, i) => {
    const p = run.positions[i];
    const d = g.path.toSVG();
    if (d) parts.push({ x: adv + p.xOffset * s, d });
    adv += p.xAdvance * s + ls;
  });
  let x0 = Number(attr(tag, 'x') || 0);
  if (anchor === 'middle') x0 -= adv / 2;
  if (anchor === 'end') x0 -= adv;
  let y0 = Number(attr(tag, 'y') || 0);
  if (attr(tag, 'dominant-baseline') === 'central') y0 += ((font.ascent + font.descent) / 2) * s;
  const paths = parts.map((p) =>
    `<path transform="translate(${(x0 + p.x).toFixed(2)} ${y0.toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})" d="${p.d}"/>`).join('');
  const tf = attr(tag, 'transform');
  return { knock: /prInv/.test(cls), svg: tf ? `<g transform="${tf}">${paths}</g>` : paths };
}

async function inlineImage(tag, ink) {
  let href = attr(tag, 'href');
  href = href.replace(/_(white|black)\./, `_${ink}.`);
  const [x, y, w, h] = ['x', 'y', 'width', 'height'].map((k) => attr(tag, k) || '0');
  const file = path.join(REPO, href);
  if (href.endsWith('.svg')) {
    const raw = await readFile(file, 'utf8');
    return raw.replace(/<\?xml[^>]*>/, '').replace(/<svg([^>]*)>/, (m, a) =>
      `<svg${a.replace(/\s(?:width|height|x|y)="[^"]*"/g, '')} x="${x}" y="${y}" width="${w}" height="${h}">`);
  }
  const hi = HIRES.find(([re]) => re.test(href));
  const b64 = (await readFile(hi ? path.join(REPO, href.replace(hi[0], hi[1])) : file)).toString('base64');
  return `<image href="data:image/png;base64,${b64}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
}

async function build(pl, ink, color) {
  /* a face can hold more than one .pl (a hem-anchored one); the wear
     texture is screen only, so every mask="url(#wear)" goes */
  let body = pl.replace(/\smask="url\(#wear\)"/g, '');
  const knocks = [];
  const texts = [...body.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)];
  for (const m of texts) {
    const o = outline(m[0].match(/<text\b[^>]*>/)[0], m[1]);
    if (o.knock) knocks.push(o.svg);
    body = body.replace(m[0], () => (o.knock ? '' : o.svg));
  }
  for (const m of [...body.matchAll(/<image\b[^>]*\/>/g)]) body = body.replace(m[0], await inlineImage(m[0], ink));
  if (/<use\b[^>]*href="#(?!inc\d)/.test(body)) throw new Error('uses a page-level def; inline it into the card first');
  const ko = knocks.length
    ? `<defs><mask id="ko" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="460"><rect width="400" height="460" fill="#fff"/><g fill="#000">${knocks.join('')}</g></mask></defs>`
    : '';
  return `${ko}<g fill="${color}" color="${color}" stroke="none"${knocks.length ? ' mask="url(#ko)"' : ''}>${body}</g>`;
}

const html = await readFile(HTML, 'utf8');
await mkdir(OUT, { recursive: true });
const cards = [...html.matchAll(/<article class="prod[^"]*"[^>]*data-sku="(INC-\d+)"[\s\S]*?<\/article>/g)];
for (const [card, sku] of cards) {
  if (ONLY.length && !ONLY.includes(sku)) continue;
  const tag = card.match(/<article[^>]*>/)[0];
  const wash = attr(tag, 'data-color-default');
  const name = attr(tag, 'data-name');
  for (const face of ['front', 'back']) {
    const faceSvg = card.match(new RegExp(`prod__view--${face}"><svg[\\s\\S]*?</svg><span class="prod__face`));
    if (!faceSvg) continue;
    /* the .pl groups are siblings: each runs to the next one or the end */
    const svgBody = faceSvg[0].replace(/<\/svg><span class="prod__face$/, '');
    const starts = [...svgBody.matchAll(/<g class="pl"[^>]*>/g)];
    starts.forEach((m, i) => {
      const end = i + 1 < starts.length ? starts[i + 1].index : svgBody.length;
      m.inner = svgBody.slice(m.index + m[0].length, end).replace(/<\/g>\s*$/, '');
      m.place = attr(m[0], 'data-place') || (/data-anchor="hem"/.test(m[0]) ? 'lower' : '');
    });
    for (const g of starts) {
      if (!g.inner.trim()) continue;
      if (/^\s*<image\b[^>]*\/>\s*$/.test(g.inner)) {
        console.log(`${sku} ${face}${g.place ? ' ' + g.place : ''}: logo file ${attr(g.inner, 'href')}, no master`);
        continue;
      }
      const upi = UPI[`${wash}_${face}`].upi;
      const k = PX_PER_IN / upi;
      const W = Math.ceil(400 * k);
      const H = Math.ceil(460 * k);
      const slug = (SLUGS[sku] && SLUGS[sku][face]) || `${slugify(name)}-${face}`;
      const file = `${sku}_${slug}${g.place ? '-' + g.place : ''}`;
      let box = null;
      for (const [variant, color] of [['white', '#ffffff'], ['black', '#111111']]) {
        const inner = await build(g.inner, variant, color);
        const canvas = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><g transform="scale(${k.toFixed(5)})">${inner}</g></svg>`;
        if (!box) {
          /* trim to the ink: rasterize the whole shirt-sized sheet once and
             read back where the transparent margin ends */
          const { info } = await sharp(Buffer.from(canvas)).trim({ threshold: 0 }).toBuffer({ resolveWithObject: true });
          const pad = 4;
          box = { x: -info.trimOffsetLeft - pad, y: -info.trimOffsetTop - pad, w: info.width + 2 * pad, h: info.height + 2 * pad };
        }
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box.w} ${box.h}" width="${box.w}" height="${box.h}"><g transform="translate(${-box.x} ${-box.y}) scale(${k.toFixed(5)})">${inner}</g></svg>`;
        await writeFile(path.join(OUT, `${file}_${variant}.svg`), svg);
        for (const px of [1000, 4000]) {
          await sharp(Buffer.from(svg), { density: 72 * (px / box.w) }).resize({ width: px })
            .png().toFile(path.join(OUT, `${file}_${variant}_${px}px.png`));
        }
      }
      console.log(`${file}  ${(box.w / PX_PER_IN).toFixed(1)}" x ${(box.h / PX_PER_IN).toFixed(1)}"  (${wash}, ${face})`);
    }
  }
}
console.log('done →', OUT);
