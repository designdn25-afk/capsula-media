// node cap360.js out.jpg W "x=..&y=..&z=..[&t=..]"  -> imagine 360° a machetei din punctul dat
const { chromium } = require('playwright');
(async () => {
  const [, , out, W, qs] = process.argv;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +W, height: +W / 2 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('ERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') console.log('err ' + m.text().slice(0, 200)); });
  await p.goto('http://localhost:8765/_t_pano.html?w=' + W + '&' + qs, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 240000 });
  await p.waitForTimeout(800); await p.screenshot({ path: out, type: 'jpeg', quality: 92, timeout: 120000 }); console.log('ok', out); await b.close();
})();
