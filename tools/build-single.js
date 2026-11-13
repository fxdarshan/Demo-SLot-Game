#!/usr/bin/env node
/*
 * Builds one self-contained HTML file with every script and stylesheet inlined.
 * Anyone can double-click the result to play, with no server or install.
 *   node tools/build-single.js            -> dist/nesting-dolls-prototype.html
 * Art and sound files from assets/ are not embedded, so the single file always
 * shows the placeholders. Use the hosted version (or a local server) to see real assets.
 */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// a closing </script> inside an inlined file would end the tag early, so escape it
const safe = s => s.replace(/<\/script/gi, '<\\/script');

html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) =>
  `<style>\n${fs.readFileSync(path.join(root, href), 'utf8')}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) =>
  `<script>\n/* ${src} */\n${safe(fs.readFileSync(path.join(root, src), 'utf8'))}\n</script>`);

const stamp = new Date().toISOString().slice(0, 10);
html = html.replace('<head>', `<head>\n<!-- Nesting Dolls prototype, single-file build ${stamp}. Source: https://github.com/fxdarshan/Demo-SLot-Game -->`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'nesting-dolls-prototype.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${path.relative(root, out)} (${(html.length / 1024).toFixed(0)} KB)`);
