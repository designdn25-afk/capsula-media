// Povestea 3D de la deschidere (#top): derularea paginii mișcă ora zilei, camera și capitolele de text.
// Marcajul și stilurile sunt în surse/final/parts/story.html. Modelul: js/x7.js; scena: js/stage.js.
import { THREE, clamp, lerp, webglOK, clock } from './kit.js';
import { createStage, orbit } from './stage.js';

const sec = document.getElementById('top');
if (sec && sec.classList.contains('st')) boot();

function boot() {
  const $ = s => sec.querySelector(s), pin = $('.st-pin'), canvas = $('.st-gl'), chs = [...sec.querySelectorAll('.st-ch')],
    clk = $('.st-clock'), clkT = $('#stClock'), dayEl = $('.st-day'), rail = [...sec.querySelectorAll('.st-rail li')], labBox = $('.st-labels');
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  let live = false;
  const toStatic = () => {
    live = false; sec.classList.remove('st--live', 'st--dark', 'st--film', 'st--ai'); sec.classList.add('st--static');
    sec.querySelectorAll('.st-still[data-src]').forEach(im => { im.src = im.dataset.src; im.removeAttribute('data-src'); });
    window.__skyDark = false; if (window.navU) window.navU();
  };
  if (rm.matches || !webglOK()) { toStatic(); return; }
  let S; try { S = createStage(canvas, { shadowSize: Math.min(innerWidth, innerHeight) < 700 ? 1024 : 2048 }); } catch (e) { toStatic(); return; }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); toStatic(); });
  if (rm.addEventListener) rm.addEventListener('change', () => { if (rm.matches) toStatic(); });

  /* capitolele: [început, sfârșit] din derulare (0…1) */
  const CH = [[0, .12], [.12, .29], [.29, .47], [.47, .63], [.63, .80], [.80, 1.01]];
  /* cheile camerei, pe ecran lat (L) și pe ecran înalt (P): az/el = unghiuri, fw/fh = cât trebuie să încapă (metri),
     tx/ty = ținta, ox/oy = cât se mută modelul pe ecran (fracțiuni din lățime/înălțime) */
  const KEYS = [
    { p: [0, .07], t: 6.9, L: { az: -30, el: 12, fw: 27, fh: 11, tx: 0, ty: 1.7, ox: .235, oy: 0 }, P: { az: -66, el: 9, fw: 8.4, fh: 9, tx: -1.5, ty: 1.7, ox: 0, oy: -.13 } },
    { p: [.16, .25], t: 9.2, L: { az: -76, el: 6, fw: 13, fh: 7.5, tx: -3.2, ty: 1.8, ox: .22, oy: 0 }, P: { az: -86, el: 5, fw: 5.4, fh: 8, tx: -4.6, ty: 1.8, ox: 0, oy: -.13 } },
    { p: [.33, .43], t: 12.5, roof: 1, L: { az: -12, el: 58, fw: 22, fh: 13, tx: 0, ty: 1, ox: .17, oy: 0 }, P: { az: -90, el: 74, fw: 7.4, fh: 17, tx: 0, ty: 1, ox: 0, oy: -.09 } },
    { p: [.51, .59], t: 17.6, L: { az: 30, el: 8, fw: 23, fh: 9, tx: .5, ty: 1.7, ox: .21, oy: 0 }, P: { az: 64, el: 8, fw: 9.5, fh: 9, tx: 1.5, ty: 1.7, ox: 0, oy: -.13 } },
    { p: [.67, .76], t: 21.2, L: { az: -27, el: 5.5, fw: 23, fh: 9, tx: -.5, ty: 1.8, ox: .235, oy: 0 }, P: { az: -62, el: 5, fw: 9, fh: 9, tx: -1.6, ty: 1.8, ox: 0, oy: -.13 } },
    { p: [.86, 1], t: 21.2, bp: 1, ex: 1, L: { az: -38, el: 13, fw: 27, fh: 21, tx: 0, ty: 5.3, ox: .1, oy: 0 }, P: { az: -58, el: 11, fw: 10.5, fh: 19, tx: 0, ty: 5.3, ox: 0, oy: -.08 } },
  ];
  // Camera trece prin mijlocul fiecărui capitol și nu se oprește niciodată de tot între ele: mișcarea curge odată cu derularea
  // (înainte stătea pe loc în fiecare capitol și sărea repede la următorul, ceea ce părea sacadat).
  const PTS = KEYS.map((k, i) => [i === 0 ? .03 : i === KEYS.length - 1 ? .9 : (k.p[0] + k.p[1]) / 2, k]);
  const CAM = ['az', 'el', 'fw', 'fh', 'tx', 'ty', 'ox', 'oy'], cur = {}, a = {}, b = {};
  const pick = (k, m, out) => { CAM.forEach(n => { out[n] = lerp(k.L[n], k.P[n], m); }); out.t = k.t; out.roof = k.roof || 0; out.bp = k.bp || 0; out.ex = k.ex || 0; return out; };
  function sample(p, m) {
    let i = 0; while (i < PTS.length - 2 && p > PTS[i + 1][0]) i++;
    const p0 = PTS[i][0], p1 = PTS[i + 1][0], f = p1 > p0 ? clamp((p - p0) / (p1 - p0)) : 0, g = .3 * f + .7 * f * f * f * (f * (f * 6 - 15) + 10);
    pick(PTS[i][1], m, a); pick(PTS[i + 1][1], m, b);
    for (const n in a) cur[n] = lerp(a[n], b[n], g);
    return cur;
  }

  /* Filmarea reală a poveștii (ecran lat): cadrele unor filmări făcute pe același drum al camerei, în grădina din Ciorogârla,
     transformate în imagine reală (surse/ai360/CITESTE.md, partea a patra; cadrele le scrie surse/ai360/vederi/fixpoveste.py).
     Se arată cadru cu cadru, după derulare, în locul machetei 3D, până la seară; partea „desfăcută pe straturi” rămâne desenată.
     FILM.T = bucățile: [primul cadru, câte cadre, derularea primului cadru, pasul dintre cadre, se topește în bucata următoare?].
     Primele trei merg pe drumul camerei 3D (de aceea etichetele camerelor cad la locul lor); ultima (seara) are pasul ei.
     Ca derularea să fie lină: cadrele din jurul locului curent sunt despachetate din timp, în afara firului principal
     (ImageBitmap), iar pe ecran se trece doar prin cadre gata făcute (dacă netul nu ține pasul, imaginea vine din urmă lin). */
  const FILM = { dir: 'img/st/film/', on: true, dis: 14, end: .8, out: .07, dark: .47,
    T: [[0, 96, .03, .175 * 2 / 191, 1], [96, 96, .205, .175 * 2 / 191, 1], [192, 36, .38, .17 * 2 / 191, 0], [228, 157, .38 + .17 * 72 / 191, (.78 - (.38 + .17 * 72 / 191)) / 156, 0]],
    // ora arătată pe ecran cât se vede filmarea (între prânz și seară imaginea se topește dintr-una în alta, deci și ceasul trece repede)
    time: [[.03, 6.9], [.205, 9.2], [.38, 12.5], [.444, 14.2], [.5, 17.6], [.78, 21.2]] };
  const fcv = $('.st-film'), fveil = $('.st-fveil'), hasBitmap = typeof createImageBitmap === 'function', fineP = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const FW = fineP ? { load: 90, fwd: 22, back: 9, keep: 28 } : { load: 44, fwd: 12, back: 5, keep: 16 };   // cât se cere / se pregătește în jurul locului curent (mai puțin pe telefoane și tablete)
  const film = { state: FILM.on && fcv ? 'wait' : 'off', P: [], trk: [], im: [], bm: [], busy: null, nb: 0, cnt: 0, gc: 0, want: 0, dir: 1, pos: -1, a: -1, b: -1, t: -1, sw: -1, ww: 0, w: 0, h: 0, next: null };
  if (film.state !== 'off') {
    FILM.T.forEach((t, ti) => { for (let j = 0; j < t[1]; j++) { film.P[t[0] + j] = t[2] + t[3] * j; film.trk[t[0] + j] = ti; } });
    const N = film.P.length; film.im = new Array(N).fill(null); film.bm = new Array(N).fill(null); film.busy = new Uint8Array(N);
    const req = new Uint8Array(N), err = new Uint8Array(N); let act = 0;
    // se cere mereu cadrul cel mai apropiat de locul derulării care nu a fost cerut încă (în direcția de mers, de două ori mai multe),
    // dar numai din jurul locului curent: restul se cer pe măsură ce vizitatorul derulează
    const pickNext = () => { for (let d = 0; d <= FW.load; d++) { const a = film.want + film.dir * d; if (a >= 0 && a < N && !req[a]) return a; if (!(d & 1)) { const b = film.want - film.dir * (d >> 1); if (b >= 0 && b < N && !req[b]) return b; } } return -1; };
    const next = () => { while (act < 8) { const i = pickNext(); if (i < 0) return; req[i] = 1; act++; const im = new Image(); im.decoding = 'async';
      im.onload = () => { act--; film.im[i] = im; if (!hasBitmap) film.bm[i] = im; kick(); next(); };
      im.onerror = () => { act--; if (++err[i] < 3) setTimeout(() => { req[i] = 0; next(); }, 900 * err[i]); else { const j = [1, -1, 2, -2].map(d => i + d).find(k => film.im[k]); if (j !== undefined) { film.im[i] = film.im[j]; if (!hasBitmap) film.bm[i] = film.im[j]; } } next(); };
      im.src = FILM.dir + 'f_' + String(i).padStart(4, '0') + '.webp'; } };
    film.next = next; next(); setTimeout(() => { if (film.state === 'wait') { film.state = 'off'; kick(); } }, 9000);
  }
  // despachetează un cadru în afara firului principal (pe telefoane și tablete, la o mărime mai mică, să țină mai puțină memorie)
  function bitmapOf(i) {
    const im = film.im[i]; if (!im || film.bm[i] || film.busy[i]) return; film.busy[i] = 1; film.nb++;
    const ok = b => { film.nb--; film.busy[i] = 0; film.bm[i] = b; film.cnt++; kick(); }, plain = () => createImageBitmap(im).then(ok, () => { film.nb--; film.busy[i] = 0; film.bm[i] = im; kick(); });
    if (!fineP && im.width > 960) { let p; try { p = createImageBitmap(im, { resizeWidth: 960, resizeHeight: Math.round(im.height * 960 / im.width), resizeQuality: 'medium' }); } catch (_) { p = null; } if (p) { p.then(ok, plain); return; } }
    plain();
  }
  // pregătește din timp cadrele din jurul locului c și le eliberează pe cele rămase departe
  function feedFilm(c) {
    const N = film.P.length; film.want = Math.max(0, Math.min(N - 1, Math.round(c))); if (film.next) film.next();
    if (!hasBitmap) return;
    for (let d = 0; d <= FW.fwd && film.nb < 5; d++) for (let k = 0; k < 2 && film.nb < 5; k++) { if (k && (!d || d > FW.back)) continue; bitmapOf(film.want + (k ? -d : d) * film.dir); }
    if (++film.gc >= 20 || film.cnt > FW.keep * 2 + 6) { film.gc = 0; for (let i = 0; i < N; i++) { const b = film.bm[i]; if (!b || !b.close || i === film.a || i === film.b || i === film.sw) continue; if (Math.abs(i - film.want) > FW.keep) { b.close(); film.bm[i] = null; film.cnt--; } } }
  }
  const filmHas = i => i >= 0 && i < film.P.length && !!film.bm[i];
  const filmTime = p => { const T = FILM.time; let i = 0; while (i < T.length - 2 && p > T[i + 1][0]) i++; return lerp(T[i][1], T[i + 1][1], clamp((p - T[i][0]) / (T[i + 1][0] - T[i][0]))); };
  // cadrul (și vecinul lui) pentru derularea p; desenează doar când se schimbă ceva. Întoarce false cât timp nu are ce arăta.
  function drawFilm(p, W, H, x0, y0, iw, ih) {
    const P = film.P, N = P.length; let lo = 0, hi = N - 1; if (p <= P[0]) hi = 0; else if (p >= P[N - 1]) lo = N - 1; else while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m] <= p) lo = m; else hi = m; }
    if (hi < lo) hi = lo; const tf = lo + (hi > lo ? (p - P[lo]) / (P[hi] - P[lo]) : 0);   // locul dorit, în cadre (cu zecimale)
    if (film.pos >= 0 && Math.abs(tf - film.pos) > .01) film.dir = tf > film.pos ? 1 : -1;
    if (film.pos < 0 || Math.abs(tf - film.pos) > 40) {   // la pornire sau după un salt mare al derulării: direct la locul nou, când cadrele lui sunt gata
      feedFilm(tf); if (filmHas(Math.floor(tf)) && filmHas(Math.ceil(tf))) film.pos = tf; else if (film.pos < 0) return false;
    } else {   // altfel doar prin cadre gata făcute, unul după altul
      let q = film.pos; if (tf > q) { let R = Math.ceil(q); const E = Math.ceil(tf); while (R < E && filmHas(R + 1)) R++; q = Math.min(tf, R); } else if (tf < q) { let L = Math.floor(q); const E = Math.floor(tf); while (L > E && filmHas(L - 1)) L--; q = Math.max(tf, L); }
      film.pos = q; feedFilm(q);
    }
    const fl = Math.floor(film.pos); let a = fl, t = film.pos - fl; if (t > .98) { a = fl + 1; t = 0; } else if (t < .02) t = 0; const b = t ? a + 1 : a; t = Math.round(t * 50) / 50;
    if (!filmHas(a) || !filmHas(b)) return film.a >= 0;
    // la granița dintre două bucăți filmate în lumini diferite, sfârșitul bucății se topește în primul cadru al următoarei
    const tr = FILM.T[film.trk[a]], nx = tr[0] + tr[1], jf = a - tr[0] + t; let sw = -1, w = 0;
    if (tr[4] && nx < N && jf > tr[1] - 1 - FILM.dis) { if (hasBitmap) bitmapOf(nx); if (film.bm[nx]) { sw = nx; w = Math.round(clamp((jf - (tr[1] - 1 - FILM.dis)) / FILM.dis) * 50) / 50; } }
    const dpr = Math.min(1.5, devicePixelRatio || 1), cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    if (a === film.a && b === film.b && t === film.t && w === film.ww && cw === film.w && ch === film.h) return true;
    if (fcv.width !== cw || fcv.height !== ch) { fcv.width = cw; fcv.height = ch; }
    const g = fcv.getContext('2d'), X = x0 * dpr, Y = y0 * dpr, IW = iw * dpr, IH = ih * dpr; g.globalAlpha = 1; g.drawImage(film.bm[a], X, Y, IW, IH);
    if (b !== a && t) { g.globalAlpha = t; g.drawImage(film.bm[b], X, Y, IW, IH); }
    if (w > .01) { g.globalAlpha = w; g.drawImage(film.bm[sw], X, Y, IW, IH); }
    film.a = a; film.b = b; film.t = t; film.sw = sw; film.ww = w; film.w = cw; film.h = ch;
    if (film.state === 'wait') { film.state = 'on'; if (fcv.animate) fcv.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: 'ease-out' }); }   // prima apariție: lin
    return true;
  }

  /* etichete așezate pe model */
  const mk = (cls, html) => { const e = document.createElement('div'); e.className = 'st-lab ' + cls; e.innerHTML = html; labBox.appendChild(e); return e; };
  const ROOMS = [['Living', 4.3, 1.0, .35], ['Bucătărie', 1.6, 1.7, -1.15], ['Baie', -.4, 2.0, -.7], ['Dormitor', -3.9, 1.0, 0]].map(r => ({ el: mk('room', r[0]), v: new THREE.Vector3(r[1], r[2], r[3]) }));
  const LAYERS = [['roof', 'Acoperiș', 'izolație 15 cm', 3.35], ['walls', 'Panouri din aluminiu', 'tratament fluorocarbon · izolație 10 cm', 1.8], ['glazing', 'Geam triplu LOW-E', 'vitraj panoramic', 1.8], ['frame', 'Structură din oțel galvanizat', 'pe șasiu rigid', 1.8], ['chassis', 'Pardoseală', 'izolație 15 cm', .3]]
    .map(l => ({ el: mk('layer', `<b>${l[1]}</b><span>${l[2]}</span>`), part: l[0], y: l[3] }));
  const v = new THREE.Vector3();
  const place = (o, x, y, z, op, W, H) => { const s = op.toFixed(2); if (s !== o.op) { o.op = s; o.el.style.opacity = s; } if (op > .01) { v.set(x, y, z).project(S.camera); o.el.style.transform = `translate(${((v.x * .5 + .5) * W).toFixed(1)}px,${((-v.y * .5 + .5) * H).toFixed(1)}px)`; } };

  /* stare */
  let ps = -1, visible = true, raf = 0, mx = 0, my = 0, tmx = 0, tmy = 0, lastCh = -1, lastDark = null, lastClock = '', W = 0, H = 0, t0 = performance.now(),
    last = 0, px = 3.6e6, slow = 0, fr = 0, shT = -9, shR = -9, shE = -9, shB = -9, bgA = '', bgB = '', dayV = '', clkO = '', moved = null;
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  pin.addEventListener('pointermove', e => { if (!fine.matches) return; tmx = (e.clientX / innerWidth - .5) * 2; tmy = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
  pin.addEventListener('pointerleave', () => { tmx = tmy = 0; });

  function progress() { const r = sec.getBoundingClientRect(), tot = Math.max(1, sec.offsetHeight - innerHeight); return clamp(-r.top / tot); }
  function frame(now) {
    raf = 0; if (!live || !visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; fr++;
    // dacă placa video nu ține pasul (cadre rare mai mult timp), desenul se face la o rezoluție ceva mai mică
    if (dt > .045) { if (++slow > 45 && px > 1.3e6) { px *= .72; slow = 0; } } else if (slow > 0) slow--;
    if (S.fit(pin, innerWidth < 800 ? 1.75 : 2, px) || !W) { W = pin.clientWidth; H = pin.clientHeight; }
    // derularea e urmărită lin (la fel de lin la orice număr de cadre pe secundă), ca rotița mouse-ului să nu dea mișcări în trepte
    const p = progress(); ps = ps < 0 ? p : ps + (p - ps) * (1 - Math.exp(-dt * 3.6)); if (Math.abs(p - ps) < .0003) ps = p;
    // filmarea reală se arată pe ecranele late; pe cele înalte (telefon, panou îngust) rămâne macheta 3D, cu drumul ei de cameră
    const asp = W / H, real = film.state !== 'off' && asp >= 1.5 && W >= 900;
    const fk = real ? 1 - clamp((ps - FILM.end) / FILM.out) : 0;   // cât se vede filmarea (1 = doar ea)
    const fcam = real && fk >= 1;   // cât se vede doar filmarea, camera 3D e chiar camera filmării (ca etichetele să cadă la locul lor)
    const m = fcam ? 0 : clamp((1.25 - asp) / .5), c = sample(ps, m);
    mx += (tmx - mx) * .05; my += (tmy - my) * .05;
    const idle = (now - t0) / 1000, fov = lerp(30, 42, m), tn = Math.tan(fov * Math.PI / 360);
    const dist = Math.max((c.fh / 2) / tn, (c.fw / 2) / (tn * (fcam ? 16 / 9 : asp)));
    S.camera.fov = fov;
    if (real) {   // filmarea umple ecranul (ca o imagine „cover”, ținută spre dreapta, unde e capsula)
      const sc = Math.max(W / 16, H / 9), iw = 16 * sc, ih = 9 * sc, x0 = (W - iw) * .62, y0 = (H - ih) * .5;
      if (fk > 0) drawFilm(ps, W, H, x0, y0, iw, ih);
      if (fcam) S.camera.setViewOffset(iw, ih, -x0 - c.ox * iw, -y0 - c.oy * ih, W, H);
    }
    if (!fcam) S.camera.setViewOffset(W, H, -c.ox * W, -c.oy * H, W, H);
    if (real !== film.cls) { film.cls = real; sec.classList.toggle('st--film', real); }

    const fo = fk.toFixed(2), fs = fo + film.state + real; if (fs !== film.op) { film.op = fs; const on = real && film.state === 'on'; if (fcv) fcv.style.opacity = on ? fo : '0'; if (fveil) fveil.style.opacity = on ? fo : '0'; canvas.style.opacity = real ? (1 - fk).toFixed(2) : ''; }
    const shown = real && film.state === 'on' && fk > .5;   // pe ecran e (mai ales) filmarea
    if (shown !== !!film.ai) { film.ai = shown; sec.classList.toggle('st--ai', shown); }   // mențiunea „Vizualizare realizată cu AI”
    const fr3 = 1 - fk; orbit(S.camera, { az: c.az + (Math.sin(idle * .22) * 1.1 + mx * 2.4) * fr3 + c.bp * Math.sin(idle * .16) * 10, el: clamp(c.el - my * 1.3 * fr3, 2, 88), dist, tx: c.tx, ty: c.ty, tz: 0 });
    const d = S.setTime(c.t); S.x7.openRoof(c.roof); S.setBlueprint(c.bp); S.x7.explode(c.ex);
    // umbra: doar când s-a mutat soarele sau s-a mișcat capsula, și cel mult o dată la două cadre
    if ((fr & 1) && (Math.abs(c.t - shT) > .03 || Math.abs(c.roof - shR) > .01 || Math.abs(c.ex - shE) > .004 || Math.abs(c.bp - shB) > .02)) { shT = c.t; shR = c.roof; shE = c.ex; shB = c.bp; S.shadow(); }
    if (fk < 1) S.render(); else { S.camera.updateMatrixWorld(); S.camera.matrixWorldInverse.copy(S.camera.matrixWorld).invert(); }   // (etichetele se așază corect și când macheta nu se desenează)
    // fundalul paginii, culoarea textului, bara de sus
    const ca = d.top.getHexString(), cb = d.bot.getHexString(); if (ca !== bgA) { bgA = ca; pin.style.setProperty('--st-top', '#' + ca); } if (cb !== bgB) { bgB = cb; pin.style.setProperty('--st-bot', '#' + cb); }
    const dark = shown ? ps > FILM.dark : d.n > .5; if (dark !== lastDark) { lastDark = dark; sec.classList.toggle('st--dark', dark); window.__skyDark = dark; if (window.navU) window.navU(); }
    const tc = shown ? filmTime(ps) : c.t, ck = clock(tc); if (ck !== lastClock) { lastClock = ck; clkT.textContent = ck; }
    const dv = clamp((tc - 6.5) / 14.7).toFixed(3), co = (1 - c.bp).toFixed(2); if (dv !== dayV) { dayV = dv; dayEl.style.setProperty('--day', dv); } if (co !== clkO) { clkO = co; clk.style.opacity = co; }
    // capitolul activ
    let ci = 0; for (let i = 0; i < CH.length; i++) if (ps >= CH[i][0]) ci = i;
    if (ci !== lastCh) { lastCh = ci; chs.forEach((e, i) => e.classList.toggle('on', i === ci)); rail.forEach((e, i) => e.classList.toggle('on', i === ci)); }
    const mv = ps > .012; if (mv !== moved) { moved = mv; sec.classList.toggle('st--moved', mv); }
    // etichetele
    const ro = clamp((c.roof - .75) / .25);
    ROOMS.forEach(o => place(o, o.v.x, o.v.y, o.v.z, ro, W, H));
    const lo = clamp((c.ex - .8) / .2) * c.bp;
    LAYERS.forEach(o => place(o, 6.3, S.x7.OFF[o.part] * c.ex + o.y, 0, lo, W, H));
  }
  const kick = () => { if (!raf && live && visible && !document.hidden) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; kick(); }).observe(sec);
  document.addEventListener('visibilitychange', kick);
  addEventListener('resize', () => { W = 0; kick(); });
  live = true; sec.classList.add('st--live'); window.__skyDark = false; if (window.navU) window.navU();
  kick();
  window.__story = { stage: S, get p() { return ps; } };
}
