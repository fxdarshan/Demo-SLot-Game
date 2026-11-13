# Babushkas — Animation Timing & Sequence Specifications

This document defines the exact timings, frame counts, keyframe behaviors, and state flows for all animations in **Babushkas**.

> **Global Target Frame Rate:** `30 FPS` (1 second = 30 frames). All duration values are locked to this framerate.

## 1. Global Frame Rate & Timing Standard

| Metric | Target Standard | Equivalent in Frames (at 30 FPS) | 
| ----- | ----- | ----- | 
| **Global FPS** | `30.0 FPS` | 30 Frames / Second | 
| **Frame Duration** | `33.33 ms` | 1 Frame | 
| **Standard Symbol Win** | `1.50 sec` | 45 Frames | 
| **Anticipation Duration** | `2.00 sec` | 60 Frames | 
| **Standard Banner Total** | `5.00 sec` | 150 Frames (30f In + 90f Loop + 30f Out) | 
| **Big Win Banner Total** | `5.00 sec` | 150 Frames (30f In + 90f Tally/Loop + 30f Out) | 

## 2. Environment & Background Loops

### 2.1 Base Game Ambient Loop (`bg_base_loop`)

* **Tone:** Subtle, warm, folk lace craft aesthetic.

* **Duration:** `4.00 seconds` (120 frames continuous loop).

* **Keyframes & Motion:**

  * **Frames 0–60:** Gentle pulsing breathing glow on background wooden ornaments (`scale: 1.0` to `1.02`, `opacity: 0.85` to `1.0`).

  * **Frames 60–120:** Return smoothly to base state for seamless 360-degree loop.

### 2.2 Free Game (Bonus Round) Ambient Loop (`bg_freegame_loop`)

* **Tone:** Energetic, glamorous, celebratory, high-tempo illumination.

* **Duration:** `3.00 seconds` (90 frames continuous loop).

* **Keyframes & Motion:**

  * **Layer 1 (Lights):** Festive party light bulbs along frame border cycling back-and-forth across red/gold hues (Cycle: 30 frames).

  * **Layer 2 (Particles):** Golden sparkle emitter showering downward over the frame (Continuous particle flow at 30 FPS).

  * **Layer 3 (Reel 3 Highlight):** Pulsing golden glow outline around middle reel to emphasize guaranteed Wilds (`opacity: 0.5` to `1.0`, 45-frame sine wave).

## 3. Symbol Animations

All standard symbols (Tiers 0–6) share synchronized frame structures to ensure visual alignment across pay lines during multi-symbol wins.

### 3.1 Standard Symbol Win & Upgrade (`sym_xx_win`, `sym_xx_upgrade`)

* **Total Duration:** `1.50 seconds` (45 frames)

```
[00f - 10f] Pop-out & Scale  --> [10f - 30f] Main Action / Open Nest  --> [30f - 45f] Settle / Morph
   (Scale 1.0 -> 1.15)              (Doll opens / Win particle FX)         (Upgrades to next tier)

```

| Phase | Frame Range | Duration | Keyframe Action | 
| ----- | ----- | ----- | ----- | 
| **Anticipation Pop** | Frames 00–10 | 0.33s (10f) | Symbol scales up from `1.0` to `1.15` with ease-out curve. | 
| **Main Action / Nest Open** | Frames 10–30 | 0.67s (20f) | Outer Babushka shell opens up to reveal inner character/glow. Win highlight particle burst emits. | 
| **Settle & Morph** | Frames 30–45 | 0.50s (15f) | Symbol morphs into the upgraded tier doll (if upgrading) or scales smoothly back down to standard size (`1.0`). | 

### 3.2 Wild Symbol Landing & Mystery Opening (`sym_wild_star_open`)

* **Total Duration:** `1.50 seconds` (45 frames)

  * **Frames 00–15 (0.5s):** Wild Egg lands on Reel 3 with slight squall/bounce (`scaleY: 0.85` to `1.0`).

  * **Frames 15–35 (0.67s):** Star emblem on front shell ignites into bright flash; top half of egg hatches open.

  * **Frames 35–45 (0.33s):** Revealed Bear character emerges into idle stance.

## 4. Anticipation Effects

### 4.1 Reel 3 Wild Anticipation (`vfx_anticipation_reel3`)

* **Total Duration:** `2.00 seconds` (60 frames)

* **Trigger:** Initiated when Reels 1 and 2 land conditions primed for Reel 3 Wild landing.

```
[00f - 15f] Intro Ramp-Up  --> [15f - 45f] High Voltage Sustained Loop  --> [45f - 60f] Slam Stop / Reveal
   (Slow reel spin + Glow)            (Gold aura particles & drumroll)        (Wild lands or reel stops)

```

| Phase | Frame Range | Duration | Description | 
| ----- | ----- | ----- | ----- | 
| **Ramp-Up** | Frames 00–15 | 0.50s (15f) | Reel 3 spin slows down slightly; golden border aura ramps `opacity: 0` to `1.0`. | 
| **Sustained Loop** | Frames 15–45 | 1.00s (30f) | Intense electrical sparkle particles emit around Reel 3 column. | 
| **Snap / Slam Stop** | Frames 45–60 | 0.50s (15f) | Reel 3 snaps to a stop; flash burst dissolves anticipation border. | 

## 5. Mystery Bear Feature Animations

When the Wild Star symbol reveals a feature, the sequence timing follows these locked structures:

### 5.1 Scare Bear Sequence (`sym_bear_scare`)

* **Small Bear (1 Upgrade):** `1.50 sec` (45 frames)

* **Medium Bear (2 Upgrades):** `2.25 sec` (67 frames)

* **Large Bear (3 Upgrades):** `3.00 sec` (90 frames)

* **Timing Pattern:** Each upgrade wave step consumes `0.75 sec` (22.5 frames), performing a roar shockwave (`vfx_scare_bear_wave`) that triggers the lowest-tier symbols on screen to morph.

### 5.2 Charm Bear Sequence (`sym_bear_charm`)

* **Total Duration:** `2.00 seconds` (60 frames)

  * **Frames 00–20 (0.67s):** Charm Bear blows a kiss, spawning heart particles.

  * **Frames 20–45 (0.83s):** Floating hearts sweep across all 15 reel positions simultaneously.

  * **Frames 45–60 (0.50s):** All 15 symbols upgrade +1 level in unison with a shimmer burst (`vfx_charm_bear_hearts`).

### 5.3 Dance Bear / Free Spins Trigger (`sym_bear_dance`)

* **Total Duration:** `2.50 seconds` (75 frames)

  * **Frames 00–45 (1.50s):** Bear pulls out an accordion and plays a musical riff; music note particles float outward.

  * **Frames 45–75 (1.00s):** Seamless transition into the **Free Spins Trigger Banner Popup**.

### 5.4 Wipe Feature & Ghost Transformation Sequence (`vfx_wipe_win_sweep`)

* **Total Duration:** `3.00 seconds` (90 frames)

  * **Frames 00–30 (1.00s):** All 15 matching symbols lock in place with a golden frame pulsing across the entire 5x3 grid.

  * **Frames 30–60 (1.00s):** Full-screen gold flash sweeps across the board; symbols morph simultaneously up +1 tier.

  * **Frames 60–90 (1.00s):** If upgraded from Tier 0 (Yellow), ethereal green light transforms symbols into the **Ghost Symbol** with the €750.00 win burst display.

## 6. Pop-up Banners & Modals (Free Games)

All overlay banners follow a strictly structured **3-Phase Timing Rule**:

$$
\text{Total Duration (5.0s)} = \text{Intro (1.0s)} + \text{Sustained Hold/Loop (3.0s)} + \text{Outro (1.0s)}
$$

### 6.1 Free Game Trigger Banner (`banner_fg_trigger`)

* **Total Duration:** `5.00 seconds` (150 frames at 30 FPS)

```
[00f - 30f] Intro Fade/Scale  --> [30f - 120f] Idle Loop & Particle Flare  --> [120f - 150f] Outro Exit
   (Scale 0 -> 1.0, Ease-Out)          ("CONGRATULATIONS - 7 FREE SPINS")        (Scale 1.0 -> 1.2, Fade 0)

```

| Phase | Frame Range | Duration | Keyframe Breakdown | 
| ----- | ----- | ----- | ----- | 
| **Intro** | Frames 00–30 | 1.00s (30f) | Screen darkens (`dimmer: 70% opacity`). Banner flies in from center with elastic ease (`scale: 0.0` to `1.0`). | 
| **Hold / Loop** | Frames 30–120 | 3.00s (90f) | Text *"CONGRATULATIONS - YOU WON 7 FREE SPINS"* pulses gently (`scale: 1.0` to `1.04`). Ribbon glitters with light rays. | 
| **Outro** | Frames 120–150 | 1.00s (30f) | Banner expands slightly (`scale: 1.15`) and fades out (`opacity: 1.0` to `0.0`). Triggers environment transition to Free Game background. | 

### 6.2 Free Game Conclusion Banner (`banner_fg_summary`)

* **Total Duration:** `5.00 seconds` (150 frames at 30 FPS)

| Phase | Frame Range | Duration | Keyframe Breakdown | 
| ----- | ----- | ----- | ----- | 
| **Intro** | Frames 00–30 | 1.00s (30f) | Modal drops down from top of screen (`translateY: -100%` to `0%`). | 
| **Count-up / Hold** | Frames 30–120 | 3.00s (90f) | Total win tally counter counts up rapidly from `€0.00` to `€XXX.XX` over 75 frames (2.5s), holding for final 15 frames. Banner header displays *"TOTAL WIN: €XXX IN 7 FREE SPINS"*. | 
| **Outro** | Frames 120–150 | 1.00s (30f) | Modal shrinks and fades out (`scale: 0.8`, `opacity: 0`), releasing player back to Base Game ambient screen. | 

## 7. Big Win Banners (Multiplier Multi-Tier System)

Big Win banners activate upon exceeding bet multiplier thresholds. All tiers share the **5-Second Total Duration Standard** (30f Intro, 90f Counter & FX Loop, 30f Outro) at 30 FPS, with scaling visual complexity per tier.

### 7.1 Big Win Tiers Overview

| Big Win Tier | Win Multiplier | Text Label | Primary Color Theme | VFX Highlights | 
| ----- | ----- | ----- | ----- | ----- | 
| **Nice Win** | `≥ 25x Bet` | **NICE WIN!** | Bronze / Warm Gold | Coin fountain + soft sparkle stream | 
| **Mega Win** | `≥ 50x Bet` | **MEGA WIN!** | Bright Gold & Ruby | Double coin fountain + banner pulse | 
| **Superb Win** | `≥ 100x Bet` | **SUPERB WIN!** | Emerald & Gold | Fireworks rockets + side confetti cannons | 
| **Sensational Win** | `≥ 250x Bet` | **SENSATIONAL!** | Amethyst Purple & Gold | Laser beam sweeps + dense confetti burst | 
| **Epic Win** | `≥ 500x Bet` | **EPIC WIN!** | Diamond Blue & Platinum Gold | Full-screen fireworks + continuous coin rain | 

### 7.2 Detailed Timing Breakdown for Big Win Banners

```
Timeline (30 FPS / Total 150 Frames):
|--- 00f - 30f (1.0s) ---|--------------- 30f - 120f (3.0s) ---------------|--- 120f - 150f (1.0s) ---|
     SLOT / BANNER IN                 WIN VALUE TALLY COUNT-UP                     BANNER DISSOLVE
    (Zoom + Sound Blast)               & FIREWORKS PARTICLE LOOP                   & COIN SWEEP OUT

```

| Phase | Frame Range | Frame Count | Duration | Technical Action & Visual State | 
| ----- | ----- | ----- | ----- | ----- | 
| **Banner Intro** | Frames 00–30 | 30 frames | `1.00 sec` | Dark overlay fades in (`rgba(0,0,0,0.75)`). Banner text slams into screen with spring overshoot (`scale: 0` $\rightarrow$ `1.2` $\rightarrow$ `1.0`). Sound impact cue triggers at Frame 15. | 
| **Tally Count-Up & Loop** | Frames 30–120 | 90 frames | `3.00 sec` | Win numeric tally rolls up from `€0.00` to final amount (Frames 30–105). Ribbon animation loops smoothly at 30 FPS. Tier-specific particles (coins/fireworks) emit continuously. | 
| **Banner Outro** | Frames 120–150 | 30 frames | `1.00 sec` | Accumulated win amount snaps to main HUD win box (`disp_win`). Banner zooms out upward (`scale: 1.3`, `opacity: 0`). Dark overlay fades out. | 

## 8. Master Animation Timing Quick Reference Sheet

| Asset ID | Category | Total Sec | Frames (30 FPS) | Intro (Frames) | Loop/Action (Frames) | Outro (Frames) | 
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | 
| `bg_base_loop` | Environment | 4.00s | 120f | — | 120f | — | 
| `bg_freegame_loop` | Environment | 3.00s | 90f | — | 90f | — | 
| `sym_xx_win` | Symbol | 1.50s | 45f | 10f | 20f | 15f | 
| `sym_xx_upgrade` | Symbol | 1.50s | 45f | 10f | 20f | 15f | 
| `vfx_anticipation_reel3` | FX | 2.00s | 60f | 15f | 30f | 15f | 
| `bear_scare_1x` | Feature | 1.50s | 45f | 10f | 25f | 10f | 
| `bear_charm` | Feature | 2.00s | 60f | 15f | 30f | 15f | 
| `bear_dance` | Feature | 2.50s | 75f | 15f | 45f | 15f | 
| `vfx_wipe_win_sweep` | Feature | 3.00s | 90f | 30f | 30f | 30f | 
| `trans_base_to_freegame` | Transition | 2.50s | 75f | 15f | 45f | 15f | 
| `banner_fg_trigger` | Modal Banner | 5.00s | 150f | 30f | 90f | 30f | 
| `banner_fg_summary` | Modal Banner | 5.00s | 150f | 30f | 90f | 30f | 
| `banner_bigwin_nice` | Big Win Banner | 5.00s | 150f | 30f | 90f | 30f | 
| `banner_bigwin_mega` | Big Win Banner | 5.00s | 150f | 30f | 90f | 30f | 
| `banner_bigwin_superb` | Big Win Banner | 5.00s | 150f | 30f | 90f | 30f | 
| `banner_bigwin_sensational` | Big Win Banner | 5.00s | 150f | 30f | 90f | 30f | 
| `banner_bigwin_epic` | Big Win Banner | 5.00s | 150f | 30f | 90f | 30f | 

---

## Prototype implementation status

> This section was added for the prototype. Everything above is the animation spec, unchanged.

Every frame count above is stored in `CONFIG.frames` (`src/config.js`) and played at 30 fps. The demo panel's speed slider scales them all together. Animations are currently drawn in code (`src/game.js`); Spine files will replace them later.

| Asset ID | Status | Notes |
| :--- | :--- | :--- |
| `bg_base_loop` | Implemented | Ornament layer breathes scale 1.0 → 1.02, opacity 0.85 → 1.0. With real art, the whole `bg_base_main` breathes |
| `bg_freegame_loop` | Implemented | Lights alternate red/gold every 30f, gold sparkles fall, reel 3 outline pulses on a 45f sine |
| `sym_xx_win` / `sym_xx_upgrade` | Implemented | 10f scale to 1.15, 20f nest opens (lid lifts, glow, particle burst), 15f morph or settle |
| `sym_00_win` (Santa) | Implemented as a sprite sheet | The supplied 16-frame sheet plays one pass (about 2.8 ticks, 94 ms per frame) over the same 45f window instead of the scale pulse, ending on the last frame. Santa is the top tier, so he never upgrades mid-win. Other symbols keep the pulse until they get a sheet |
| `sym_wild_star_open` | Implemented | 15f landing squash, 20f star flash and hatch, 10f bear emerges |
| `vfx_anticipation_reel3` | Partly | Aura ramp, sustained sparks and slam-stop flash are in. The slight reel slowdown is not; the reel keeps full speed |
| `bear_scare_1x/2x/3x` | Implemented | 11.25f intro + one 22.5f roar wave per upgrade + 11.25f outro = 45 / 67.5 / 90f |
| `bear_charm` | Implemented | 20f kiss hearts, 25f hearts fly to all 15 positions, 15f shimmer upgrade |
| `bear_dance` | Implemented | 45f accordion riff with notes, 30f hand-over. The trigger banner follows once the spin's wins finish |
| `vfx_wipe_win_sweep` | Implemented | 30f gold frame lock, 30f flash sweep with column-by-column morph, 30f green ghost transform and win burst (or settle) |
| `trans_base_to_freegame` | Implemented | Accordion curtain: 15f close, 45f hold (scene swapped), 15f open |
| `trans_freegame_to_base` | Implemented | 60f camera zoom-out (1.08 → 1.0) with background dissolve |
| `banner_fg_trigger` | Implemented | 70% dimmer, elastic scale-in, pulse 1.0–1.04 with rays and glitter, outro scale 1.15 and fade. START continues (auto-continue on by default: `CONFIG.autoContinueModals`) |
| `banner_fg_summary` | Implemented | Drops in from the top, 75f count-up, holds, shrinks to 0.8 and fades. COLLECT continues. When the 390× cap ends the round it reads "MAX WIN 390× REACHED" |
| `banner_win_*` | Implemented | 75% dimmer, slam 0 → 1.2 → 1.0, impact cue at frame 15, tally frames 30–105, snap to HUD, zoom out to 1.3 and fade |

**Reviewing every banner:** the cheat menu (**C**, see [`cheats.md`](cheats.md)) has an *All win banners* scenario and hotkeys `1`–`6` that show each banner tier on demand.

**Win tiers:** section 7.1 lists five tiers from 25×. The asset spec (section 7.2) lists six tiers from 15×, and the prototype uses the asset spec. See `CONFIG.winTiers`.
