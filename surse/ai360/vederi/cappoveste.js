// node cappoveste.js <segment: 0…3> [cadre=192] [lățime=1920]   sau   node cappoveste.js proba
// Filmează o bucată din povestea de la deschidere în grădina realistă (captura-poveste.html copiată în site/_t_story.html, serverul
// local pe 8765): segmentul k merge de la cheia k la cheia k+1 (derularea .03 → .205 → .38 → .55 → .715). Primul cadru al
// segmentului k e același cu ultimul al segmentului k-1 (generatorul pornește de la imaginea de referință: ultimul cadru „real” dinainte).
// Cadrele ajung în pov_<k>/f_0000.jpg (IESIRE=<folder>; FROM=<cadru> reia o filmare întreruptă); „proba” scoate câte un cadru din fiecare cheie și dintre ele.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const [, , seg = '0', N = 192, W = 1920] = process.argv, base = process.env.IESIRE || __dirname;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const Hh = Math.round(+W * 9 / 16 / 2) * 2, p = await b.newPage({ viewport: { width: +W, height: Hh }, deviceScaleFactor: 1 }); p.on('pageerror', e => console.log('ERR ' + e.message));
  await p.goto(`http://localhost:8765/_t_story.html?w=${W}`, { waitUntil: 'load' }); await p.waitForFunction(() => window.__ready === true, null, { timeout: 240000 });
  const K = await p.evaluate(() => window.__keys), shot = async (pp, f) => { await p.evaluate(x => new Promise(res => { window.__shot(x); window.__shot(x); requestAnimationFrame(() => requestAnimationFrame(res)); }), pp); await p.screenshot({ path: f, type: 'jpeg', quality: 93, timeout: 120000 }); };
  if (seg === 'proba') { const out = path.join(base, 'pov_proba'); fs.mkdirSync(out, { recursive: true }); let i = 0; for (let k = 0; k < K.length; k++) { await shot(K[k], path.join(out, `p_${i++}.jpg`)); if (k < K.length - 1) await shot((K[k] + K[k + 1]) / 2, path.join(out, `p_${i++}.jpg`)); } console.log('gata proba'); await b.close(); return; }
  const k = +seg, out = path.join(base, 'pov_' + k), t0 = Date.now(); fs.mkdirSync(out, { recursive: true });
  for (let i = +(process.env.FROM || 0); i < +N; i++) { await shot(K[k] + (K[k + 1] - K[k]) * i / (N - 1), path.join(out, 'f_' + String(i).padStart(4, '0') + '.jpg')); if (i % 24 === 0) console.log(i, ((Date.now() - t0) / 1000).toFixed(0) + 's'); }
  fs.writeFileSync(path.join(out, 'info.json'), JSON.stringify({ seg: k, n: +N, p0: K[k], p1: K[k + 1], w: +W, h: Hh })); console.log('gata', out); await b.close();
})();
