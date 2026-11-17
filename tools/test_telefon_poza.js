// Grădina pe telefon, cu legătură de mobil: alege o casă și spune după cât timp a sosit din rețea poza ei (și ce s-a mai adus
// în primele 6 secunde). LOG=1 arată fiecare cerere.
//   node tools/test_telefon_poza.js [Mbps=6] [casa=C20] [lățime=412] [înălțime=915]
// Cu serverul local pornit (cd site && python3 -m http.server 8765). Din mediu: PORT, PAGE, WAIT (ms de stat pe toată grădina).
// „pe_ecran_ms” nu spune nimic pe calculatorul de probă (desenează în procesor): vezi docs/DETALII-TEHNICE.md, §23.
const { chromium, devices } = require('playwright');
const MB = +(process.argv[2] || 6), COD = process.argv[3] || 'C20', VW = +(process.argv[4] || 412), VH = +(process.argv[5] || 915), PORT = process.env.PORT || 8765, PAGE = process.env.PAGE || 'home.html';
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...devices['Pixel 7'], viewport: { width: VW, height: VH } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('ERR ' + e.message));
  const T0 = Date.now(), st = new Map(), netlog = []; p.on('request', r => st.set(r, Date.now() - T0));
  p.on('requestfinished', async r => { try { const rs = await r.response(); netlog.push([st.get(r), Date.now() - T0, +(rs.headers()['content-length'] || 0), r.url().replace(/^.*localhost:\d+\//, '')]); } catch (_) {} });
  const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: MB * 1e6 / 8, uploadThroughput: 1e6 / 8, latency: 80 });
  await p.goto('http://localhost:' + PORT + '/' + PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const s = document.querySelector('#gradina .gd-stage'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - 70, behavior: 'instant' }); });
  await p.waitForFunction(() => document.getElementById('gradina').classList.contains('gd--live'), null, { timeout: 120000 });
  await p.waitForTimeout(+(process.env.WAIT || 2500));
  const tTap = Date.now() - T0;
  const r = await p.evaluate(async cod => { const G = window.__gradina, i = G.H.findIndex(h => h.c.cod === cod), out = [], t0 = performance.now(); let last = t0, img = -1, sh = -1;
    document.querySelector('#gradina .gd-chip[data-i="' + i + '"]').click();
    await new Promise(done => { const f = now => { const s = G.state; out.push([Math.round(now - t0), Math.round(now - last), s.pOp, s.spin.xf ? 1 : 0, s.img ? 1 : 0, s.tr]); last = now; if (img < 0 && s.img) img = Math.round(now - t0); if (sh < 0 && s.pOp >= .99 && !s.spin.xf) sh = Math.round(now - t0); if (sh >= 0 || now - t0 > 14000) done(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
    return { img, sh, n: out.length, dts: out.map(o => o[1]), tail: out.slice(-3), stage: [document.querySelector('#gradina .gd-stage').clientWidth, document.querySelector('#gradina .gd-stage').clientHeight], sp: G.state.spin.n !== undefined ? { n: G.state.spin.n, pend: G.state.spin.pend, pk: G.state.spin.pk } : null }; }, COD);
  const d = r.dts.slice().sort((a, b) => a - b);
  console.log(JSON.stringify({ casa: COD, ecran: [VW, VH], scena: r.stage, imagine_gata_ms: r.img, pe_ecran_ms: r.sh, cadre: r.n, dt_median: d[d.length >> 1], dt_max: d[d.length - 1], rotire: r.sp }));
  await p.waitForTimeout(1500);
  { const v = netlog.filter(d => d[1] >= tTap && /gd\/ai\/(m\/)?gr_/.test(d[3]) && new RegExp('gr_' + COD.toLowerCase()).test(d[3])).sort((a, b) => a[1] - b[1])[0];
    const tot = netlog.filter(d => d[1] >= tTap && d[0] <= tTap + 6000).reduce((a, d) => a + d[2], 0);
    console.log('rețea: poza casei a sosit la ' + (v ? v[1] - tTap : -1) + ' ms după apăsare (' + (v ? Math.round(v[2] / 1024) + ' KB, ' + v[3].slice(-22) : '?') + '); în primele 6 s după apăsare s-au adus ' + (tot / 1e6).toFixed(2) + ' MB');
    if (process.env.LOG) netlog.filter(d => d[1] >= tTap && d[0] <= tTap + 6000).sort((a, b) => a[0] - b[0]).forEach(d => console.log('  ' + String(d[0] - tTap).padStart(6) + ' → ' + String(d[1] - tTap).padStart(6) + '  ' + String(Math.round(d[2] / 1024)).padStart(5) + ' KB  ' + d[3].slice(-40))); }
  console.log(errs.join('\n') || 'fara erori'); await b.close();
})();
