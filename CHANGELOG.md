# Changelog

All notable changes to the prototype. Newest first.

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
