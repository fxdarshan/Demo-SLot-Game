#!/usr/bin/env python3
"""
Remove the background from every PNG in a folder (rembg, ISNet model).

    pip install "rembg[cpu]"
    python3 tools/asset-pipeline/cut_backgrounds.py assets/source/originals/symbols assets/source/cutouts/symbols

The ISNet model (about 180 MB) downloads on first use. BiRefNet gives slightly
better edges but needs more than 7 GB of memory.
"""
import os, sys
from rembg import remove, new_session
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
session = new_session('isnet-general-use')
for f in sorted(os.listdir(src)):
    if not f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        continue
    im = Image.open(os.path.join(src, f)).convert('RGB')
    name = os.path.splitext(f)[0] + '_cutout.png'
    remove(im, session=session, post_process_mask=True).save(os.path.join(out, name))
    print('cut', f, '->', name)
