#!/usr/bin/env node
/*
 * Builds one self-contained HTML file with every script and stylesheet inlined.
 * Anyone can double-click the result to play, with no server or install.
 *   node tools/build-single.js            -> dist/x-mas-dolls-prototype.html
 * Every image listed in assets/manifest.js that exists on disk is embedded as a
 * data URI, so the single file shows the real art. Sounds are not embedded
 * (the single file uses the synthesised placeholder sounds).
 */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// a closing </script> inside an inlined file would end the tag early, so escape it
const safe = s => s.replace(/<\/script/gi, '<\\/script');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) =>
  `<style>\n${fs.readFileSync(path.join(root, href), 'utf8')}\n</style>`);
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
let embedded = 0;
function embedImages(js) {
  // swap 'assets/images/...' paths for data URIs when the file exists
  return js.replace(/'(assets\/images\/[^']+)'/g, (m, rel) => {
    const file = path.join(root, rel), mime = MIME[path.extname(rel).toLowerCase()];
    if (!mime || !fs.existsSync(file)) return m;
    embedded++;
    return `'data:${mime};base64,${fs.readFileSync(file).toString('base64')}'`;
  });
}
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  let js = fs.readFileSync(path.join(root, src), 'utf8');
  if (src === 'assets/manifest.js') js = embedImages(js);
  return `<script>\n/* ${src} */\n${safe(js)}\n</script>`;
});

const stamp = new Date().toISOString().slice(0, 10);
html = html.replace('<head>', `<head>\n<!-- X-Mas Dolls prototype, single-file build ${stamp}. Source: https://github.com/fxdarshan/Demo-SLot-Game -->`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'x-mas-dolls-prototype.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${path.relative(root, out)} (${(html.length / 1024).toFixed(0)} KB, ${embedded} images embedded)`);
