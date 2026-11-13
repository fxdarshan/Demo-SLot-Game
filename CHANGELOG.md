# Changelog

All notable changes to the prototype. Newest first.

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
