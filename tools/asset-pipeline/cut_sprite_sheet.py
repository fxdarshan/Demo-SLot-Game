#!/usr/bin/env python3
"""
Cut a sprite sheet (grid of frames on a flat background) into a transparent sheet with the same grid.

Each frame is cut on its own with cut_glow.cut (solid body plus translucent sparkles), then placed in a
fixed square cell, so the character keeps its position from frame to frame (jumps stay jumps).

    python3 tools/asset-pipeline/cut_sprite_sheet.py <sheet.png> <out.webp> [--cols 4] [--rows 3] [--cell 400]
        [--clear FRAME:x0,y0,x1,y1 ...]      transparent box inside one frame, in frame pixels (watermarks)
        [--idle <idle.png>]                   the symbol's idle image: prints how to size and place the sprite

Frame boxes are rounded, so a sheet that does not divide evenly (1792 / 3 rows) still lines up.
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(__file__))
from cut_glow import cut
from rembg import new_session

ap = argparse.ArgumentParser()
ap.add_argument('sheet'); ap.add_argument('out')
ap.add_argument('--cols', type=int, default=4); ap.add_argument('--rows', type=int, default=3)
ap.add_argument('--cell', type=int, default=400)
ap.add_argument('--clear', action='append', default=[])
ap.add_argument('--idle')
ap.add_argument('--png', help='also save the full-resolution cut-out sheet here')
a = ap.parse_args()

sheet = Image.open(a.sheet).convert('RGB')
W, H = sheet.size
fw, fh = W / a.cols, H / a.rows
clear = {}
for c in a.clear:
    f, box = c.split(':'); clear.setdefault(int(f), []).append([int(v) for v in box.split(',')])

session = new_session('isnet-general-use')
cells, bodies = [], []
for i in range(a.cols * a.rows):
    col, row = i % a.cols, i // a.cols
    x0, x1 = round(col * fw), round((col + 1) * fw); y0, y1 = round(row * fh), round((row + 1) * fh)
    img, solid = cut(sheet.crop((x0, y0, x1, y1)), session=session)
    arr = np.array(img)
    for (bx0, by0, bx1, by1) in clear.get(i, []):
        arr[by0:by1, bx0:bx1, 3] = 0; solid[by0:by1, bx0:bx1] = False
    img = Image.fromarray(arr, 'RGBA')
    cells.append(img); bodies.append(solid)
    print('frame', i, img.size, 'body px', int(solid.sum()))

# the body (largest solid blob) of frame 0 decides the sprite's size and anchor
lab, n = ndi.label(bodies[0]); big = 1 + int(np.argmax(ndi.sum(bodies[0], lab, range(1, n + 1))))
ys, xs = np.where(lab == big)
bx0, bx1, by0, by1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
print('frame 0 body box', bx0, by0, bx1, by1, 'of', cells[0].size)

CW = max(c.width for c in cells); CH = max(c.height for c in cells)
full = Image.new('RGBA', (CW * a.cols, CH * a.rows), (0, 0, 0, 0))
for i, im in enumerate(cells):
    full.alpha_composite(im, ((i % a.cols) * CW, (i // a.cols) * CH))
if a.png: full.save(a.png)
k = a.cell / CW
out = full.resize((round(CW * k) * a.cols, round(CH * k) * a.rows), Image.LANCZOS)
out.save(a.out, quality=90, method=6) if a.out.endswith('.webp') else out.save(a.out)
print('wrote', a.out, out.size, 'cell', round(CW * k), 'x', round(CH * k))

if a.idle:
    idle = Image.open(a.idle).convert('RGBA'); S = idle.width
    ib = idle.split()[3].point(lambda v: 255 if v > 12 else 0).getbbox()
    ih, icx, icy = ib[3] - ib[1], (ib[0] + ib[2]) / 2, (ib[1] + ib[3]) / 2
    # draw the cell at K x the symbol size so the sprite's body is as tall as the idle body
    K = (ih / S) * (CH / (by1 - by0))
    ox = (icx - S / 2) / S - ((bx0 + bx1) / 2 - CW / 2) / CW * K
    oy = (icy - S / 2) / S - ((by0 + by1) / 2 - CH / 2) / CH * K
    print(json.dumps({'scale': round(K, 4), 'ox': round(ox, 4), 'oy': round(oy, 4)}))
