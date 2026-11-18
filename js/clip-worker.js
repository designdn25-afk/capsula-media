/* Capsula România — firul separat care desface cadrele unui „film comprimat” (vezi clip.js).
   Primește de la pagină ce bucăți să aducă, ce grupuri de cadre să desfacă și ce cadre vrea pe ecran, în ordinea în care e nevoie
   de ele. Cadrele mari desfăcute rămân aici (în forma lor compactă, YUV, în memoria obișnuită); pagina primește ca imagine gata de
   desenat doar cadrele pe care chiar le arată, deci ține foarte puțină memorie video. Tot ce e greu (adusul bucăților, desfăcutul)
   se face aici, în afara firului principal, deci pagina nu se poticnește.

   Mesaje primite:  { t:'open', base, q, n, seg, gop, w, h, lo:[w,h]|null, codec, loop }
                    { t:'q', h:[grupuri…], l:[grupuri…], s:[bucăți…], all }     ce se vrea desfăcut / adus acum, în ordine
                    { t:'b', list:[cadre…] }                                    cadrele mari cerute ca imagine, în ordine
                    { t:'ev', k:'h'|'l', g:[grupuri…] }                         grupuri de care pagina nu mai are nevoie
   Mesaje trimise:  { t:'ok' } | { t:'no', why }     se poate / nu se poate (navigator fără WebCodecs sau fără AV1)
                    { t:'f', k, i, bm }              cadrul i ca imagine (mare, la cerere; mic, îndată ce e desfăcut)
                    { t:'g', k, g }                  grupul g e desfăcut
                    { t:'s', s } | { t:'lo' }        a sosit bucata s / filmul mic
                    { t:'err', why }                 ceva nu a mers: pagina trece pe pozele separate */
'use strict';
let C = null, dead = false, segs = [], lo = null, segQ = [], all = false, act = 0;
const T = { h: null, l: null };

function fail(why) { if (dead) return; dead = true; try { postMessage({ t: 'err', why: String(why && why.message || why) }); } catch (_) {} }
const conf = (w, h) => ({ codec: C.codec, codedWidth: w, codedHeight: h, hardwareAcceleration: 'prefer-software', optimizeForLatency: true });
const shut = f => { try { f.close(); } catch (_) {} };

// un fișier .bin: „CPV1”, numărul de cadre (u16), 0 (u16), mărimile cadrelor (u32; bitul de sus = cadru-cheie), cadrele
function parse(buf, want) {
  const dv = new DataView(buf); if (buf.byteLength < 8 || dv.getUint32(0, false) !== 0x43505631) throw new Error('format');
  const n = dv.getUint16(4, true); if (want && n !== want) throw new Error('cadre'); let off = 8 + 4 * n; const fr = [];
  for (let i = 0; i < n; i++) { const sz = dv.getUint32(8 + 4 * i, true) & 0x7fffffff; fr.push(new Uint8Array(buf, off, sz)); off += sz; }
  if (off !== buf.byteLength) throw new Error('lungime'); return fr;
}
const get = url => fetch(url).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('http ' + r.status))));

/* ---------- adusul bucăților: întâi bucata de aici, singură (pe o legătură înceată, tot ce vine deodată cu ea o întârzie), apoi
   filmul mic, singur, apoi celelalte bucăți cerute de pagină și (dacă s-a cerut tot) restul, de la cele mai apropiate ---------- */
function fetchMore() {
  if (dead) return;
  const f = segQ.length ? segs[segQ[0]] : null;
  if (f && f.st === 0 && act === 0 && !(lo && lo.st === 1)) loadSeg(segQ[0]);
  if (f && f.st === 1) return;
  if (lo && lo.st === 0 && act === 0 && segQ.length) loadLo();
  if (lo && lo.st === 1) return;
  while (!dead && act < 3) {
    let s = -1; for (const x of segQ) if (segs[x] && segs[x].st === 0) { s = x; break; }
    if (s < 0 && all && act < 2) { const c = segQ.length ? segQ[0] : 0, m = segs.length; for (let d = 1; d < m && s < 0; d++) for (const k of [c + d, c - d]) { const j = C.loop ? ((k % m) + m) % m : k; if (segs[j] && segs[j].st === 0) { s = j; break; } } }   // (restul clipului: cel mult două deodată, ca o bucată cerută să aibă mereu loc)
    if (s < 0) return;
    loadSeg(s);
  }
}
function loadSeg(s) {
  const S = segs[s]; S.st = 1; act++;
  get(C.base + 'h_' + String(s).padStart(2, '0') + '.bin' + C.q).then(buf => { act--; try { S.fr = parse(buf, Math.min(C.seg, C.n - s * C.seg)); } catch (x) { return fail('bucata ' + s + ': ' + x.message); } S.st = 2; postMessage({ t: 's', s }); pump(T.h); fetchMore(); },
    e => { act--; if (dead) return; if (++S.err >= 4) return fail('bucata ' + s + ': ' + (e && e.message)); S.st = 3; setTimeout(() => { S.st = 0; fetchMore(); }, 800 * S.err); fetchMore(); });
}
function loadLo() {
  lo.st = 1;
  get(C.base + 'lo.bin' + C.q).then(buf => { try { lo.fr = parse(buf, C.n); } catch (_) { lo.st = 3; fetchMore(); return; } lo.st = 2; postMessage({ t: 'lo' }); pump(T.l); fetchMore(); },
    () => { if (dead) return; lo.st = 3; fetchMore(); if (++lo.err < 4) setTimeout(() => { lo.st = 0; fetchMore(); }, 800 * lo.err); });   // fără filmul mic se poate merge: rămân cadrele mari
}

/* ---------- desfăcutul: câte un grup de cadre (de la un cadru-cheie până la următorul) o dată, pe fiecare pistă ---------- */
const ready = (tr, g) => (tr.k === 'h' ? (segs[Math.floor(g * C.gop / C.seg)] || {}).st === 2 : lo && lo.st === 2);
const data = (tr, i) => (tr.k === 'h' ? segs[Math.floor(i / C.seg)].fr[i % C.seg] : lo.fr[i]);
function pump(tr) {
  if (dead || !tr || tr.busy >= 0) return;
  let g = -1; for (const x of tr.q) if (!tr.fin.has(x) && ready(tr, x)) { g = x; break; }
  if (g < 0) return;
  try {
    if (!tr.dec || tr.dec.state === 'closed') { tr.dec = new VideoDecoder({ output: f => onFrame(tr, f), error: e => fail(e) }); }
    if (tr.dec.state === 'unconfigured') tr.dec.configure(conf(tr.w, tr.h));
    const i0 = g * C.gop, i1 = Math.min(C.n, i0 + C.gop); tr.busy = g; tr.left = i1 - i0; tr.flushed = false; tr.t0 = performance.now();
    for (let i = i0; i < i1; i++) tr.dec.decode(new EncodedVideoChunk({ type: i === i0 ? 'key' : 'delta', timestamp: i, data: data(tr, i) }));
    tr.timer = setTimeout(() => fail('prea încet'), 8000);
    tr.dec.flush().then(() => { tr.flushed = true; done(tr); }, e => fail(e));
  } catch (e) { fail(e); }
}
function onFrame(tr, f) {
  const i = f.timestamp;
  if (tr.k === 'h') { const old = tr.yuv.get(i); if (old) shut(old); tr.yuv.set(i, f); tr.left--; serve(); return; }   // cadrul mare rămâne aici până îl cere pagina
  tr.pend++;                                                                                                          // cadrul mic pleacă îndată ca imagine
  createImageBitmap(f).then(bm => { shut(f); tr.pend--; tr.left--; if (dead) { bm.close(); return; } postMessage({ t: 'f', k: 'l', i, bm }, [bm]); done(tr); },
    e => { shut(f); tr.pend--; fail(e); });
}
function done(tr) {
  if (dead || tr.busy < 0 || !tr.flushed || tr.pend) return;
  clearTimeout(tr.timer); if (tr.left !== 0) return fail('cadre lipsă');
  const g = tr.busy; tr.busy = -1; tr.fin.add(g); postMessage({ t: 'g', k: tr.k, g, ms: Math.round(performance.now() - tr.t0) }); pump(tr);
}
// cadrele mari cerute de pagină: cele deja desfăcute pleacă pe rând ca imagini (cel mult trei în lucru deodată). De obicei imaginea
// o face placa video (createImageBitmap); pe un calculator fără placă video (C.soft) se face aici, în procesor, pe o pânză obișnuită.
let oc = null, og = null;
function serve() {
  const tr = T.h;
  while (!dead && tr && tr.conv < (C.soft ? 1 : 3) && tr.want.length) {
    const k = tr.want.findIndex(i => tr.yuv.has(i)); if (k < 0) return;
    const i = tr.want.splice(k, 1)[0], f = tr.yuv.get(i);
    if (C.soft && typeof OffscreenCanvas === 'function') {
      try { if (!oc) { oc = new OffscreenCanvas(C.w >> 1, C.h >> 1); og = oc.getContext('2d', { willReadFrequently: true, alpha: false }); } og.drawImage(f, 0, 0, C.w >> 1, C.h >> 1); const bm = oc.transferToImageBitmap(); postMessage({ t: 'f', k: 'h', i, bm }, [bm]); continue; } catch (_) { C.soft = false; }   // (la jumătate de mărime: fără placă video, un cadru întreg ar ține firul ocupat prea mult)
    }
    tr.conv++;
    createImageBitmap(f).then(bm => { tr.conv--; tr.bad = 0; if (dead) bm.close(); else postMessage({ t: 'f', k: 'h', i, bm }, [bm]); serve(); },
      e => { tr.conv--; if (tr.yuv.get(i) === f && ++tr.bad >= 3) return fail('imagine: ' + (e && e.message)); serve(); });   // (un cadru eliberat între timp nu e o greșeală; trei refuzuri la rând sunt: pagina trece pe poze)
  }
}

onmessage = async e => {
  const m = e.data; if (dead) return;
  if (m.t === 'open') {
    C = m;
    if (typeof VideoDecoder !== 'function' || typeof EncodedVideoChunk !== 'function' || typeof createImageBitmap !== 'function') return postMessage({ t: 'no', why: 'webcodecs' });
    try {
      const ok = async (w, h) => { const r = await VideoDecoder.isConfigSupported(conf(w, h)); return !!(r && r.supported); };
      if (!(await ok(m.w, m.h)) || (m.lo && !(await ok(m.lo[0], m.lo[1])))) return postMessage({ t: 'no', why: 'codec' });
    } catch (x) { return postMessage({ t: 'no', why: String(x && x.message || x) }); }
    const mk = (k, w, h) => ({ k, w, h, dec: null, busy: -1, q: [], fin: new Set(), pend: 0, left: 0, flushed: false, timer: 0, yuv: new Map(), want: [], conv: 0, bad: 0 });
    T.h = mk('h', m.w, m.h); if (m.lo) { T.l = mk('l', m.lo[0], m.lo[1]); lo = { st: 0, fr: null, err: 0 }; }
    segs = Array.from({ length: Math.ceil(m.n / m.seg) }, () => ({ st: 0, fr: null, err: 0 }));
    postMessage({ t: 'ok' });   // (adusul începe la prima cerere a paginii: abia atunci se știe care e bucata de aici)
  } else if (!C || !T.h) return;
  else if (m.t === 'q') { if (m.h) T.h.q = m.h; if (m.l && T.l) T.l.q = m.l; if (m.s) segQ = m.s; all = !!m.all; fetchMore(); pump(T.h); pump(T.l); }
  else if (m.t === 'b') { T.h.want = m.list; serve(); }
  else if (m.t === 'ev') { const tr = T[m.k]; if (!tr) return; m.g.forEach(g => { tr.fin.delete(g); if (m.k === 'h' && g !== tr.busy) for (let i = g * C.gop, x = Math.min(C.n, i + C.gop); i < x; i++) { const f = tr.yuv.get(i); if (f) { shut(f); tr.yuv.delete(i); } } }); }
};
