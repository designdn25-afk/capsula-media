// Grădina cu case model (#gradina): o scenă 3D în care vizitatorul trece de la o casă la alta și intră în fiecare.
// Marcajul și stilurile: surse/final/parts/gradina.html. Casele: js/gradina-data.js + js/h_<nume>.js (vezi surse/final/CASE-3D.md).
// Scena de bază (cer, gazon, soare, seara): js/gscene.js; grădina: js/genv.js. Datele afișate (m², dimensiuni, preț) vin din window.CAT.
// În casă se intră la nivelul ochilor (te uiți în jur, treci dintr-o cameră în alta); casele cu fotografii reale 360° (js/pano.js)
// le arată peste machetă, aliniate cu ea. „Plan” = vederea de sus, cu acoperișul ridicat.
import { THREE, clamp, lerp, ease, webglOK, fit } from './kit.js';
import { createGScene } from './gscene.js';
import { buildGarden } from './genv.js';
import { createPano } from './pano.js';
import { CASE, GRADINA, VEDERI, ROTIRI } from './gradina-data.js';

window.__gdMod = 1;   // semn pentru pagina că modulul s-a încărcat (altfel pagina arată imaginea de rezervă)
const DEG = Math.PI / 180;
const sec = document.getElementById('gradina');
const fmtA = a => String(a).replace('.', ',') + ' m²';
const catOf = c => (window.CAT || []).find(m => m.c === c) || null;
const priceOf = m => (!m ? '' : m.e ? m.p + ' cu TVA · la comandă' : m.p ? m.p + ' cu TVA · în stoc' : 'Preț pe ofertă');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

if (sec) {
  const go = () => boot().catch(e => { console.error('gradina', e); toStatic(); });
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: '900px 0px' }); io.observe(sec); } else go();
}

/* fără WebGL: o imagine a grădinii și lista caselor */
function toStatic() {
  sec.classList.remove('gd--live'); sec.classList.add('gd--static');
  const im = sec.querySelector('.gd-still'); if (im && im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); }
  const list = sec.querySelector('.gd-list'); if (!list || list.children.length) return;
  list.innerHTML = CASE.map(c => { const m = catOf(c.cod); return `<button type="button" class="gd-li" data-c="${esc(c.cod)}"><b>${esc(c.cod)}</b><span>${m ? fmtA(m.a) : ''}</span><i>${m ? esc(m.d) : ''}</i><em>${esc(priceOf(m))}</em></button>`; }).join('');
  list.querySelectorAll('.gd-li').forEach(b => { b.onclick = () => { if (window.CATopen) window.CATopen(b.dataset.c); }; });
}

async function boot() {
  const $ = s => sec.querySelector(s), stage = $('.gd-stage'), canvas = $('.gd-gl'), pinBox = $('.gd-pins'), labBox = $('.gd-labels'), card = $('.gd-card'), chipsEl = $('.gd-chips');
  if (!webglOK()) { toStatic(); return; }
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(hover:hover) and (pointer:fine)');
  const G = createGScene(canvas, { shadowSize: Math.min(innerWidth, innerHeight) < 700 ? 1024 : 2048, half: 48 });
  const cam = G.camera; G.renderer.shadowMap.autoUpdate = false;
  let dead = false; canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); dead = true; toStatic(); });

  /* ---------- casele ---------- */
  const mods = await Promise.allSettled(CASE.map(c => import('./' + c.mod + '.js')));
  const H = [];
  for (let i = 0; i < mods.length; i++) {
    const r = mods[i]; if (r.status !== 'fulfilled') continue;
    await new Promise(res => setTimeout(res, 0));   // câte o casă pe rând, ca pagina să nu se poticnească
    try {
      const c = CASE[i], api = r.value.build(G.M), inf = r.value.info || {}, s = api.size || { w: inf.w, d: inf.d, h: inf.h, cz: 0 };
      try { mergeHouse(api); } catch (e) { console.warn('gradina: casa ' + c.cod + ' a rămas neunită', e); }
      const g = new THREE.Group(); g.position.set(c.x, 0, c.z); g.rotation.y = c.rot * DEG; g.add(api.root); G.scene.add(g);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0, s.h / 2, s.cz || 0); g.add(hit);
      g.updateMatrixWorld(true);
      H.push({ c, cat: catOf(c.cod), api, g, s, hit, k: 0, ring: null, ro: 0, side: -1, sideP: -1, center: g.localToWorld(new THREE.Vector3(0, 0, s.cz || 0)), top: g.localToWorld(new THREE.Vector3(0, s.h + 1.5, s.cz || 0)) });
    } catch (e) { console.warn('gradina: casa ' + CASE[i].cod + ' nu s-a putut construi', e); }
  }
  if (!H.length || dead) { toStatic(); return; }
  const env = buildGarden(G, H);
  // din ce parte se uită camera la fiecare casă: de acolo de unde nu stă altă casă în față
  const blocked = (h, azDeg, dist) => { const a = azDeg * DEG, dx = Math.sin(a) * dist, dz = Math.cos(a) * dist; let pen = 0;
    [...H, { center: { x: 0, z: 0 }, s: { h: 2.5 } }].forEach(o => { if (o === h) return; const ox = o.center.x - h.center.x, oz = o.center.z - h.center.z, t = clamp((ox * dx + oz * dz) / (dist * dist)), d = Math.hypot(ox - dx * t, oz - dz * t); if (d < 10) pen += (10 - d) * o.s.h; });   // ultimul = copacul din rond
    return pen + Math.abs(h.center.x + dx) * .01; };   // la egalitate: partea dinspre aleea din mijloc
  H.forEach(h => { const r = h.c.rot, lg = h.s.w >= h.s.d; h.side = blocked(h, r - 30, 30) <= blocked(h, r + 30, 30) ? -1 : 1; h.sideP = blocked(h, r - (lg ? 56 : 26), 52) <= blocked(h, r + (lg ? 56 : 26), 52) ? -1 : 1; });

  /* ---------- elementele din pagină ---------- */
  const cSer = $('.gd-c-ser'), cName = $('.gd-c-name'), cNota = $('.gd-c-nota'), cDesc = $('.gd-c-desc'), cA = $('.gd-c-a'), cD = $('.gd-c-d'), cL = $('.gd-c-l'), cP = $('.gd-c-p'),
    cRooms = $('.gd-c-rooms'), cRoomsT = $('.gd-c-rooms dt'), cRoomsV = $('.gd-c-rooms dd'), lvlBox = $('.gd-c-lvl'), lvlBtns = [...sec.querySelectorAll('.gd-c-lvl button')],
    viewBox = $('.gd-c-view'), viewBtns = [...sec.querySelectorAll('.gd-c-view button')], cReal = $('.gd-c-real'),
    enterBtn = $('.gd-enter'), offer = $('.gd-offer'), photos = $('.gd-photos'), tur = $('.gd-tur'), tourBtn = $('.gd-tour'), dnBtns = [...sec.querySelectorAll('.gd-dn button')], hint = $('.gd-hint');
  chipsEl.innerHTML = `<button type="button" class="gd-chip on" data-i="-1" aria-pressed="true">Toată grădina</button>` + H.map((h, i) => `<button type="button" class="gd-chip" data-i="${i}" aria-pressed="false">${esc(h.c.cod)}</button>`).join('');
  const chips = [...chipsEl.children];
  const pins = H.map((h, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'gd-pin'; b.dataset.i = i; b.innerHTML = `<b>${esc(h.c.cod)}</b>${h.cat ? `<span>${fmtA(h.cat.a)}</span>` : ''}`; b.setAttribute('aria-label', 'Casa ' + h.c.cod + (h.cat ? ', ' + fmtA(h.cat.a) : '')); pinBox.appendChild(b); return b; });
  let rooms = [];

  /* ---------- stare ---------- */
  const GZ = GRADINA.centruZ, CAMK = ['tx', 'ty', 'tz', 'az', 'el', 'fw', 'fh', 'dist'], cur = {}, from = {}, to = {};
  let mode = 'all', sel = -1, lvl = 1, W = 0, Hh = 0, mP = 0, tr = 1, dur = 1.7, uaz = 0, uel = 0, tuaz = 0, tuel = 0, offX = 0, offY = 0, tOffX = 0, tOffY = 0,
    time = 10.6, timeGoal = 10.6, hover = -1, visible = false, raf = 0, last = 0, awake = 30, needMeasure = 2, started = false, auto = null, drag = null, lastN = -1, snap = 0, freeW = 1, freeH = 1, px = 3e6, slow = 0;
  const wake = () => { awake = 40; kick(); };
  // în casă: 'walk' = la nivelul ochilor, 'plan' = de sus, cu acoperișul ridicat
  let inView = 'walk', pOp = 0, pA = null, pH = 0, pR = null, pAI = false, aiOn = false, noPano = false, backT = 0;   // pR = cât cuprinde imaginea vederii din afară (null = fotografie 360°)
  const W3 = { pos: new THREE.Vector3(), from: new THREE.Vector3(), to: new THREE.Vector3(), k: 1, yaw: 0, tyaw: 0, pitch: -4, tpitch: -4 },
    blend = { k: 1, dur: 1.6, fov0: 34, p0: new THREE.Vector3(), q0: new THREE.Quaternion() }, tP = new THREE.Vector3(), tQ = new THREE.Quaternion(), pano = createPano(G.renderer);
  const walking = () => mode === 'in' && inView === 'walk';
  const startBlend = d => { blend.p0.copy(cam.position); blend.q0.copy(cam.quaternion); blend.fov0 = cam.fov; blend.k = rm || !started ? 1 : 0; blend.dur = d; };
  const fam = (m, base) => m === base || (G.M.clones || []).some(([a, b]) => b === m && a === base);

  /* punctele din care se vede interiorul unei case (o singură dată pe casă) */
  function buildWalk(h) {
    if (h.walk) return h.walk;
    const pts = [], VT = window.VTN, pn = h.c.pano, M = G.M; h.g.updateMatrixWorld(true);
    if (pn && VT) pn.pts.forEach(([n, k]) => {   // fotografii reale: chiar locurile din care s-a fotografiat
      const d = VT[k]; if (!d) return; const kn = (window.VTNIGHT || {})[k], dn = kn && VT[kn];
      pts.push({ n, p: h.g.localToWorld(new THREE.Vector3(d.p[0] - pn.x0, pn.ochi, d.p[1] + pn.z0)), yaw: h.c.rot + d.H + 180 - d.v[0], pitch: d.v[1], k, H: d.H, kn: dn ? kn : null, Hn: dn ? dn.H : 0 });
    });
    if (!pts.length) {   // machetă: se caută în fiecare cameră un loc liber pe podea și direcția cea mai deschisă
      const ms = []; h.api.root.traverse(o => { if (o.isMesh && o.material && o.material.visible !== false) ms.push(o); });
      const rc = new THREE.Raycaster(), o3 = new THREE.Vector3(), d3 = new THREE.Vector3();
      const cast = (x, y, z, dx, dy, dz, far) => { rc.set(o3.set(x, y, z), d3.set(dx, dy, dz)); rc.far = far; return rc.intersectObjects(ms, false); };
      (h.api.rooms || []).forEach(r => {
        const P = h.g.localToWorld(new THREE.Vector3(r.x, r.y, r.z)), down = cast(P.x, P.y + .3, P.z, 0, -1, 0, 3.4);
        let f = down.find(x => fam(x.object.material, M.floor)); if (!f) { const w = down.filter(x => fam(x.object.material, M.wood)); f = w[w.length - 1]; }
        const fy = f ? f.point.y : Math.max(.3, P.y - 1.1); let best = null;
        const free = (x, z) => { const d0 = cast(x, fy + 1.5, z, 0, -1, 0, 1.7)[0]; if (!d0 || Math.abs(d0.point.y - fy) > .09) return false;
          for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, dx = Math.sin(a), dz = Math.cos(a); if (cast(x, fy + .35, z, dx, 0, dz, .5).length || cast(x, fy + 1.15, z, dx, 0, dz, .5).length) return false; } return true; };
        search: for (const rad of [0, .4, .8, 1.2, 1.6]) for (let i = 0; i < (rad ? 10 : 1); i++) { const a = i * Math.PI / 5, x = P.x + Math.sin(a) * rad, z = P.z + Math.cos(a) * rad; if (free(x, z)) { best = [x, z]; break search; } }
        const [x, z] = best || [P.x, P.z]; let yaw = h.c.rot, sc = -1;
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, hit = cast(x, fy + 1.5, z, Math.sin(a), 0, Math.cos(a), 14)[0], v = Math.min(hit ? hit.distance : 14, 9) * (!hit || fam(hit.object.material, M.glass) ? .1 : 1); if (v > sc) { sc = v; yaw = a / DEG; } }   // privirea merge spre interior (cea mai lungă direcție care nu dă în geam)
        pts.push({ n: r.n, p: new THREE.Vector3(x, fy + 1.55, z), yaw, pitch: -4, k: null });
      });
      // vizualizări 360° făcute cu AI din aceste puncte (aliniate cu lumea: centrul imaginii privește spre −Z)
      (h.c.ai || []).forEach((f, i) => { if (f && pts[i]) { pts[i].k = 'ai:' + f; pts[i].H = -h.c.rot; pts[i].ai = true; pts[i].kn = null; } });
    }
    h.walk = { pts, i: 0 }; return h.walk;
  }
  function goRoom(i, jump) {
    const w = H[sel] && H[sel].walk, p = w && w.pts[i]; if (!p) return; w.i = i; jump = jump || rm;
    W3.from.copy(jump ? p.p : W3.pos); W3.to.copy(p.p); W3.k = jump ? 1 : 0; if (jump) W3.pos.copy(p.p);
    W3.tyaw = jump ? p.yaw : W3.yaw + ((((p.yaw - W3.yaw) % 360) + 540) % 360 - 180); W3.tpitch = p.pitch; if (jump) { W3.yaw = W3.tyaw; W3.pitch = W3.tpitch; }
    wake();
  }
  // fotografiile mari (6144 px) doar pe ecrane mari, cu placă video care le duce; altfel cele de 4096 px
  const bigPano = G.renderer.capabilities.maxTextureSize >= 6144 && fine.matches && Math.max(innerWidth, innerHeight) * Math.min(devicePixelRatio || 1, 2) > 1500;
  const panoUrl = k => (k.slice(0, 3) === 'ai:' ? 'img/gd/ai/' + k.slice(3) + '.webp' : 'p360/' + k + (bigPano ? '_l' : '_m') + '.webp');

  /* Unde stă camera: toată grădina, o casă văzută din față, o casă văzută de sus (planul). Pentru fiecare există un loc pe ecran
     lat (pv = 0) și unul pe ecran înalt (pv = 1). Locul e fix, iar unghiul de vedere se potrivește după ecran: așa, din același
     loc se poate arăta și o imagine 360° realistă (VEDERI din gradina-data.js), pe orice mărime de ecran. */
  const REF = [{ fov: 34, asp: 1.6 }, { fov: 46, asp: .5 }];
  function view(m, i, l, pv) {
    let L, P;
    if (m === 'all' || i < 0) {
      L = { tx: 0, ty: 1, tz: GZ + 3, az: 0, el: 31, fw: 82, fh: 47 }; P = { tx: 0, ty: 1, tz: GZ + 2, az: 0, el: 50, fw: 50, fh: 78 };
    } else {
      const h = H[i], s = h.s, r = h.c.rot, c = h.center, long = s.w >= s.d, two = h.api.levels > 1;
      if (m === 'house') {
        const a = 30 * DEG, b = 56 * DEG;
        L = { tx: c.x, ty: s.h * .42, tz: c.z, az: r + h.side * 30, el: 13, fw: (s.w * Math.cos(a) + s.d * Math.sin(a)) * 1.12 + 3.5, fh: s.h * 1.7 + 3 };
        P = { tx: c.x, ty: s.h * .45, tz: c.z, az: r + h.sideP * (long ? 56 : 26), el: 21, fw: (long ? s.w * Math.cos(b) + s.d * Math.sin(b) : s.w * 1.2) + 2.5, fh: s.h * 2.2 + 5 };
      } else {
        const y = two && l === 1 ? s.h * .5 + .8 : 1.1;
        L = { tx: c.x, ty: y, tz: c.z, az: r + h.side * 14, el: 58, fw: s.w + 4.5, fh: s.d * .95 + 5.5 };
        P = { tx: c.x, ty: y, tz: c.z, az: r + h.sideP * (long ? 90 : 10), el: 72, fw: (long ? s.d : s.w) + 3.2, fh: (long ? s.w : s.d) + 4.5 };
      }
    }
    const o = pv ? P : L, rf = REF[pv], tn = Math.tan(rf.fov * DEG / 2); o.dist = Math.max((o.fh / 2) / tn, (o.fw / 2) / (tn * rf.asp)); return o;
  }
  // dintre cele două locuri (ecran lat / ecran înalt) se alege cel din care subiectul se vede mai mare în spațiul liber
  const fitOf = o => Math.min(freeH / o.fh, freeW / o.fw);
  const pvOf = (m, i, l) => (fitOf(view(m, i, l, 1)) * (W >= 900 ? .8 : 1) > fitOf(view(m, i, l, 0)) ? 1 : 0);   // pe ecran mare rămâne vederea lată, dacă diferența e mică
  function station(out) { const o = view(mode, sel, lvl, pvOf(mode, sel, lvl)); CAMK.forEach(k => { out[k] = o[k]; }); return out; }
  // imaginea realistă a vederii de acum (doar ziua, doar din afară), dacă există: [fișier, stânga, dreapta, jos, sus]
  const extOf = (i, pv) => { const e = VEDERI[i < 0 ? 'all' : H[i].c.cod]; return (e && e[pv]) || null; };
  const extKey = () => { if (mode === 'in') return null; const e = extOf(mode === 'all' ? -1 : sel, pvOf(mode, sel, 1)); if (!e || timeGoal <= 15) return e; return e[5] ? [e[5], e[1], e[2], e[3], e[4]] : null; };   // seara: imaginea de seară, dacă există
  const extLoad = () => { const e = extKey(); if (e) pano.load(panoUrl('ai:' + e[0]), true); };

  /* Rotirea realistă a unei case (ROTIRI din gradina-data.js): cadrele unei filmări care ocolește casa pe cercul vederii ei. Când
     vizitatorul trage de scenă, în locul machetei 3D se arată cadrul cel mai apropiat de unghiul la care a ajuns. Cadrele mici se
     încarcă din timp, de la rare la dese; când rotirea se oprește, se cere și cadrul mare al acelui unghi. */
  /* Trecerea „reală” dintre două vederi din afară: imaginea de pe ecran rămâne pe loc, camera sare direct la vederea nouă, iar
     imaginea ei apare peste cea veche (fără drumul prin macheta 3D). xf = imaginea veche, așa cum era desenată. */
  let xf = null, lastFov = 40, preK = '';
  const spin = { key: '', cfg: null, im: [], texS: null, texL: null, cur: -1, at: 0, lReq: -1, lOk: false, on: false, op: 0, more: null };
  const frameTex = () => { const t = new THREE.Texture(); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; return t; };
  const setFrame = (t, img) => { if (t.image && (t.image.width !== img.width || t.image.height !== img.height)) t.dispose(); t.image = img; t.needsUpdate = true; };
  const spinCfg = () => { if (mode === 'in' || noPano) return null; const e = ROTIRI[mode === 'all' || sel < 0 ? 'all' : H[sel].c.cod], c = e && e[pvOf(mode, sel, 1)]; if (!c) return null; const dir = timeGoal > 15 ? c.seara : c.zi; return dir ? { dir, n: c.n, nl: c.nl || c.n, az0: c.az0, r: c.r, arc: c.arc || 360 } : null; };
  const spinAz = (c, i) => c.az0 + (c.arc < 360 ? c.arc * i / (c.n - 1) : 360 * i / c.n);
  const spinUrl = (c, big, i) => 'img/gd/rot/' + c.dir + '/' + (big ? 'l_' : 's_') + String(i).padStart(3, '0') + '.webp';
  function spinPrep() {   // cere cadrele mici ale casei alese (o singură dată pe casă și pe zi/seară)
    const c = spinCfg(); if (!c || spin.key === c.dir) return;
    spin.key = c.dir; spin.cfg = c; spin.im = new Array(c.n).fill(null); spin.cur = -1; spin.lReq = -1; spin.lOk = false; spin.on = false;
    if (!spin.texS) { spin.texS = frameTex(); spin.texL = frameTex(); }
    // întâi câteva cadre rare de jur împrejur, apoi mereu cadrul cel mai apropiat de unghiul la care se uită vizitatorul
    // (pe telefon restul se cer abia la prima rotire)
    const req = new Uint8Array(c.n), rare = []; for (let i = 0; i < c.n; i += Math.max(1, Math.round(c.n / 24))) rare.push(i);
    let act = 0, full = fine.matches; spin.want = 0;
    const take = () => { if (rare.length) return rare.shift(); if (!full) return -1; for (let d = 0; d <= c.n / 2; d++) { const a = (spin.want + d) % c.n, b = (spin.want - d + c.n * 2) % c.n; if (!req[a]) return a; if (!req[b]) return b; } return -1; };
    const next = () => { while (spin.key === c.dir && act < 8) { const i = take(); if (i < 0) return; if (req[i]) continue; req[i] = 1; act++; const im = new Image(); im.decoding = 'async';
      im.onload = () => { act--; if (spin.key === c.dir) { spin.im[i] = im; if (spin.on) wake(); } next(); }; im.onerror = () => { act--; next(); }; im.src = spinUrl(c, 0, i); } };
    spin.more = () => { if (spin.key === c.dir && !full) { full = true; next(); } };
    next();
  }
  // cadrul încărcat cel mai apropiat de unghiul az (grade), sau -1
  function spinNear(c, az) {
    if (c.arc < 360) { const i0 = clamp(Math.round((az - c.az0) / c.arc * (c.n - 1)), 0, c.n - 1); for (let d = 0; d < c.n; d++) { if (spin.im[i0 + d]) return i0 + d; if (spin.im[i0 - d]) return i0 - d; } return -1; }   // doar un arc (grădina văzută de sus)
    const i0 = Math.round((((az - c.az0) % 360) + 360) % 360 / 360 * c.n) % c.n; spin.want = i0; for (let d = 0; d <= c.n / 2; d++) { const a = (i0 + d) % c.n, b = (i0 - d + c.n) % c.n; if (spin.im[a]) return a; if (spin.im[b]) return b; } return -1; }
  function goTo(m, i, d = 1.7) {
    CAMK.forEach(k => { from[k] = cur[k]; }); from.az += uaz; from.el = clamp(from.el + uel, 5, 86); uaz = uel = tuaz = tuel = 0;
    const was = mode !== 'in' && m !== 'in' && started && tr >= 1 && time === timeGoal && !noPano ? (spin.op > .9 && spin.cur >= 0 && spin.cfg ? { tex: spin.lOk ? spin.texL : spin.texS, r: spin.cfg.r, own: 1 } : pOp > .9 && pA && pR ? { tex: pA, r: pR } : null) : null;
    mode = m; sel = i; tr = rm ? 1 : 0; dur = d; needMeasure = 2; clearTimeout(backT); spin.on = false; wake();
    if (was && extKey()) {   // de la o imagine reală la alta: fără zbor prin machetă
      if (was.own) { const t = frameTex(); t.image = was.tex.image; t.needsUpdate = true; was.tex = t; }   // cadrul rotirii se păstrează separat (texturile rotirii se refolosesc)
      if (xf && xf.own) xf.tex.dispose();
      xf = { tex: was.tex, r: was.r, own: was.own, fov: lastFov, offX, offY, op: 1, t0: performance.now() }; tr = 1; pOp = 0; spin.op = 0; spin.cur = -1;
    }
  }

  /* ---------- comenzi ---------- */
  function select(i, keepAuto) { if (!keepAuto) stopAuto(); const w = walking(); if (w) startBlend(1.7); lvl = 1; if (i < 0) goTo('all', -1); else goTo('house', i); if (w) tr = 1; sync(); measure(); extLoad(); spinPrep();
    if (i >= 0 && ((H[i].c.pano && window.VTN) || H[i].walk)) { const p = buildWalk(H[i]).pts[0]; if (p && p.k) pano.load(panoUrl(timeGoal > 15 && p.kn ? p.kn : p.k)); } }   // fotografia primei camere se cere din timp
  function enter(keepAuto, view) {
    if (sel < 0) return; if (!keepAuto) stopAuto(); lvl = 1; inView = view || 'walk';
    if (inView === 'walk' && !buildWalk(H[sel]).pts.length) inView = 'plan';
    if (inView === 'walk') { startBlend(1.8); goTo('in', sel, 1.5); tr = 1; goRoom(0, true); } else goTo('in', sel, 1.5);
    sync();
  }
  function leave(keepAuto) { if (sel < 0) return; if (!keepAuto) stopAuto(); const w = walking(); if (w) startBlend(1.5); goTo('house', sel, 1.4); if (w) tr = 1; sync(); }
  function setLvl(l, keepAuto) { if (!keepAuto) stopAuto(); lvl = l; goTo('in', sel, 1.2); sync(); }
  function setView(v) { if (mode !== 'in' || v === inView || sel < 0) return; stopAuto(); if (v === 'walk' && !buildWalk(H[sel]).pts.length) return; startBlend(1.5); inView = v; lvl = 1; if (v === 'walk') goRoom(H[sel].walk.i, true); tr = 1; needMeasure = 2; sync(); wake(); }
  function room(i, keepAuto) { if (!walking()) return; if (!keepAuto) stopAuto(); goRoom(i); sync(); }
  function setEvening(on) { timeGoal = on ? 19.9 : 10.6; if (rm) time = timeGoal; spin.on = false; extLoad(); spinPrep(); dnBtns.forEach(b => { const a = (b.dataset.t === 'seara') === on; b.classList.toggle('on', a); b.setAttribute('aria-pressed', a); }); wake(); }
  function startAuto() { auto = { i: sel, step: 0, at: 0 }; tourBtn.classList.add('on'); tourBtn.setAttribute('aria-pressed', 'true'); tourBtn.querySelector('span').textContent = 'Oprește turul'; wake(); }
  function stopAuto() { if (!auto) return; auto = null; tourBtn.classList.remove('on'); tourBtn.setAttribute('aria-pressed', 'false'); tourBtn.querySelector('span').textContent = 'Tur ghidat'; }
  function stepAuto(now) {
    const a = auto;
    if (a.step === 0) { a.i = (a.i + 1) % H.length; select(a.i, true); a.at = now + 4400; a.step = 1; }
    else if (a.step === 1) { enter(true); a.at = now + 5200; a.step = H[a.i].walk && H[a.i].walk.pts.length > 1 ? 2 : 3; }
    else if (a.step === 2) { const w = H[a.i].walk; room(w.pts.length - 1, true); a.at = now + 4600; a.step = 3; }
    else { leave(true); a.at = now + 1700; a.step = 0; }
  }

  function sync() {
    sec.dataset.mode = mode; if (started) hint.classList.add('off');
    chips.forEach(b => { const on = +b.dataset.i === sel; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); if (on && b.scrollIntoView && chipsEl.scrollWidth > chipsEl.clientWidth) chipsEl.scrollTo({ left: b.offsetLeft - chipsEl.clientWidth / 2 + b.offsetWidth / 2, behavior: rm ? 'auto' : 'smooth' }); });
    pins.forEach((p, i) => { p.classList.toggle('sm', mode === 'house'); p.classList.toggle('hide', mode === 'in' || i === sel); p.tabIndex = (mode === 'in' || i === sel) ? -1 : 0; });
    labBox.innerHTML = ''; rooms = [];
    if (sel < 0) return;
    const h = H[sel], m = h.cat, two = h.api.levels > 1, inside = mode === 'in', walk = walking(), w = walk ? h.walk : null;
    cSer.textContent = m ? 'Seria ' + m.s + ' · ' + m.sn : 'Casă model'; cName.textContent = h.c.cod;
    cNota.textContent = h.c.nota || ''; cNota.hidden = !h.c.nota; cDesc.textContent = m ? m.t : '';
    cA.textContent = m ? fmtA(m.a) : '–'; cD.textContent = m ? m.d : '–'; cL.textContent = m ? m.l : '–'; cP.textContent = priceOf(m) || '–';
    const rs = (h.api.rooms || []).filter(r => (r.lvl || 1) === lvl);
    cRooms.hidden = !inside;
    if (walk) { cRoomsT.textContent = 'Mergi în'; cRoomsV.innerHTML = w.pts.map((p, i) => `<button type="button" class="gd-rm${i === w.i ? ' on' : ''}" data-i="${i}" aria-pressed="${i === w.i}">${esc(p.n)}</button>`).join(''); }
    else if (inside) { cRoomsT.textContent = two ? (lvl === 1 ? 'La etaj' : 'La parter') : 'Camere'; cRoomsV.textContent = [...new Set(rs.map(r => r.n))].join(' · '); }
    viewBox.hidden = !inside; viewBtns.forEach(b => { const on = b.dataset.v === inView; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    cReal.hidden = !walk; if (walk) cReal.textContent = w.pts.some(p => p.ai) ? 'Vizualizare realizată cu AI, orientativă' : w.pts.some(p => p.k) ? 'Fotografii reale 360°, făcute în showroom' : 'Machetă 3D orientativă';
    sec.dataset.view = inside ? inView : '';
    lvlBox.hidden = !(inside && !walk && two); lvlBtns.forEach(b => { const on = +b.dataset.l === lvl; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    enterBtn.textContent = inside ? 'Ieși din casă' : 'Intră în casă';
    offer.href = 'https://wa.me/40731166070?text=' + encodeURIComponent('Bună! Aș dori o ofertă pentru modelul ' + h.c.cod + (m ? ' (' + fmtA(m.a) + ', ' + m.l + ')' : '') + '. Locația mea: ');
    photos.hidden = !(m && window.CATopen); tur.hidden = h.c.cod !== 'X7';
    if (walk) rooms = w.pts.map((p, i) => { const e = document.createElement('button'); e.type = 'button'; e.className = 'gd-room go'; e.dataset.i = i; e.textContent = p.n; e.tabIndex = -1; labBox.appendChild(e); return { el: e, w: new THREE.Vector3(p.p.x, p.p.y - .45, p.p.z), i }; });
    else if (inside) rooms = (h.api.rooms || []).map(r => { const e = document.createElement('div'); e.className = 'gd-room'; e.textContent = r.n; labBox.appendChild(e); return { el: e, v: new THREE.Vector3(r.x, r.y, r.z), lvl: r.lvl || 1 }; });
  }

  chipsEl.addEventListener('click', e => { const b = e.target.closest('.gd-chip'); if (b) select(+b.dataset.i); });
  pinBox.addEventListener('click', e => { const b = e.target.closest('.gd-pin'); if (b) select(+b.dataset.i); });
  $('.gd-prev').onclick = () => select(sel < 0 ? H.length - 1 : (sel - 1 + H.length) % H.length);
  $('.gd-next').onclick = () => select((sel + 1) % H.length);
  $('.gd-c-x').onclick = () => (mode === 'in' ? leave() : select(-1));
  enterBtn.onclick = () => (mode === 'in' ? leave() : enter());
  lvlBtns.forEach(b => { b.onclick = () => setLvl(+b.dataset.l); });
  viewBtns.forEach(b => { b.onclick = () => setView(b.dataset.v); });
  cRooms.addEventListener('click', e => { const b = e.target.closest('.gd-rm'); if (b) room(+b.dataset.i); });
  labBox.addEventListener('click', e => { const b = e.target.closest('.gd-room.go'); if (b) room(+b.dataset.i); });
  photos.onclick = () => { if (sel >= 0 && window.CATopen) window.CATopen(H[sel].c.cod); };
  dnBtns.forEach(b => { b.onclick = () => setEvening(b.dataset.t === 'seara'); });
  tourBtn.onclick = () => (auto ? stopAuto() : startAuto());
  if (rm) tourBtn.hidden = true;
  stage.addEventListener('keydown', e => { if (e.key === 'Escape' && mode !== 'all' && !document.querySelector('#cmodal.on')) { e.stopPropagation(); mode === 'in' ? leave() : select(-1); } });
  // în casă, săgețile de pe tastatură rotesc privirea
  stage.addEventListener('keydown', e => { if (!walking() || !/^Arrow/.test(e.key) || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return; e.preventDefault(); stopAuto();
    if (e.key === 'ArrowLeft') W3.tyaw += 18; else if (e.key === 'ArrowRight') W3.tyaw -= 18; else W3.tpitch = clamp(W3.tpitch + (e.key === 'ArrowUp' ? 8 : -8), -40, 40); wake(); });

  /* ---------- apăsat și tras pe scenă ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hits = H.map(h => h.hit);
  const pick = e => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); cam.updateMatrixWorld(); ray.setFromCamera(ndc, cam); const x = ray.intersectObjects(hits, false)[0]; return x ? hits.indexOf(x.object) : -1; };
  canvas.addEventListener('pointerdown', e => { if (e.button) return; clearTimeout(backT); drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, touch: e.pointerType === 'touch' }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} hint.classList.add('off'); });
  canvas.addEventListener('pointermove', e => {
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.moved > 6) { stopAuto(); canvas.classList.add('drag'); wake();
        if (walking()) { W3.tyaw += dx * .2; if (!drag.touch) W3.tpitch = clamp(W3.tpitch + dy * .16, -40, 40); }
        else if (spinCfg()) { tuaz -= dx * .42; tuel = 0; drag.v = (drag.v || 0) * .5 + dx * .5; drag.vt = performance.now(); if (mode === 'all') tuaz = clamp(tuaz, -80, 80); if (spin.more) spin.more(); }   // rotire realistă: doar în jur, la aceeași înălțime
        else { tuaz -= dx * .3; if (!drag.touch) tuel += dy * .2; if (mode === 'all') tuaz = clamp(tuaz, -80, 80); tuel = clamp(tuel, 6 - to.el, 82 - to.el); } }
    } else if (fine.matches && !walking()) { const i = pick(e); if (i !== hover) { hover = i; canvas.classList.toggle('can', i >= 0 && !(mode === 'in' && i === sel)); wake(); } }
  });
  const up = e => { if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; canvas.classList.remove('drag');
    { const c = d.moved > 6 && !walking() ? spinCfg() : null; if (c && c.arc >= 360) {   // rotirea mai alunecă puțin după ce dai drumul și se oprește pe un cadru care are și varianta mare
        if (d.v && performance.now() - d.vt < 90) tuaz -= clamp(d.v, -60, 60) * .42 * 5;
        const st = 360 / c.nl; tuaz = Math.round((to.az + tuaz - c.az0) / st) * st + c.az0 - to.az; wake(); } }
    if (d.moved > 6 && !walking() && extKey() && !noPano && !spinCfg()) backT = setTimeout(() => { if (!drag && !walking()) { tuaz = tuel = 0; wake(); } }, 2600);   // după ce te-ai rotit, vederea revine la imaginea realistă
    if (e.type === 'pointerup' && d.moved < 7 && !walking()) { const i = pick(e); if (i >= 0) { if (i === sel && mode === 'house') enter(); else if (i !== sel) select(i); } } };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { if (hover >= 0) { hover = -1; canvas.classList.remove('can'); wake(); } });

  /* ---------- cadrul ---------- */
  const v = new THREE.Vector3();
  function measure() {
    W = stage.clientWidth; Hh = stage.clientHeight; let x0 = 0, y0 = 0, y1 = Hh - 64;
    if (mode !== 'all') { if (W >= 900) x0 = card.offsetWidth + 28; else { y0 = 46; y1 = Math.max(y0 + 120, Hh - card.offsetHeight - 70); } }
    freeW = W - x0; freeH = y1 - y0; mP = clamp((1.25 - freeW / freeH) / .5); tOffX = (x0 + W) / 2 / W - .5; tOffY = (y0 + y1) / 2 / Hh - .5;
    sec.style.setProperty('--gd-ch', (W < 900 && mode !== 'all' ? card.offsetHeight : 0) + 'px');   // pe ecran mic, mențiunea „Vizualizare realizată cu AI” stă deasupra fișei
  }
  function frame(now) {
    raf = 0; if (dead || !visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    // dacă placa video nu ține pasul, desenul se face la o rezoluție ceva mai mică (ca mișcarea să rămână lină)
    if (awake > 0 && dt > .03) { if (++slow > 40 && px > 1.2e6) { px *= .72; slow = 0; } } else if (slow > 0) slow--;
    if (fit(G.renderer, cam, stage, innerWidth < 800 ? 1.6 : 2, px) || !W) { needMeasure = 1; awake = 40; }
    if (needMeasure && !--needMeasure) { measure(); if (!started) { offX = tOffX; offY = tOffY; } }
    if (!W) { measure(); }
    if (snap) { snap--; measure(); offX = tOffX; offY = tOffY; uaz = tuaz; uel = tuel; awake = 40; }
    if (auto && now >= auto.at) stepAuto(now);
    // camera: zbor lin spre locul ales
    station(to);
    if (!started) { started = true; extLoad(); CAMK.forEach(k => { cur[k] = to[k]; }); if (!rm && !extKey()) { CAMK.forEach(k => { from[k] = to[k]; }); from.el = to.el + 30; from.dist = to.dist * 1.5; from.az = -34; tr = 0; dur = 2.8; } }
    let busy = false;
    if (tr < 1) { tr = Math.min(1, tr + dt / dur); const k = ease(tr); CAMK.forEach(n => { cur[n] = lerp(from[n], to[n], k); }); cur.az = from.az + ((((to.az - from.az) % 360) + 540) % 360 - 180) * k; busy = true; }
    else CAMK.forEach(n => { cur[n] = to[n]; });
    if (Math.abs(tuaz - uaz) + Math.abs(tuel - uel) > .02) { const q = spin.on ? .34 : .16; uaz += (tuaz - uaz) * q; uel += (tuel - uel) * q; busy = true; }
    if (Math.abs(tOffX - offX) + Math.abs(tOffY - offY) > .0008) { offX += (tOffX - offX) * .09; offY += (tOffY - offY) * .09; busy = true; }
    // ora zilei
    if (time !== timeGoal) { time += clamp(timeGoal - time, -dt * 3.4, dt * 3.4); busy = true; lastN = -2; }
    if (lastN < 0) { const d = G.setTime(time); env.night(d.n); G.renderer.shadowMap.needsUpdate = true; const nn = d.n > .5 ? 1 : 0; if (nn !== lastN) sec.classList.toggle('gd--night', !!nn); lastN = time === timeGoal ? nn : -1; }
    // în casă: mersul dintr-o cameră în alta și privitul în jur; trecerea lină dintre afară și înăuntru
    const wk = walking();
    if (wk) {
      if (W3.k < 1) { W3.k = Math.min(1, W3.k + dt / 1.2); W3.pos.lerpVectors(W3.from, W3.to, ease(W3.k)); busy = true; }
      if (Math.abs(W3.tyaw - W3.yaw) + Math.abs(W3.tpitch - W3.pitch) > .03) { W3.yaw += (W3.tyaw - W3.yaw) * .16; W3.pitch += (W3.tpitch - W3.pitch) * .16; busy = true; }
    }
    if (blend.k < 1) { blend.k = Math.min(1, blend.k + dt / blend.dur); busy = true; }
    // fotografia reală a camerei (dacă există): apare după ce camera a ajuns; la mers și la schimbarea zi/seară se vede macheta
    let pt = null, ph = 180, pr = null, pai = false;
    if (wk) { if (W3.k >= 1) { const p = H[sel].walk.pts[H[sel].walk.i]; if (p && p.k && !(p.ai && timeGoal > 15)) { const night = timeGoal > 15 && p.kn, u = panoUrl(night ? p.kn : p.k); pt = pano.ready(u); if (!pt) pano.load(u).then(wake); ph = (night ? p.Hn : p.H) + 180 + H[sel].c.rot; pai = !!p.ai; } } }
    else if (tr >= 1 && blend.k >= 1 && Math.abs(uaz) + Math.abs(uel) < .05) { const e = extKey(); if (e) { const u = panoUrl('ai:' + e[0]); pt = pano.ready(u); if (!pt) pano.load(u, true).then(wake); pr = e.slice(1); pai = true; } }   // din afară: imaginea realistă a vederii
    if (pt && pt !== pA && pOp < .02) { pA = pt; pH = ph; pR = pr; pAI = pai; }
    // rotirea realistă a casei: cadrul cel mai apropiat de unghiul la care s-a ajuns
    const sc = !wk && tr >= 1 && blend.k >= 1 && time === timeGoal ? spinCfg() : null; let sk = -1;
    if (sc && sc.dir === spin.key && (spin.on || Math.abs(uaz) > .05)) { sk = spinNear(sc, cur.az + uaz); if (sk >= 0) spin.on = true; }
    if (sk >= 0 && sk !== spin.cur) { spin.cur = sk; setFrame(spin.texS, spin.im[sk]); spin.at = now; spin.lOk = false; spin.lReq = -1; }
    else if (sk >= 0 && !drag && !spin.lOk && spin.lReq !== sk && now - spin.at > 380 && Math.abs(tuaz - uaz) < .3 && Number.isInteger(sk * sc.nl / sc.n)) {   // rotirea s-a oprit: cadrul mare
      spin.lReq = sk; const im = new Image(), key = spin.key; im.onload = () => { if (spin.key === key && spin.cur === sk && spin.lReq === sk) { setFrame(spin.texL, im); spin.lOk = true; wake(); } }; im.src = spinUrl(sc, 1, sk * sc.nl / sc.n); }
    if (sk >= 0 && now - spin.at < 500) busy = true;
    const sg = sk >= 0 ? 1 : 0; if (spin.op !== sg) { spin.op += clamp(sg - spin.op, -dt * 5, dt * 7); busy = true; }
    const hold = sk >= 0 && spin.op < 1 && pA && pR && pOp > 0;   // imaginea vederii rămâne până când cadrul rotirii a apărut de tot (să nu se vadă macheta între ele)
    const pg = hold ? pOp : pt && pt === pA && blend.k > .82 && time === timeGoal && !noPano ? 1 : 0;
    if (pOp !== pg) { pOp += clamp(pg - pOp, -dt * (pR && pg < pOp ? 5 : 2.4), dt * 2.4); busy = true; }
    if (xf) { busy = true; if (pOp >= 1 || now - xf.t0 > 7000 || mode === 'in') { xf.op -= dt * (pOp >= 1 ? 1e3 : 2); if (xf.op <= 0) { if (xf.own) xf.tex.dispose(); xf = null; } } }
    if (aiOn !== ((pAI && pOp > .5) || spin.op > .5 || !!xf)) { aiOn = !aiOn; sec.classList.toggle('gd--ai', aiOn); }
    // acoperișurile și inelul auriu
    H.forEach((h, i) => {
      const kg = i === sel && mode === 'in' && inView === 'plan' ? lvl : 0;
      if (h.k !== kg) { h.k = rm ? kg : h.k + clamp(kg - h.k, -dt * 1.05, dt * 1.05); h.api.openRoof(h.k); G.renderer.shadowMap.needsUpdate = true; busy = true; }
      const rg = i === sel ? (mode === 'in' ? .0 : .85) : i === hover ? .6 : 0;
      if (Math.abs(rg - h.ro) > .004) { h.ro += (rg - h.ro) * .14; busy = true; } else h.ro = rg;
      h.ring.material.opacity = h.ro; h.ring.visible = h.ro > .004;
    });
    const sway = mode === 'all' && !rm && !drag && !extKey();
    if (busy || sway) awake = Math.max(awake, 12);
    if (awake <= 0) return; awake--;
    const asp = W / Hh; let fov;
    if (wk) {
      fov = lerp(70, 88, mP); const a = W3.yaw * DEG, e = W3.pitch * DEG; cam.position.copy(W3.pos);
      cam.lookAt(W3.pos.x + Math.sin(a) * Math.cos(e), W3.pos.y + Math.sin(e), W3.pos.z + Math.cos(a) * Math.cos(e));
      G.scene.fog.near = 70; G.scene.fog.far = 520;
    } else {
      const dist = cur.dist; fov = clamp(2 * Math.atan(Math.max((cur.fh / 2) / dist * (Hh / freeH), (cur.fw / 2) / (dist * asp) * (W / freeW))) / DEG, 14, 84);
      const az = (sk >= 0 ? spinAz(sc, sk) : cur.az + uaz + (sway ? Math.sin(now / 1000 * .17) * 4 : 0)) * DEG, el = clamp(cur.el + (sk >= 0 ? 0 : uel), 5, 86) * DEG;
      cam.position.set(cur.tx + Math.sin(az) * Math.cos(el) * dist, cur.ty + Math.sin(el) * dist, cur.tz + Math.cos(az) * Math.cos(el) * dist); cam.lookAt(cur.tx, cur.ty, cur.tz);
      G.scene.fog.near = dist * 1.25; G.scene.fog.far = dist * 1.25 + 430;
    }
    if (blend.k < 1) { const e = ease(blend.k); tP.copy(cam.position); tQ.copy(cam.quaternion); cam.position.lerpVectors(blend.p0, tP, e); cam.quaternion.slerpQuaternions(blend.q0, tQ, e); fov = lerp(blend.fov0, fov, e); }
    cam.fov = fov; cam.near = wk || blend.k < 1 ? .08 : .5; cam.setViewOffset(W, Hh, -offX * W, -offY * Hh, W, Hh);
    cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();   // (etichetele se așază corect și când scena 3D nu se mai desenează)
    const show = pOp > .004 && pA, sFull = spin.op > .995 && sk >= 0 && pano.covers(sc.r, fov, asp, offX, offY);
    lastFov = fov; const xFull = xf && xf.op >= 1 && pano.covers(xf.r, xf.fov, asp, xf.offX, xf.offY);
    if (!sFull && !xFull && (pOp < .995 || !pA || (pR && !pano.covers(pR, fov, asp, offX, offY)))) G.render();
    if (xf) pano.renderFlat(xf.tex, xf.op, xf.r, xf.fov, asp, xf.offX, xf.offY);
    if (show && pR) pano.renderFlat(pA, pOp, pR, fov, asp, offX, offY);
    else if (show) { cam.getWorldDirection(v); pano.render(pA, null, 0, pOp, pH - Math.atan2(v.x, v.z) / DEG, Math.asin(clamp(v.y, -1, 1)) / DEG, fov, asp, offX, offY); }
    if (spin.op > .004 && spin.cur >= 0 && spin.cfg) pano.renderFlat(spin.lOk ? spin.texL : spin.texS, spin.op, spin.cfg.r, fov, asp, offX, offY);
    // etichetele caselor și ale camerelor
    pins.forEach((p, i) => { v.copy(H[i].top).project(cam); const ok = v.z < 1 && Math.abs(v.x) < 1.05 && v.y < 1.1 && v.y > -1; p.style.visibility = ok ? 'visible' : 'hidden'; if (ok) p.style.transform = `translate(${((v.x * .5 + .5) * W).toFixed(1)}px,${((-v.y * .5 + .5) * Hh).toFixed(1)}px)`; p.classList.toggle('hov', i === hover); });
    if (rooms.length && wk) { const cw = H[sel].walk.i, sh = W3.k >= 1 && blend.k >= 1; rooms.forEach(r => { v.copy(r.w).project(cam); const ok = sh && r.i !== cw && v.z < 1 && Math.abs(v.x) < .96 && Math.abs(v.y) < .9; r.el.style.opacity = ok ? '1' : '0'; r.el.style.pointerEvents = ok ? 'auto' : 'none'; if (ok) r.el.style.transform = `translate(${((v.x * .5 + .5) * W).toFixed(1)}px,${((-v.y * .5 + .5) * Hh).toFixed(1)}px)`; }); }
    else if (rooms.length) { const h = H[sel]; rooms.forEach(r => { const o = mode === 'in' ? 1 - clamp(Math.abs(h.k - r.lvl) / .3) : 0; r.el.style.opacity = o.toFixed(2); if (o > .01) { h.g.localToWorld(v.copy(r.v)).project(cam); r.el.style.transform = `translate(${((v.x * .5 + .5) * W).toFixed(1)}px,${((-v.y * .5 + .5) * Hh).toFixed(1)}px)`; } }); }
    if (!sec.classList.contains('gd--live')) sec.classList.add('gd--live');
  }
  const kick = () => { if (!raf && visible && !dead && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; if (visible) awake = 40; kick(); }, { rootMargin: '120px 0px' }).observe(stage);
  new IntersectionObserver(es => { document.body.classList.toggle('in-gd', es[es.length - 1].isIntersecting); }, { rootMargin: '-45% 0px -45% 0px' }).observe(stage);
  document.addEventListener('visibilitychange', () => { awake = 40; kick(); });
  addEventListener('resize', () => { needMeasure = 1; wake(); });
  sync();
  window.__gradina = { G, H, select, enter, leave, setLvl, setEvening, setView, room, views() { const o = []; [['all', -1], ...H.map((h, i) => [h.c.cod, i])].forEach(([k, i]) => [0, 1].forEach(pv => { const q = view(i < 0 ? 'all' : 'house', i, 1, pv); o.push({ k, pv, tx: +q.tx.toFixed(3), ty: +q.ty.toFixed(3), tz: +q.tz.toFixed(3), az: +q.az.toFixed(3), el: +q.el.toFixed(3), dist: +q.dist.toFixed(3), fw: +q.fw.toFixed(3), fh: +q.fh.toFixed(3) }); })); return o; }, pano(on) { noPano = !on; if (!on) pOp = 0; wake(); }, get state() { return { mode, sel, lvl, time, tr, awake, inView, mP, uaz: +uaz.toFixed(1), spin: { on: spin.on, cur: spin.cur, op: +spin.op.toFixed(2), n: spin.im.filter(Boolean).length, xf: !!xf, big: spin.lOk }, pOp: +pOp.toFixed(2), room: sel >= 0 && H[sel].walk ? H[sel].walk.i : -1 }; }, jump(t) { if (t !== undefined) timeGoal = t; time = timeGoal; lastN = -1; tr = 1; snap = 4; blend.k = 1; W3.k = 1; W3.pos.copy(W3.to); W3.yaw = W3.tyaw; W3.pitch = W3.tpitch; H.forEach((h, i) => { h.k = i === sel && mode === 'in' && inView === 'plan' ? lvl : 0; h.api.openRoof(h.k); }); G.renderer.shadowMap.needsUpdate = true; wake(); } };
}

/* Mai puține desene pe cadru (contează pe telefoane): piesele unei case care au același material și se mișcă împreună
   (nu sunt despărțite de un acoperiș sau de un etaj care se ridică) devin o singură piesă. Forma rămâne exact aceeași. */
function mergeHouse(api) {
  const root = api.root, dyn = new Set(), y0 = new Map(); root.updateMatrixWorld(true);
  root.traverse(o => y0.set(o, o.position.y));
  for (let k = 1; k <= (api.levels || 1); k++) { api.openRoof(k - .4); root.traverse(o => { if (o !== root && Math.abs(o.position.y - y0.get(o)) > 1e-4) dyn.add(o); }); }
  api.openRoof(0); root.updateMatrixWorld(true);
  const buckets = new Map();
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || !o.visible || Array.isArray(o.material) || o.children.length || !o.geometry.attributes.position || !o.geometry.attributes.normal) return;
    let a = o.parent, vis = true; while (a && a !== root && !dyn.has(a)) { if (!a.visible) vis = false; a = a.parent; } if (!vis || !a) return;
    const key = o.material.uuid + '|' + a.id + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + o.renderOrder + '|' + (o.geometry.attributes.color ? 1 : 0);
    let b = buckets.get(key); if (!b) buckets.set(key, b = { base: a, list: [] }); b.list.push(o);
  });
  const inv = new THREE.Matrix4(), m4 = new THREE.Matrix4(), n3 = new THREE.Matrix3(), v = new THREE.Vector3(), nn = new THREE.Vector3();
  buckets.forEach(({ base, list }) => {
    if (list.length < 2) return; inv.copy(base.matrixWorld).invert();
    const pos = [], nor = [], col = [], hasCol = !!list[0].geometry.attributes.color, o0 = list[0];
    list.forEach(o => {
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color;
      m4.multiplyMatrices(inv, o.matrixWorld); n3.getNormalMatrix(m4); const flip = m4.determinant() < 0;
      const put = i => { v.fromBufferAttribute(P, i).applyMatrix4(m4); pos.push(v.x, v.y, v.z); nn.fromBufferAttribute(N, i).applyMatrix3(n3).normalize(); nor.push(nn.x, nn.y, nn.z); if (hasCol) col.push(C.getX(i), C.getY(i), C.getZ(i)); };
      for (let i = 0; i + 2 < P.count; i += 3) { put(i); put(flip ? i + 2 : i + 1); put(flip ? i + 1 : i + 2); }
      o.parent.remove(o); if (g !== o.geometry) g.dispose();
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); if (hasCol) geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, o0.material); m.castShadow = o0.castShadow; m.receiveShadow = o0.receiveShadow; m.renderOrder = o0.renderOrder; m.userData.cs = o0.castShadow; base.add(m);
  });
}
