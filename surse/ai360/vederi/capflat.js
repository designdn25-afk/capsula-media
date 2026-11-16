// node capflat.js [nume …]  -> imaginile-sursă ale vederilor din afară, în <nume>_src.jpg (toate, sau doar cele numite)
// Are nevoie de serverul local pe 8765 și de pagina captura-vedere.html copiată în site/_t_flat.html. Citește locuri.json (locurile
// camerei, din __gradina.views()) și cadre_calc.json (ce cuprinde fiecare imagine, scris de rects.py); scrie cadre.json.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const ORA = +(process.env.ORA || 10.6), SUF = ORA > 15 ? '_n' : '';   // ORA=19.9 node capflat.js → vederile de seară (<nume>_n_src.jpg)
  const V = JSON.parse(fs.readFileSync(__dirname + '/locuri.json')), U = JSON.parse(fs.readFileSync(__dirname + '/cadre_calc.json')), only = process.argv.slice(2), meta = {};
  // ordinea caselor (pentru &open=<index>:<nivel>) se citește din site/js/gradina-data.js, ca o casă nouă să nu ceară schimbări aici
  const COD = [...fs.readFileSync(__dirname + '/../../../site/js/gradina-data.js', 'utf8').split('export const GRADINA')[0].matchAll(/\{ cod: '([A-Z0-9]+)'/g)].map(m => m[1]);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const v of V) {
    const pl = v.k.split('#'), name = pl[1] ? 'pl_' + pl[0].toLowerCase() + '_' + pl[1] : 'gr_' + v.k.toLowerCase() + (v.pv ? '_p' : ''), u = U[v.k + v.pv]; if (!u) continue; const r = u.r, open = pl[1] ? '&open=' + COD.indexOf(pl[0]) + ':' + pl[1] : '', a = (r[1] - r[0]) / (r[3] - r[2]);
    const W = a >= 1 ? 2752 : Math.round(2560 * a / 2) * 2, H = Math.round(W / a);
    meta[name] = { r, ratio: u.ratio, w: W, h: H }; if (only.length && !only.includes(name)) continue;
    const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 }); p.on('pageerror', e => console.log('ERR ' + e.message));
    await p.goto(`http://localhost:8765/_t_flat.html?tx=${v.tx}&ty=${v.ty}&tz=${v.tz}&az=${v.az}&el=${v.el}&dist=${v.dist}&x0=${r[0]}&x1=${r[1]}&y0=${r[2]}&y1=${r[3]}&w=${W}&t=${ORA}${open}`, { waitUntil: 'load' });
    await p.waitForFunction(() => window.__ready === true, null, { timeout: 240000 });
    await p.waitForTimeout(600); await p.screenshot({ path: `${__dirname}/${name}${SUF}_src.jpg`, type: 'jpeg', quality: 93, timeout: 120000 }); console.log('ok', name, W, H, u.ratio); await p.close();
  }
  fs.writeFileSync(__dirname + '/cadre.json', JSON.stringify(meta, null, 1)); await b.close();
})();
