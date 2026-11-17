// Rotirea unei case pe telefon, cu legătură de mobil: casa e trasă înainte și înapoi imediat ce i-a apărut poza (înainte să se
// fi adus cadrele) și se notează, la fiecare cadru desenat, ce cadru al rotirii e pe ecran și cât de mare e.
//   node tools/test_telefon_rotire.js [Mbps=6] [casa=C20] [px pe secundă=350]
// Cu serverul local pornit (cd site && python3 -m http.server 8765). Din mediu: PORT, PAGE, VW / VH (mărimea ecranului; implicit
// 360×664, unde casele se văd din locul „lat” și se pot roti), DUR (ms de tras), LEAD (ms de așteptat după poză), WAIT, TRACE=n.
// Tragerea se face cu evenimente de atingere trimise chiar din pagină, după ceas. Vezi docs/DETALII-TEHNICE.md, §23.
const { chromium, devices } = require('playwright');
const MB = +(process.argv[2] || 6), COD = process.argv[3] || 'C20', V = +(process.argv[4] || 350), PORT = process.env.PORT || 8765, PAGE = process.env.PAGE || 'home.html';
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...devices['Pixel 7'], viewport: { width: +(process.env.VW || 360), height: +(process.env.VH || 664) } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('ERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('C ' + m.text().slice(0, 160)); });
  const kinds = {}; p.on('response', r => { try { const u = r.url(), n = +(r.headers()['content-length'] || 0); const k = /rot\/\w+\/s_/.test(u) ? 'cadre 1024' : /rot\/\w+\/l_/.test(u) ? 'cadre mari' : /p\.bin/.test(u) ? 'pachet' : 'altele'; kinds[k] = (kinds[k] || 0) + n; } catch (_) {} });
  const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: MB * 1e6 / 8, uploadThroughput: 1e6 / 8, latency: 80 });
  await p.goto('http://localhost:' + PORT + '/' + PAGE, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const s = document.querySelector('#gradina .gd-stage'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - 70, behavior: 'instant' }); });
  await p.waitForFunction(() => document.getElementById('gradina').classList.contains('gd--live'), null, { timeout: 120000 });
  await p.waitForTimeout(+(process.env.WAIT || 9000));   // (cele aduse „din timp” apucă să vină: ca la un vizitator care se uită întâi la grădină)
  for (const k in kinds) kinds[k] = 0;
  const t0 = Date.now();
  await p.evaluate(cod => { const G = window.__gradina, i = G.H.findIndex(h => h.c.cod === cod); document.querySelector('#gradina .gd-chip[data-i="' + i + '"]').click(); }, COD);
  await p.waitForFunction(() => { const s = window.__gradina.state; return s.img && s.pOp > .5; }, null, { timeout: 30000 }).catch(() => errs.push('poza casei nu a venit'));
  const tImg = Date.now() - t0; await p.waitForTimeout(+(process.env.LEAD || 300));
  // tragerea se face chiar în pagină, cu evenimente de atingere socotite după ceas (nu depinde de cât de repede răspunde navigatorul de probă)
  const DUR = +(process.env.DUR || 6000);
  await p.evaluate(({ V, DUR }) => new Promise(done => {
    const cv = document.querySelector('#gradina .gd-gl'), r = cv.getBoundingClientRect(), y = r.top + 140, xa = r.left + r.width * .14, xb = r.left + r.width * .86;
    const ev = (t, x) => cv.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0, buttons: t === 'pointerup' ? 0 : 1 }));
    window.__tr = []; const t0 = performance.now(); let last = t0, x = xb, dir = -1, n = 0, down = true, pause = 0; ev('pointerdown', x);
    const f = now => { const s = window.__gradina.state.spin, dt = Math.min(100, now - last);
      window.__tr.push([Math.round(now - t0), s.on ? 1 : 0, +s.pos.toFixed(1), s.cur, s.w, s.tier === undefined ? -1 : s.tier, s.big ? 1 : 0, Math.round(now - last), s.n, s.pk === undefined ? -1 : s.pk, s.nl === undefined ? -1 : s.nl]); last = now;
      if (now - t0 < DUR) { if (down) { x += dir * V * dt / 1000; if (x < xa || x > xb) { x = Math.max(xa, Math.min(xb, x)); ev('pointermove', x); ev('pointerup', x); down = false; pause = now + 120; if (++n % 3 === 0) dir = -dir; } else ev('pointermove', x); }
        else if (now >= pause) { x = dir < 0 ? xb : xa; ev('pointerdown', x); down = true; } }
      else if (down) { ev('pointermove', x + dir * 12); ev('pointerup', x + dir * 12); down = false; window.__tStop = performance.now(); }
      else if (!window.__tStop) window.__tStop = performance.now();
      if (window.__trStop) return; if (now - t0 > DUR && !window.__resolved) { window.__resolved = 1; done(); } requestAnimationFrame(f); };
    requestAnimationFrame(f); }), { V, DUR });
  const tStop = Date.now(); let sharpMs = -1, bigMs = -1;
  for (;;) { const s = await p.evaluate(() => window.__gradina.state.spin); if (sharpMs < 0 && s.w >= 1024) sharpMs = Date.now() - tStop; if (s.big) { bigMs = Date.now() - tStop; break; } if (Date.now() - tStop > 12000) break; await p.waitForTimeout(40); }
  await p.evaluate(() => { window.__trStop = 1; }); const tr = await p.evaluate(() => window.__tr), end = await p.evaluate(() => window.__gradina.state.spin);
  const on = tr.filter(r => r[1] && r[0] < +(process.env.DUR || 6000) + 200); let lag = 0, lagMax = 0, jumps = 0, prev = null, sw = 0, pw = 0; const ws = {};
  for (const r of on) { const q = ((r[2] % 192) + 192) % 192, d = Math.min(Math.abs(r[3] - q), 192 - Math.abs(r[3] - q)); lag += d; lagMax = Math.max(lagMax, d); ws[r[4]] = (ws[r[4]] || 0) + 1; if (prev !== null) { const j = Math.min(Math.abs(r[3] - prev), 192 - Math.abs(r[3] - prev)); if (j > 5) jumps++; } prev = r[3]; if (pw && r[4] !== pw) sw++; pw = r[4]; }
  console.log(JSON.stringify({ casa: COD, Mbps: MB, px_pe_sec: V, poza_ms: tImg, porneste_dupa_ms: tr.find(r => r[1]) ? tr.find(r => r[1])[0] : -1, cadre_desenate: on.length, decalaj_mediu: +(lag / Math.max(1, on.length)).toFixed(2), decalaj_max: +lagMax.toFixed(1), salturi_peste_5: jumps, latimi: ws, treceri_clar_mic: sw,
    dupa_oprire: { clar_ms: sharpMs, cadru_mare_ms: bigMs }, la_sfarsit: { n: end.n, nb: end.nb, lo: end.lo, nl: end.nl, pk: end.pk, tier: end.tier, w: end.w, big: end.big }, MB: Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, +(v / 1e6).toFixed(2)])) }));
  if (process.env.TRACE) console.log(tr.filter((r, i) => i % +process.env.TRACE === 0).map(r => r.join(',')).join(' | '));
  if (process.env.SHOTS) await p.screenshot({ path: 'screenshots/tel-rotire.jpg', type: 'jpeg', quality: 80 });
  console.log([...new Set(errs)].slice(0, 6).join('\n') || 'fara erori'); await b.close();
})();
