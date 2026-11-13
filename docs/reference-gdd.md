# Game Design Document (GDD)
## Project: X-Mas Dolls (prototype, using Babushkas by Thunderkick, 2016, as reference)
**Engine & tech:** HTML5 Canvas 2D, single canvas at 1920×1080, no build step  
**Document version:** 2.0, aligned with the official rules, pay table, animation spec and asset spec

> **Version 2.0 note.** Version 1.0 of this document was written before the official rules and pay table were available. Where they disagreed, the official documents win. The order of authority is:
> 1. [`official-game-rules.md`](official-game-rules.md) and [`pay-table.md`](pay-table.md): mechanics and pays
> 2. [`animation-specifications.md`](animation-specifications.md): timings
> 3. [`game-asset-specification.md`](game-asset-specification.md): asset IDs, banner tiers, audio
> 4. This GDD: everything else (max win, bet range, design intent)
>
> The changes from 1.0 are listed in section 10.

---

## 1. Core concept

**X-Mas Dolls** is a 5-reel, 3-row, 17-line Christmas video slot built around nesting dolls. Wins don't vanish. Winning dolls **open up to reveal a smaller, more valuable doll** inside, which can make new wins and chain again. A Wild Egg on the middle reel can hatch one of three Mystery Bears that upgrade the board or award free spins. When all 15 positions end up the same, the board upgrades once more. A full board of the top doll becomes Ghosts and pays a special award.

---

## 2. Key parameters

| Metric | Value | Source |
| :--- | :--- | :--- |
| Grid | 5 reels × 3 rows | Rules |
| Paylines | 17 fixed, left to right, no gaps | Rules / pay table |
| Win per payline | Only the highest win per line is paid | Rules §7 |
| Theoretical RTP | 95.8% | Rules |
| Hit frequency | 29.8% target (prototype measures 27.8%) | GDD 1.0 |
| Free spins frequency | About 1 in 118 spins (prototype measures 1 in 117) | GDD 1.0 |
| Max win | 390× total bet per round | GDD 1.0 |
| Bet range | €0.10 to €100.00 | GDD 1.0 |
| Volatility | Low | GDD 1.0 |

Prototype figures come from `node tools/simulate.js 2000000`.

---

## 3. Symbols and pays

### 3.1 Standard symbols (upgrade order)

An **upgrade** replaces a symbol with the next symbol of higher pay value. The smaller the doll, the higher the value.

```
sym_06 Teal ─▶ sym_05 Blue ─▶ sym_04 Purple ─▶ sym_03 Pink ─▶ sym_02 Red ─▶ sym_01 Orange ─▶ sym_00 Yellow ─▶ (Ghost: wipe only)
```

| Asset ID | Tier | Description | 5 of a kind | 4 of a kind | 3 of a kind |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `sym_00` | 0 | Yellow grandmother with heart (highest) | 2.00× (€15.00) | 1.00× (€7.50) | 0.50× (€3.75) |
| `sym_01` | 1 | Orange with glasses | 1.50× (€11.25) | 0.80× (€6.00) | 0.40× (€3.00) |
| `sym_02` | 2 | Red | 1.00× (€7.50) | 0.60× (€4.50) | 0.30× (€2.25) |
| `sym_03` | 3 | Pink | 0.80× (€6.00) | 0.40× (€3.00) | 0.20× (€1.50) |
| `sym_04` | 4 | Dark purple | 0.70× (€5.25) | 0.40× (€3.00) | 0.20× (€1.50) |
| `sym_05` | 5 | Light blue | 0.50× (€3.75) | 0.20× (€1.50) | 0.10× (€0.75) |
| `sym_06` | 6 | Teal with pacifier (lowest) | 0.40× (€3.00) | 0.20× (€1.50) | 0.10× (€0.75) |

**Current art set (holiday reskin, 13 November 2026):**

| Tier | Asset ID | Character |
| :---: | :--- | :--- |
| 0 | `sym_00` | Santa (highest) |
| 1 | `sym_01` | Mrs Claus |
| 2 | `sym_02` | Elf |
| 3 | `sym_03` | Nutcracker |
| 4 | `sym_04` | Snowman |
| 5 | `sym_05` | Gingerbread |
| 6 | `sym_06` | Gift egg (lowest) |

- **Wild:** star snow-globe matryoshka.
- **Bears:** reindeer bursting out of snow globes. Scare = grumpy "Frost Frenzy", Charm = elegant, Dance = joyful jingle-bell.

The pays and upgrade order above are unchanged. Only the art differs from the colour descriptions.

Multipliers are per line, of the total bet. The pay table quotes euros at a €7.50 bet (the €750 special award = 100×), so each multiplier is the euro value divided by 7.5.

### 3.2 Special symbols

| Asset ID | Role |
| :--- | :--- |
| `sym_wild_idle` | Wild Egg. Lands on **reel 3 only** and substitutes for every standard symbol |
| `sym_wild_star_idle` | Wild Egg showing a **star** on landing. It opens to a Mystery Bear |
| `sym_bear_scare_small/med/large`, `sym_bear_charm`, `sym_bear_dance` | The bear revealed from a starred egg |
| `sym_ghost_idle` | End state of a wipe of 15 Santas. Pays the special award. A white and gold egg with a halo and glowing wings |

---

## 4. Features

### 4.1 Win symbol upgrade (rules §3.2, pay table §4)
After each evaluation, all winning symbols of one value upgrade to the next value, but **only if that creates new or longer paylines**. Each value is tested on its own, and every value that qualifies upgrades together. The board is evaluated again and the loop repeats until no value qualifies. Lines pay only their highest win, so an improved line pays the difference.

### 4.2 Wild Egg and Mystery Bears (rules §4, pay table §3)
When the Wild lands it may show a star. A starred Wild opens to one bear, **whether or not it is part of a win**. The bear acts before wins are evaluated.

| Bear | Effect |
| :--- | :--- |
| Scare Bear | The lowest-value symbols on screen upgrade. This repeats 1, 2 or 3 times, matching the bear's size (small, medium or large) |
| Charm Bear | Every symbol on screen upgrades once |
| Dance Bear | Awards 7 free spins |

### 4.3 Free spins (rules §5, pay table §3.3)
- 7 spins at the triggering bet, part of the same game round.
- A Wild Egg is guaranteed on reel 3 every free spin.
- Prototype assumption: a Dance Bear during free spins adds 7 more.

### 4.4 Wipe and special award (rules §6, pay table §5)
- **Wipe:** when all 15 symbols are the same after all win upgrades, they upgrade once more. For example, 15 Pinks become 15 Reds, which then pay as 17 lines of Red.
- **Special award:** when the wipe applies to 15 Santas, they become Ghosts and pay **100× bet** (€750 at €7.50), on top of the line wins already paid.
- Prototype assumptions: the Wild counts as matching for the wipe check, and a wipe happens at most once per spin.

---

## 5. Game round flow

```
Spin ─▶ Reels stop (reel 3 anticipation if the Wild will open)
        │
        ├─ Wild landed with a star? ── yes ─▶ Egg opens ─▶ Bear effect (Scare / Charm / Dance)
        │
        ▼
   Evaluate 17 lines ─▶ Pay new or improved line wins
        │
        ├─ Does upgrading any winning value create new or longer lines? ── yes ─▶ Upgrade ─▶ (evaluate again)
        │
        ├─ All 15 the same (first time this spin)? ── yes ─▶ Wipe upgrade ─▶ Yellow? ─▶ Ghosts + 100× award
        │                                                                     └─ otherwise evaluate again
        ▼
   Win banner (by win size) ─▶ Dance Bear awarded? ─▶ Free spins trigger banner ─▶ Free spins ─▶ Summary
        │
        ▼
   Round total added to balance (capped at 390×)
```

---

## 6. Presentation and pacing

All timings follow [`animation-specifications.md`](animation-specifications.md) at **30 fps** and live in `CONFIG.frames`.

| Event | Spec ID | Duration |
| :--- | :--- | :--- |
| Base ambient loop | `bg_base_loop` | 4.0 s loop |
| Free game ambient loop | `bg_freegame_loop` | 3.0 s loop |
| Symbol win / upgrade | `sym_xx_win`, `sym_xx_upgrade` | 1.5 s (10f pop, 20f open, 15f settle/morph). Santa plays a 12-frame sprite sheet over the same 1.5 s |
| Wild star opening | `sym_wild_star_open` | 1.5 s |
| Reel 3 anticipation | `vfx_anticipation_reel3` | 2.0 s |
| Scare Bear | `bear_scare_1x/2x/3x` | 1.5 / 2.25 / 3.0 s |
| Charm Bear | `bear_charm` | 2.0 s |
| Dance Bear | `bear_dance` | 2.5 s |
| Wipe and Ghost | `vfx_wipe_win_sweep` | 3.0 s |
| Free spins trigger / summary | `banner_fg_trigger`, `banner_fg_summary` | 5.0 s each |
| Base to free game transition | `trans_base_to_freegame` | 2.5 s |
| Free game to base transition | `trans_freegame_to_base` | 2.0 s |
| Win banners | `banner_win_*` | 5.0 s |

### 6.1 Win banner tiers
These are the six tiers from the asset spec. The animation spec's five-tier table, starting at 25×, is superseded.

| Tier | Win | FX |
| :--- | :--- | :--- |
| NICE WIN | 15× to under 25× | Bronze, coin fountain |
| BIG WIN | 25× to under 50× | Silver, coin drop |
| MEGA WIN | 50× to under 100× | Gold and ruby, double coin cascade |
| SUPERB WIN | 100× to under 250× | Ruby and emerald, fireworks, confetti cannons |
| SENSATIONAL WIN | 250× to under 500× | Amethyst, laser sweeps, heavy coin shower |
| EPIC WIN | 500× or more, or the special award | Diamond blue, full fireworks, coin rain, Ghost rays |

**Delivered banner art (holiday set):**

| Tier | Banner |
| :--- | :--- |
| NICE | Nice List! (wreath) |
| BIG | none yet; code-drawn ribbon |
| MEGA | Merry Mega! (golden star) |
| SUPERB | Superb Sleigh Ride! (bells) |
| SENSATIONAL | Sensational Snowfall! (ice) |
| EPIC | Epic Christmas! (sleigh) |

The five supplied banners match the animation spec's five-tier list (section 7.1). If BIG WIN is dropped, switch `CONFIG.winTiers` to those five tiers and thresholds.

Without a wipe, a single spin tops out at 34× (17 lines × Yellow 5-of-a-kind). In practice, single spins show NICE or BIG, the special award shows EPIC, and the higher tiers need a big free spins round. With the 390× cap, EPIC by amount is unreachable, so EPIC appears only for the special award.

---

## 7. UI layout (asset spec §2.2)

- **Bottom bar** (`ui_bar_bottom`):
  - info / paytable (`btn_info`)
  - balance (`disp_balance`)
  - round win (`disp_win`, counts up)
  - bet with − / + (`btn_bet_minus`, `btn_bet_plus`, `disp_bet`)
  - autoplay (`btn_auto_idle/active`)
  - spin (`btn_spin_idle/active/disabled`)
- **Free spins counter** (`ui_freegame_counter`): top centre, "SPINS LEFT: X / 7".
- **Reel area:** wooden folk frame (`bg_base_frame`; `bg_freegame_frame` in free spins) over five reel strips (`bg_base_reel_strip`). Reel 3 glows during free spins (`fx_reel3_guaranteed_wild_indicator`).
- **Paylines:** coloured paths (`line_overlay_01..17`) and node rings (`line_node_highlight`) on winning positions.

### 7.1 Splash / loading screen (not in the asset spec)

- Shown on start, over the stage: the X-Mas Dolls logo (`ui_splash_logo`) floating over the living-room backdrop, falling snow and gold dust, a status line that cycles ("Loading Festive Wonders...", "Warming up the Reels...", "Polishing Golden Bells...", "Preparing Holiday Magic..."), a percentage and a gold progress bar, then "Welcome to X-Mas Dolls!".
- The bar follows the real asset load but never finishes before 2.6 s. It then fades out over 0.7 s. A click skips it once loading is done.
- Corner buttons: sound on/off and fullscreen. It is a DOM overlay, so it never appears in recordings.
- `CONFIG.splash`: `enabled`, `minMs`, `fadeMs`. `?nosplash` skips it; the demo panel can replay it.

---

## 8. Art direction

- **Base game:** snowy log cabins under green and violet northern lights (`bg_base_main`). The whole background breathes gently (scale 1 → 1.02 over 4 s).
- **Free game:** a cosy firelit living room with a decorated tree, fireplace and stockings (`bg_freegame_main`), with party lights along the frame and falling gold sparkles.
- The art spec's original direction (warm wood with Russian folk lace) survives in the placeholder reel frame, which is still to be replaced.
- **Symbols:** glossy 3D holiday characters on the nesting-doll silhouette: Santa, Mrs Claus, Elf, Nutcracker, Snowman, Gingerbread, Gift egg. The Wild is a star snow-globe matryoshka, and the bears are reindeer bursting from snow globes (see section 3.1). The original spec's painted dolls with distinct faces (pacifier, glasses, closed eyes) remain the reference for the placeholder art.
- **Ghost:** a pearl-white egg with gold filigree and Christmas baubles, a gold halo and glowing wings (the original spec asked for a green halo).
- **Reel 3** is the focus point, because it carries the Wild Egg and the bears.

---

## 9. Demo and QA tools (prototype only)

- **Demo panel (D):** an outcome list, a custom grid painter, speed control, video recording and a replay button for the splash screen.
- **Cheats (C):** hotkeys force the next spin, a dropdown forces a win of any one symbol (3, 4 or 5 in a row), eight scenarios (also a dropdown) play whole sequences (all banners, free spins variants, every bear, Wipe and Ghost, max-win cap), and `?scenario=<id>` links open straight into one. Full reference: [`cheats.md`](cheats.md).
- **MEGA, SUPERB and SENSATIONAL** are reachable only by a presentation cheat on a single spin (see section 6.1).
- **None of these change the maths.**

## 10. Changes from version 1.0

| Topic | v1.0 | v2.0 (official) |
| :--- | :--- | :--- |
| Symbol numbering | Level 7 (Blue) … Level 1 (Yellow), Level 0 Ghost | Tier 6 (Teal) … Tier 0 (Yellow); Ghost is the wipe end state |
| Pays | 5-of-a-kind only | Full 3/4/5-of-a-kind table (section 3.1) |
| Paylines | Shapes not given | Official 17 shapes |
| Upgrade rule | Every winning symbol upgrades | Only when it creates new or longer lines; highest win per line |
| Wild trigger | Bear only when the egg is part of a win | Bear when the Wild lands with a star |
| Scare Bear | Upgrades by 1, 2 or 3 levels at once | Upgrades the lowest symbols, repeated 1–3 times |
| Wipe | All Yellow → 34× lines + 100× bonus | Any 15 identical upgrade once; 15 Yellow → Ghost, 100× special award |
| Win banners | Single "Big Win" (3–4 s) | Six tiers, 5 s each |
| Free spins UI | Not specified | Trigger and summary modals, transitions, spins-left counter |
