#!/usr/bin/env python3
"""Pin every frame of a win sprite sheet to the symbol's round bottom.

Generated sheets drift: the character grows or shrinks a few percent between frames, sits higher or lower, and creeps
sideways, so the animation jerks and pops when it returns to the idle art. Each frame is measured at its round bottom
(lowest 12 % of the solid body: centre x, bottom y) and its size (median of belly width, height and root of area),
then scaled about that point and moved so that
  * grounded frames share the same belly width as frame 0, the same bottom centre x and the same ground line, and
  * airborne frames (--air, default 5-9, e.g. '5-9,11': the jump and the turn) get the correction interpolated between the last
    grounded frame before and the first one after, so a jump stays a jump but never drifts.

    python3 tools/asset-pipeline/normalize_sprite_sheet.py <sheet.webp> [--cols 4] [--rows 4] [--air 5-9]
        [--centre 200] [--quality 90]
Prints the per-frame measurements before and after, and the manifest scale/ox/oy for --idle <idle.png>.
"""
import argparse, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ap = argparse.ArgumentParser()
ap.add_argument('sheet'); ap.add_argument('--cols', type=int, default=4); ap.add_argument('--rows', type=int, default=4)
ap.add_argument('--air', default='5-9'); ap.add_argument('--centre', type=float, default=None)
ap.add_argument('--quality', type=int, default=90); ap.add_argument('--idle')
a = ap.parse_args()
air = set()
for part in a.air.split(','):
    x, _, y = part.partition('-'); air.update(range(int(x), int(y or x) + 1))

im = Image.open(a.sheet).convert('RGBA')
cw, ch = im.width // a.cols, im.height // a.rows
n = a.cols * a.rows
cells = [im.crop(((i % a.cols) * cw, (i // a.cols) * ch, (i % a.cols + 1) * cw, (i // a.cols + 1) * ch)) for i in range(n)]

def measure(cell):
    al = np.array(cell)[..., 3]
    m = ndi.binary_opening(al > 230, iterations=2); lab, k = ndi.label(m)
    big = 1 + int(np.argmax(ndi.sum(m, lab, range(1, k + 1)))); b = lab == big
    ys, xs = np.nonzero(b); bot = ys.max(); h = bot - ys.min()
    xb = xs[ys > bot - .12 * h].mean()
    rows = b[max(0, bot - 100):bot + 1]; wb = rows.sum(1).max()
    return bot, xb, wb, ys.min(), xs.min(), xs.max(), h, int(b.sum())

M = [measure(c) for c in cells]
grounded = [i for i in range(n) if i not in air]
first = min(air)
G = float(np.median([M[i][0] for i in range(0, first)]))        # the ground line: frames before the jump
X = a.centre if a.centre is not None else float(np.median([M[i][1] for i in range(0, first)]))
W0 = M[0][2]
# per-frame correction: scale s, dx, dy (grounded frames: exact; airborne: interpolated)
corr = {}
for i in grounded:
    bot, xb, wb, top, x0, x1, h, area = M[i]
    # size: the median of three ratios (belly width, body height, root of body area), so a pose that fools one
    # measure (spread feet, a raised arm, a tilted hat) does not rescale the frame
    sc = float(np.median([W0 / wb, M[0][6] / h, (M[0][7] / area) ** .5]))
    corr[i] = (sc, X - xb, G - bot)
for i in sorted(air):
    i0, i1 = max(j for j in grounded if j < i), min(j for j in grounded if j > i)
    t = (i - i0) / (i1 - i0)
    corr[i] = tuple(corr[i0][k] * (1 - t) + corr[i1][k] * t for k in range(3))

for i in sorted(air):                                             # a jump frame never sinks below the ground line
    s_, dx_, dy_ = corr[i]; corr[i] = (s_, dx_, min(dy_, G - 2 - M[i][0]))

out = Image.new('RGBA', im.size, (0, 0, 0, 0))
for i, c in enumerate(cells):
    s, dx, dy = corr[i]; bot, xb, *_ = M[i]
    pm = c.convert('RGBa')
    sc = pm.resize((round(cw * s), round(ch * s)), Image.LANCZOS)
    # scaled about the bottom centre (xb, bot), then moved by (dx, dy)
    ox = round(xb - xb * s + dx); oy = round(bot - bot * s + dy)
    canvas = Image.new('RGBa', (cw, ch), (0, 0, 0, 0)); canvas.paste(sc, (ox, oy))
    out.paste(canvas.convert('RGBA'), ((i % a.cols) * cw, (i // a.cols) * ch))
out.save(a.sheet, quality=a.quality, method=6)

M2 = [measure(out.crop(((i % a.cols) * cw, (i // a.cols) * ch, (i % a.cols + 1) * cw, (i // a.cols + 1) * ch))) for i in range(n)]
print('frame: bottom y, bottom x, belly width   before -> after')
for i in range(n):
    print(f' {i:2d}{" (air)" if i in air else "      "}: {M[i][0]:3d},{M[i][1]:4.0f},{M[i][2]:3d}  ->  {M2[i][0]:3d},{M2[i][1]:4.0f},{M2[i][2]:3d}')
if a.idle:
    idle = Image.open(a.idle).convert('RGBA'); S = idle.width
    ib = idle.split()[3].point(lambda v: 255 if v > 12 else 0).getbbox()
    ih, icx, icy = ib[3] - ib[1], (ib[0] + ib[2]) / 2, (ib[1] + ib[3]) / 2
    bot, xb, wb, top, x0, x1, *_ = M2[0]
    K = (ih / S) * (ch / (bot + 1 - top))
    ox = (icx - S / 2) / S - (((x0 + x1 + 1) / 2) - cw / 2) / cw * K
    oy = (icy - S / 2) / S - (((top + bot + 1) / 2) - ch / 2) / ch * K
    print(json.dumps({'scale': round(K, 4), 'ox': round(ox, 4), 'oy': round(oy, 4)}))
