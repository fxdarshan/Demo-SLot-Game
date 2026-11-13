# Nesting Dolls: slot prototype

A playable HTML5 prototype of a 5×3, 17-line nesting-doll slot. Its rules and maths follow [`docs/official-game-rules.md`](docs/official-game-rules.md) and [`docs/pay-table.md`](docs/pay-table.md). Presentation and timing follow [`docs/reference-gdd.md`](docs/reference-gdd.md) and gameplay footage of the reference game.

All art and sound comes from files listed in one manifest. Missing files fall back to placeholders drawn in code. You can replace the graphics one file at a time without touching any game code.

## Run it

You don't need to build anything. Serve the folder over http so sounds can load:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
# or: npx serve .
```

Opening `index.html` directly also works. In that mode only the synthesised placeholder sounds play.

**Controls:** click the spin button or press **Space**. Click during a celebration to skip it. Press **D** to hide or show the demo panel so the game fills the window for capture.

## What's implemented

| Feature | Rule |
| --- | --- |
| 5×3 grid, 17 fixed paylines | Official line shapes. Left to right, no gaps; only the highest win per line is paid |
| Pay table | 7 dolls from Teal (lowest) to Yellow (highest). The € values are converted to multiples of the bet (the table is quoted at a €7.50 bet) |
| Win symbol upgrade | All winning symbols of one value upgrade to the next value, only if that creates new or longer paylines. Repeats until nothing qualifies |
| Wild (reel 3 only) | Substitutes for all dolls. When it lands showing a **star**, it opens to a bear |
| Scare Bear | The lowest-value dolls upgrade, repeated 1, 2 or 3 times. Bear size (small, medium, large) shows how many |
| Charm Bear | Every doll on screen upgrades once |
| Dance Bear | 7 free spins with a guaranteed Wild on reel 3 every spin |
| Wipe Win | When all 15 symbols are the same after all upgrades, they all upgrade once more |
| Special win | A wipe of 15 Yellow dolls turns them into Ghosts and pays 100× bet (€750 at €7.50) |
| Celebrations | Big / Mega / Epic (10× / 25× / 50×) and Wipe Win, with knitted count-up |
| Max win cap | 390× bet per round (from the GDD) |
| Demo controls | Scripted outcome list, custom grid painter (choose the bear and its size), speed control, video recording (MP4 or WebM with sound) |

## Replace the art

1. Open [`assets/manifest.js`](assets/manifest.js). Every image and sound has a key and a file path.
2. Save your file at that path, or change the path to point at your file.
3. Reload. The demo panel's **Assets** section lists the files that still use placeholders.

| Key | Default path | Size |
| --- | --- | --- |
| `symbol_L7` … `symbol_L1` | `assets/images/symbols/L7_teal_dummy.png` … `L1_yellow.png` | 300×300 PNG |
| `symbol_L*_scared` (optional) | `assets/images/symbols/L*_scared.png` | 300×300 PNG |
| `wild` / `wild_star` | `assets/images/symbols/wild_egg.png` / `wild_egg_star.png` | 300×300 PNG (plain Wild, and the Wild showing a star before it opens) |
| `bear_scare` / `bear_charm` / `bear_dance` | `assets/images/bears/…` | 300×300 PNG (bear in the bottom half of the egg). Scare Bear is scaled to show small, medium or large |
| `bubble_scare` / `bubble_charm` / `bubble_dance` | `assets/images/bears/…` | about 640×360 PNG |
| `ghost` | `assets/images/symbols/ghost.png` | 300×300 PNG |
| `background`, `background_freespins`, `background_bigwin`, `background_megawin`, `background_epicwin`, `background_wipewin` | `assets/images/backgrounds/…` | 1920×1080 |
| `win_patch` | `assets/images/fx/win_patch.png` | 300×300 white/grey PNG, tinted per doll colour |
| sounds | `assets/audio/…` | MP3, OGG or WAV |

Tips:
- Keep the same framing for every symbol: centred on a 300×300 canvas with transparent padding.
- The pop animation splits each doll image horizontally at `symbolSplitY` (default 0.47 of the height) into a lid and a base. Put your doll's seam near that line, or change the value in the manifest.
- Once real symbols are in, set `showLevelBadges: false` in `src/config.js` to remove the small "L5" tags. They only appear on placeholder dolls anyway.
- Music (`music_base`, `music_free`) only plays from real files. There is no synthesised music.

## Project layout

```
index.html            page + demo panel
css/style.css         panel styling
assets/manifest.js    every art and sound file path  ← edit this to swap assets
assets/images/…       drop artwork here
assets/audio/…        drop sounds here
src/config.js         maths, timing and presentation settings
src/engine.js         pure game maths: paylines, conditional upgrades, bears, wipe and special win
src/director.js       builds scripted outcomes for demos (search over random grids)
src/game.js           reels, step-by-step presentation, free spins, celebrations, UI bar
src/placeholders.js   code-drawn placeholder art
src/assets.js         loads manifest files, falls back to placeholders
src/audio.js          file sounds or synthesised placeholders, routed into recordings
src/devpanel.js       demo controls (not part of the game)
tools/simulate.js     Monte Carlo maths check (Node)
docs/official-game-rules.md   official rules (source of truth for mechanics)
docs/pay-table.md             official pay table and paylines
docs/reference-gdd.md         design document (presentation, timing, max win)
```

The engine returns a list of **steps** for each spin: `hatch`, `bear`, `win`, `pop`, `wipe`. `game.js` animates them one by one. To redo the presentation (for example in Pixi or Spine), keep `engine.js` and replace the drawing code.

## Maths

The pay table, paylines and special win come from the official documents. The documents don't publish the reel weights or feature chances, so these were tuned with the simulator to hit the published targets. Results from `node tools/simulate.js 3000000`:

| Metric | Prototype | Target |
| --- | --- | --- |
| RTP | 96.25% (about ±0.5% between runs) | 95.8% |
| Hit frequency | 27.8% | 29.8% (GDD) |
| Free spins | 1 in 118 | about 1 in 118 (GDD) |
| Wipe Win | 1 in about 1,200 | not published |
| Ghost special win (100×) | 1 in about 1,700 | not published |
| Max win | 390× cap | 390× (GDD) |

What was tuned or assumed, all in `src/config.js`:
- **Tuned:** symbol weights (`weights`), how often a landed Wild shows a star (`starChance` 29% base, 8% in free spins), bear weights, and Scare Bear size weights.
- **Assumed:** a Dance Bear during free spins adds 7 more spins.
- **Assumed:** Wild positions count as "the same" for the wipe check. Otherwise no wipe could ever happen in free spins, where the Wild is guaranteed.
- **Assumed:** the wipe upgrade happens once per spin. The footage shows a Wipe Win of 15 Yellows that didn't then turn to Ghosts.
- **Interpretation:** when several values qualify for an upgrade at the same time, they all upgrade together.

The doll colour order matches the pay table: Teal with pacifier (L7, lowest), Blue, Purple, Pink, Red, Orange with glasses, Yellow grandmother (L1, highest).

This is prototype maths for demos, not certified game maths.

## Recording demos

In the demo panel, build a list of outcomes: No win, Single win, Upgrade chain, Scare Bear (small or large), Charm Bear, Dance Bear → Free spins, Big win, Wipe Win, Wipe → Ghost (100×), or a custom grid you paint yourself, including which bear the Wild opens to. Then choose **Record video → Whole list**.

Recording captures the 1920×1080 canvas with sound and stops by itself. You get a download link for the file. Press **D** before recording to hide the panel.

## Next steps

- Spine2D or sprite-sheet animations for the doll pop, egg hatch and bears. Each step in `game.js` (`playStep`) is the place to hook them in.
- Portrait layout for mobile.
- Real reel strips instead of per-cell weights, once the maths are final.
