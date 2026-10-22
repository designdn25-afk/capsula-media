// Capturi de ecran ale paginilor la mai multe dimensiuni + erori JavaScript.
//
// Pregătire (o singură dată):   npm i -D playwright && npx playwright install chromium
// Pornește serverul (alt terminal): cd site && python3 -m http.server 8765
// Rulează:                       node tools/test_pagini.js
// Capturile apar în folderul screenshots/.
//
// Dimensiunile acoperă cazurile la care clientul a fost atent:
// panoul îngust din aplicația Claude (~506×506), telefon, tabletă, laptop și monitor mare.

const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:8765';
const PAGES = [
  ['home.html', 'v2'],      // pagina principală, pornește cu Varianta 2 (construcția ca un video)
  ['home_v1.html', 'v1'],   // aceeași pagină, pornește cu Varianta 1 (poza reală, 3D)
];
const SIZES = [
  [506, 506, 'panou'],
  [390, 844, 'telefon'],
  [820, 1180, 'tableta'],
  [1440, 900, 'laptop'],
  [1920, 960, 'desktop'],
];

(async () => {
  fs.mkdirSync('screenshots', { recursive: true });
  const browser = await chromium.launch();
  let problems = 0;
  for (const [page, tag] of PAGES) {
    for (const [w, h, name] of SIZES) {
      const p = await browser.newPage({ viewport: { width: w, height: h } });
      const errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      p.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await p.goto(`${BASE}/${page}`, { waitUntil: 'load' });
      await p.waitForTimeout(5000); // lasă animațiile de intrare să se termine
      const file = `screenshots/${tag}-${name}-${w}x${h}.png`;
      await p.screenshot({ path: file });
      console.log(`${file}  ${errors.length ? 'PROBLEME: ' + errors.join(' | ') : 'ok'}`);
      problems += errors.length;
      await p.close();
    }
  }
  await browser.close();
  process.exitCode = problems ? 1 : 0;
})();
