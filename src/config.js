/*
 * Game configuration: maths, animation timing and presentation switches.
 * The engine (engine.js) reads only this object, so the same file drives the
 * browser game and the Node simulator (tools/simulate.js).
 *
 * Sources:
 *   RULES  docs/official-game-rules.md
 *   PAY    docs/pay-table.md
 *   ANIM   docs/animation-specifications.md   (timings, banners)
 *   ASSET  docs/game-asset-specification.md   (asset IDs, win tiers)
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

    // Symbol ids follow the asset spec tiers: 0 = sym_00 Yellow (highest) .. 6 = sym_06 Teal (lowest).
    // An upgrade moves a symbol one tier toward 0.
    tiers: [0, 1, 2, 3, 4, 5, 6],
    GHOST: 8,
    WILD: 9,
    symbolNames: {
      0: 'Santa', 1: 'Mrs Claus', 2: 'Elf', 3: 'Nutcracker',
      4: 'Snowman', 5: 'Gingerbread', 6: 'Gift Egg', 9: 'Wild (star snow globe)', 8: 'Ghost'
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
      0: { 3: 0.50, 4: 1.00, 5: 2.00 },   // Yellow  €3.75 / €7.50 / €15.00
      1: { 3: 0.40, 4: 0.80, 5: 1.50 },   // Orange  €3.00 / €6.00 / €11.25
      2: { 3: 0.30, 4: 0.60, 5: 1.00 },   // Red     €2.25 / €4.50 / €7.50
      3: { 3: 0.20, 4: 0.40, 5: 0.80 },   // Pink    €1.50 / €3.00 / €6.00
      4: { 3: 0.20, 4: 0.40, 5: 0.70 },   // Purple  €1.50 / €3.00 / €5.25
      5: { 3: 0.10, 4: 0.20, 5: 0.50 },   // Blue    €0.75 / €1.50 / €3.75
      6: { 3: 0.10, 4: 0.20, 5: 0.40 }    // Teal    €0.75 / €1.50 / €3.00
    },
    specialWin: 100,                   // PAY 5.2: Ghost special win €750 at €7.50 bet = 100x

    // Symbol weights for random stops (TUNED). Each cell is drawn independently;
    // the Wild weight only applies on wildReel.
    weights: { 6: 21, 5: 21, 4: 20, 3: 20, 2: 20, 1: 19, 0: 19, 9: 3.7 },

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
    wipeCountsWild: true,              // ASSUMED: Wild positions count as "the same" (else free spins could never wipe)

    maxWin: 390,                       // GDD: cap per round (base spin + any free spins it triggers)

    // ---------------------------------------------------------------- money
    bets: [0.10, 0.20, 0.50, 1, 2, 5, 7.5, 10, 20, 50, 100],  // GDD min / max
    defaultBetIndex: 7,
    startBalance: 1000,
    currency: '€',

    // ---------------------------------------------------------- big win banners (ASSET 7.2)
    // The animation spec lists five tiers from 25x; the asset spec adds NICE at 15x and BIG at 25x.
    // The asset spec is used here. The Ghost special win always shows the EPIC banner (ASSET 7.2).
    winTiers: [
      { id: 'nice',        min: 15,  label: 'NICE WIN!',        colors: ['#ffe2bf', '#d08a4a', '#7a4316'], fx: 'fountain' },
      { id: 'big',         min: 25,  label: 'BIG WIN!',         colors: ['#ffffff', '#c9d2dc', '#6c7a88'], fx: 'drop' },
      { id: 'mega',        min: 50,  label: 'MEGA WIN!',        colors: ['#fff4c2', '#f2b632', '#b0102a'], fx: 'cascade' },
      { id: 'superb',      min: 100, label: 'SUPERB WIN!',      colors: ['#e9ffe9', '#3fcf7a', '#b0102a'], fx: 'fireworks' },
      { id: 'sensational', min: 250, label: 'SENSATIONAL WIN!', colors: ['#f6e6ff', '#b46cff', '#e8b23a'], fx: 'lasers' },
      { id: 'epic',        min: 500, label: 'EPIC WIN!',        colors: ['#ffffff', '#8fd6ff', '#2f6fd6'], fx: 'epic' }
    ],

    // ------------------------------------------------------- animation timing (ANIM, frames at 30 fps)
    fps: 30,
    frames: {
      bgBaseLoop: 120,                  // bg_base_loop breathing
      bgFreeLoop: 90,                   // bg_freegame_loop
      fsLightCycle: 30,                 // party lights red/gold
      reel3Glow: 45,                    // guaranteed-wild outline sine
      symWin: [10, 20, 15],             // sym_xx_win / sym_xx_upgrade: pop, main action, settle/morph
      wildOpen: [15, 20, 10],           // sym_wild_star_open: land squash, star flash + hatch, bear emerge
      anticipation: [15, 30, 15],       // vfx_anticipation_reel3: ramp, sustain, slam stop
      scareWave: 22.5,                  // per upgrade; small 45f, medium 67f, large 90f
      scareEdge: 11.25,                 // intro and outro around the waves
      charm: [20, 25, 15],              // kiss, hearts sweep, upgrade shimmer
      dance: [45, 30],                  // accordion riff, hand-over to free spins
      wipe: [30, 30, 30],               // golden frame lock, flash sweep + morph, ghost transform / settle
      banner: [30, 90, 30],             // every modal and big win banner
      bannerTally: [30, 105],           // big win count-up frames inside the banner
      summaryTally: 75,                 // free spins summary count-up
      transToFree: [15, 45, 15],        // trans_base_to_freegame
      transToBase: 60                   // trans_freegame_to_base
    },
    anticipateOn: 'star',               // 'star' = only when the Wild will open; 'wild' = any Wild on reel 3; 'off'
    autoContinueModals: true,           // START / COLLECT continue by themselves after the hold (handy for recording)

    // reel spin feel (not in the spec; GDD spin 1.5-2.0s, 0.2-0.3s per reel)
    spin: { first: 1.5, gap: 0.25, speed: 22, bounce: 1.2 },

    showLevelBadges: true,    // small tier tags on placeholder dolls only
    stage: { landscape: [1920, 1080] }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
  else root.CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
