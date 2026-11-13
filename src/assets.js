/*
 * Asset loader. Tries every path in assets/manifest.js and falls back to the
 * placeholder art in placeholders.js when a file is missing.
 */
(function (root) {
  const P = root.Placeholders;
  const Assets = { img: {}, real: {}, patchCache: {}, splitY: .47, W: 1920, H: 1080 };

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
    const W = Assets.W, H = Assets.H;
    let m;
    if ((m = key.match(/^symbol_L(\d)(_scared)?$/))) return P.doll(Number(m[1]), { scared: !!m[2] });
    if (key === 'wild') return P.wild();
    if (key === 'ghost') return P.ghost();
    if ((m = key.match(/^bear_(\w+)$/))) return P.bear(m[1]);
    if (key === 'background') return P.knit(W, H, 'base');
    if (key === 'background_freespins') return P.knit(W, H, 'free');
    if (key === 'background_bigwin') return P.knit(W, H, 'big');
    if (key === 'background_megawin') return P.knit(W, H, 'mega');
    if (key === 'background_epicwin') return P.knit(W, H, 'epic');
    if (key === 'background_wipewin') return P.knit(W, H, 'wipe');
    if (key === 'win_patch') return P.patch(300, '#ffffff');
    return null; // bubbles and logo are drawn in code when missing
  }

  Assets.load = async function (manifest, W, H) {
    Assets.W = W; Assets.H = H;
    Assets.splitY = manifest.symbolSplitY || .47;
    const entries = Object.entries(manifest.images || {});
    const loaded = await Promise.all(entries.map(([, src]) => loadImage(src)));
    const missing = [];
    entries.forEach(([key], i) => {
      if (loaded[i]) { Assets.img[key] = loaded[i]; Assets.real[key] = true; }
      else { Assets.img[key] = placeholder(key); missing.push(key); }
    });
    // scared variants default to the normal symbol when a real one exists without a scared file
    for (let l = 1; l <= 7; l++) {
      const k = 'symbol_L' + l, ks = k + '_scared';
      if (Assets.real[k] && !Assets.real[ks]) Assets.img[ks] = Assets.img[k];
    }
    if (missing.length) console.info('[assets] using placeholders for:', missing.join(', '));
    return { missing, loaded: entries.length - missing.length };
  };

  Assets.get = key => Assets.img[key] || null;
  Assets.symbol = (id, CONFIG, scared) => {
    if (id === CONFIG.WILD) return Assets.img.wild;
    if (id === CONFIG.GHOST) return Assets.img.ghost;
    return Assets.img['symbol_L' + id + (scared ? '_scared' : '')];
  };

  /** Win patch tinted to a colour (cached). */
  Assets.patch = color => {
    if (Assets.patchCache[color]) return Assets.patchCache[color];
    const src = Assets.img.win_patch, c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0);
    return (Assets.patchCache[color] = c);
  };

  root.Assets = Assets;
})(window);
