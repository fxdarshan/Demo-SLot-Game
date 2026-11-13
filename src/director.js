/*
 * Director: builds scripted outcomes for demos.
 * Each outcome is a stopped grid plus its resolved steps, found by searching
 * random grids until one matches what was asked for. Pure logic, no drawing.
 */
(function (root) {
  const OUTCOMES = {
    random:   { label: 'Random spin',             color: '#8d8aa6' },
    nowin:    { label: 'No win',                  color: '#6c6a80' },
    small:    { label: 'Single win',              color: '#4fbf8a' },
    chain:    { label: 'Upgrade chain (2+ pops)', color: '#3fb6c9' },
    scare:    { label: 'Scare Bear (small, 1×)',  color: '#e0794a' },
    scare2:   { label: 'Scare Bear (medium, 2×)', color: '#dc6a3a' },
    scare3:   { label: 'Scare Bear (large, 3×)',  color: '#d9552a' },
    charm:    { label: 'Charm Bear',              color: '#e05aa0' },
    dance:    { label: 'Dance Bear → Free Spins', color: '#9b6bff' },
    nice:     { label: 'Nice win banner (15×+)',  color: '#d08a4a' },
    big:      { label: 'Big win banner (25×+)',   color: '#ff9a3c' },
    wipe:     { label: 'Wipe Win',                color: '#f2c13a' },
    ghost:    { label: 'Wipe → Ghost (100×) · EPIC banner', color: '#fff3a8' },
    // presentation cheats: a real big-win board, then the banner of this tier with an amount in its range
    b_mega:        { label: 'MEGA banner (shown amount)',        color: '#f2b632', cheat: true },
    b_superb:      { label: 'SUPERB banner (shown amount)',      color: '#3fcf7a', cheat: true },
    b_sensational: { label: 'SENSATIONAL banner (shown amount)', color: '#b46cff', cheat: true },
    symwin:   { label: 'Symbol win',              color: '#7ad06a' },   // item.sym 0-6, item.len 3-5
    custom:   { label: 'Custom grid',             color: '#2fd0c0' }
  };

  function create(CONFIG, engine) {
    const C = CONFIG, W = C.WILD;
    const rnd = n => Math.floor(Math.random() * n);

    function withWild(g) { g[C.wildReel][rnd(C.rows)] = W; return g; }
    function uniformGrid(pool, wild) {
      const g = [];
      for (let c = 0; c < C.reels; c++) { g.push([]); for (let r = 0; r < C.rows; r++) g[c].push(pool[rnd(pool.length)]); }
      return wild ? withWild(g) : g;
    }

    function search(test, make, tries = 5000) {
      let best = null;
      for (let i = 0; i < tries; i++) {
        const { grid, opts } = make();
        const res = engine.resolveSpin(grid, opts);
        const score = test(res);
        if (score === true) return res;
        if (typeof score === 'number' && (!best || score > best.score)) best = { score, res };
      }
      return best ? best.res : engine.resolveSpin(make().grid, make().opts);
    }

    const count = (res, type) => res.steps.filter(s => s.type === type).length;
    const bearOf = res => (res.steps.find(s => s.type === 'hatch') || {}).bear;
    const wipeOf = res => res.steps.find(s => s.type === 'wipe');

    /** Build an outcome. ctx = { bet, inFreeSpins } */
    function build(item, ctx) {
      const bet = ctx.bet, fs = !!ctx.inFreeSpins;
      const base = { bet, inFreeSpins: fs };
      const forceWild = fs && C.guaranteedWildInFreeSpins;
      const noBear = Object.assign({}, base, { forceStar: false });
      const quiet = () => ({ grid: engine.randomGrid({ allowWild: forceWild, forceWild }), opts: noBear });
      const bearMake = (bear, extra = {}) => () => ({ grid: withWild(engine.randomGrid({ allowWild: false })), opts: Object.assign({}, base, { forceBear: bear }, extra) });

      switch (item.type) {
        case 'nowin':
          return search(r => r.total === 0, quiet);
        case 'small':
          return search(r => (count(r, 'win') === 1 && r.total / bet >= .2 && r.total / bet < C.winTiers[0].min && !wipeOf(r)) || (r.total > 0 ? .5 : 0), quiet);
        case 'chain':
          return search(r => (count(r, 'pop') >= 2 && !wipeOf(r)) || count(r, 'pop'), quiet, 8000);
        case 'scare':
          return search(r => (r.total > 0 && r.total / bet < C.winTiers[0].min && !wipeOf(r)) || .5, bearMake('scare', { scareSize: 1 }));
        case 'scare2':
          return search(r => (r.total > 0 && count(r, 'pop') >= 1 && !wipeOf(r)) || r.total, bearMake('scare', { scareSize: 2 }));
        case 'b_mega': case 'b_superb': case 'b_sensational': {
          const r = build({ type: 'big' }, ctx);
          r.bannerTier = item.type.slice(2);       // game.js shows this tier with an amount in its range
          return r;
        }
        case 'scare3':
          return search(r => (r.total > 0 && count(r, 'pop') >= 1 && !wipeOf(r)) || r.total, bearMake('scare', { scareSize: 3 }));
        case 'charm':
          return search(r => (count(r, 'win') >= 1 && count(r, 'pop') >= 1 && !wipeOf(r)) || r.total, bearMake('charm'));
        case 'dance':
          return search(r => bearOf(r) === 'dance' || false, bearMake('dance'), 50);
        case 'nice': case 'big': {
          // without a wipe a single spin tops out at 34x (17 lines x Yellow 5-of-a-kind)
          const lo = item.type === 'nice' ? 15 : 25, hi = item.type === 'nice' ? 25 : 50;
          return search(r => (r.total / bet >= lo && r.total / bet < hi && !wipeOf(r)) || (wipeOf(r) ? 0 : Math.min(r.total, lo * bet)), () => {
            const g = uniformGrid([0, 0, 1, 1, 2, 3, 4, 5, 6], true);
            return { grid: g, opts: Object.assign({}, base, { forceBear: Math.random() < .5 ? 'charm' : 'scare', scareSize: 3 }) };
          }, 8000);
        }
        case 'wipe':
          // a near-uniform board that chains into a full board of one value (not Yellow)
          return search(r => { const w = wipeOf(r); return (w && !w.special) || false; },
            () => { const lv = 1 + rnd(4); return { grid: uniformGrid([lv, lv, lv, lv, lv + 1], fs || Math.random() < .3), opts: noBear }; }, 8000);
        case 'ghost':
          return search(r => { const w = wipeOf(r); return (w && w.special) || false; },
            () => ({ grid: uniformGrid([0, 0, 0, 0, 0, 0, 1], fs || Math.random() < .3), opts: noBear }), 8000);
        case 'symwin': {
          // the chosen symbol on the middle payline, len in a row; only boards where that symbol is the win
          const s = item.sym == null ? 0 : item.sym, n = Math.max(3, Math.min(5, item.len || 3));
          const make = () => {
            const g = engine.randomGrid({ allowWild: false });
            for (let c = 0; c < C.reels; c++) {
              if (c < n) g[c][1] = s;
              else if (g[c][1] === s) g[c][1] = (s + 1 + rnd(6)) % 7;     // end the line exactly at n
            }
            if (forceWild) g[C.wildReel][0] = W;
            return { grid: g, opts: noBear };
          };
          return search(r => {
            const w = r.steps.find(x => x.type === 'win');
            if (!w || wipeOf(r) || !w.wins.some(x => x.sym === s && x.count === n)) return 0;
            return w.wins.every(x => x.sym === s) ? true : .5;
          }, make, 4000);
        }
        case 'custom': {
          const g = item.grid.map(col => col.slice());
          if (forceWild && !g[C.wildReel].includes(W)) g[C.wildReel][1] = W;
          const opts = item.bear ? Object.assign({}, base, { forceBear: item.bear, scareSize: item.scareSize }) : noBear;
          return engine.resolveSpin(g, opts);
        }
        default:
          return engine.resolveSpin(engine.randomGrid({ forceWild }), base);
      }
    }
    return { build };
  }

  // readable name of a queued item, e.g. "Elf win, 4 in a row"
  function describe(item, CONFIG) {
    const o = OUTCOMES[item.type] || OUTCOMES.random;
    if (item.type === 'symwin') {
      const names = (CONFIG && CONFIG.symbolNames) || {};
      return `${names[item.sym == null ? 0 : item.sym] || 'Symbol'} win, ${item.len || 3} in a row`;
    }
    return o.label;
  }

  const Director = { create, OUTCOMES, describe };
  if (typeof module !== 'undefined' && module.exports) module.exports = Director;
  else root.Director = Director;
})(typeof window !== 'undefined' ? window : globalThis);
