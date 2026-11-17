// Grădina cu case model (#gradina): o scenă 3D în care vizitatorul trece de la o casă la alta și intră în fiecare.
// Marcajul și stilurile: surse/final/parts/gradina.html. Casele: js/gradina-data.js + js/h_<nume>.js (vezi surse/final/CASE-3D.md).
// Scena de bază (cer, gazon, soare, seara): js/gscene.js; grădina: js/genv.js. Datele afișate (m², dimensiuni, preț) vin din window.CAT.
// În casă se intră la nivelul ochilor (te uiți în jur, treci dintr-o cameră în alta); casele cu fotografii reale 360° (js/pano.js)
// le arată peste machetă, aliniate cu ea. „Plan” = vederea de sus, cu acoperișul ridicat.
import { THREE, clamp, lerp, ease, webglOK, fit } from './kit.js';
import { createGScene } from './gscene.js';
import { buildGarden } from './genv.js';
import { createPano } from './pano.js';
import { CASE, GRADINA, VEDERI, ROTIRI, PLANURI } from './gradina-data.js';

window.__gdMod = 1;   // semn pentru pagina că modulul s-a încărcat (altfel pagina arată imaginea de rezervă)
const DEG = Math.PI / 180;
const sec = document.getElementById('gradina');
const fmtA = a => String(a).replace('.', ',') + ' m²';
const inCat = c => (window.CAT || []).find(m => m.c === c) || null;
const catOf = c => inCat(c.cod) || c.date || null;   // datele casei: din catalogul paginii sau, pentru un model care nu e în catalog, din gradina-data.js
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
  list.innerHTML = CASE.map(c => { const m = catOf(c); return `<button type="button" class="gd-li" data-c="${esc(c.cod)}"><b>${esc(c.cod)}</b><span>${m ? fmtA(m.a) : ''}</span><i>${m ? esc(m.d) : ''}</i><em>${esc(priceOf(m))}</em></button>`; }).join('');
  list.querySelectorAll('.gd-li').forEach(b => { b.onclick = () => { if (window.CATopen && inCat(b.dataset.c)) window.CATopen(b.dataset.c); }; });
}

async function boot() {
  const $ = s => sec.querySelector(s), stage = $('.gd-stage'), canvas = $('.gd-gl'), pinBox = $('.gd-pins'), labBox = $('.gd-labels'), card = $('.gd-card'), chipsEl = $('.gd-chips');
  if (!webglOK()) { toStatic(); return; }
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(hover:hover) and (pointer:fine)');
  const G = createGScene(canvas, { shadowSize: Math.min(innerWidth, innerHeight) < 700 ? 1024 : 2048, half: 60 });
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
      H.push({ c, cat: catOf(c), api, g, s, hit, k: 0, ring: null, ro: 0, side: -1, sideP: -1, center: g.localToWorld(new THREE.Vector3(0, 0, s.cz || 0)), top: g.localToWorld(new THREE.Vector3(0, s.h + 1.5, s.cz || 0)) });
    } catch (e) { console.warn('gradina: casa ' + CASE[i].cod + ' nu s-a putut construi', e); }
  }
  if (!H.length || dead) { toStatic(); return; }
  const env = buildGarden(G, H);
  // din ce parte se uită camera la fiecare casă: de acolo de unde nu stă altă casă în față
  // o casă „lungă” (de cel puțin 1,5 ori mai lată decât adâncă) se privește pe ecran înalt mai din lateral, ca să încapă; una aproape pătrată (V3, T6), mai din față
  const isLong = s => s.w >= s.d * 1.5;
  const blocked = (h, azDeg, dist) => { const a = azDeg * DEG, dx = Math.sin(a) * dist, dz = Math.cos(a) * dist; let pen = 0;
    [...H, { center: { x: 0, z: 0 }, s: { h: 2.5 } }].forEach(o => { if (o === h) return; const ox = o.center.x - h.center.x, oz = o.center.z - h.center.z, t = clamp((ox * dx + oz * dz) / (dist * dist)), d = Math.hypot(ox - dx * t, oz - dz * t); if (d < 10) pen += (10 - d) * o.s.h; });   // ultimul = copacul din rond
    return pen + Math.abs(h.center.x + dx) * .01; };   // la egalitate: partea dinspre aleea din mijloc
  H.forEach(h => { const r = h.c.rot, lg = isLong(h.s); h.side = blocked(h, r - 30, 30) <= blocked(h, r + 30, 30) ? -1 : 1; h.sideP = blocked(h, r - (lg ? 56 : 26), 52) <= blocked(h, r + (lg ? 56 : 26), 52) ? -1 : 1; });

  /* ---------- elementele din pagină ---------- */
  const cSer = $('.gd-c-ser'), cName = $('.gd-c-name'), cNota = $('.gd-c-nota'), cDesc = $('.gd-c-desc'), cA = $('.gd-c-a'), cD = $('.gd-c-d'), cL = $('.gd-c-l'), cP = $('.gd-c-p'),
    cRooms = $('.gd-c-rooms'), cRoomsT = $('.gd-c-rooms dt'), cRoomsV = $('.gd-c-rooms dd'), lvlBox = $('.gd-c-lvl'), lvlBtns = [...sec.querySelectorAll('.gd-c-lvl button')],
    viewBox = $('.gd-c-view'), viewBtns = [...sec.querySelectorAll('.gd-c-view button')], cReal = $('.gd-c-real'),
    enterBtn = $('.gd-enter'), offer = $('.gd-offer'), photos = $('.gd-photos'), tur = $('.gd-tur'), tourBtn = $('.gd-tour'), dnBtns = [...sec.querySelectorAll('.gd-dn button')], dnBox = $('.gd-dn'), hint = $('.gd-hint');
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
  const aiEl = sec.querySelector('.gd-ai'), AI_TXT = [aiEl ? aiEl.textContent : '', 'Fotografie reală · grădina de la ferestre e adăugată cu AI']; let aiTxt = 1;
  let inView = 'walk', pOp = 0, pA = null, pH = 0, pR = null, pAI = 0, aiOn = false, noPano = false, backT = 0;   // pR = cât cuprinde imaginea vederii din afară (null = fotografie 360°)
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
      pts.push({ n, p: h.g.localToWorld(new THREE.Vector3(d.p[0] - pn.x0, pn.ochi, d.p[1] + pn.z0)), yaw: h.c.rot + d.H + 180 - d.v[0], pitch: d.v[1], k, H: d.H, kn: dn ? kn : null, Hn: dn ? dn.H : 0, g: !!(pn.gradina && pn.gradina.includes(k)) });
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
  function goRoom(i, jump, turn) {   // jump = fără mers prin machetă; turn = privirea se întoarce lin spre camera nouă (nu sare)
    const w = H[sel] && H[sel].walk, p = w && w.pts[i]; if (!p) return; w.i = i; jump = jump || rm; turn = turn && !rm;
    W3.from.copy(jump ? p.p : W3.pos); W3.to.copy(p.p); W3.k = jump ? 1 : 0; if (jump) W3.pos.copy(p.p);
    W3.tyaw = jump && !turn ? p.yaw : W3.yaw + ((((p.yaw - W3.yaw) % 360) + 540) % 360 - 180); W3.tpitch = p.pitch; if (jump && !turn) { W3.yaw = W3.tyaw; W3.pitch = W3.tpitch; }
    wake();
  }
  // fotografiile mari (6144 px) doar pe ecrane mari, cu placă video care le duce; altfel cele de 4096 px
  const bigPano = G.renderer.capabilities.maxTextureSize >= 6144 && fine.matches && Math.max(innerWidth, innerHeight) * Math.min(devicePixelRatio || 1, 2) > 1500;
  // fotografiile reale ale unei case pot avea, doar pentru grădină, copii în care la ferestre se vede grădina (pano.gradina în gradina-data.js):
  // acelea se iau din img/gd/x7/; turul 360° păstrează fotografiile neschimbate din p360/
  const PG = new Set(CASE.flatMap(c => (c.pano && c.pano.gradina) || []));
  const panoUrl = k => (k.slice(0, 3) === 'ai:' ? 'img/gd/ai/' + k.slice(3) + '.webp' : (PG.has(k) ? 'img/gd/x7/' : 'p360/') + k + (bigPano ? '_l' : '_m') + '.webp');

  /* Unde stă camera: toată grădina, o casă văzută din față, o casă văzută de sus (planul). Pentru fiecare există un loc pe ecran
     lat (pv = 0) și unul pe ecran înalt (pv = 1). Locul e fix, iar unghiul de vedere se potrivește după ecran: așa, din același
     loc se poate arăta și o imagine 360° realistă (VEDERI din gradina-data.js), pe orice mărime de ecran. */
  const REF = [{ fov: 34, asp: 1.6 }, { fov: 46, asp: .5 }];
  function view(m, i, l, pv) {
    let L, P;
    if (m === 'all' || i < 0) {
      L = { tx: 0, ty: 1, tz: GZ + 10, az: 0, el: 31, fw: 82, fh: 58 }; P = { tx: 0, ty: 1, tz: GZ + 10, az: 0, el: 50, fw: 50, fh: 84 };   // grădina mărită (98 m adâncime)
    } else {
      const h = H[i], s = h.s, r = h.c.rot, c = h.center, long = isLong(s), two = h.api.levels > 1;
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
  // planul casei (acoperișul ridicat) are imagine reală doar din locul „lat”: unde există, acel loc se folosește pe orice ecran
  const planImg = () => { const e = sel >= 0 && PLANURI[H[sel].c.cod]; return (e && e[lvl - 1]) || null; };
  const pvNow = () => (mode === 'in' && inView === 'plan' && planImg() ? 0 : pvOf(mode, sel, lvl));
  function station(out) { const o = view(mode, sel, lvl, pvNow()); CAMK.forEach(k => { out[k] = o[k]; }); return out; }
  // imaginea realistă a vederii de acum (doar ziua, doar din afară), dacă există: [fișier, stânga, dreapta, jos, sus]
  const extOf = (i, pv) => { const e = VEDERI[i < 0 ? 'all' : H[i].c.cod]; return (e && e[pv]) || null; };
  const planKey = () => (inView === 'plan' && timeGoal <= 15 ? planImg() : null);   // (ziua)
  const extKey = () => { if (mode === 'in') return planKey(); const e = extOf(mode === 'all' ? -1 : sel, pvOf(mode, sel, 1)); if (!e || timeGoal <= 15) return e; return e[5] ? [e[5], e[1], e[2], e[3], e[4]] : null; };   // seara: imaginea de seară, dacă există
  const extLoad = () => { const e = extKey(); if (e) pano.load(panoUrl('ai:' + e[0]), true); };

  /* Trecerea „reală” dintre două vederi din afară: imaginea de pe ecran rămâne pe loc, camera sare direct la vederea nouă, iar
     imaginea ei apare peste cea veche (fără drumul prin macheta 3D). xf = imaginea veche, așa cum era desenată. */
  let xf = null, lastFov = 40, roofSnap = false, glide = 0, fixCls = false, spun = false, lastPY = 0, lastPP = 0, live = false, bootT = 0;
  const GLIDE = .3;   // cât mai alunecă rotirea după ce dai drumul (constanta de timp, în secunde)
  /* Rotirea reală a unei case (ROTIRI din gradina-data.js): cadrele unei filmări care ocolește casa pe cercul vederii ei.
     Ca mișcarea să fie lină pe orice calculator și la orice viteză a netului:
     · cadrele se cer pornind de la unghiul la care se uită vizitatorul, mai multe în direcția în care rotește;
     · cadrele din jurul unghiului curent sunt despachetate din timp, în afara firului principal (ImageBitmap): la desen nu se
       mai despachetează nimic, deci pagina nu se poticnește;
     · pe ecran se trece doar prin cadre gata făcute, unul după altul: dacă netul sau calculatorul nu țin pasul, rotirea așteaptă
       o clipă la ultimul cadru gata și apoi merge mai departe (nu sare la alt unghi și nu arată niciodată macheta 3D);
     · mișcarea se socotește în timp, nu în cadre desenate (arată la fel la 30, 60 sau 120 de cadre pe secundă).
     spin.pos = poziția arătată, în cadre (cu zecimale, fără întoarcere la 0): între două cadre vecine se face un amestec. */
  const spin = { key: '', cfg: null, im: [], bm: [], px: [], pq: [], np: 0, busy: null, nb: 0, gc: 0, texS: null, texB: null, texL: null, lbm: null, cnt: 0, a: -1, b: -1, ra: null, rb: null, mix: 0, pos: 0, at: 0, lReq: -1, lOk: false, on: false, op: 0, more: null, next: null, want: 0, dir: 1 };
  const SPK = 4, SPW = 512;   // schița rotirii: copii mici (SPW px) ale unui cadru din SPK, ținute în memorie cât e aleasă casa
  const hasBitmap = typeof createImageBitmap === 'function';
  const wrap = (i, n) => ((i % n) + n) % n;
  const frameTex = () => { const t = new THREE.Texture(); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.flipY = false; t.userData.fy = -1; return t; };
  const setFrame = (t, img) => { const u = t.userData; if (u.w && (u.w !== img.width || u.h !== img.height)) t.dispose(); u.w = img.width; u.h = img.height; t.image = img; t.needsUpdate = true; };
  const spinCfg = () => { if (mode !== 'house' || sel < 0 || noPano) return null; const e = ROTIRI[H[sel].c.cod], c = e && e[pvOf(mode, sel, 1)]; if (!c) return null; const dir = timeGoal > 15 ? c.seara : c.zi; return dir ? { dir, n: c.n, nl: c.nl || c.n, az0: c.az0, r: c.r, gol: c.gol ? (c.G || (c.G = golOf(c))) : null } : null; };
  const spinUrl = (c, big, i) => 'img/gd/rot/' + c.dir + '/' + (big ? 'l_' : 's_') + String(i).padStart(3, '0') + '.webp';
  const spinP = (c, az) => (az - c.az0) / 360 * c.n;   // unghi (grade) → poziție în cadre
  const spinSrc = i => { const k = wrap(i, spin.cfg.n); return spin.bm[k] || spin.px[k] || null; };   // ce se poate arăta pentru cadrul i: cadrul mare sau copia mică
  /* „Golul” unei rotiri (în gradina-data.js: gol: [de la cadrul, până la cadrul]; acum doar la X7, în spatele casei) = porțiunea din
     care filmarea nu are imagini bune: toate cadrele ei sunt copii ale celor două capete, deci acolo rotirea părea înțepenită.
     Acum mâna trece prin gol mult mai repede (golul „ține” doar cât GOLW cadre de tras), iar pe ecran un capăt se topește în
     celălalt; restul turului merge cu puțin mai încet, ca un tur complet să rămână tot 360° de tras. Dispare când se reface filmarea.
     golOf: g0 = primul cadru al golului, L = câte cadre ține, a / b = cadrele arătate pentru cele două capete (au și schiță, și variantă mare). */
  const GOLW = 4;
  const golOf = c => { const n = c.n, g0 = wrap(c.gol[0], n), L = wrap(c.gol[1] - g0, n); return L > GOLW * 2 ? { g0, L, a: wrap(Math.ceil((g0 + 1) / SPK) * SPK, n), b: wrap(Math.floor((g0 + L - 1) / SPK) * SPK, n) } : null; };
  // unghiul (în grade) la care se ajunge trăgând cu d grade de la unghiul az, la o rotire cu gol
  function spinDrag(c, az, d) {
    const n = c.n, g = c.gol, kg = GOLW / g.L, kr = (n - GOLW) / (n - g.L), u = wrap(spinP(c, az) - g.g0, n);
    const s = (u < g.L ? u * kg : GOLW + (u - g.L) * kr) + d / 360 * n, t = Math.floor(s / n), w = s - t * n, u2 = w < GOLW ? w / kg : g.L + (w - GOLW) / kr;
    return az + (u2 - u + t * n) * 360 / n;
  }
  /* Rotirea (rescrisă pe 17 nov 2026, după „unele case nu se mișcă lin deloc”): imaginea urmărește mereu mâna. Dacă exact cadrul
     unghiului nu e încă gata, se arată cel mai apropiat care e (înainte rotirea aștepta acolo și părea blocată). Ca să existe
     mereu ceva aproape, din toată rotirea se țin copii mici ale unui cadru din patru („schița”), cerute primele, de la rare la dese. */
  function spinPrep() {   // cere cadrele casei alese (o singură dată pe casă și pe zi/seară)
    const c = spinCfg(); if (!c || spin.key === c.dir) return;
    spin.bm.forEach(b => { if (b && b.close) b.close(); }); spin.px.forEach(b => { if (b && b.close) b.close(); });
    const n = c.n, key = c.dir; spin.key = key; spin.cfg = c; spin.im = new Array(n).fill(null); spin.bm = new Array(n).fill(null); spin.px = new Array(n).fill(null); spin.pq = []; spin.np = 0; spin.busy = new Uint8Array(n); spin.nb = 0; spin.cnt = 0;
    spin.a = spin.b = -1; spin.ra = spin.rb = null; spin.mix = 0; spin.lReq = -1; spin.lOk = false; spin.on = false; spin.dir = 1;
    if (!spin.texS) { spin.texS = frameTex(); spin.texB = frameTex(); spin.texL = frameTex(); }
    spin.want = wrap(Math.round(spinP(c, view('house', sel, 1, pvOf('house', sel, 1)).az)), n);   // locul vederii: de acolo pornește rotirea
    // ordinea: (1) cadrele de lângă unghiul curent, (2) schița (din 16 în 16, din 8 în 8, din 4 în 4), (3) restul, cele mai apropiate
    // întâi (în direcția de mers, de două ori mai multe). Pe ecranele cu atingere se cer întâi doar primele, iar restul la prima rotire.
    const req = new Uint8Array(n), err = new Uint8Array(n); let act = 0, cnt = 0, lim = fine.matches ? n : 44;
    if (c.gol) for (let u = 1; u < c.gol.L; u++) { const i = wrap(c.gol.g0 + u, n); if (i !== c.gol.a && i !== c.gol.b) req[i] = 1; }   // copiile din gol nu se cer: se arată doar cele două capete
    const fail = i => { if (spin.key !== key) return; if (++err[i] < 3) setTimeout(() => { if (spin.key === key) { req[i] = 0; cnt--; next(); } }, 900 * err[i]); };   // un cadru care nu vine deloc e sărit: se arată vecinii lui
    const near = m => { for (let d = 0; d <= m; d++) { const a = wrap(spin.want + spin.dir * d, n); if (!req[a]) return a; const b = wrap(spin.want - spin.dir * d, n); if (!req[b]) return b; } return -1; };
    const sketch = st => { let best = -1, bd = 1e9; for (let i = 0; i < n; i += st) if (!req[i]) { let d = Math.abs(i - spin.want); d = Math.min(d, n - d); if (d < bd) { bd = d; best = i; } } return best; };
    const rest = () => { for (let d = 0; d < n; d++) { const a = wrap(spin.want + spin.dir * d, n); if (!req[a]) return a; if (!(d & 1)) { const b = wrap(spin.want - spin.dir * (d >> 1), n); if (!req[b]) return b; } } return -1; };
    const pickNext = () => { let i = near(6); if (i < 0) i = sketch(16); if (i < 0) i = sketch(8); if (i < 0) i = sketch(SPK); if (i < 0) i = rest(); return i; };
    const small = () => { while (spin.key === key && spin.np < 2 && spin.pq.length) { const i = spin.pq.shift(), im = spin.im[i]; if (!im || spin.px[i]) continue; spin.np++; let pr = null;
      try { pr = createImageBitmap(im, { resizeWidth: SPW, resizeHeight: Math.round(im.height * SPW / im.width), resizeQuality: 'low' }); } catch (_) { pr = null; }
      const done = b => { if (spin.key !== key) { if (b && b.close) b.close(); return; } spin.np--; if (b) spin.px[i] = b; wake(); small(); }; if (pr) pr.then(done, () => done(null)); else done(null); } };
    const next = () => { while (spin.key === key && act < 16 && cnt < lim) { const i = pickNext(); if (i < 0) return; req[i] = 1; act++; cnt++; const im = new Image(); im.decoding = 'async';
      im.onload = () => { act--; if (spin.key === key) { spin.im[i] = im; if (!hasBitmap) spin.bm[i] = im; else if (i % SPK === 0) { spin.pq.push(i); small(); } wake(); } next(); };
      im.onerror = () => { act--; fail(i); next(); };
      im.src = spinUrl(c, 0, i); } };
    spin.more = () => { if (spin.key === key && lim < n) { lim = n; next(); } };
    spin.next = next; next();
  }
  // pregătește din timp cadrele mari din jurul poziției p (locul spre care merge rotirea; mai multe în direcția de mers) și le
  // eliberează pe cele rămase departe și de ea, și de locul arătat acum
  function spinFeed(p) {
    const n = spin.cfg.n, g = spin.cfg.gol, ctr = Math.round(p); spin.want = wrap(ctr, n); if (spin.next) spin.next();
    if (!hasBitmap) return;
    const big = fine.matches, fwd = big ? 24 : 12, back = big ? 10 : 5, keep = fwd + 6;   // (pe telefoane și tablete mai puține: țin mai puțină memorie)
    for (let d = 0; d <= fwd && spin.nb < 6; d++) for (let k = 0; k < 2 && spin.nb < 6; k++) {
      if (k && (!d || d > back)) continue; let i = wrap(ctr + (k ? -d : d) * spin.dir, n); if (g) { const u = wrap(i - g.g0, n); if (u > 0 && u < g.L) i = u < g.L / 2 ? g.a : g.b; } const im = spin.im[i];
      if (!im || spin.bm[i] || spin.busy[i]) continue;
      spin.busy[i] = 1; spin.nb++; const key = spin.key;
      createImageBitmap(im).then(b => { if (spin.key !== key) { if (b.close) b.close(); return; } spin.nb--; spin.busy[i] = 0; spin.bm[i] = b; spin.cnt++; wake(); },
        () => { if (spin.key === key) { spin.nb--; spin.busy[i] = 0; spin.bm[i] = im; wake(); } });
    }
    if (++spin.gc >= 20 || spin.cnt > keep * 2 + 6) { spin.gc = 0; const at = wrap(Math.round(spin.pos), n);
      for (let i = 0; i < n; i++) { const b = spin.bm[i]; if (!b || !b.close || b === spin.ra || b === spin.rb) continue; let d = Math.abs(i - spin.want); d = Math.min(d, n - d); let e = Math.abs(i - at); e = Math.min(e, n - e); if (Math.min(d, e) > keep) { b.close(); spin.bm[i] = null; spin.cnt--; } } }
  }
  // cadrul mare (mai clar) al unghiului la care s-a oprit rotirea
  function spinBig(c, a) {
    const key = spin.key, url = spinUrl(c, 1, a * c.nl / c.n);
    const ok = img => { if (spin.key === key && spin.a === a && spin.lReq === a) { if (spin.lbm && spin.lbm.close) spin.lbm.close(); spin.lbm = img; setFrame(spin.texL, img); spin.lOk = true; wake(); } else if (img.close) img.close(); };
    if (hasBitmap && typeof fetch === 'function') fetch(url).then(r => (r.ok ? r.blob() : Promise.reject(new Error('img')))).then(b => createImageBitmap(b)).then(ok, () => {});
    else { const im = new Image(); im.onload = () => ok(im); im.src = url; }
  }
  // Imaginile celorlalte vederi (și planurile) se aduc din timp în memoria navigatorului, una câte una, doar pe calculator:
  // când vizitatorul trece la altă casă, imaginea ei e deja acolo și apare imediat.
  let warmed = 0;
  function warm() {
    if (warmed || !fine.matches || typeof fetch !== 'function' || (navigator.connection && navigator.connection.saveData)) return; warmed = 1;
    const urls = []; [-1, ...H.map((h, i) => i)].forEach(i => { const e = extOf(i, pvOf(i < 0 ? 'all' : 'house', i, 1)); if (e) urls.push(panoUrl('ai:' + e[0])); });
    if (W >= 900) H.forEach(h => (PLANURI[h.c.cod] || []).forEach(e => { if (e) urls.push(panoUrl('ai:' + e[0])); }));
    const step = () => { const u = urls.shift(); if (!u || dead) return; fetch(u).then(r => r.blob()).catch(() => {}).then(() => setTimeout(step, 150)); }; step();
  }
  // Tot din timp, pe calculator, se aduc în memoria navigatorului și primele cadre ale rotirii fiecărei case (cele din jurul vederii
  // ei și câte unul din 8 de jur împrejur, ~1 MB pe casă): când vizitatorul alege o casă și trage de ea, rotirea are de la început
  // ce arăta în orice parte, iar restul cadrelor vin pe parcurs.
  let warmedS = 0;
  function warmSpin() {
    if (warmedS || !fine.matches || typeof fetch !== 'function' || (navigator.connection && navigator.connection.saveData)) return; warmedS = 1;
    const L = H.map((h, i) => { const e = ROTIRI[h.c.cod], c = e && e[0]; return c && c.zi ? { c, p: Math.round((view('house', i, 1, 0).az - c.az0) / 360 * c.n) } : null; }).filter(Boolean);
    const urls = [], add = (c, i) => urls.push(spinUrl({ dir: c.zi }, 0, wrap(i, c.n)));
    L.forEach(o => { for (let d = -4; d <= 4; d++) add(o.c, o.p + d); });
    for (let k = 0; k < 192; k += 8) L.forEach(o => { if (k < o.c.n) add(o.c, k); });
    let act = 0; const step = () => { while (act < 2 && urls.length && !dead) { const u = urls.shift(); act++; fetch(u).then(r => r.blob()).catch(() => {}).then(() => { act--; setTimeout(step, 30); }); } }; step();
  }
  // vederea e o imagine reală care nu are filmare de rotire (toată grădina, planul, ecranul înalt): rămâne pe loc, nu se arată macheta
  const rotLocked = () => !walking() && !noPano && !spinCfg() && !!extKey();
  function goTo(m, i, d = 1.7) {
    CAMK.forEach(k => { from[k] = cur[k]; }); from.az += uaz; from.el = clamp(from.el + uel, 5, 86); uaz = uel = tuaz = tuel = 0;
    mode = m; sel = i; tr = rm ? 1 : 0; dur = d; needMeasure = 2; clearTimeout(backT); spin.on = false; glide = 0; wake();
  }
  /* Între două vederi nu se arată niciodată macheta 3D, dacă amândouă au imagine reală: imaginea de pe ecran rămâne (keep) până
     când imaginea vederii noi e gata, apoi se topește în ea (xf). xf poate fi o poză obișnuită (r = cât cuprinde), o fotografie
     360° „înghețată” (la ieșirea din casă) sau una „vie”, care se mai întoarce cu privirea (între camere, zi ↔ seară). */
  function keep(liveLook) {
    if (!started || tr < 1 || noPano || time !== timeGoal || rm) return false;
    let k = null;
    if (!walking() && spin.op > .9 && spin.a >= 0 && spin.cfg) { k = { tex: spin.lOk ? spin.texL : spin.texS, r: spin.cfg.r, own: 1 }; if (spin.lOk) spin.texL = frameTex(); else spin.texS = frameTex(); }   // textura cadrului trece la imaginea păstrată; rotirea primește una nouă
    else if (pOp > .9 && pA) k = pR ? { tex: pA, r: pR } : { tex: pA, H: pH, live: !!liveLook, ya: lastPY, pi: lastPP };
    if (!k) return false;
    if (xf && xf.own) xf.tex.dispose();
    xf = Object.assign(k, { fov: lastFov, offX, offY, op: 1, t0: performance.now() });
    pOp = 0; spin.op = 0; spin.a = spin.b = -1; spin.ra = spin.rb = null; spin.lOk = false; spin.on = false;
    return true;
  }
  // vederea la care s-a ajuns are imagine reală?
  const destImg = () => { if (!walking()) return !!extKey(); const w = H[sel].walk, p = w && w.pts[w.i]; return !!(p && p.k && !(p.ai && timeGoal > 15)); };
  // după schimbarea vederii: dacă noua vedere are imagine, camera sare direct la ea (fără zbor); dacă nu, se vede macheta, ca înainte
  function settle(kept) {
    if (!kept || !xf) return false;
    if (destImg()) { tr = 1; blend.k = 1; W3.k = 1; W3.pos.copy(W3.to); roofSnap = true; return true; }
    if (xf.own) xf.tex.dispose(); else pOp = 1; xf = null; return false;
  }
  // ziua și seara: seara există doar acolo unde sunt fotografii reale de seară (în X7, înăuntru); la ieșire se revine la zi, fără tranziție
  const dnSync = () => dnBtns.forEach(b => { const a = (b.dataset.t === 'seara') === (timeGoal > 15); b.classList.toggle('on', a); b.setAttribute('aria-pressed', a); });
  const day = () => { if (timeGoal > 15) { timeGoal = time = 10.6; lastN = -1; dnSync(); } };

  /* ---------- comenzi ---------- */
  function select(i, keepAuto) { if (!keepAuto) stopAuto(); const w = walking(), kept = keep(); if (w && !kept) startBlend(1.7); day(); lvl = 1; if (i < 0) goTo('all', -1); else goTo('house', i); if (w) tr = 1; settle(kept); sync(); measure(); extLoad(); spinPrep();
    if (i >= 0 && ((H[i].c.pano && window.VTN) || H[i].walk)) { const p = buildWalk(H[i]).pts[0]; if (p && p.k) pano.load(panoUrl(timeGoal > 15 && p.kn ? p.kn : p.k)); } }   // fotografia primei camere se cere din timp
  function enter(keepAuto, view) {
    if (sel < 0) return; if (!keepAuto) stopAuto(); const kept = keep(); lvl = 1; inView = view || 'walk';
    if (inView === 'walk' && !buildWalk(H[sel]).pts.length) inView = 'plan';
    if (inView === 'walk') { if (!kept) startBlend(1.8); goTo('in', sel, 1.5); tr = 1; goRoom(0, true); } else goTo('in', sel, 1.5);
    settle(kept); sync(); extLoad();
  }
  function leave(keepAuto) { if (sel < 0) return; if (!keepAuto) stopAuto(); const w = walking(), kept = keep(); if (w && !kept) startBlend(1.5); day(); goTo('house', sel, 1.4); if (w) tr = 1; settle(kept); sync(); }
  function setLvl(l, keepAuto) { if (!keepAuto) stopAuto(); const kept = keep(); lvl = l; goTo('in', sel, 1.2); settle(kept); sync(); extLoad(); }
  function setView(v) { if (mode !== 'in' || v === inView || sel < 0) return; stopAuto(); if (v === 'walk' && !buildWalk(H[sel]).pts.length) return; const kept = keep(); if (!kept) startBlend(1.5); if (v !== 'walk') day(); inView = v; lvl = 1; if (v === 'walk') goRoom(H[sel].walk.i, true); tr = 1; needMeasure = 2; settle(kept); sync(); extLoad(); wake(); }
  function room(i, keepAuto) { if (!walking()) return; if (!keepAuto) stopAuto(); const kept = keep(true); goRoom(i, kept, kept); settle(kept); sync(); }
  function setEvening(on) {
    const kept = keep(true); timeGoal = on ? 19.9 : 10.6; if (rm) time = timeGoal; spin.on = false; if (!on && !walking()) tuaz = tuel = 0;
    if (kept && destImg()) { time = timeGoal; lastN = -1; }   // de la o fotografie la alta (zi ↔ seară în X7): direct, fără machetă
    settle(kept); extLoad(); spinPrep(); dnSync(); wake();
  }
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
    sec.dataset.mode = mode;
    dnBox.hidden = !(walking() && H[sel].walk && H[sel].walk.pts.some(p => p.kn));   // „Zi / Seară” doar unde există fotografii reale de seară
    { const cue = mode === 'house' && !spun && !!spinCfg();   // prima dată când e aleasă o casă care se poate roti, i se spune vizitatorului
      hint.textContent = cue ? 'Trage ca să rotești casa' : 'Apasă pe o casă ca să o vezi de aproape'; if (started) hint.classList.toggle('off', !cue); }
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
    cReal.hidden = !walk; if (walk) cReal.textContent = w.pts.some(p => p.ai) ? 'Imagini realizate cu AI · orientative' : w.pts.some(p => p.g) ? 'Fotografii reale 360° din showroom · grădina de la ferestre e adăugată cu AI' : w.pts.some(p => p.k) ? 'Fotografii reale 360°, făcute în showroom' : 'Machetă 3D orientativă';
    sec.dataset.view = inside ? inView : '';
    lvlBox.hidden = !(inside && !walk && two); lvlBtns.forEach(b => { const on = +b.dataset.l === lvl; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    enterBtn.textContent = inside ? 'Ieși din casă' : 'Intră în casă';
    offer.href = 'https://wa.me/40731166070?text=' + encodeURIComponent('Bună! Aș dori o ofertă pentru modelul ' + h.c.cod + (m ? ' (' + fmtA(m.a) + ', ' + m.l + ')' : '') + '. Locația mea: ');
    photos.hidden = !(window.CATopen && inCat(h.c.cod)); tur.hidden = h.c.cod !== 'X7';
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
  photos.onclick = () => { if (sel >= 0 && window.CATopen && inCat(H[sel].c.cod)) window.CATopen(H[sel].c.cod); };
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
  canvas.addEventListener('pointerdown', e => { if (e.button) return; clearTimeout(backT); drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, touch: e.pointerType === 'touch', h: [], acc: 0 }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} hint.classList.add('off'); });
  canvas.addEventListener('pointermove', e => {
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.moved > 6) { stopAuto(); wake();
        if (walking()) { canvas.classList.add('drag'); W3.tyaw += dx * .2; if (!drag.touch) W3.tpitch = clamp(W3.tpitch + dy * .16, -40, 40); }
        else if (!rotLocked()) { canvas.classList.add('drag'); const sp = spinCfg(), dd = -dx * (sp ? .5 : .32); drag.acc += dd; tuaz = sp && sp.gol ? spinDrag(sp, to.az + tuaz, dd) - to.az : tuaz + dd; glide = 0;
          if (sp) { tuel = 0; spun = true; if (dx) spin.dir = dx < 0 ? 1 : -1; if (spin.more) spin.more(); }   // rotire reală: doar în jur, la aceeași înălțime
          else { if (!drag.touch) tuel += dy * .2; if (mode === 'all') tuaz = clamp(tuaz, -80, 80); tuel = clamp(tuel, 6 - to.el, 82 - to.el); }
          const h = drag.h; h.push(performance.now(), sp && sp.gol ? drag.acc : tuaz); if (h.length > 24) h.splice(0, 2); } }
    } else if (fine.matches && !walking()) { const i = pick(e); if (i !== hover) { hover = i; canvas.classList.toggle('can', i >= 0 && !(mode === 'in' && i === sel)); wake(); } }
  });
  const up = e => { if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; canvas.classList.remove('drag');
    if (d.moved > 6 && !walking() && !rotLocked()) {   // după ce dai drumul, rotirea mai alunecă lin, cu viteza pe care o avea mâna, și se oprește încet
      const h = d.h, L = h.length, tn = performance.now(), sp = spinCfg(); let vel = 0;
      if (L >= 4 && tn - h[L - 2] < 70) { let k = L - 2; while (k > 0 && h[L - 2] - h[k - 2] < 110) k -= 2; const ms = h[L - 2] - h[k]; if (ms > 15) vel = (h[L - 1] - h[k + 1]) / ms * 1000; }
      const gl = clamp(vel, -420, 420) * GLIDE; tuaz = sp && sp.gol ? spinDrag(sp, to.az + tuaz, gl) - to.az : tuaz + gl; if (mode === 'all') tuaz = clamp(tuaz, -80, 80);
      if (sp) { const st = 360 / sp.nl; tuaz = Math.round((to.az + tuaz - sp.az0) / st) * st + sp.az0 - to.az;   // se oprește pe un cadru care are și varianta mare
        if (sp.gol) { const g = sp.gol, n = sp.n, u = wrap(Math.round(spinP(sp, to.az + tuaz)) - g.g0, n); if (u > 0 && u < g.L) tuaz += (wrap((u < g.L / 2 ? g.a : g.b) - g.g0, n) - u) * 360 / n; } }   // …și niciodată în mijlocul golului: la capătul mai apropiat
      glide = 1; wake(); }
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
    if (awake > 0 && dt > .045) { if (++slow > 40 && px > 1.2e6) { px *= .72; slow = 0; } } else if (slow > 0) slow--;
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
    // rotirea urmează mâna strâns; după ce dai drumul mai alunecă și se oprește lin (socotit în timp, nu în cadre desenate)
    // (spre sfârșitul alunecării constanta de timp scade treptat: se așază ceva mai repede, fără să tresară)
    if (!drag && (tuaz || tuel) && rotLocked()) tuaz = tuel = 0;   // o vedere fără rotire nu rămâne întoarsă
    { const dA = tuaz - uaz, dE = tuel - uel; if (Math.abs(dA) + Math.abs(dE) > .01) { const k = 1 - Math.exp(-dt / (drag ? .045 : glide ? clamp(.1 + .08 * Math.abs(dA), .1, GLIDE) : .11)); uaz += dA * k; uel += dE * k; if (Math.abs(tuaz - uaz) < .02) uaz = tuaz; busy = true; } else if (!drag) glide = 0; }
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
    // rotirea reală a casei: pe ecran e cadrul de la unghiul la care s-a ajuns (și vecinul lui, amestecate)
    const sc = !wk && tr >= 1 && blend.k >= 1 && time === timeGoal ? spinCfg() : null; let sk = -1;
    if (sc && sc.dir === spin.key) {
      const n = sc.n, p0 = spinP(sc, cur.az), q = p0 + uaz / 360 * n;
      if (Math.abs(tuaz - uaz) > .2) spin.dir = tuaz > uaz ? 1 : -1;
      if (!spin.on && Math.abs(uaz) > .05 && spinSrc(Math.round(p0))) { spin.on = true; spin.pos = Math.round(p0); }
      if (spin.on) {
        const prev = spin.pos, pos = spin.pos = q, fl = Math.floor(pos), ce = Math.ceil(pos), g = sc.gol, ug = g ? wrap(pos - g.g0, n) : 0; let ia = null, ib = null, mix = 0;
        if (g && ug > 0 && ug < g.L && spinSrc(g.a) && spinSrc(g.b)) { const t = ug / g.L; ia = g.a; ib = g.b; mix = t * t * (3 - 2 * t); }   // în gol: capătul din urmă se topește în cel din față
        else {
          for (let d = 0; d <= 64; d++) if (spinSrc(fl - d)) { ia = fl - d; break; }
          for (let d = 0; d <= 64; d++) if (spinSrc(ce + d)) { ib = ce + d; break; }
          if (ia === null) ia = ib; else if (ib === null) ib = ia;
          if (ia !== null) { mix = ib > ia ? (pos - ia) / (ib - ia) : 0; if (ib - ia > 2 || Math.abs(pos - prev) > 1.2) mix = mix < .5 ? 0 : 1; }   // cadre depărtate sau viteză mare: un singur cadru, cel mai apropiat (fără imagine dublă)
        }
        if (ia !== null) {
          if (mix > .98) { ia = ib; mix = 0; } else if (mix < .02) { ib = ia; mix = 0; }
          const a = wrap(ia, n), b = wrap(ib, n), ra = spinSrc(a), rb = mix ? spinSrc(b) : null;
          if (ra !== spin.ra) {
            if (ra === spin.rb) { const t = spin.texS; spin.texS = spin.texB; spin.texB = t; spin.rb = spin.ra; }   // imaginea e deja pe placa video: se schimbă doar rolurile
            else setFrame(spin.texS, ra);
            spin.ra = ra; }
          if (rb && rb !== spin.rb) { setFrame(spin.texB, rb); spin.rb = rb; }
          if (a !== spin.a) { spin.a = a; spin.at = now; spin.lOk = false; spin.lReq = -1; }
          spin.b = b; spin.mix = mix; sk = a;
          if (!mix && !drag && !spin.lOk && spin.lReq !== a && now - spin.at > 300 && Math.abs(tuaz - uaz) < .05 && Number.isInteger(a * sc.nl / n)) { spin.lReq = a; spinBig(sc, a); }   // rotirea s-a oprit: cadrul mare
          if (now - spin.at < 600 || ra !== spin.bm[a]) busy = true;   // (cât pe ecran e doar copia mică, se așteaptă cadrul mare)
        } else if (spin.a >= 0) sk = spin.a;
      }
      spinFeed(spin.on ? p0 + tuaz / 360 * n : p0);
    } else if (spin.on && !sc) spin.on = false;
    // fotografia reală a camerei (dacă există): apare după ce camera a ajuns; la mers și la schimbarea zi/seară se vede macheta
    let pt = null, ph = 180, pr = null, pai = 0;   // pai: 1 = imagine făcută cu AI, 2 = fotografie reală în care doar grădina de la ferestre e adăugată cu AI
    if (wk) { if (W3.k >= 1) { const p = H[sel].walk.pts[H[sel].walk.i]; if (p && p.k && !(p.ai && timeGoal > 15)) { const night = timeGoal > 15 && p.kn, u = panoUrl(night ? p.kn : p.k); pt = pano.ready(u); if (!pt) pano.load(u).then(wake); ph = (night ? p.Hn : p.H) + 180 + H[sel].c.rot; pai = p.ai ? 1 : p.g && !night ? 2 : 0; } } }
    else if (tr >= 1 && blend.k >= 1 && Math.abs(uaz) + Math.abs(uel) < .05) { const e = extKey(); if (e && (mode !== 'in' || H[sel].k === lvl)) { const u = panoUrl('ai:' + e[0]); pt = pano.ready(u); if (!pt) pano.load(u, true).then(wake); pr = e.slice(1); pai = 1; } }   // din afară: imaginea realistă a vederii
    if (pt && pt !== pA && pOp < .02) { pA = pt; pH = ph; pR = pr; pAI = pai; }
    const sg = sk >= 0 ? 1 : 0; if (spin.op !== sg) { spin.op += clamp(sg - spin.op, -dt * 5, dt * 7); busy = true; }
    const hold = sk >= 0 && spin.op < 1 && pA && pR && pOp > 0;   // imaginea vederii rămâne până când cadrul rotirii a apărut de tot (să nu se vadă macheta între ele)
    const pg = hold ? pOp : pt && pt === pA && blend.k > .82 && time === timeGoal && !noPano ? 1 : 0;
    if (!live && pg === 1) pOp = 1;   // la pornire, pânza apare abia când imaginea reală e gata (vezi mai jos)
    if (pOp !== pg) { pOp += clamp(pg - pOp, -dt * (pR && pg < pOp ? 5 : 2.4), dt * 2.4); busy = true; }
    if (xf) { busy = true; if (pOp >= 1 || now - xf.t0 > 7000) { xf.op -= dt * (pOp >= 1 ? 1e3 : 2); if (xf.op <= 0) { if (xf.own) xf.tex.dispose(); xf = null; } } }
    { const fx = !wk && !drag && rotLocked(); if (fx !== fixCls) { fixCls = fx; canvas.classList.toggle('fix', fx); } }
    if (!warmed && pOp >= 1 && !wk) { warmed = -1; setTimeout(() => { warmed = 0; warm(); }, 1800); setTimeout(warmSpin, 4200); }
    if (aiOn !== ((pAI && pOp > .5) || spin.op > .5 || !!xf)) { aiOn = !aiOn; sec.classList.toggle('gd--ai', aiOn); }
    if (aiOn && aiEl) { const k = pAI === 2 && pOp > .5 && spin.op < .5 && !xf ? 2 : 1; if (k !== aiTxt) { aiTxt = k; aiEl.textContent = k === 2 ? AI_TXT[1] : AI_TXT[0]; } }   // mențiunea mică de pe imagine spune ce anume e făcut cu AI
    // acoperișurile și inelul auriu
    H.forEach((h, i) => {
      const kg = i === sel && mode === 'in' && inView === 'plan' ? lvl : 0;
      if (h.k !== kg) { h.k = rm || roofSnap ? kg : h.k + clamp(kg - h.k, -dt * 1.05, dt * 1.05); h.api.openRoof(h.k); G.renderer.shadowMap.needsUpdate = true; busy = true; }
      const rg = i === sel ? (mode === 'in' ? .0 : .85) : i === hover ? .6 : 0;
      if (Math.abs(rg - h.ro) > .004) { h.ro += (rg - h.ro) * .14; busy = true; } else h.ro = rg;
      h.ring.material.opacity = h.ro; h.ring.visible = h.ro > .004;
    });
    roofSnap = false;
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
      const az = (cur.az + uaz + (sway ? Math.sin(now / 1000 * .17) * 4 : 0)) * DEG, el = clamp(cur.el + (sk >= 0 ? 0 : uel), 5, 86) * DEG;
      cam.position.set(cur.tx + Math.sin(az) * Math.cos(el) * dist, cur.ty + Math.sin(el) * dist, cur.tz + Math.cos(az) * Math.cos(el) * dist); cam.lookAt(cur.tx, cur.ty, cur.tz);
      G.scene.fog.near = dist * 1.25; G.scene.fog.far = dist * 1.25 + 430;
    }
    if (blend.k < 1) { const e = ease(blend.k); tP.copy(cam.position); tQ.copy(cam.quaternion); cam.position.lerpVectors(blend.p0, tP, e); cam.quaternion.slerpQuaternions(blend.q0, tQ, e); fov = lerp(blend.fov0, fov, e); }
    cam.fov = fov; cam.near = wk || blend.k < 1 ? .08 : .5; cam.setViewOffset(W, Hh, -offX * W, -offY * Hh, W, Hh);
    cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();   // (etichetele se așază corect și când scena 3D nu se mai desenează)
    // Desenul: macheta 3D se desenează doar când pe ecran nu e o imagine reală întreagă. Unde o poză nu ajunge până la marginea
    // ecranului, pe lângă ea se pune tot ea, foarte ștearsă (renderBack), nu macheta.
    const show = pOp > .004 && pA, sFull = spin.op > .995 && sk >= 0 && pano.covers(sc.r, fov, asp, offX, offY);
    lastFov = fov; const xOn = xf && xf.op >= 1, xFull = xOn && (!xf.r || pano.covers(xf.r, xf.fov, asp, xf.offX, xf.offY));
    const pFull = pOp >= .995 && !!pA, pCov = !!pA && (!pR || pano.covers(pR, fov, asp, offX, offY));
    if (!sFull && !xFull && !(pFull && pCov)) {
      if (xOn) pano.renderBack(xf.tex, 1, xf.r, xf.fov, asp, xf.offX, xf.offY);
      else if (!(pFull && pR)) G.render();
      if (show && pR && !pCov && (xOn || pFull)) pano.renderBack(pA, pOp, pR, fov, asp, offX, offY);
    }
    if (xf) {
      if (xf.r) pano.renderFlat(xf.tex, xf.op, xf.r, xf.fov, asp, xf.offX, xf.offY);
      else if (xf.live) { cam.getWorldDirection(v); pano.render(xf.tex, null, 0, xf.op, xf.H - Math.atan2(v.x, v.z) / DEG, Math.asin(clamp(v.y, -1, 1)) / DEG, fov, asp, offX, offY); }
      else pano.render(xf.tex, null, 0, xf.op, xf.ya, xf.pi, xf.fov, asp, xf.offX, xf.offY);
    }
    if (show && pR) pano.renderFlat(pA, pOp, pR, fov, asp, offX, offY);
    else if (show) { cam.getWorldDirection(v); lastPY = pH - Math.atan2(v.x, v.z) / DEG; lastPP = Math.asin(clamp(v.y, -1, 1)) / DEG; pano.render(pA, null, 0, pOp, lastPY, lastPP, fov, asp, offX, offY); }
    if (spin.op > .004 && spin.a >= 0 && spin.cfg) pano.renderFlat(spin.lOk ? spin.texL : spin.texS, spin.op, spin.cfg.r, fov, asp, offX, offY);
    if (spin.op > .004 && sk >= 0 && spin.mix && spin.cfg) pano.renderFlat(spin.texB, spin.op * spin.mix, spin.cfg.r, fov, asp, offX, offY);
    // etichetele caselor și ale camerelor
    pins.forEach((p, i) => { v.copy(H[i].top).project(cam); const ok = v.z < 1 && Math.abs(v.x) < 1.05 && v.y < 1.1 && v.y > -1; p.style.visibility = ok ? 'visible' : 'hidden'; if (ok) p.style.transform = `translate(${((v.x * .5 + .5) * W).toFixed(1)}px,${((-v.y * .5 + .5) * Hh).toFixed(1)}px)`; p.classList.toggle('hov', i === hover); });
    if (rooms.length && wk) { const cw = H[sel].walk.i, sh = W3.k >= 1 && blend.k >= 1; rooms.forEach(r => { v.copy(r.w).project(cam); const ok = sh && r.i !== cw && v.z < 1 && Math.abs(v.x) < .96 && Math.abs(v.y) < .9; r.el.style.opacity = ok ? '1' : '0'; r.el.style.pointerEvents = ok ? 'auto' : 'none'; if (ok) r.el.style.transform = `translate(${((v.x * .5 + .5) * W).toFixed(1)}px,${((-v.y * .5 + .5) * Hh).toFixed(1)}px)`; }); }
    else if (rooms.length) { const h = H[sel]; rooms.forEach(r => { const o = mode === 'in' ? 1 - clamp(Math.abs(h.k - r.lvl) / .3) : 0; r.el.style.opacity = o.toFixed(2); if (o > .01) { h.g.localToWorld(v.copy(r.v)).project(cam); r.el.style.transform = `translate(${((v.x * .5 + .5) * W).toFixed(1)}px,${((-v.y * .5 + .5) * Hh).toFixed(1)}px)`; } }); }
    // pânza se arată abia când prima imagine reală e pe ea (până atunci rămâne „Se pregătește grădina…”); dacă imaginea întârzie mult, se arată macheta
    if (!bootT) bootT = now;
    if (!live) { if (pOp >= 1 || !extKey() || now - bootT > 9000) { live = true; sec.classList.add('gd--live'); } else awake = Math.max(awake, 12); }   // până apare scena, desenul nu adoarme (altfel, dacă imaginea nu vine, ar rămâne „Se pregătește”)
  }
  const kick = () => { if (!raf && visible && !dead && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; if (visible) awake = 40; kick(); }, { rootMargin: '120px 0px' }).observe(stage);
  new IntersectionObserver(es => { document.body.classList.toggle('in-gd', es[es.length - 1].isIntersecting); }, { rootMargin: '-45% 0px -45% 0px' }).observe(stage);
  document.addEventListener('visibilitychange', () => { awake = 40; kick(); });
  addEventListener('resize', () => { needMeasure = 1; wake(); });
  sync();
  window.__gradina = { G, H, select, enter, leave, setLvl, setEvening, setView, room, views() { const o = []; [['all', -1], ...H.map((h, i) => [h.c.cod, i])].forEach(([k, i]) => [0, 1].forEach(pv => { const add = (k, q) => o.push({ k, pv, tx: +q.tx.toFixed(3), ty: +q.ty.toFixed(3), tz: +q.tz.toFixed(3), az: +q.az.toFixed(3), el: +q.el.toFixed(3), dist: +q.dist.toFixed(3), fw: +q.fw.toFixed(3), fh: +q.fh.toFixed(3) }); add(k, view(i < 0 ? 'all' : 'house', i, 1, pv)); if (i >= 0) for (let l = 1; l <= (H[i].api.levels || 1); l++) add(k + '#' + l, view('in', i, l, pv)); })); return o; }, pano(on) { noPano = !on; if (!on) pOp = 0; wake(); }, get state() { return { mode, sel, lvl, time, tr, awake, inView, mP, wk: +W3.k.toFixed(2), bl: +blend.k.toFixed(2), pa: !!pA, uaz: +uaz.toFixed(1), spin: { on: spin.on, cur: spin.a, pos: +spin.pos.toFixed(3), mix: +spin.mix.toFixed(2), op: +spin.op.toFixed(2), n: spin.im.filter(Boolean).length, nb: spin.bm.filter(Boolean).length, xf: !!xf, big: spin.lOk }, pOp: +pOp.toFixed(2), room: sel >= 0 && H[sel].walk ? H[sel].walk.i : -1 }; }, jump(t) { if (t !== undefined) timeGoal = t; time = timeGoal; lastN = -1; tr = 1; snap = 4; blend.k = 1; W3.k = 1; W3.pos.copy(W3.to); W3.yaw = W3.tyaw; W3.pitch = W3.tpitch; H.forEach((h, i) => { h.k = i === sel && mode === 'in' && inView === 'plan' ? lvl : 0; h.api.openRoof(h.k); }); G.renderer.shadowMap.needsUpdate = true; wake(); } };
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
