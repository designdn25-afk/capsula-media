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
    live = false; sec.classList.remove('st--live', 'st--dark'); sec.classList.add('st--static');
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
  const PTS = []; KEYS.forEach(k => { PTS.push([k.p[0], k]); PTS.push([k.p[1], k]); });
  const CAM = ['az', 'el', 'fw', 'fh', 'tx', 'ty', 'ox', 'oy'], cur = {}, a = {}, b = {};
  const pick = (k, m, out) => { CAM.forEach(n => { out[n] = lerp(k.L[n], k.P[n], m); }); out.t = k.t; out.roof = k.roof || 0; out.bp = k.bp || 0; out.ex = k.ex || 0; return out; };
  function sample(p, m) {
    let i = 0; while (i < PTS.length - 2 && p > PTS[i + 1][0]) i++;
    const p0 = PTS[i][0], p1 = PTS[i + 1][0], f = p1 > p0 ? clamp((p - p0) / (p1 - p0)) : 0, g = f * f * f * (f * (f * 6 - 15) + 10);
    pick(PTS[i][1], m, a); pick(PTS[i + 1][1], m, b);
    for (const n in a) cur[n] = lerp(a[n], b[n], g);
    return cur;
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
    if (dt > .027) { if (++slow > 45 && px > 1.3e6) { px *= .72; slow = 0; } } else if (slow > 0) slow--;
    if (S.fit(pin, innerWidth < 800 ? 1.75 : 2, px) || !W) { W = pin.clientWidth; H = pin.clientHeight; }
    // derularea e urmărită lin (la fel de lin la orice număr de cadre pe secundă), ca rotița mouse-ului să nu dea mișcări în trepte
    const p = progress(); ps = ps < 0 ? p : ps + (p - ps) * (1 - Math.exp(-dt * 5.2)); if (Math.abs(p - ps) < .0003) ps = p;
    const asp = W / H, m = clamp((1.25 - asp) / .5), c = sample(ps, m);
    mx += (tmx - mx) * .05; my += (tmy - my) * .05;
    const idle = (now - t0) / 1000, fov = lerp(30, 42, m), tn = Math.tan(fov * Math.PI / 360);
    const dist = Math.max((c.fh / 2) / tn, (c.fw / 2) / (tn * asp));
    S.camera.fov = fov; S.camera.setViewOffset(W, H, -c.ox * W, -c.oy * H, W, H);
    orbit(S.camera, { az: c.az + Math.sin(idle * .22) * 1.1 + mx * 2.4 + c.bp * Math.sin(idle * .16) * 10, el: clamp(c.el - my * 1.3, 2, 88), dist, tx: c.tx, ty: c.ty, tz: 0 });
    const d = S.setTime(c.t); S.x7.openRoof(c.roof); S.setBlueprint(c.bp); S.x7.explode(c.ex);
    // umbra: doar când s-a mutat soarele sau s-a mișcat capsula, și cel mult o dată la două cadre
    if ((fr & 1) && (Math.abs(c.t - shT) > .03 || Math.abs(c.roof - shR) > .01 || Math.abs(c.ex - shE) > .004 || Math.abs(c.bp - shB) > .02)) { shT = c.t; shR = c.roof; shE = c.ex; shB = c.bp; S.shadow(); }
    S.render();
    // fundalul paginii, culoarea textului, bara de sus
    const ca = d.top.getHexString(), cb = d.bot.getHexString(); if (ca !== bgA) { bgA = ca; pin.style.setProperty('--st-top', '#' + ca); } if (cb !== bgB) { bgB = cb; pin.style.setProperty('--st-bot', '#' + cb); }
    const dark = d.n > .5; if (dark !== lastDark) { lastDark = dark; sec.classList.toggle('st--dark', dark); window.__skyDark = dark; if (window.navU) window.navU(); }
    const ck = clock(c.t); if (ck !== lastClock) { lastClock = ck; clkT.textContent = ck; }
    const dv = clamp((c.t - 6.5) / 14.7).toFixed(3), co = (1 - c.bp).toFixed(2); if (dv !== dayV) { dayV = dv; dayEl.style.setProperty('--day', dv); } if (co !== clkO) { clkO = co; clk.style.opacity = co; }
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
