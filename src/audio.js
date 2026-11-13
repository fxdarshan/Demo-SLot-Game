/*
 * Sound. Plays files from the manifest when present, otherwise synthesised
 * placeholder effects. Everything runs through one master gain that also
 * feeds the video recorder, so recordings include sound.
 */
(function (root) {
  const A = { ctx: null, master: null, recDest: null, buffers: {}, music: null, musicKey: null, muted: false, loopNode: null };

  A.init = function (manifest) {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume().catch(() => {}); return; }
    try {
      A.ctx = new (root.AudioContext || root.webkitAudioContext)();
      A.master = A.ctx.createGain(); A.master.gain.value = A.muted ? 0 : .6; A.master.connect(A.ctx.destination);
      A.recDest = A.ctx.createMediaStreamDestination(); A.master.connect(A.recDest);
    } catch (e) { A.ctx = null; return; }
    if (location.protocol.startsWith('http')) {
      Object.entries((manifest && manifest.sounds) || {}).forEach(([k, src]) => {
        fetch(src).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => A.ctx.decodeAudioData(b))
          .then(buf => { A.buffers[k] = buf; if (k === A.musicKey) A.playMusic(k, true); }).catch(() => {});
      });
    }
  };
  A.setMuted = m => { A.muted = m; if (A.master) A.master.gain.value = m ? 0 : .6; };

  function file(key, vol = 1, loop = false) {
    const buf = A.buffers[key]; if (!buf || !A.ctx) return null;
    const s = A.ctx.createBufferSource(), g = A.ctx.createGain();
    s.buffer = buf; s.loop = loop; g.gain.value = vol; s.connect(g); g.connect(A.master); s.start();
    return { s, g };
  }
  function tone(f, dur, o = {}) {
    if (!A.ctx) return; const t = A.ctx.currentTime + (o.at || 0);
    const osc = A.ctx.createOscillator(), g = A.ctx.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f * o.slide), t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .2, t + (o.attack || .006)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(g); g.connect(A.master); osc.start(t); osc.stop(t + dur + .05);
  }
  function noise(dur, o = {}) {
    if (!A.ctx) return; const t = A.ctx.currentTime + (o.at || 0), n = Math.floor(A.ctx.sampleRate * dur);
    const buf = A.ctx.createBuffer(1, n, A.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = A.ctx.createBufferSource(); src.buffer = buf;
    const f = A.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = o.q || 1.2;
    f.frequency.setValueAtTime(o.f0 || 800, t); f.frequency.exponentialRampToValueAtTime(o.f1 || 2400, t + dur);
    const g = A.ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || .15, t + dur * .2); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(A.master); src.start(t); src.stop(t + dur + .05);
  }
  const semi = (b, s) => b * Math.pow(2, s / 12);
  const folk = [0, 2, 3, 5, 7, 8, 10, 12]; // minor-ish folk scale

  const SYNTH = {
    spin() { noise(.35, { vol: .1, f0: 300, f1: 1800 }); },
    reel_stop() { tone(180, .12, { type: 'triangle', vol: .3, slide: .6 }); noise(.04, { vol: .12, f0: 1200, f1: 900, q: 2 }); },
    win() { [0, 4, 7].forEach((s, i) => tone(semi(523, s), .3, { type: 'triangle', vol: .14, at: i * .07 })); },
    pop() { tone(900, .08, { type: 'square', vol: .06, slide: 1.8 }); tone(240, .12, { type: 'triangle', vol: .25, slide: .5, at: .02 }); },
    egg_wobble() { for (let i = 0; i < 8; i++) noise(.06, { vol: .12, f0: 600, f1: 500, q: 4, at: i * .12 }); },
    egg_hatch() { noise(.25, { vol: .25, f0: 3000, f1: 600 }); tone(392, .4, { type: 'sawtooth', vol: .06, at: .1 }); },
    bear_scare() { [0, 1, 0, 1].forEach((s, i) => tone(semi(220, s), .15, { type: 'sawtooth', vol: .1, at: i * .1 })); },
    bear_charm() { [0, 4, 7, 12, 16].forEach((s, i) => tone(semi(659, s), .4, { vol: .12, at: i * .06 })); },
    bear_dance() { [0, 3, 7, 10, 12, 10, 7, 3].forEach((s, i) => tone(semi(294, s), .18, { type: 'triangle', vol: .14, at: i * .11 })); },
    fs_start() { [0, 3, 7, 12].forEach((s, i) => tone(semi(294, s), .9, { type: 'sawtooth', vol: .05, attack: .03, at: i * .12 })); },
    wipe() { tone(110, 2, { vol: .3, attack: .01 }); [0, 7, 12, 19].forEach((s, i) => tone(semi(523, s), 1.6, { vol: .08, at: .2 + i * .15 })); },
    bigwin() { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(semi(392, s), .5, { type: 'triangle', vol: .12, at: i * .06 })); },
    tick() { tone(1500 + Math.random() * 500, .05, { type: 'square', vol: .03 }); }
  };

  A.play = function (key, vol) {
    if (!A.ctx) return;
    if (file(key, vol)) return;
    if (SYNTH[key]) SYNTH[key]();
  };

  // music only plays from real files (no synthesised music)
  A.playMusic = function (key, force) {
    if (A.musicKey === key && !force) return;
    A.musicKey = key;
    if (A.music) { const m = A.music; try { m.g.gain.setTargetAtTime(0, A.ctx.currentTime, .3); m.s.stop(A.ctx.currentTime + 1.2); } catch (e) {} A.music = null; }
    if (A.buffers[key]) A.music = file(key, .5, true);
  };

  // simple folk-scale pluck used for small celebrations
  A.pluck = i => tone(semi(392, folk[i % folk.length]), .25, { type: 'triangle', vol: .12 });

  root.Audio2 = A;
})(window);
