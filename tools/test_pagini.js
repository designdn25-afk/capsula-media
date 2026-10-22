// Capturi de ecran ale paginii principale și verificări automate.
//
// Pregătire (o singură dată):   npm i -D playwright && npx playwright install chromium
// Pornește serverul (alt terminal): cd site && python3 -m http.server 8765
// Rulează:                       node tools/test_pagini.js
// Capturile apar în folderul screenshots/.
//
// Dimensiunile acoperă cazurile la care clientul a fost atent:
// panoul îngust din aplicația Claude (506×506), telefon, tabletă, laptop și monitor mare.
// Criterii: zero erori JavaScript, zero răspunsuri 4xx/5xx, fără derulare orizontală,
// cel mult un <video> care rulează în același timp.

const { chromium } = require('playwright');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:8765';
const PAGE = process.env.PAGE || 'home.html';
const SIZES = [
  [506, 506, 'panou'],
  [390, 844, 'telefon'],
  [820, 1180, 'tableta'],
  [1440, 900, 'laptop'],
  [1920, 960, 'desktop'],
];
// unde facem capturi: [nume, funcție care întoarce scrollY]
const SPOTS = [
  ['sus', () => 0],
  ['interior-start', () => { const s = document.getElementById('interior'); return s ? s.offsetTop : -1; }],
  ['interior-mijloc', () => { const s = document.getElementById('interior'); return s ? s.offsetTop + .5 * Math.max(0, s.offsetHeight - innerHeight) : -1; }],
  ['exterior', () => { const s = document.getElementById('exterior'); return s ? s.offsetTop : -1; }],
  ['zi-noapte', () => { const s = document.getElementById('zi-noapte'); return s ? s.offsetTop : -1; }],
  ['galerie', () => { const s = document.getElementById('galerie'); return s ? s.offsetTop : -1; }],
];

async function run(browser, w, h, name, reduced) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(`${BASE}/${PAGE}`, { waitUntil: 'load' });
  await p.waitForTimeout(4000);
  const tag = `${name}${reduced ? '-redus' : ''}`;
  for (const [spot, fn] of SPOTS) {
    const y = await p.evaluate(fn);
    if (y < 0) continue;
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await p.waitForTimeout(spot === 'zi-noapte' ? 3200 : 1600);
    await p.screenshot({ path: `screenshots/${tag}-${spot}-${w}x${h}.png` });
    const st = await p.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      videos: [...document.querySelectorAll('video')].filter((v) => !v.paused && !v.ended).length,
    }));
    if (st.overflow > 0) errors.push(`${spot}: derulare orizontală ${st.overflow}px`);
    if (st.videos > 1) errors.push(`${spot}: ${st.videos} clipuri rulează în același timp`);
  }
  console.log(`${tag} ${w}x${h}  ${errors.length ? 'PROBLEME: ' + errors.join(' | ') : 'ok'}`);
  await p.close();
  return errors.length;
}

(async () => {
  fs.mkdirSync('screenshots', { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let problems = 0;
  for (const [w, h, name] of SIZES) problems += await run(browser, w, h, name, false);
  problems += await run(browser, 1440, 900, 'laptop', true);
  problems += await run(browser, 390, 844, 'telefon', true);
  await browser.close();
  process.exitCode = problems ? 1 : 0;
})();
