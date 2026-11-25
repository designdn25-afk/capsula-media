const { chromium } = require('playwright'); const fs = require('fs');
const STOPS = JSON.parse(process.argv[2]), S = +(process.argv[3] || 1024);
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const p = await b.newPage({ viewport: { width: S, height: S } });
  p.on('pageerror', e => console.log('ERR', e.message)); await p.goto('http://localhost:8791/hall.html?s=' + S); await p.waitForFunction(() => window.ok, null, { timeout: 60000 });
  fs.writeFileSync('pos.json', JSON.stringify(await p.evaluate(() => window.POS)));
  if (process.argv[4] === 'p') { await p.evaluate(() => window.persp(0, 1.6, 1.5, 0, 1.4, 20)); await p.screenshot({ path: 'persp1.png' }); await p.evaluate(() => window.persp(0, 1.6, 33, 0, 2.2, 46)); await p.screenshot({ path: 'persp2.png' }); }
  else for (let i = 0; i < STOPS.length; i++) for (let f = 0; f < 6; f++) { await p.evaluate(([x, y, z, f]) => window.shot(x, y, z, f), [...STOPS[i], f]); await p.screenshot({ path: `c_${i}_${f}.png` }); }
  await b.close(); })();
