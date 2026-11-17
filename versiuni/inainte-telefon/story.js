// Povestea 3D de la deschidere (#top): derularea paginii mișcă ora zilei, camera și capitolele de text.
// Marcajul și stilurile sunt în surse/final/parts/story.html. Modelul: js/x7.js; scena: js/stage.js.
import { THREE, clamp, lerp, smooth, webglOK, clock } from './kit.js';
import { createStage, orbit } from './stage.js';
import { openClip } from './clip.js';

const sec = document.getElementById('top');
if (sec && sec.classList.contains('st')) boot();

function boot() {
  const $ = s => sec.querySelector(s), pin = $('.st-pin'), canvas = $('.st-gl'), chs = [...sec.querySelectorAll('.st-ch')],
    clk = $('.st-clock'), clkT = $('#stClock'), dayEl = $('.st-day'), rail = [...sec.querySelectorAll('.st-rail li')], labBox = $('.st-labels');
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  let live = false, closeClip = null;
  const toStatic = () => {
    live = false; if (closeClip) closeClip(); sec.classList.remove('st--live', 'st--dark', 'st--film', 'st--fn', 'st--ai'); sec.classList.add('st--static');
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
  const FILM = { dir: 'img/st/film/', v: 1, on: true, dis: 28, end: .8, out: .07, dark: .47,   // v = versiunea filmului comprimat din img/st/film/v/ (0 = nu există)
    // bucățile filmării: [primul cadru, câte cadre, derularea primului cadru, pasul, se topește în bucata următoare]. Din 17 nov 2026
    // sunt toate cadrele filmărilor (648; înainte doar unul din două): la o treaptă a rotiței imaginea trece prin de două ori mai multe.
    T: [[0, 192, .03, .175 / 192, 1], [192, 192, .205, .175 / 192, 1], [384, 72, .38, .17 / 191, 0], [456, 192, .38 + .17 * 72 / 191, (.78 - (.38 + .17 * 72 / 191)) / 191, 0]],
    // ora arătată pe ecran cât se vede filmarea (între prânz și seară imaginea se topește dintr-una în alta, deci și ceasul trece repede)
    time: [[.03, 6.9], [.205, 9.2], [.38, 12.5], [.444, 14.2], [.5, 17.6], [.78, 21.2]],
    // pe ecranele înguste se vede doar o parte din lățimea cadrului: unde e mijlocul capsulei în cadru (0…1), de-a lungul poveștii
    cx: [[.03, .72], [.205, .725], [.38, .67], [.5, .73], [.78, .74]] };
  const fcv = $('.st-film'), fveil = $('.st-fveil'), hasBitmap = typeof createImageBitmap === 'function', fineP = matchMedia('(hover:hover) and (pointer:fine)').matches;
  /* Cum se arată filmarea (rescris pe 17 nov 2026, după „nu se mișcă lin deloc”):
     - imaginea urmărește mereu derularea; dacă exact cadrele de acolo nu sunt încă gata, se arată cele mai apropiate care sunt
       (înainte aștepta după ele și mișcarea se poticnea);
     - din toată filmarea se țin în memorie copii mici ale unui cadru din PK („schița”): se cer primele, de la rare la dese, deci
       orice loc al poveștii are repede ceva de arătat, oricât de iute se derulează;
     - cadrele mari se pregătesc în jurul locului spre care merge derularea (acolo unde se va opri imaginea), nu pe unde doar trece;
     - pe telefoane și tablete se cere doar un cadru din două (jumătate din date și din memorie). */
  /* A doua rescriere din 17 nov 2026 (clientul, cu filmuleț: „nu se mișcă destul de lin… își pierde din calitate când o miști”):
     - pe calculator, unde navigatorul poate, cadrele vin dintr-un film comprimat (clip.js; FILM.v): toate la 1920 px, desfăcute pe un
       fir separat. În mișcare se văd cadre mari, nu schița; se cere separat doar primul cadru (apare imediat, înaintea filmului);
     - pozele separate (telefoane, navigatoare fără WebCodecs) se aduc ca Blob și se despachetează în afara firului principal
       (createImageBitmap dintr-un <img> se face, în Chrome, pe firul principal: ~10 ms pe cadru, de acolo poticnelile);
     - între două cadre vecine nu se mai face amestec decât la mișcare foarte lentă și doar o clipă (amestecul dădea imagine dublă). */
  const PK = fineP ? 6 : 8, PW = fineP ? 480 : 320, SKIP = fineP ? 1 : 2;
  let pageUp = document.readyState === 'complete'; if (!pageUp) addEventListener('load', () => setTimeout(() => { pageUp = true; }, 1500), { once: true });
  // (bucățile din față se aduc din timp; restul filmului, în fundal, abia după ce s-a încărcat pagina și doar dacă vizitatorul nu economisește date)
  const VC = { base: FILM.dir + 'v/', n: 648, seg: 24, gop: 8, w: 1920, h: 1080, lo: [480, 270], loop: false, ver: FILM.v, pre: 2, all: () => pageUp && !(navigator.connection && navigator.connection.saveData) };
  const PKF = { a: -1, ra: null, b: -1, rb: null, t: 0, hi: false }, SLOWMIX = 14, sm01 = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const FW = fineP ? { load: 160, fwd: 26, back: 10, keep: 30 } : { load: 64, fwd: 16, back: 6, keep: 20 };   // în cadre, în jurul locului curent
  const film = { state: FILM.on && fcv ? 'wait' : 'off', P: [], trk: [], im: [], bm: [], px: [], busy: null, nb: 0, np: 0, pq: [], cnt: 0, gc: 0, want: 0, dir: 1, pos: -1, a: -1, b: -1, ra: null, rb: null, t: -1, sw: -1, ww: 0, w: 0, h: 0, still: 0, next: null, vc: null, vel: 0, lt: 0 };
  const vcOn = () => !!film.vc && film.vc.state !== 'off';
  if (film.state !== 'off') {
    FILM.T.forEach((t, ti) => { for (let k = 0; k < t[1]; k++) { film.P[t[0] + k] = t[2] + t[3] * k; film.trk[t[0] + k] = ti; } });
    const N = film.P.length; film.im = new Array(N).fill(null); film.bm = new Array(N).fill(null); film.px = new Array(N).fill(null); film.busy = new Uint8Array(N);
    if (FILM.v && fineP) { film.vc = openClip(VC, () => kick()); closeClip = () => { if (film.vc) film.vc.close(); }; }
    const req = new Uint8Array(N), err = new Uint8Array(N), can = i => i >= 0 && i < N && !req[i] && (i % SKIP === 0 || i === N - 1) && (!vcOn() || i === 0); let act = 0;   // (cu filmul comprimat se cere doar primul cadru)
    // un cadru adus ca Blob (se despachetează în afara firului principal); fără createImageBitmap, ca <img>
    const loadFrame = url => (hasBitmap && typeof fetch === 'function' ? fetch(url).then(r => (r.ok ? r.blob() : Promise.reject(new Error('img'))))
      : new Promise((ok, no) => { const im = new Image(); im.decoding = 'async'; im.onload = () => ok(im); im.onerror = no; im.src = url; }));
    // ordinea în care se cer cadrele: (1) cele de lângă locul curent, (2) schița rară a întregii filmări, (3) fereastra din jur,
    // (4) schița deasă. În fiecare grupă, întâi cele mai apropiate de locul curent.
    const around = (lim, back) => { const w0 = film.want - film.want % SKIP; for (let d = 0; d <= lim; d += SKIP) { const a = w0 + film.dir * d; if (can(a)) return a; if (d <= back) { const b = w0 - film.dir * d; if (can(b)) return b; } } return -1; };
    const sketch = st => { let best = -1, bd = 1e9; for (let i = 0; i < N; i += st) if (can(i)) { const d = Math.abs(i - film.want); if (d < bd) { bd = d; best = i; } } return best; };
    const pickNext = () => { let i = around(12, 12); if (i < 0) i = sketch(PK * 8); if (i < 0) i = sketch(PK * 4); if (i < 0) i = around(FW.load, FW.load / 3); if (i < 0) i = sketch(PK * 2); if (i < 0) i = sketch(PK); return i; };
    const next = () => { while (act < 8) { const i = pickNext(); if (i < 0) return; req[i] = 1; act++;
      loadFrame(FILM.dir + 'f_' + String(i).padStart(4, '0') + '.webp').then(im => { act--; film.im[i] = im; if (!hasBitmap) film.bm[i] = im; else if (vcOn()) bitmapOf(i); else if (i % PK === 0) { film.pq.push(i); pump(); } kick(); next(); },
        () => { act--; if (++err[i] < 3) setTimeout(() => { req[i] = 0; next(); }, 900 * err[i]); next(); }); } };   // un cadru care nu vine deloc e sărit: se arată vecinii lui
    film.next = next; next(); setTimeout(() => { if (film.state === 'wait') { film.state = 'off'; kick(); } }, 9000);
  }
  // copia mică a unui cadru din schiță (rămâne în memorie cât e pagina deschisă); cel mult două deodată, să nu țină în loc cadrele mari
  function pump() {
    while (film.np < 2 && film.pq.length) { const i = film.pq.shift(), im = film.im[i]; if (!im || film.px[i]) continue; film.np++; let pr = null;
      try { pr = createImageBitmap(im, { resizeWidth: PW, resizeQuality: 'low' }); } catch (_) { pr = null; }   // (înălțimea se potrivește singură)
      const done = b => { film.np--; if (b) film.px[i] = b; kick(); pump(); }; if (pr) pr.then(done, () => done(null)); else done(null); }
  }
  // despachetează un cadru mare în afara firului principal (pe telefoane și tablete, la o mărime mai mică, să țină mai puțină memorie)
  function bitmapOf(i) {
    const im = film.im[i]; if (!im || film.bm[i] || film.busy[i]) return; film.busy[i] = 1; film.nb++;
    const ok = b => { film.nb--; film.busy[i] = 0; film.bm[i] = b; film.cnt++; kick(); }, plain = () => createImageBitmap(im).then(ok, () => { film.nb--; film.busy[i] = 0; film.im[i] = null; kick(); });   // (un cadru stricat e sărit)
    if (!fineP) { let pr; try { pr = createImageBitmap(im, { resizeWidth: 960, resizeQuality: 'medium' }); } catch (_) { pr = null; } if (pr) { pr.then(ok, plain); return; } }
    plain();
  }
  // pregătește cadrele mari din jurul locului c (locul spre care merge derularea) și le eliberează pe cele rămase departe
  function feedFilm(c) {
    const N = film.P.length; film.want = Math.max(0, Math.min(N - 1, Math.round(c))); if (film.next) film.next();
    if (!hasBitmap || vcOn()) return;
    const w0 = film.want - film.want % SKIP;
    for (let d = 0; d <= FW.fwd && film.nb < 5; d += SKIP) for (let k = 0; k < 2 && film.nb < 5; k++) { if (k && (!d || d > FW.back)) continue; const i = w0 + (k ? -d : d) * film.dir; if (i >= 0 && i < N) bitmapOf(i); }
    if (film.nb < 5 && film.want === N - 1) bitmapOf(N - 1);
    if (++film.gc >= 20 || film.cnt > FW.keep * 2 / SKIP + 8) { film.gc = 0;   // rămân cele din jurul locului dorit și cele dintre el și locul arătat acum
      const lo = Math.min(film.want, film.pos) - FW.keep, hi = Math.max(film.want, film.pos) + FW.keep;
      for (let i = 0; i < N; i++) { const b = film.bm[i]; if (!b || !b.close || i === film.a || i === film.b || i === film.sw) continue; if (i < lo || i > hi || (Math.abs(i - film.want) > FW.keep && Math.abs(i - film.pos) > FW.keep && film.cnt > 110)) { b.close(); film.bm[i] = null; film.cnt--; } } }
  }
  const filmSrc = i => (i >= 0 && i < film.P.length ? film.bm[i] || film.px[i] : null);
  const pw = (T, p) => { let i = 0; while (i < T.length - 2 && p > T[i + 1][0]) i++; return lerp(T[i][1], T[i + 1][1], clamp((p - T[i][0]) / (T[i + 1][0] - T[i][0]))); };
  const nq = matchMedia('(max-width:800px),(max-width:1100px) and (max-aspect-ratio:1/1)');   // aceeași regulă ca în CSS: imaginea sus, textul jos
  const cW = new THREE.Color(0xffffff), cN = new THREE.Color(0x0c1326), cM = new THREE.Color(), cA = new THREE.Color(), cB = new THREE.Color();
  const filmTime = p => pw(FILM.time, p);
  const filmAt = p => { const P = film.P, N = P.length; let lo = 0, hi = N - 1; if (p <= P[0]) hi = 0; else if (p >= P[N - 1]) lo = N - 1; else while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m] <= p) lo = m; else hi = m; }
    if (hi < lo) hi = lo; return lo + (hi > lo ? (p - P[lo]) / (P[hi] - P[lo]) : 0); };   // derulare → loc în filmare, în cadre (cu zecimale)
  // desenează filmarea pentru derularea p (urmărită lin); pd = unde e derularea de fapt (acolo se va opri imaginea). Desenează doar
  // când se schimbă ceva. Întoarce false cât timp nu are nimic de arătat.
  function drawFilm(p, pd, now, W, H, x0, y0, iw, ih, part) {
    const N = film.P.length, tf = filmAt(p), td = filmAt(pd), vc = vcOn() ? film.vc : null;
    if (film.pos >= 0 && Math.abs(td - film.pos) > .01) film.dir = td > film.pos ? 1 : -1;
    if (film.pos < 0 || Math.abs(tf - film.pos) > .004) film.still = now;
    { const ds = Math.max(.004, Math.min(.1, (now - (film.lt || now)) / 1000 || .016)); film.vel += ((film.pos >= 0 ? (tf - film.pos) / ds : 0) - film.vel) * Math.min(1, ds * 14); film.lt = now; }   // viteza, în cadre pe secundă (netezită)
    film.pos = tf; feedFilm(td);
    const calm = Math.abs(film.vel) < SLOWMIX && now - film.still <= 140;   // mișcare foarte lentă: trecerea dintre două cadre vecine se topește o clipă
    let a = -1, b = -1, t = 0, ra = null, rb = null;
    if (vc) {   // filmul comprimat: cadre mari, cele mai apropiate de locul curent
      const p0 = film.bm[0] || film.px[0];   // primul cadru, adus separat
      if (vc.pick(tf, PKF) && (PKF.hi || tf > .5 || !p0)) { a = PKF.a; b = PKF.b; ra = PKF.ra; rb = PKF.rb; t = b !== a ? PKF.t : 0; }
      else if (p0 && tf < 2) { a = b = 0; ra = rb = p0; }
      else { vc.want(tf, film.vel, [film.a, film.b, film.sw]); return film.a >= 0; }
      if (t) t = calm ? sm01((t - .3) / .4) : t < .5 ? 0 : 1;
      if (t > .98) { a = b; ra = rb; t = 0; } else if (t < .02) { b = a; rb = ra; t = 0; }
    } else {
      // cele mai apropiate cadre care au ceva de arătat (mare sau schiță), înainte și după locul curent
      const fl = Math.floor(tf), ce = Math.ceil(tf);
      for (let i = fl; i >= 0 && i >= fl - 128; i--) if (filmSrc(i)) { a = i; break; }
      for (let i = ce; i < N && i <= ce + 128; i++) if (filmSrc(i)) { b = i; break; }
      if (a < 0 && b < 0) return film.a >= 0;
      if (a < 0) a = b; else if (b < 0) b = a;
      t = b > a ? (tf - a) / (b - a) : 0;
      t = b - a > SKIP || !calm ? (t < .5 ? 0 : 1) : sm01((t - .3) / .4);   // un singur cadru, cel mai apropiat (fără imagine dublă)
      if (t > .98) { a = b; t = 0; } else if (t < .02) { b = a; t = 0; }
      ra = filmSrc(a); rb = filmSrc(b);
    }
    t = Math.round(t * 50) / 50;
    // la granița dintre două bucăți filmate în lumini diferite, sfârșitul bucății se topește în primul cadru al următoarei
    const tr = FILM.T[film.trk[a]], nx = tr[0] + tr[1], jf = a - tr[0] + t * (b - a), near = tr[4] && nx < N && jf > tr[1] - 1 - FILM.dis - 12; let sw = -1, w = 0, rs = null;
    if (vc) vc.want(tf, film.vel, [a, b, near ? nx : -1]);   // (cadrele de pe ecran și primul cadru al bucății următoare rămân desfăcute)
    if (tr[4] && nx < N && jf > tr[1] - 1 - FILM.dis) { if (vc) rs = vc.get(nx); else { if (hasBitmap) bitmapOf(nx); rs = filmSrc(nx); } if (rs) { sw = nx; w = Math.round(clamp((jf - (tr[1] - 1 - FILM.dis)) / FILM.dis) * 50) / 50; } }
    const dpr = Math.min(1.5, devicePixelRatio || 1), cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    const geo = Math.round(x0) + ',' + Math.round(y0) + ',' + Math.round(iw);
    if (ra === film.ra && rb === film.rb && t === film.t && w === film.ww && cw === film.w && ch === film.h && geo === film.geo) return true;
    if (fcv.width !== cw || fcv.height !== ch) { fcv.width = cw; fcv.height = ch; }
    const g = fcv.getContext('2d'), X = x0 * dpr, Y = y0 * dpr, IW = iw * dpr, IH = ih * dpr; g.globalAlpha = 1; if (part) g.clearRect(0, 0, cw, ch); g.drawImage(ra, X, Y, IW, IH);
    if (rb !== ra && t) { g.globalAlpha = t; g.drawImage(rb, X, Y, IW, IH); }
    if (w > .01) { g.globalAlpha = w; g.drawImage(rs, X, Y, IW, IH); }
    film.a = a; film.b = b; film.ra = ra; film.rb = rb; film.t = t; film.sw = sw; film.ww = w; film.w = cw; film.h = ch; film.geo = geo;
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
  const FOLLOW = .34;   // cât de moale urmărește imaginea derularea (secunde)
  let pv = 0, ps = -1, visible = true, raf = 0, mx = 0, my = 0, tmx = 0, tmy = 0, lastCh = -1, lastDark = null, lastClock = '', W = 0, H = 0, t0 = performance.now(),
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
    // (arc amortizat critic: pleacă lin, ajunge lin, fără zvâcnetul de la fiecare treaptă a rotiței)
    const p = progress();
    if (ps < 0) { ps = p; pv = 0; } else { const om = 2 / FOLLOW, x = om * dt, e = 1 / (1 + x + .48 * x * x + .235 * x * x * x), ch = ps - p, tmp = (pv + om * ch) * dt; pv = (pv - om * tmp) * e; let o = p + (ch + tmp) * e; if ((p - ps > 0) === (o > p)) { o = p; pv = 0; } ps = o; if (Math.abs(p - ps) < .00005 && Math.abs(pv) < .0005) { ps = p; pv = 0; } }
    // filmarea reală: pe ecran lat umple tot ecranul; pe ecran îngust (telefon, panou) stă ca o bandă sus, cu textul dedesubt.
    // Doar între ele (fereastră mică, aproape pătrată, cu textul în stânga) rămâne macheta 3D.
    const asp = W / H, narrow = nq.matches, real = film.state !== 'off' && (narrow || asp >= 1.5);
    const fk = real ? 1 - clamp((ps - FILM.end) / FILM.out) : 0;   // cât se vede filmarea (1 = doar ea)
    const fcam = real && fk >= 1;   // cât se vede doar filmarea, camera 3D e chiar camera filmării (ca etichetele să cadă la locul lor)
    const m = fcam ? 0 : clamp((1.25 - asp) / .5), c = sample(ps, m);
    mx += (tmx - mx) * .05; my += (tmy - my) * .05;
    const idle = (now - t0) / 1000, fov = lerp(30, 42, m), tn = Math.tan(fov * Math.PI / 360);
    const dist = Math.max((c.fh / 2) / tn, (c.fw / 2) / (tn * (fcam ? 16 / 9 : asp)));
    S.camera.fov = fov;
    if (real) {
      let iw, ih, x0, y0;
      if (narrow) {   // bandă sus: din lățimea cadrului se vede cam jumătate, în jurul capsulei; marginea de jos se stinge în fundal
        const f = clamp(W * .5625 / (H * .56), .5, .8); iw = W / f; ih = iw * .5625; x0 = clamp(W / 2 - pw(FILM.cx, ps) * iw, W - iw, 0); y0 = Math.min(0, H * .27 - .55 * ih);
        const fb = Math.round(y0 + ih); if (fb !== film.fb) { film.fb = fb; pin.style.setProperty('--fb', fb + 'px'); pin.style.setProperty('--fa', Math.round(y0 + ih * .68) + 'px'); }
      } else { const sc = Math.max(W / 16, H / 9); iw = 16 * sc; ih = 9 * sc; x0 = (W - iw) * .62; y0 = (H - ih) * .5; }   // umple ecranul (ca o imagine „cover”, ținută spre dreapta, unde e capsula)
      if (fk > 0) drawFilm(ps, p, now, W, H, x0, y0, iw, ih, narrow);
      if (fcam) S.camera.setViewOffset(iw, ih, -x0 - c.ox * iw, -y0 - c.oy * ih, W, H);
    }
    if (!fcam) S.camera.setViewOffset(W, H, -c.ox * W, -c.oy * H, W, H);
    if (real !== film.cls) { film.cls = real; sec.classList.toggle('st--film', real); }
    if ((real && narrow) !== !!film.fn) { film.fn = real && narrow; sec.classList.toggle('st--fn', film.fn); }

    const fo = fk.toFixed(2), fs = fo + film.state + real; if (fs !== film.op) { film.op = fs; const on = real && film.state === 'on'; if (fcv) fcv.style.opacity = on ? fo : '0'; if (fveil) fveil.style.opacity = on ? fo : '0'; canvas.style.opacity = real ? (1 - fk).toFixed(2) : ''; }
    const shown = real && film.state === 'on' && fk > .5;   // pe ecran e (mai ales) filmarea
    if (shown !== !!film.ai) { film.ai = shown; sec.classList.toggle('st--ai', shown); }   // mențiunea „Vizualizare realizată cu AI”
    const fr3 = 1 - fk; orbit(S.camera, { az: c.az + (Math.sin(idle * .22) * 1.1 + mx * 2.4) * fr3 + c.bp * Math.sin(idle * .16) * 10, el: clamp(c.el - my * 1.3 * fr3, 2, 88), dist, tx: c.tx, ty: c.ty, tz: 0 });
    const d = S.setTime(c.t); const hid = fcam && film.state === 'on';   // filmarea acoperă tot: macheta nu se vede, deci nu se mai pregătește (acoperiș, umbre)
    if (!hid) { S.x7.openRoof(c.roof); S.setBlueprint(c.bp); S.x7.explode(c.ex); }
    // umbra: doar când s-a mutat soarele sau s-a mișcat capsula, și cel mult o dată la două cadre
    if (!hid && (fr & 1) && (Math.abs(c.t - shT) > .03 || Math.abs(c.roof - shR) > .01 || Math.abs(c.ex - shE) > .004 || Math.abs(c.bp - shB) > .02)) { shT = c.t; shR = c.roof; shE = c.ex; shB = c.bp; S.shadow(); }
    if (fk < 1) S.render(); else { S.camera.updateMatrixWorld(); S.camera.matrixWorldInverse.copy(S.camera.matrixWorld).invert(); }   // (etichetele se așază corect și când macheta nu se desenează)
    // fundalul paginii, culoarea textului, bara de sus
    if (shown && narrow) { cM.copy(cW).lerp(cN, smooth(.444, .5, ps)); cA.copy(d.top).lerp(cM, fk); cB.copy(d.bot).lerp(cM, fk); }
    const ca = (shown && narrow ? cA : d.top).getHexString(), cb = (shown && narrow ? cB : d.bot).getHexString(); if (ca !== bgA) { bgA = ca; pin.style.setProperty('--st-top', '#' + ca); } if (cb !== bgB) { bgB = cb; pin.style.setProperty('--st-bot', '#' + cb); }
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
  new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; if (!visible && film.vc) film.vc.rest(); kick(); }).observe(sec);   // (cât povestea nu e pe ecran, cadrele mari ale filmului se eliberează)
  document.addEventListener('visibilitychange', kick);
  addEventListener('resize', () => { W = 0; kick(); });
  live = true; sec.classList.add('st--live'); window.__skyDark = false; if (window.navU) window.navU();
  kick();
  window.__story = { stage: S, get p() { return ps; }, get film() { return { state: film.state, pos: film.pos, a: film.a, b: film.b, t: film.t, big: !!(film.a >= 0 && film.bm[film.a]), n: film.cnt, sk: film.px.filter(Boolean).length, im: film.im.filter(Boolean).length, w: film.ra ? film.ra.width : 0, vel: +film.vel.toFixed(1), vc: film.vc ? film.vc.stat : null }; } };
}
