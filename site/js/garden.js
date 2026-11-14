// Grădina cu case model (#gradina): o scenă 3D în care vizitatorul trece de la o casă la alta și intră în fiecare.
// Marcajul și stilurile: surse/final/parts/gradina.html. Casele: js/gradina-data.js + js/h_<nume>.js (vezi surse/final/CASE-3D.md).
// Scena de bază (cer, gazon, soare, seara): js/gscene.js. Datele afișate (m², dimensiuni, preț) vin din window.CAT.
import { THREE, clamp, lerp, ease, webglOK, tree, blobTexture, pavingTexture, perimeter, sweep, cap, box } from './kit.js';
import { createGScene } from './gscene.js';
import { lampPost } from './furn.js';
import { CASE, GRADINA } from './gradina-data.js';

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
  mods.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    try {
      const c = CASE[i], api = r.value.build(G.M), inf = r.value.info || {}, s = api.size || { w: inf.w, d: inf.d, h: inf.h, cz: 0 };
      const g = new THREE.Group(); g.position.set(c.x, 0, c.z); g.rotation.y = c.rot * DEG; g.add(api.root); G.scene.add(g);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), new THREE.MeshBasicMaterial({ visible: false })); hit.position.set(0, s.h / 2, s.cz || 0); g.add(hit);
      g.updateMatrixWorld(true);
      H.push({ c, cat: catOf(c.cod), api, g, s, hit, k: 0, ring: null, ro: 0, side: -1, sideP: -1, center: g.localToWorld(new THREE.Vector3(0, 0, s.cz || 0)), top: g.localToWorld(new THREE.Vector3(0, s.h + 1.5, s.cz || 0)) });
    } catch (e) { console.warn('gradina: casa ' + CASE[i].cod + ' nu s-a putut construi', e); }
  });
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
    enterBtn = $('.gd-enter'), offer = $('.gd-offer'), photos = $('.gd-photos'), tur = $('.gd-tur'), tourBtn = $('.gd-tour'), dnBtns = [...sec.querySelectorAll('.gd-dn button')], hint = $('.gd-hint');
  chipsEl.innerHTML = `<button type="button" class="gd-chip on" data-i="-1" aria-pressed="true">Toată grădina</button>` + H.map((h, i) => `<button type="button" class="gd-chip" data-i="${i}" aria-pressed="false">${esc(h.c.cod)}</button>`).join('');
  const chips = [...chipsEl.children];
  const pins = H.map((h, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'gd-pin'; b.dataset.i = i; b.innerHTML = `<b>${esc(h.c.cod)}</b>${h.cat ? `<span>${fmtA(h.cat.a)}</span>` : ''}`; b.setAttribute('aria-label', 'Casa ' + h.c.cod + (h.cat ? ', ' + fmtA(h.cat.a) : '')); pinBox.appendChild(b); return b; });
  let rooms = [];

  /* ---------- stare ---------- */
  const GZ = GRADINA.centruZ, CAMK = ['tx', 'ty', 'tz', 'az', 'el', 'fw', 'fh', 'fov'], cur = {}, from = {}, to = {};
  let mode = 'all', sel = -1, lvl = 1, W = 0, Hh = 0, mP = 0, tr = 1, dur = 1.7, uaz = 0, uel = 0, tuaz = 0, tuel = 0, offX = 0, offY = 0, tOffX = 0, tOffY = 0,
    time = 10.6, timeGoal = 10.6, hover = -1, visible = false, raf = 0, last = 0, awake = 30, needMeasure = 2, started = false, auto = null, drag = null, lastN = -1, snap = 0, freeW = 1, freeH = 1;
  const wake = () => { awake = 40; kick(); };

  /* unde stă camera: toată grădina, o casă văzută din față, o casă văzută de sus (în interior). L = ecran lat, P = ecran înalt */
  function station(out) {
    let L, P;
    if (mode === 'all' || sel < 0) {
      L = { tx: 0, ty: 1, tz: GZ + 3, az: 0, el: 31, fw: 82, fh: 47 }; P = { tx: 0, ty: 1, tz: GZ + 2, az: 0, el: 50, fw: 50, fh: 78 };
    } else {
      const h = H[sel], s = h.s, r = h.c.rot, c = h.center, long = s.w >= s.d, two = h.api.levels > 1;
      if (mode === 'house') {
        const a = 30 * DEG, b = 56 * DEG;
        L = { tx: c.x, ty: s.h * .42, tz: c.z, az: r + h.side * 30, el: 13, fw: (s.w * Math.cos(a) + s.d * Math.sin(a)) * 1.12 + 3.5, fh: s.h * 1.7 + 3 };
        P = { tx: c.x, ty: s.h * .45, tz: c.z, az: r + h.sideP * (long ? 56 : 26), el: 21, fw: (long ? s.w * Math.cos(b) + s.d * Math.sin(b) : s.w * 1.2) + 2.5, fh: s.h * 2.2 + 5 };
      } else {
        const y = two && lvl === 1 ? s.h * .5 + .8 : 1.1;
        L = { tx: c.x, ty: y, tz: c.z, az: r + h.side * 14, el: 58, fw: s.w + 4.5, fh: s.d * .95 + 5.5 };
        P = { tx: c.x, ty: y, tz: c.z, az: r + h.sideP * (long ? 90 : 10), el: 72, fw: (long ? s.d : s.w) + 3.2, fh: (long ? s.w : s.d) + 4.5 };
      }
    }
    const q = mode === 'in' ? Math.round(mP) : mP; L.fov = 34; P.fov = 46;
    CAMK.forEach(k => { out[k] = lerp(L[k], P[k], q); }); return out;
  }
  function goTo(m, i, d = 1.7) {
    CAMK.forEach(k => { from[k] = cur[k]; }); from.az += uaz; from.el = clamp(from.el + uel, 5, 86); uaz = uel = tuaz = tuel = 0;
    mode = m; sel = i; tr = rm ? 1 : 0; dur = d; needMeasure = 2; wake();
  }

  /* ---------- comenzi ---------- */
  function select(i, keepAuto) { if (!keepAuto) stopAuto(); lvl = 1; if (i < 0) goTo('all', -1); else goTo('house', i); sync(); }
  function enter(keepAuto) { if (sel < 0) return; if (!keepAuto) stopAuto(); lvl = 1; goTo('in', sel, 1.5); sync(); }
  function leave(keepAuto) { if (sel < 0) return; if (!keepAuto) stopAuto(); goTo('house', sel, 1.4); sync(); }
  function setLvl(l, keepAuto) { if (!keepAuto) stopAuto(); lvl = l; goTo('in', sel, 1.2); sync(); }
  function setEvening(on) { timeGoal = on ? 19.9 : 10.6; if (rm) time = timeGoal; dnBtns.forEach(b => { const a = (b.dataset.t === 'seara') === on; b.classList.toggle('on', a); b.setAttribute('aria-pressed', a); }); wake(); }
  function startAuto() { auto = { i: sel, step: 0, at: 0 }; tourBtn.classList.add('on'); tourBtn.setAttribute('aria-pressed', 'true'); tourBtn.querySelector('span').textContent = 'Oprește turul'; wake(); }
  function stopAuto() { if (!auto) return; auto = null; tourBtn.classList.remove('on'); tourBtn.setAttribute('aria-pressed', 'false'); tourBtn.querySelector('span').textContent = 'Tur ghidat'; }
  function stepAuto(now) {
    const a = auto;
    if (a.step === 0) { a.i = (a.i + 1) % H.length; select(a.i, true); a.at = now + 4400; a.step = 1; }
    else if (a.step === 1) { enter(true); a.at = now + 4800; a.step = H[a.i].api.levels > 1 ? 2 : 3; }
    else if (a.step === 2) { setLvl(2, true); a.at = now + 4000; a.step = 3; }
    else { leave(true); a.at = now + 1700; a.step = 0; }
  }

  function sync() {
    sec.dataset.mode = mode; if (started) hint.classList.add('off');
    chips.forEach(b => { const on = +b.dataset.i === sel; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); if (on && b.scrollIntoView && chipsEl.scrollWidth > chipsEl.clientWidth) chipsEl.scrollTo({ left: b.offsetLeft - chipsEl.clientWidth / 2 + b.offsetWidth / 2, behavior: rm ? 'auto' : 'smooth' }); });
    pins.forEach((p, i) => { p.classList.toggle('sm', mode === 'house'); p.classList.toggle('hide', mode === 'in' || i === sel); p.tabIndex = (mode === 'in' || i === sel) ? -1 : 0; });
    labBox.innerHTML = ''; rooms = [];
    if (sel < 0) return;
    const h = H[sel], m = h.cat, two = h.api.levels > 1, inside = mode === 'in';
    cSer.textContent = m ? 'Seria ' + m.s + ' · ' + m.sn : 'Casă model'; cName.textContent = h.c.cod;
    cNota.textContent = h.c.nota || ''; cNota.hidden = !h.c.nota; cDesc.textContent = m ? m.t : '';
    cA.textContent = m ? fmtA(m.a) : '–'; cD.textContent = m ? m.d : '–'; cL.textContent = m ? m.l : '–'; cP.textContent = priceOf(m) || '–';
    const rs = (h.api.rooms || []).filter(r => (r.lvl || 1) === lvl);
    cRooms.hidden = !inside; if (inside) { cRoomsT.textContent = two ? (lvl === 1 ? 'La etaj' : 'La parter') : 'Camere'; cRoomsV.textContent = [...new Set(rs.map(r => r.n))].join(' · '); }
    lvlBox.hidden = !(inside && two); lvlBtns.forEach(b => { const on = +b.dataset.l === lvl; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    enterBtn.textContent = inside ? 'Ieși din casă' : 'Intră în casă';
    offer.href = 'https://wa.me/40731166070?text=' + encodeURIComponent('Bună! Aș dori o ofertă pentru modelul ' + h.c.cod + (m ? ' (' + fmtA(m.a) + ', ' + m.l + ')' : '') + '. Locația mea: ');
    photos.hidden = !(m && window.CATopen); tur.hidden = h.c.cod !== 'X7';
    if (inside) rooms = (h.api.rooms || []).map(r => { const e = document.createElement('div'); e.className = 'gd-room'; e.textContent = r.n; labBox.appendChild(e); return { el: e, v: new THREE.Vector3(r.x, r.y, r.z), lvl: r.lvl || 1 }; });
  }

  chipsEl.addEventListener('click', e => { const b = e.target.closest('.gd-chip'); if (b) select(+b.dataset.i); });
  pinBox.addEventListener('click', e => { const b = e.target.closest('.gd-pin'); if (b) select(+b.dataset.i); });
  $('.gd-prev').onclick = () => select(sel < 0 ? H.length - 1 : (sel - 1 + H.length) % H.length);
  $('.gd-next').onclick = () => select((sel + 1) % H.length);
  $('.gd-c-x').onclick = () => (mode === 'in' ? leave() : select(-1));
  enterBtn.onclick = () => (mode === 'in' ? leave() : enter());
  lvlBtns.forEach(b => { b.onclick = () => setLvl(+b.dataset.l); });
  photos.onclick = () => { if (sel >= 0 && window.CATopen) window.CATopen(H[sel].c.cod); };
  dnBtns.forEach(b => { b.onclick = () => setEvening(b.dataset.t === 'seara'); });
  tourBtn.onclick = () => (auto ? stopAuto() : startAuto());
  if (rm) tourBtn.hidden = true;
  stage.addEventListener('keydown', e => { if (e.key === 'Escape' && mode !== 'all' && !document.querySelector('#cmodal.on')) { e.stopPropagation(); mode === 'in' ? leave() : select(-1); } });

  /* ---------- apăsat și tras pe scenă ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hits = H.map(h => h.hit);
  const pick = e => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); cam.updateMatrixWorld(); ray.setFromCamera(ndc, cam); const x = ray.intersectObjects(hits, false)[0]; return x ? hits.indexOf(x.object) : -1; };
  canvas.addEventListener('pointerdown', e => { if (e.button) return; drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, touch: e.pointerType === 'touch' }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} hint.classList.add('off'); });
  canvas.addEventListener('pointermove', e => {
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.moved > 6) { stopAuto(); tuaz -= dx * .3; if (!drag.touch) tuel += dy * .2; if (mode === 'all') tuaz = clamp(tuaz, -80, 80); tuel = clamp(tuel, 6 - to.el, 82 - to.el); canvas.classList.add('drag'); wake(); }
    } else if (fine.matches) { const i = pick(e); if (i !== hover) { hover = i; canvas.classList.toggle('can', i >= 0 && !(mode === 'in' && i === sel)); wake(); } }
  });
  const up = e => { if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; canvas.classList.remove('drag'); if (e.type === 'pointerup' && d.moved < 7) { const i = pick(e); if (i >= 0) { if (i === sel && mode === 'house') enter(); else if (i !== sel) select(i); } } };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { if (hover >= 0) { hover = -1; canvas.classList.remove('can'); wake(); } });

  /* ---------- cadrul ---------- */
  const v = new THREE.Vector3();
  function measure() {
    W = stage.clientWidth; Hh = stage.clientHeight; let x0 = 0, y0 = 0, y1 = Hh - 64;
    if (mode !== 'all') { if (W >= 900) x0 = card.offsetWidth + 28; else { y0 = 46; y1 = Math.max(y0 + 120, Hh - card.offsetHeight - 70); } }
    freeW = W - x0; freeH = y1 - y0; mP = clamp((1.25 - freeW / freeH) / .5); tOffX = (x0 + W) / 2 / W - .5; tOffY = (y0 + y1) / 2 / Hh - .5;
  }
  function frame(now) {
    raf = 0; if (dead || !visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    if (G.fit(stage, innerWidth < 800 ? 1.6 : 2) || !W) { needMeasure = 1; awake = 40; }
    if (needMeasure && !--needMeasure) { measure(); if (!started) { offX = tOffX; offY = tOffY; } }
    if (!W) { measure(); }
    if (snap) { snap--; measure(); offX = tOffX; offY = tOffY; uaz = tuaz; uel = tuel; awake = 40; }
    if (auto && now >= auto.at) stepAuto(now);
    // camera: zbor lin spre locul ales
    station(to);
    if (!started) { started = true; CAMK.forEach(k => { cur[k] = to[k]; }); if (!rm) { CAMK.forEach(k => { from[k] = to[k]; }); from.el = to.el + 30; from.fw = to.fw * 1.5; from.fh = to.fh * 1.5; from.az = -34; tr = 0; dur = 2.8; } }
    let busy = false;
    if (tr < 1) { tr = Math.min(1, tr + dt / dur); const k = ease(tr); CAMK.forEach(n => { cur[n] = lerp(from[n], to[n], k); }); cur.az = from.az + ((((to.az - from.az) % 360) + 540) % 360 - 180) * k; busy = true; }
    else CAMK.forEach(n => { cur[n] = to[n]; });
    if (Math.abs(tuaz - uaz) + Math.abs(tuel - uel) > .02) { uaz += (tuaz - uaz) * .16; uel += (tuel - uel) * .16; busy = true; }
    if (Math.abs(tOffX - offX) + Math.abs(tOffY - offY) > .0008) { offX += (tOffX - offX) * .09; offY += (tOffY - offY) * .09; busy = true; }
    // ora zilei
    if (time !== timeGoal) { time += clamp(timeGoal - time, -dt * 3.4, dt * 3.4); busy = true; lastN = -2; }
    if (lastN < 0) { const d = G.setTime(time); env.night(d.n); G.renderer.shadowMap.needsUpdate = true; const nn = d.n > .5 ? 1 : 0; if (nn !== lastN) sec.classList.toggle('gd--night', !!nn); lastN = time === timeGoal ? nn : -1; }
    // acoperișurile și inelul auriu
    H.forEach((h, i) => {
      const kg = i === sel && mode === 'in' ? lvl : 0;
      if (h.k !== kg) { h.k = rm ? kg : h.k + clamp(kg - h.k, -dt * 1.05, dt * 1.05); h.api.openRoof(h.k); G.renderer.shadowMap.needsUpdate = true; busy = true; }
      const rg = i === sel ? (mode === 'in' ? .0 : .85) : i === hover ? .6 : 0;
      if (Math.abs(rg - h.ro) > .004) { h.ro += (rg - h.ro) * .14; busy = true; } else h.ro = rg;
      h.ring.material.opacity = h.ro; h.ring.visible = h.ro > .004;
    });
    const sway = mode === 'all' && !rm && !drag;
    if (busy || sway) awake = Math.max(awake, 12);
    if (awake <= 0) return; awake--;
    const asp = W / Hh, fov = cur.fov, tn = Math.tan(fov * DEG / 2), dist = Math.max((cur.fh / 2) / tn * (Hh / freeH), (cur.fw / 2) / (tn * asp) * (W / freeW));
    cam.fov = fov; cam.setViewOffset(W, Hh, -offX * W, -offY * Hh, W, Hh);
    const az = (cur.az + uaz + (sway ? Math.sin(now / 1000 * .17) * 4 : 0)) * DEG, el = clamp(cur.el + uel, 5, 86) * DEG;
    cam.position.set(cur.tx + Math.sin(az) * Math.cos(el) * dist, cur.ty + Math.sin(el) * dist, cur.tz + Math.cos(az) * Math.cos(el) * dist); cam.lookAt(cur.tx, cur.ty, cur.tz);
    G.scene.fog.near = dist * 1.25; G.scene.fog.far = dist * 1.25 + 430;
    G.render();
    // etichetele caselor și ale camerelor
    pins.forEach((p, i) => { v.copy(H[i].top).project(cam); const ok = v.z < 1 && Math.abs(v.x) < 1.05 && v.y < 1.1 && v.y > -1; p.style.visibility = ok ? 'visible' : 'hidden'; if (ok) p.style.transform = `translate(${((v.x * .5 + .5) * W).toFixed(1)}px,${((-v.y * .5 + .5) * Hh).toFixed(1)}px)`; p.classList.toggle('hov', i === hover); });
    if (rooms.length) { const h = H[sel]; rooms.forEach(r => { const o = mode === 'in' ? 1 - clamp(Math.abs(h.k - r.lvl) / .3) : 0; r.el.style.opacity = o.toFixed(2); if (o > .01) { h.g.localToWorld(v.copy(r.v)).project(cam); r.el.style.transform = `translate(${((v.x * .5 + .5) * W).toFixed(1)}px,${((-v.y * .5 + .5) * Hh).toFixed(1)}px)`; } }); }
    if (!sec.classList.contains('gd--live')) sec.classList.add('gd--live');
  }
  const kick = () => { if (!raf && visible && !dead && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; if (visible) awake = 40; kick(); }, { rootMargin: '120px 0px' }).observe(stage);
  new IntersectionObserver(es => { document.body.classList.toggle('in-gd', es[es.length - 1].isIntersecting); }, { rootMargin: '-45% 0px -45% 0px' }).observe(stage);
  document.addEventListener('visibilitychange', () => { awake = 40; kick(); });
  addEventListener('resize', () => { needMeasure = 1; wake(); });
  sync();
  window.__gradina = { G, H, select, enter, leave, setLvl, setEvening, get state() { return { mode, sel, lvl, time, tr, awake }; }, jump(t) { if (t !== undefined) timeGoal = t; time = timeGoal; lastN = -1; tr = 1; snap = 4; H.forEach((h, i) => { h.k = i === sel && mode === 'in' ? lvl : 0; h.api.openRoof(h.k); }); G.renderer.shadowMap.needsUpdate = true; wake(); } };
}

/* ---------- grădina: gard viu, alei cu dale, flori, copaci, lămpi ---------- */
function buildGarden(G, H) {
  const { scene, M } = G, S = o => new THREE.MeshStandardMaterial(o), g = new THREE.Group(); scene.add(g);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rr = (a, b) => a + (b - a) * rnd();
  const { latime: GW, adancime: GD, centruZ: GZ, intrareZ: EZ } = GRADINA;
  const m = {
    hedge: S({ color: 0x3f6b3a, roughness: 1, side: THREE.DoubleSide }), stone: S({ color: 0xd9d3c7, roughness: .95 }), soil: S({ color: 0x4f3e31, roughness: 1 }),
    pave: S({ color: 0xffffff, roughness: .95, map: pavingTexture('#e6e1d6', 'rgba(70,60,45,.13)') }), trunk: S({ color: 0x6d5846, roughness: 1 }),
    leaf: [0x4d8a44, 0x6aa353, 0x35683a, 0x7fae5c].map(c => S({ color: c, roughness: 1, flatShading: true })),
    bush: S({ color: 0x4a7f42, roughness: 1, flatShading: true }), tuft: S({ color: 0x5c9150, roughness: 1 }), flower: S({ color: 0xffffff, roughness: .8 }),
    gold: () => new THREE.MeshBasicMaterial({ color: 0xd4a24c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
    glow: new THREE.MeshBasicMaterial({ map: blobTexture('rgba(255,196,120,.55)', 'rgba(255,196,120,0)'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
  };
  m.pave.map.repeat.set(.42, .42);
  const sh = (o, cast = true, recv = true) => { o.castShadow = cast; o.receiveShadow = recv; return o; };
  const flat = (geo, mat, y) => { const o = new THREE.Mesh(geo, mat); o.rotation.x = -Math.PI / 2; o.position.y = y; o.receiveShadow = true; return o; };
  const lamps = [];

  // gardul viu, cu poartă în față
  const hp = perimeter(GW, GD, 9), prof = [{ d: 0, y: 0 }, { d: 0, y: 1.2 }, { d: .18, y: 1.38 }, { d: .95, y: 1.38 }, { d: 1.13, y: 1.2 }, { d: 1.13, y: 0 }];
  const hedge = sh(new THREE.Mesh(sweep(hp, prof, { ds: .9, s0: hp.a + 3.7, s1: hp.total + hp.a - 3.7 }), m.hedge)); hedge.position.z = GZ; g.add(hedge);
  [-1, 1].forEach(sg => { g.add(sh(box(.8, 2, .8, m.stone, sg * 4.2, 1, EZ - .5)), sh(box(.95, .08, .95, m.stone, sg * 4.2, 2.42, EZ - .5))); const l = box(.5, .36, .5, M.lamp, sg * 4.2, 2.2, EZ - .5); g.add(l); lamps.push([sg * 4.2, EZ - 1.6, 5]); });

  // locul fiecărei case: platformă pavată, inel auriu (la alegere), lumină caldă pe iarbă seara
  H.forEach(h => {
    const s = h.s, cz = s.cz || 0;
    const pad = new THREE.Mesh(cap(perimeter(s.w + 2.6, s.d + 2.6, 1.4), .03), m.pave); pad.position.z = cz; pad.receiveShadow = true; h.g.add(pad);
    h.ring = new THREE.Mesh(sweep(perimeter(s.w + 3.5, s.d + 3.5, 1.85), [{ d: 0, y: .05 }, { d: .17, y: .05 }], { ds: .45 }), m.gold()); h.ring.position.z = cz; h.ring.visible = false; h.ring.renderOrder = 3; h.g.add(h.ring);
    const gl = flat(new THREE.PlaneGeometry(s.w + 9, s.d + 11), m.glow, .045); gl.receiveShadow = false; gl.position.z = cz + 1.5; gl.renderOrder = 2; h.g.add(gl);
  });

  // aleile: dale pe iarbă, de la poartă la rondul din mijloc și de acolo la fiecare casă
  const stones = [];
  const path = (pts, step = .98) => { const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1]))), n = Math.max(2, Math.floor(cv.getLength() / step));
    for (let i = 0; i <= n; i++) { const p = cv.getPointAt(i / n), t = cv.getTangentAt(i / n); if (Math.hypot(p.x, p.z) < 4.1) continue; stones.push([p.x + rr(-.05, .05), p.z + rr(-.05, .05), Math.atan2(t.x, t.z) + rr(-.1, .1), rr(.92, 1.08)]); } };
  path([[0, EZ + 6], [.5, EZ - 3], [-1.3, 19], [1.1, 10], [0, 4]]);
  let backEnd = [0, GZ - 8];
  H.forEach(h => { const dp = h.g.localToWorld(new THREE.Vector3(0, 0, (h.s.cz || 0) + h.s.d / 2 + 1.5)); h.door = dp; if (Math.abs(dp.x) < 3) backEnd = [dp.x, dp.z]; });
  path([[0, -4], [-1.1, backEnd[1] * .4], [.9, backEnd[1] * .75], backEnd]);
  H.forEach(h => { const d = h.door; if (Math.abs(d.x) < 3) return; const z0 = clamp(d.z + 3, backEnd[1] + 4, EZ - 6), sx = Math.sign(d.x); path([[sx * 1.2, z0], [d.x * .5, (z0 + d.z) / 2 + 1.2], [d.x, d.z]]); lamps.push([d.x - sx * 2.2, d.z + 1.2, 4.5]); });
  const sm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.08, .06, .5), m.stone, stones.length), dm = new THREE.Object3D(); sm.receiveShadow = true;
  stones.forEach((s, i) => { dm.position.set(s[0], .03, s[1]); dm.rotation.set(0, s[2], 0); dm.scale.set(s[3], 1, s[3]); dm.updateMatrix(); sm.setMatrixAt(i, dm.matrix); }); g.add(sm);

  // rondul din mijloc, cu un copac
  g.add(flat(new THREE.ShapeGeometry(new THREE.Shape().absarc(0, 0, 3.9, 0, Math.PI * 2), 40), m.pave, .035));
  const pot = sh(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.62, .5, 36), m.stone)); pot.position.y = .25; g.add(pot);
  const so = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.34, .06, 36), m.soil); so.position.y = .5; g.add(so);
  const t0 = tree(0, 1.5, { trunk: m.trunk, leaf: m.leaf[1] }); t0.position.y = .45; g.add(t0);
  [[-3.1, 1.9, .5], [3.1, -1.9, .5 + Math.PI]].forEach(([x, z, a]) => { const b = new THREE.Group(); b.add(sh(box(1.7, .07, .46, M.wood, 0, .45, 0)), sh(box(.08, .45, .4, m.stone, -.7, .225, 0)), sh(box(.08, .45, .4, m.stone, .7, .225, 0))); b.position.set(x, 0, z); b.rotation.y = a; g.add(b); });
  lamps.push([-3.3, 9, 4.5], [3.2, 18, 4.5], [-2.6, GZ - 6, 4.5]);

  // straturi cu flori
  const beds = [[-27.6, 19, 2.2, 6, 0], [-28.2, 1, 2, 6.5, 1], [-27.6, -24, 2.2, 8, 2], [27.6, 20, 2.2, 6, 1], [28.2, 0, 2, 6.5, 3], [27.6, -25, 2.2, 8, 0],
    [-14, GZ - GD / 2 + 3.4, 8, 1.9, 3], [14, GZ - GD / 2 + 3.4, 8, 1.9, 1], [-14.5, EZ - 3.2, 7, 1.8, 2], [14.5, EZ - 3.2, 7, 1.8, 0], [-4.6, 20, 1.3, 4.4, 1], [4.7, 15, 1.3, 4.4, 2], [-6.6, -1.2, 1.4, 3, 0], [6.6, 1.2, 1.4, 3, 3]];
  const pal = [[0x9a7fe0, 0xf4f1ff], [0xee8fb0, 0xffffff], [0xf3c64e, 0xf59a4a], [0x8f6fd6, 0xe98ab3]];
  const fl = [], tu = [];
  beds.forEach(([x, z, rx, rz, pi]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .14, 28), m.soil); b.scale.set(rx, 1, rz); b.position.set(x, .07, z); b.receiveShadow = true; g.add(b);
    const ar = rx * rz * Math.PI, pt = () => { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * .93; return [x + Math.cos(a) * r * rx, z + Math.sin(a) * r * rz]; };
    for (let i = 0; i < ar * 3; i++) { const p = pt(); fl.push([p[0], rr(.3, .52), p[1], rr(.75, 1.25), pal[pi][rnd() < .68 ? 0 : 1]]); }
    for (let i = 0; i < ar * 1.7; i++) { const p = pt(); tu.push([p[0], p[1], rr(.8, 1.3)]); }
  });
  const fm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.13, 0), m.flower, fl.length), col = new THREE.Color();
  fl.forEach((f, i) => { dm.position.set(f[0], f[1], f[2]); dm.rotation.set(0, 0, 0); dm.scale.setScalar(f[3]); dm.updateMatrix(); fm.setMatrixAt(i, dm.matrix); fm.setColorAt(i, col.setHex(f[4])); }); fm.receiveShadow = true; g.add(fm);
  const tm = new THREE.InstancedMesh(new THREE.ConeGeometry(.2, .42, 5), m.tuft, tu.length);
  tu.forEach((t, i) => { dm.position.set(t[0], .14 + .2 * t[2], t[1]); dm.rotation.set(0, rnd() * 3, 0); dm.scale.setScalar(t[2]); dm.updateMatrix(); tm.setMatrixAt(i, dm.matrix); }); tm.receiveShadow = true; g.add(tm);

  // tufe rotunde și copaci
  const bs = []; beds.forEach(([x, z, rx, rz]) => { const long = rz > rx; bs.push([x + (long ? 0 : -rx * .92), z + (long ? -rz * .92 : 0), rr(.6, .95)], [x + (long ? 0 : rx * .92), z + (long ? rz * .92 : 0), rr(.6, .95)]); });
  for (let i = 0; i < 10; i++) bs.push([rr(-1, 1) * (GW / 2 - 4), GZ - GD / 2 + rr(2.2, 3.4), rr(.7, 1.15)]);
  const bm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), m.bush, bs.length);
  bs.forEach((b, i) => { dm.position.set(b[0], b[2] * .62, b[1]); dm.rotation.set(0, rnd() * 3, 0); dm.scale.set(b[2], b[2] * .78, b[2]); dm.updateMatrix(); bm.setMatrixAt(i, dm.matrix); }); sh(bm); g.add(bm);
  const trees = [[-26.5, 24.5, 0, 1.25], [26.8, 25, 1, 1.3], [-28, -9.5, 1, 1.5], [28, -12, 0, 1.4], [27.5, -37, 0, 1.6], [-26.5, -38, 0, 1.7], [9.5, GZ - GD / 2 + 4, 1, 1.5], [-10.5, GZ - GD / 2 + 4, 1, 1.45], [28, 10, 1, 1.2], [-28.5, 10.5, 0, 1.25]];
  for (let i = 0; i < 30; i++) { const a = (-125 + 250 * (i + rr(-.3, .3)) / 29) * DEG, R = rr(50, 70); trees.push([Math.sin(a) * R, GZ - Math.cos(a) * R, rnd() < .45 ? 1 : 0, rr(1.7, 2.9)]); }
  trees.forEach(([x, z, kind, s], i) => { const t = tree(kind, s, { trunk: m.trunk, leaf: m.leaf[(i * 7 + kind) % m.leaf.length] }); t.position.set(x, 0, z); t.rotation.y = rnd() * 6; g.add(t); });

  // lămpile de grădină și lumina lor pe iarbă (seara)
  lamps.forEach(([x, z, r], i) => { if (i > 1) { const l = lampPost(M, 2.5); l.position.set(x, 0, z); g.add(l); } const gl = flat(new THREE.PlaneGeometry(r * 2, r * 2), m.glow, .05); gl.position.x = x; gl.position.z = z; gl.receiveShadow = false; gl.renderOrder = 2; g.add(gl); });
  return { night(n) { m.glow.opacity = n * .85; } };
}
