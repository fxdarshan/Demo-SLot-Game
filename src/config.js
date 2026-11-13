/*
 * Game configuration: maths, timing and presentation switches.
 * Everything a designer is likely to tune lives here. The engine (engine.js)
 * reads only this object, so the same file drives the browser game and
 * the Node simulator (tools/simulate.js).
 *
 * Values marked "GDD" come from docs/reference-gdd.md.
 * Values marked "ASSUMED" are not in the GDD and are prototype guesses.
 */
(function (root) {
  const CONFIG = {
    title: 'NESTING DOLLS',            // shown when no logo image is supplied

    // ---------------------------------------------------------------- grid
    reels: 5,                          // GDD
    rows: 3,                           // GDD
    wildReel: 2,                       // GDD: Wild Egg only on reel 3 (0-based index 2)

    // Symbol ids. Levels 7 (largest, lowest value) .. 1 (smallest, highest value).
    // GHOST = 0 is the wipe-win end state, WILD = 9 is the egg.
    GHOST: 0,
    WILD: 9,
    levels: [7, 6, 5, 4, 3, 2, 1],

    symbolNames: {
      7: 'Blue Doll', 6: 'Green Doll', 5: 'Purple Doll', 4: 'Purple/Red Doll',
      3: 'Red Doll', 2: 'Orange Doll', 1: 'Yellow Doll', 9: 'Wild Egg', 0: 'Ghost'
    },

    // ------------------------------------------------------------ paylines
    // 17 fixed lines (GDD count). The exact shapes are ASSUMED. Row index per reel: 0 top, 1 middle, 2 bottom.
    paylines: [
      [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
      [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [1, 0, 1, 0, 1],
      [1, 2, 1, 2, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2], [1, 1, 0, 1, 1], [1, 1, 2, 1, 1],
      [0, 1, 1, 1, 0], [2, 1, 1, 1, 2]
    ],

    // ------------------------------------------------------------ paytable
    // Multiplier of TOTAL bet, per winning line. 5-of-a-kind values are GDD.
    // 3- and 4-of-a-kind values are ASSUMED (25% and 50% of the 5-of-a-kind value).
    paytable: {
      7: { 3: 0.10, 4: 0.20, 5: 0.4 },
      6: { 3: 0.12, 4: 0.25, 5: 0.5 },
      5: { 3: 0.17, 4: 0.35, 5: 0.7 },
      4: { 3: 0.20, 4: 0.40, 5: 0.8 },
      3: { 3: 0.25, 4: 0.50, 5: 1.0 },
      2: { 3: 0.37, 4: 0.75, 5: 1.5 },
      1: { 3: 0.50, 4: 1.00, 5: 2.0 }
    },

    // The GDD 5-of-a-kind values, used as-is, give an RTP far above 100% once chains
    // and bears stack up, so line pays are scaled down by this factor (ASSUMED).
    // Wipe win pays (34x + 100x) are not scaled. Retune with: node tools/simulate.js
    payScale: 0.172,

    // Symbol weights for random stops (ASSUMED, tuned with tools/simulate.js).
    // Each cell is drawn independently. The Wild weight only applies on wildReel.
    weights: { 7: 20, 6: 20, 5: 20, 4: 20, 3: 20, 2: 20, 1: 20, 9: 2.4 },

    // --------------------------------------------------------------- bears
    // Which bear hatches from the Wild Egg (weights ASSUMED).
    bearWeights: { scare: 45, charm: 27, dance: 28 },
    bearWeightsFreeSpins: { scare: 50, charm: 45, dance: 5 },
    scareLevels: [1, 2, 3],            // GDD: upgrades lowest symbols by 1, 2 or 3 levels
    hatchOncePerSpin: true,            // ASSUMED: the egg hatches once, then stays as a plain Wild

    // ---------------------------------------------------------- free spins
    freeSpins: 7,                      // GDD
    freeSpinsRetrigger: true,          // ASSUMED: a Dance Bear during free spins adds 7 more
    guaranteedWildInFreeSpins: true,   // GDD

    // ------------------------------------------------------------ wipe win
    wipeLinePay: 2.0,                  // GDD: each of 17 lines pays the Level 1 five-of-a-kind (17 x 2 = 34x)
    wipeBonus: 100,                    // GDD: flat 100x total bet
    wipeCountsWild: true,              // ASSUMED: the egg counts as a Yellow Doll for the wipe check

    maxWin: 390,                       // GDD: cap per round (base spin + any free spins it triggers)

    // ---------------------------------------------------------------- money
    bets: [0.10, 0.20, 0.50, 1, 2, 5, 10, 20, 50, 100],  // GDD min / max
    defaultBetIndex: 6,
    startBalance: 1000,
    currency: '$',

    // Win celebration tiers, multiples of total bet (ASSUMED)
    winTiers: { big: 10, mega: 25, epic: 50 },

    // --------------------------------------------------------------- timing (seconds, GDD section 6)
    timing: {
      spinBase: 1.5,          // first reel stop
      reelGap: 0.25,          // gap between reel stops
      symbolSpeed: 22,        // symbols per second while spinning
      bounce: 1.2,            // stop overshoot (0 = none)
      winShow: 0.9,           // show winning lines before popping
      pop: 0.5,               // per upgrade tier
      eggWobble: 1.2,
      bearReveal: 0.5,
      bearEffect: 1.0,
      fsTransition: 2.5,
      wipeTransform: 1.7,
      wipeExecute: 1.3,
      bigWin: 3.5,
      betweenAutoSpins: 0.5
    },

    // ---------------------------------------------------------- presentation
    showLevelBadges: true,    // small "L5" tags on placeholder dolls; set false for final art
    stage: { landscape: [1920, 1080], portrait: [1080, 1920] }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
  else root.CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
