/*
 * Game configuration: maths, timing and presentation switches.
 * The engine (engine.js) reads only this object, so the same file drives the
 * browser game and the Node simulator (tools/simulate.js).
 *
 * Sources:
 *   RULES  docs/official-game-rules.md
 *   PAY    docs/pay-table.md
 *   GDD    docs/reference-gdd.md
 *   TUNED  not published; tuned with tools/simulate.js to hit the published RTP / frequencies
 */
(function (root) {
  const CONFIG = {
    title: 'NESTING DOLLS',

    // ---------------------------------------------------------------- grid
    reels: 5,
    rows: 3,
    wildReel: 2,                       // RULES: Wild only on the middle reel (0-based index 2)

    // Symbol ids. Level 7 (Teal, lowest value) .. Level 1 (Yellow, highest value).
    // GHOST = 0 is the special-win end state, WILD = 9 is the egg.
    GHOST: 0,
    WILD: 9,
    levels: [7, 6, 5, 4, 3, 2, 1],
    symbolNames: {
      7: 'Teal Doll (pacifier)', 6: 'Blue Doll', 5: 'Purple Doll', 4: 'Pink Doll',
      3: 'Red Doll', 2: 'Orange Doll (glasses)', 1: 'Yellow Doll (grandmother)', 9: 'Wild Egg', 0: 'Ghost'
    },

    // ------------------------------------------------------------ paylines (PAY section 6)
    // Row index per reel: 0 Top, 1 Middle, 2 Bottom.
    paylines: [
      [1, 1, 1, 1, 1],  //  1 M M M M M
      [0, 0, 0, 0, 0],  //  2 T T T T T
      [2, 2, 2, 2, 2],  //  3 B B B B B
      [1, 1, 0, 1, 1],  //  4 M M T M M
      [1, 1, 2, 1, 1],  //  5 M M B M M
      [0, 0, 1, 0, 0],  //  6 T T M T T
      [2, 2, 1, 2, 2],  //  7 B B M B B
      [0, 1, 1, 1, 0],  //  8 T M M M T
      [2, 1, 1, 1, 2],  //  9 B M M M B
      [1, 2, 2, 2, 1],  // 10 M B B B M
      [0, 1, 0, 1, 0],  // 11 T M T M T
      [1, 2, 1, 2, 1],  // 12 M B M B M
      [1, 0, 1, 0, 1],  // 13 M T M T M
      [2, 1, 2, 1, 2],  // 14 B M B M B
      [0, 2, 0, 2, 0],  // 15 T B T B T
      [2, 0, 2, 0, 2],  // 16 B T B T B
      [1, 0, 2, 0, 1]   // 17 M T B T M
    ],

    // ------------------------------------------------------------ paytable (PAY section 1)
    // Multiplier of TOTAL bet per line. The pay table lists euros at a €7.50 bet
    // (Ghost special €750 = 100x), so each value here is the euro amount / 7.5.
    paytable: {
      1: { 3: 0.50, 4: 1.00, 5: 2.00 },   // Yellow  €3.75 / €7.50 / €15.00
      2: { 3: 0.40, 4: 0.80, 5: 1.50 },   // Orange  €3.00 / €6.00 / €11.25
      3: { 3: 0.30, 4: 0.60, 5: 1.00 },   // Red     €2.25 / €4.50 / €7.50
      4: { 3: 0.20, 4: 0.40, 5: 0.80 },   // Pink    €1.50 / €3.00 / €6.00
      5: { 3: 0.20, 4: 0.40, 5: 0.70 },   // Purple  €1.50 / €3.00 / €5.25
      6: { 3: 0.10, 4: 0.20, 5: 0.50 },   // Blue    €0.75 / €1.50 / €3.75
      7: { 3: 0.10, 4: 0.20, 5: 0.40 }    // Teal    €0.75 / €1.50 / €3.00
    },
    specialWin: 100,                   // PAY 5.2: Ghost special win €750 at €7.50 bet = 100x

    // Symbol weights for random stops (TUNED). Each cell is drawn independently;
    // the Wild weight only applies on wildReel.
    weights: { 7: 21, 6: 21, 5: 20, 4: 20, 3: 20, 2: 19, 1: 19, 9: 3.7 },

    // ------------------------------------------------------------- bears (RULES 4, PAY 3)
    // A landed Wild shows a star with this chance; a star means it opens to a bear (TUNED).
    starChance: 0.29,
    starChanceFreeSpins: 0.08,
    bearWeights: { scare: 46, charm: 15, dance: 39 },               // TUNED
    bearWeightsFreeSpins: { scare: 62, charm: 30, dance: 8 },       // TUNED
    // Scare Bear size sets how many times the lowest symbols upgrade (PAY 3.1)
    scareSizes: { 1: 50, 2: 33, 3: 17 },                             // small / medium / large, weights TUNED

    // ---------------------------------------------------------- free spins (PAY 3.3, RULES 5)
    freeSpins: 7,
    freeSpinsRetrigger: true,          // ASSUMED: a Dance Bear during free spins adds 7 more
    guaranteedWildInFreeSpins: true,

    // ------------------------------------------------------------ wipe (RULES 6, PAY 5)
    // When all 15 symbols are the same after all win upgrades, they upgrade once more.
    // 15 Yellows upgrade to Ghosts and pay the special win.
    wipeCountsWild: true,              // ASSUMED: Wild positions count as "the same" (else free spins could never wipe)

    maxWin: 390,                       // GDD: cap per round (base spin + any free spins it triggers)

    // ---------------------------------------------------------------- money
    bets: [0.10, 0.20, 0.50, 1, 2, 5, 7.5, 10, 20, 50, 100],  // GDD min / max
    defaultBetIndex: 7,
    startBalance: 1000,
    currency: '€',

    winTiers: { big: 10, mega: 25, epic: 50 },   // celebration thresholds, x bet (ASSUMED)

    // --------------------------------------------------------------- timing (seconds, GDD section 6)
    timing: {
      spinBase: 1.5,
      reelGap: 0.25,
      symbolSpeed: 22,
      bounce: 1.2,
      winShow: 0.9,
      pop: 0.5,
      eggWobble: 1.2,
      bearReveal: 0.5,
      bearEffect: 1.0,
      fsTransition: 2.5,
      wipeTransform: 1.7,
      wipeExecute: 1.3,
      bigWin: 3.5,
      betweenAutoSpins: 0.5
    },

    showLevelBadges: true,    // small "L5" tags on placeholder dolls only
    stage: { landscape: [1920, 1080] }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
  else root.CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
