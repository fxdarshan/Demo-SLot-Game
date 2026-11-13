# Asset handoff guide

Drop finished artwork and audio into this folder at the paths below, then reload the game. Each file replaces its code-drawn placeholder straight away. Anything still missing keeps its placeholder, so assets can arrive one at a time. The demo panel's **Assets** section lists what is still a placeholder.

The full list of IDs and descriptions is in [`docs/game-asset-specification.md`](../docs/game-asset-specification.md). The paths are defined in [`manifest.js`](manifest.js); change a path there if your file name differs.

## Rules for all images
- PNG with transparency (JPG or WebP are fine for full backgrounds).
- **Symbols:** every symbol on the same 300×300 canvas, centred, with the same padding, so they line up on the reels.
- **Doll seam:** the upgrade animation splits each doll horizontally at `symbolSplitY` (0.47 of the height) into a lid and a base. Paint the doll's opening seam near that line, or change the value in `manifest.js`.
- **Frames** (`bg_base_frame`, `bg_freegame_frame`) are full 1920×1080 overlays, transparent where the reels show. The reel area is 5 × 3 cells of about 243 px, centred horizontally, starting about 155 px from the top.
- **Modals and banners** are background or title art only. The game draws the text, amounts and START / COLLECT buttons on top.

## Images

**Delivered so far:** the holiday symbol set (13 November 2026). It covers 7 standard symbols, the Wild in both states, and the 5 bears, cut out from their grey studio backgrounds and centred at 300×300. Everything else is still a placeholder.

| Asset ID | Path | Size | Delivered |
| :--- | :--- | :--- | :---: |
| `bg_base_main` | `assets/images/environment/bg_base_main.png` | 1920×1080 | [ ] |
| `bg_base_frame` | `assets/images/environment/bg_base_frame.png` | 1920×1080 PNG, clear centre | [ ] |
| `bg_base_reel_strip` | `assets/images/environment/bg_base_reel_strip.png` | ≈270×810 PNG | [ ] |
| `bg_freegame_main` | `assets/images/environment/bg_freegame_main.png` | 1920×1080 | [ ] |
| `bg_freegame_frame` | `assets/images/environment/bg_freegame_frame.png` | 1920×1080 PNG, clear centre | [ ] |
| `fx_reel3_guaranteed_wild_indicator` | `assets/images/fx/fx_reel3_guaranteed_wild_indicator.png` | one reel column, PNG | [ ] |
| `ui_bar_bottom` | `assets/images/ui/ui_bar_bottom.png` | 1920×110 PNG | [ ] |
| `btn_spin_idle` | `assets/images/ui/btn_spin_idle.png` | ≈160×160 PNG | [ ] |
| `btn_spin_active` | `assets/images/ui/btn_spin_active.png` | ≈160×160 PNG | [ ] |
| `btn_spin_disabled` | `assets/images/ui/btn_spin_disabled.png` | ≈160×160 PNG | [ ] |
| `btn_auto_idle` | `assets/images/ui/btn_auto_idle.png` | ≈80×80 PNG | [ ] |
| `btn_auto_active` | `assets/images/ui/btn_auto_active.png` | ≈80×80 PNG | [ ] |
| `btn_bet_plus` | `assets/images/ui/btn_bet_plus.png` | ≈80×80 PNG | [ ] |
| `btn_bet_minus` | `assets/images/ui/btn_bet_minus.png` | ≈80×80 PNG | [ ] |
| `btn_info` | `assets/images/ui/btn_info.png` | ≈80×80 PNG | [ ] |
| `ui_freegame_counter` | `assets/images/ui/ui_freegame_counter.png` | ≈440×64 PNG | [ ] |
| `sym_00_idle` | `assets/images/symbols/sym_00_santa_idle.png` | 300×300 PNG | [x] |
| `sym_01_idle` | `assets/images/symbols/sym_01_mrs_claus_idle.png` | 300×300 PNG | [x] |
| `sym_02_idle` | `assets/images/symbols/sym_02_elf_idle.png` | 300×300 PNG | [x] |
| `sym_03_idle` | `assets/images/symbols/sym_03_nutcracker_idle.png` | 300×300 PNG | [x] |
| `sym_04_idle` | `assets/images/symbols/sym_04_snowman_idle.png` | 300×300 PNG | [x] |
| `sym_05_idle` | `assets/images/symbols/sym_05_gingerbread_idle.png` | 300×300 PNG | [x] |
| `sym_06_idle` | `assets/images/symbols/sym_06_gift_idle.png` | 300×300 PNG | [x] |
| `sym_wild_idle` | `assets/images/symbols/sym_wild_idle.png` | 300×300 PNG | [x] |
| `sym_wild_star_idle` | `assets/images/symbols/sym_wild_star_idle.png` | 300×300 PNG | [x] |
| `sym_bear_scare_small` | `assets/images/symbols/sym_bear_scare_small.png` | 300×300 PNG | [x] |
| `sym_bear_scare_med` | `assets/images/symbols/sym_bear_scare_med.png` | 300×300 PNG | [x] |
| `sym_bear_scare_large` | `assets/images/symbols/sym_bear_scare_large.png` | 300×300 PNG | [x] |
| `sym_bear_charm` | `assets/images/symbols/sym_bear_charm.png` | 300×300 PNG | [x] |
| `sym_bear_dance` | `assets/images/symbols/sym_bear_dance.png` | 300×300 PNG | [x] |
| `sym_ghost_idle` | `assets/images/symbols/sym_ghost_idle.png` | 300×300 PNG | [ ] |
| `modal_freespins_intro` | `assets/images/banners/modal_freespins_intro.png` | ≈1100×620 PNG | [ ] |
| `modal_freespins_outro` | `assets/images/banners/modal_freespins_outro.png` | ≈1100×620 PNG | [ ] |
| `banner_win_nice` | `assets/images/banners/banner_win_nice.png` | ≈1200×360 PNG | [ ] |
| `banner_win_big` | `assets/images/banners/banner_win_big.png` | ≈1200×360 PNG | [ ] |
| `banner_win_mega` | `assets/images/banners/banner_win_mega.png` | ≈1200×360 PNG | [ ] |
| `banner_win_superb` | `assets/images/banners/banner_win_superb.png` | ≈1200×360 PNG | [ ] |
| `banner_win_sensational` | `assets/images/banners/banner_win_sensational.png` | ≈1200×360 PNG | [ ] |
| `banner_win_epic` | `assets/images/banners/banner_win_epic.png` | ≈1200×360 PNG | [ ] |
| `line_node_highlight` | `assets/images/fx/line_node_highlight.png` | 300×300 PNG | [ ] |

Optional extra, not in the spec: `sym_00_scared` … `sym_06_scared`, frightened faces shown while the Scare Bear targets a doll. To use them, add these keys to `manifest.js`.

## Audio

MP3 or WAV. Audio files only load when the game is served over http (`python3 -m http.server 8000`). Missing sound effects use synthesised placeholders. Background music plays only from real files.

| Asset ID | Path | Delivered |
| :--- | :--- | :---: |
| `bgm_basegame_loop` | `assets/audio/bgm_basegame_loop.mp3` | [ ] |
| `bgm_freegame_loop` | `assets/audio/bgm_freegame_loop.mp3` | [ ] |
| `sfx_spin_button_click` | `assets/audio/sfx_spin_button_click.mp3` | [ ] |
| `sfx_reel_spin` | `assets/audio/sfx_reel_spin.mp3` | [ ] |
| `sfx_reel_stop_01` | `assets/audio/sfx_reel_stop_01.mp3` | [ ] |
| `sfx_reel_stop_02` | `assets/audio/sfx_reel_stop_02.mp3` | [ ] |
| `sfx_reel_stop_03` | `assets/audio/sfx_reel_stop_03.mp3` | [ ] |
| `sfx_reel_stop_04` | `assets/audio/sfx_reel_stop_04.mp3` | [ ] |
| `sfx_reel_stop_05` | `assets/audio/sfx_reel_stop_05.mp3` | [ ] |
| `sfx_anticipation_reel3` | `assets/audio/sfx_anticipation_reel3.mp3` | [ ] |
| `sfx_symbol_win_line` | `assets/audio/sfx_symbol_win_line.mp3` | [ ] |
| `sfx_symbol_upgrade` | `assets/audio/sfx_symbol_upgrade.mp3` | [ ] |
| `sfx_scare_bear_roar` | `assets/audio/sfx_scare_bear_roar.mp3` | [ ] |
| `sfx_charm_bear_magic` | `assets/audio/sfx_charm_bear_magic.mp3` | [ ] |
| `sfx_dance_bear_jig` | `assets/audio/sfx_dance_bear_jig.mp3` | [ ] |
| `sfx_wipe_win_fanfare` | `assets/audio/sfx_wipe_win_fanfare.mp3` | [ ] |
| `sfx_ghost_jackpot` | `assets/audio/sfx_ghost_jackpot.mp3` | [ ] |
| `sfx_countup_loop` | `assets/audio/sfx_countup_loop.mp3` | [ ] |
| `sfx_countup_end` | `assets/audio/sfx_countup_end.mp3` | [ ] |


## Spine animations
The spec's skeletal animations (`sym_xx_win`, `sym_xx_upgrade`, `bear_scare_1x/2x/3x`, `bear_charm`, `bear_dance`) can't be loaded yet; the game currently animates the still images in code, timed to the animation spec. Keep the Spine exports to hand. When the runtime is added, each one plugs into a single function in `src/game.js` (see the README's "Next steps").
