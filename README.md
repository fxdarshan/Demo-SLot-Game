# Nesting Dolls: slot prototype

A playable HTML5 prototype of a 5×3, 17-line nesting-doll slot. It uses the reference GDD in [`docs/reference-gdd.md`](docs/reference-gdd.md) and gameplay footage of the reference game as its spec.

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

| Feature | Notes |
| --- | --- |
| 5×3 grid, 17 fixed lines, left to right | Line shapes are in `src/config.js` |
| Inverted doll hierarchy L7 → L1 | Smaller doll = higher value |
| Symbol upgrade chain | Winning dolls pop to the next level, the board is re-evaluated, and only new or improved line wins pay |
| Wild Egg (reel 3 only) | Wobbles, cracks and hatches a bear when it is part of a win |
| Scare Bear | The lowest-value dolls on the board get scared and jump up 1, 2 or 3 levels |
| Charm Bear | Every doll on the board goes up 1 level |
| Dance Bear | Awards 7 free spins with a guaranteed Wild Egg on reel 3 |
| Wipe Win | A full board of Yellow dolls turns to ghosts and pays 17 × 2× plus a 100× bonus |
| Big / Mega / Epic win | Background changes colour, script title, knitted count-up |
| Max win cap | 390× bet per round |
| Demo controls | Scripted outcome list, custom grid painter, speed control, video recording (MP4 or WebM with sound) |

## Replace the art

1. Open [`assets/manifest.js`](assets/manifest.js). Every image and sound has a key and a file path.
2. Save your file at that path, or change the path to point at your file.
3. Reload. The demo panel's **Assets** section lists the files that still use placeholders.

| Key | Default path | Size |
| --- | --- | --- |
| `symbol_L7` … `symbol_L1` | `assets/images/symbols/L7_teal_dummy.png` … `L1_yellow.png` | 300×300 PNG |
| `symbol_L*_scared` (optional) | `assets/images/symbols/L*_scared.png` | 300×300 PNG |
| `wild` | `assets/images/symbols/wild_egg.png` | 300×300 PNG |
| `bear_scare` / `bear_charm` / `bear_dance` | `assets/images/bears/…` | 300×300 PNG (bear in the bottom half of the egg) |
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
src/engine.js         pure game maths: line evaluation, upgrade chain, bears, wipe win
src/director.js       builds scripted outcomes for demos (search over random grids)
src/game.js           reels, step-by-step presentation, free spins, celebrations, UI bar
src/placeholders.js   code-drawn placeholder art
src/assets.js         loads manifest files, falls back to placeholders
src/audio.js          file sounds or synthesised placeholders, routed into recordings
src/devpanel.js       demo controls (not part of the game)
tools/simulate.js     Monte Carlo maths check (Node)
docs/reference-gdd.md reference design document
```

The engine returns a list of **steps** for each spin: `win`, `pop`, `hatch`, `bear`, `wipe`. `game.js` animates them one by one. To redo the presentation (for example in Pixi or Spine), keep `engine.js` and replace the drawing code.

## Maths

`node tools/simulate.js 1000000` results with the current settings:

| Metric | Prototype | GDD |
| --- | --- | --- |
| RTP | about 95% (94–96% between runs) | 95.80% |
| Hit frequency | 26% | 29.8% |
| Free spins | 1 in 122 | about 1 in 118 |
| Wipe win | 1 in about 440 | not given |
| Max win | 390× cap | 390× |

The GDD leaves a few things open. These are the assumptions, all editable in `src/config.js`:
- The 17 line shapes.
- 3- and 4-of-a-kind pays: 25% and 50% of the GDD's 5-of-a-kind values.
- `payScale: 0.172`. Using the GDD pay values directly gives an RTP far above 100% once chains and bears stack, so line pays are scaled down. Wipe win pays (34× + 100×) are not scaled.
- Symbol and bear weights.
- The egg hatches once per spin, then stays as a plain Wild.
- A Dance Bear during free spins adds 7 more spins.
- The egg counts as a Yellow doll when checking for a wipe win.

The doll colour order follows the reference footage: teal with a dummy (L7), blue, purple, pink, red, orange with glasses, yellow (L1).

This is prototype maths for demos, not certified game maths.

## Recording demos

In the demo panel, build a list of outcomes: Single win, Chain, Scare, Charm, Dance → Free spins, Wipe win, Big win, or a custom grid you paint yourself. Then choose **Record video → Whole list**.

Recording captures the 1920×1080 canvas with sound and stops by itself. You get a download link for the file. Press **D** before recording to hide the panel.

## Next steps

- Spine2D or sprite-sheet animations for the doll pop, egg hatch and bears. Each step in `game.js` (`playStep`) is the place to hook them in.
- Portrait layout for mobile.
- Real reel strips instead of per-cell weights, once the maths are final.
