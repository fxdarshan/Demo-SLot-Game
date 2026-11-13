# Changelog

All notable changes to the prototype. Newest first.

## 2026-11-13: Edge cases reviewed and fixed
- New [`docs/edge-cases.md`](docs/edge-cases.md) and `tools/edge-cases.py` (17 checks in headless Chrome; run against the previous build it failed the balance checks, with balances of -77 and -99.95).
- **Balance:** a spin with a balance below the bet used to run and go negative, and autoplay carried on. Now the bet drops to the highest affordable one, or the demo balance is refilled when it is below the smallest bet, with a short notice above the balance.
- **Speed slider:** held until the next spin starts, so a win animation cannot speed up or slow down halfway (and a slowed sheet cannot be cut off).
- **AUTO** toggled off and on during a round no longer starts a second loop.
- **Errors mid-round** now reset the banner, modal, transition, spinning state, free-spins look and autoplay instead of leaving them stuck.
- **Cheats:** malformed items (bad symbol or length, missing or wrong-sized custom grid) are clamped or played as a normal spin; an unknown `?scenario=` id shows a message.
- **Win sheets:** after an upgrade, the step waits until the longest sheet among its winners has finished, so a neighbouring winner's sheet is not cut off.
- **Loading:** if asset loading throws, the game starts with placeholders and the splash leaves.
- `docs/cheats.md`: the symbol-win text no longer says only Santa has a sheet.

## 2026-11-13: Win sheets pinned to each symbol's round bottom
- Problem: in the generated sheets the character drifted between frames. Measured on the shipped sheets, the bottom of the body moved up to 35 px (of 400), the bottom centre up to 40 px sideways, and the size changed several percent; the last frame did not match the first, so every win ended with a pop back to the idle art.
- New `tools/asset-pipeline/normalize_sprite_sheet.py` (replaces `align_sprite_sheet.py` in the pipeline): measures every frame at its round bottom and scales and moves it so grounded frames share one ground line, one bottom centre and one size. Size is the median of belly width, body height and the root of the body area, so spread feet or raised arms do not rescale a frame. Jump and turn frames (`--air`, default 5-9; Santa also 11) keep a jump but get the correction interpolated and never sink below the ground. Santa's, Mrs Claus's, Elf's, Nutcracker's, Snowman's and Gingerbread's sheets all went through it.
- After: frame 0 and frame 15 have the same bottom (within 1 px), centre (within 1 px) and size (within 3 %), so the animation loops back into the idle art cleanly. `scale`, `ox` and `oy` for all six sheets were recomputed from the new frame 0.
- Timing is unchanged: 3 ticks (100 ms) a frame. To slow every sheet down, raise `tpf` in `assets/manifest.js` (4 = 133 ms, 2.1 s).

## 2026-11-13: Win animations for Elf, Nutcracker, Snowman and Gingerbread
- `sym_02` Elf, `sym_03` Nutcracker, `sym_04` Snowman and `sym_05` Gingerbread play their supplied 16-frame sheets on a win (3 ticks a frame, 1.6 s), via `images.sym_0x_win` and `sprites.sym_0x_win` in the manifest. Only the Gift egg (`sym_06`) still uses the scale pulse.
- Checked in the build: every sheet plays frames 0 to 15 in order; chained upgrades (win, upgrade, win) play each sheet in turn; no page errors.
- `cut_sprite_sheet.py --dewatermark`: removes the generator's four-point sparkle from the sheet corner (shape in `tools/asset-pipeline/watermark_star_mask.png`). It overlaps the body on the snowman, gingerbread and elf, so `--clear-gray` could not be used (it would erase the white snowman); the sparkle is inpainted and the body outline in that spot rebuilt from the rest of the character. This also removes the notch the Mrs Claus cut had.
- `--chroma` fix: the "magenta" background is really about (253, 35, 255) and varies per sheet, so the colour is measured from each sheet and anything within 14 of it is fully transparent. Before, a faint 8% light haze sat over the whole background.
- Mrs Claus's sheet was re-cut with both fixes.

## 2026-11-13: Mrs Claus win animation
- Mrs Claus (`sym_01`) now plays the supplied 16-frame sheet on a win: 3 ticks (100 ms) a frame, 1.6 s, same as Santa. Manifest: `images.sym_01_win` and `sprites.sym_01_win`.
- She upgrades to Santa, so the upgrade step now waits for the sheet to finish (`playSteps` / `showWin`), then the morph runs as before. Santa never upgrades, so nothing changed for him.
- `cut_sprite_sheet.py` gained `--chroma` for sheets on solid #FF00FF: rembg turned the magenta into light and shifted the colours (green hat, green sleeve), so it keys the magenta directly and un-mixes it from soft edges. `--clear-gray` now judges the keyed colours in that mode (higher grey threshold). The chroma-key watermark star in frame 15 was removed; a tiny notch is left on the right edge of the apron, invisible at game size.
- The source sheet, cut-out and the alignment step (`align_sprite_sheet.py`) follow the same pipeline as Santa's sheet.
- Also delivered outside the repo: `MrsClausSprite.jsx` (React component, canvas chroma key on load, 25% steps).

## 2026-11-13: Santa animation jerk fixed (even timing, aligned frames)
- Cause 1, art: the generated sheet's cells are unevenly spaced, so Santa crept about 10 px left in every row of four and snapped back 30 to 40 px at the start of the next row (frames 4, 8, 12). New `tools/asset-pipeline/align_sprite_sheet.py` measures each column's body centre and shifts the columns into line; the centres now stay within about 12 px (was 41), and only real poses move him. Run it after `cut_sprite_sheet.py`.
- Cause 2, timing: 45 ticks do not divide into 16 frames, so frames lasted 2 or 3 ticks unevenly. New manifest option `tpf` (ticks per frame): Santa holds every frame exactly 3 ticks (100 ms), 48 ticks (1.6 s) in total. The win step waits for the longer sheet (`Assets.winSpriteTicks`). Measured in the build: 93 to 105 ms per frame.
- `loops` and `holds` still work for other sheets.

## 2026-11-13: Santa win animation upgraded to 16 frames
- Santa's win sprite sheet is replaced by the supplied **16-frame** sheet (4 × 4: standing laugh with "Haha!", jump with dust, two gold sparkle swirls, arms-up cheer, a landing with dust and sparks), for smoother motion than the 12-frame one.
- It plays **one pass of all 16 frames over the 1.5 s win window** (`CONFIG.frames.symWin` = 45 ticks): about 94 ms per frame (10.7 fps), ending on frame 15, then Santa returns to his idle art. The speed slider scales it as before.
- Fix: the first version played 3 passes in 1.5 s (32 fps), which felt too fast; the old 12-frame sheet had run once over the same window. Now one pass, so the extra frames make it smoother, not faster. Set `loops` in the manifest to repeat it.
- `assets/manifest.js` `sprites.sym_00_win` is now `{ cols: 4, rows: 4, loops: 3, scale, ox, oy }`. New `loops` option: the whole sheet plays that many times and ends on the last frame (`holds` still works for hand-timed sheets). `Assets.winSpriteFrame` handles both.
- The sheet's corner watermark (frame 15, right beside Santa's hand) was removed with a new `cut_sprite_sheet.py --clear-gray` option that clears only grey, unsaturated pixels in a box, so the character is untouched. New cut-out size 1600 × 1600 (400 px cells).
- The previous 12-frame sheet's original and cut-out stay in `assets/source/` for reference.

## 2026-11-13: Symbol win cheat and dropdowns
- **Symbol win cheat:** pick any symbol (Santa to Gift Egg) and 3, 4 or 5 in a row from two dropdowns, then **Force next spin** or **Play now**. The board puts that symbol on the middle payline and the director only accepts boards where it is the win. Real engine results, maths unchanged. Handy for checking Santa's sprite animation and each symbol's win.
- The same dropdowns are in the demo panel's **Next spins** section (**Add to list**), where queue items read for example "Elf win, 4 in a row".
- **Dropdowns instead of long lists:** the cheat menu's scenarios are now one dropdown with Play and Link, and the demo panel's scenarios a dropdown with **Load into list** and **Play**. The whole cheat menu now fits on screen. Hotkeys are unchanged.
- New director outcome `symwin` (`{ sym, len }`) and `Director.describe(item)`, which names queue items.

## 2026-11-13: Santa win animation (sprite sheet)
- (Superseded by the 16-frame sheet above.) Santa (`sym_00`) now plays the supplied 12-frame sprite sheet (4 × 3: laugh with "Haha!", a jump with dust, a gold sparkle swirl, settle) whenever he is in a winning line, instead of the generic scale pulse.
- It runs over the whole 45-tick win window (`CONFIG.frames.symWin` 10 + 20 + 15 = 1.5 s at 30 fps). The 12 frames are held for `[3,3,4,4,3,3,5,4,4,4,5,3]` ticks (36 + 9 extra on the key poses), so the animation always ends with the win and Santa returns to his idle art. The speed slider scales it with everything else.
- New asset `sym_00_win` (`assets/images/symbols/sym_00_santa_win_sheet.webp`, 1600 × 1197, 400 px cells) with a `sprites` entry in `assets/manifest.js` (holds, draw scale and offset so the body matches the idle art). Any symbol can get a sheet the same way: add `sym_0x_win` and a `sprites.sym_0x_win` entry.
- New tool `tools/asset-pipeline/cut_sprite_sheet.py` cuts each frame separately (solid body plus translucent sparkles), keeps every frame in a fixed cell, clears a box (used for the watermark in frame 11) and prints the scale and offset. `cut_glow.py` now exposes a `cut()` function; its output is unchanged.
- Originals and the full-resolution cut-out are in `assets/source/`.
- Only Santa is affected by this sheet; Santa is the top tier so a win never upgrades him mid-animation.

## 2026-11-13: Ghost symbol and splash screen
- **Ghost symbol** (`sym_ghost_idle`): the supplied glowing winged egg with a halo replaces the code-drawn ghost. It appears when a wipe turns Santas into Ghosts, and on the wipe banner. The wings, halo and sparkles are kept as soft translucent light rather than cut away with the grey background.
- **Splash / loading screen** (new): the supplied loading screen design, built in as a DOM overlay on the stage. It shows the X-Mas Dolls logo (`ui_splash_logo`, from the supplied logo image, cut out the same way) floating over the living-room backdrop with falling snow and gold dust, a gold progress bar that follows the real asset loading, cycling status lines and a "Welcome to X-Mas Dolls!" finish. Corner buttons toggle sound and fullscreen.
- It stays up for at least 2.6 s, fades out over 0.7 s, and a click skips it once loading is done. It is not drawn into recordings.
- Settings: `CONFIG.splash` (`enabled`, `minMs`, `fadeMs`). Open the page with `?nosplash` to skip it. The demo panel's Assets section has **Replay splash screen**.
- New tool `tools/asset-pipeline/cut_glow.py` removes a flat background but keeps glow (rembg mask for the solid subject, light recovered from the background elsewhere). `place_symbols.py` now includes the ghost and clears the faint floor haze under it.
- Originals, cut-outs and the supplied loading screen reference (screenshot, HTML, design notes) are saved under `assets/source/`.
- The asset spec describes a green-halo ghost; the supplied one has a gold halo. The wipe's green light effect is still drawn in code.

## 2026-11-13: Backgrounds swapped
- Base game now uses the exterior scene: snowy log cabins under the northern lights (`bg_base_main`).
- Free spins now use the interior scene: the firelit living room with tree and fireplace (`bg_freegame_main`).
- The image files and their source originals were renamed to match (`bg_base_main_aurora_cabins.png`, `bg_freegame_main_living_room.png`). Effects are unchanged: the base background still breathes, and free spins keep the party lights and gold sparkles.

## 2026-11-13: Renamed to X-Mas Dolls
- Game name **X-Mas Dolls** (`CONFIG.title`), shown at the top of the base game (the free spins counter takes that spot during free spins) and in the paytable header.
- Page title "X-Mas Dolls Prototype"; recordings save as `x-mas-dolls-demo-<date>.<ext>`.
- Single-file build renamed to `dist/x-mas-dolls-prototype.html` (the old `nesting-dolls-prototype.html` is removed).
- Paytable rules text now names the top symbol from config ("15 Santa symbols become Ghosts") instead of the old "Yellow Grandmothers".
- README, GDD and cheats doc updated. The GitHub repo keeps its name `Demo-SLot-Game`.

## 2026-11-13: Docs audit
- Ran the project-sync checklist across the repo. GitHub matched local, all scripts passed syntax checks, the single-file build was current and the asset checklist matched the files on disk.
- `docs/reference-gdd.md` section 8: symbol art direction updated from the painted-doll description to the delivered holiday characters.

## 2026-11-13: Cheats and scenarios
- **Cheat menu** (**C**), drawn over the game so it never appears in recordings. It plays scenarios and forces the next spin.
- **Hotkeys:**
  - `1`–`6`: NICE, BIG, MEGA*, SUPERB*, SENSATIONAL*, EPIC
  - `F`: free spins
  - `S`/`M`/`A`: Scare Bear large, medium, small
  - `H`: Charm Bear
  - `U`: upgrade chain
  - `W`: Wipe
  - `G`: Ghost
  - `X`: win
  - `N`: no win
  - `0`: clear forced spins
- **Eight scenarios:** all win banners, free spins, big free spins round, retrigger, every bear, Wipe and Ghost, max-win cap, base game tour. Each can be played from the menu or the demo panel (**Play** / **Load**).
- **Scenario links:** `?scenario=<id>` or `#scenario-<id>` loads and plays a scenario.
- **New outcomes:** medium Scare Bear (`scare2`), and the MEGA / SUPERB / SENSATIONAL presentation cheats (`b_mega`, `b_superb`, `b_sensational`).
- **Fix:** playing a list stops once the list is used up. Free spins consume list items inside one round, so the old fixed round count added extra random spins.
- **Fix:** when the 390× cap ends a free spins round, the summary shows the capped amount and "MAX WIN 390× REACHED".
- **Docs:** new `docs/cheats.md`; README, GDD and spec implementation notes updated.

## 2026-11-13: Source art in the repo
- `assets/source/originals/`: every supplied file as received (symbols, backgrounds, banners, popups, anticipation spiral), renamed by the asset ID it became.
- `assets/source/cutouts/`: full-resolution background-removed versions, plus the Total Win sign with its text removed.
- `tools/asset-pipeline/`: `cut_backgrounds.py` (rembg) and `place_symbols.py` (exports the 300×300 symbols; reproduces the shipped files exactly).

## 2026-11-13: Win banners, free spins popups, anticipation FX
- Five win banners, cut out and converted to WebP:
  - Nice List = `banner_win_nice`
  - Merry Mega = `banner_win_mega`
  - Superb Sleigh Ride = `banner_win_superb`
  - Sensational Snowfall = `banner_win_sensational`
  - Epic Christmas = `banner_win_epic`
  - BIG has no art yet and keeps the code-drawn ribbon.
- Free spins popups: the Festive Win frame (`modal_freespins_intro`) and the Total Win sign (`modal_freespins_outro`). The baked-in jackpot text was removed from the sign.
- Reel 3 anticipation: golden spiral (`vfx_anticipation_reel3`), black converted to alpha and drawn additively.
- Presentation code: supplied banner art is fitted on screen with the amount below; popup text is laid out inside the supplied frames. The code-drawn "CONGRATULATIONS!" header is skipped when the art has its own title.

## 2026-11-13: Holiday backgrounds
- `bg_base_main`: cosy firelit living room with the Christmas tree and fireplace.
- `bg_freegame_main`: snowy log cabins under the northern lights.
- Both supplied at 1376×768; cropped to 16:9 and scaled to 1920×1080 JPG (quality 90).

## 2026-11-13: Holiday symbol art
- 11 supplied renders cut out from their grey studio backgrounds (rembg, ISNet model), trimmed, centred and exported at 300×300 PNG with spec asset IDs:
  - Santa `sym_00` (highest), Mrs Claus `sym_01`, Elf `sym_02`, Nutcracker `sym_03`, Snowman `sym_04`, Gingerbread `sym_05`, Gift egg `sym_06` (lowest).
  - Star snow-globe matryoshka = `sym_wild_idle`; the same doll with a baked gold aura = `sym_wild_star_idle`.
  - Grumpy "Frost Frenzy" reindeer = `sym_bear_scare_small/med/large` (74 / 86 / 98% of the canvas), elegant reindeer = `sym_bear_charm`, joyful jingle-bell reindeer = `sym_bear_dance`.
- Symbol files renamed to describe the art (for example `sym_00_santa_idle.png`); asset IDs unchanged.
- The single-file build now embeds every image found in `assets/` as a data URI, so the double-click version shows the real art.

## 2026-11-13: Shareable builds
- `tools/build-single.js` builds `dist/nesting-dolls-prototype.html`, a single self-contained file anyone can double-click to play.
- Added `.nojekyll` so the repo can be served as-is by GitHub Pages (setup steps in the README).

## 2026-11-13: Animation and asset specs
- Symbols renumbered to the asset spec tiers: `sym_00` Yellow (highest) … `sym_06` Teal (lowest).
- `assets/manifest.js` keyed by spec asset IDs. Asset folders follow the spec categories (environment, symbols, ui, banners, fx); the audio list follows spec section 9.
- Every animation timed in 30 fps frames (`CONFIG.frames`):
  - base and free game ambient loops
  - 45f win / upgrade
  - Wild star opening
  - reel 3 anticipation
  - Scare Bear waves (45 / 67 / 90f), Charm hearts sweep, Dance Bear
  - 90f wipe sweep and Ghost transformation
- Free spins trigger and summary modals (START / COLLECT), accordion curtain and zoom-out transitions, "SPINS LEFT" counter.
- Six win banner tiers (NICE 15× … EPIC 500×) with tier FX; the special award uses EPIC.
- Wooden folk frame and reel strips, payline paths with node rings, HUD with bet − / +, autoplay, spin states, and an info / paytable screen.
- Docs: added the animation and asset specs, an implementation status section in each spec, GDD v2.0, this changelog and `assets/README.md`.

## 2026-11-13: Official rules and pay table
- Official 17 paylines and pay table (euro values at a €7.50 bet converted to bet multipliers).
- Winning symbols upgrade only when that creates new or longer lines, and only the highest win per line is paid.
- The Wild opens to a bear when it lands with a star. Scare Bear upgrades the lowest symbols 1–3 times by bear size.
- Wipe: 15 identical symbols upgrade once more; 15 Yellows become Ghosts for the 100× special award.
- Maths retuned to about 96% RTP with free spins about 1 in 118 (simulated).

## 2026-11-13: Slot Demo Studio
- Added `studio/`, a general-purpose slot demo recorder with scripted outcomes, uploadable art and video export.

## 2026-11-13: First prototype
- Playable 5×3 nesting-doll slot from the reference GDD, with an upgrade chain, Wild Egg bears, free spins and wipe win.
- Swappable assets through a manifest, with code-drawn placeholders.
- Demo panel with a scripted outcome list, custom grid painter and video recording; Node maths simulator.
