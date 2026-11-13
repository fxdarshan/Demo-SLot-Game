#!/usr/bin/env python3
"""
Cut a subject that has glow (wings, halo, sparkles) off a flat or softly shaded background.

rembg alone drops soft light, so this keeps two layers:
  1. the solid subject (rembg ISNet mask, thin parts opened away when --core is given)
  2. everything outside it that is brighter than the background, kept as soft translucent light.
     The background is fitted as a smooth surface from the image border, then each pixel is
     un-mixed:  pixel = bg*(1-a) + light*a

    python3 tools/asset-pipeline/cut_glow.py <in.png> <out.png> [--core PX] [--gain G]

  --core PX  open the subject mask by PX pixels first, so wings and halos are treated as glow
             (use for the ghost; leave off for the logo)
  --gain G   multiply glow alpha (default 1.0)
"""
import sys, argparse
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
from scipy import ndimage as ndi

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--core', type=int, default=0)
ap.add_argument('--gain', type=float, default=1.0)
a = ap.parse_args()

im = Image.open(a.src).convert('RGB')
rgb = np.asarray(im).astype(np.float32)
H, W, _ = rgb.shape

# 1. subject mask
m = np.asarray(remove(im, session=new_session('isnet-general-use'), only_mask=True, post_process_mask=True)).astype(np.float32) / 255
solid = m > .5
if a.core:
    k = a.core | 1
    solid = ndi.binary_opening(solid, structure=np.ones((k, k)))
lab, n = ndi.label(solid)
if n:
    sizes = ndi.sum(solid, lab, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s > 0.002 * H * W]
    solid = np.isin(lab, keep)
solid = ndi.binary_fill_holes(solid)
core = ndi.gaussian_filter(solid.astype(np.float32), 1.2)

# 2. background surface: quadratic fit to a border ring, per channel
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); xx /= W; yy /= H
ring = np.zeros((H, W), bool); b = 18
ring[:b] = ring[-b:] = True; ring[:, :b] = ring[:, -b:] = True
ring &= ~ndi.binary_dilation(solid, iterations=6)
def basis(x, y): return np.stack([np.ones_like(x), x, y, x * y, x * x, y * y], -1)
A = basis(xx[ring], yy[ring]); full = basis(xx, yy)
bg = np.stack([full @ np.linalg.lstsq(A, rgb[..., c][ring], rcond=None)[0] for c in range(3)], -1)

# 3. glow outside the subject: smallest alpha that explains the extra light
diff = rgb - bg
room = np.maximum(255 - bg, 1)
alpha = np.clip(np.max(np.clip(diff, 0, None) / room, -1) * a.gain, 0, 1)
alpha = np.where(alpha < .025, 0, alpha)
alpha = ndi.gaussian_filter(alpha, .6)
light = np.clip((rgb - bg * (1 - alpha[..., None])) / np.maximum(alpha[..., None], 1e-3), 0, 255)

# 4. combine: solid subject keeps its own pixels, glow fills the rest
out_a = core + (1 - core) * alpha
out_rgb = (rgb * core[..., None] + light * ((1 - core) * alpha)[..., None]) / np.maximum(out_a[..., None], 1e-3)
res = np.dstack([np.clip(out_rgb, 0, 255), np.clip(out_a * 255, 0, 255)]).astype(np.uint8)
Image.fromarray(res, 'RGBA').save(a.out)
print(a.out, res.shape)
