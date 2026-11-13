# Game Design Document (GDD)
## Project Title: Babushkas
**Developer:** Thunderkick  
**Engine & Tech:** HTML5 Canvas, WebGL, Low-overhead mobile rendering  
**Release Date:** August 2016  
**Document Version:** 1.0 (Full Technical & Gameplay Specification)

---

## 1. Executive Summary & Core Concept

**Babushkas** is a 5-reel, 3-row, 17-line video slot designed around traditional Slavic Matryoshka nesting dolls. The game features a tactile, knitted textile aesthetic with a lighthearted Slavic folk soundscape. 

Unlike conventional slots that use cascading reel drops or simple static paylines, *Babushkas* introduces an **In-Place Symbol Evolution** mechanism. Winning symbols do not vanish; instead, they "pop" open to reveal a smaller, higher-value doll contained within. This creates multi-stage chain reactions from a single base spin.

---

## 2. Technical & Mathematical Architecture

### 2.1 Key Parameters

| Metric | Value | Notes |
| :--- | :--- | :--- |
| **Grid Dimensions** | 5 Reels × 3 Rows | Standard matrix layout |
| **Paylines** | 17 | Fixed payline structure |
| **Theoretical RTP** | 95.80% | Measured over long-term simulation |
| **Volatility** | Low | High hit frequency, lower top-end payout scale |
| **Hit Frequency** | 29.80% | ~3 out of 10 spins yield a winning combination |
| **Free Spins Frequency** | ~1 in 118 spins | ~0.85% trigger chance per base spin |
| **Max Win Exposure** | 390× Total Bet | Strictly capped top end |
| **Min / Max Bet** | $0.10 / $100.00 | Adjustable base stake limits |

### 2.2 Win Evaluation Logic
Wins pay left to right on adjacent reels across the 17 fixed paylines, starting from Reel 1. Evaluation occurs sequentially after each symbol upgrade tier.

---

## 3. Symbol Hierarchy & Paytable Mechanics

### 3.1 Inverted Value Model
The payout system operates on an inverted hierarchy: **the smaller the nesting doll, the higher its value**.

```
[Level 7: Blue]  -->  [Level 6: Green]  -->  [Level 5: Purple]  -->  [Level 4: Purp/Red]
      0.4x                   0.5x                   0.7x                   0.8x
                                                                             │
[Level 0: Ghost] <--  [Level 1: Yellow] <--  [Level 2: Orange] <--  [Level 3: Red]
   Wipe Win (100x)           2.0x                   1.5x                   1.0x
```

### 3.2 Detailed Paytable (5-of-a-Kind Payouts)

| Symbol Tier | Visual Description | 5-of-a-Kind Payout (Multiplier of Total Bet) |
| :--- | :--- | :--- |
| **Level 7** | Largest Outer Blue Doll with Dummy | **0.4×** |
| **Level 6** | Green Doll | **0.5×** |
| **Level 5** | Purple Doll | **0.7×** |
| **Level 4** | Purple/Red Doll | **0.8×** |
| **Level 3** | Red Doll | **1.0×** |
| **Level 2** | Orange Doll with Glasses | **1.5×** |
| **Level 1** | Smallest Yellow Doll (Eyes Closed) | **2.0×** |
| **Level 0** | Ghost Symbol (Wipe Win State) | **100× Flat Bonus** (on board clear) |

### 3.3 Special Symbols

* **Wild Egg Symbol:** Appears **exclusively on Reel 3** (center column). Acts as a standard Wild substitute for all standard doll symbols. When participating in a winning line, it activates one of three **Mystery Bear** features.
* **Ghost Symbol:** A special end-state symbol triggered only during a full-board Wipe Win event.

---

## 4. Feature Mechanics & Triggers

### 4.1 Symbol Upgrade Chain Reaction
1. **Trigger:** Any 3-, 4-, or 5-of-a-kind payline win during base play or free spins.
2. **Execution:** 
   - Each winning doll pops open in its grid position, advancing to the next higher-value doll tier (e.g., Green $\rightarrow$ Purple).
   - The game re-evaluates all 17 paylines across the grid.
3. **Chain State:** If upgraded symbols form *new* or improved line wins, those winning symbols pop open again to the next tier.
4. **Termination:** The sequence ends when no new winning lines exist, or when all winning symbols reach Level 1 (Yellow).

### 4.2 Mystery Bear Modifiers (Wild Egg Hatching)
* **Trigger:** The Wild Egg symbol lands on Reel 3 and forms part of a valid payline win.
* **Hatch Logic:** The egg wobbles, cracks open, and randomly unleashes one of three bear modifiers:

#### A. Scare Bear
* **Effect:** Upgrades the lowest-value symbol(s) currently visible on the entire grid by 1, 2, or 3 levels.
* **Design Goal:** Consolidates board state to create larger multi-symbol matching groups.

#### B. Charm Bear
* **Effect:** Upgrades **all** symbols currently on the reels by exactly 1 level simultaneously.
* **Design Goal:** Instant global value boost and payline re-evaluation.

#### C. Dance Bear (Free Spins Trigger)
* **Effect:** Awards **7 Free Spins**.

### 4.3 Dance Bear Free Spins Round
* **Trigger:** Revealed from the Wild Egg via the Dance Bear modifier.
* **Spin Count:** 7 spins.
* **Guaranteed Central Wild:** **On every single free spin, a Wild Egg is guaranteed to occupy Reel 3.**
* **Impact:** Guarantees a persistent Wild on every spin, drastically increasing hit frequency, chain-reaction triggers, and secondary Mystery Bear hatches.

### 4.4 Wipe Win Sequence
* **Trigger:** All 15 positions on the grid become occupied by the top-tier Level 1 Yellow Doll.
* **Execution:**
  1. All 17 active paylines pay out their maximum 5-of-a-kind Level 1 Yellow Doll rewards ($17 \times 2.0\text{x} = 34\text{x}$ base).
  2. A dramatic pause occurs as all 15 Yellow Dolls transform simultaneously into Level 0 **Ghosts**.
  3. The screen is wiped, and a flat **100× Total Bet** bonus is awarded on top of the line payouts.

---

## 5. Game Loop & State Flow Diagram

```
                       ┌─────────────────────────┐
                       │     Player Spin         │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │   Reels Stop (R1-R5)    │
                       └────────────┬────────────┘
                                    │
                      Is there a Payline Win?
                               /         \
                             NO           YES
                            /               \
                           ▼                 ▼
                 ┌───────────────┐   ┌───────────────────────────┐
                 │  Spin Ends    │   │  Pop Winning Symbols +1   │
                 └───────────────┘   └─────────────┬─────────────┘
                                                   │
                                     Does Win Include Reel 3 Wild Egg?
                                              /            \
                                            NO              YES
                                           /                  \
                                          ▼                    ▼
                                ┌──────────────────┐  ┌──────────────────┐
                                │ Re-Evaluate Grid │  │ Hatch Mystery    │
                                └────────┬─────────┘  │ Bear Modifier    │
                                         │            └────────┬─────────┘
                           New Wins Formed?                    │
                                /        \                     ▼
                              YES         NO          ┌──────────────────┐
                               /            \         │ Apply Scare/     │
                              └──────┐       │        │ Charm/Dance Bear │
                                     │       │        └────────┬─────────┘
                                     ▼       ▼                 │
                              [Loop Upgrade] [Pay Total Win] ◄─┘
```

---

## 6. Animation, Sound, & Pacing Matrix

| Gameplay Event | Visual Animation | Audio Element | Timing Duration |
| :--- | :--- | :--- | :--- |
| **Base Spin Cycle** | Reels spin smoothly with motion blur. | Mechanical spin sound. | 1.5s – 2.0s |
| **Sequential Stop** | Left-to-right reel locking with a soft doll "bounce." | Soft wooden thud per reel lock. | 0.2s – 0.3s per reel |
| **Symbol Upgrade ("Pop")** | Doll opens, top half lifts off, inner doll expands. | Wooden snap / fabric pop sound. | ~0.5s per symbol tier |
| **Wild Egg Anticipation** | Wild Egg on Reel 3 wobbles/shakes in place. | Low-pitch tension rattle. | 1.0s – 1.5s |
| **Bear Reveal** | Egg splits, Bear character springs out. | Upbeat synth sound / accordion flourish. | ~0.5s |
| **Free Spin Transition** | Background lighting shifts tone, UI frame lights up. | Upbeat Slavic balalaika musical shift. | 2.0s – 3.0s |
| **Wipe Win Transformation** | Yellow dolls turn transparent ghost-white in unison. | Ethereal chime / gong effect. | 1.5s – 2.0s |
| **Wipe Win Execution** | Screen wipes clean; 100x bonus UI badge slams in. | Heavy brass hit & cheer audio. | 1.0s – 1.5s |
| **Big Win Presentation** | Counter counts up with light knitted coin particles. | Celebratory folk music clip. | 3.0s – 4.0s (kept brief) |

---

## 7. User Interface (UI) & Art Direction

### 7.1 Visual Palette & Style
* **Theme:** Handcrafted Russian folk art with knitted, tactile textures.
* **Color Scheme:** Soft pastel backgrounds (lavenders, mint greens, warm pinks) contrasting against brightly painted doll symbols.
* **Focus Point:** Central Reel (Reel 3) highlighted visually to draw focus toward the Wild Egg mechanics.

### 7.2 UI Layout Architecture
* **Top Bar:** Balance display, Win display.
* **Central Area:** 5×3 Grid with subtle stitch-pattern payline markers.
* **Bottom Bar:** 
  * Bet Adjustment controls ($0.10 to $100.00).
  * Autoplay control.
  * Spin Button (central wood/knitted button motif).
  * Game Rules & Paytable menu buttons.