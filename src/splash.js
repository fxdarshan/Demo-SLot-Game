/*
 * Splash / loading screen. A DOM overlay on top of the stage (so it never appears in recordings).
 * Logo: assets/images/ui/ui_splash_logo.webp. Backdrop: the free game background.
 * The bar follows real asset loading but never finishes before CONFIG.splash.minMs,
 * so the screen is always readable. Click anywhere to skip once loading is done.
 * Turn it off with CONFIG.splash.enabled = false, or open the page with ?nosplash.
 * "Replay splash screen" in the demo panel runs it again.
 */
(function (root) {
  const MSG = ['Loading Festive Wonders...', 'Warming up the Reels...', 'Polishing Golden Bells...', 'Preparing Holiday Magic...'];
  const ICON = {
    star: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"/></svg>',
    vol: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    mute: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
    full: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  };

  let el, cv, ctx, raf, parts = [], st = null, ro, cfg = { minMs: 2600, fadeMs: 700 };

  function build() {
    const wrap = document.getElementById('wrap'), manifest = root.ASSET_MANIFEST || { images: {} };
    el = document.createElement('div');
    el.className = 'splash';
    el.setAttribute('aria-label', 'Loading');
    const bg = manifest.images.bg_freegame_main, logo = manifest.images.ui_splash_logo;
    el.innerHTML = `
      <div class="sp-bg"${bg ? ` style="background-image:url('${bg}')"` : ''}></div>
      <div class="sp-shade"></div>
      <canvas class="sp-snow"></canvas>
      <div class="sp-top">
        <div class="sp-brand">${ICON.star}<span>Holiday Magic</span></div>
        <div class="sp-btns"><button class="sp-btn" data-act="vol" aria-label="Toggle sound"></button><button class="sp-btn" data-act="full" aria-label="Fullscreen">${ICON.full}</button></div>
      </div>
      <div class="sp-hero">
        <div class="sp-halo"></div>
        <div class="sp-logo">
          ${logo ? `<img alt="X-Mas Dolls" src="${logo}">` : `<div class="sp-title">X-Mas Dolls</div>`}
          <div class="sp-floor"></div>
        </div>
      </div>
      <div class="sp-load">
        <div class="sp-status"><span class="sp-spin"></span><span class="sp-msg">${MSG[0]}</span><b class="sp-pct">0%</b></div>
        <div class="sp-bar"><div class="sp-trough"><div class="sp-fill"><i class="sp-sheen"></i><i class="sp-gloss"></i></div></div><u></u><u></u></div>
      </div>`;
    wrap.appendChild(el);
    cv = el.querySelector('.sp-snow'); ctx = cv.getContext('2d');
    el.addEventListener('click', e => {
      const b = e.target.closest('.sp-btn');
      if (b) {
        if (b.dataset.act === 'vol' && root.Audio2) { root.Audio2.setMuted(!root.Audio2.muted); icons(); }
        if (b.dataset.act === 'full') { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen(); }
        return;
      }
      if (st && st.ready) leave();
    });
    ro = new ResizeObserver(place); ro.observe(wrap); ro.observe(document.getElementById('stage'));
  }

  const icons = () => { const b = el.querySelector('[data-act=vol]'); if (b) b.innerHTML = root.Audio2 && root.Audio2.muted ? ICON.mute : ICON.vol; };

  // cover exactly the visible stage, and size everything from its width (1920 design px = full width)
  function place() {
    if (!el) return;
    const w = document.getElementById('wrap').getBoundingClientRect(), s = document.getElementById('stage').getBoundingClientRect();
    el.style.left = (s.left - w.left) + 'px'; el.style.top = (s.top - w.top) + 'px';
    el.style.width = s.width + 'px'; el.style.height = s.height + 'px';
    el.style.setProperty('--u', (s.width / 1920) + 'px');
    cv.width = Math.max(1, Math.round(s.width)); cv.height = Math.max(1, Math.round(s.height));
  }

  function spawn(first) {
    const u = cv.width / 1920;
    return { x: Math.random() * cv.width, y: first ? Math.random() * cv.height : -10, r: (Math.random() * 2.8 + .8) * Math.max(u * 1.3, .6),
      vy: (Math.random() * .9 + .4) * Math.max(u * 1.4, .6), vx: (Math.random() - .5) * .5, a: Math.random() * .65 + .25, gold: Math.random() > .55 };
  }
  function snow() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of parts) {
      p.y += p.vy; p.x += p.vx + Math.sin(p.y * .008) * .25;
      if (p.y > cv.height + 10) Object.assign(p, spawn(false));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fillStyle = p.gold ? `rgba(255,225,109,${p.a})` : `rgba(255,255,255,${p.a})`;
      ctx.shadowBlur = p.gold ? 5 : 3; ctx.shadowColor = p.gold ? '#ffe16d' : '#fff';
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function tick(t) {
    if (!st) return;
    snow();
    const elapsed = t - st.t0;
    const shown = Math.min(st.real, Math.min(1, elapsed / cfg.minMs));     // never ahead of the real load, never faster than minMs
    st.shown += (shown - st.shown) * .35;                                     // glide
    const pct = shown >= 1 && st.real >= 1 ? 100 : Math.min(99, Math.round(st.shown * 100));
    el.querySelector('.sp-fill').style.width = Math.max(pct, 2) + '%';
    el.querySelector('.sp-pct').textContent = pct + '%';
    const i = Math.min(MSG.length - 1, Math.floor(pct / 25)), m = el.querySelector('.sp-msg');
    const txt = pct >= 100 ? 'Welcome to X-Mas Dolls!' : MSG[i];
    if (m.textContent !== txt) m.textContent = txt;
    if (pct >= 100 && st.real >= 1 && !st.ready) { st.ready = true; st.tReady = t; }
    if (st.ready && t - st.tReady > 450) return leave();
    raf = requestAnimationFrame(tick);
  }

  function leave() {
    if (!st || st.leaving) return;
    st.leaving = true; cancelAnimationFrame(raf);
    el.classList.add('out');
    const e = el; setTimeout(() => { if (el === e && st && st.leaving) { e.hidden = true; e.classList.remove('out'); st = null; } }, cfg.fadeMs + 50);
  }

  const Splash = {
    start(C) {
      cfg = Object.assign({ minMs: 2600, fadeMs: 700 }, C && C.splash);
      if (!el) build();
      cancelAnimationFrame(raf);
      el.hidden = false; el.classList.remove('out'); el.style.setProperty('--fade', cfg.fadeMs + 'ms');
      place(); icons();
      parts = Array.from({ length: 60 }, () => spawn(true));
      st = { t0: performance.now(), real: 0, shown: 0, ready: false, leaving: false };
      raf = requestAnimationFrame(tick);
    },
    progress(p) { if (st) st.real = Math.max(st.real, Math.min(.99, p)); },
    finish() { if (st) st.real = 1; },
    replay(C) { Splash.start(C); Splash.finish(); },
    active() { return !!st; },
    skip() { if (st) { st.real = 1; st.ready = true; leave(); } },
  };
  root.Splash = Splash;
})(window);
