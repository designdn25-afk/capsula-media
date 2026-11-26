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
    cx: [[.03, .72], [.205, .725], [.38, .67], [.5, .73], [.78, .74]],
    // Cadrele pentru telefoane (ecran îngust, ținut în picioare; img/st/film/t/, făcute de surse/ai360/vederi/fafilmtel.py): tăiate
    // la partea din jurul capsulei (x = de unde începe tăietura, w = cât cuprinde, din lățimea cadrului), un cadru din două, plus
    // „pachetele mici” (toate cadrele cu număr par, la mărime mică, câte pk cadre ale poveștii într-un fișier). Se folosesc cât pe
    // ecran se vede cel mult fmax din lățimea cadrului. v = versiunea (se mărește la fiecare refacere a fișierelor).
    tel: { v: 1, dir: 'img/st/film/t/', x: 614 / 1920, w: 1306 / 1920, pk: 54, fmax: .7 } };
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
  /* A treia rescriere din 17 nov 2026, pentru telefoane (clientul, cu filmuleț de pe telefon: „am deschis pe telefon… nu merge deloc
     bine”; acolo cadrele erau adesea șterse, fiindcă pozele întregi, de 60 KB, nu veneau destul de repede pe o legătură de mobil):
     - pe telefon (ecran îngust, ținut în picioare) se folosesc cadre tăiate la partea care se vede (FILM.tel): de două ori mai puține
       date la aceeași claritate, deci țin pasul cu derularea;
     - „pachetele mici” aduc repede, din câteva cereri, toată povestea la mărime mică: orice loc are imediat ce arăta, fără salturi;
       cadrele lor se desfac doar în jurul locului curent (țin puțină memorie);
     - pe ecran nu se amestecă la întâmplare cadre clare cu cadre mici (ar pâlpâi): la mișcare se arată cadre mici până când cele
       clare sunt gata pe o bucată bună înainte, apoi doar clare (film.tier). */
  const PK = fineP ? 6 : 8, PW = fineP ? 480 : 320, SKIP = fineP ? 1 : 2, LSP = 32;   // (din pachetele mici, un cadru din LSP rămâne mereu desfăcut)
  let pageUp = document.readyState === 'complete'; if (!pageUp) addEventListener('load', () => setTimeout(() => { pageUp = true; }, 1500), { once: true });
  // (bucățile din față se aduc din timp; restul filmului, în fundal, abia după ce s-a încărcat pagina și doar dacă vizitatorul nu economisește date)
  const slowNet = () => { const c = navigator.connection; return !!(c && (c.saveData || /(^|-)2g$|^3g$/.test(c.effectiveType || ''))); };
  const VC = { base: FILM.dir + 'v/', n: 648, seg: 24, gop: 8, w: 1920, h: 1080, lo: [480, 270], loop: false, ver: FILM.v, pre: 2, all: () => pageUp && !(navigator.connection && navigator.connection.saveData) };
  const PKF = { a: -1, ra: null, b: -1, rb: null, t: 0, hi: false }, SLOWMIX = 14, sm01 = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const FW = fineP ? { load: 160, fwd: 26, back: 10, keep: 30 } : { load: 64, fwd: 16, back: 6, keep: 18 };   // în cadre, în jurul locului curent
  const pad4 = i => String(i).padStart(4, '0');
  // de unde vin pozele separate: 0 = cadrele întregi (1280 px), 1 = cele pentru telefon (tăiate, cu pachete mici)
  const SETS = [{ url: i => FILM.dir + 'f_' + pad4(i) + '.webp', x: 0, w: 1, skip: SKIP, pack: 0 },
    { url: i => FILM.tel.dir + 'f_' + pad4(i) + '.webp?v=' + FILM.tel.v, x: FILM.tel.x, w: FILM.tel.w, skip: 2, pack: FILM.tel.pk }];
  const nq = matchMedia('(max-width:800px),(max-width:1100px) and (max-aspect-ratio:1/1)');   // aceeași regulă ca în CSS: imaginea sus, textul jos
  const telSet = (W, H) => (!fineP && FILM.tel && W < 700 && nq.matches && clamp(W * .5625 / (H * .56), .5, .8) <= FILM.tel.fmax ? 1 : 0);   // (pe tablete, pozele întregi: cele tăiate ar fi prea mici pentru ecranul lor)
  let filmVis = true;   // povestea e pe ecran? (cât nu e, nu se mai cere nimic: legătura rămâne pentru ce se vede)
  const film = { state: FILM.on && fcv ? 'wait' : 'off', P: [], trk: [], im: [], bm: [], px: [], lo: [], busy: null, pb: null, nb: 0, np: 0, pq: [], cnt: 0, gc: 0, want: 0, dir: 1, pos: -1, a: -1, b: -1, ra: null, rb: null, t: -1, sw: -1, ww: 0, w: 0, h: 0, still: 0, next: null, vc: null, vel: 0, lt: 0, set: -1, gen: 0, tier: 1, sx: 0, packs: 0 };
  const vcOn = () => !!film.vc && film.vc.state !== 'off';
  if (film.state !== 'off') {
    FILM.T.forEach((t, ti) => { for (let k = 0; k < t[1]; k++) { film.P[t[0] + k] = t[2] + t[3] * k; film.trk[t[0] + k] = ti; } });
    if (FILM.v && fineP) { film.vc = openClip(VC, () => kick()); closeClip = () => { if (film.vc) film.vc.close(); }; }
    filmInit(telSet(innerWidth, innerHeight)); setTimeout(() => { if (film.state === 'wait') { film.state = 'off'; kick(); } }, 9000);
  }
  // (re)pornește aducerea pozelor separate din setul k: la început și când se schimbă felul ecranului (telefon întors pe lat)
  function filmInit(k) {
    film.bm.forEach(b => { if (b && b.close) b.close(); }); film.px.forEach(b => { if (b && b.close) b.close(); });
    const N = film.P.length, S = SETS[k], gen = ++film.gen; film.set = k;
    film.im = new Array(N).fill(null); film.bm = new Array(N).fill(null); film.px = new Array(N).fill(null); film.lo = new Array(N).fill(null); film.busy = new Uint8Array(N); film.pb = new Uint8Array(N);
    film.nb = 0; film.np = 0; film.cnt = 0; film.pq = []; film.a = film.b = film.sw = -1; film.ra = film.rb = null; film.t = -1; film.tier = 1; film.packs = 0;
    const req = new Uint8Array(N), err = new Uint8Array(N), can = i => i >= 0 && i < N && !req[i] && (i % S.skip === 0 || i === N - 1) && (!vcOn() || i === 0); let act = 0;   // (cu filmul comprimat se cere doar primul cadru)
    // un cadru adus ca Blob (se despachetează în afara firului principal); fără createImageBitmap, ca <img>
    const loadFrame = url => (hasBitmap && typeof fetch === 'function' ? fetch(url).then(r => (r.ok ? r.blob() : Promise.reject(new Error('img'))))
      : new Promise((ok, no) => { const im = new Image(); im.decoding = 'async'; im.onload = () => ok(im); im.onerror = no; im.src = url; }));
    // ordinea în care se cer cadrele: (1) cele de lângă locul curent, (2) schița rară a întregii filmări, (3) fereastra din jur,
    // (4) schița deasă. În fiecare grupă, întâi cele mai apropiate de locul curent. Unde există pachete mici (telefon), ele țin loc
    // de schiță: se cer doar (1) și (3).
    const around = (lim, back) => { const w0 = film.want - film.want % S.skip; for (let d = 0; d <= lim; d += S.skip) { const a = w0 + film.dir * d; if (can(a)) return a; if (d <= back) { const b = w0 - film.dir * d; if (can(b)) return b; } } return -1; };
    const sketch = st => { let best = -1, bd = 1e9; for (let i = 0; i < N; i += st) if (can(i)) { const d = Math.abs(i - film.want); if (d < bd) { bd = d; best = i; } } return best; };
    const pickNext = S.pack && hasBitmap ? () => { let i = film.want >= N - 4 && can(N - 1) ? N - 1 : around(12, 12); if (i < 0) i = around(FW.load, FW.load / 3); return i; }   // (ultimul cadru are număr impar: se cere anume)
      : () => { let i = film.want >= N - 4 && can(N - 1) ? N - 1 : around(12, 12); if (i < 0) i = sketch(PK * 8); if (i < 0) i = sketch(PK * 4); if (i < 0) i = around(FW.load, FW.load / 3); if (i < 0) i = sketch(PK * 2); if (i < 0) i = sketch(PK); return i; };
    // Pachetele mici, câte unul pe rând: întâi cel de la locul curent și următoarele două din direcția de mers. Au întâietate (ele
    // sunt plasa de siguranță, nu trebuie să rămână în urma derulării): cât nu a sosit cel de aici nu se cere niciun cadru clar,
    // cât nu a sosit următorul, unul singur deodată, iar cât nu a sosit al treilea, cel mult trei. Cele depărtate, abia după ce s-a încărcat pagina și doar cât nu
    // mai e de adus niciun cadru clar. Fiecare cadru rămâne ca Blob (comprimat) până când e nevoie de el.
    const NP = S.pack && hasBitmap && typeof fetch === 'function' ? Math.ceil(N / S.pack) : 0, pst = new Uint8Array(NP), perr = new Uint8Array(NP); let pact = 0;   // pst: 0 = necerut, 1 = pe drum, 2 = sosit, 3 = se reîncearcă, 4 = nu vine
    const cur = () => Math.min(NP - 1, Math.floor(film.want / S.pack)), inP = p => p >= 0 && p < NP;
    const missing = far => { const c = cur(); for (let d = 0; d <= far; d++) { const p = c + d * film.dir; if (inP(p) && pst[p] < 2) return true; } return false; };
    const packs = idle => { if (!NP || pact) return; const c = cur(); let p = -1;
      for (let d = 0; d <= 2 && p < 0; d++) { const q = c + d * film.dir; if (inP(q) && !pst[q]) p = q; }
      if (p < 0 && inP(c - film.dir) && !pst[c - film.dir]) p = c - film.dir;
      if (p < 0 && idle && pageUp && !slowNet()) for (let d = 3; d < NP && p < 0; d++) { const q = c + d * film.dir, r = c - d * film.dir; if (inP(q) && !pst[q]) p = q; else if (inP(r) && !pst[r]) p = r; }
      if (p < 0) return; pst[p] = 1; pact = 1;
      fetch(FILM.tel.dir + 'p_' + String(p).padStart(2, '0') + '.bin?v=' + FILM.tel.v).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('http')))).then(buf => {
        pact = 0; if (gen !== film.gen) return; const dv = new DataView(buf); if (buf.byteLength < 8 || dv.getUint32(0) !== 0x43505031) throw new Error('format');
        const m = dv.getUint16(4, true); let off = 8 + 4 * m;
        for (let j = 0; j < m; j++) { const sz = dv.getUint32(8 + 4 * j, true), i = p * S.pack + 2 * j; if (i < N) film.lo[i] = new Blob([new Uint8Array(buf, off, sz)], { type: 'image/webp' }); off += sz; }
        pst[p] = 2; film.packs++; kick(); next(); }).catch(() => { pact = 0; if (gen !== film.gen) return; if (++perr[p] < 3) { pst[p] = 3; setTimeout(() => { if (gen === film.gen) { pst[p] = 0; next(); } }, 1500 * perr[p]); } else pst[p] = 4; next(); }); };
    const next = () => { if (gen !== film.gen || !filmVis) return; packs(false); const top = !NP ? (fineP ? 8 : 6) : missing(0) ? (film.a < 0 ? 1 : 0) : missing(1) ? 1 : missing(2) ? 3 : 6;   // (pe telefon, puține deodată: alegerea cadrului următor ține pasul cu derularea; cât lipsește pachetul de aici, doar el, în afară de prima imagine a paginii)
      while (act < top) { const i = pickNext(); if (i < 0) { if (!act) packs(true); return; } req[i] = 1; act++;
        loadFrame(S.url(i)).then(im => { act--; if (gen !== film.gen) return; film.im[i] = im; if (!hasBitmap) film.bm[i] = im; else if (vcOn()) bitmapOf(i); else if (!NP && i % PK === 0) { film.pq.push(i); pump(); } kick(); next(); },
          () => { act--; if (gen !== film.gen) return; if (++err[i] < 3) setTimeout(() => { if (gen === film.gen) { req[i] = 0; next(); } }, 900 * err[i]); next(); }); } };   // un cadru care nu vine deloc e sărit: se arată vecinii lui
    film.next = next; next();
  }
  // copia mică a unui cadru din schiță (rămâne în memorie cât e pagina deschisă); cel mult două deodată, să nu țină în loc cadrele mari
  function pump() {
    while (film.np < 2 && film.pq.length) { const i = film.pq.shift(), im = film.im[i], gen = film.gen; if (!im || film.px[i]) continue; film.np++; let pr = null;
      try { pr = createImageBitmap(im, { resizeWidth: PW, resizeQuality: 'low' }); } catch (_) { pr = null; }   // (înălțimea se potrivește singură)
      const done = b => { if (gen !== film.gen) { if (b && b.close) b.close(); return; } film.np--; if (b) film.px[i] = b; kick(); pump(); }; if (pr) pr.then(done, () => done(null)); else done(null); }
  }
  // un cadru din pachetele mici, desfăcut în afara firului principal
  function lowOf(i) { const gen = film.gen, bl = film.lo[i]; film.pb[i] = 1; film.np++;
    createImageBitmap(bl).then(b => { if (gen !== film.gen) { if (b.close) b.close(); return; } film.np--; film.pb[i] = 0; if (film.px[i]) { if (b.close) b.close(); } else film.px[i] = b; kick(); },
      () => { if (gen === film.gen) { film.np--; film.pb[i] = 0; film.lo[i] = null; } }); }
  // despachetează un cadru mare în afara firului principal (pe telefoane, pozele întregi la o mărime mai mică, să țină mai puțină memorie)
  function bitmapOf(i) {
    const im = film.im[i]; if (!im || film.bm[i] || film.busy[i]) return; film.busy[i] = 1; film.nb++; const gen = film.gen;
    const ok = b => { if (gen !== film.gen) { if (b && b.close) b.close(); return; } film.nb--; film.busy[i] = 0; film.bm[i] = b; film.cnt++; kick(); },
      plain = () => createImageBitmap(im).then(ok, () => { if (gen === film.gen) { film.nb--; film.busy[i] = 0; film.im[i] = null; kick(); } });   // (un cadru stricat e sărit)
    if (!fineP && film.set === 0 && Math.max(innerWidth, innerHeight) < 1000) { let pr; try { pr = createImageBitmap(im, { resizeWidth: 960, resizeQuality: 'medium' }); } catch (_) { pr = null; } if (pr) { pr.then(ok, plain); return; } }
    plain();
  }
  // pregătește cadrele mari din jurul locului c (locul spre care merge derularea) și le eliberează pe cele rămase departe
  function feedFilm(c) {
    const N = film.P.length; film.want = Math.max(0, Math.min(N - 1, Math.round(c))); if (film.next) film.next();
    if (!hasBitmap || vcOn()) return;
    const S = SETS[film.set], sk = S.skip, w0 = film.want - film.want % sk;
    for (let d = 0; d <= FW.fwd && film.nb < 5; d += sk) for (let k = 0; k < 2 && film.nb < 5; k++) { if (k && (!d || d > FW.back)) continue; const i = w0 + (k ? -d : d) * film.dir; if (i >= 0 && i < N) bitmapOf(i); }
    if (film.nb < 5 && film.want === N - 1) bitmapOf(N - 1);
    if (film.packs) {   // cadrele din pachetele mici: o fereastră mai largă în jurul locului și, din loc în loc, câte unul care rămâne mereu desfăcut
      const c2 = film.want - film.want % 2;
      for (let d = 0; d <= 44 && film.np < 3; d += 2) for (let k = 0; k < 2 && film.np < 3; k++) { if (k && (!d || d > 14)) continue; const i = c2 + (k ? -d : d) * film.dir; if (i >= 0 && i < N && film.lo[i] && !film.px[i] && !film.pb[i]) lowOf(i); }
      for (let i = 0; i < N && film.np < 2; i += LSP) if (film.lo[i] && !film.px[i] && !film.pb[i]) lowOf(i);
    }
    if (++film.gc >= 20 || film.cnt > FW.keep * 2 / sk + 8) { film.gc = 0;   // rămân cele din jurul locului dorit și cele dintre el și locul arătat acum
      const lo = Math.min(film.want, film.pos) - FW.keep, hi = Math.max(film.want, film.pos) + FW.keep;
      for (let i = 0; i < N; i++) { const b = film.bm[i], q = film.packs ? film.px[i] : null;
        if (b && b.close && i !== film.a && i !== film.b && i !== film.sw && (i < lo || i > hi || (Math.abs(i - film.want) > FW.keep && Math.abs(i - film.pos) > FW.keep && film.cnt > 110))) { b.close(); film.bm[i] = null; film.cnt--; }
        if (q && q.close && i % LSP && i !== film.a && i !== film.b && i !== film.sw && (i < lo - 44 || i > hi + 44)) { q.close(); film.px[i] = null; } } }
  }
  const filmSrc = i => (i >= 0 && i < film.P.length ? film.bm[i] || film.px[i] : null);
  const pw = (T, p) => { let i = 0; while (i < T.length - 2 && p > T[i + 1][0]) i++; return lerp(T[i][1], T[i + 1][1], clamp((p - T[i][0]) / (T[i + 1][0] - T[i][0]))); };
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
      // pozele separate: cadrul clar sau copia mică (din schiță ori din pachetele mici). La mișcare nu se amestecă la întâmplare
      // (ar pâlpâi): se arată copii mici până când cadrele clare sunt gata pe o bucată bună înainte, apoi doar clare (film.tier).
      const S = SETS[film.set], sk = S.skip, sp = Math.abs(film.vel), dr = film.dir, c0 = Math.round(tf), lst = film.packs ? 2 : PK;
      const hiAt = i => (i >= 0 && i < N ? film.bm[i] : null), loAt = i => (i >= 0 && i < N ? film.px[i] : null);
      const find = (at, tol) => { for (let k = 0; k <= tol; k++) { if (at(c0 + k * dr)) return c0 + k * dr; if (k && at(c0 - k * dr)) return c0 - k * dr; } return -1; };
      const ih = find(hiAt, sp < 6 ? sk : Math.ceil(sk + sp * .03)), il = find(loAt, Math.ceil(lst / 2 + 1 + sp * .03));
      if (sp < 6) { if (ih >= 0) film.tier = 1; else if (il >= 0) film.tier = 0; }   // încet sau oprit: cadrul clar, dacă e gata
      else if (film.tier) { if (ih < 0 && il >= 0) film.tier = 0; }
      else { const K = clamp(Math.round(sp * .15 / sk), 2, 5), b0 = Math.round(tf / sk) * sk; let ok = ih >= 0; for (let k = 0; ok && k <= K; k++) { const j = b0 + k * sk * dr; if (j >= 0 && j < N && !film.bm[j]) ok = false; } if (ok) film.tier = 1; }
      let use = film.tier ? ih : il; if (use < 0) use = ih >= 0 ? ih : il;
      if (use < 0) for (let d = 0; d <= 128 && use < 0; d++) { if (filmSrc(c0 + d * dr)) use = c0 + d * dr; else if (filmSrc(c0 - d * dr)) use = c0 - d * dr; }   // nimic aproape: cel mai apropiat cadru care există
      if (use < 0) return film.a >= 0;
      a = b = use; let hi = !!film.bm[use] && (film.tier === 1 || use !== il);
      if (hi && calm) { const fa = Math.floor(tf / sk) * sk, fb = fa + sk; if (tf > fa && fb < N && film.bm[fa] && film.bm[fb]) { a = fa; b = fb; t = sm01(((tf - fa) / sk - .3) / .4); if (t > .98) { a = b; t = 0; } else if (t < .02) { b = a; t = 0; } } }   // doar la mișcare foarte lentă, între două cadre clare vecine, trecerea se topește o clipă
      ra = hi ? film.bm[a] : film.px[a] || film.bm[a]; rb = t ? film.bm[b] : ra;
    }
    t = Math.round(t * 50) / 50;
    // la granița dintre două bucăți filmate în lumini diferite, sfârșitul bucății se topește în primul cadru al următoarei
    const tr = FILM.T[film.trk[a]], nx = tr[0] + tr[1], jf = a - tr[0] + t * (b - a), near = tr[4] && nx < N && jf > tr[1] - 1 - FILM.dis - 12; let sw = -1, w = 0, rs = null;
    if (vc) vc.want(tf, film.vel, [a, b, near ? nx : -1]);   // (cadrele de pe ecran și primul cadru al bucății următoare rămân desfăcute)
    if (tr[4] && nx < N && jf > tr[1] - 1 - FILM.dis) { if (vc) rs = vc.get(nx); else { if (hasBitmap) bitmapOf(nx); rs = filmSrc(nx); } if (rs) { sw = nx; w = Math.round(clamp((jf - (tr[1] - 1 - FILM.dis)) / FILM.dis) * 50) / 50; } }
    const dpr = Math.min(1.5, devicePixelRatio || 1), cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    const sx = vc ? 0 : SETS[film.set].x, sw_ = vc ? 1 : SETS[film.set].w;   // (cadrele tăiate pentru telefon cuprind doar o parte din lățime)
    const geo = Math.round(x0) + ',' + Math.round(y0) + ',' + Math.round(iw);
    if (ra === film.ra && rb === film.rb && t === film.t && w === film.ww && cw === film.w && ch === film.h && geo === film.geo) return true;
    if (fcv.width !== cw || fcv.height !== ch) { fcv.width = cw; fcv.height = ch; }
    const g = fcv.getContext('2d'), X = (x0 + sx * iw) * dpr, Y = y0 * dpr, IW = iw * sw_ * dpr, IH = ih * dpr; g.globalAlpha = 1; if (part) g.clearRect(0, 0, cw, ch); g.drawImage(ra, X, Y, IW, IH);
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
  const FOLLOW = fineP ? .34 : .16;   // cât de moale urmărește imaginea derularea (secunde); pe ecranele cu atingere derularea e deja lină, deci mai strâns
  let pv = 0, ps = -1, visible = true, raf = 0, mx = 0, my = 0, tmx = 0, tmy = 0, lastCh = -1, lastDark = null, lastClock = '', W = 0, H = 0, t0 = performance.now(),
    last = 0, px = 3.6e6, slow = 0, fr = 0, shT = -9, shR = -9, shE = -9, shB = -9, bgA = '', bgB = '', dayV = '', clkO = '', moved = null;
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  pin.addEventListener('pointermove', e => { if (!fine.matches) return; tmx = (e.clientX / innerWidth - .5) * 2; tmy = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
  pin.addEventListener('pointerleave', () => { tmx = tmy = 0; });

  // (față de înălțimea părții fixe, nu a ferestrei: pe telefon, fereastra se înalță când se ascunde bara navigatorului, iar povestea ar tresări)
  function progress() { const r = sec.getBoundingClientRect(), tot = Math.max(1, sec.offsetHeight - (pin.offsetHeight || innerHeight)); return clamp(-r.top / tot); }
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
    if (film.state !== 'off' && !fineP) { const k = telSet(W, H); if (k !== film.set) filmInit(k); }   // (telefon întors pe lat sau înapoi: celălalt fel de cadre)
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
    const ca = (shown && narrow ? cA : d.top).getHexString(), cb = (shown && narrow ? cB : d.bot).getHexString(); if (ca !== bgA) { bgA = ca; pin.style.setProperty('--st-top', '#' + ca); } if (cb !== bgB) { bgB = cb; pin.style.setProperty('--st-bot', '#' + cb); sec.style.setProperty('--st-edge', '#' + cb); }
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
  new IntersectionObserver(es => { visible = filmVis = es[es.length - 1].isIntersecting; if (!visible && film.vc) film.vc.rest(); if (visible && film.next) film.next(); kick(); }).observe(sec);   // (cât povestea nu e pe ecran, cadrele mari ale filmului se eliberează)
  document.addEventListener('visibilitychange', kick);
  addEventListener('resize', () => { W = 0; kick(); });
  live = true; sec.classList.add('st--live'); window.__skyDark = false; if (window.navU) window.navU();
  kick();
  window.__story = { stage: S, get p() { return ps; }, get film() { return { state: film.state, pos: film.pos, a: film.a, b: film.b, t: film.t, big: !!(film.a >= 0 && film.bm[film.a]), n: film.cnt, sk: film.px.filter(Boolean).length, im: film.im.filter(Boolean).length, w: film.ra ? film.ra.width : 0, vel: +film.vel.toFixed(1), set: film.set, tier: film.tier, lo: film.lo.filter(Boolean).length, nl: film.px.filter(Boolean).length, vc: film.vc ? film.vc.stat : null }; } };
}
