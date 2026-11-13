/*
 * Demo controls panel: outcome list, custom grid, recording, asset status.
 * Not part of the game itself; hide it with the D key.
 */
(function (root) {
  const { G, C, engine } = root.Game, A = root.Assets, OUT = root.Director.OUTCOMES;
  const $ = s => document.querySelector(s), cv = root.Game.canvas;

  /* ---------- canvas fit ---------- */
  function fit() {
    const r = $('#wrap').getBoundingClientRect(), k = Math.min((r.width - 24) / cv.width, (r.height - 24) / cv.height);
    cv.style.width = Math.floor(cv.width * k) + 'px'; cv.style.height = Math.floor(cv.height * k) + 'px';
  }
  new ResizeObserver(fit).observe($('#wrap'));

  /* ---------- panel toggle ---------- */
  const togglePanel = show => { $('#app').classList.toggle('no-panel', !show); $('#showPanel').hidden = show; setTimeout(fit, 0); };
  $('#hidePanel').onclick = () => togglePanel(false);
  $('#showPanel').onclick = () => togglePanel(true);
  document.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'd' && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) togglePanel($('#app').classList.contains('no-panel')); });

  /* ---------- queue ---------- */
  G.queue = [{ type: 'small' }, { type: 'chain' }, { type: 'scare3' }, { type: 'charm' }, { type: 'wipe' }, { type: 'dance' }, { type: 'ghost' }];
  function renderQueue() {
    const q = $('#queue'); q.innerHTML = '';
    if (!G.queue.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Empty: spins are random.'; q.appendChild(li); }
    G.queue.forEach((it, i) => {
      const o = OUT[it.type] || OUT.random, li = document.createElement('li');
      li.innerHTML = `<span class="lbl"><span class="dot" style="background:${o.color}"></span>${o.label}${it.bear ? ' · ' + it.bear : ''}</span>`;
      const up = document.createElement('button'); up.textContent = '↑'; up.title = 'Move up'; up.disabled = i === 0;
      up.onclick = () => { [G.queue[i - 1], G.queue[i]] = [G.queue[i], G.queue[i - 1]]; renderQueue(); };
      const rm = document.createElement('button'); rm.textContent = '✕'; rm.title = 'Remove';
      rm.onclick = () => { G.queue.splice(i, 1); renderQueue(); };
      li.append(up, rm); q.appendChild(li);
    });
  }
  const adds = $('#adds');
  ['nowin', 'small', 'chain', 'big', 'scare', 'scare3', 'charm', 'dance', 'wipe', 'ghost', 'random'].forEach(k => {
    const b = document.createElement('button'); b.innerHTML = `<span class="dot" style="background:${OUT[k].color}"></span>${OUT[k].label}`;
    b.onclick = () => { G.queue.push({ type: k }); renderQueue(); }; adds.appendChild(b);
  });
  $('#clearQueue').onclick = () => { G.queue = []; renderQueue(); };
  $('#playQueue').onclick = () => { if (G.autoplay) { G.autoplay = false; update(); } else if (!G.busy) root.Game.playQueue(); };
  $('#spin').onclick = () => root.Game.play();

  /* ---------- custom grid ---------- */
  const ED_SYMS = [7, 6, 5, 4, 3, 2, 1, C.WILD];
  let pick = 3, edGrid = engine.randomGrid({ allowWild: false });
  const thumb = id => { const im = A.symbol(id, C); if (!im) return ''; if (im.src) return im.src; const c = document.createElement('canvas'); c.width = c.height = 72; c.getContext('2d').drawImage(im, 0, 0, 72, 72); return c.toDataURL(); };
  const thumbs = {};
  function renderPalette() {
    const p = $('#palette'); p.innerHTML = '';
    ED_SYMS.forEach(id => { const b = document.createElement('button'); b.title = C.symbolNames[id]; b.setAttribute('aria-pressed', String(pick === id));
      b.innerHTML = `<img alt="${C.symbolNames[id]}" src="${thumbs[id]}">`; b.onclick = () => { pick = id; renderPalette(); }; p.appendChild(b); });
  }
  function renderEditor() {
    const ge = $('#gridEd'); ge.innerHTML = '';
    for (let r = 0; r < C.rows; r++) for (let c = 0; c < C.reels; c++) {
      const s = edGrid[c][r], b = document.createElement('button'); b.title = `Reel ${c + 1}, row ${r + 1}: ${C.symbolNames[s]}`;
      if (c === C.wildReel) b.className = 'wild-col';
      b.innerHTML = `<img alt="${C.symbolNames[s]}" src="${thumbs[s]}">`;
      b.onclick = () => { if (pick === C.WILD && c !== C.wildReel) { info('The Wild Egg only lands on reel 3.'); return; } edGrid[c][r] = pick; renderEditor(); };
      ge.appendChild(b);
    }
    const { bear, scareSize } = edBear();
    const hasWild = edGrid[C.wildReel].includes(C.WILD);
    const res = engine.resolveSpin(edGrid, bear && hasWild ? { bet: root.Game.bet(), forceBear: bear, scareSize } : { bet: root.Game.bet(), forceStar: false });
    const pops = res.steps.filter(s => s.type === 'pop').length, wipe = res.steps.find(s => s.type === 'wipe');
    const parts = [res.total > 0 ? `Pays <b>${C.currency}${res.total.toFixed(2)}</b> (${(res.total / root.Game.bet()).toFixed(1)}× bet)` : 'No win'];
    if (pops) parts.push(`${pops} upgrade round${pops > 1 ? 's' : ''}`);
    if (bear && hasWild) parts.push(`Wild opens: <b>${$('#edBear').selectedOptions[0].text}</b>`);
    else if (bear) parts.push('add a Wild on reel 3 for the bear');
    if (wipe) parts.push(wipe.special ? '<b>wipe → Ghost special win</b>' : '<b>wipe win</b>');
    info(parts.join(' · '));
  }
  const info = h => { $('#edInfo').innerHTML = h; };
  function edBear() { const v = $('#edBear').value; if (!v) return {}; const [bear, size] = v.split(':'); return { bear, scareSize: size ? Number(size) : undefined }; }
  $('#edBear').onchange = renderEditor;
  $('#addCustom').onclick = () => { const b = edBear(); G.queue.push({ type: 'custom', grid: edGrid.map(c => c.slice()), bear: b.bear, scareSize: b.scareSize }); renderQueue(); };
  $('#copyBoard').onclick = () => { edGrid = G.board.map(c => c.map(s => (s === C.GHOST ? 1 : s))); renderEditor(); };

  /* ---------- speed ---------- */
  $('#speed').oninput = e => { G.speed = Number(e.target.value); $('#speedOut').textContent = G.speed + '×'; };

  /* ---------- recording ---------- */
  let rec = null, chunks = [], t0 = 0, timer = 0, downloads = null;
  function mime() {
    for (const m of ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'])
      if (root.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
    return '';
  }
  function startRec() {
    if (rec) return true;
    if (!root.MediaRecorder || !cv.captureStream) { $('#recOut').textContent = 'This browser cannot record the canvas. Use Chrome or Edge.'; return false; }
    root.Audio2.init(root.ASSET_MANIFEST);
    const tracks = [...cv.captureStream(60).getVideoTracks()];
    if (root.Audio2.recDest) tracks.push(...root.Audio2.recDest.stream.getAudioTracks());
    const m = mime(); rec = new MediaRecorder(new MediaStream(tracks), m ? { mimeType: m, videoBitsPerSecond: 16e6 } : {});
    chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onstop = () => done(new Blob(chunks, { type: (m || 'video/webm').split(';')[0] }), m.includes('mp4') ? 'mp4' : 'webm');
    rec.start(250); t0 = performance.now();
    timer = setInterval(() => { const s = (performance.now() - t0) / 1000; $('#recTime').textContent = '● ' + Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }, 250);
    update(); return true;
  }
  function stopRec() { if (!rec) return; const r = rec; rec = null; clearInterval(timer); $('#recTime').textContent = ''; r.stop(); update(); }
  function done(blob, ext) {
    const url = URL.createObjectURL(blob), name = `nesting-dolls-demo-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.${ext}`;
    const out = $('#recOut'); out.innerHTML = '';
    const v = document.createElement('video'); v.src = url; v.controls = true; out.appendChild(v);
    const meta = document.createElement('p'); meta.className = 'hint'; meta.textContent = `${cv.width}×${cv.height} ${ext.toUpperCase()}, ${(blob.size / 1048576).toFixed(1)} MB`; out.appendChild(meta);
    if (downloads) {
      const b = document.createElement('button'); b.className = 'primary'; b.textContent = 'Save video';
      b.onclick = () => downloads.save({ filename: name, data: blob }).then(() => { meta.textContent += ' · saved'; }).catch(e => { meta.textContent += e && e.code === 'declined' ? ' · save cancelled' : ' · could not save'; });
      out.appendChild(b);
    } else { const a = document.createElement('a'); a.href = url; a.download = name; a.textContent = 'Download ' + name; out.appendChild(a); }
  }
  $('#rec').onclick = async () => {
    if (rec) { G.autoplay = false; stopRec(); return; }
    const mode = $('#recMode').value;
    if (mode === 'manual') { startRec(); return; }
    if (G.busy) return;
    if (!startRec()) return;
    await new Promise(r => setTimeout(r, 400));
    if (mode === 'spin') await root.Game.play(); else await root.Game.playQueue();
    await new Promise(r => setTimeout(r, 900));
    stopRec();
  };

  /* ---------- status ---------- */
  function update() {
    $('#playQueue').textContent = G.autoplay ? 'Stop after this spin' : 'Play list';
    $('#spin').disabled = G.busy;
    $('#rec').classList.toggle('on', !!rec); $('#rec').textContent = rec ? '■ Stop' : '● Record';
    renderQueue();
  }
  G.onChange = update;

  root.Game.boot().then(() => {
    ED_SYMS.forEach(id => { thumbs[id] = thumb(id); });
    renderPalette(); renderEditor(); update(); fit();
    const inf = G.assetInfo || { missing: [], loaded: 0 };
    $('#assetInfo').textContent = `${inf.loaded} of ${inf.loaded + inf.missing.length} image files found in assets/. The rest use built-in placeholders.`;
    $('#assetList').innerHTML = inf.missing.map(k => `<li>${k}: ${root.ASSET_MANIFEST.images[k]}</li>`).join('');
  });
  try { if (root.claude && root.claude.use) root.claude.use('downloads').then(d => { downloads = d; }).catch(() => {}); } catch (e) {}
})(window);
