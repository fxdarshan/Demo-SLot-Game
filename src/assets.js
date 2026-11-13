/*
 * Asset loader. Tries every path in assets/manifest.js and falls back to the
 * placeholder art in placeholders.js when a file is missing. UI buttons,
 * modals and banners have no placeholder image: game.js draws them in code
 * unless a real file exists (check Assets.real[key]).
 */
(function (root) {
  const P = root.Placeholders;
  const Assets = { img: {}, real: {}, splitY: .47, W: 1920, H: 1080, L: null };

  function loadImage(src) {
    return new Promise(res => {
      if (!src) return res(null);
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
  }

  function placeholder(key) {
    const { W, H, L } = Assets;
    let m;
    if ((m = key.match(/^sym_0(\d)_idle$/))) return P.doll(Number(m[1]));
    if ((m = key.match(/^sym_0(\d)_scared$/))) return P.doll(Number(m[1]), { scared: true });
    switch (key) {
      case 'sym_wild_idle': return P.wild(false);
      case 'sym_wild_star_idle': return P.wild(true);
      case 'sym_bear_scare_small': case 'sym_bear_scare_med': case 'sym_bear_scare_large': return P.bear('scare');
      case 'sym_bear_charm': return P.bear('charm');
      case 'sym_bear_dance': return P.bear('dance');
      case 'sym_ghost_idle': return P.ghost();
      case 'bg_base_main': return P.woodBg(W, H, false);
      case 'bg_freegame_main': return P.woodBg(W, H, true);
      case 'bg_base_frame': return P.frame(W, H, L, false);
      case 'bg_freegame_frame': return P.frame(W, H, L, true);
      case 'bg_base_reel_strip': return P.reelStrip(L.cell, L.gh);
      case 'line_node_highlight': return P.nodeRing();
    }
    return null;
  }

  Assets.load = async function (manifest, W, H, layout, onProgress) {
    Assets.W = W; Assets.H = H; Assets.L = layout;
    Assets.splitY = manifest.symbolSplitY || .47;
    const entries = Object.entries(manifest.images || {});
    let done = 0;
    const loaded = await Promise.all(entries.map(([, src]) => loadImage(src).then(im => { if (onProgress) onProgress(++done / entries.length); return im; })));
    const missing = [];
    entries.forEach(([key], i) => {
      if (loaded[i]) { Assets.img[key] = loaded[i]; Assets.real[key] = true; }
      else { Assets.img[key] = placeholder(key); missing.push(key); }
    });
    // extras the spec does not list: scared faces for the Scare Bear, ornament layer for the breathing loop
    for (let t = 0; t <= 6; t++) {
      const k = 'sym_0' + t + '_scared';
      if (Assets.real[k]) continue;   // an optional real scared face was supplied in the manifest
      Assets.img[k] = Assets.real['sym_0' + t + '_idle'] ? Assets.img['sym_0' + t + '_idle'] : placeholder(k);
    }
    if (!Assets.real.bg_base_main) Assets.img.bg_base_ornaments = P.ornaments(W, H, false);
    if (!Assets.real.bg_freegame_main) Assets.img.bg_freegame_ornaments = P.ornaments(W, H, true);
    if (Assets.real.sym_wild_idle && !Assets.real.sym_wild_star_idle) Assets.img.sym_wild_star_idle = Assets.img.sym_wild_idle;
    if (missing.length) console.info('[assets] using placeholders for:', missing.join(', '));
    return { missing, loaded: entries.length - missing.length };
  };

  Assets.get = key => Assets.img[key] || null;
  Assets.symbol = (id, CONFIG, o = {}) => {
    if (id === CONFIG.WILD) return o.star ? Assets.img.sym_wild_star_idle : Assets.img.sym_wild_idle;
    if (id === CONFIG.GHOST) return Assets.img.sym_ghost_idle;
    return Assets.img['sym_0' + id + (o.scared ? '_scared' : '_idle')];
  };
  Assets.bearKey = (bear, size) => bear === 'scare' ? 'sym_bear_scare_' + ['small', 'med', 'large'][(size || 1) - 1] : 'sym_bear_' + bear;

  root.Assets = Assets;
})(window);
