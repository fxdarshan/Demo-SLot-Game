/*
 * Game presentation, timed to docs/animation-specifications.md (30 fps frame counts in CONFIG.frames).
 *
 * The engine resolves a spin into steps (hatch, bear, win, pop, wipe); this file
 * spins the reels and animates those steps, then runs banners, free spins
 * modals and transitions. Everything is drawn on one canvas (#stage) so it can
 * be recorded to video.
 */
(function (root) {
  const C = root.CONFIG, A = root.Assets, SND = root.Audio2, P = root.Placeholders;
  const engine = root.Engine.create(C);
  const director = root.Director.create(C, engine);
  const cv = document.getElementById('stage'), ctx = cv.getContext('2d');
  const [W, H] = C.stage.landscape; cv.width = W; cv.height = H;
  const FR = C.frames;
  const SCRIPT = '"Pacifico", "Brush Script MT", cursive';
  const BLOCK = '"Lilita One", "Arial Black", sans-serif';
  const UIF = '"IBM Plex Sans", system-ui, sans-serif';

  const now = () => performance.now() / 1000;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = {
    out: u => 1 - Math.pow(1 - u, 3),
    inOut: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
    back: (u, s = 1.7) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2),
    elastic: u => u <= 0 ? 0 : u >= 1 ? 1 : Math.pow(2, -10 * u) * Math.sin((u * 10 - .75) * (2 * Math.PI) / 3) + 1
  };
  const fmt = v => C.currency + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const colorOf = s => (P.DOLL[s] ? P.DOLL[s].c[1] : '#f2b73a');

  /* ------------------------------------------------------------ state */
  const G = {
    balance: C.startBalance, betIndex: C.defaultBetIndex, win: 0, winFrom: 0, winT0: 0,
    busy: false, spinning: false, autoplay: false, skip: 0, speed: 1,
    board: null, fx: null, reels: [], spinResolve: null,
    lines: null, labels: [], particles: [], bubble: null, waves: [], sweep: null, lock: null, greenT: 0,
    banner: null, modal: null, trans: null, info: false, antic: null,
    env: 0, envTarget: 0, camera: 1,
    fs: { active: false, left: 0, played: 0, total: 0, awarded: 0 },
    queue: [], onChange: () => {}
  };
  const bet = () => C.bets[G.betIndex];
  const sec = frames => frames / C.fps / G.speed;          // spec frames -> seconds at current speed

  /* ------------------------------------------------------------ layout */
  const barH = 110, topH = 70;
  const cell = Math.min((H - barH - topH) / (C.rows + .7), W * .78 / (C.reels + .7));
  const gw = cell * C.reels, gh = cell * C.rows, x0 = (W - gw) / 2, y0 = topH + (H - barH - topH - gh) / 2;
  const L = { cell, gw, gh, x0, y0, barH };
  const cellCenter = (c, r) => [x0 + c * cell + cell / 2, y0 + r * cell + cell / 2];
  const btn = {
    info: { x: 62, y: H - barH / 2, r: 34 },
    minus: { x: W - 600, y: H - barH / 2, r: 30 },
    plus: { x: W - 400, y: H - barH / 2, r: 30 },
    auto: { x: W - 290, y: H - barH / 2, r: 36 },
    spin: { x: W - 140, y: H - barH / 2 - 20, r: 76 },
    sound: { x: 128, y: H - barH / 2, r: 24 }
  };

  G.board = engine.randomGrid({ allowWild: false });
  const newFx = () => G.board.map(col => col.map(() => ({})));
  G.fx = newFx();

  /* ------------------------------------------------------------ waits */
  function wait(s, skippable = false) {
    const tok = G.skip, end = performance.now() + s * 1000;
    return new Promise(res => { const tick = () => (performance.now() >= end || (skippable && G.skip !== tok)) ? res() : setTimeout(tick, 10); tick(); });
  }
  const waitF = (frames, skippable) => wait(sec(frames), skippable);

  /* ------------------------------------------------------------ reels */
  function startReels(grid, antic) {
    return new Promise(resolve => {
      const t0 = now(), sp = C.spin, R = C.rows;
      let extra = 0;
      grid.forEach((col, i) => {
        const cur = G.board[i];
        if (antic && i === C.wildReel) extra = sec(FR.anticipation[0] + FR.anticipation[1] + FR.anticipation[2]);
        const Tstop = (sp.first + i * sp.gap) / G.speed + extra, wu = .12 / G.speed;
        const N = Math.max(R + 3, Math.round(sp.speed * (Tstop - wu)));
        const s = [engine.randomSymbol(i), ...col, engine.randomSymbol(i)];
        for (let k = 1; k < N; k++) s.push(engine.randomSymbol(i));
        s.push(engine.randomSymbol(i), ...cur, engine.randomSymbol(i));
        const pStart = R + N + 2, D = pStart - 1;
        const snap = antic && i === C.wildReel;                     // slam stop, no bounce
        const vEff = (D - .9) / (Tstop - wu), b = snap ? 0 : sp.bounce, slope = b > 0 ? b + 3 : 3;
        G.reels[i] = { strip: s, p: pStart, pStart, D, t0, T: Tstop, wu, vEff, b, bt: clamp(.9 * slope / vEff, .08, .6), state: 'spin', landed: false };
      });
      if (antic) { const r1 = G.reels[C.wildReel - 1]; G.antic = { t0: t0 + r1.T + r1.bt * .3, played: false }; }
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
        d = (r.D - .9) + .9 * (r.b > 0 ? ease.back(u, r.b) : ease.out(u));
        if (!r.landed && u > .3) {
          r.landed = true; SND.play('sfx_reel_stop_0' + (i + 1));
          if (G.antic && i === C.wildReel) { G.antic.flash = t; }
          const sc = G.spinGrid[i]; if (sc.includes(C.WILD)) { const rr = sc.indexOf(C.WILD); G.fx[i][rr].land = t; }
        }
        if (u >= 1) { r.state = 'idle'; G.board[i] = G.spinGrid[i].slice(); return; }
      }
      r.p = r.pStart - d;
    });
    if (G.antic && !G.antic.played && t >= G.antic.t0) { G.antic.played = true; SND.play('sfx_anticipation_reel3'); }
    if (G.spinResolve && G.reels.every(r => !r || r.state === 'idle')) { const f = G.spinResolve; G.spinResolve = null; f(); }
  }

  /* ------------------------------------------------------------ particles */
  function emit(type, x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = (o.angle ?? -Math.PI / 2) + (Math.random() - .5) * (o.spread ?? 1.6), sp = (o.speed ?? 500) * (.5 + Math.random());
      G.particles.push({ type, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.gravity ?? 900, life: 0, max: (o.life ?? 1.4) * (.8 + Math.random() * .4),
        rot: Math.random() * 6, vr: (Math.random() - .5) * 8, size: (o.size ?? 22) * (.7 + Math.random() * .6),
        color: Array.isArray(o.color) ? o.color[Math.floor(Math.random() * o.color.length)] : (o.color || '#fff'), tx: o.tx, ty: o.ty, burst: o.burst });
    }
  }
  function heartPath(cx, cy, s) {
    ctx.beginPath(); ctx.moveTo(cx, cy + s * .35);
    ctx.bezierCurveTo(cx - s * .9, cy - s * .2, cx - s * .4, cy - s * .9, cx, cy - s * .35);
    ctx.bezierCurveTo(cx + s * .4, cy - s * .9, cx + s * .9, cy - s * .2, cx, cy + s * .35); ctx.closePath();
  }
  function drawParticles(dt) {
    const born = [];
    G.particles = G.particles.filter(p => {
      if (p.life >= p.max) { if (p.burst) emit('spark', p.x, p.y, 26, { angle: 0, spread: 7, speed: 380, gravity: 220, life: 1.1, size: 7, color: p.burst }); return false; }
      return true;
    });
    for (const p of G.particles) {
      p.life += dt;
      if (p.tx != null) { const u = clamp(p.life / p.max, 0, 1), e = ease.inOut(u); p.x = lerp(p.x0 ?? (p.x0 = p.x), p.tx, e); p.y = lerp(p.y0 ?? (p.y0 = p.y), p.ty, e) - Math.sin(u * Math.PI) * 120; }
      else { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
      p.rot += p.vr * dt;
      const a = p.tx != null ? 1 : 1 - Math.pow(p.life / p.max, 2);
      ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.translate(p.x, p.y);
      if (p.type === 'heart') { ctx.fillStyle = p.color; heartPath(0, 0, p.size); ctx.fill(); }
      else if (p.type === 'note') { ctx.fillStyle = p.color; ctx.rotate(-.2); ctx.beginPath(); ctx.ellipse(0, 0, p.size * .45, p.size * .32, -.4, 0, 7); ctx.fill(); ctx.fillRect(p.size * .32, -p.size * 1.3, p.size * .12, p.size * 1.3); }
      else if (p.type === 'coin') {
        ctx.rotate(p.rot * .2); const w = Math.abs(Math.cos(p.rot)) * p.size + 2;
        ctx.fillStyle = '#f7c948'; ctx.beginPath(); ctx.ellipse(0, 0, w, p.size, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#a8681a'; ctx.lineWidth = 3; ctx.stroke(); if (w > p.size * .5) { ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.ellipse(-w * .2, -p.size * .2, w * .3, p.size * .3, 0, 0, 7); ctx.fill(); }
      } else if (p.type === 'confetti') { ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 * Math.abs(Math.cos(p.rot * 2))); }
      else if (p.type === 'shell') { ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-p.size / 2, 0); ctx.lineTo(0, -p.size / 2); ctx.lineTo(p.size / 2, p.size / 3); ctx.closePath(); ctx.fill(); }
      else if (p.type === 'rocket') { ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,200,120,.4)'; ctx.fillRect(-2, 0, 4, 30); }
      else { ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------ text helpers */
  function blockText(txt, x, y, size, o = {}) {
    ctx.save(); ctx.translate(x, y); const k = o.scale ?? 1; ctx.scale(k, k); ctx.globalAlpha = o.alpha ?? 1;
    ctx.font = `${size}px ${BLOCK}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (o.maxW) { const w = ctx.measureText(txt).width; if (w * k > o.maxW) { const s = o.maxW / (w * k); ctx.scale(s, s); } }
    const cols = o.colors || ['#ffffff', '#ffe08a', '#e8a22a'];
    const g = ctx.createLinearGradient(0, -size * .5, 0, size * .5); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
    ctx.lineJoin = 'round';
    ctx.fillStyle = o.shadow || 'rgba(60,20,10,.85)'; ctx.fillText(txt, size * .03, size * .07);
    ctx.lineWidth = size * .14; ctx.strokeStyle = o.stroke || '#3b1505'; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = g; ctx.fillText(txt, 0, 0); ctx.restore();
  }
  function scriptText(txt, x, y, size, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.scale(o.scale ?? 1, o.scale ?? 1); ctx.globalAlpha = o.alpha ?? 1;
    ctx.font = `${size}px ${SCRIPT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = size * .14; ctx.strokeStyle = o.stroke || 'rgba(40,10,20,.9)'; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = o.color || '#fff4d6'; ctx.fillText(txt, 0, 0); ctx.restore();
  }

  /* ------------------------------------------------------------ environment (ANIM 2) */
  function drawEnvironment(t) {
    const breathe = .5 - .5 * Math.cos(t / (FR.bgBaseLoop / C.fps) * Math.PI * 2); // 0..1..0 over 4s
    const layer = (main, orn, alpha) => {
      if (alpha <= 0) return;
      ctx.save(); ctx.globalAlpha = alpha;
      const bg = A.get(main);
      if (A.real[main]) {   // real art: breathe the whole background (scale 1 -> 1.02, opacity .85 -> 1)
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        const k = 1 + .02 * breathe; ctx.globalAlpha = alpha * (.85 + .15 * breathe);
        ctx.drawImage(bg, W / 2 - W * k / 2, H / 2 - H * k / 2, W * k, H * k);
      } else {
        ctx.drawImage(bg, 0, 0, W, H);
        const o = A.get(orn); if (o) { const k = 1 + .02 * breathe; ctx.globalAlpha = alpha * (.85 + .15 * breathe); ctx.drawImage(o, W / 2 - W * k / 2, H / 2 - H * k / 2, W * k, H * k); }
      }
      ctx.restore();
    };
    layer('bg_base_main', 'bg_base_ornaments', 1);
    layer('bg_freegame_main', 'bg_freegame_ornaments', G.env);
  }
  function drawReelStrips() {
    const strip = A.get('bg_base_reel_strip');
    for (let c = 0; c < C.reels; c++) ctx.drawImage(strip, x0 + c * cell, y0, cell, gh);
  }
  function drawFrame(t) {
    ctx.drawImage(A.get('bg_base_frame'), 0, 0, W, H);
    if (G.env > 0) { ctx.save(); ctx.globalAlpha = G.env; ctx.drawImage(A.get('bg_freegame_frame'), 0, 0, W, H); ctx.restore(); drawFreeLoop(t); }
  }
  // ANIM 2.2: party lights (30f cycle), sparkles, reel 3 glow (45f sine)
  function drawFreeLoop(t) {
    const a = G.env, p = cell * .16, fx = x0 - p - p * .45, fy = y0 - p - p * .45, fw = gw + p * 2.9, fh = gh + p * 2.9;
    const per = 2 * (fw + fh), n = 44, phase = Math.floor(t / (FR.fsLightCycle / C.fps) * 2) % 2;
    ctx.save(); ctx.globalAlpha = a;
    for (let i = 0; i < n; i++) {
      let d = i / n * per, bx, by;
      if (d < fw) { bx = fx + d; by = fy; } else if ((d -= fw) < fh) { bx = fx + fw; by = fy + d; } else if ((d -= fh) < fw) { bx = fx + fw - d; by = fy + fh; } else { d -= fw; bx = fx; by = fy + fh - d; }
      const red = (i + phase) % 2 === 0;
      ctx.shadowColor = red ? '#ff3b4a' : '#ffd23a'; ctx.shadowBlur = 16; ctx.fillStyle = red ? '#ff6670' : '#ffe27a';
      ctx.beginPath(); ctx.arc(bx, by, 8, 0, 7); ctx.fill();
    }
    ctx.shadowBlur = 0;
    // reel 3 guaranteed wild indicator
    const glow = .5 + .5 * (.5 - .5 * Math.cos(t / (FR.reel3Glow / C.fps) * Math.PI * 2));
    const ind = A.real.fx_reel3_guaranteed_wild_indicator && A.get('fx_reel3_guaranteed_wild_indicator');
    ctx.globalAlpha = a * glow;
    if (ind) ctx.drawImage(ind, x0 + C.wildReel * cell, y0, cell, gh);
    else { ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 8; ctx.shadowColor = '#ffc000'; ctx.shadowBlur = 26; ctx.beginPath(); ctx.roundRect(x0 + C.wildReel * cell + 4, y0 - 6, cell - 8, gh + 12, 18); ctx.stroke(); }
    ctx.restore();
    if (G.fs.active && Math.random() < .5) emit('spark', x0 - 40 + Math.random() * (gw + 80), y0 - 60, 1, { angle: Math.PI / 2, spread: .3, speed: 140, gravity: 60, life: 3, size: 6, color: ['#ffe27a', '#fff3c4', '#ffc23a'] });
  }

  /* ------------------------------------------------------------ symbols */
  function drawSprite(img, cx, cy, size, o = {}) {
    if (!img) return;
    ctx.save(); ctx.translate(cx, cy + (o.dy || 0)); if (o.rot) ctx.rotate(o.rot); ctx.globalAlpha = o.alpha ?? 1;
    const k = o.scale ?? 1, ky = o.scaleY ?? 1; ctx.drawImage(img, -size * k / 2, -size * k * ky / 2 + size * k * (1 - ky) / 2, size * k, size * k * ky); ctx.restore();
  }
  // sym_xx_win scale curve: 0-10f 1 -> 1.15 (ease-out), 10-30f hold with a small bob, 30-45f back to 1
  function winScale(f) {
    const [a, b, c] = FR.symWin;
    if (f < a) return 1 + .15 * ease.out(f / a);
    if (f < a + b) return 1.15 + .02 * Math.sin((f - a) / b * Math.PI);
    if (f < a + b + c) return 1.15 - .15 * ease.inOut((f - a - b) / c);
    return 1;
  }
  function drawCell(c, r, s, cx, cy, t) {
    const fx = G.fx[c][r] || {}, size = cell * .94, F = x => (t - x) * C.fps * G.speed;
    let scale = 1, rot = 0, dx = 0, sy = 1;
    if (fx.win != null) scale = winScale(F(fx.win));
    if (fx.shake && t < fx.shake) dx = Math.sin(t * 70) * 7;
    if (fx.land != null && s === C.WILD && !fx.open) { const f = F(fx.land); if (f < 15) sy = .85 + .15 * ease.back(f / 15, 2.5); }
    cx += dx;
    // nest open and morph (sym_xx_upgrade frames 10-45)
    if (fx.up) {
      const [, act, settle] = FR.symWin, f = F(fx.up.t0), from = A.symbol(fx.up.from, C), to = A.symbol(s, C);
      if (f < act + settle) {
        const u = clamp(f / act, 0, 1), sp = A.splitY;
        const base = f < act ? 1.15 : 1.15 - .15 * ease.inOut((f - act) / settle);
        if (f < act) {
          // glow inside the opening doll
          ctx.save(); ctx.globalAlpha = Math.sin(u * Math.PI) * .9; const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * .6); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(1, 'rgba(255,230,140,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - cell / 2, cy - cell / 2, cell, cell); ctx.restore();
          const s1 = size * base;
          drawSprite(to, cx, cy + s1 * .08 * (1 - u), size, { scale: base * (.55 + .3 * ease.out(u)), alpha: clamp(u * 2, 0, 1) });
          ctx.save(); ctx.globalAlpha = 1 - ease.out(u); ctx.translate(cx, cy - s1 * .32 * ease.out(u)); ctx.rotate(-.4 * u);
          ctx.drawImage(from, 0, 0, from.width, from.height * sp, -s1 / 2, -s1 / 2, s1, s1 * sp); ctx.restore();
          ctx.save(); ctx.globalAlpha = 1 - ease.out(u);
          ctx.drawImage(from, 0, from.height * sp, from.width, from.height * (1 - sp), cx - s1 / 2, cy - s1 / 2 + s1 * sp + s1 * .06 * u, s1, s1 * (1 - sp)); ctx.restore();
        } else drawSprite(to, cx, cy, size, { scale: base * (.85 + .15 * ease.back(clamp((f - act) / settle, 0, 1))) });
        return;
      }
      fx.up = null;
    }
    // quick morph used by bears and the wipe (shimmer crossfade)
    if (fx.morph) {
      const u = clamp(F(fx.morph.t0) / fx.morph.frames, 0, 1);
      if (u < 1) {
        if (u < .6) drawSprite(A.symbol(fx.morph.from, C, { scared: fx.morph.scared }), cx, cy, size, { scale: 1 + .12 * u, alpha: u < .4 ? 1 : 1 - (u - .4) / .2 });
        drawSprite(A.symbol(s, C), cx, cy, size, { alpha: clamp((u - .25) * 2.5, 0, 1), scale: .8 + .2 * ease.back(u) });
        ctx.save(); ctx.globalAlpha = Math.sin(u * Math.PI); const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * .55); gr.addColorStop(0, fx.morph.glow || '#fff8d0'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - cell / 2, cy - cell / 2, cell, cell); ctx.restore();
        return;
      }
      fx.morph = null;
    }
    // wild opening (sym_wild_star_open: 15f land squash, 20f star flash + hatch, 10f bear emerges)
    if (s === C.WILD && fx.open != null) {
      const [l, h, e] = FR.wildOpen, f = F(fx.open), star = A.get('sym_wild_star_idle'), bear = A.get(fx.bearKey);
      const bk = (A.real[fx.bearKey] ? 1 : fx.bearScale || 1) * 1.12;
      if (f < l) { drawSprite(star, cx, cy, size, { scale: 1.12, scaleY: .85 + .15 * ease.back(f / l, 2.5) }); return; }
      if (f < l + h) {
        const u = (f - l) / h, s1 = size * 1.12, sp = .55;
        ctx.save(); ctx.globalAlpha = Math.sin(u * Math.PI); const gr = ctx.createRadialGradient(cx, cy - cell * .15, 0, cx, cy - cell * .15, cell * (.3 + .6 * u)); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.4, '#fff3a0'); gr.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - cell, cy - cell, cell * 2, cell * 2); ctx.restore();
        if (u > .45) drawSprite(bear, cx, cy - cell * .04, size, { scale: bk * .5, alpha: (u - .45) * 2 });
        ctx.save(); ctx.drawImage(star, 0, star.height * sp, star.width, star.height * (1 - sp), cx - s1 / 2, cy - s1 / 2 + s1 * sp, s1, s1 * (1 - sp)); ctx.restore();
        ctx.save(); ctx.globalAlpha = 1 - clamp(u * 1.4 - .3, 0, 1); ctx.translate(cx, cy - s1 * .5 * ease.out(u)); ctx.rotate(.5 * u);
        ctx.drawImage(star, 0, 0, star.width, star.height * sp, -s1 / 2, -s1 / 2, s1, s1 * sp); ctx.restore();
        return;
      }
      const u = clamp((f - l - h) / e, 0, 1);
      drawSprite(bear, cx, cy - cell * .04 - Math.abs(Math.sin(t * (fx.bearKey === 'sym_bear_dance' ? 9 : 3))) * (fx.bearKey === 'sym_bear_dance' ? 10 : 2), size, { scale: bk * scale * (.5 + .5 * ease.back(u)), rot: fx.bearKey === 'sym_bear_dance' ? Math.sin(t * 9) * .06 : 0 });
      return;
    }
    if (fx.ghost != null) {
      const u = clamp(F(fx.ghost) / 20, 0, 1);
      drawSprite(A.symbol(fx.ghostFrom, C), cx, cy, size, { alpha: 1 - u, scale });
      drawSprite(A.get('sym_ghost_idle'), cx, cy - Math.sin(t * 2 + c + r) * 6 * u, size, { alpha: u, scale: scale * (1 + .04 * Math.sin(t * 3 + c)) });
      return;
    }
    // symbol with a supplied win sprite sheet (Santa): play it over the 45-tick win window instead of the scale pulse
    const ws = fx.win != null && s >= 0 && s <= 6 ? A.winSprite(s) : null;
    if (ws && F(fx.win) < FR.symWin[0] + FR.symWin[1] + FR.symWin[2]) {
      const frame = A.winSpriteFrame(ws, F(fx.win) / (FR.symWin[0] + FR.symWin[1] + FR.symWin[2]));
      const fw = ws.img.width / ws.cols, fh = ws.img.height / ws.rows, d = size * ws.scale;
      ctx.save(); ctx.translate(cx + ws.ox * size, cy + ws.oy * size);
      ctx.drawImage(ws.img, (frame % ws.cols) * fw, Math.floor(frame / ws.cols) * fh, fw, fh, -d / 2, -d * (fh / fw) / 2, d, d * (fh / fw));
      ctx.restore();
      return;
    }
    drawSprite(A.symbol(s, C, { scared: fx.scared, star: fx.star }), cx, cy, size, { rot, scale: (s === C.WILD ? 1.12 : 1) * scale, scaleY: sy });
    if (C.showLevelBadges && s >= 0 && s <= 6 && !A.real['sym_0' + s + '_idle']) {
      ctx.save(); ctx.font = `600 18px ${UIF}`; ctx.fillStyle = 'rgba(30,20,50,.6)'; ctx.textAlign = 'center';
      ctx.beginPath(); ctx.roundRect(cx + size * .2, cy + size * .32, 76, 24, 12); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText('sym_0' + s, cx + size * .2 + 38, cy + size * .32 + 18); ctx.restore();
    }
  }
  function drawGrid(t) {
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 10, y0, gw + 20, gh); ctx.clip();
    for (let c = 0; c < C.reels; c++) {
      const r = G.reels[c];
      if (r && r.state === 'spin') {
        const j0 = Math.floor(r.p) - 1, j1 = Math.ceil(r.p + C.rows);
        for (let j = Math.max(0, j0); j <= Math.min(r.strip.length - 1, j1); j++) {
          const cx = x0 + c * cell + cell / 2, cy = y0 + (j - r.p) * cell + cell / 2, img = A.symbol(r.strip[j], C), k = r.strip[j] === C.WILD ? 1.12 : 1;
          if (r.blur) for (let q = -2; q <= 2; q++) drawSprite(img, cx, cy + q * cell * .06, cell * .94, { alpha: q ? .22 : .5, scale: k });
          else drawSprite(img, cx, cy, cell * .94, { scale: k });
        }
      }
    }
    ctx.restore();
    for (let c = 0; c < C.reels; c++) {
      const r = G.reels[c]; if (r && r.state === 'spin') continue;
      for (let row = 0; row < C.rows; row++) { const [cx, cy] = cellCenter(c, row); drawCell(c, row, G.board[c][row], cx, cy, t); }
    }
  }

  /* ------------------------------------------------------------ fx layers */
  // vfx_anticipation_reel3: 15f ramp, 30f sustained sparks, 15f slam stop flash
  function drawAnticipation(t) {
    const a = G.antic; if (!a || t < a.t0) return;
    const [r1, r2, r3] = FR.anticipation, f = (t - a.t0) * C.fps * G.speed, x = x0 + C.wildReel * cell;
    if (f > r1 + r2 + r3 + 15 && !a.flash) return;
    let alpha = f < r1 ? f / r1 : 1;
    if (a.flash) alpha = 1 - clamp((t - a.flash) * C.fps * G.speed / 15, 0, 1);
    if (alpha <= 0) { G.antic = null; return; }
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 10; ctx.shadowColor = '#ffb000'; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.roundRect(x + 2, y0 - 8, cell - 4, gh + 16, 20); ctx.stroke();
    ctx.restore();
    const sw = A.real.vfx_anticipation_reel3 && A.get('vfx_anticipation_reel3');
    if (sw) {
      // supplied golden spiral: two additive layers, one mirrored and drifting, so it twists over the 2 s
      const hh = gh + cell * .5, ww = sw.width * hh / sw.height, cx = x + cell / 2, cy = y0 + gh / 2;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 2; k++) {
        ctx.save(); ctx.globalAlpha = alpha * (k ? .55 : .9); ctx.translate(cx, cy + Math.sin(t * 3 + k * 2) * 18);
        ctx.scale((k ? -1 : 1) * (1 + .06 * Math.sin(t * 5 + k)), 1 + .03 * Math.sin(t * 4));
        ctx.drawImage(sw, -ww / 2, -hh / 2, ww, hh); ctx.restore();
      }
      ctx.restore();
    }
    if (!a.flash && f > r1 && Math.random() < .8) {
      for (let k = 0; k < 2; k++) emit('spark', x + Math.random() * cell, y0 + Math.random() * gh, 1, { angle: Math.random() * 6.28, spread: 6, speed: 220, gravity: 0, life: .4, size: 8, color: ['#fff6b0', '#ffd34a', '#ffffff'] });
    }
    if (a.flash) {
      const u = clamp((t - a.flash) * C.fps * G.speed / 15, 0, 1);
      ctx.save(); ctx.globalAlpha = (1 - u) * .85; const gr = ctx.createRadialGradient(x + cell / 2, y0 + gh / 2, 0, x + cell / 2, y0 + gh / 2, gh * (.4 + u)); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = gr; ctx.fillRect(x - cell, y0 - cell, cell * 3, gh + cell * 2); ctx.restore();
    }
  }
  // line_overlay_01..17 and line_node_highlight
  const LINE_COLORS = ['#ff5a5a', '#ffb43a', '#ffe14a', '#7be35a', '#3ad6c5', '#4aa8ff', '#9a7bff', '#ff6ad5', '#ff8a3a', '#c8ff4a', '#3affb4', '#5ad0ff', '#c47bff', '#ff4a8a', '#ffd27a', '#8affd2', '#ffffff'];
  function drawLines(t) {
    const L2 = G.lines; if (!L2) return;
    const a = L2.fade ? clamp(1 - (t - L2.fade) / .25, 0, 1) : clamp((t - L2.t0) / .15, 0, 1);
    if (a <= 0) { G.lines = null; return; }
    const ring = A.get('line_node_highlight');
    ctx.save(); ctx.globalAlpha = a;
    L2.wins.forEach(w => { w.positions.forEach(([c, r]) => { const [cx, cy] = cellCenter(c, r), s = cell * 1.02; ctx.drawImage(ring, cx - s / 2, cy - s / 2, s, s); }); });
    L2.wins.forEach(w => {
      const col = LINE_COLORS[w.line % LINE_COLORS.length], line = C.paylines[w.line];
      ctx.beginPath(); line.forEach((r, c) => { const [cx, cy] = cellCenter(c, r); c ? ctx.lineTo(cx, cy) : ctx.moveTo(cx - cell * .5, cy); }); const [ex, ey] = cellCenter(C.reels - 1, line[C.reels - 1]); ctx.lineTo(ex + cell * .5, ey);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(40,10,0,.6)'; ctx.lineWidth = 14; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.stroke();
    });
    G.labels.forEach(l => blockText(l.text, l.x, l.y, 40, { scale: .6 + .4 * ease.back(clamp((t - l.t0) / .25, 0, 1)) }));
    ctx.restore();
  }
  function drawWaves(t) {
    G.waves = G.waves.filter(w => t - w.t0 < w.dur);
    G.waves.forEach(w => {
      const u = (t - w.t0) / w.dur;
      ctx.save(); ctx.globalAlpha = 1 - u; ctx.strokeStyle = w.color; ctx.lineWidth = 18 * (1 - u) + 3; ctx.shadowColor = w.color; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(w.x, w.y, u * w.r, 0, 7); ctx.stroke(); ctx.restore();
    });
  }
  function drawBubble(t) {
    const b = G.bubble; if (!b) return;
    const [ex, ey] = cellCenter(b.c, b.r), bx = Math.min(ex + cell * 1.2, W - 300), by = Math.max(ey - cell * .75, 170);
    const u = ease.back(clamp((t - b.t0) / .3, 0, 1)), a = b.fade ? clamp(1 - (t - b.fade) / .25, 0, 1) : 1;
    if (a <= 0) { G.bubble = null; return; }
    ctx.save(); ctx.globalAlpha = a; ctx.translate(bx, by); ctx.scale(u, u);
    const col = { scare: '#ff6a5a', charm: '#ff7ad9', dance: '#c6ff7a' }[b.bear];
    ctx.fillStyle = 'rgba(25,18,30,.84)'; ctx.beginPath(); ctx.ellipse(0, 0, 250, 135, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-180, 70); ctx.lineTo(-280, 170); ctx.lineTo(-110, 100); ctx.fill();
    ctx.setLineDash([16, 12]); ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 234, 120, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col;
    if (b.bear === 'scare') { ctx.font = `120px ${SCRIPT}`; ctx.fillText('!'.repeat(b.size || 1), 0, 8); }
    if (b.bear === 'charm') { ctx.lineWidth = 9; ctx.strokeStyle = col; heartPath(0, 20, 120); ctx.stroke(); }
    if (b.bear === 'dance') { ctx.font = `78px ${SCRIPT}`; ctx.fillText('Free spins', 0, 0); }
    ctx.restore();
  }
  // vfx_wipe_win_sweep: 30f gold frame lock, 30f gold flash sweep, 30f green ghost light
  function drawWipeFx(t) {
    if (G.lock) {
      const f = (t - G.lock.t0) * C.fps * G.speed, total = FR.wipe[0] + FR.wipe[1] + FR.wipe[2];
      if (f > total) G.lock = null;
      else {
        const pulse = .55 + .45 * Math.sin(f / 30 * Math.PI * 4), a = f < 10 ? f / 10 : f > total - 10 ? (total - f) / 10 : 1;
        ctx.save(); ctx.globalAlpha = a * pulse; ctx.strokeStyle = '#ffd34a'; ctx.shadowColor = '#ffb000'; ctx.shadowBlur = 30; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.roundRect(x0 - 12, y0 - 12, gw + 24, gh + 24, 22); ctx.stroke();
        ctx.lineWidth = 4; for (let c = 0; c < C.reels; c++) for (let r = 0; r < C.rows; r++) { ctx.beginPath(); ctx.roundRect(x0 + c * cell + 8, y0 + r * cell + 8, cell - 16, cell - 16, 16); ctx.stroke(); }
        ctx.restore();
      }
    }
    if (G.sweep) {
      const u = clamp((t - G.sweep.t0) / sec(FR.wipe[1]), 0, 1), bx = lerp(-W * .3, W * 1.3, ease.inOut(u));
      if (u >= 1) G.sweep = null;
      else {
        ctx.save(); ctx.globalAlpha = Math.sin(u * Math.PI) * .35; ctx.fillStyle = '#fff2b0'; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = Math.sin(u * Math.PI) * .9; const g = ctx.createLinearGradient(bx - 260, 0, bx + 260, 0); g.addColorStop(0, 'rgba(255,215,90,0)'); g.addColorStop(.5, 'rgba(255,250,210,1)'); g.addColorStop(1, 'rgba(255,215,90,0)');
        ctx.fillStyle = g; ctx.fillRect(bx - 260, 0, 520, H); ctx.restore();
      }
    }
    if (G.greenT) {
      const u = clamp((t - G.greenT) / sec(FR.wipe[2]), 0, 1);
      ctx.save(); ctx.globalAlpha = Math.sin(u * Math.PI) * .45; const g = ctx.createRadialGradient(W / 2, y0 + gh / 2, 0, W / 2, y0 + gh / 2, W * .6); g.addColorStop(0, 'rgba(160,255,190,1)'); g.addColorStop(1, 'rgba(60,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      if (u >= 1) G.greenT = 0;
    }
    if (G.burst) {
      const u = clamp((t - G.burst.t0) / 1.6, 0, 1);
      blockText(G.burst.text, W / 2, y0 + gh / 2, 150, { scale: ease.elastic(clamp(u * 2, 0, 1)), alpha: u > .85 ? (1 - u) / .15 : 1, colors: ['#ffffff', '#c8ffd8', '#3fcf7a'], stroke: '#0d3b22' });
      if (u >= 1) G.burst = null;
    }
  }

  /* ------------------------------------------------------------ HUD (ASSET 2.2) */
  function button(key, b, drawFallback) {
    const img = A.real[key] && A.get(key);
    if (img) { ctx.drawImage(img, b.x - b.r * 1.15, b.y - b.r * 1.15, b.r * 2.3, b.r * 2.3); return; }
    drawFallback();
  }
  function drawHUD(t) {
    const fs = G.fs;
    if (!(fs.active || (G.modal && G.modal.kind === 'outro')) && C.title) {
      // game name, top centre of the base game
      scriptText(C.title, W / 2, 38, 46, { color: '#ffe9a8', stroke: 'rgba(60,15,5,.95)' });
    }
    if (fs.active || (G.modal && G.modal.kind === 'outro')) {
      const img = A.real.ui_freegame_counter && A.get('ui_freegame_counter');
      const txt = `SPINS LEFT: ${fs.left} / ${fs.awarded}`;
      if (img) ctx.drawImage(img, W / 2 - 220, 6, 440, 64);
      else { ctx.save(); ctx.fillStyle = 'rgba(40,10,60,.85)'; ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(W / 2 - 220, 8, 440, 58, 29); ctx.fill(); ctx.stroke(); ctx.restore(); }
      blockText(txt, W / 2, 38, 34, { colors: ['#ffffff', '#ffe9a8'], stroke: '#2a0a3a' });
    }
    const by = H - barH;
    if (A.real.ui_bar_bottom) ctx.drawImage(A.get('ui_bar_bottom'), 0, by, W, barH);
    else { const g = ctx.createLinearGradient(0, by, 0, H); g.addColorStop(0, 'rgba(38,16,10,.94)'); g.addColorStop(1, 'rgba(18,8,4,.98)'); ctx.fillStyle = g; ctx.fillRect(0, by, W, barH); ctx.fillStyle = '#c98a4e'; ctx.fillRect(0, by, W, 3); }
    const label = (txt, x, y, align = 'left') => { ctx.font = `600 16px ${UIF}`; ctx.fillStyle = 'rgba(255,230,200,.6)'; ctx.textAlign = align; ctx.fillText(txt, x, y); };
    const value = (txt, x, y, align = 'left', col = '#fff', size = 38) => { ctx.font = `${size}px ${BLOCK}`; ctx.fillStyle = col; ctx.textAlign = align; ctx.fillText(txt, x, y); };
    label('BALANCE', 170, by + 40); value(fmt(G.balance), 170, by + 84);                                           // disp_balance
    const wv = G.winFrom + (G.win - G.winFrom) * ease.out(clamp((t - G.winT0) / .6, 0, 1));
    label('WIN', W / 2, by + 40, 'center'); value(G.win > 0 ? fmt(wv) : '', W / 2, by + 86, 'center', '#ffd45a', 46); // disp_win
    label('BET', W - 500, by + 40, 'center'); value(fmt(bet()), W - 500, by + 84, 'center');                        // disp_bet
    ctx.textBaseline = 'middle';
    const round = (b, fill, ring = '#7a4523') => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ring; ctx.stroke(); };
    const locked = G.busy;
    button('btn_info', btn.info, () => { round(btn.info, '#3a1a10'); ctx.fillStyle = '#fff'; ctx.font = `34px ${BLOCK}`; ctx.textAlign = 'center'; ctx.fillText('i', btn.info.x, btn.info.y + 2); });
    // sound toggle (not in the spec; kept for demos)
    ctx.save(); ctx.translate(btn.sound.x, btn.sound.y); ctx.fillStyle = 'rgba(255,230,200,.8)'; ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(-5, -6); ctx.lineTo(4, -14); ctx.lineTo(4, 14); ctx.lineTo(-5, 6); ctx.lineTo(-12, 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = SND.muted ? '#ff6a6a' : 'rgba(255,230,200,.8)'; ctx.lineWidth = 3; ctx.beginPath(); if (SND.muted) { ctx.moveTo(9, -8); ctx.lineTo(21, 8); ctx.moveTo(21, -8); ctx.lineTo(9, 8); } else { ctx.arc(5, 0, 9, -.9, .9); } ctx.stroke(); ctx.restore();
    ctx.globalAlpha = locked ? .45 : 1;
    button('btn_bet_minus', btn.minus, () => { round(btn.minus, '#3a1a10'); ctx.fillStyle = '#fff'; ctx.fillRect(btn.minus.x - 12, btn.minus.y - 3, 24, 6); });
    button('btn_bet_plus', btn.plus, () => { round(btn.plus, '#3a1a10'); ctx.fillStyle = '#fff'; ctx.fillRect(btn.plus.x - 12, btn.plus.y - 3, 24, 6); ctx.fillRect(btn.plus.x - 3, btn.plus.y - 12, 6, 24); });
    ctx.globalAlpha = 1;
    button(G.autoplay ? 'btn_auto_active' : 'btn_auto_idle', btn.auto, () => { round(btn.auto, G.autoplay ? '#f2c27a' : '#3a1a10'); ctx.fillStyle = G.autoplay ? '#3a1a10' : '#fff'; ctx.font = `600 17px ${UIF}`; ctx.textAlign = 'center'; ctx.fillText('AUTO', btn.auto.x, btn.auto.y + 1); });
    // btn_spin idle / active (reels spinning) / disabled (feature or banner playing)
    const sk = G.spinning ? 'btn_spin_active' : G.busy ? 'btn_spin_disabled' : 'btn_spin_idle', b = btn.spin;
    button(sk, b, () => {
      ctx.save(); ctx.translate(b.x, b.y);
      const g = ctx.createRadialGradient(-b.r * .3, -b.r * .4, 0, 0, 0, b.r);
      if (sk === 'btn_spin_disabled') { g.addColorStop(0, '#8a7a6a'); g.addColorStop(1, '#3a2e24'); } else { g.addColorStop(0, '#ffe39a'); g.addColorStop(.55, '#d9862a'); g.addColorStop(1, '#7a3a10'); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, 7); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#3b1505'; ctx.stroke();
      ctx.rotate(G.spinning ? t * 9 : 0); ctx.strokeStyle = '#3b1505'; ctx.fillStyle = '#3b1505'; ctx.lineWidth = 12;
      for (let k = 0; k < 2; k++) {
        ctx.save(); ctx.rotate(k * Math.PI); ctx.beginPath(); ctx.arc(0, 0, 38, Math.PI * 1.05, Math.PI * 1.8); ctx.stroke();
        const a = Math.PI * 1.8; ctx.translate(Math.cos(a) * 38, Math.sin(a) * 38); ctx.rotate(a + Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-6, -14); ctx.lineTo(-6, 14); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      ctx.restore();
    });
    ctx.textBaseline = 'alphabetic';
  }

  /* ------------------------------------------------------------ banners & modals (ANIM 6, 7) */
  function dimmer(a) { if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
  function rays(cx, cy, t, col, alpha, n = 16, R = 900) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.rotate(t * .5);
    for (let i = 0; i < n; i++) { ctx.rotate(Math.PI * 2 / n); const g = ctx.createLinearGradient(0, 0, 0, -R); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-R * .08, -R); ctx.lineTo(R * .08, -R); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function ribbon(cx, cy, w, h, cols) {
    ctx.save();
    const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2); g.addColorStop(0, cols[0]); g.addColorStop(.5, cols[1]); g.addColorStop(1, cols[2]);
    ctx.fillStyle = cols[2]; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(cx + s * w * .42, cy - h * .2); ctx.lineTo(cx + s * w * .62, cy - h * .2); ctx.lineTo(cx + s * w * .55, cy + h * .15); ctx.lineTo(cx + s * w * .62, cy + h * .5); ctx.lineTo(cx + s * w * .42, cy + h * .5); ctx.closePath(); ctx.fill(); });
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - w / 2, cy - h / 2); ctx.quadraticCurveTo(cx, cy - h * .8, cx + w / 2, cy - h / 2); ctx.lineTo(cx + w / 2, cy + h / 2); ctx.quadraticCurveTo(cx, cy + h * .2, cx - w / 2, cy + h / 2); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  function tierFx(fx, f, dt) {
    const p = n => Math.random() < n * dt;
    if (fx === 'fountain' || fx === 'cascade' || fx === 'fireworks') { if (p(fx === 'fountain' ? 18 : 30)) emit('coin', W / 2 + (Math.random() - .5) * 200, H + 20, 1, { spread: .7, speed: 1500, gravity: 1500, life: 2.2, size: 24 }); }
    if (fx === 'cascade') { if (p(30)) { emit('coin', W * .2, H + 20, 1, { angle: -Math.PI / 2 + .25, spread: .4, speed: 1500, gravity: 1500, life: 2.2, size: 24 }); emit('coin', W * .8, H + 20, 1, { angle: -Math.PI / 2 - .25, spread: .4, speed: 1500, gravity: 1500, life: 2.2, size: 24 }); } }
    if (fx === 'drop' || fx === 'epic' || fx === 'lasers') { if (p(fx === 'drop' ? 22 : 40)) emit('coin', Math.random() * W, -40, 1, { angle: Math.PI / 2, spread: .3, speed: 200, gravity: 900, life: 2.5, size: 24 }); }
    if (fx === 'fireworks' || fx === 'epic') { if (p(fx === 'epic' ? 3 : 1.8)) emit('rocket', W * (.15 + Math.random() * .7), H, 1, { spread: .25, speed: 1100, gravity: 600, life: .9 + Math.random() * .4, burst: ['#ff5a7a', '#ffd34a', '#7affb0', '#7ad0ff', '#ffffff'][Math.floor(Math.random() * 5)] }); }
    if (fx === 'fireworks' || fx === 'lasers' || fx === 'epic') { if (p(fx === 'lasers' ? 50 : 25)) { const left = Math.random() < .5; emit('confetti', left ? 0 : W, H * .75, 1, { angle: left ? -1.0 : -2.14, spread: .5, speed: 1100, gravity: 700, life: 2.6, size: 16, color: ['#ff5a7a', '#ffd34a', '#7affb0', '#7ad0ff', '#c88aff'] }); } }
  }
  function drawBanner(t, dt) {
    const b = G.banner; if (!b) return;
    const f = (t - b.t0) * C.fps * G.speed, [fi, fl, fo] = FR.banner, total = fi + fl + fo;
    if (G.skip !== b.tok) { b.tok = G.skip; if (f < fi + fl) b.t0 = t - sec(fi + fl); }
    const tier = C.winTiers[b.tier];
    // dimmer rgba(0,0,0,.75), title slam 0 -> 1.2 -> 1.0, tally frames 30-105, outro zoom up to 1.3 + fade
    let dim = .75, scale, alpha = 1, dy = 0;
    if (f < fi) { dim = .75 * f / fi; const u = f / fi; scale = u < .66 ? 1.2 * ease.out(u / .66) : 1.2 - .2 * ease.inOut((u - .66) / .34); }
    else if (f < fi + fl) scale = 1 + .03 * Math.sin((f - fi) / 30 * Math.PI * 2);
    else { const u = clamp((f - fi - fl) / fo, 0, 1); dim = .75 * (1 - u); scale = 1 + .3 * u; alpha = 1 - u; dy = -120 * u; }
    if (!b.hit && f >= 15) { b.hit = true; SND.play('banner_hit'); }
    const [ta, tb] = FR.bannerTally, tu = clamp((f - ta) / (tb - ta), 0, 1), shown = b.amount * ease.out(tu);
    if (tu > 0 && tu < 1 && t - (b.tick || 0) > .07) { b.tick = t; SND.play('sfx_countup_loop'); }
    if (tu >= 1 && !b.ended) { b.ended = true; SND.play('sfx_countup_end'); }
    if (f >= fi + fl && !b.snapped) { b.snapped = true; setWin(G.spinBaseWin + b.amount, true); }
    dimmer(dim);
    if (f < fi + fl) tierFx(tier.fx, f, dt);
    ctx.save(); ctx.globalAlpha = alpha;
    if (tier.fx === 'lasers' || tier.fx === 'epic') rays(W / 2, H * .4, t * (tier.fx === 'lasers' ? 3 : 1), tier.fx === 'epic' ? 'rgba(170,230,255,.55)' : 'rgba(200,120,255,.5)', alpha, tier.fx === 'lasers' ? 8 : 18);
    else rays(W / 2, H * .4, t, 'rgba(255,220,140,.35)', alpha * .8);
    if (b.ghost) drawSprite(A.get('sym_ghost_idle'), W / 2, H * .2, 300, { alpha: alpha * .9 });
    const img = A.real['banner_win_' + tier.id] && A.get('banner_win_' + tier.id);
    // supplied title art is fitted into a box above the amount; otherwise the code-drawn ribbon
    const k = img ? Math.min(W * .5 / img.width, H * .6 / img.height) : 1, ih = img ? img.height * k : 190;
    const cy = img ? H * .36 : H * .4;
    ctx.translate(W / 2, cy + dy); ctx.scale(scale, scale);
    if (img) ctx.drawImage(img, -img.width * k / 2, -ih / 2, img.width * k, ih);
    else { ribbon(0, 0, 1100, 190, tier.colors); blockText(tier.label, 0, -6, 110, { colors: ['#ffffff', tier.colors[0], tier.colors[1]], maxW: 1000 }); }
    ctx.restore();
    blockText(fmt(shown), W / 2, (img ? cy + ih / 2 + 78 : H * .64) + dy, img ? 130 : 150, { alpha, scale: f < fi ? ease.out(f / fi) : 1, maxW: W * .8 });
    if (f >= total) { const r = b.resolve; G.banner = null; r(); }
  }
  // free spins trigger (pulse + rays, START) and summary (drop in, tally, COLLECT)
  function drawModal(t, dt) {
    const m = G.modal; if (!m) return;
    const [fi, fl, fo] = FR.banner;
    let f = (t - m.t0) * C.fps * G.speed;
    // hold until clicked unless auto-continue is on
    if (f >= fi + fl && !m.release) { if (C.autoContinueModals || G.autoplay) m.release = true; else { m.t0 = t - sec(fi + fl - 1); f = fi + fl - 1; } }
    if (G.skip !== m.tok) { m.tok = G.skip; if (f > fi * .5 && f < fi + fl) { m.release = true; m.t0 = t - sec(fi + fl); f = fi + fl; } }
    const intro = m.kind === 'intro';
    let scale = 1, alpha = 1, dy = 0, dim = .7;
    if (f < fi) { const u = f / fi; dim = .7 * u; if (intro) scale = ease.elastic(u); else dy = -H * (1 - ease.out(u)); }
    else if (f < fi + fl) scale = intro ? 1 + .04 * (.5 - .5 * Math.cos((f - fi) / 30 * Math.PI * 2)) : 1;
    else { const u = clamp((f - fi - fl) / fo, 0, 1); dim = .7 * (1 - u); alpha = 1 - u; scale = intro ? 1 + .15 * u : 1 - .2 * u; }
    dimmer(dim);
    ctx.save(); ctx.globalAlpha = alpha;
    if (intro) { rays(W / 2, H * .45, t, 'rgba(255,215,120,.45)', alpha); if (f > fi && f < fi + fl && Math.random() < .6) emit('spark', W / 2 + (Math.random() - .5) * 900, H * .45 + (Math.random() - .5) * 400, 1, { angle: 0, spread: 6, speed: 60, gravity: 0, life: .7, size: 8, color: ['#fff6c8', '#ffd34a'] }); }
    ctx.translate(W / 2, H * .45 + dy); ctx.scale(scale, scale);
    const key = intro ? 'modal_freespins_intro' : 'modal_freespins_outro', img = A.real[key] && A.get(key);
    const mk = img ? Math.min(1100 / img.width, 680 / img.height) : 1, mw = img ? img.width * mk : 1080, mh = img ? img.height * mk : 600;
    if (img) ctx.drawImage(img, -mw / 2, -mh / 2, mw, mh);
    else {
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; const g = ctx.createLinearGradient(0, -300, 0, 300); g.addColorStop(0, '#a8402a'); g.addColorStop(1, '#5a1a10');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-540, -300, 1080, 600, 40); ctx.fill(); ctx.shadowBlur = 0;
      ctx.lineWidth = 8; ctx.strokeStyle = '#f2c27a'; ctx.stroke(); ctx.setLineDash([14, 10]); ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-510, -270, 1020, 540, 30); ctx.stroke(); ctx.setLineDash([]);
      ribbon(0, -250, 820, 120, ['#fff2c0', '#e8b23a', '#8a4a10']);
    }
    const tu = clamp((f - fi) / FR.summaryTally, 0, 1), shown = (m.amount || 0) * ease.out(tu);
    if (!intro) {
      if (tu > 0 && tu < 1 && t - (m.tick || 0) > .07) { m.tick = t; SND.play('sfx_countup_loop'); }
      if (tu >= 1 && !m.ended) { m.ended = true; SND.play('sfx_countup_end'); }
    }
    if (img && intro) {
      // 'Festive Win!' frame: the title is in the art; the award sits in the open centre above the reindeer
      blockText(m.text1, 0, -mh * .06, 48, { colors: ['#ffffff', '#ffe9c8'], stroke: '#7a1a10', maxW: mw * .5 });
      blockText(m.text2, 0, mh * .08, 78, { colors: ['#fffbe0', '#ffd04a', '#e07b00'], stroke: '#5a1a05', maxW: mw * .56 });
    } else if (img) {
      // 'Total Win!' sign: the header is in the art; the amount goes on the cleared board
      blockText(fmt(shown), 0, -mh * .02, 104, { maxW: mw * .62 });
      blockText(m.capped ? `MAX WIN ${C.maxWin}× REACHED` : `IN ${m.spins} FREE SPINS!`, 0, mh * .13, 40, { colors: ['#ffffff', '#ffe9c8'], stroke: '#3b1505', maxW: mw * .6 });
    } else {
      blockText('CONGRATULATIONS!', 0, -252, 64, { maxW: 760 });
      if (intro) {
        blockText(m.text1, 0, -90, 66, { colors: ['#ffffff', '#fff0c8'], maxW: 960 });
        blockText(m.text2, 0, 30, 130, { colors: ['#fffbe0', '#ffd04a', '#e07b00'], maxW: 960 });
      } else {
        blockText(`TOTAL WIN: ${fmt(shown)} IN ${m.spins} FREE SPINS`, 0, -150, 40, { colors: ['#ffffff', '#fff0c8'], maxW: 960 });
        blockText('YOU WON', 0, -60, 60, { colors: ['#ffffff', '#fff0c8'] });
        blockText(fmt(shown), 0, 50, 130, { maxW: 960 });
        blockText(m.capped ? `MAX WIN ${C.maxWin}× REACHED` : `IN ${m.spins} FREE SPINS!`, 0, 150, 48, { colors: ['#ffffff', '#fff0c8'] });
      }
    }
    // START / COLLECT button (below supplied art, inside the code-drawn panel)
    const bl = intro ? 'START' : 'COLLECT', pulse = 1 + .04 * Math.sin(t * 6), by = img ? mh / 2 + 28 : 235;
    ctx.save(); ctx.translate(0, by); ctx.scale(pulse, pulse); const g2 = ctx.createLinearGradient(0, -40, 0, 40); g2.addColorStop(0, '#9be86a'); g2.addColorStop(1, '#2f8a2a');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.roundRect(-150, -38, 300, 76, 38); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#163f12'; ctx.stroke(); ctx.restore();
    blockText(bl, 0, by + 2, 46, { colors: ['#ffffff', '#eaffd8'], stroke: '#163f12' });
    ctx.restore();
    if (f >= fi + fl && !m.outroCalled) { m.outroCalled = true; if (m.onOutro) m.onOutro(); }
    if (f >= fi + fl + fo) { const r = m.resolve; G.modal = null; r(); }
  }
  // trans_base_to_freegame: accordion curtain (15f in, 45f hold, 15f out); trans_freegame_to_base: zoom out + dissolve
  function drawTransition(t) {
    const tr = G.trans; if (!tr) return;
    const f = (t - tr.t0) * C.fps * G.speed;
    if (tr.kind === 'toFree') {
      const [a, b, c] = FR.transToFree;
      let cover = f < a ? ease.out(f / a) : f < a + b ? 1 : 1 - ease.inOut((f - a - b) / c);
      if (f >= a && !tr.swapped) { tr.swapped = true; tr.onCovered && tr.onCovered(); }
      const half = W / 2 * cover, folds = 9, fw = half / folds;
      for (const side of [0, 1]) for (let i = 0; i < folds; i++) {
        const x = side === 0 ? i * fw : W - (i + 1) * fw;
        const g = ctx.createLinearGradient(x, 0, x + fw, 0), dark = (i + side) % 2;
        g.addColorStop(0, dark ? '#6a0f1e' : '#c2283a'); g.addColorStop(.5, dark ? '#9a1a2c' : '#ff5a68'); g.addColorStop(1, dark ? '#4a0812' : '#a01a2a');
        ctx.fillStyle = g; ctx.fillRect(x, 0, fw + 1, H);
        ctx.fillStyle = '#f2c27a'; ctx.fillRect(x, 0, 2, H);
      }
      if (cover > .95) { scriptText('Free Spins', W / 2, H * .45, 170, { color: '#fff3c4' }); emit('note', W / 2 + (Math.random() - .5) * 800, H * .7, Math.random() < .3 ? 1 : 0, { angle: -Math.PI / 2, spread: .6, speed: 200, gravity: -30, life: 1.6, size: 40, color: ['#ffe27a', '#ffffff'] }); }
      if (f >= a + b + c) { G.trans = null; tr.resolve(); }
    } else {
      const u = clamp(f / FR.transToBase, 0, 1);
      G.camera = 1.08 - .08 * ease.out(u);
      if (u >= 1) { G.camera = 1; G.trans = null; tr.resolve(); }
    }
  }

  /* ------------------------------------------------------------ paytable / rules (btn_info) */
  function drawInfo() {
    if (!G.info) return;
    dimmer(.85);
    ctx.save(); ctx.fillStyle = '#2a120a'; ctx.strokeStyle = '#f2c27a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(120, 50, W - 240, H - 100, 30); ctx.fill(); ctx.stroke(); ctx.restore();
    blockText(`${C.title.toUpperCase()}  ·  PAYTABLE`, W / 2, 105, 54, { maxW: W - 320 });
    ctx.textBaseline = 'middle';
    C.tiers.forEach((s, i) => {
      const col = i % 4, row = Math.floor(i / 4), x = 230 + col * 250, y = 230 + row * 190;
      drawSprite(A.symbol(s, C), x, y, 150);
      ctx.font = `26px ${BLOCK}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
      [5, 4, 3].forEach((n, k) => ctx.fillText(`${n}  ${fmt(C.paytable[s][n] * bet())}`, x + 72, y - 40 + k * 40));
    });
    ctx.font = `20px ${UIF}`; ctx.fillStyle = 'rgba(255,240,220,.92)'; ctx.textAlign = 'left';
    const rules = [
      'Wild appears on reel 3 only and substitutes for all symbols. A Wild landing with a star opens to a Mystery Bear:',
      'Scare Bear upgrades the lowest symbols 1, 2 or 3 times. Charm Bear upgrades all symbols once. Dance Bear awards 7 free spins with a Wild on reel 3 every spin.',
      'Winning symbols of the same value upgrade when that creates new or longer paylines. Only the highest win per payline is paid.',
      `Wipe: 15 identical symbols upgrade once more. 15 ${C.symbolNames[0]} symbols become Ghosts and pay ${fmt(C.specialWin * bet())}.`
    ];
    rules.forEach((r, i) => wrap(r, 1230, 170 + i * 110, 540, 26));
    // 17 payline thumbnails
    C.paylines.forEach((line, i) => {
      const bx = 200 + (i % 9) * 92, by = 640 + Math.floor(i / 9) * 120, s = 14;
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(bx, by, 5 * s, 3 * s);
      line.forEach((r, c) => { ctx.fillStyle = LINE_COLORS[i]; ctx.fillRect(bx + c * s + 2, by + r * s + 2, s - 4, s - 4); });
      ctx.fillStyle = '#fff'; ctx.font = `600 15px ${UIF}`; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), bx + 2.5 * s, by + 3 * s + 16);
    });
    ctx.font = `600 18px ${UIF}`; ctx.fillStyle = 'rgba(255,230,200,.7)'; ctx.textAlign = 'center'; ctx.fillText('Click anywhere to close', W / 2, H - 80);
    ctx.textBaseline = 'alphabetic';
  }
  function wrap(text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '';
    for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW) { ctx.fillText(line, x, y); line = w; y += lh; } else line = test; }
    ctx.fillText(line, x, y);
  }

  /* ------------------------------------------------------------ frame loop */
  let lastT = now();
  function frame() {
    const t = now(), dt = Math.min(.05, t - lastT); lastT = t;
    updateReels(t);
    G.env = clamp(G.env + (G.envTarget - G.env) * Math.min(1, dt * (G.trans && G.trans.kind === 'toBase' ? 1.6 : 6)), 0, 1);
    ctx.save();
    if (G.camera !== 1) { ctx.translate(W / 2, H / 2); ctx.scale(G.camera, G.camera); ctx.translate(-W / 2, -H / 2); }
    drawEnvironment(t);
    drawReelStrips();
    drawGrid(t);
    drawFrame(t);
    drawAnticipation(t);
    drawLines(t);
    drawWaves(t);
    drawWipeFx(t);
    drawBubble(t);
    ctx.restore();
    drawHUD(t);
    drawBanner(t, dt);
    drawModal(t, dt);
    drawParticles(dt);
    drawTransition(t);
    drawInfo();
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------ step presentation */
  function setWin(v, instant) { G.winFrom = instant ? v : G.win; G.win = Math.round(v * 100) / 100; G.winT0 = instant ? 0 : now(); }
  function clearLines() { if (G.lines) G.lines.fade = now(); G.labels = []; }

  async function showWin(step, popStep) {
    clearLines(); await wait(.02);
    const t0 = now();
    G.lines = { wins: step.wins, t0 };
    G.labels = [];
    step.wins.forEach(w => {
      const [c, r] = w.positions[w.positions.length - 1], [cx, cy] = cellCenter(c, r);
      if (!G.labels.find(l => l.c === c && l.r === r)) G.labels.push({ c, r, x: cx, y: cy + cell * .34, t0, text: w.amount.toFixed(2) });
    });
    const keys = new Set(); step.wins.forEach(w => w.positions.forEach(([c, r]) => keys.add(c + ',' + r)));
    keys.forEach(k => { const [c, r] = k.split(',').map(Number); G.fx[c][r].win = t0; });
    SND.play('sfx_symbol_win_line'); setWin(G.win + step.amount);
    const [a, b, c] = FR.symWin;
    if (popStep) {
      await waitF(a);
      const t1 = now();
      popStep.changes.forEach(ch => { const f = G.fx[ch.c][ch.r]; f.win = null; f.up = { t0: t1, from: ch.from }; G.board[ch.c][ch.r] = ch.to; const [cx, cy] = cellCenter(ch.c, ch.r); emit('spark', cx, cy, 10, { angle: 0, spread: 6, speed: 320, gravity: 200, life: .6, size: 9, color: ['#fff6c8', '#ffd34a', colorOf(ch.to)] }); });
      SND.play('sfx_symbol_upgrade');
      await waitF(b + c);
    } else await waitF(a + b + c);
    keys.forEach(k => { const [cc, r] = k.split(',').map(Number); G.fx[cc][r].win = null; });
    clearLines();
  }

  async function playSteps(steps) {
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (s.type === 'win') { const nx = steps[i + 1]; if (nx && nx.type === 'pop') { await showWin(s, nx); i++; } else await showWin(s, null); }
      else if (s.type === 'pop') { const t1 = now(); s.changes.forEach(ch => { G.fx[ch.c][ch.r].up = { t0: t1, from: ch.from }; G.board[ch.c][ch.r] = ch.to; }); SND.play('sfx_symbol_upgrade'); await waitF(FR.symWin[1] + FR.symWin[2]); }
      else if (s.type === 'hatch') await playHatch(s);
      else if (s.type === 'bear') await playBear(s);
      else if (s.type === 'wipe') await playWipe(s);
    }
  }

  async function playHatch(s) {
    const [c, r] = s.pos, fx = G.fx[c][r];
    fx.bearKey = A.bearKey(s.bear, s.size); fx.bearScale = s.bear === 'scare' ? [.82, 1, 1.18][(s.size || 1) - 1] : 1;
    fx.open = now(); fx.star = false;
    const [l, h, e] = FR.wildOpen;
    await waitF(l);
    const [cx, cy] = cellCenter(c, r);
    emit('shell', cx, cy - cell * .2, 14, { speed: 600, size: 26, color: ['#f39a2a', '#ffd34a'], life: 1.0 });
    emit('spark', cx, cy - cell * .2, 18, { angle: 0, spread: 7, speed: 420, gravity: 200, life: .7, size: 10, color: ['#ffffff', '#fff3a0'] });
    await waitF(h + e);
    G.bubble = { bear: s.bear, size: s.size, c, r, t0: now() };
  }
  async function playBear(s) {
    const b = G.bubble || { c: C.wildReel, r: 1 }, [bx, by] = cellCenter(b.c, b.r);
    if (s.bear === 'scare') {
      // bear_scare_1x/2x/3x: intro, one 22.5f roar wave per upgrade, outro (45 / 67 / 90 frames)
      await waitF(FR.scareEdge);
      for (const round of s.rounds) {
        const t1 = now(); SND.play('sfx_scare_bear_roar');
        G.fx[b.c][b.r].shake = t1 + sec(10);
        G.waves.push({ x: bx, y: by, r: Math.hypot(gw, gh), t0: t1, dur: sec(FR.scareWave * .7), color: '#ffd34a' });
        round.forEach(ch => { const f = G.fx[ch.c][ch.r]; f.scared = true; f.shake = t1 + sec(10); });
        await waitF(FR.scareWave * .45);
        const t2 = now();
        round.forEach(ch => { const f = G.fx[ch.c][ch.r]; f.morph = { t0: t2, frames: FR.scareWave * .5, from: ch.from, scared: true }; f.scared = false; G.board[ch.c][ch.r] = ch.to; });
        if (round.length) SND.play('sfx_symbol_upgrade');
        await waitF(FR.scareWave * .55);
      }
      await waitF(FR.scareEdge);
    } else if (s.bear === 'charm') {
      // bear_charm: 20f kiss + hearts, 25f hearts sweep to all 15 positions, 15f upgrade shimmer
      const [k, sw, up] = FR.charm;
      SND.play('sfx_charm_bear_magic');
      emit('heart', bx, by - cell * .2, 12, { speed: 260, gravity: -80, size: 26, color: ['#ff7ad9', '#ff4f9a'], life: sec(k) + .2 });
      await waitF(k);
      for (let c = 0; c < C.reels; c++) for (let r = 0; r < C.rows; r++) { const [tx, ty] = cellCenter(c, r); G.particles.push({ type: 'heart', x: bx, y: by, tx, ty, life: 0, max: sec(sw), size: 34, rot: 0, vr: 0, color: '#ff6ac8' }); }
      await waitF(sw);
      const t2 = now();
      s.changes.forEach(ch => { G.fx[ch.c][ch.r].morph = { t0: t2, frames: up, from: ch.from, glow: '#ffd0f0' }; G.board[ch.c][ch.r] = ch.to; const [cx, cy] = cellCenter(ch.c, ch.r); emit('spark', cx, cy, 6, { angle: 0, spread: 6, speed: 240, gravity: 100, life: .5, size: 8, color: ['#ffffff', '#ffc0ea'] }); });
      if (s.changes.length) SND.play('sfx_symbol_upgrade');
      await waitF(up);
    } else {
      // bear_dance: 45f accordion riff with notes, 30f hand-over (the trigger banner follows after this spin's wins)
      const [riff, hand] = FR.dance;
      SND.play('sfx_dance_bear_jig');
      for (let i = 0; i < 6; i++) setTimeout(() => emit('note', bx, by - cell * .3, 3, { speed: 260, gravity: -60, size: 36, color: ['#c6ff7a', '#ffe27a', '#7ad9ff'], life: 1.6 }), i * 220 / G.speed);
      await waitF(riff);
      await waitF(hand);
    }
    if (G.bubble) G.bubble.fade = now();
  }
  async function playWipe(s) {
    // vfx_wipe_win_sweep: lock (30f), gold flash sweep + morph (30f), ghost transform or settle (30f)
    const [a, b, c] = FR.wipe;
    clearLines(); SND.play('sfx_wipe_win_fanfare');
    G.lock = { t0: now() };
    await waitF(a);
    G.sweep = { t0: now() };
    if (!s.special) {
      for (let col = 0; col < C.reels; col++) {
        setTimeout(() => { const t2 = now(); s.changes.filter(ch => ch.c === col).forEach(ch => { G.fx[ch.c][ch.r].morph = { t0: t2, frames: 12, from: ch.from }; G.board[ch.c][ch.r] = ch.to; }); }, sec(b) * 1000 * (.15 + col * .16));
      }
      await waitF(b); await waitF(c);
    } else {
      // 15 Yellows morph "up" into Ghosts with green ethereal light and the special win burst
      await waitF(b);
      G.greenT = now(); SND.play('sfx_ghost_jackpot');
      const t2 = now(); s.changes.forEach(ch => { const f = G.fx[ch.c][ch.r]; f.ghost = t2; f.ghostFrom = ch.from; G.board[ch.c][ch.r] = C.GHOST; });
      setWin(G.win + s.amount); G.burst = { t0: now(), text: fmt(s.amount) };
      await waitF(c);
    }
  }

  function bigWinBanner(amount, opts = {}) {
    let tier = engine.tierOf(amount, bet());
    if (opts.ghost) tier = C.winTiers.length - 1;            // ASSET 7.2: Special Award uses the EPIC banner
    if (tier < 0) return Promise.resolve();
    return new Promise(resolve => { G.banner = { tier, amount, t0: now(), tok: G.skip, ghost: opts.ghost, resolve }; });
  }
  function modal(o) { return new Promise(resolve => { G.modal = Object.assign({ t0: now(), tok: G.skip, resolve }, o); }); }
  function transition(kind, onCovered) { return new Promise(resolve => { G.trans = { kind, t0: now(), resolve, onCovered }; }); }

  /* ------------------------------------------------------------ spin flow */
  async function spinOnce(item, inFS) {
    const res = director.build(item || { type: 'random' }, { bet: bet(), inFreeSpins: inFS });
    G.fx = newFx(); G.lines = null; G.labels = []; G.bubble = null;
    const hatch = res.steps.find(st => st.type === 'hatch');
    if (hatch) G.fx[hatch.pos[0]][hatch.pos[1]].star = true;
    const hasWild = res.start[C.wildReel].includes(C.WILD);
    const antic = C.anticipateOn === 'wild' ? hasWild : C.anticipateOn === 'star' ? !!hatch : false;
    if (!inFS) { G.balance = Math.round((G.balance - bet()) * 100) / 100; setWin(0, true); }
    G.spinBaseWin = G.win;      // the HUD win box keeps the round total during free spins
    SND.play('sfx_spin_button_click'); SND.play('sfx_reel_spin');
    G.spinning = true; G.onChange();
    await startReels(res.start, antic);
    G.spinning = false; G.onChange();
    if (hatch) await waitF(4);
    await playSteps(res.steps);
    if (res.bannerTier) {
      // presentation cheat: replace the spin's total with an amount inside the requested banner tier
      const ti = C.winTiers.findIndex(w => w.id === res.bannerTier), lo = C.winTiers[ti].min, hi = (C.winTiers[ti + 1] || { min: lo * 1.6 }).min;
      const amount = Math.round(bet() * (lo + (hi - lo) * (.15 + Math.random() * .5)) * 100) / 100;
      res.total = amount; res.presentationOnly = true; setWin(G.spinBaseWin + amount);
    }
    const wipe = res.steps.find(st => st.type === 'wipe');
    await bigWinBanner(res.total, { ghost: wipe && wipe.special });
    return res;
  }
  function nextItem() {
    const it = G.queue.length ? G.queue.shift() : { type: 'random' };
    G.onChange(); return it;
  }

  async function play() {
    if (G.busy || G.info) return false;
    G.busy = true; G.onChange(); SND.init(root.ASSET_MANIFEST); SND.playMusic('bgm_basegame_loop');
    try {
      const base = await spinOnce(nextItem(), false);
      let roundWin = base.total;
      if (base.freeSpins) roundWin = await freeSpins(base.freeSpins, roundWin);
      roundWin = Math.min(roundWin, C.maxWin * bet());
      G.balance = Math.round((G.balance + roundWin) * 100) / 100;
      setWin(roundWin, true);
    } catch (e) { console.error(e); }
    G.busy = false; G.onChange();
    return true;
  }
  async function freeSpins(count, roundWin) {
    const fs = G.fs, baseWin = roundWin;
    Object.assign(fs, { left: count, played: 0, total: 0, awarded: count, capped: false });
    await modal({ kind: 'intro', text1: 'YOU WON', text2: `${count} FREE SPINS!`, onOutro: () => {} });
    await transition('toFree', () => { fs.active = true; G.envTarget = 1; G.env = 1; SND.playMusic('bgm_freegame_loop'); });
    while (fs.left > 0) {
      fs.left--; fs.played++;
      await wait(.35 / G.speed);
      const r = await spinOnce(nextItem(), true);
      fs.total = Math.round((fs.total + r.total) * 100) / 100; roundWin += r.total;
      if (r.freeSpins && C.freeSpinsRetrigger) {
        await modal({ kind: 'intro', text1: 'YOU WON', text2: `${r.freeSpins} MORE FREE SPINS!` });
        fs.left += r.freeSpins; fs.awarded += r.freeSpins;
      }
      if (roundWin >= C.maxWin * bet()) {
        // max win cap (GDD 390x): stop the round, the summary shows the capped amount
        roundWin = C.maxWin * bet(); fs.total = Math.round((roundWin - baseWin) * 100) / 100; fs.capped = true; fs.left = 0; break;
      }
    }
    await wait(.4 / G.speed);
    await modal({ kind: 'outro', amount: fs.total, spins: fs.played, capped: fs.capped, onOutro: () => { fs.active = false; G.envTarget = 0; } });
    await transition('toBase');
    SND.playMusic('bgm_basegame_loop');
    return roundWin;
  }
  async function autoplayLoop() {
    G.autoplay = !G.autoplay; G.onChange();
    while (G.autoplay) { await play(); if (G.autoplay) await wait(.5); }
  }
  async function playQueue(n) {
    G.autoplay = true; G.onChange();
    let i = 0; const max = n ?? G.queue.length;
    // stop once the list is used up: free spins consume list items inside a single round
    while (G.autoplay && i < max && (i === 0 || G.queue.length)) { await play(); i++; if (i < max && G.queue.length) await wait(.8); }
    G.autoplay = false; G.onChange();
  }

  /* ------------------------------------------------------------ input */
  cv.addEventListener('pointerdown', e => {
    SND.init(root.ASSET_MANIFEST);
    const rc = cv.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * W, y = (e.clientY - rc.top) / rc.height * H;
    if (G.info) { G.info = false; return; }
    const hit = b => Math.hypot(x - b.x, y - b.y) <= b.r * 1.15;
    if (hit(btn.spin)) { if (!G.busy) play(); else G.skip++; return; }
    if (hit(btn.auto)) { autoplayLoop(); return; }
    if (hit(btn.info)) { if (!G.busy) G.info = true; return; }
    if (hit(btn.sound)) { SND.setMuted(!SND.muted); return; }
    if (hit(btn.minus)) { if (!G.busy) { G.betIndex = Math.max(0, G.betIndex - 1); G.onChange(); } return; }
    if (hit(btn.plus)) { if (!G.busy) { G.betIndex = Math.min(C.bets.length - 1, G.betIndex + 1); G.onChange(); } return; }
    G.skip++;
  });
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    const tg = e.target.tagName; if (tg === 'INPUT' || tg === 'SELECT' || tg === 'BUTTON' || tg === 'TEXTAREA') return;
    e.preventDefault(); SND.init(root.ASSET_MANIFEST); if (G.info) G.info = false; else if (G.busy) G.skip++; else play();
  });

  /* ------------------------------------------------------------ boot */
  async function boot() {
    const splash = root.Splash && C.splash && C.splash.enabled && !/[?&]nosplash\b/.test(location.search) ? root.Splash : null;
    if (splash) splash.start(C);
    try { await Promise.race([Promise.all([document.fonts.load(`80px ${SCRIPT}`), document.fonts.load(`80px ${BLOCK}`)]), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
    G.assetInfo = await A.load(root.ASSET_MANIFEST, W, H, L, splash && splash.progress);
    requestAnimationFrame(frame);
    G.onChange();
    if (splash) splash.finish();
  }

  root.Game = { G, C, engine, director, play, playQueue, autoplayLoop, boot, canvas: cv, bet, cellCenter };
})(window);
