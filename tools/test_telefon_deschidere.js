// Deschiderea pe telefon, cu legătură de mobil: derulează povestea ca un deget (cu viteză constantă) și notează, la fiecare cadru
// desenat, ce cadru al filmării e pe ecran: cât rămâne în urma derulării, câte salturi face, cât timp se văd cadre mici.
//   node tools/test_telefon_deschidere.js [Mbps=6] [cadre de film pe secundă=40] [încetinire procesor=1] [pagina=home.html]
// Cu serverul local pornit (cd site && python3 -m http.server 8765). Din mediu: PORT, DEV (un telefon cunoscut de Playwright,
// implicit „Pixel 7”), WAIT (ms înainte de derulare), SHOTS=1 (capturi în screenshots/), TRACE=n (un rând din n).
// Vezi docs/DETALII-TEHNICE.md, §23 (ce înseamnă cifrele și de ce timpii de afișare nu se pot judeca pe calculatorul de probă).
const { chromium, devices } = require('playwright');
const MB = +(process.argv[2] || 6), FPS = +(process.argv[3] || 40), CPU = +(process.argv[4] || 1), PAGE = process.argv[5] || 'home.html', DEV = process.env.DEV || 'Pixel 7';
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...devices[DEV] }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('ERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('C ' + m.text().slice(0, 160)); }); p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url().slice(-50)); });
  let bytes = 0, reqs = 0; const kinds = {};
  p.on('response', async r => { try { const u = r.url(); const n = +(r.headers()['content-length'] || 0); bytes += n; reqs++; const k = /film\/t\/p_/.test(u) ? 'pachete' : /film\/t\/f_/.test(u) ? 'cadre tel' : /film\/f_/.test(u) ? 'cadre întregi' : /film\/v\//.test(u) ? 'film comprimat' : 'altele'; kinds[k] = (kinds[k] || 0) + n; } catch (_) {} });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: MB * 1e6 / 8, uploadThroughput: 1e6 / 8, latency: 80 });
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await p.addInitScript(() => { window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({ entryTypes: ['longtask'] }); } catch (_) {} });
  const t0 = Date.now();
  await p.goto('http://localhost:' + (process.env.PORT || 8765) + '/' + PAGE, { waitUntil: 'commit' });
  await p.waitForFunction(() => window.__story && window.__story.film && window.__story.film.state === 'on', null, { timeout: 90000 }).catch(() => errs.push('filmarea nu a pornit'));
  const tOn = Date.now() - t0;
  await p.waitForTimeout(+(process.env.WAIT || 1500));
  const f0 = await p.evaluate(() => window.__story.film); const lt0 = await p.evaluate(() => window.__lt.length);
  if (process.env.SHOTS) await p.screenshot({ path: 'screenshots/tel-deschidere-inceput.jpg', type: 'jpeg', quality: 80 });
  // derulare ca un deget: continuă, cu viteza dată în cadre de film pe secundă; în pagină se notează la fiecare cadru desenat ce e pe ecran
  const info = await p.evaluate(() => { const s = document.getElementById('top'), pin = s.querySelector('.st-pin'); return { tot: s.offsetHeight - pin.offsetHeight, H: innerHeight, W: innerWidth }; });
  const pxps = FPS / 648 * .75 * info.tot;   // 648 de cadre pe 75% din derulare
  const res = await p.evaluate(async ({ pxps, end, shots }) => {
    const out = []; const t0 = performance.now(); let last = t0;
    await new Promise(done => { const step = now => { const y = (now - t0) / 1000 * pxps; window.scrollTo({ top: Math.min(y, end), behavior: 'instant' }); const f = window.__story.film;
      out.push([Math.round(now - t0), +f.pos.toFixed(1), f.a, f.w, f.tier, Math.round(now - last)]); last = now; if (y >= end) done(); else requestAnimationFrame(step); }; requestAnimationFrame(step); });
    return out;
  }, { pxps, end: info.tot * .79 });
  await p.waitForTimeout(1200);
  const f1 = await p.evaluate(() => ({ film: window.__story.film, lt: window.__lt }));
  // rezumat: cât de departe e cadrul arătat de locul derulării, cât timp s-au văzut cadre mici, salturi
  let lag = 0, lagMax = 0, low = 0, jumps = 0, big = 0, prevA = -1, slowFr = 0; const ws = {};
  for (const [t, pos, a, w, tier, dt] of res) { const d = Math.abs(a - pos); lag += d; lagMax = Math.max(lagMax, d); ws[w] = (ws[w] || 0) + 1; if (prevA >= 0 && Math.abs(a - prevA) > 6) jumps++; prevA = a; if (dt > 34) slowFr++; }
  const wmax = Math.max(...Object.keys(ws).map(Number)); low = res.filter(r => r[3] < wmax).length;
  console.log(JSON.stringify({ dev: DEV, Mbps: MB, cadre_pe_sec: FPS, cpu: CPU, prima_imagine_ms: tOn, la_pornire: { a: f0.a, w: f0.w, set: f0.set, lo: f0.lo, im: f0.im }, cadre_desenate: res.length, durata_s: +(res[res.length - 1][0] / 1000).toFixed(1),
    decalaj_mediu: +(lag / res.length).toFixed(2), decalaj_max: +lagMax.toFixed(1), salturi_peste_6: jumps, cadre_mici_pct: +(low / res.length * 100).toFixed(1), latimi: ws, cadre_lente_pct: +(slowFr / res.length * 100).toFixed(1),
    sarcini_lungi: f1.lt.length - lt0, la_sfarsit: { a: f1.film.a, w: f1.film.w, tier: f1.film.tier, n: f1.film.n, nl: f1.film.nl, lo: f1.film.lo, im: f1.film.im }, MB_total: +(bytes / 1e6).toFixed(1), pe_feluri_MB: Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, +(v / 1e6).toFixed(2)])) }));
  if (process.env.SHOTS) await p.screenshot({ path: 'screenshots/tel-deschidere-seara.jpg', type: 'jpeg', quality: 80 });
  { const o = []; for (let t = 0; t < res[res.length - 1][0]; t += 500) { const r = res.filter(x => x[0] >= t && x[0] < t + 500); if (r.length) o.push(Math.round(r.filter(x => x[3] < wmax).length / r.length * 100)); } console.log('pe_jumatati de secundă, % cadre mici: ' + o.join(' ')); }
  if (process.env.TRACE) console.log(res.filter((r, i) => i % +process.env.TRACE === 0).map(r => r.join(',')).join(' | '));
  console.log([...new Set(errs)].slice(0, 6).join('\n') || 'fara erori'); await b.close();
})();
