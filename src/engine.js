/*
 * Game engine: pure maths, no drawing. Follows docs/official-game-rules.md.
 *
 * resolveSpin(grid) takes the stopped reels and returns a list of steps:
 *   hatch  a landed Wild shows a star and opens to a bear
 *   bear   the bear's effect (Scare: lowest symbols upgrade 1-3 times, Charm: all
 *          symbols upgrade once, Dance: free spins)
 *   win    new or improved payline wins (only the highest win per line is paid)
 *   pop    winning symbols of one value upgrade, when that creates new or longer lines
 *   wipe   all 15 symbols the same: they upgrade once more (Yellow -> Ghost = special win)
 * The renderer plays these steps in order, so what you see is what the maths decided.
 *
 * Grid format: grid[reel][row] = symbol id (1..7 doll level, 9 Wild, 0 Ghost).
 * Works in the browser (window.Engine) and in Node (require('./engine')).
 */
(function (root) {
  function create(CONFIG, rng) {
    rng = rng || Math.random;
    const C = CONFIG, W = C.WILD, R = C.rows, N = C.reels;
    const round2 = v => Math.round(v * 100) / 100;
    const clone = g => g.map(col => col.slice());

    function pickWeighted(table) {
      let total = 0; for (const k in table) total += table[k];
      let r = rng() * total;
      for (const k in table) { r -= table[k]; if (r <= 0) return k; }
      return Object.keys(table).pop();
    }
    function randomSymbol(reel, allowWild = true) {
      const t = {};
      for (const k in C.weights) {
        const id = Number(k);
        if (id === W && (reel !== C.wildReel || !allowWild)) continue;
        t[k] = C.weights[k];
      }
      return Number(pickWeighted(t));
    }

    /** Random stop. opts.forceWild guarantees a Wild on the wild reel (free spins). */
    function randomGrid(opts = {}) {
      const g = [];
      for (let c = 0; c < N; c++) {
        g.push([]);
        for (let r = 0; r < R; r++) g[c].push(randomSymbol(c, opts.allowWild !== false));
      }
      if (opts.forceWild && !g[C.wildReel].includes(W)) g[C.wildReel][Math.floor(rng() * R)] = W;
      return g;
    }

    /** Evaluate all paylines: highest win per line, left to right, no gaps. */
    function evaluate(grid) {
      const wins = [];
      C.paylines.forEach((line, li) => {
        let sym = null, count = 0, hasWild = false;
        for (let c = 0; c < N; c++) {
          const s = grid[c][line[c]];
          if (s === C.GHOST) break;
          if (s === W) { hasWild = true; count++; continue; }
          if (sym === null) { sym = s; count++; continue; }
          if (s === sym) { count++; continue; }
          break;
        }
        if (sym === null || count < 3) return;
        const pay = C.paytable[sym] && C.paytable[sym][Math.min(count, 5)];
        if (!pay) return;
        const positions = [];
        for (let c = 0; c < count; c++) positions.push([c, line[c]]);
        wins.push({ line: li, sym, count, pay, hasWild, positions });
      });
      return wins;
    }

    const upgraded = (s, n = 1) => (s === W || s === C.GHOST) ? s : Math.max(1, s - n);

    /** The single symbol filling the board, or null. Wilds count as matching if configured. */
    function sameSymbol(grid) {
      let sym = null;
      for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) {
        const s = grid[c][r];
        if (s === W && C.wipeCountsWild) continue;
        if (sym === null) sym = s; else if (s !== sym) return null;
      }
      return sym;
    }

    function lowestValue(grid) {           // highest level number = lowest value
      let worst = 0;
      for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) { const s = grid[c][r]; if (s !== W && s !== C.GHOST && s > worst) worst = s; }
      return worst;
    }

    function applyBear(grid, bear, size) {
      if (bear === 'charm') {
        const changes = [];
        for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) {
          const s = grid[c][r], t = upgraded(s);
          if (t !== s) { changes.push({ c, r, from: s, to: t }); grid[c][r] = t; }
        }
        return { bear, changes };
      }
      if (bear === 'scare') {
        // the lowest valued symbols upgrade, repeated 1-3 times (bear size)
        const rounds = [];
        for (let i = 0; i < size; i++) {
          const worst = lowestValue(grid);
          if (worst <= 1) break;
          const ch = [];
          for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) if (grid[c][r] === worst) { ch.push({ c, r, from: worst, to: worst - 1 }); grid[c][r] = worst - 1; }
          rounds.push(ch);
        }
        return { bear, size, rounds, changes: [].concat(...rounds) };
      }
      return { bear: 'dance', changes: [], freeSpins: C.freeSpins };
    }

    /** Does upgrading change the board into one with new or longer paylines? */
    function newOrLonger(before, after) {
      const prev = {}; before.forEach(w => { prev[w.line] = w.count; });
      return after.some(w => !(w.line in prev) || w.count > prev[w.line]);
    }

    /**
     * Play out a stopped grid.
     * opts.bet          total bet
     * opts.inFreeSpins
     * opts.forceBear    'scare' | 'charm' | 'dance' (a landed Wild then always shows a star)
     * opts.forceStar    true/false to force or block the star
     * opts.scareSize    1 | 2 | 3
     * Returns { start, end, steps, total (money), freeSpins }
     */
    function resolveSpin(startGrid, opts = {}) {
      const bet = opts.bet || 1, fs = !!opts.inFreeSpins;
      const grid = clone(startGrid), steps = [];
      const linePaid = {};             // line -> best pay multiplier so far
      let lineTotal = 0, special = 0, freeSpins = 0;
      const total = () => round2(lineTotal * bet + special);

      // 1. a landed Wild may show a star and open to a bear (one per spin)
      let wildPos = null;
      for (let r = 0; r < R; r++) if (grid[C.wildReel][r] === W) { wildPos = [C.wildReel, r]; break; }
      if (wildPos) {
        const star = opts.forceBear ? true : (opts.forceStar != null ? opts.forceStar : rng() < (fs ? C.starChanceFreeSpins : C.starChance));
        if (star) {
          const bear = opts.forceBear || pickWeighted(fs ? C.bearWeightsFreeSpins : C.bearWeights);
          const size = bear === 'scare' ? (opts.scareSize || Number(pickWeighted(C.scareSizes))) : 2;
          steps.push({ type: 'hatch', bear, size, pos: wildPos });
          const eff = applyBear(grid, bear, size);
          if (eff.freeSpins) freeSpins += eff.freeSpins;
          steps.push(Object.assign({ type: 'bear' }, eff));
        }
      }

      // 2. pay wins, upgrade winning symbols while that makes new or longer lines, then check for a wipe
      let wiped = false;
      for (let guard = 0; guard < 60; guard++) {
        const wins = evaluate(grid);
        const improved = [];
        wins.forEach(w => {
          const prev = linePaid[w.line] || 0;
          if (w.pay > prev) { improved.push(Object.assign({}, w, { amount: round2((w.pay - prev) * bet) })); lineTotal += w.pay - prev; linePaid[w.line] = w.pay; }
        });
        if (improved.length) steps.push({ type: 'win', wins: improved, amount: round2(improved.reduce((a, w) => a + w.amount, 0)), total: total() });

        // which values qualify for an upgrade
        const byRank = {};
        wins.forEach(w => w.positions.forEach(([c, r]) => {
          const s = grid[c][r]; if (s === W || s <= 1) return;
          (byRank[s] = byRank[s] || new Set()).add(c + ',' + r);
        }));
        const pops = [];
        Object.keys(byRank).forEach(rank => {
          const test = clone(grid), list = [...byRank[rank]].map(k => k.split(',').map(Number));
          list.forEach(([c, r]) => { test[c][r] = upgraded(test[c][r]); });
          if (newOrLonger(wins, evaluate(test))) list.forEach(([c, r]) => pops.push({ c, r, from: grid[c][r], to: upgraded(grid[c][r]) }));
        });
        if (pops.length) {
          pops.forEach(p => { grid[p.c][p.r] = p.to; });
          steps.push({ type: 'pop', changes: pops });
          continue;
        }

        // all win upgrades done: wipe if the whole board is one symbol (once per spin)
        const same = sameSymbol(grid);
        if (!wiped && same !== null && same !== C.GHOST) {
          wiped = true;
          const changes = [];
          const to = same === 1 ? C.GHOST : same - 1;
          for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) if (grid[c][r] !== W) { changes.push({ c, r, from: grid[c][r], to }); grid[c][r] = to; }
          if (to === C.GHOST) {
            special = round2(C.specialWin * bet);
            steps.push({ type: 'wipe', special: true, from: same, changes, amount: special, total: total() });
            break;
          }
          steps.push({ type: 'wipe', special: false, from: same, changes, amount: 0, total: total() });
          continue;                    // re-evaluate the upgraded board
        }
        break;
      }

      return { start: clone(startGrid), end: grid, steps, total: total(), freeSpins };
    }

    function tierOf(total, bet) {
      const x = total / bet, t = C.winTiers;
      return x >= t.epic ? 3 : x >= t.mega ? 2 : x >= t.big ? 1 : 0;
    }

    return { randomGrid, randomSymbol, evaluate, resolveSpin, sameSymbol, tierOf, clone, pickWeighted };
  }

  const Engine = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
