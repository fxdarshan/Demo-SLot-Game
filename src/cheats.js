/*
 * Cheats: force the next spin, or play a whole scenario.
 *
 *   C          open / close the cheat menu (drawn over the game, never in recordings)
 *   1 - 6      next spin shows NICE, BIG, MEGA*, SUPERB*, SENSATIONAL*, EPIC (Ghost award)
 *   F          next spin triggers free spins (Dance Bear)
 *   S / M / A  Scare Bear large / medium / small
 *   H          Charm Bear          U  upgrade chain      W  Wipe        G  Ghost (100x)
 *   X          single win          N  no win             0  clear forced spins
 *   Space      spin
 * (*) MEGA, SUPERB and SENSATIONAL are presentation cheats: a single spin tops out at
 *     about 34x under the rules, so a real big-win board is shown with an amount in
 *     that banner's range. Everything else is a real outcome from the maths engine.
 *
 * Scenario links: ?scenario=<id> or #scenario-<id> loads and plays a scenario on open.
 */
(function (root) {
  const Game = root.Game, G = Game.G, OUT = root.Director.OUTCOMES;
  const $ = s => document.querySelector(s);

  const SCENARIOS = [
    { id: 'all-banners', label: 'All win banners', note: 'NICE, BIG, MEGA*, SUPERB*, SENSATIONAL*, then EPIC through the Ghost award',
      items: ['nice', 'big', 'b_mega', 'b_superb', 'b_sensational', 'ghost'] },
    { id: 'free-spins', label: 'Free spins', note: 'Dance Bear trigger, then 7 random free spins',
      items: ['dance'] },
    { id: 'free-spins-big', label: 'Free spins: big round', note: 'Trigger, then Charm, large Scare, chain, Wipe, Nice banner, win and Ghost inside free spins',
      items: ['dance', 'charm', 'scare3', 'chain', 'wipe', 'nice', 'small', 'ghost'] },
    { id: 'retrigger', label: 'Free spins retrigger', note: 'A Dance Bear during free spins adds 7 more',
      items: ['dance', 'small', 'dance', 'nowin', 'chain', 'small'] },
    { id: 'all-bears', label: 'Every bear', note: 'Scare small, medium and large, Charm, then Dance into free spins',
      items: ['scare', 'scare2', 'scare3', 'charm', 'dance'] },
    { id: 'wipe-ghost', label: 'Wipe and Ghost', note: 'A wipe of one value, then 15 Yellows becoming Ghosts (100×)',
      items: ['wipe', 'ghost'] },
    { id: 'max-win', label: 'Max win cap (390×)', note: 'Free spins with repeated Ghost awards until the 390× cap ends the round',
      items: ['dance', 'ghost', 'ghost', 'ghost'] },
    { id: 'base-tour', label: 'Base game tour', note: 'No win, win, chain, Scare, Charm, Nice and Big banners, Wipe',
      items: ['nowin', 'small', 'chain', 'scare', 'charm', 'nice', 'big', 'wipe'] }
  ];

  // key, outcome type, short label for the menu
  const HOTKEYS = [
    ['1', 'nice', 'NICE banner'], ['2', 'big', 'BIG banner'], ['3', 'b_mega', 'MEGA banner*'],
    ['4', 'b_superb', 'SUPERB banner*'], ['5', 'b_sensational', 'SENSATIONAL banner*'], ['6', 'ghost', 'EPIC (Ghost 100×)'],
    ['F', 'dance', 'Free spins'], ['S', 'scare3', 'Scare Bear, large'], ['M', 'scare2', 'Scare Bear, medium'],
    ['A', 'scare', 'Scare Bear, small'], ['H', 'charm', 'Charm Bear'], ['U', 'chain', 'Upgrade chain'],
    ['W', 'wipe', 'Wipe'], ['G', 'ghost', 'Ghost (100×)'], ['X', 'small', 'Single win'], ['N', 'nowin', 'No win']
  ];
  const KEYMAP = Object.fromEntries(HOTKEYS.map(([k, t]) => [k.toLowerCase(), t]));
  const label = t => (OUT[t] || { label: t }).label;

  /* ---------------- actions ---------------- */
  function forceNext(type) {
    G.queue.unshift({ type, cheat: true });
    G.onChange();
    note(`Next spin: ${label(type)}`);
  }
  function playScenario(id, opts = {}) {
    const sc = SCENARIOS.find(s => s.id === id); if (!sc) return false;
    G.queue = sc.items.map(type => ({ type, cheat: true }));
    G.onChange();
    note(`Scenario: ${sc.label}`);
    if (opts.load) return true;
    if (!G.busy) Game.playQueue(sc.items.length);
    return true;
  }
  function clearForced() { G.queue = G.queue.filter(q => !q.cheat); G.onChange(); note('Forced spins cleared'); }

  /* ---------------- UI: button, menu, next-spin chip (DOM over the canvas) ---------------- */
  const wrap = $('#wrap');
  const btn = document.createElement('button'); btn.className = 'cheat-btn'; btn.textContent = 'Cheats (C)'; btn.title = 'Cheat menu';
  const menu = document.createElement('div'); menu.className = 'cheat-menu'; menu.hidden = true; menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-label', 'Cheats');
  const chip = document.createElement('div'); chip.className = 'cheat-chip'; chip.hidden = true;
  const toast = document.createElement('div'); toast.className = 'cheat-toast';
  wrap.append(btn, menu, chip, toast);

  function note(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(note.t); note.t = setTimeout(() => toast.classList.remove('show'), 1800); }
  function toggle(show = menu.hidden) { menu.hidden = !show; btn.classList.toggle('on', show); }
  btn.onclick = () => toggle();

  function linkFor(id) { return location.href.split(/[?#]/)[0] + '?scenario=' + id; }
  function renderMenu() {
    menu.innerHTML = `
      <header><b>Cheats</b><span>Forced spins play before anything else. Space spins.</span><button class="x" aria-label="Close">✕</button></header>
      <section><h4>Play a scenario</h4><div class="sc"></div></section>
      <section><h4>Force the next spin</h4><div class="keys"></div></section>
      <footer><span class="pending"></span><button class="clear">Clear forced (0)</button></footer>
      <p class="fine">* Presentation cheat: a real big-win board with an amount in that banner's range. A single spin can't reach these tiers under the rules.</p>`;
    menu.querySelector('.x').onclick = () => toggle(false);
    menu.querySelector('.clear').onclick = clearForced;
    const sc = menu.querySelector('.sc');
    SCENARIOS.forEach(s => {
      const row = document.createElement('div'); row.className = 'row';
      row.innerHTML = `<div class="t"><b>${s.label}</b><small>${s.note}</small></div>`;
      const play = document.createElement('button'); play.className = 'play'; play.textContent = 'Play';
      play.onclick = () => { toggle(false); playScenario(s.id); };
      const link = document.createElement('button'); link.className = 'link'; link.textContent = 'Link'; link.title = 'Copy a link that opens this scenario';
      link.onclick = () => { const u = linkFor(s.id); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => note('Link copied'), () => note(u)); };
      row.append(play, link); sc.appendChild(row);
    });
    const keys = menu.querySelector('.keys');
    HOTKEYS.forEach(([k, t, short]) => {
      const b = document.createElement('button'); b.innerHTML = `<kbd>${k}</kbd>${short}`; b.title = label(t); b.onclick = () => forceNext(t);
      keys.appendChild(b);
    });
    renderPending();
  }
  function renderPending() {
    const n = G.queue.filter(q => q.cheat).length, next = G.queue[0];
    const p = menu.querySelector('.pending'); if (p) p.textContent = n ? `${n} forced spin${n > 1 ? 's' : ''} queued` : 'No forced spins';
    chip.hidden = !(next && next.cheat);
    if (next && next.cheat) chip.textContent = `Next: ${label(next.type)}${n > 1 ? `  (+${n - 1} more)` : ''}`;
  }
  const prevChange = G.onChange;
  G.onChange = () => { prevChange(); renderPending(); };

  /* ---------------- demo panel: scenario list with Load / Play ---------------- */
  const panelList = $('#scenarios');
  if (panelList) SCENARIOS.forEach(s => {
    const row = document.createElement('div'); row.className = 'scen';
    row.innerHTML = `<span title="${s.note}">${s.label}</span>`;
    const load = document.createElement('button'); load.className = 'ghost small'; load.textContent = 'Load'; load.title = 'Put this scenario in the list (for recording)';
    load.onclick = () => playScenario(s.id, { load: true });
    const play = document.createElement('button'); play.className = 'small'; play.textContent = 'Play';
    play.onclick = () => playScenario(s.id);
    row.append(load, play); panelList.appendChild(row);
  });

  /* ---------------- hotkeys ---------------- */
  document.addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'c') { toggle(); return; }
    if (k === 'escape') { toggle(false); return; }
    if (k === '0') { clearForced(); return; }
    if (KEYMAP[k]) { e.preventDefault(); forceNext(KEYMAP[k]); }
  });

  /* ---------------- scenario links ---------------- */
  function fromUrl() {
    const q = new URLSearchParams(location.search).get('scenario');
    const h = (location.hash.match(/^#scenario-([a-z0-9-]+)$/) || [])[1];
    return q || h;
  }
  root.Cheats = { SCENARIOS, HOTKEYS, forceNext, playScenario, clearForced, toggle };
  renderMenu();
  const want = fromUrl();
  if (want) {
    // wait for the game to finish loading its art
    const t0 = Date.now(), go = () => (G.assetInfo || Date.now() - t0 > 8000) ? setTimeout(() => playScenario(want), 800) : setTimeout(go, 100);
    go();
  }
})(window);
