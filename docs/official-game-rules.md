# Babushkas — Official Game Rules

> **Note:** Babushkas video slot is referred to as **Babushkas**, **The Game**, or **Game**.

---

## 1. General Game Overview
* **Reels & Paylines:** **Babushkas** is a video slot with 5 reels and 17 fixed pay lines.
* **Core Features:** The game features Wilds, 4 symbol upgrade features, and a bonus game of free spins with guaranteed Wilds.
* **Theoretical Return to Player (RTP):** 95.8%.

---

## 2. Game Play & Operations
* **Starting a Round:** A game round is started with the action button and plays the game with the selected bet level.
* **Bet Locking:** No bets can be altered during a game round.
* **Auto Play:** Auto play plays the game automatically for the number of game rounds selected in the auto play page. *(Note: This feature may not be available in all jurisdictions/configurations).*
* **Malfunction Clause:** In the event of game malfunction, all affected bets and pays are rendered void.

---

## 3. Definitions & Core Upgrade Mechanics

### 3.1 Symbol Upgrade
* A **"symbol upgrade"** or **"upgrade"** occurs when a symbol is replaced with the next symbol of a higher paytable value.

### 3.2 Win Symbol Upgrade
* All winning symbols of a specific rank will be upgraded if doing so creates either new or longer paylines.

---

## 4. Wild Symbol & Mystery Bear Features

### 4.1 Wild Substitutions
* Wilds substitute for any other symbol.
* **Reel Position:** The Wild symbol can appear on the middle reel (Reel 3).
* **Feature Trigger:** When landing, it may randomly trigger any of the following features: **Scare Bear**, **Charm Bear**, or **Dance Bear**.

### 4.2 Mystery Bear Modifiers
* **Scare Bear:** All of the lowest valued symbols on screen will be upgraded. This upgrade process may repeat 1 to 3 times.
* **Charm Bear:** All symbols currently on screen will be upgraded once.
* **Dance Bear:** Awards Free Spins. During Free Spins, the Wild symbol will appear on every single spin.

---

## 5. Free Spins Bonus Game
* **Bet Consistency:** The bonus game is played with the same bet as the spin that triggered the bonus game.
* **Round Continuity:** The bonus game is part of the same game round as the spin that triggered it.
* **Guaranteed Wild:** A Wild symbol is guaranteed to land on the middle reel on every free spin.

---

## 6. Wipe Win & Special Win Conditions

### 6.1 Wipe Win
* If all 15 symbols on the screen are the same when all win symbol upgrades are done, they will upgrade once more.

### 6.2 Special Win
* If the **Wipe Win** condition applies to the highest valued symbol, a special win is awarded according to the paytable.

---

## 7. Payout Rules & Line Calculations
* All game payouts and win combinations are paid out according to the paytable.
* **Line Evaluation:** Only the highest win per payline is paid out, provided symbols appear in sequence from leftmost to right with no gaps and in combinations according to the paytable.
* **Total Payout Presentation:** All payline wins accumulated during a game round are added and presented at the end of the game round.
---

## Prototype implementation status

> This section was added for the prototype. Everything above is the official rules text, unchanged.

| Rule | Status | Where |
| :--- | :--- | :--- |
| 5 reels, 17 fixed lines, highest win per line, left to right, no gaps | Implemented | `src/engine.js` → `evaluate`, `resolveSpin` |
| Win symbol upgrade only when it creates new or longer lines | Implemented. Each value is tested on its own; all qualifying values upgrade together | `resolveSpin` → `newOrLonger` |
| Wild on the middle reel, substitutes for all symbols | Implemented | `CONFIG.wildReel`, `evaluate` |
| Wild may trigger Scare / Charm / Dance Bear on landing | Implemented. Shown as a star on the landed Wild; chance `CONFIG.starChance` | `resolveSpin` step 1 |
| Scare Bear upgrades the lowest symbols 1–3 times | Implemented. Small, medium or large bear | `applyBear` |
| Charm Bear upgrades all symbols once | Implemented | `applyBear` |
| Free spins with the triggering bet, same round, guaranteed Wild | Implemented | `src/game.js` → `freeSpins` |
| Wipe: 15 identical symbols upgrade once more | Implemented. Wild counts as matching; once per spin (assumptions) | `resolveSpin` |
| Special win when the wipe applies to the highest symbol | Implemented. 100× bet | `CONFIG.specialWin` |
| Wins accumulated and presented at the end of the round | Implemented. The HUD win box shows the running round total, which is added to the balance when the round ends | `play` |
| Bets locked during a round | Implemented. Bet buttons are disabled while busy | `drawHUD`, input handler |
| Autoplay | Implemented as on/off. The round-count page is not built yet | `autoplayLoop` |
| Malfunction clause | Not applicable to the prototype | |
