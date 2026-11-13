# Babushkas — Complete Game Asset List & Technical Specifications

This document outlines all graphic, animation, UI, transition, pop-up banner, and audio assets required for the development of the **Babushkas** video slot game.

---

## 1. Asset Structure & Naming Conventions

* **Format Standards:** 
  * Static UI/2D graphics: `.png` (2x/3x WebP fallback) / `.svg`
  * Skeletal Animations: Spine 2D (`.json` + `.atlas` + `.png`) or Lottie JSON
  * Particle Effects: Canvas/WebGL shader shaders / WebGL JSON
  * Audio: `.mp3` (compressed) & `.wav` (uncompressed fallback)
* **Naming Scheme:** `[type]_[category]_[asset_name]_[state]` (e.g., `sym_00_grandmother_idle`, `banner_bigwin_mega_in`).

---

## 2. Base Game Visual Assets

### 2.1 Environment & Background
| Asset ID | Description | Format | Dimensions / Details |
| :--- | :--- | :--- | :--- |
| `bg_base_main` | Primary background (Russian folk lace pattern / wooden aesthetic) | PNG / WebP | 1920x1080 (16:9 responsive) |
| `bg_base_frame` | Wooden reel container frame with folk ornament border | PNG | Overlay on 5x3 reel grid |
| `bg_base_reel_strip` | Individual reel column backgrounds (5 columns) | PNG | 5 discrete vertical strips |

### 2.2 Base Game UI & HUD Elements
| Asset ID | Description | Format | Details |
| :--- | :--- | :--- | :--- |
| `ui_bar_bottom` | Bottom control bar background | PNG | Hosts bet controls, balance, win displays |
| `btn_spin_idle` / `active` / `disabled` | Main spin action button states | PNG / SVG | Main interactive trigger |
| `btn_auto_idle` / `active` | Auto-play configuration trigger | PNG | Opens Autoplay modal |
| `btn_bet_plus` / `minus` | Bet level adjustment controls | PNG | Step bet up/down |
| `btn_info` | Paytable & Rules modal trigger | PNG | Gear / Info icon |
| `disp_balance` | Player balance container & typography | Component | Currency formatted string |
| `disp_bet` | Current bet amount container | Component | Currency formatted string |
| `disp_win` | Current round win tally display | Component | Dynamic count-up counter |

---

## 3. Free Game (Bonus Round) Visual Assets

### 3.1 Environment & UI Modifiers
| Asset ID | Description | Format | Details |
| :--- | :--- | :--- | :--- |
| `bg_freegame_main` | Enhanced/night mode or festive background for Free Spins | PNG / WebP | 1920x1080 variant |
| `bg_freegame_frame` | Illuminated reel frame with accordion/dance motifs | PNG | Free Spins frame overlay |
| `ui_freegame_counter` | Remaining Free Spins counter box ("Spins Left: X / 7") | PNG + Font | Positioned top-center or side |
| `fx_reel3_guaranteed_wild_indicator` | Glowing highlight/marker on Reel 3 indicating guaranteed Wild | Spine / PNG | Active highlight on middle reel |

---

## 4. Symbols & Character Animations

### 4.1 Standard Symbols (Tiers 0 to 6)
All standard symbols require **Idle**, **Win/Pop**, **Upgrade Morph**, and **Wipe State** animations.

| Symbol Code | Tier / Color | Description | Asset Files Required |
| :--- | :--- | :--- | :--- |
| `sym_00` | Tier 0 (Yellow) | Grandmother with Heart | `sym_00_idle`, `sym_00_win`, `sym_00_upgrade` |
| `sym_01` | Tier 1 (Orange) | Babushka with Glasses | `sym_01_idle`, `sym_01_win`, `sym_01_upgrade` |
| `sym_02` | Tier 2 (Red) | Red Babushka | `sym_02_idle`, `sym_02_win`, `sym_02_upgrade` |
| `sym_03` | Tier 3 (Pink) | Pink Babushka | `sym_03_idle`, `sym_03_win`, `sym_03_upgrade` |
| `sym_04` | Tier 4 (Dark Purple) | Dark Purple Babushka | `sym_04_idle`, `sym_04_win`, `sym_04_upgrade` |
| `sym_05` | Tier 5 (Light Blue) | Light Blue Babushka | `sym_05_idle`, `sym_05_win`, `sym_05_upgrade` |
| `sym_06` | Tier 6 (Teal) | Teal Babushka with Pacifier | `sym_06_idle`, `sym_06_win`, `sym_06_upgrade` |

### 4.2 Special & Mystery Symbols
| Symbol Code | Description | Visual Details | Asset Files Required |
| :--- | :--- | :--- | :--- |
| `sym_wild_base` | Wild Egg Symbol | Egg with ornate pattern and "W" logo | `sym_wild_idle`, `sym_wild_land` |
| `sym_wild_star` | Mystery Wild Egg | Egg displaying star emblem on stop | `sym_wild_star_idle`, `sym_wild_open` |
| `sym_bear_scare_small` | Scare Bear (Small) | Bear popping out (1 Upgrade) | Spine animation (`bear_scare_1x`) |
| `sym_bear_scare_med` | Scare Bear (Medium) | Bear popping out (2 Upgrades) | Spine animation (`bear_scare_2x`) |
| `sym_bear_scare_large` | Scare Bear (Large) | Bear popping out (3 Upgrades) | Spine animation (`bear_scare_3x`) |
| `sym_bear_charm` | Charm Bear | Bear throwing hearts (Upgrades all symbols +1) | Spine animation (`bear_charm`) |
| `sym_bear_dance` | Dance Bear | Bear playing accordion (Triggers 7 Free Spins) | Spine animation (`bear_dance`) |
| `sym_ghost` | Ghost Symbol (Special Award) | Glowing green halo angel/ghost doll | `sym_ghost_idle`, `sym_ghost_win_750` |

---

## 5. Visual FX & Reel Anticipation

### 5.1 Anticipation Effects
| Asset ID | Description | Trigger Condition |
| :--- | :--- | :--- |
| `vfx_anticipation_reel3` | Electric gold particle aura + slowed spin glow on Reel 3 | Triggers when condition for Wild landing is primed |
| `vfx_star_wild_reveal` | Glowing flash & shell opening animation for Wild Egg | Landing of Wild Star symbol on Reel 3 |

### 5.2 Upgrade & Wipe Effects
| Asset ID | Description | Target / Timing |
| :--- | :--- | :--- |
| `vfx_symbol_upgrade_burst` | Sparkle flare + nest doll opening effect | Plays on symbols undergoing Win Symbol Upgrade |
| `vfx_scare_bear_wave` | Shockwave radiating from Reel 3 to lowest symbols | Plays during Scare Bear activation |
| `vfx_charm_bear_hearts` | Floating heart particle burst across all 15 positions | Plays during Charm Bear activation |
| `vfx_wipe_win_sweep` | Full-screen gold flash sweeping all 15 identical symbols | Plays when 15 matching symbols initiate Wipe Upgrade |
| `vfx_ghost_transformation` | Ethereal green light burst transforming Symbol 0 to Ghost | Plays on 15x Symbol 0 Wipe Win |

---

## 6. Transitions & Cutscenes

| Asset ID | Description | Duration |
| :--- | :--- | :--- |
| `trans_base_to_freegame` | Accordion melody curtain wipe transition from Base Game to Free Spins | 2.5 seconds |
| `trans_freegame_to_base` | Smooth camera zoom out & background dissolve back to Base Game | 2.0 seconds |
| `overlay_screen_dimmer` | Semi-transparent dark overlay (`rgba(0,0,0,0.7)`) | Instant / Fade-in 0.3s |

---

## 7. Banners & Dialog Pop-ups

### 7.1 Free Spins Modals
| Asset ID | Purpose | Text / Elements |
| :--- | :--- | :--- |
| `modal_freespins_intro` | Trigger Banner (Start Free Game) | Header: "CONGRATULATIONS!"<br>Body: "YOU WON 7 FREE SPINS!"<br>Button: "START" |
| `modal_freespins_outro` | Completion Banner (Finish Free Game) | Header: "CONGRATULATIONS!"<br>Body: "YOU WON [€ XXX.XX] IN [7] FREE SPINS!"<br>Button: "COLLECT" |

### 7.2 Big Win Tier Banners
Banners display animated headers, coin fountains, and count-up counters based on win-to-bet multipliers.

| Banner Asset ID | Tier Name | Bet Multiplier Threshold | Visual Theme / FX |
| :--- | :--- | :--- | :--- |
| `banner_win_nice` | **NICE WIN** | $15\times \le \text{Win} < 25\times$ | Bronze banner, light sparkle particle burst |
| `banner_win_big` | **BIG WIN** | $25\times \le \text{Win} < 50\times$ | Silver banner, coin drop animation |
| `banner_win_mega` | **MEGA WIN** | $50\times \le \text{Win} < 100\times$ | Gold banner, double coin cascade & ribbon |
| `banner_win_superb` | **SUPERB WIN** | $100\times \le \text{Win} < 250\times$ | Glowing ruby frame, fireworks & coin fountain |
| `banner_win_sensational` | **SENSATIONAL WIN** | $250\times \le \text{Win} < 500\times$ | Diamond crest, golden rays & heavy coin shower |
| `banner_win_epic` | **EPIC WIN** | $\ge 500\times$ (or Special Award €750) | Full-screen celebration banner with Ghost Symbol rays |

---

## 8. Pay Line Visualization Assets

| Asset ID | Description | Format |
| :--- | :--- | :--- |
| `line_overlay_01` to `17` | Vector paths marking each of the 17 pay lines | SVG Path / Canvas WebGL |
| `line_node_highlight` | Glowing ring wrapping winning symbol positions | PNG / Shader |

---

## 9. Audio Asset Inventory

### 9.1 Background Music (BGM)
* `bgm_basegame_loop`: Russian folk acoustic theme (balalaika + accordion rhythm).
* `bgm_freegame_loop`: Fast-paced, festive dance tempo version of main theme.

### 9.2 Feature & UI Sound Effects (SFX)
* `sfx_spin_button_click`: Mechanical button press.
* `sfx_reel_spin`: Whirring sound of spinning reels.
* `sfx_reel_stop_01` to `05`: Snappy reel stop thuds.
* `sfx_anticipation_reel3`: Rising synth pitch / drum roll on Reel 3.
* `sfx_symbol_win_line`: Chime sound for payline matches.
* `sfx_symbol_upgrade`: Nesting doll pop & higher pitch bell.
* `sfx_scare_bear_roar`: Playful bear growl + pop sound.
* `sfx_charm_bear_magic`: Harp glide with heart popping sounds.
* `sfx_dance_bear_jig`: Accordion short musical sting (Free Spins trigger).
* `sfx_wipe_win_fanfare`: Grand orchestral horn flourish for 15-symbol match.
* `sfx_ghost_jackpot`: Ethereal choir sting + jackpot chime for €750 payout.
* `sfx_countup_loop`: Ticking sound during win counter accumulation.
* `sfx_countup_end`: Final tally splash sound.
---

## Prototype implementation status

> This section was added for the prototype. Everything above is the asset spec, unchanged.

Every asset ID above is a key in [`assets/manifest.js`](../assets/manifest.js). Save a file at its path and reload; anything missing uses a code-drawn placeholder. The handoff checklist with paths and sizes is in [`assets/README.md`](../assets/README.md).

| Section | Status |
| :--- | :--- |
| 2.1 Environment (`bg_base_main`, `bg_base_frame`, `bg_base_reel_strip`) | Wired, with placeholders |
| 2.2 UI / HUD (`ui_bar_bottom`, `btn_spin_*`, `btn_auto_*`, `btn_bet_plus/minus`, `btn_info`, `disp_*`) | Wired. Buttons are drawn in code until images exist; `disp_*` are code components |
| 3.1 Free game (`bg_freegame_main`, `bg_freegame_frame`, `ui_freegame_counter`, `fx_reel3_guaranteed_wild_indicator`) | Wired, with placeholders |
| 4.1 Standard symbols, idle frames (`sym_00_idle` … `sym_06_idle`) | Wired. `_win` and `_upgrade` are code animations until Spine is integrated |
| 4.2 Special symbols (`sym_wild_*`, `sym_bear_*`, `sym_ghost_idle`) | Wired as still images. Spine animations (`bear_scare_1x` etc.) are not integrated yet |
| 5 VFX (`vfx_anticipation_reel3` now uses the supplied golden spiral image; `vfx_star_wild_reveal`, `vfx_symbol_upgrade_burst`, `vfx_scare_bear_wave`, `vfx_charm_bear_hearts`, `vfx_wipe_win_sweep`, `vfx_ghost_transformation`) | Built as code particles and shapes, timed to the animation spec |
| 6 Transitions (`trans_base_to_freegame`, `trans_freegame_to_base`, `overlay_screen_dimmer`) | Built in code |
| 7.1 Free spins modals (`modal_freespins_intro/outro`) | Wired, and art delivered (Festive Win frame, Total Win sign). Text, amount and the START / COLLECT button are drawn on top |
| 7.2 Win banners (`banner_win_nice` … `banner_win_epic`) | Wired, and art delivered for nice, mega, superb, sensational and epic. The image is fitted on screen with the amount below. `banner_win_big` has no art yet |
| 8 Paylines (`line_overlay_01..17`, `line_node_highlight`) | Lines drawn as paths; node ring wired as an image |
| 9 Audio (BGM and all SFX listed) | Wired. Missing SFX use synthesised placeholders; BGM plays only from real files |

**Extras the spec doesn't list:** optional `sym_0x_scared` faces for the Scare Bear, and a sound toggle in the HUD.

**Format note:** the prototype loads PNG, JPG or WebP images and MP3 or WAV audio. Spine (`.json` + `.atlas` + `.png`) and Lottie are not supported yet; see the README's "Next steps".
