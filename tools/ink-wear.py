"""Make assets/brand/ink-wear.png: the screen-print wear on every shop print.

A tileable luminance mask (white = the ink holds, black = it cracked away):
fine specks, a few clustered flake-offs, and hairline cracks, the way a
one-color plastisol print on a garment-dyed tee looks after a few washes.
index.html tiles it over every .pl group as #wear. Seeded, so re-running
gives the same file. Run from the repo root: python3 tools/ink-wear.py
"""
import math
import random
from PIL import Image, ImageDraw

random.seed(1717)
N, S = 256, 4                      # tile size, supersample factor
im = Image.new('L', (N * S, N * S), 255)
d = ImageDraw.Draw(im)


def dot(x, y, r):
    for ox in (-N * S, 0, N * S):  # wrap so the tile has no seams
        for oy in (-N * S, 0, N * S):
            d.ellipse((x - r + ox, y - r + oy, x + r + ox, y + r + oy), fill=0)


for _ in range(520):               # fine specks
    dot(random.uniform(0, N * S), random.uniform(0, N * S), random.uniform(0.5, 1.3) * S)
for _ in range(9):                 # clustered flake-offs
    cx, cy = random.uniform(0, N * S), random.uniform(0, N * S)
    for _ in range(random.randint(3, 7)):
        dot(cx + random.gauss(0, 3 * S), cy + random.gauss(0, 3 * S), random.uniform(0.7, 1.6) * S)
for _ in range(9):                 # hairline cracks
    x, y, a = random.uniform(0, N * S), random.uniform(0, N * S), random.uniform(0, math.pi)
    length, pts = random.uniform(10, 32) * S, []
    for _ in range(12):
        a += random.gauss(0, .35)
        x += math.cos(a) * length / 12
        y += math.sin(a) * length / 12
        pts.append((x, y))
    for ox in (-N * S, 0, N * S):
        for oy in (-N * S, 0, N * S):
            d.line([(px + ox, py + oy) for px, py in pts], fill=0, width=int(0.5 * S))

im = im.resize((N, N), Image.LANCZOS)
im.save('assets/brand/ink-wear.png', optimize=True)
print('ink-wear.png, %.1f%% cracked' % (100 * sum(v < 128 for v in im.getdata()) / (N * N)))
