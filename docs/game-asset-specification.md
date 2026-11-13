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