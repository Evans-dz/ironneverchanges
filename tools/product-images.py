"""Second half of tools/product-images.mjs: card screenshots → product WebPs.

Trims the screenshot hairline off the edges, centres the shirt (with its
ground shadow) on the flat panel background, scales to 800px wide and writes
a WebP. usage: python3 tools/product-images.py <png_dir> <out_dir>
"""
import os
import sys
from PIL import Image, ImageChops

src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
EDGE = 6        # px ignored on every side while measuring (the hairline is <=4px)
WIDTH = 800

for f in sorted(os.listdir(src)):
    if not f.endswith('.png'):
        continue
    im = Image.open(os.path.join(src, f)).convert('RGB')
    im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    W, H = im.size
    inner = im.crop((EDGE, EDGE, W - EDGE, H - EDGE))
    bg = inner.getpixel((10, 10))
    diff = ImageChops.difference(inner, Image.new('RGB', inner.size, bg)).convert('L')
    l, t, r, b = diff.point(lambda v: 255 if v > 4 else 0).getbbox()
    l, t, r, b = l + EDGE, t + EDGE, r + EDGE, b + EDGE
    out = Image.new('RGB', (W, H), bg)
    out.paste(im.crop((l, t, r, b)), (round((W - (r - l)) / 2), round((H - (b - t)) / 2)))
    name = f[:-4] + '.webp'
    out.save(os.path.join(dst, name), 'WEBP', quality=82, method=6)
    print(name, os.path.getsize(os.path.join(dst, name)) // 1024, 'KB')
