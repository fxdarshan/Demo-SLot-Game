#!/usr/bin/env python3
"""
Turn full-size symbol cut-outs into the game's 300 x 300 symbol files.
Trims each cut-out to its visible pixels, fits it to a share of the canvas and centres it.

    python3 tools/asset-pipeline/place_symbols.py                 # defaults below
    python3 tools/asset-pipeline/place_symbols.py <cutouts> <out> [size]

Edit MAP to change which cut-out becomes which symbol, or how much of the canvas it fills.
"""
import os, sys
from PIL import Image, ImageFilter

CUT = sys.argv[1] if len(sys.argv) > 1 else 'assets/source/cutouts/symbols'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'assets/images/symbols'
S = int(sys.argv[3]) if len(sys.argv) > 3 else 300

# output file (see assets/manifest.js) : (cut-out file, share of the canvas)
MAP = {
    'sym_00_santa_idle.png':       ('sym_00_santa_cutout_1024.png', .92),
    'sym_01_mrs_claus_idle.png':   ('sym_01_mrs_claus_cutout_1024.png', .92),
    'sym_02_elf_idle.png':         ('sym_02_elf_cutout_1024.png', .92),
    'sym_03_nutcracker_idle.png':  ('sym_03_nutcracker_cutout_1024.png', .92),
    'sym_04_snowman_idle.png':     ('sym_04_snowman_cutout_1024.png', .92),
    'sym_05_gingerbread_idle.png': ('sym_05_gingerbread_cutout_1024.png', .92),
    'sym_06_gift_idle.png':        ('sym_06_gift_cutout_1024.png', .92),
    'sym_wild_idle.png':           ('sym_wild_star_globe_doll_cutout_1024.png', .94),
    'sym_bear_scare_small.png':    ('sym_bear_scare_grumpy_reindeer_cutout_1024.png', .74),
    'sym_bear_scare_med.png':      ('sym_bear_scare_grumpy_reindeer_cutout_1024.png', .86),
    'sym_bear_scare_large.png':    ('sym_bear_scare_grumpy_reindeer_cutout_1024.png', .98),
    'sym_bear_charm.png':          ('sym_bear_charm_elegant_reindeer_cutout_1024.png', .94),
    'sym_bear_dance.png':          ('sym_bear_dance_joyful_reindeer_cutout_1024.png', .94),
    'sym_ghost_idle.png':          ('sym_ghost_cutout_1024.png', .98),   # made with cut_glow.py --core 61
}

def fit(path, fill):
    im = Image.open(path).convert('RGBA')
    if 'ghost' in path:   # drop the faint floor haze left under the egg (alpha under 24 in the bottom fifth)
        a = im.split()[3]; px = a.load()
        for y in range(int(im.height * .8), im.height):
            for x in range(im.width):
                if px[x, y] < 24: px[x, y] = 0
        im.putalpha(a)
    im = im.crop(im.split()[3].point(lambda v: 255 if v > 12 else 0).getbbox())
    k = min(S * fill / im.width, S * fill / im.height)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    canvas = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    canvas.alpha_composite(im, ((S - im.width) // 2, (S - im.height) // 2))
    return canvas

os.makedirs(OUT, exist_ok=True)
for name, (src, fill) in MAP.items():
    fit(os.path.join(CUT, src), fill).save(os.path.join(OUT, name), optimize=True)
    print(name)

# star Wild: the Wild doll with a warm gold aura baked behind it
wild = fit(os.path.join(CUT, MAP['sym_wild_idle.png'][0]), .94)
aura = Image.new('RGBA', (S, S), (255, 205, 80, 0))
aura.putalpha(wild.split()[3].filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * .9)))
star = Image.new('RGBA', (S, S), (0, 0, 0, 0)); star.alpha_composite(aura); star.alpha_composite(wild)
star.save(os.path.join(OUT, 'sym_wild_star_idle.png'), optimize=True)
print('sym_wild_star_idle.png')
