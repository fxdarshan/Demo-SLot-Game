#!/usr/bin/env python3
"""Remove the sideways drift of a generated sprite sheet.

AI-generated sheets rarely have evenly spaced cells, so the character creeps to one side
across each row and snaps back at the start of the next (a visible jerk when played).
This measures the horizontal centre of the solid body in every frame, takes the average per
column, and shifts each column by the same amount so the columns line up. Real pose changes
inside a column (arms, jumps) are left alone. Run it on the finished cut-out sheet.

    python3 tools/asset-pipeline/align_sprite_sheet.py <sheet.webp> [--cols 4] [--rows 4] [--quality 90]
"""
import argparse
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('sheet'); ap.add_argument('--cols', type=int, default=4); ap.add_argument('--rows', type=int, default=4)
ap.add_argument('--quality', type=int, default=90)
a = ap.parse_args()

im = Image.open(a.sheet).convert('RGBA')
cw, ch = im.width // a.cols, im.height // a.rows
arr = np.array(im)
cx = np.zeros((a.rows, a.cols))
for r in range(a.rows):
    for c in range(a.cols):
        m = arr[r*ch:(r+1)*ch, c*cw:(c+1)*cw, 3] > 200
        cx[r, c] = np.nonzero(m)[1].mean()
colmean = cx.mean(0); target = colmean.mean()
shift = np.round(target - colmean).astype(int)
print('column centres', colmean.round(1), '-> shifts', shift)
out = np.zeros_like(arr)
for r in range(a.rows):
    for c in range(a.cols):
        cell = arr[r*ch:(r+1)*ch, c*cw:(c+1)*cw]
        xs = np.nonzero(cell[:, :, 3] > 10)[1]
        assert xs.min() + shift[c] >= 0 and xs.max() + shift[c] < cw, f'frame {r*a.cols+c} would be clipped'
        out[r*ch:(r+1)*ch, c*cw:(c+1)*cw] = np.roll(cell, shift[c], axis=1)
Image.fromarray(out).save(a.sheet, quality=a.quality, method=6)
print('wrote', a.sheet)
