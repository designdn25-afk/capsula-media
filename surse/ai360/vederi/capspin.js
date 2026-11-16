// node capspin.js <casă: x7|t7|e7|v3|m9> [cadre=288] [lățime=1920] [pv=0] [ora=10.6]
// Scoate cadrele unei rotiri complete în jurul casei (sursa pentru filmarea realistă), în rot_<casă>[_p][_n]/f_0000.jpg …
// (IESIRE=<folder> le pune în altă parte; sunt multe și mari, nu se urcă în git). Apoi: ffmpeg -framerate 24 -i f_%04d.jpg … .mp4
// Citește locuri.json și cadre.json (din surse/ai360/vederi). **Primul cadru e chiar vederea casei** (același loc ca imaginea ei
// reală): generatorul video (Runway Aleph) pornește de la imaginea de referință, deci primul cadru trebuie să fie aceeași vedere;
// altfel primele ~25 de cadre ies greșite (așa a pățit prima rotire a lui X7, pornită din spate cu DECALAJ=180).
// Are nevoie de serverul local pe 8765 și de captura-rotire.html copiată în site/_t_spin.html.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const OFF = +(process.env.DECALAJ || 0);   // de unde pornește rotirea față de unghiul vederii (0 = chiar din locul vederii)
  const [, , house, N = 288, W = 1920, pv = 0, t = 10.6] = process.argv, V = process.env.VEDERI || __dirname;
  const st = JSON.parse(fs.readFileSync(V + '/locuri.json')).find(v => v.k.toLowerCase() === house && v.pv === +pv);
  const name = 'gr_' + house + (+pv ? '_p' : ''), r = JSON.parse(fs.readFileSync(V + '/cadre.json'))[name].r;
  const out = path.join(process.env.IESIRE || __dirname, 'rot_' + house + (+pv ? '_p' : '') + (+t > 15 ? '_n' : '')); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const Hh = Math.round(+W * (r[3] - r[2]) / (r[1] - r[0]) / 2) * 2;
  const p = await b.newPage({ viewport: { width: +W, height: Hh }, deviceScaleFactor: 1 }); p.on('pageerror', e => console.log('ERR ' + e.message));
  await p.goto(`http://localhost:8765/_t_spin.html?tx=${st.tx}&ty=${st.ty}&tz=${st.tz}&el=${st.el}&dist=${st.dist}&x0=${r[0]}&x1=${r[1]}&y0=${r[2]}&y1=${r[3]}&w=${W}&t=${t}&az=${st.az + OFF}`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 240000 });
  const t0 = Date.now(), from = +(process.env.FROM || 0), to = +(process.env.TO || N);
  for (let i = from; i < to; i++) {
    await p.evaluate(az => new Promise(res => { window.__shot(az); requestAnimationFrame(() => requestAnimationFrame(res)); }), st.az + OFF + 360 * i / N);
    await p.screenshot({ path: path.join(out, 'f_' + String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 93, timeout: 120000 });
    if (i % 24 === 0) console.log(i, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  fs.writeFileSync(path.join(out, 'info.json'), JSON.stringify({ house, pv: +pv, n: +N, az0: st.az + OFF, el: st.el, dist: st.dist, tx: st.tx, ty: st.ty, tz: st.tz, r, w: +W, h: Hh }));
  console.log('gata', out, W + 'x' + Hh); await b.close();
})();
