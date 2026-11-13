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
    scare3:   { label: 'Scare Bear (large, 3×)',  color: '#d9552a' },
    charm:    { label: 'Charm Bear',              color: '#e05aa0' },
    dance:    { label: 'Dance Bear → Free Spins', color: '#9b6bff' },
    nice:     { label: 'Nice win banner (15×+)',  color: '#d08a4a' },
    big:      { label: 'Big win banner (25×+)',   color: '#ff9a3c' },
    wipe:     { label: 'Wipe Win',                color: '#f2c13a' },
    ghost:    { label: 'Wipe → Ghost (100×)',     color: '#fff3a8' },
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

  const Director = { create, OUTCOMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = Director;
  else root.Director = Director;
})(typeof window !== 'undefined' ? window : globalThis);
