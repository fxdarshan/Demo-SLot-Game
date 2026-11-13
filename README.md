# Nesting Dolls: slot prototype

A playable HTML5 prototype of a 5×3, 17-line nesting-doll slot. It's built so the final art, animation and audio can replace the placeholders file by file.

| Spec | Drives |
| --- | --- |
| [`docs/official-game-rules.md`](docs/official-game-rules.md) | Mechanics |
| [`docs/pay-table.md`](docs/pay-table.md) | Pay table, paylines, special win |
| [`docs/animation-specifications.md`](docs/animation-specifications.md) | Every animation duration and keyframe phase (30 fps) |
| [`docs/game-asset-specification.md`](docs/game-asset-specification.md) | Asset IDs, file names, win banner tiers, audio list |
| [`docs/reference-gdd.md`](docs/reference-gdd.md) | GDD v2.0: the whole design in one place, aligned with the specs above; max win, bet range |

Other docs:
- [`assets/README.md`](assets/README.md): artwork and audio handoff checklist (every file name, path and size)
- [`CHANGELOG.md`](CHANGELOG.md): what changed in each update
- Each spec in `docs/` ends with a **Prototype implementation status** section showing what is built and where

Slot Demo Studio, a separate general-purpose demo recorder, is in [`studio/`](studio/index.html).

## Run it

You don't need to build anything. Serve the folder over http so sounds can load:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
# or: npx serve .
```

Opening `index.html` directly also works. In that mode only the synthesised placeholder sounds play.

**Controls:**
- Spin button or **Space**: spin.
- **i**: paytable and rules.
- **− / +**: bet.
- **AUTO**: autoplay.
- Click during a banner: skip ahead.
- **D**: hide or show the demo panel so the game fills the window for capture.

## Mechanics (official rules)

| Feature | Rule |
| --- | --- |
| Grid and lines | 5×3, 17 fixed paylines (official shapes), left to right, no gaps. Only the highest win per payline is paid |
| Symbols | `sym_00` Yellow (highest) … `sym_06` Teal (lowest). Pays are the pay table's € values divided by its €7.50 bet |
| Win symbol upgrade | Winning symbols of one value upgrade to the next value, only if that creates new or longer paylines. Repeats until nothing qualifies |
| Wild | Reel 3 only, substitutes for all symbols. Landing with a **star**, it opens to a Mystery Bear |
| Scare Bear | The lowest symbols upgrade 1, 2 or 3 times (small, medium or large bear) |
| Charm Bear | All symbols upgrade once |
| Dance Bear | 7 free spins with a guaranteed Wild on reel 3 every spin |
| Wipe | 15 identical symbols upgrade once more |
| Special award | A wipe of 15 Yellows turns them into Ghosts and pays 100× bet (€750 at €7.50). Shown with the EPIC banner |
| Max win | 390× bet per round (GDD) |

## Presentation (animation spec, 30 fps)

All frame counts are in `CONFIG.frames` in `src/config.js`. The presentation speed slider in the demo panel scales them all together.

| Spec ID | Frames | What you see |
| --- | --- | --- |
| `bg_base_loop` | 120 | Background ornaments breathe (scale 1 → 1.02, opacity 0.85 → 1) |
| `bg_freegame_loop` | 90 | Red/gold party lights cycle every 30f, gold sparkles fall, reel 3 outline pulses (45f sine) |
| `sym_xx_win` / `sym_xx_upgrade` | 10 + 20 + 15 | Scale to 1.15. Then the doll opens (lid lifts, glow, particle burst) and morphs into the next tier, or settles back to 1.0 |
| `sym_wild_star_open` | 15 + 20 + 10 | Land squash (scaleY 0.85 → 1), star flash and top shell flies off, bear emerges |
| `vfx_anticipation_reel3` | 15 + 30 + 15 | Gold aura ramps up, electric sparks, slam stop with flash. Plays when the Wild will open (`anticipateOn`) |
| `bear_scare_1x/2x/3x` | 45 / 67 / 90 | One 22.5f roar shockwave per upgrade. The lowest dolls get scared, then morph |
| `bear_charm` | 20 + 25 + 15 | Kiss hearts, hearts sweep to all 15 positions, everything upgrades with a shimmer |
| `bear_dance` | 45 + 30 | Accordion riff with music notes, then hand-over to the free spins banner |
| `vfx_wipe_win_sweep` | 30 + 30 + 30 | Gold frame locks the grid, gold flash sweeps across as symbols morph, green light turns Yellows into Ghosts with the win burst |
| `banner_fg_trigger` | 30 + 90 + 30 | 70% dimmer, elastic scale-in, "CONGRATULATIONS! YOU WON 7 FREE SPINS!", pulse, START |
| `trans_base_to_freegame` | 15 + 45 + 15 | Accordion curtain wipe; the free game scene is swapped in behind it |
| `banner_fg_summary` | 30 + 90 + 30 | Drops in from the top, 75f count-up, "TOTAL WIN … IN 7 FREE SPINS", COLLECT, shrinks out |
| `trans_freegame_to_base` | 60 | Camera zoom-out and background dissolve |
| `banner_win_*` | 30 + 90 + 30 | 75% dimmer, title slams in (0 → 1.2 → 1.0), tally over frames 30–105, amount snaps to the HUD, zooms out |

**Win banners** follow the asset spec's six tiers:

| Banner | Win |
| --- | --- |
| NICE | 15× |
| BIG | 25× |
| MEGA | 50× |
| SUPERB | 100× |
| SENSATIONAL | 250× |
| EPIC | 500×, or the Ghost special award |

Each tier has its own FX: coin fountain, coin drop, double cascade, fireworks with confetti cannons, lasers, or full-screen fireworks with coin rain.

**Paylines:** `line_overlay_01..17` are drawn as coloured paths through the winning cells, with `line_node_highlight` rings around each winning symbol.

## Replace the art and sound

Every asset key in [`assets/manifest.js`](assets/manifest.js) is the asset spec's ID. [`assets/README.md`](assets/README.md) is the artists' checklist. To swap one:
1. Save your file at the listed path, or point the path at your file.
2. Reload.

Missing files keep their placeholder. The demo panel's **Assets** section lists the files that still use placeholders.

| Folder | Asset IDs | Size |
| --- | --- | --- |
| `assets/images/environment/` | `bg_base_main`, `bg_base_frame`, `bg_base_reel_strip`, `bg_freegame_main`, `bg_freegame_frame` | 1920×1080 (frames are overlays with a clear centre) |
| `assets/images/symbols/` | `sym_00_idle` … `sym_06_idle`, `sym_wild_idle`, `sym_wild_star_idle`, `sym_bear_scare_small/med/large`, `sym_bear_charm`, `sym_bear_dance`, `sym_ghost_idle` | 300×300 PNG, same framing for all |
| `assets/images/ui/` | `ui_bar_bottom`, `btn_spin_idle/active/disabled`, `btn_auto_idle/active`, `btn_bet_plus/minus`, `btn_info`, `ui_freegame_counter` | see manifest |
| `assets/images/banners/` | `modal_freespins_intro/outro`, `banner_win_nice/big/mega/superb/sensational/epic` | panel and title art; text and amounts are drawn on top |
| `assets/images/fx/` | `fx_reel3_guaranteed_wild_indicator`, `line_node_highlight` | see manifest |
| `assets/audio/` | `bgm_basegame_loop`, `bgm_freegame_loop`, `sfx_spin_button_click`, `sfx_reel_spin`, `sfx_reel_stop_01..05`, `sfx_anticipation_reel3`, `sfx_symbol_win_line`, `sfx_symbol_upgrade`, `sfx_scare_bear_roar`, `sfx_charm_bear_magic`, `sfx_dance_bear_jig`, `sfx_wipe_win_fanfare`, `sfx_ghost_jackpot`, `sfx_countup_loop`, `sfx_countup_end` | MP3 or WAV |

Tips:
- The upgrade animation splits each doll image at `symbolSplitY` (0.47 of the height) into a lid and a base. Put your doll's seam near that line, or change the value in the manifest.
- Placeholder dolls carry small `sym_0x` tags. They disappear once real symbols are in, or set `showLevelBadges: false`.
- Music only plays from real files.

## Project layout

```
index.html            page + demo panel
css/style.css         panel styling
assets/manifest.js    every asset path, keyed by spec asset ID  ← edit this to swap assets
assets/images/…       artwork, by spec category
assets/audio/…        sound
src/config.js         maths, frame timings (30 fps), banner tiers, presentation switches
src/engine.js         pure maths: paylines, conditional upgrades, bears, wipe and special win
src/director.js       builds scripted outcomes for demos
src/game.js           reels, step animations, banners, modals, transitions, HUD, paytable
src/placeholders.js   code-drawn placeholder art
src/assets.js         loads manifest files, falls back to placeholders
src/audio.js          file sounds or synthesised placeholders, routed into recordings
src/devpanel.js       demo controls (not part of the game)
tools/simulate.js     Monte Carlo maths check (Node)
studio/index.html     Slot Demo Studio (generic slot demo recorder)
docs/                 rules, pay table, animation spec, asset spec, GDD v2.0
CHANGELOG.md          update history
```

The engine returns a list of steps per spin (`hatch`, `bear`, `win`, `pop`, `wipe`), and `game.js` animates them. To rebuild the presentation in Pixi or Spine, keep `engine.js` and replace the drawing code.

## Maths

`node tools/simulate.js 2000000` results:

| Metric | Prototype | Target |
| --- | --- | --- |
| RTP | 96.0% (±0.5% between runs) | 95.8% |
| Hit frequency | 27.8% | 29.8% (GDD) |
| Free spins | 1 in 117 | about 1 in 118 (GDD) |
| Wipe | 1 in about 1,200 | not published |
| Ghost special (100×) | 1 in about 1,600 | not published |
| Max win | 390× cap | 390× (GDD) |

The documents don't publish reel weights or feature chances, so these were tuned to hit the targets: symbol weights, Wild star chance (29% base, 8% in free spins), bear weights and Scare Bear size weights. This is prototype maths for demos, not certified maths.

## Decisions where the documents disagree or are silent

- **Win banner tiers:** the animation spec starts at NICE 25×; the asset spec has NICE 15× and BIG 25×. The asset spec's six tiers are used, editable in `CONFIG.winTiers`.
- **Which banners can actually appear:** only the highest win per line is paid, so one spin tops out at 34× without a wipe. In practice you'll see NICE and BIG on single spins, and EPIC for the Ghost award. MEGA and above need a large free spins round, and the 390× cap (GDD) means 500× EPIC is reached only through the special award.
- **When banners show:** win banners play after each base spin and each free spin. The free spins summary covers the whole bonus.
- **Dance Bear order:** the current spin's wins finish first, then the free spins trigger banner plays.
- **Rule assumptions:** Wilds count as "the same" for the wipe check, the wipe upgrade happens once per spin, and a Dance Bear during free spins adds 7 more spins.
- **Anticipation:** it plays only when the Wild will open (`anticipateOn: 'star'`; set `'wild'` for any Wild). The spec's "reel slows slightly" ramp isn't implemented; the reel spins at full speed under the aura.

## Recording demos

In the demo panel, build a list of outcomes and choose **Record video → Whole list**. Options include No win, Single win, Upgrade chain, Nice/Big banner, Scare Bear (small/large), Charm Bear, Dance Bear → Free spins, Wipe Win, Wipe → Ghost, or a custom grid where you choose which bear the Wild opens to.

Recording captures the 1920×1080 canvas at 30 fps with sound. Press **D** first to hide the panel.

## Next steps

- **Spine 2D:** the asset spec calls for skeletal animations (`sym_xx_win`, `sym_xx_upgrade`, `bear_scare_1x/2x/3x`, `bear_charm`, `bear_dance`). Each one maps to a single function in `game.js` (`showWin`, `playHatch`, `playBear`, `playWipe`), already timed to the spec. The next step is loading `.json` + `.atlas` with the Spine web runtime and playing the named animation there in place of the code-drawn tween.
- Autoplay round-count page, portrait layout, and reel strips once the maths are final.
