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
| `symbols/sym_ghost_idle` | `assets/images/symbols/sym_ghost_idle.png` | Cut out with `cut_glow.py --core 61` (egg solid, wings, halo and sparkles as translucent light), trimmed, 300×300 at 98%, floor haze cleared |
| `symbols/sym_00_santa_win_sheet` | `assets/images/symbols/sym_00_santa_win_sheet.webp` | Each of the 16 frames (4 × 4, from `sym_00_santa_win_sheet_16_original.png`) cut with `cut_sprite_sheet.py` (solid body plus translucent sparkles), the corner watermark in frame 15 removed with `--clear-gray`, frames kept in fixed cells and scaled to 400 px, WebP quality 90, then `normalize_sprite_sheet.py --air 5-9,11` (pins every frame to the round bottom; it replaced `align_sprite_sheet.py`). The earlier 12-frame sheet (`sym_00_santa_win_sheet_original.png`) is kept for reference |
| `symbols/sym_01_mrs_claus_win_sheet` | `assets/images/symbols/sym_01_mrs_claus_win_sheet.webp` | 16 frames (4 × 4, `sym_01_mrs_claus_win_sheet_original.png`) on solid #FF00FF, keyed with `cut_sprite_sheet.py --chroma` (rembg mistakes magenta for light and shifts the colours), the corner watermark removed with `--dewatermark`, scaled to 400 px cells, then `normalize_sprite_sheet.py` |
| `symbols/sym_02_elf_win_sheet` | `assets/images/symbols/sym_02_elf_win_sheet.webp` | 16 frames (4 × 4, `sym_02_elf_win_sheet_original.png`) on solid magenta, `cut_sprite_sheet.py --chroma --dewatermark`, 400 px cells, then `normalize_sprite_sheet.py` |
| `symbols/sym_03_nutcracker_win_sheet` | `assets/images/symbols/sym_03_nutcracker_win_sheet.webp` | 16 frames (4 × 4, `sym_03_nutcracker_win_sheet_original.png`) on solid magenta, `cut_sprite_sheet.py --chroma --dewatermark`, 400 px cells, then `normalize_sprite_sheet.py` |
| `symbols/sym_04_snowman_win_sheet` | `assets/images/symbols/sym_04_snowman_win_sheet.webp` | 16 frames (4 × 4, `sym_04_snowman_win_sheet_original.png`) on solid magenta, `cut_sprite_sheet.py --chroma --dewatermark`, 400 px cells, then `normalize_sprite_sheet.py` |
| `symbols/sym_05_gingerbread_win_sheet` | `assets/images/symbols/sym_05_gingerbread_win_sheet.webp` | 16 frames (4 × 4, `sym_05_gingerbread_win_sheet_original.png`) on solid magenta, `cut_sprite_sheet.py --chroma --dewatermark`, 400 px cells, then `normalize_sprite_sheet.py` |
| `ui/ui_splash_logo` | `assets/images/ui/ui_splash_logo.webp` | Cut out with `cut_glow.py` (sparkle trail kept), trimmed, WebP quality 92 |
| `ui/splash_loading_screen_reference.*` and `splash_design_system.md` | not loaded | The supplied loading screen design (screenshot, HTML and design tokens). `src/splash.js` and the `.splash` rules in `css/style.css` recreate it |
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
python3 tools/asset-pipeline/cut_glow.py assets/source/originals/symbols/sym_ghost_idle_original.png assets/source/cutouts/symbols/sym_ghost_cutout_1024.png --core 61
python3 tools/asset-pipeline/cut_glow.py assets/source/originals/ui/ui_splash_logo_original.png assets/source/cutouts/ui/ui_splash_logo_cutout.png
python3 tools/asset-pipeline/cut_sprite_sheet.py assets/source/originals/symbols/sym_00_santa_win_sheet_16_original.png assets/images/symbols/sym_00_santa_win_sheet.webp --cols 4 --rows 4 --png assets/source/cutouts/symbols/sym_00_santa_win_sheet_16_cutout.png --clear-gray 15:340,340,465,465 --idle assets/images/symbols/sym_00_santa_idle.png   # prints scale/ox/oy for the manifest
python3 tools/asset-pipeline/cut_sprite_sheet.py assets/source/originals/symbols/sym_01_mrs_claus_win_sheet_original.png assets/images/symbols/sym_01_mrs_claus_win_sheet.webp --cols 4 --rows 4 --chroma --dewatermark --png assets/source/cutouts/symbols/sym_01_mrs_claus_win_sheet_cutout.png --idle assets/images/symbols/sym_01_mrs_claus_idle.png
python3 tools/asset-pipeline/normalize_sprite_sheet.py assets/images/symbols/sym_01_mrs_claus_win_sheet.webp --idle assets/images/symbols/sym_01_mrs_claus_idle.png   # prints scale/ox/oy
# the same two commands, with the sym_02 elf, sym_03 nutcracker, sym_04 snowman and sym_05 gingerbread names, make their sheets
python3 tools/asset-pipeline/place_symbols.py      # cut-outs -> assets/images/symbols at 300x300
```

Known losses from the background removal:
- The frost-breath swirl next to the grumpy reindeer was removed with the background.
- Some soft glows at banner edges were trimmed.

If you have layered or transparent masters, drop them into `assets/images/` directly instead.
