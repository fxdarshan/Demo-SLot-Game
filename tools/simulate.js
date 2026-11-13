#!/usr/bin/env node
/*
 * Monte Carlo check of the prototype maths in src/config.js.
 * Usage: node tools/simulate.js [rounds]     (default 1,000,000)
 * Compare the output with the GDD targets: RTP 95.80%, hit 29.80%,
 * free spins about 1 in 118, max win 390x.
 */
const CONFIG = require('../src/config.js');
const Engine = require('../src/engine.js');
const eng = Engine.create(CONFIG);

const rounds = Number(process.argv[2]) || 1e6;
const bet = 1;
let paid = 0, hits = 0, fsTriggers = 0, wipes = 0, specials = 0, capped = 0, maxX = 0;
const bears = { scare: 0, charm: 0, dance: 0 };
const tiers = [0, 0, 0, 0];

function tally(res) {
  res.steps.forEach(s => {
    if (s.type === 'hatch') bears[s.bear]++;
    if (s.type === 'wipe') { wipes++; if (s.special) specials++; }
  });
}

for (let i = 0; i < rounds; i++) {
  const base = eng.resolveSpin(eng.randomGrid(), { bet });
  tally(base);
  let win = base.total, fsLeft = base.freeSpins;
  if (base.total > 0) hits++;
  if (fsLeft) fsTriggers++;
  while (fsLeft > 0) {
    fsLeft--;
    const r = eng.resolveSpin(eng.randomGrid({ forceWild: CONFIG.guaranteedWildInFreeSpins }), { bet, inFreeSpins: true });
    tally(r);
    win += r.total;
    if (r.freeSpins && CONFIG.freeSpinsRetrigger) fsLeft += r.freeSpins;
  }
  if (win > CONFIG.maxWin * bet) { win = CONFIG.maxWin * bet; capped++; }
  paid += win;
  maxX = Math.max(maxX, win / bet);
  tiers[eng.tierOf(win, bet)]++;
}

const pct = v => (v * 100).toFixed(2) + '%';
console.log(`Rounds simulated : ${rounds.toLocaleString()}`);
console.log(`RTP              : ${pct(paid / (rounds * bet))}   (GDD 95.80%)`);
console.log(`Hit frequency    : ${pct(hits / rounds)}   (GDD 29.80%)`);
console.log(`Free spins       : 1 in ${(rounds / Math.max(1, fsTriggers)).toFixed(0)}   (GDD ~1 in 118)`);
console.log(`Wipe wins        : 1 in ${(rounds / Math.max(1, wipes)).toFixed(0)}   (Ghost special 100x: 1 in ${(rounds / Math.max(1, specials)).toFixed(0)})`);
console.log(`Bear hatches     : scare ${bears.scare}, charm ${bears.charm}, dance ${bears.dance}`);
console.log(`Big/Mega/Epic    : ${tiers[1]} / ${tiers[2]} / ${tiers[3]}`);
console.log(`Max win seen     : ${maxX.toFixed(1)}x   (cap ${CONFIG.maxWin}x, capped ${capped} times)`);
