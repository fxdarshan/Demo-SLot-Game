/*
 * Director: builds scripted outcomes for demos.
 * Each outcome is a stopped grid plus its resolved steps, found by searching
 * random grids until one matches what was asked for. Pure logic, no drawing.
 */
(function (root) {
  const OUTCOMES = {
    random:   { label: 'Random spin',          color: '#8d8aa6' },
    nowin:    { label: 'No win',               color: '#6c6a80' },
    small:    { label: 'Single win',           color: '#4fbf8a' },
    chain:    { label: 'Chain (3+ pops)',      color: '#3fb6c9' },
    scare:    { label: 'Scare Bear',           color: '#e0794a' },
    charm:    { label: 'Charm Bear',           color: '#e05aa0' },
    dance:    { label: 'Dance Bear → Free Spins', color: '#9b6bff' },
    wipe:     { label: 'Wipe Win',             color: '#f2c13a' },
    big:      { label: 'Big win (10×+)',       color: '#ff9a3c' },
    custom:   { label: 'Custom grid',          color: '#2fd0c0' }
  };

  function create(CONFIG, engine) {
    const C = CONFIG, W = C.WILD;

    function eggWinGrid(base) {
      // make sure the egg sits on the wild reel inside a 3+ line through reels 1-3
      const g = base || engine.randomGrid({ allowWild: false });
      const line = C.paylines[Math.floor(Math.random() * C.paylines.length)];
      const s = g[0][line[0]];
      g[1][line[1]] = s;
      g[C.wildReel][line[C.wildReel]] = W;
      return g;
    }

    function search(test, make, tries = 4000) {
      let best = null;
      for (let i = 0; i < tries; i++) {
        const { grid, opts } = make();
        const res = engine.resolveSpin(grid, opts);
        const score = test(res);
        if (score === true) return res;
        if (typeof score === 'number' && (!best || score > best.score)) best = { score, res };
      }
      return best ? best.res : engine.resolveSpin(make().grid, {});
    }

    const count = (res, type) => res.steps.filter(s => s.type === type).length;

    /** Build an outcome. ctx = { bet, inFreeSpins } */
    function build(item, ctx) {
      const bet = ctx.bet, fs = !!ctx.inFreeSpins;
      const opts = { bet, inFreeSpins: fs };
      const forceWild = fs && C.guaranteedWildInFreeSpins;
      const plain = () => ({ grid: engine.randomGrid({ forceWild }), opts });
      const noEgg = () => ({ grid: engine.randomGrid({ allowWild: forceWild, forceWild }), opts });
      const hatchedBear = res => (res.steps.find(s => s.type === 'hatch') || {}).bear;

      switch (item.type) {
        case 'nowin':
          return search(r => r.total === 0 && !r.freeSpins, plain);
        case 'small':
          return search(r => count(r, 'win') === 1 && r.total > 0 && !hatchedBear(r) && r.total / bet < C.winTiers.big, noEgg);
        case 'chain':
          return search(r => (count(r, 'pop') >= 3 && !hatchedBear(r) && !count(r, 'wipe')) || count(r, 'pop'), noEgg);
        case 'scare': case 'charm': case 'dance':
          return search(r => (hatchedBear(r) === item.type && count(r, 'win') >= 2) || (hatchedBear(r) === item.type ? 1 : 0),
            () => ({ grid: eggWinGrid(engine.randomGrid({ allowWild: false })), opts: Object.assign({}, opts, { forceBear: item.type }) }));
        case 'wipe':
          return search(r => count(r, 'wipe') > 0 || false, () => {
            // high-value-heavy board with an egg, chained into a full Yellow board
            const g = [];
            for (let c = 0; c < C.reels; c++) { g.push([]); for (let r = 0; r < C.rows; r++) g[c].push(Math.random() < .55 ? 2 : (Math.random() < .5 ? 1 : 3)); }
            return { grid: eggWinGrid(g), opts: Object.assign({}, opts, { forceBear: 'charm' }) };
          }, 6000);
        case 'big':
          return search(r => (r.total / bet >= C.winTiers.big && !count(r, 'wipe') && !r.freeSpins) || r.total / bet,
            () => ({ grid: eggWinGrid(engine.randomGrid({ allowWild: false })), opts: Object.assign({}, opts, { forceBear: Math.random() < .6 ? 'charm' : 'scare' }) }));
        case 'custom': {
          const g = item.grid.map(col => col.slice());
          if (forceWild && !g[C.wildReel].includes(W)) g[C.wildReel][1] = W;
          return engine.resolveSpin(g, Object.assign({}, opts, item.bear ? { forceBear: item.bear } : {}));
        }
        default:
          return engine.resolveSpin(engine.randomGrid({ forceWild }), opts);
      }
    }
    return { build };
  }

  const Director = { create, OUTCOMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = Director;
  else root.Director = Director;
})(typeof window !== 'undefined' ? window : globalThis);
