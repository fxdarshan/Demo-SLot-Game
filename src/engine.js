/*
 * Game engine: pure maths, no drawing.
 *
 * resolveSpin(grid) takes the stopped reels and returns a list of steps
 * (wins, pops, egg hatch, bear effect, wipe win). The renderer plays those
 * steps one by one, so what you see is exactly what the maths decided.
 *
 * Grid format: grid[reel][row] = symbol id (1..7 doll level, 9 Wild Egg, 0 Ghost).
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

    /** Random stop. opts.forceWild puts an egg on the wild reel (free spins). */
    function randomGrid(opts = {}) {
      const g = [];
      for (let c = 0; c < N; c++) {
        g.push([]);
        for (let r = 0; r < R; r++) g[c].push(randomSymbol(c, opts.allowWild !== false));
      }
      if (opts.forceWild && !g[C.wildReel].includes(W)) g[C.wildReel][Math.floor(rng() * R)] = W;
      return g;
    }

    /** Evaluate all paylines. Returns one entry per winning line. */
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
        const pay = C.paytable[sym] && C.paytable[sym][count] * (C.payScale || 1);
        if (!pay) return;
        const positions = [];
        for (let c = 0; c < count; c++) positions.push([c, line[c]]);
        wins.push({ line: li, sym, count, pay, hasWild, positions });
      });
      return wins;
    }

    function allYellow(grid) {
      for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) {
        const s = grid[c][r];
        if (s === 1) continue;
        if (s === W && C.wipeCountsWild) continue;
        return false;
      }
      return true;
    }

    /** Upgrade one symbol by n levels (toward Level 1). Wild and Ghost never change. */
    function upgraded(s, n) { return (s === W || s === C.GHOST) ? s : Math.max(1, s - n); }

    function applyBear(grid, bear) {
      const changes = [];
      if (bear === 'charm') {
        for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) {
          const s = grid[c][r], t = upgraded(s, 1);
          if (t !== s) { changes.push({ c, r, from: s, to: t }); grid[c][r] = t; }
        }
        return { bear, changes };
      }
      if (bear === 'scare') {
        // lowest value = largest level number currently on the grid
        let worst = 0;
        for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) { const s = grid[c][r]; if (s !== W && s > worst) worst = s; }
        const levels = C.scareLevels[Math.floor(rng() * C.scareLevels.length)];
        for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) {
          if (grid[c][r] !== worst) continue;
          const t = upgraded(worst, levels);
          if (t !== worst) { changes.push({ c, r, from: worst, to: t }); grid[c][r] = t; }
        }
        return { bear, changes, levels, target: worst };
      }
      return { bear: 'dance', changes: [], freeSpins: C.freeSpins };
    }

    /**
     * Play out a stopped grid.
     * opts.bet       total bet
     * opts.inFreeSpins
     * opts.forceBear 'scare' | 'charm' | 'dance' to script the hatch result
     * Returns { start, end, steps, total (in money), freeSpins }
     */
    function resolveSpin(startGrid, opts = {}) {
      const bet = opts.bet || 1;
      const grid = clone(startGrid);
      const steps = [];
      const paidPerLine = {};          // line index -> best pay already paid
      let total = 0, hatched = false, freeSpins = 0;

      for (let guard = 0; guard < 40; guard++) {
        // a full board of Yellow dolls ends everything with the wipe win
        if (allYellow(grid)) {
          const linePay = round2(C.paylines.length * C.wipeLinePay * bet);
          const bonus = round2(C.wipeBonus * bet);
          total = round2(total + linePay + bonus);
          const ghosts = [];
          for (let c = 0; c < N; c++) for (let r = 0; r < R; r++) { ghosts.push({ c, r, from: grid[c][r], to: C.GHOST }); grid[c][r] = C.GHOST; }
          steps.push({ type: 'wipe', linePay, bonus, amount: round2(linePay + bonus), total, changes: ghosts });
          break;
        }

        // only new or improved line wins pay (stops the same line paying twice)
        const wins = evaluate(grid).filter(w => !(paidPerLine[w.line] >= w.pay));
        if (!wins.length) break;
        let amount = 0;
        wins.forEach(w => { w.amount = round2(w.pay * bet); amount += w.amount; paidPerLine[w.line] = w.pay; });
        amount = round2(amount); total = round2(total + amount);
        steps.push({ type: 'win', wins, amount, total });

        // pop: each winning doll opens to the next smaller, higher-value doll
        const seen = new Set(), pops = [];
        wins.forEach(w => w.positions.forEach(([c, r]) => {
          const k = c + ',' + r; if (seen.has(k)) return; seen.add(k);
          const s = grid[c][r], t = upgraded(s, 1);
          if (t !== s) pops.push({ c, r, from: s, to: t });
        }));
        pops.forEach(p => { grid[p.c][p.r] = p.to; });
        if (pops.length) steps.push({ type: 'pop', changes: pops });

        // the egg hatches when it is part of a win
        const eggWin = wins.find(w => w.hasWild);
        let bearChanged = false;
        if (eggWin && !(hatched && C.hatchOncePerSpin)) {
          hatched = true;
          const pos = eggWin.positions.find(([c, r]) => grid[c][r] === W);
          const bear = opts.forceBear || pickWeighted(opts.inFreeSpins ? C.bearWeightsFreeSpins : C.bearWeights);
          steps.push({ type: 'hatch', bear, pos });
          const eff = applyBear(grid, bear);
          if (eff.freeSpins) freeSpins += eff.freeSpins;
          steps.push(Object.assign({ type: 'bear' }, eff));
          bearChanged = eff.changes.length > 0;
        }
        if (!pops.length && !bearChanged) break;
      }

      return { start: clone(startGrid), end: grid, steps, total, freeSpins };
    }

    function tierOf(total, bet) {
      const x = total / bet, t = C.winTiers;
      return x >= t.epic ? 3 : x >= t.mega ? 2 : x >= t.big ? 1 : 0;
    }

    return { randomGrid, randomSymbol, evaluate, resolveSpin, allYellow, tierOf, clone, pickWeighted };
  }

  const Engine = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
