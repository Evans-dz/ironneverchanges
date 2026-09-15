/* Normalize shirt cutouts into the 400x460 card space (rendered at 3x = 1200x1380).
   Anchors: hem-row center → x=200u, collar top → y=60u, body (hem) width → ~300u.
   Emits placements.json with per-image anatomy in 400-viewBox units.

   Usage (needs sharp — run from any scratch dir, never ships):
     npm i sharp && node normalize.mjs <dir of cutout PNGs> <out dir>
   Cutouts come from cutout.swift (swiftc -O cutout.swift -o cutout). */
import sharp from 'sharp';
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CUT = process.argv[2];
const OUT = process.argv[3];
const SCALE3 = 3; // canvas px per viewBox unit
const CANVAS_W = 400 * SCALE3, CANVAS_H = 460 * SCALE3;
const TARGET_BODY_U = 300;   // hem width in units
const MAX_SPAN_U = 384;      // sleeve-to-sleeve cap
const MAX_H_U = 316;         // garment length cap
const COLLAR_Y_U = 60;

const files = (await readdir(CUT)).filter(f => f.endsWith('.png')).sort();
const report = {};

for (const f of files) {
  const img = sharp(path.join(CUT, f));
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const alpha = (x, y) => data[(y * W + x) * 4 + 3];

  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (alpha(x, y) > 16) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  // hem row: a few px above the very bottom to dodge stray pixels
  const hemY = maxY - Math.round((maxY - minY) * 0.02);
  let hMin = W, hMax = -1;
  for (let x = 0; x < W; x++) if (alpha(x, hemY) > 16) { if (x < hMin) hMin = x; if (x > hMax) hMax = x; }
  const hemW = hMax - hMin + 1;
  const hemCx = (hMin + hMax) / 2;
  const spanW = maxX - minX + 1;
  const bodyH = maxY - minY + 1;

  // scale: hem→300u, capped so span and height fit
  const scale = Math.min(
    (TARGET_BODY_U * SCALE3) / hemW,
    (MAX_SPAN_U * SCALE3) / spanW,
    (MAX_H_U * SCALE3) / bodyH,
  );

  const outW = Math.round(W * scale), outH = Math.round(H * scale);
  const left = Math.round(200 * SCALE3 - hemCx * scale);
  const top = Math.round(COLLAR_Y_U * SCALE3 - minY * scale);

  const resized = await sharp(path.join(CUT, f)).resize(outW, outH, { kernel: 'lanczos3' }).png().toBuffer();
  const name = f.replace('.png', '');
  await sharp({ create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left, top }])
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(OUT, `${name}.webp`));

  // anatomy in viewBox units
  const u = (px) => +(px / SCALE3).toFixed(1);
  const bodyWU = u(hemW * scale);
  const rec = {
    bodyW: bodyWU,                        // hem/body width in units
    span: u(spanW * scale),               // sleeve-to-sleeve
    collarY: COLLAR_Y_U,
    hemY: u(COLLAR_Y_U * SCALE3 + bodyH * scale),
    upi: +(bodyWU / 26.5).toFixed(2),     // units per inch (26.5" boxy body)
  };
  report[name] = rec;
  console.log(name, JSON.stringify(rec));
}
await writeFile(path.join(OUT, 'placements.json'), JSON.stringify(report, null, 2));
