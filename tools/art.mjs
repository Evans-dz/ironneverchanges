/* Generate print-ready art for INC-010/011/012 → brand/09_SHIRT-ART/
   Type set in Archivo Black converted to outlines via fontkit (no fonts
   needed downstream, matching the logo package convention). */
import * as fontkit from 'fontkit';
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const REPO = process.argv[2];
const OUT = path.join(REPO, 'brand', '09_SHIRT-ART');
await mkdir(OUT, { recursive: true });

const font = fontkit.openSync(path.join(REPO, 'assets/fonts/archivo-black-latin-400-normal.woff2'));
const UPM = font.unitsPerEm;

/* one line of outlined text → {paths, width} at font-size px */
function line(str, fs, ls = 0) {
  const run = font.layout(str);
  const s = fs / UPM;
  let x = 0;
  const parts = [];
  for (const [i, g] of run.glyphs.entries()) {
    const pos = run.positions[i];
    const d = g.path.toSVG();
    if (d) parts.push(`<path transform="translate(${(x + pos.xOffset * s).toFixed(1)} 0) scale(${s.toFixed(5)} ${-s.toFixed(5)})" d="${d}"/>`);
    x += pos.xAdvance * s + ls;
  }
  return { svg: parts.join(''), width: x - ls };
}
/* centered line at target width (auto font-size), baseline y */
function fitLine(str, targetW, cx, y, ls = 0) {
  const probe = line(str, 100, ls);
  const fs = (100 * targetW) / probe.width;
  const l = line(str, fs, ls * (fs / 100));
  return { g: `<g transform="translate(${(cx - l.width / 2).toFixed(1)} ${y})">${l.svg}</g>`, fs };
}
const wrap = (w, h, inner, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><g fill="${color}">${inner}</g></svg>`;

async function emit(name, w, h, innerFor) {
  for (const [variant, color] of [['white', '#ffffff'], ['black', '#111111']]) {
    const svg = wrap(w, h, innerFor(color), color);
    const file = path.join(OUT, `${name}_${variant}.svg`);
    await writeFile(file, svg);
    for (const px of [1000, 4000]) {
      const scale = px / w;
      await sharp(Buffer.from(svg), { density: 72 * scale }).resize({ width: px })
        .png().toFile(path.join(OUT, `${name}_${variant}_${px}px.png`));
    }
    console.log(name, variant);
  }
}

/* mark files inlined as nested svg */
async function mark(fileBase, color, x, y, w, h) {
  const f = color === '#111111' ? `${fileBase}_black.svg` : `${fileBase}_white.svg`;
  const raw = await readFile(path.join(REPO, 'assets/brand', f), 'utf8');
  return raw.replace(/<svg([^>]*)>/, (m, attrs) => {
    const cleaned = attrs.replace(/\s(?:width|height|x|y)="[^"]*"/g, '');
    return `<svg${cleaned} x="${x}" y="${y}" width="${w}" height="${h}">`;
  });
}

/* ---- INC-010: the success quote, stacked ---- */
{
  const W = 1300, cx = W / 2, tw = 1240;
  const l1 = fitLine('SUCCESS IS THE SUM', tw, cx, 150);
  const l2 = fitLine('OF SMALL EFFORTS', tw, cx, 330);
  const l3 = fitLine('REPEATED', tw, cx, 680);
  const l4 = fitLine('DAY IN AND DAY OUT', tw, cx, 860);
  const mW = 340, mH = mW * 0.665;
  await emit('INC-010_success-stack', W, 1250, (color) => {
    return l1.g + l2.g + l3.g + l4.g + `{{MARK-${color}}}`;
  });
  /* nested mark can't be sync in emit — patch files */
  for (const [variant, color] of [['white', '#ffffff'], ['black', '#111111']]) {
    const file = path.join(OUT, `INC-010_success-stack_${variant}.svg`);
    let svg = await readFile(file, 'utf8');
    svg = svg.replace(`{{MARK-${color}}}`, await mark('INC_mark-skull-barbell', color, cx - mW / 2, 940, mW, mH));
    await writeFile(file, svg);
    for (const px of [1000, 4000]) {
      await sharp(Buffer.from(svg), { density: 72 * (px / 1300) }).resize({ width: px })
        .png().toFile(path.join(OUT, `INC-010_success-stack_${variant}_${px}px.png`));
    }
  }
}

/* ---- INC-011: HOME outlines + photo-filled version ---- */
{
  const W = 4000, cx = W / 2;
  const h1 = fitLine('HOME', 3800, cx, 1050, 40);
  const h2 = fitLine('THE GYM COUNTS.', 1400, cx, 1300, 30);
  await emit('INC-011_home-outline', W, 1400, () => h1.g + h2.g);

  /* photo version: letters masked from the gym band, subline solid dark */
  const maskSvg = wrap(W, 1400, h1.g, '#ffffff');
  const maskPng = await sharp(Buffer.from(maskSvg), { density: 72 }).resize({ width: W }).png().toBuffer();
  const photo = await sharp(path.join(process.argv[3], 'home-fill-print.png'))
    .resize(W, 1400, { fit: 'cover' }).png().toBuffer();
  const letters = await sharp(photo).composite([{ input: maskPng, blend: 'dest-in' }]).png().toBuffer();
  const subSvg = wrap(W, 1400, h2.g, '#111111');
  const sub = await sharp(Buffer.from(subSvg), { density: 72 }).resize({ width: W }).png().toBuffer();
  const full = await sharp({ create: { width: W, height: 1400, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: letters }, { input: sub }]).png();
  await full.clone().toFile(path.join(OUT, 'INC-011_home-photo_4000px.png'));
  await sharp(await full.clone().toBuffer()).resize({ width: 1000 }).png().toFile(path.join(OUT, 'INC-011_home-photo_1000px.png'));
  console.log('INC-011 photo version');
}

/* ---- INC-012: clock-barbell mark + lockup ---- */
{
  const clock = (color, x, y, size) => {
    const s = size / 100;
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-linecap="round">
      <circle cx="50" cy="50" r="43" stroke-width="5"/>
      <path d="M50 12v8 M50 80v8 M12 50h8 M80 50h8" stroke-width="4"/>
      <g transform="rotate(-34 50 50)"><path d="M23 50h54" stroke-width="4.5"/><path d="M33 40v20 M67 40v20" stroke-width="6"/><path d="M26.5 43.5v13 M73.5 43.5v13" stroke-width="5"/></g>
    </g>`;
  };
  await emit('INC-012_clock-mark', 2000, 2000, (color) => clock(color, 0, 0, 2000));
  const t1 = fitLine('CLOCK OUT.', 1380, 750, 240);
  const t2 = fitLine('LOAD UP.', 1120, 750, 2080);
  await emit('INC-012_clock-lockup', 1500, 2200, (color) => t1.g + clock(color, 150, 380, 1200) + t2.g);
}
console.log('done →', OUT);
