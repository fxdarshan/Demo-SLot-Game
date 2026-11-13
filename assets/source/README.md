# Source art

These are the master files behind the game assets. The game never loads anything from this folder; it uses the processed files in `assets/images/`, listed in `assets/manifest.js`.

| Folder | Contents |
| :--- | :--- |
| `originals/` | Your files exactly as supplied (grey or black backgrounds), renamed by the asset ID they became |
| `cutouts/` | Full-resolution versions with the background removed (rembg, ISNet model). Use these to re-export at any size |

## What each file became

| Original | Game asset | Processing |
| :--- | :--- | :--- |
| `symbols/sym_00_santa` … `sym_06_gift` | `assets/images/symbols/sym_00_*_idle.png` … `sym_06_*_idle.png` | Background removed, trimmed, centred on 300×300 at 92% |
| `symbols/sym_wild_star_globe_doll` | `sym_wild_idle.png`, `sym_wild_star_idle.png` | As above at 94%; the star version gets a baked gold aura |
| `symbols/sym_bear_scare_grumpy_reindeer` | `sym_bear_scare_small/med/large.png` | Same art at 74%, 86% and 98% of the canvas (the bear's size shows 1, 2 or 3 upgrades) |
| `symbols/sym_bear_charm_elegant_reindeer` | `sym_bear_charm.png` | 94% |
| `symbols/sym_bear_dance_joyful_reindeer` | `sym_bear_dance.png` | 94% |
| `environment/bg_base_main_aurora_cabins` | `assets/images/environment/bg_base_main.jpg` | 1376×768, cropped to 16:9, scaled to 1920×1080, JPG quality 90 |
| `environment/bg_freegame_main_living_room` | `assets/images/environment/bg_freegame_main.jpg` | As above |
| `banners/banner_win_*` | `assets/images/banners/banner_win_*.webp` | Background removed, trimmed, WebP quality 88 |
| `banners/modal_freespins_intro_festive_win` | `modal_freespins_intro.webp` | As above |
| `banners/modal_freespins_outro_total_win` | `modal_freespins_outro.webp` | As above. The baked "2,750,000 COINS / JACKPOT BONUS!" text was painted out by extending the wood planks from either side (`cutouts/…_text_removed.png`) |
| `fx/vfx_anticipation_reel3_golden_spiral` | `assets/images/fx/vfx_anticipation_reel3.webp` | Black converted to transparency (alpha from brightness), trimmed, WebP |

## Redo the processing

```bash
pip install "rembg[cpu]"
python3 tools/asset-pipeline/cut_backgrounds.py assets/source/originals/symbols assets/source/cutouts/symbols
python3 tools/asset-pipeline/place_symbols.py      # cut-outs -> assets/images/symbols at 300x300
```

Known losses from the background removal:
- The frost-breath swirl next to the grumpy reindeer was removed with the background.
- Some soft glows at banner edges were trimmed.

If you have layered or transparent masters, drop them into `assets/images/` directly instead.
