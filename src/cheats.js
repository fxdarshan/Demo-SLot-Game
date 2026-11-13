/*
 * Cheats: force the next spin, or play a whole scenario.
 *
 *   C          open / close the cheat menu (drawn over the game, never in recordings)
 *   1 - 6      next spin shows NICE, BIG, MEGA*, SUPERB*, SENSATIONAL*, EPIC (Ghost award)
 *   F          next spin triggers free spins (Dance Bear)
 *   S / M / A  Scare Bear large / medium / small
 *   H          Charm Bear          U  upgrade chain      W  Wipe        G  Ghost (100x)
 *   X          single win          N  no win             0  clear forced spins
 *   Symbol win dropdown (in the menu): pick a symbol and 3, 4 or 5 in a row, then Force next spin or Play now.
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
  const label = t => (typeof t === 'string' ? (OUT[t] || { label: t }).label : root.Director.describe(t, Game.C));

  /* ---------------- actions ---------------- */
  function forceNext(type) {
    const item = typeof type === 'string' ? { type, cheat: true } : Object.assign({ cheat: true }, type);
    G.queue.unshift(item);
    G.onChange();
    note(`Next spin: ${label(item)}`);
  }
  // symbol win: the chosen symbol, len in a row (3-5), on the middle payline
  const symWin = (sym, len) => ({ type: 'symwin', sym: Number(sym), len: Number(len) });
  const symbolOptions = () => Object.entries(Game.C.symbolNames).filter(([k]) => k >= 0 && k <= 6).sort((a, b) => a[0] - b[0])
    .map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
  function playScenario(id, opts = {}) {
    const sc = SCENARIOS.find(s => s.id === id); if (!sc) { note(`Unknown scenario: ${String(id).slice(0, 40)}`); return false; }
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
      <section><h4>Play a scenario</h4>
        <div class="symrow"><select class="scsel" aria-label="Scenario"></select><button class="play sc-play">Play</button><button class="link sc-link" title="Copy a link that opens this scenario">Link</button></div>
        <small class="scnote"></small></section>
      <section><h4>Symbol win</h4>
        <div class="symrow">
          <select class="sym" aria-label="Symbol">${symbolOptions()}</select>
          <select class="len" aria-label="In a row"><option value="3">3 in a row</option><option value="4">4 in a row</option><option value="5">5 in a row</option></select>
          <button class="sw-force">Force next spin</button><button class="play sw-now">Play now</button>
        </div></section>
      <section><h4>Force the next spin</h4><div class="keys"></div></section>
      <footer><span class="pending"></span><button class="clear">Clear forced (0)</button></footer>
      <p class="fine">* Presentation cheat: a real big-win board with an amount in that banner's range. A single spin can't reach these tiers under the rules.</p>`;
    menu.querySelector('.x').onclick = () => toggle(false);
    menu.querySelector('.clear').onclick = clearForced;
    const pick = () => symWin(menu.querySelector('.sym').value, menu.querySelector('.len').value);
    menu.querySelector('.sw-force').onclick = () => forceNext(pick());
    menu.querySelector('.sw-now').onclick = () => { forceNext(pick()); if (!G.busy) { toggle(false); Game.play(); } };
    const scsel = menu.querySelector('.scsel'), scnote = menu.querySelector('.scnote');
    scsel.innerHTML = SCENARIOS.map(s => `<option value="${s.id}">${s.label}</option>`).join('');
    const cur = () => SCENARIOS.find(s => s.id === scsel.value);
    const showNote = () => { scnote.textContent = cur().note; };
    scsel.onchange = showNote; showNote();
    menu.querySelector('.sc-play').onclick = () => { toggle(false); playScenario(cur().id); };
    menu.querySelector('.sc-link').onclick = () => { const u = linkFor(cur().id); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => note('Link copied'), () => note(u)); };
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
    if (next && next.cheat) chip.textContent = `Next: ${label(next)}${n > 1 ? `  (+${n - 1} more)` : ''}`;
  }
  const prevChange = G.onChange;
  G.onChange = () => { prevChange(); renderPending(); };

  /* ---------------- demo panel: scenario list with Load / Play ---------------- */
  const panelList = $('#scenarios');
  if (panelList) {
    panelList.innerHTML = `<div class="symrow"><select id="scPanelSel" aria-label="Scenario"></select></div>
      <p class="hint" id="scPanelNote"></p>
      <div class="row"><button class="ghost small" id="scPanelLoad" title="Put this scenario in the list (for recording)">Load into list</button><button class="small" id="scPanelPlay">Play</button></div>`;
    const sel = $('#scPanelSel');
    sel.innerHTML = SCENARIOS.map(s => `<option value="${s.id}">${s.label}</option>`).join('');
    const cur = () => SCENARIOS.find(s => s.id === sel.value);
    const showNote = () => { $('#scPanelNote').textContent = cur().note; };
    sel.onchange = showNote; showNote();
    $('#scPanelLoad').onclick = () => playScenario(cur().id, { load: true });
    $('#scPanelPlay').onclick = () => playScenario(cur().id);
  }

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
  root.Cheats = { SCENARIOS, HOTKEYS, forceNext, symWin, playScenario, clearForced, toggle };
  renderMenu();
  const want = fromUrl();
  if (want) {
    // wait for the game to finish loading its art and for the splash screen to leave
    const t0 = Date.now(), go = () => ((G.assetInfo && !(root.Splash && root.Splash.active())) || Date.now() - t0 > 12000) ? setTimeout(() => playScenario(want), 800) : setTimeout(go, 100);
    go();
  }
})(window);
