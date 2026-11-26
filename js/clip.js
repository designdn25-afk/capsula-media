/* Capsula România — „filmul comprimat” al unei rotiri sau al poveștii de la deschidere (din 17 nov 2026).

   De ce: clientul a filmat ecranul și a scris „când miști casa își pierde din calitate… nu se mișcă lin deloc”. Până atunci
   cadrele veneau ca sute de poze separate; ca să ajungă repede erau mici (1024 px), iar cât nu soseau se arăta o copie și mai
   mică. Aici aceleași cadre stau într-un film AV1 tăiat în bucăți (surse/ai360/vederi/faclip.py): de câteva ori mai puține date
   la o imagine de două ori mai mare, aduse pornind de la locul la care se uită vizitatorul. Cadrele sunt desfăcute pe un fir
   separat (clip-worker.js), deci pagina nu se poticnește, iar pe ecran ajung mereu cadre mari.

   Cadrele mari desfăcute rămân la firul separat; pagina cere ca imagine doar cadrele pe care le arată (cel de acum și cele spre
   care merge mișcarea) și ține doar câteva, deci folosește puțină memorie video.

   Merge unde navigatorul are WebCodecs și AV1 (Chrome, Edge, Firefox de calculator). Unde nu are, `state` devine 'off' și cine
   folosește clipul trece pe pozele separate, ca înainte. La fel dacă ceva se strică pe parcurs.

   const c = openClip({ base, n, seg, gop, w, h, lo, loop, ver, pre, all }, onchange)      (pre = câte bucăți se aduc din timp în față;
                                                                                            all = se aduce tot clipul în fundal: da / nu / funcție)
     c.state        'wait' (încă nu are niciun cadru) | 'on' | 'off'
     c.want(p, v, x) unde e acum (în cadre, cu zecimale), cu ce viteză se mișcă (cadre pe secundă) și ce cadre mai trebuie ținute
                    (cele de pe ecran); se cheamă la fiecare cadru desenat
     c.pick(p, o)   ce se arată la poziția p: completează o = { a, ra, b, rb, t, hi } (cadrul a cu imaginea ra; dacă b ≠ a, vecinul
                    lui și cât s-a ajuns între ei) și întoarce true; false dacă nu are încă nimic
     c.has(i)       are ceva de arătat pentru cadrul i?      c.get(i)   imaginea cadrului i (mare sau mică) sau null
     c.rest()       eliberează cadrele mari cât clipul nu e pe ecran (la următorul want se desfac din nou)
     c.close()      eliberează tot */
export const CODEC = 'av01.0.08M.08';   // AV1, profilul obișnuit, 8 biți

// poate navigatorul acesta să desfacă filmul comprimat? (răspunsul se ține minte)
let can = null;
export const canClip = () => can || (can = (typeof Worker !== 'function' || typeof VideoDecoder !== 'function' || !VideoDecoder.isConfigSupported ? Promise.resolve(false)
  : VideoDecoder.isConfigSupported({ codec: CODEC, codedWidth: 1920, codedHeight: 1080, hardwareAcceleration: 'prefer-software' }).then(r => !!(r && r.supported), () => false)));

/* Calculatoare fără placă video (desenul se face în procesor: mașini virtuale, accelerare oprită): acolo transformarea unui cadru în
   imagine se face pe firul separat, în procesor, și se cer mai puține cadre deodată (altfel s-ar înfunda tocmai desenul paginii).
   Pe calculatoarele obișnuite o face placa video, aproape pe gratis. (window.__clipSoft = true / false alege cu mâna, pentru probe.) */
let soft = null;
const softGL = () => {
  if (typeof window !== 'undefined' && window.__clipSoft !== undefined) return !!window.__clipSoft;
  if (soft !== null) return soft; soft = false;
  try { const c = document.createElement('canvas'), g = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!g) soft = true; else { const e = g.getExtension('WEBGL_debug_renderer_info'), r = e ? String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)) : ''; soft = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(r); const l = g.getExtension('WEBGL_lose_context'); if (l) l.loseContext(); } } catch (_) {}
  return soft;
};

export function openClip(o, onchange) {
  const n = o.n, GOP = o.gop, SEG = o.seg, NG = Math.ceil(n / GOP), NS = Math.ceil(n / SEG), loop = !!o.loop;
  const hi = new Array(n).fill(null), lo = new Array(n).fill(null), gh = new Uint8Array(NG), gl = new Uint8Array(NG), seg = new Uint8Array(NS), held = new Set();
  // (și un clip care nu poate porni are toate funcțiile, fără efect: cine îl folosește nu trebuie să verifice)
  const C = { state: 'wait', n, why: '', loN: 0, want() {}, pick() { return false; }, has() { return false; }, get() { return null; }, rest() {}, close() {}, stat: null }, SOFT = softGL();
  let w = null, ok = false, sig = '', bsig = '', loOk = false, closed = false, rested = false, gms = 0, gn = 0;   // (gms = cât durează desfăcutul unui grup, în medie; gn = câte s-au desfăcut)
  let lat = SOFT ? .09 : .045, spd = 0, segT = 0; const reqT = new Map();   // lat = cât durează, în secunde, de la cererea unui cadru până la imaginea lui (măsurat)
  const allNow = () => (typeof o.all === 'function' ? !!o.all() : o.all !== false);   // se aduce tot clipul în fundal? (altfel doar bucățile din jurul locului curent)
  const at = i => (loop ? ((i % n) + n) % n : i >= 0 && i < n ? i : -1), gAt = g => (loop ? ((g % NG) + NG) % NG : g >= 0 && g < NG ? g : -1);
  const dropHi = i => { if (hi[i]) { hi[i].close(); hi[i] = null; held.delete(i); } };
  const drop = () => { if (w) { try { w.terminate(); } catch (_) {} w = null; } for (let i = 0; i < n; i++) { dropHi(i); if (lo[i]) { lo[i].close(); lo[i] = null; } } C.loN = 0; };
  const off = why => { if (C.state === 'off') return; C.state = 'off'; C.why = why || ''; drop(); if (onchange) onchange(); };
  Object.defineProperty(C, 'stat', { get: () => ({ state: C.state, why: C.why, soft: SOFT, lat: Math.round(lat * 1000), gms: Math.round(gms), gn, hi: held.size, dec: gh.reduce((s, x) => s + (x === 2 ? 1 : 0), 0), lo: C.loN, seg: seg.reduce((s, x) => s + x, 0), lo_ok: loOk }) });
  if (typeof Worker !== 'function' || typeof VideoDecoder !== 'function') { C.state = 'off'; C.why = 'webcodecs'; return C; }
  try { w = new Worker(new URL('./clip-worker.js', import.meta.url)); } catch (_) { C.state = 'off'; C.why = 'worker'; return C; }
  const boot = setTimeout(() => { if (!ok) off('pornire'); }, 15000);
  w.onerror = () => off('worker');
  w.onmessage = e => {
    const m = e.data; if (closed) { if (m.bm) m.bm.close(); return; }
    if (m.t === 'f') {
      if (m.k === 'h') { if (rested) { m.bm.close(); return; } if (hi[m.i]) hi[m.i].close(); hi[m.i] = m.bm; held.add(m.i); bsig = '';
        const t0 = reqT.get(m.i); if (t0 !== undefined) { reqT.delete(m.i); const d = (performance.now() - t0) / 1000; if (gh[Math.floor(m.i / GOP)] === 2 && d < 1) lat += (d - lat) * .15; } }   // (cât a durat de la cerere la imagine, când grupul era deja desfăcut)
      else { if (lo[m.i]) lo[m.i].close(); else C.loN++; lo[m.i] = m.bm; }
      if (C.state === 'wait') C.state = 'on'; if (onchange) onchange();
    } else if (m.t === 'g') {   // grupul e desfăcut (cadrele mari stau la firul separat); sosit în repaus, e socotit nefăcut
      if (m.k === 'h') { gms += (m.ms - gms) * .2; gn++; if (rested) w.postMessage({ t: 'ev', k: 'h', g: [m.g] }); else { gh[m.g] = 2; if (onchange) onchange(); } } else gl[m.g] = 2;
    }
    else if (m.t === 's') seg[m.s] = 1;
    else if (m.t === 'lo') loOk = true;
    else if (m.t === 'ok') { ok = true; clearTimeout(boot); sig = bsig = ''; if (C.last) C.want(C.last[0], C.last[1], C.last[2]); }
    else if (m.t === 'no' || m.t === 'err') { clearTimeout(boot); off(m.why); }
  };
  w.postMessage({ t: 'open', base: new URL(o.base, location.href).href, q: o.ver ? '?' + o.ver : '', n, seg: SEG, gop: GOP, w: o.w, h: o.h, lo: o.lo || null, codec: o.codec || CODEC, loop, soft: SOFT });

  // grupurile de care nu mai e nevoie (keep = cele care rămân): firul separat le poate elibera și desface din nou la nevoie
  const evict = (G, k, keep) => { const ev = []; for (let g = 0; g < NG; g++) if (G[g] === 2 && !keep.has(g)) { if (k === 'l') for (let i = g * GOP, e = Math.min(n, i + GOP); i < e; i++) if (lo[i]) { lo[i].close(); lo[i] = null; C.loN--; } G[g] = 0; ev.push(g); } if (ev.length && w) w.postMessage({ t: 'ev', k, g: ev }); };
  /* Ce se cere la fiecare cadru desenat. Un cadru cerut acum ajunge pe ecran abia peste `lat` secunde (desfăcut + transformat în
     imagine + trimis), deci se cere cadrul sub care va fi „mâna” atunci (aim), iar grupurile se desfac și mai din timp (far). Cât
     mișcarea e lentă, asta înseamnă chiar cadrul de aici și vecinii lui; la viteză mare, cadrele din față, pe drumul mișcării. */
  C.want = (pos, vel, extra) => {
    C.last = [pos, vel || 0, extra]; if (C.state === 'off' || !ok || !w) return;
    rested = false;
    const v = vel || 0, sp = spd = Math.abs(v), dir = v < 0 ? -1 : 1, here = Math.round(pos), cl = (x, m) => Math.max(-m, Math.min(m, x));
    const tb = Math.min(.22, lat * 1.25 + .02), aim = Math.round(pos + cl(v * tb, GOP * 2)), far = Math.round(pos + cl(v * (tb + .12), GOP * 3)), step = Math.max(1, Math.round(sp / 60));
    const g0 = Math.floor(here / GOP), ga = Math.floor(aim / GOP), gf = Math.floor(far / GOP), H = [], L = [], S = [], R = [], kh = new Set(), kl = new Set(), kb = new Set();
    const add = (Q, g) => { g = gAt(g); if (g >= 0 && !Q.includes(g)) Q.push(g); };
    // grupurile de desfăcut, în ordine: de la cel țintit până unde va ajunge mișcarea, încă unul în față, cel de aici; cel din spate doar
    // cât stă pe loc sau e la marginea grupului
    for (let g = ga; ; g += dir) { add(H, g); if (g === gf) break; }
    add(H, gf + dir); add(H, g0);
    for (let g = g0 + dir; g !== ga && (ga - g) * dir > 0; g += dir) add(H, g);   // (cele dintre „aici” și țintă: la urmă, dar nu se aruncă dacă sunt deja desfăcute)
    if (sp < 8 || Math.floor((here - 3 * dir) / GOP) !== g0) add(H, g0 - dir);
    // cadrele cerute ca imagine, în ordine: cel țintit, următorul pe drum, cel de aici; la mișcare lentă și cei doi vecini (pentru trecerea topită)
    const now = performance.now(), want = i => { i = at(i); if (i >= 0) { kb.add(i); if (!hi[i] && !R.includes(i)) { R.push(i); if (!reqT.has(i)) reqT.set(i, now); } } };
    const fl = Math.floor(pos);
    want(aim); want(aim + step * dir); want(here); if (sp < 30) { want(fl); want(fl + 1); } if (!SOFT) want(aim + 2 * step * dir);
    if (extra) extra.forEach(i => { if (i >= 0 && i < n) { const g = Math.floor(i / GOP); add(H, g); kl.add(g); want(i); } });   // (cele de pe ecran se țin mereu)
    H.forEach(g => { kh.add(g); const s = Math.floor(g * GOP / SEG); if (!S.includes(s)) S.push(s); });
    const need = S.length; for (let d = 1; d <= (o.pre || 0); d++) { let s = Math.floor(gAt(gf) * GOP / SEG) + d * dir; s = loop ? ((s % NS) + NS) % NS : s; if (s >= 0 && s < NS && !S.includes(s)) S.push(s); }   // (și câteva bucăți din față, aduse din timp)
    // cadrele mici: doar cât lipsește vreo bucată mare de aici (rețea înceată); altfel nu se desfac deloc
    if (S.slice(0, need).some(s => !seg[s])) { add(L, g0); add(L, ga); for (let d = 1; d <= 2; d++) add(L, ga + d * dir); add(L, g0 - dir); }
    L.forEach(g => kl.add(g));
    evict(gh, 'h', kh); evict(gl, 'l', kl);
    const pw = loop ? ((pos % n) + n) % n : pos;
    held.forEach(i => { let d = Math.abs(i - pw); if (loop) d = Math.min(d, n - d); if (d > 2.5 && !kb.has(i)) dropHi(i); });   // imaginile rămase departe se eliberează
    if (reqT.size > 64) reqT.forEach((t, i) => { if (!kb.has(i)) reqT.delete(i); });
    // plasă de siguranță: grupul de aici e desfăcut de câteva secunde și tot nu a venit nicio imagine → pozele separate
    if (C.state === 'wait') { if (gh[gAt(g0)] === 2) { if (!segT) segT = now; else if (now - segT > 6000) return off('fără cadre'); } else segT = 0; }
    const hq = H.filter(g => gh[g] !== 2), lq = L.filter(g => gl[g] !== 2), all = allNow(), s2 = hq.join() + '|' + lq.join() + '|' + S.join() + '|' + all, b2 = R.join();
    if (s2 !== sig) { sig = s2; w.postMessage({ t: 'q', h: hq, l: lq, s: S, all }); }
    if (b2 !== bsig) { bsig = b2; w.postMessage({ t: 'b', list: R }); }
  };
  const local = i => seg[Math.floor(i / SEG)] === 1;   // bucata cadrului i a sosit: cadrul mare vine în câteva sutimi de secundă
  C.has = i => { i = at(i); return i >= 0 && !!(hi[i] || lo[i]); };
  C.get = i => { i = at(i); return i < 0 ? null : hi[i] || lo[i]; };
  C.pick = (pos, out) => {
    const fl = Math.floor(pos), t = pos - fl, a = at(fl), b = at(fl + 1), ha = a >= 0 ? hi[a] : null, hb = b >= 0 ? hi[b] : null;
    const one = (i, r, big) => { out.a = out.b = i; out.ra = out.rb = r; out.t = 0; out.hi = big; return true; };
    if (ha && (hb || t < .001)) { if (!hb || t < .001) return one(a, ha, true); out.a = a; out.ra = ha; out.b = b; out.rb = hb; out.t = t; out.hi = true; return true; }
    // cel mai apropiat cadru mare, până la câteva cadre distanță
    const tol = Math.min(24, Math.max(5, Math.ceil(spd * .06)));   // (la viteză mare, cadrul mare cel mai apropiat poate fi și ceva mai departe)
    let jh = -1, dh = 99; for (let d = -tol; d <= tol + 1; d++) { const j = at(fl + d); if (j >= 0 && hi[j]) { const dd = Math.abs(fl + d - pos); if (dd < dh) { dh = dd; jh = j; } } }
    const here = at(Math.round(pos));
    if (jh >= 0 && (dh <= 1 || (here >= 0 && local(here)))) return one(jh, hi[jh], true);   // mare și aproape; sau mare, cu puțin în urmă, cât se desface cel de aici
    let jl = -1, dl = 99; for (let d = -1; d <= 2; d++) { const j = at(fl + d); if (j >= 0 && lo[j]) { const dd = Math.abs(fl + d - pos); if (dd < dl) { dl = dd; jl = j; } } }
    if (jl >= 0) return one(jl, lo[jl], false);                                             // bucata mare încă nu a sosit: cadrul mic de aici
    if (jh >= 0) return one(jh, hi[jh], true);
    for (let d = 2; d <= 96; d++) for (const s of [1, -1]) { const j = at(Math.round(pos) + s * d); if (j >= 0 && (hi[j] || lo[j])) return one(j, hi[j] || lo[j], !!hi[j]); }
    return false;
  };
  // cât nu e pe ecran (altă secțiune, altă vedere), cadrele mari se eliberează; la întoarcere se desfac din nou, în câteva sutimi de secundă
  C.rest = () => { if (C.state === 'off' || !ok || !w || rested) return; rested = true; evict(gh, 'h', new Set()); held.forEach(dropHi);
    sig = bsig = ''; w.postMessage({ t: 'b', list: [] }); w.postMessage({ t: 'q', h: [], l: [], s: [], all: allNow() }); };
  C.close = () => { closed = true; clearTimeout(boot); drop(); if (C.state !== 'off') C.state = 'off'; };
  return C;
}

/* Aduce din timp, în memoria navigatorului, începutul unui clip (filmul mic și bucățile din jurul cadrului i): când vizitatorul
   ajunge acolo, primele cadre mari sunt gata aproape imediat. */
export function warmClip(o, i, more) {
  if (typeof fetch !== 'function' || typeof VideoDecoder !== 'function') return Promise.resolve();
  const NS = Math.ceil(o.n / o.seg), q = o.ver ? '?' + o.ver : '', s0 = Math.floor(i / o.seg), L = [o.base + 'lo.bin' + q];
  for (let d = 0; d <= (more || 0); d++) for (const s of d ? [s0 + d, s0 - d] : [s0]) { const j = o.loop ? ((s % NS) + NS) % NS : s; if (j >= 0 && j < NS) { const u = o.base + 'h_' + String(j).padStart(2, '0') + '.bin' + q; if (!L.includes(u)) L.push(u); } }
  return L.reduce((p, u) => p.then(() => fetch(u).then(r => r.arrayBuffer()).catch(() => {})), Promise.resolve());
}
