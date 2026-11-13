/*
 * Placeholder art, drawn in code.
 * Every function returns a canvas the same way a loaded PNG would be used,
 * so when a real image exists in assets/images/ it simply replaces the result.
 */
(function (root) {
  const S = 300; // symbol sprite size
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // keyed by spec tier: 0 = sym_00 Yellow grandmother (highest) .. 6 = sym_06 Teal with pacifier (lowest)
  const DOLL = {
    6: { c: ['#a6e6dc', '#46a89f', '#1c5c57'], face: 'dummy' },
    5: { c: ['#b8d8ff', '#5c8fe0', '#22377f'], face: 'open' },
    4: { c: ['#d4b0ff', '#7a3fc8', '#3a1470'], face: 'open' },
    3: { c: ['#ffc0ea', '#d662b7', '#74205a'], face: 'smile' },
    2: { c: ['#ffaba4', '#e2463f', '#7a1612'], face: 'open' },
    1: { c: ['#ffd7a6', '#f08b2e', '#83400b'], face: 'glasses' },
    0: { c: ['#fff4b0', '#e6c637', '#836708'], face: 'sleep' }
  };
  const SCALE = { 6: 1, 5: .97, 4: .95, 3: .93, 2: .91, 1: .88, 0: .85 };

  function dollPath(x, k) {
    // matryoshka silhouette: round head on a wider round body
    const cx = S / 2, top = S * (.5 - .44 * k), bot = S * (.5 + .44 * k);
    const h = bot - top, hw = S * .2 * k, bw = S * .31 * k;
    x.beginPath();
    x.moveTo(cx, top);
    x.bezierCurveTo(cx + hw * 1.25, top, cx + hw * 1.2, top + h * .34, cx + hw * .95, top + h * .42);
    x.bezierCurveTo(cx + bw * 1.15, top + h * .5, cx + bw * 1.08, bot, cx, bot);
    x.bezierCurveTo(cx - bw * 1.08, bot, cx - bw * 1.15, top + h * .5, cx - hw * .95, top + h * .42);
    x.bezierCurveTo(cx - hw * 1.2, top + h * .34, cx - hw * 1.25, top, cx, top);
    x.closePath();
    return { cx, top, bot, h, hw, bw };
  }

  function heart(x, cx, cy, s) {
    x.beginPath();
    x.moveTo(cx, cy + s * .35);
    x.bezierCurveTo(cx - s * .9, cy - s * .2, cx - s * .4, cy - s * .9, cx, cy - s * .35);
    x.bezierCurveTo(cx + s * .4, cy - s * .9, cx + s * .9, cy - s * .2, cx, cy + s * .35);
    x.closePath();
  }

  function face(x, kind, cx, cy, r, opts = {}) {
    // skin
    x.fillStyle = opts.ghost ? 'rgba(255,255,255,.75)' : '#f8dccb';
    x.beginPath(); x.ellipse(cx, cy, r, r * .95, 0, 0, 7); x.fill();
    if (!opts.ghost) {
      // hair fringe
      x.fillStyle = kind === 'dummy' ? '#f5c47a' : kind === 'glasses' || kind === 'sleep' ? '#efe3d6' : '#f6d36b';
      x.beginPath(); x.ellipse(cx, cy - r * .62, r * .82, r * .42, 0, Math.PI, 0); x.fill();
      x.fillStyle = 'rgba(255,120,130,.35)';
      x.beginPath(); x.arc(cx - r * .55, cy + r * .3, r * .18, 0, 7); x.arc(cx + r * .55, cy + r * .3, r * .18, 0, 7); x.fill();
    }
    x.strokeStyle = '#3a2420'; x.fillStyle = '#3a2420'; x.lineWidth = r * .08; x.lineCap = 'round';
    const ex = r * .38, ey = cy + r * .02;
    if (kind === 'sleep' && !opts.scared) {
      [-1, 1].forEach(s => { x.beginPath(); x.arc(cx + s * ex, ey, r * .14, .15 * Math.PI, .85 * Math.PI); x.stroke(); });
    } else {
      const er = opts.scared ? r * .2 : r * .16;
      [-1, 1].forEach(s => {
        x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + s * ex, ey, er, 0, 7); x.fill(); x.stroke();
        x.fillStyle = opts.ghost ? '#6aa7a0' : '#2d6f69'; x.beginPath(); x.arc(cx + s * ex + r * .03, ey + r * .02, er * .55, 0, 7); x.fill();
        x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + s * ex + r * .07, ey - r * .04, er * .2, 0, 7); x.fill();
      });
      if (kind === 'glasses' && !opts.ghost) {
        x.strokeStyle = '#8a6a3c'; x.lineWidth = r * .05;
        [-1, 1].forEach(s => { x.beginPath(); x.arc(cx + s * ex, ey, r * .22, 0, 7); x.stroke(); });
        x.beginPath(); x.moveTo(cx - ex + r * .22, ey); x.lineTo(cx + ex - r * .22, ey); x.stroke();
      }
    }
    x.strokeStyle = '#3a2420'; x.fillStyle = '#3a2420'; x.lineWidth = r * .07;
    if (opts.scared || opts.ghost) {
      x.fillStyle = '#5a1f1f'; x.beginPath(); x.ellipse(cx, cy + r * .5, r * .17, r * .24, 0, 0, 7); x.fill();
    } else if (kind === 'dummy') {
      x.fillStyle = '#4fb3c9'; x.beginPath(); x.ellipse(cx, cy + r * .52, r * .3, r * .16, 0, 0, 7); x.fill();
      x.fillStyle = '#2b7f92'; x.beginPath(); x.arc(cx, cy + r * .52, r * .1, 0, 7); x.fill();
    } else {
      x.beginPath(); x.arc(cx, cy + r * .35, r * .18, .2 * Math.PI, .8 * Math.PI); x.stroke();
    }
  }

  function doll(level, opts = {}) {
    const c = mk(S, S), x = c.getContext('2d'), d = DOLL[level], k = SCALE[level];
    x.save(); x.shadowColor = 'rgba(30,10,50,.45)'; x.shadowBlur = 18; x.shadowOffsetY = 10;
    const g0 = dollPath(x, k);
    const g = x.createLinearGradient(S * .2, 0, S * .8, 0);
    g.addColorStop(0, d.c[0]); g.addColorStop(.45, d.c[1]); g.addColorStop(1, d.c[2]);
    x.fillStyle = g; x.fill(); x.restore();
    const { cx, top, h, bw } = g0;
    x.save(); dollPath(x, k); x.clip();
    // body seam (where the doll opens)
    x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, top + h * .55); x.lineTo(S, top + h * .55); x.stroke();
    // apron
    x.fillStyle = 'rgba(255,255,255,.88)';
    x.beginPath(); x.ellipse(cx, top + h * .88, bw * .8, h * .3, 0, Math.PI, 0); x.fill();
    x.fillStyle = 'rgba(255,255,255,.95)';
    for (let i = -4; i <= 4; i++) { x.beginPath(); x.arc(cx + i * bw * .18, top + h * .88, bw * .07, 0, 7); x.fill(); }
    heart(x, cx, top + h * .74, bw * .42); x.fillStyle = d.c[2]; x.fill();
    if (level !== 0) for (let i = 0; i < 4; i++) { x.fillStyle = d.c[0]; x.beginPath(); x.arc(cx + (i % 2 ? 1 : -1) * bw * .1, top + h * (.7 + (i > 1 ? .06 : 0)), bw * .05, 0, 7); x.fill(); }
    // bow under the face
    x.fillStyle = d.c[2];
    x.beginPath(); x.moveTo(cx, top + h * .47); x.lineTo(cx - bw * .3, top + h * .41); x.lineTo(cx - bw * .3, top + h * .53); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(cx, top + h * .47); x.lineTo(cx + bw * .3, top + h * .41); x.lineTo(cx + bw * .3, top + h * .53); x.closePath(); x.fill();
    // gloss
    x.fillStyle = 'rgba(255,255,255,.28)';
    x.beginPath(); x.ellipse(cx - bw * .55, top + h * .55, bw * .12, h * .25, -.15, 0, 7); x.fill();
    x.restore();
    face(x, d.face, cx, top + h * .26, S * .14 * k, opts);
    x.lineWidth = 4; x.strokeStyle = 'rgba(40,20,40,.55)'; dollPath(x, k); x.stroke();
    return c;
  }

  function ghost() {
    const c = mk(S, S), x = c.getContext('2d');
    x.save(); x.shadowColor = 'rgba(120,255,160,.95)'; x.shadowBlur = 34;
    const g = dollPath(x, .88); x.fillStyle = 'rgba(225,255,230,.62)'; x.fill(); x.restore();
    x.lineWidth = 4; x.strokeStyle = 'rgba(120,230,160,.95)'; dollPath(x, .88); x.stroke();
    face(x, 'open', g.cx, g.top + g.h * .26, S * .12, { ghost: true });
    // green halo
    x.save(); x.shadowColor = '#7dffb0'; x.shadowBlur = 16; x.strokeStyle = '#a8ffc8'; x.lineWidth = 7;
    x.beginPath(); x.ellipse(S / 2, g.top + 4, S * .13, S * .035, 0, 0, 7); x.stroke(); x.restore();
    return c;
  }

  function eggPath(x, k = 1) { x.beginPath(); x.ellipse(S / 2, S * .52, S * .3 * k, S * .44 * k, 0, 0, 7); }
  function eggBody(x, clipBottomFrom) {
    x.save();
    eggPath(x);
    if (clipBottomFrom != null) { x.save(); x.clip(); x.beginPath(); x.rect(0, clipBottomFrom, S, S); }
    x.clip();
    const g = x.createRadialGradient(S / 2, S * .5, 0, S / 2, S * .5, S * .45);
    g.addColorStop(0, '#fffbe0'); g.addColorStop(.35, '#ffd53f'); g.addColorStop(1, '#e8641f');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.translate(S / 2, S * .52);
    for (let i = 0; i < 24; i++) { x.rotate(Math.PI / 12); x.fillStyle = i % 2 ? 'rgba(255,255,255,.18)' : 'rgba(230,90,20,.18)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(-S * .07, -S * .5); x.lineTo(S * .07, -S * .5); x.closePath(); x.fill(); }
    x.restore();
    if (clipBottomFrom != null) x.restore();
  }
  function drawW(x, cy, s) {
    x.save(); x.translate(S / 2, cy); x.strokeStyle = '#1f2f3c'; x.lineWidth = s * .13; x.lineJoin = 'round'; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-s * .55, -s * .4); x.lineTo(-s * .28, s * .45); x.lineTo(0, -s * .05); x.lineTo(s * .28, s * .45); x.lineTo(s * .55, -s * .4); x.stroke();
    x.strokeStyle = '#4fc3d6'; x.lineWidth = s * .05; x.stroke();
    x.restore();
  }
  function wild(star) {
    const c = mk(S, S), x = c.getContext('2d');
    x.save(); x.shadowColor = 'rgba(80,20,0,.45)'; x.shadowBlur = 20; x.shadowOffsetY = 10; eggPath(x); x.fillStyle = '#e8641f'; x.fill(); x.restore();
    eggBody(x);
    // the star means this Wild will open to a bear
    if (star) {
      x.save(); x.translate(S / 2, S * .3); x.shadowColor = '#fff'; x.shadowBlur = 14; x.strokeStyle = '#2d7fa8'; x.lineWidth = 7; x.lineCap = 'round';
      for (let i = 0; i < 6; i++) { x.rotate(Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -S * .1); x.stroke(); x.beginPath(); x.moveTo(-S * .025, -S * .065); x.lineTo(0, -S * .045); x.lineTo(S * .025, -S * .065); x.stroke(); }
      x.restore();
    }
    drawW(x, S * .6, S * .32);
    x.lineWidth = 5; x.strokeStyle = '#8a3510'; eggPath(x); x.stroke();
    return c;
  }
  // egg with the bear sitting in the bottom shell
  function bear(type) {
    const c = mk(S, S), x = c.getContext('2d'), cx = S / 2, cy = S * .42, r = S * .2;
    // head and body
    x.save(); x.shadowColor = 'rgba(40,10,0,.4)'; x.shadowBlur = 16; x.shadowOffsetY = 8;
    x.fillStyle = '#a8764e'; x.beginPath(); x.ellipse(cx, cy + r * .45, r * 1.25, r * 1.3, 0, 0, 7); x.fill(); x.restore();
    x.fillStyle = '#a8764e'; [-1, 1].forEach(s => { x.beginPath(); x.arc(cx + s * r * .85, cy - r * .7, r * .32, 0, 7); x.fill(); });
    x.fillStyle = '#7e5233'; [-1, 1].forEach(s => { x.beginPath(); x.arc(cx + s * r * .85, cy - r * .7, r * .17, 0, 7); x.fill(); });
    x.fillStyle = '#e6c7a4'; x.beginPath(); x.ellipse(cx, cy + r * .28, r * .45, r * .33, 0, 0, 7); x.fill();
    x.fillStyle = '#2b1a10'; x.beginPath(); x.ellipse(cx, cy + r * .12, r * .14, r * .1, 0, 0, 7); x.fill();
    x.strokeStyle = '#2b1a10'; x.lineWidth = r * .07; x.lineCap = 'round';
    if (type === 'dance') { [-1, 1].forEach(s => { x.beginPath(); x.arc(cx + s * r * .42, cy - r * .2, r * .13, 1.1 * Math.PI, 1.9 * Math.PI); x.stroke(); }); }
    else { [-1, 1].forEach(s => { x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + s * r * .42, cy - r * .2, r * (type === 'scare' ? .17 : .12), 0, 7); x.fill(); x.fillStyle = '#2b1a10'; x.beginPath(); x.arc(cx + s * r * .42, cy - r * .18, r * .07, 0, 7); x.fill(); }); }
    if (type === 'charm') {
      x.fillStyle = '#e8566e'; x.beginPath(); x.ellipse(cx, cy + r * .5, r * .1, r * .14, 0, 0, 7); x.fill();
      x.fillStyle = '#2b2b33'; x.fillRect(cx - r * .32, cy - r * 1.25, r * .64, r * .38); x.fillRect(cx - r * .46, cy - r * .9, r * .92, r * .1);
    }
    if (type === 'scare') { x.beginPath(); x.moveTo(cx - r * .25, cy + r * .45); x.lineTo(cx + r * .25, cy + r * .45); x.stroke(); }
    if (type === 'dance') {
      x.fillStyle = '#c23b3b'; x.fillRect(cx - r * .9, cy + r * .75, r * 1.8, r * .5);
      x.strokeStyle = '#f2e4c9'; x.lineWidth = r * .05; for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(cx + i * r * .22, cy + r * .78); x.lineTo(cx + i * r * .22, cy + r * 1.22); x.stroke(); }
    }
    // bottom half of the egg shell in front
    const cut = S * .62;
    eggBody(x, cut);
    x.save(); eggPath(x); x.clip(); x.beginPath(); x.rect(0, cut, S, S); x.clip(); drawW(x, S * .78, S * .22); x.restore();
    // zig-zag crack edge
    x.strokeStyle = '#8a3510'; x.lineWidth = 5; x.beginPath();
    for (let i = 0; i <= 10; i++) { const xx = S * .2 + i * S * .06; x.lineTo(xx, cut + (i % 2 ? 10 : -6)); } x.stroke();
    x.save(); eggPath(x); x.clip(); x.beginPath(); x.rect(0, cut, S, S); x.clip(); x.lineWidth = 10; x.strokeStyle = '#8a3510'; eggPath(x); x.stroke(); x.restore();
    return c;
  }

  // --- environment: wood + folk lace (ASSET 2.1) -----------------------------
  function doily(x, cx, cy, r, alpha) {
    x.save(); x.translate(cx, cy); x.globalAlpha = alpha; x.strokeStyle = '#fff6e8'; x.fillStyle = '#fff6e8';
    for (let ring = 0; ring < 4; ring++) {
      const rr = r * (1 - ring * .22), n = 18 - ring * 3;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        x.beginPath(); x.arc(Math.cos(a) * rr, Math.sin(a) * rr, r * .07 * (1 - ring * .15), 0, 7);
        ring % 2 ? x.fill() : (x.lineWidth = 3, x.stroke());
      }
      x.lineWidth = 2; x.beginPath(); x.arc(0, 0, rr * .9, 0, 7); x.stroke();
    }
    for (let i = 0; i < 8; i++) { x.rotate(Math.PI / 4); x.beginPath(); x.ellipse(0, -r * .3, r * .06, r * .22, 0, 0, 7); x.fill(); }
    x.restore();
  }
  function woodBg(W, H, free) {
    const c = mk(W, H), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    if (free) { g.addColorStop(0, '#2a1450'); g.addColorStop(.5, '#3b1a5e'); g.addColorStop(1, '#170a30'); }
    else { g.addColorStop(0, '#8a3a1e'); g.addColorStop(.5, '#a6492a'); g.addColorStop(1, '#6a2a15'); }
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // planks
    for (let i = 0; i < 12; i++) {
      x.fillStyle = `rgba(0,0,0,${.05 + (i % 3) * .03})`; x.fillRect(i * W / 12, 0, 2, H);
      for (let k = 0; k < 18; k++) { x.strokeStyle = 'rgba(255,220,180,.04)'; x.lineWidth = 2; x.beginPath(); x.moveTo(i * W / 12 + 10, k * 70 + (i * 37) % 60); x.bezierCurveTo(i * W / 12 + 60, k * 70 + 20, i * W / 12 + 90, k * 70 + 40, i * W / 12 + W / 12 - 10, k * 70 + 10); x.stroke(); }
    }
    const v = x.createRadialGradient(W / 2, H * .45, H * .2, W / 2, H * .45, W * .7);
    v.addColorStop(0, free ? 'rgba(255,180,255,.12)' : 'rgba(255,220,160,.15)'); v.addColorStop(1, 'rgba(0,0,0,.45)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    return c;
  }
  // ornaments drawn separately so the base loop can breathe them (ANIM 2.1)
  function ornaments(W, H, free) {
    const c = mk(W, H), x = c.getContext('2d');
    [[W * .06, H * .14, 150], [W * .94, H * .14, 150], [W * .06, H * .78, 170], [W * .94, H * .78, 170], [W * .5, H * .02, 120]].forEach(([cx, cy, r]) => doily(x, cx, cy, r, free ? .22 : .3));
    return c;
  }
  // reel frame overlay: full stage, transparent centre (ASSET 2.1 bg_base_frame / 3.1 bg_freegame_frame)
  function frame(W, H, L, free) {
    const c = mk(W, H), x = c.getContext('2d'), p = L.cell * .16, fx = L.x0 - p, fy = L.y0 - p, fw = L.gw + p * 2, fh = L.gh + p * 2, t = p * .9;
    x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 30; x.shadowOffsetY = 10;
    x.beginPath(); x.roundRect(fx - t, fy - t, fw + t * 2, fh + t * 2, 34); x.roundRect(fx, fy, fw, fh, 18);
    const g = x.createLinearGradient(0, fy - t, 0, fy + fh + t);
    if (free) { g.addColorStop(0, '#ffe7a0'); g.addColorStop(.5, '#d79a2a'); g.addColorStop(1, '#ffe7a0'); }
    else { g.addColorStop(0, '#c98a4e'); g.addColorStop(.5, '#7a4523'); g.addColorStop(1, '#c98a4e'); }
    x.fillStyle = g; x.fill('evenodd'); x.restore();
    x.lineWidth = 4; x.strokeStyle = free ? '#fff3c4' : '#f2c27a';
    x.beginPath(); x.roundRect(fx - t + 8, fy - t + 8, fw + t * 2 - 16, fh + t * 2 - 16, 28); x.stroke();
    x.beginPath(); x.roundRect(fx - 4, fy - 4, fw + 8, fh + 8, 20); x.stroke();
    // painted folk flowers along the border
    const flower = (cx, cy) => {
      x.fillStyle = free ? '#ff5a7a' : '#d8342c';
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; x.beginPath(); x.ellipse(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, 7, 5, a, 0, 7); x.fill(); }
      x.fillStyle = '#ffd34a'; x.beginPath(); x.arc(cx, cy, 5, 0, 7); x.fill();
    };
    const step = 110;
    for (let xx = fx + 40; xx < fx + fw - 20; xx += step) { flower(xx, fy - t / 2); flower(xx, fy + fh + t / 2); }
    for (let yy = fy + 60; yy < fy + fh - 20; yy += step) { flower(fx - t / 2, yy); flower(fx + fw + t / 2, yy); }
    return c;
  }
  function reelStrip(w, h) {
    const c = mk(Math.round(w), Math.round(h)), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,244,226,.86)'); g.addColorStop(.5, 'rgba(255,250,240,.94)'); g.addColorStop(1, 'rgba(255,244,226,.86)');
    x.fillStyle = g; x.beginPath(); x.roundRect(3, 0, w - 6, h, 12); x.fill();
    x.fillStyle = 'rgba(200,120,90,.18)';
    for (let yy = 10; yy < h; yy += 22) { x.beginPath(); x.arc(10, yy, 4, 0, 7); x.arc(w - 10, yy, 4, 0, 7); x.fill(); }
    return c;
  }
  function nodeRing() {
    const c = mk(S, S), x = c.getContext('2d');
    x.save(); x.shadowColor = '#ffd84a'; x.shadowBlur = 24; x.strokeStyle = '#ffe58a'; x.lineWidth = 12;
    x.beginPath(); x.roundRect(S * .06, S * .06, S * .88, S * .88, S * .16); x.stroke(); x.restore();
    x.strokeStyle = '#fffbe6'; x.lineWidth = 3; x.beginPath(); x.roundRect(S * .06, S * .06, S * .88, S * .88, S * .16); x.stroke();
    return c;
  }

  root.Placeholders = { S, DOLL, doll, ghost, wild, bear, woodBg, ornaments, frame, reelStrip, nodeRing, heart };
})(window);
