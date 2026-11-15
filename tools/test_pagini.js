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
  ['poveste-mijloc', () => { const s = document.getElementById('top'); return s && s.classList.contains('st') ? s.offsetTop + .38 * Math.max(0, s.offsetHeight - innerHeight) : -1; }],
  ['cifre', () => { const s = document.getElementById('cifre'); return s ? s.offsetTop - innerHeight * .4 : -1; }],
  ['interior-start', () => { const s = document.getElementById('interior'); return s ? s.offsetTop : -1; }],
  ['interior-mijloc', () => { const s = document.getElementById('interior'); return s ? s.offsetTop + .5 * Math.max(0, s.offsetHeight - innerHeight) : -1; }],
  ['exterior', () => { const s = document.getElementById('exterior'); return s ? s.offsetTop : -1; }],
  ['zi-noapte', () => { const s = document.getElementById('zi-noapte'); return s ? s.offsetTop : -1; }],
  ['gradina', () => { const s = document.querySelector('#gradina .gd-stage'); return s ? s.getBoundingClientRect().top + scrollY - Math.max(0, (innerHeight - s.offsetHeight) / 2) : -1; }],
  ['galerie', () => { const s = document.getElementById('galerie'); return s ? s.offsetTop : -1; }],
];

async function run(browser, w, h, name, reduced) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('consolă: ' + m.text().slice(0, 160)); });
  p.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(`${BASE}/${PAGE}`, { waitUntil: 'load' });
  await p.waitForTimeout(4000);
  const tag = `${name}${reduced ? '-redus' : ''}`;
  for (const [spot, fn] of SPOTS) {
    const y = await p.evaluate(fn);
    if (y < 0) continue;
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    if (spot === 'gradina') await p.waitForFunction(() => /gd--(live|static)/.test(document.getElementById('gradina').className), null, { timeout: 120000 }).catch(() => errors.push('gradina: scena 3D nu a pornit'));
    await p.waitForTimeout(spot === 'zi-noapte' ? 3200 : spot === 'gradina' ? 5000 : 1600);
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
  const doar = process.env.DOAR;   // DOAR=rm: doar cele două treceri „fără animații”; DOAR=marimi: doar cele cinci mărimi
  if (doar !== 'rm') for (const [w, h, name] of SIZES) problems += await run(browser, w, h, name, false);
  if (doar !== 'marimi') {
    problems += await run(browser, 1440, 900, 'laptop', true);
    problems += await run(browser, 390, 844, 'telefon', true);
  }
  await browser.close();
  process.exitCode = problems ? 1 : 0;
})();
