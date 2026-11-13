/*
 * Game: reel spinning, step-by-step presentation of engine results,
 * free spins flow, celebrations and the in-canvas UI bar.
 * Everything is drawn on one canvas (#stage) so it can be recorded to video.
 */
(function (root) {
  const C = root.CONFIG, A = root.Assets, SND = root.Audio2, P = root.Placeholders;
  const engine = root.Engine.create(C);
  const director = root.Director.create(C, engine);
  const cv = document.getElementById('stage'), ctx = cv.getContext('2d');
  const [W, H] = C.stage.landscape; cv.width = W; cv.height = H;
  const T = C.timing;
  const SCRIPT = '"Pacifico", "Brush Script MT", cursive';
  const BLOCK = '"Lilita One", "Arial Black", sans-serif';
  const UIF = '"IBM Plex Sans", system-ui, sans-serif';

  const now = () => performance.now() / 1000;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = { out: u => 1 - Math.pow(1 - u, 3), back: (u, s = 1.7) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2), inOut: u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2 };
  const fmt = v => C.currency + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const colorOf = s => (P.DOLL[s] ? P.DOLL[s].c[1] : '#f2b73a');

  /* ------------------------------------------------------------ state */
  const G = {
    balance: C.startBalance, betIndex: C.defaultBetIndex, spinWin: 0, winShown: 0, winFrom: 0, winT0: 0,
    busy: false, autoplay: false, skip: 0, speed: 1,
    board: engine.randomGrid({ allowWild: false }), fx: null, reels: [], spinResolve: null,
    patches: new Map(), labels: [], particles: [], bubble: null, celebration: null, bolts: null,
    bg: 'background', bgPrev: null, bgT0: 0,
    fs: { active: false, left: 0, played: 0, total: 0 },
    queue: [], onChange: () => {}, onStatus: () => {}
  };
  const bet = () => C.bets[G.betIndex];
  const newFx = () => G.board.map(col => col.map(() => ({})));
  G.fx = newFx();

  /* ------------------------------------------------------------ layout */
  const barH = 100;
  const cell = Math.min((H - barH - 40) / C.rows, W * .78 / C.reels);
  const gw = cell * C.reels, gh = cell * C.rows, x0 = (W - gw) / 2, y0 = (H - barH - gh) / 2;
  const cellCenter = (c, r) => [x0 + c * cell + cell / 2, y0 + r * cell + cell / 2];
  const spinBtn = { x: W - 118, y: H - barH / 2 - 22, r: 76 };
  const autoBtn = { x: W - 250, y: H - barH / 2, r: 34 };
  const betBtn = { x: W - 340, y: H - barH / 2, r: 34 };
  const soundBtn = { x: 130, y: H - barH / 2, r: 26 };

  /* ------------------------------------------------------------ waits */
  function wait(sec, skippable = true) {
    const tok = G.skip, end = performance.now() + sec * 1000 / G.speed;
    return new Promise(res => { const tick = () => (performance.now() >= end || (skippable && G.skip !== tok)) ? res() : setTimeout(tick, 16); tick(); });
  }
  function setBg(key) { if (G.bg === key) return; G.bgPrev = G.bg; G.bg = key; G.bgT0 = now(); }

  /* ------------------------------------------------------------ reels */
  function startReels(grid) {
    return new Promise(resolve => {
      const t0 = now(), v = T.symbolSpeed, R = C.rows;
      grid.forEach((col, i) => {
        const cur = G.board[i];
        const Tstop = (T.spinBase + i * T.reelGap) / G.speed, wu = .12;
        const N = Math.max(R + 3, Math.round(v * (Tstop - wu)));
        const s = [engine.randomSymbol(i), ...col, engine.randomSymbol(i)];
        for (let k = 1; k < N; k++) s.push(engine.randomSymbol(i));
        s.push(engine.randomSymbol(i), ...cur, engine.randomSymbol(i));
        const pStart = R + N + 2, D = pStart - 1;
        const vEff = (D - .9) / (Tstop - wu), slope = T.bounce > 0 ? T.bounce + 3 : 3;
        G.reels[i] = { strip: s, p: pStart, pStart, D, t0, T: Tstop, wu, vEff, bt: clamp(.9 * slope / vEff, .12, .6), state: 'spin', landed: false };
      });
      G.spinGrid = grid; G.spinResolve = resolve;
    });
  }
  function updateReels(t) {
    G.reels.forEach((r, i) => {
      if (!r || r.state !== 'spin') return;
      const tau = t - r.t0; let d;
      r.blur = false;
      if (tau < r.wu) d = -.2 * Math.sin(Math.PI * tau / r.wu);
      else if (tau < r.T) { d = r.vEff * (tau - r.wu); r.blur = r.T - tau > .03; }
      else {
        const u = Math.min(1, (tau - r.T) / r.bt);
        d = (r.D - .9) + .9 * (T.bounce > 0 ? ease.back(u, T.bounce) : ease.out(u));
        if (!r.landed && u > .3) { r.landed = true; SND.play('reel_stop'); }
        if (u >= 1) { r.state = 'idle'; G.board[i] = G.spinGrid[i].slice(); return; }
      }
      r.p = r.pStart - d;
    });
    if (G.spinResolve && G.reels.every(r => !r || r.state === 'idle')) { const f = G.spinResolve; G.spinResolve = null; f(); }
  }

  /* ------------------------------------------------------------ particles */
  function emit(type, x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = (o.angle ?? -Math.PI / 2) + (Math.random() - .5) * (o.spread ?? 1.6), sp = (o.speed ?? 500) * (.5 + Math.random());
      G.particles.push({ type, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.gravity ?? 900, life: 0, max: o.life ?? 1.4,
        rot: Math.random() * 6, vr: (Math.random() - .5) * 8, size: (o.size ?? 22) * (.7 + Math.random() * .6), color: o.color || '#fff' });
    }
  }
  function drawParticles(dt) {
    G.particles = G.particles.filter(p => p.life < p.max);
    for (const p of G.particles) {
      p.life += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const a = 1 - Math.pow(p.life / p.max, 2);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot * (p.type === 'note' ? .1 : 1));
      if (p.type === 'heart') { ctx.fillStyle = p.color; heartPath(0, 0, p.size); ctx.fill(); }
      else if (p.type === 'note') { ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(0, 0, p.size * .45, p.size * .32, -.4, 0, 7); ctx.fill(); ctx.fillRect(p.size * .32, -p.size * 1.3, p.size * .12, p.size * 1.3); }
      else if (p.type === 'shell') { ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-p.size / 2, 0); ctx.lineTo(0, -p.size / 2); ctx.lineTo(p.size / 2, p.size / 3); ctx.closePath(); ctx.fill(); }
      else if (p.type === 'coin') {
        const w = Math.abs(Math.cos(p.rot)) * p.size + 2;
        ctx.fillStyle = '#f7c948'; ctx.beginPath(); ctx.ellipse(0, 0, w, p.size, 0, 0, 7); ctx.fill();
        ctx.setLineDash([4, 4]); ctx.strokeStyle = '#a8681a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, w * .7, p.size * .7, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      } else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
  }
  function heartPath(cx, cy, s) {
    ctx.beginPath(); ctx.moveTo(cx, cy + s * .35);
    ctx.bezierCurveTo(cx - s * .9, cy - s * .2, cx - s * .4, cy - s * .9, cx, cy - s * .35);
    ctx.bezierCurveTo(cx + s * .4, cy - s * .9, cx + s * .9, cy - s * .2, cx, cy + s * .35); ctx.closePath();
  }

  /* ------------------------------------------------------------ knitted text */
  let knitPat = null;
  function knitPattern() {
    if (knitPat) return knitPat;
    const c = document.createElement('canvas'); c.width = 24; c.height = 20; const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 24, 20);
    x.fillStyle = '#d9d3cf';
    x.beginPath(); x.ellipse(7, 10, 4.5, 11, -.6, 0, 7); x.fill(); x.beginPath(); x.ellipse(17, 10, 4.5, 11, .6, 0, 7); x.fill();
    x.fillStyle = '#fbfaf8';
    x.beginPath(); x.ellipse(7, 9, 3, 8, -.6, 0, 7); x.fill(); x.beginPath(); x.ellipse(17, 9, 3, 8, .6, 0, 7); x.fill();
    return (knitPat = ctx.createPattern(c, 'repeat'));
  }
  const textCanvas = document.createElement('canvas'), tctx = textCanvas.getContext('2d');
  function knitText(txt, x, y, size, o = {}) {
    tctx.font = `${size}px ${BLOCK}`;
    const w = Math.ceil(tctx.measureText(txt).width + size * .5), h = Math.ceil(size * 1.5);
    textCanvas.width = w; textCanvas.height = h;
    tctx.font = `${size}px ${BLOCK}`; tctx.textAlign = 'center'; tctx.textBaseline = 'middle';
    const d = size * .07, ext = o.ext || '#e38a1c';
    for (let i = 4; i >= 1; i--) { tctx.fillStyle = i === 4 ? '#5a2c06' : ext; tctx.fillText(txt, w / 2 + d * i * .5, h / 2 + d * i * .6); }
    tctx.lineJoin = 'round'; tctx.lineWidth = size * .08; tctx.strokeStyle = '#3d1f05'; tctx.strokeText(txt, w / 2, h / 2);
    tctx.fillStyle = '#fff'; tctx.fillText(txt, w / 2, h / 2);
    tctx.globalCompositeOperation = 'source-atop'; tctx.globalAlpha = .55; tctx.fillStyle = knitPattern(); tctx.fillRect(0, 0, w, h * .62); tctx.globalAlpha = 1;
    tctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.translate(x, y); const k = (o.scale ?? 1) * (o.maxW && w > o.maxW ? o.maxW / w : 1); ctx.scale(k, k);
    ctx.drawImage(textCanvas, -w / 2, -h / 2); ctx.restore();
  }
  function scriptText(txt, x, y, size, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(o.scale ?? 1, o.scale ?? 1); ctx.globalAlpha = o.alpha ?? 1;
    ctx.font = `${size}px ${SCRIPT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const g = ctx.createLinearGradient(-size * 2, 0, size * 2, 0); (o.colors || ['#c9f3ff', '#ffffff', '#9fe8c7']).forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
    ctx.lineJoin = 'round'; ctx.lineWidth = size * .2; ctx.strokeStyle = 'rgba(40,20,60,.9)'; ctx.strokeText(txt, 0, 0);
    ctx.lineWidth = size * .08; ctx.strokeStyle = o.rim || '#2b8fa3'; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = g; ctx.fillText(txt, 0, 0); ctx.restore();
  }

  /* ------------------------------------------------------------ drawing */
  function drawBg(t) {
    const cur = A.get(G.bg), prev = G.bgPrev && A.get(G.bgPrev), u = clamp((t - G.bgT0) / .6, 0, 1);
    if (prev && u < 1) ctx.drawImage(prev, 0, 0, W, H);
    if (cur) { ctx.globalAlpha = prev ? u : 1; ctx.drawImage(cur, 0, 0, W, H); ctx.globalAlpha = 1; }
  }
  function drawSprite(img, cx, cy, size, o = {}) {
    if (!img) return;
    ctx.save(); ctx.translate(cx, cy + (o.dy || 0)); if (o.rot) ctx.rotate(o.rot); ctx.globalAlpha = o.alpha ?? 1;
    const k = o.scale ?? 1; ctx.drawImage(img, -size * k / 2, -size * k / 2, size * k, size * k); ctx.restore();
  }
  function drawCell(c, r, s, cx, cy, t) {
    const fx = G.fx[c][r] || {}, size = cell * .96;
    let rot = 0, dx = 0, scale = 1;
    if (fx.wobble) { const e = t - fx.wobble; rot = Math.sin(e * 28) * .09 * Math.min(1, e * 2); dx = Math.sin(e * 34) * 4; }
    if (fx.shake && t < fx.shake) { dx = Math.sin(t * 70) * 7; }
    if (fx.bounce) { const e = (t - fx.bounce) / .5; if (e < 1) scale = 1 + .1 * Math.sin(e * Math.PI); }
    cx += dx;
    // pop: lid lifts, old base fades, new doll grows out of it
    if (fx.pop) {
      const u = clamp((t - fx.pop.t0) / fx.pop.dur, 0, 1), from = A.symbol(fx.pop.from, C), to = A.symbol(s, C);
      if (u < 1) {
        const sy = A.splitY, half = size * sy;
        ctx.save(); ctx.globalAlpha = 1 - u; ctx.translate(cx, cy - size * .25 * u - cell * .2 * ease.out(u)); ctx.rotate(-.35 * u);
        ctx.drawImage(from, 0, 0, from.width, from.height * sy, -size / 2, -size / 2 + size * .25 * u, size, half); ctx.restore();
        ctx.save(); ctx.globalAlpha = clamp(1 - u * 1.6, 0, 1);
        ctx.drawImage(from, 0, from.height * sy, from.width, from.height * (1 - sy), cx - size / 2, cy - size / 2 + half + size * .1 * u, size, size - half); ctx.restore();
        drawSprite(to, cx, cy, size, { scale: .45 + .55 * ease.back(clamp(u * 1.25, 0, 1)) });
        return;
      }
      fx.pop = null;
    }
    if (fx.ghost) {
      const u = clamp((t - fx.ghost) / (T.wipeTransform * .7), 0, 1);
      drawSprite(A.symbol(s === C.GHOST ? fx.ghostFrom : s, C), cx, cy, size, { alpha: 1 - u, scale });
      drawSprite(A.get('ghost'), cx, cy - Math.sin(t * 2 + c + r) * 6 * u, size, { alpha: u, scale: scale * (1 + .05 * Math.sin(t * 3 + c)) });
      return;
    }
    if (s === C.WILD && fx.bear) { drawSprite(A.get('bear_' + fx.bear), cx, cy - cell * .04, size, { scale: 1.12 * scale, rot }); return; }
    drawSprite(A.symbol(s, C, fx.scared), cx, cy, size, { rot, scale: (s === C.WILD ? 1.12 : 1) * scale });
    if (C.showLevelBadges && !A.real['symbol_L' + s] && s >= 1 && s <= 7) {
      ctx.save(); ctx.font = `600 20px ${UIF}`; ctx.fillStyle = 'rgba(30,20,50,.55)'; ctx.textAlign = 'center';
      ctx.beginPath(); ctx.roundRect(cx + size * .26, cy + size * .3, 44, 26, 13); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText('L' + s, cx + size * .26 + 22, cy + size * .3 + 20); ctx.restore();
    }
  }
  function drawGrid(t) {
    // win patches behind symbols
    G.patches.forEach((p, k) => {
      const [c, r] = k.split(',').map(Number), [cx, cy] = cellCenter(c, r), a = clamp((t - p.t0) / .2, 0, 1);
      ctx.globalAlpha = a * (p.fade ? clamp(1 - (t - p.fade) / .25, 0, 1) : 1);
      const img = A.patch(p.color), s = cell * 1.18; ctx.drawImage(img, cx - s / 2, cy - s / 2, s, s); ctx.globalAlpha = 1;
    });
    ctx.save(); ctx.beginPath(); ctx.rect(0, y0 - cell * .04, W, gh + cell * .08); ctx.clip();
    for (let c = 0; c < C.reels; c++) {
      const r = G.reels[c];
      if (r && r.state === 'spin') {
        const j0 = Math.floor(r.p) - 1, j1 = Math.ceil(r.p + C.rows);
        for (let j = Math.max(0, j0); j <= Math.min(r.strip.length - 1, j1); j++) {
          const cx = x0 + c * cell + cell / 2, cy = y0 + (j - r.p) * cell + cell / 2;
          const img = A.symbol(r.strip[j], C);
          if (r.blur) { for (let k = -2; k <= 2; k++) drawSprite(img, cx, cy + k * cell * .06, cell * .96, { alpha: k ? .22 : .5, scale: r.strip[j] === C.WILD ? 1.12 : 1 }); }
          else drawSprite(img, cx, cy, cell * .96, { scale: r.strip[j] === C.WILD ? 1.12 : 1 });
        }
      }
    }
    ctx.restore();
    for (let c = 0; c < C.reels; c++) {
      const r = G.reels[c]; if (r && r.state === 'spin') continue;
      for (let row = 0; row < C.rows; row++) { const [cx, cy] = cellCenter(c, row); drawCell(c, row, G.board[c][row], cx, cy, t); }
    }
    // scare lightning around the bear
    if (G.bolts && t < G.bolts.until) {
      const [cx, cy] = cellCenter(G.bolts.c, G.bolts.r);
      ctx.save(); ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 12;
      for (let i = 0; i < 7; i++) {
        if (Math.sin(t * 20 + i * 3) < 0) continue;
        const a = -Math.PI * .9 + i * Math.PI * .3, rr = cell * .55, bx = cx + Math.cos(a) * rr, by = cy - cell * .1 + Math.sin(a) * rr * .8;
        ctx.beginPath(); ctx.moveTo(bx, by - 18); ctx.lineTo(bx - 8, by); ctx.lineTo(bx + 6, by + 2); ctx.lineTo(bx - 4, by + 20); ctx.stroke();
      }
      ctx.restore();
    }
    // win amounts
    G.labels.forEach(l => { const a = clamp((t - l.t0) / .2, 0, 1); knitText(l.text, l.x, l.y, 64, { scale: .6 + .4 * ease.back(a), alpha: a }); });
  }
  function drawBubble(t) {
    const b = G.bubble; if (!b) return;
    const [ex, ey] = cellCenter(b.c, b.r), bx = Math.min(ex + cell * 1.05, W - 330), by = Math.max(ey - cell * .8, 190);
    const u = ease.back(clamp((t - b.t0) / .35, 0, 1)), a = b.fade ? clamp(1 - (t - b.fade) / .3, 0, 1) : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(bx, by); ctx.scale(u, u);
    const img = A.real['bubble_' + b.bear] && A.get('bubble_' + b.bear);
    if (img) { ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore(); return; }
    const col = { scare: '#ff6a5a', charm: '#ff7ad9', dance: '#c6ff7a' }[b.bear];
    ctx.fillStyle = 'rgba(25,18,30,.82)';
    ctx.beginPath(); ctx.ellipse(0, 0, 300, 165, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-210, 90); ctx.lineTo(-330, 210); ctx.lineTo(-140, 120); ctx.fill();
    ctx.setLineDash([16, 12]); ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 282, 148, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    if (b.bear === 'scare') { ctx.font = `150px ${SCRIPT}`; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!!!', 0, 10); }
    if (b.bear === 'charm') { ctx.lineWidth = 9; ctx.strokeStyle = col; heartPath(0, 25, 150); ctx.stroke(); }
    if (b.bear === 'dance') { ctx.font = `96px ${SCRIPT}`; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Free spins', 0, 0); }
    ctx.restore();
  }
  function drawCelebration(t) {
    const c = G.celebration; if (!c) return;
    const e = t - c.t0, u = clamp(e / c.count, 0, 1), shown = c.amount * ease.out(u);
    if (u < 1 && t - (c.tick || 0) > .08) { c.tick = t; SND.play('tick'); }
    if (u < 1 && Math.random() < .5) emit('coin', W / 2 + (Math.random() - .5) * W * .5, H + 20, 1, { angle: -Math.PI / 2, spread: .6, speed: 1400, gravity: 1500, life: 2.2, size: 26 });
    const a = c.fade ? clamp(1 - (t - c.fade) / .35, 0, 1) : clamp(e / .25, 0, 1);
    ctx.save(); ctx.globalAlpha = a * .25; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const pop = ease.back(clamp(e / .5, 0, 1));
    scriptText(c.title, W / 2, H * .25, 170, { scale: pop, alpha: a, colors: c.colors, rim: c.rim });
    knitText(fmt(shown), W / 2, H * .53, 230, { alpha: a, maxW: W * .85 });
  }
  function drawUI(t) {
    // free spins counter
    if (G.fs.active) {
      ctx.save(); ctx.fillStyle = 'rgba(20,16,30,.78)'; ctx.beginPath(); ctx.roundRect(W - 245, H - barH - 160, 220, 120, 12); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = `600 20px ${UIF}`; ctx.textAlign = 'center'; ctx.fillText('FREE SPINS', W - 135, H - barH - 122);
      ctx.fillStyle = '#fff'; ctx.font = `58px ${BLOCK}`; ctx.fillText(String(G.fs.left), W - 135, H - barH - 62); ctx.restore();
    }
    ctx.fillStyle = 'rgba(14,12,18,.92)'; ctx.fillRect(0, H - barH + 12, W, barH);
    const ly = H - barH + 46, vy = H - barH + 88;
    const field = (label, val, x) => { ctx.font = `600 17px ${UIF}`; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.textAlign = 'left'; ctx.fillText(label, x, ly); ctx.font = `40px ${BLOCK}`; ctx.fillStyle = '#fff'; ctx.fillText(val, x, vy); };
    const ws = G.winShown + (G.spinWin - G.winShown) * ease.out(clamp((t - G.winT0) / .6, 0, 1));
    field('CASH', fmt(G.balance), 230); field('TOTAL WIN', G.spinWin > 0 ? fmt(ws) : '', 700); field('BET', fmt(bet()), 1110);
    // menu + sound
    ctx.save(); ctx.fillStyle = '#1e1b26'; ctx.beginPath(); ctx.arc(62, H - barH / 2, 38, 0, 7); ctx.fill(); ctx.fillStyle = '#fff';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(62 + (i % 3 - 1) * 14, H - barH / 2 + (Math.floor(i / 3) - 1) * 14, 4.5, 0, 7); ctx.fill(); }
    ctx.translate(soundBtn.x, soundBtn.y); ctx.beginPath(); ctx.moveTo(-14, -7); ctx.lineTo(-6, -7); ctx.lineTo(4, -16); ctx.lineTo(4, 16); ctx.lineTo(-6, 7); ctx.lineTo(-14, 7); ctx.closePath(); ctx.fill();
    if (!SND.muted) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(6, 0, 10, -.9, .9); ctx.stroke(); ctx.beginPath(); ctx.arc(6, 0, 17, -.9, .9); ctx.stroke(); }
    else { ctx.strokeStyle = '#ff6a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -9); ctx.lineTo(24, 9); ctx.moveTo(24, -9); ctx.lineTo(10, 9); ctx.stroke(); }
    ctx.restore();
    // bet + autoplay
    const round = (b, on) => { ctx.fillStyle = on ? '#e8e2f5' : '#2a2633'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#4a4458'; ctx.stroke(); };
    round(betBtn); ctx.fillStyle = '#fff'; ctx.font = `30px ${BLOCK}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1', betBtn.x, betBtn.y + 2);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(betBtn.x, betBtn.y, 24, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    round(autoBtn, G.autoplay); ctx.fillStyle = G.autoplay ? '#2a2633' : '#fff'; ctx.beginPath(); ctx.moveTo(autoBtn.x - 8, autoBtn.y - 14); ctx.lineTo(autoBtn.x + 14, autoBtn.y); ctx.lineTo(autoBtn.x - 8, autoBtn.y + 14); ctx.closePath(); ctx.fill();
    // spin
    const b = spinBtn;
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.fillStyle = G.busy ? '#1d1a22' : '#121016'; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, 7); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#3a3542'; ctx.stroke();
    ctx.rotate(G.busy ? t * 8 : 0); ctx.strokeStyle = G.busy ? '#77707f' : '#fff'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 14; ctx.lineCap = 'butt';
    for (let k = 0; k < 2; k++) {
      ctx.save(); ctx.rotate(k * Math.PI); ctx.beginPath(); ctx.arc(0, 0, 40, Math.PI * 1.05, Math.PI * 1.8); ctx.stroke();
      const a = Math.PI * 1.8; ctx.translate(Math.cos(a) * 40, Math.sin(a) * 40); ctx.rotate(a + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-6, -15); ctx.lineTo(-6, 15); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.restore(); ctx.textBaseline = 'alphabetic';
  }

  let lastT = now();
  function frame() {
    const t = now(), dt = Math.min(.05, t - lastT); lastT = t;
    updateReels(t);
    if (G.fs.active && Math.random() < dt * 1.6) emit('note', Math.random() < .5 ? 60 + Math.random() * 120 : W - 60 - Math.random() * 120, H * .75, 1, { angle: -Math.PI / 2, spread: .3, speed: 120, gravity: -10, life: 4, size: 34, color: ['#c6ff7a', '#7ad9ff', '#ffe27a'][Math.floor(Math.random() * 3)] });
    drawBg(t);
    drawGrid(t);
    drawBubble(t);
    drawCelebration(t);
    drawParticles(dt);
    drawUI(t);
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------ presentation of steps */
  function clearWinFx() {
    const t = now(); G.patches.forEach(p => { p.fade = t; }); setTimeout(() => { G.patches.forEach((p, k) => { if (p.fade) G.patches.delete(k); }); }, 260);
    G.labels = [];
  }
  function addWin(amount) { G.winShown = G.spinWin; G.spinWin = Math.round((G.spinWin + amount) * 100) / 100; G.winT0 = now(); }

  async function playStep(s) {
    const t = now();
    if (s.type === 'win') {
      clearWinFx(); await wait(.05, false);
      s.wins.forEach(w => {
        const col = colorOf(w.sym);
        w.positions.forEach(([c, r]) => { G.patches.set(c + ',' + r, { color: col, t0: now() }); G.fx[c][r].bounce = now(); });
        const [c, r] = w.positions[w.positions.length - 1], [cx, cy] = cellCenter(c, r);
        if (!G.labels.find(l => l.c === c && l.r === r)) G.labels.push({ c, r, x: cx, y: cy + cell * .28, t0: now(), text: (w.amount).toFixed(2) });
      });
      SND.play('win'); addWin(s.amount);
      await wait(T.winShow);
    } else if (s.type === 'pop') {
      clearWinFx();
      s.changes.forEach(ch => { G.fx[ch.c][ch.r].pop = { t0: now(), dur: T.pop / G.speed, from: ch.from }; G.board[ch.c][ch.r] = ch.to; });
      SND.play('pop');
      await wait(T.pop + .1);
    } else if (s.type === 'hatch') {
      clearWinFx();
      const [c, r] = s.pos, fx = G.fx[c][r];
      fx.wobble = now(); SND.play('egg_wobble');
      await wait(T.eggWobble);
      fx.wobble = 0; fx.bear = s.bear; SND.play('egg_hatch');
      const [cx, cy] = cellCenter(c, r);
      emit('shell', cx, cy - cell * .2, 14, { speed: 600, size: 26, color: '#f39a2a', life: 1.1 });
      G.bubble = { bear: s.bear, c, r, t0: now() }; SND.play('bear_' + s.bear);
      await wait(T.bearReveal + .5);
    } else if (s.type === 'bear') {
      const b = G.bubble;
      if (s.bear === 'scare') {
        G.bolts = { c: b.c, r: b.r, until: now() + 1.4 };
        s.changes.forEach(ch => { const f = G.fx[ch.c][ch.r]; f.scared = true; f.shake = now() + .9; });
        await wait(1.0);
        s.changes.forEach(ch => { const f = G.fx[ch.c][ch.r]; f.scared = false; f.pop = { t0: now(), dur: T.pop / G.speed, from: ch.from }; G.board[ch.c][ch.r] = ch.to; });
        if (s.changes.length) SND.play('pop');
        await wait(T.pop + .2);
      } else if (s.bear === 'charm') {
        s.changes.forEach(ch => { const [cx, cy] = cellCenter(ch.c, ch.r); emit('heart', cx, cy, 2, { speed: 220, gravity: -120, size: 30, color: '#ff7ad9', life: 1.2 }); });
        await wait(.8);
        s.changes.forEach(ch => { G.fx[ch.c][ch.r].pop = { t0: now(), dur: T.pop / G.speed, from: ch.from }; G.board[ch.c][ch.r] = ch.to; });
        if (s.changes.length) SND.play('pop');
        await wait(T.pop + .2);
      } else {
        const [cx, cy] = cellCenter(b.c, b.r);
        emit('note', cx, cy, 14, { speed: 300, gravity: -60, size: 34, color: '#c6ff7a', life: 2 });
        await wait(1.6);
      }
      if (G.bubble) G.bubble.fade = now();
      await wait(.3, false); G.bubble = null;
    } else if (s.type === 'wipe') {
      clearWinFx();
      setBg('background_wipewin'); SND.play('wipe');
      s.changes.forEach((ch, i) => { const f = G.fx[ch.c][ch.r]; f.ghost = now() + i * .02; f.ghostFrom = ch.from; G.board[ch.c][ch.r] = C.GHOST; });
      await wait(T.wipeTransform);
      addWin(s.amount);
      G.celebration = { title: 'Wipe Win', amount: G.spinWin, t0: now(), count: T.wipeExecute + 1, colors: ['#ffffff', '#c9b6ff', '#ff8ee0'], rim: '#9a4fd6' };
      await wait(T.wipeExecute + 3);
      G.celebration.fade = now(); await wait(.35, false); G.celebration = null;
    }
  }

  async function celebrate(total) {
    const tier = engine.tierOf(total, bet()); if (!tier) return;
    const names = [null, ['Big Win', 'background_bigwin'], ['Mega Win', 'background_megawin'], ['Epic Win', 'background_epicwin']][tier];
    const keep = G.bg; setBg(names[1]); SND.play('bigwin');
    G.celebration = { title: names[0], amount: total, t0: now(), count: T.bigWin, colors: ['#d5fbff', '#ffffff', '#a7f0cf'], rim: '#2b8fa3' };
    await wait(T.bigWin + 1.4);
    G.celebration.fade = now(); await wait(.35, false); G.celebration = null; setBg(keep);
  }

  /* ------------------------------------------------------------ spin flow */
  async function spinOnce(item, inFS) {
    const res = director.build(item || { type: 'random' }, { bet: bet(), inFreeSpins: inFS });
    G.fx = newFx(); G.patches.clear(); G.labels = []; G.bubble = null;
    if (!inFS) { G.balance = Math.round((G.balance - bet()) * 100) / 100; G.spinWin = 0; G.winShown = 0; }
    SND.play('spin');
    await startReels(res.start);
    for (const s of res.steps) await playStep(s);
    return res;
  }
  function nextItem() {
    const it = G.queue.length ? G.queue.shift() : { type: 'random' };
    if (it.loop) G.queue.push(it);
    G.onChange(); return it;
  }

  async function play() {
    if (G.busy) return false;
    G.busy = true; G.onChange(); SND.init(root.ASSET_MANIFEST);
    try {
      const base = await spinOnce(nextItem(), false);
      let roundWin = base.total;
      const hadWipe = base.steps.some(s => s.type === 'wipe');
      if (base.freeSpins) roundWin = await freeSpins(base.freeSpins, roundWin);
      else if (!hadWipe) await celebrate(base.total);
      roundWin = Math.min(roundWin, C.maxWin * bet());
      G.balance = Math.round((G.balance + roundWin) * 100) / 100;
      G.spinWin = roundWin; G.winShown = roundWin;
    } catch (e) { console.error(e); }
    G.busy = false; G.onChange();
    return true;
  }
  async function freeSpins(count, roundWin) {
    const fs = G.fs; Object.assign(fs, { active: true, left: count, played: 0, total: 0 });
    SND.play('fs_start'); setBg('background_freespins'); SND.playMusic('music_free');
    await wait(T.fsTransition);
    while (fs.left > 0) {
      fs.left--; fs.played++;
      await wait(.4, false);
      const r = await spinOnce(nextItem(), true);
      fs.total += r.total; roundWin += r.total;
      if (r.freeSpins && C.freeSpinsRetrigger) fs.left += r.freeSpins;
      if (roundWin >= C.maxWin * bet()) { roundWin = C.maxWin * bet(); break; }
    }
    await wait(.6, false);
    await celebrate(roundWin);
    fs.active = false; setBg('background'); SND.playMusic('music_base');
    return roundWin;
  }
  async function autoplayLoop() {
    G.autoplay = !G.autoplay; G.onChange();
    while (G.autoplay) { await play(); if (G.autoplay) await wait(T.betweenAutoSpins, false); }
  }
  async function playQueue(n) {
    G.autoplay = true; G.onChange();
    let i = 0; const max = n ?? G.queue.length;
    while (G.autoplay && i < max) { await play(); i++; if (i < max) await wait(T.betweenAutoSpins + .3, false); }
    G.autoplay = false; G.onChange();
  }

  /* ------------------------------------------------------------ input */
  cv.addEventListener('pointerdown', e => {
    SND.init(root.ASSET_MANIFEST);
    const rc = cv.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * W, y = (e.clientY - rc.top) / rc.height * H;
    const hit = b => Math.hypot(x - b.x, y - b.y) <= b.r * 1.15;
    if (hit(spinBtn)) { if (!G.busy) play(); else G.skip++; return; }
    if (hit(autoBtn)) { autoplayLoop(); return; }
    if (hit(betBtn)) { if (!G.busy) { G.betIndex = (G.betIndex + 1) % C.bets.length; G.onChange(); } return; }
    if (hit(soundBtn)) { SND.setMuted(!SND.muted); return; }
    G.skip++;
  });
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    const tg = e.target.tagName; if (tg === 'INPUT' || tg === 'SELECT' || tg === 'BUTTON' || tg === 'TEXTAREA') return;
    e.preventDefault(); SND.init(root.ASSET_MANIFEST); if (G.busy) G.skip++; else play();
  });

  /* ------------------------------------------------------------ boot */
  async function boot() {
    try { await Promise.race([Promise.all([document.fonts.load(`80px ${SCRIPT}`), document.fonts.load(`80px ${BLOCK}`)]), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
    const info = await A.load(root.ASSET_MANIFEST, W, H);
    G.assetInfo = info;
    requestAnimationFrame(frame);
    G.onChange();
  }

  root.Game = { G, C, engine, director, play, playQueue, autoplayLoop, boot, canvas: cv, bet, cellCenter };
})(window);
