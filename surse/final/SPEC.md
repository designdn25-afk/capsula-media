# Capsula România — pagina finală (home.html): specificație de construcție

Concept câștigător: **„O seară și o dimineață cu X7: filmul capsulei”** (cinematic), cu altoiuri din „conversion” și „editorial” și cu toate problemele „must-fix” rezolvate.
Fișier țintă: `site/home.html` (HTML + CSS + JS inline, fără framework, fără build). Data: 22 oct 2026.

---

## 0. Pentru client (de trimis la final, 2–4 rânduri)

Site-ul se deschide exact ca acum: capsula X7 seara, cu efectul 3D. Când apeși „Intră în capsulă ↓”, noaptea se transformă în interiorul luminos și, pe măsură ce derulezi, treci prin toate camerele (living, masă, bucătărie, baie, dormitor), cu clipuri și poze reale, iar planul capsulei îți arată mereu unde ești. Apoi ocolești capsula pe afară, din 8 unghiuri, cu o hartă mică, și compari ziua cu seara trăgând de o linie aurie. Prețul X7, turul 360°, modelele la comandă, galeria și contactul au rămas cum le știi; în galerie s-a adăugat doar poza verticală a capsulei.

---

## 1. Ce s-a verificat înainte de spec (starea reală a fișierelor, 22 oct 2026, 14:05)

`ls` făcut acum (folderele încă se schimbă: builderii refac `ls` înainte să scrie datele):

| folder | fișiere |
|---|---|
| `img/vid/` | `x7_living_lumina.mp4/.webp` (720×1280, 7 s, 0,97 MB) + `_w` (1280×720), `x7_living_masa.mp4/.webp` + `_w`, `x7_baie.mp4/.webp` (720×1280, 3,9 s, **fără `_w`**), `x7_dormitor.mp4/.webp` + `_w`. Toate H.264, fără sunet. **Nu există clip pentru bucătărie.** |
| `img/int/` | `int_living_a, _b, _n_a, _p` · `int_masa_a` · `int_blat_a, _b, _p` · `int_baie_a, _n_a, _p` · `int_dorm_a, _p` · `int_hol_a` · `int_tavan_a, _n_a`. `_a/_b/_n_a` = 1600×1000, `_p` = 1000×1250. **Nu există `int_masa_n_a` și `int_dorm_n_a`.** |
| `img/ext/` | `ext_03p, ext_04a, ext_05p, ext_06a, ext_07a, ext_07p, ext_08a, ext_08p` (`a` = 1600×1000, `p` = 1000×1250). `ext_01p, 02p, 09a, 10a` au fost șterse. |

Ce arată pozele (verificat vizual):
- `int_*` și `ext_*` sunt decupaje din **fotografiile 360 reale** (commit 88731a4 „din panoramele 360”). Pot fi numite „fotografii”. Doar `x7s_day/x7s_night/x7s_lot/x7s_frame` sunt făcute cu AI (DETALII-TEHNICE §5): nu se numesc niciodată „fotografii”.
- Dormitorul X7 din showroom are **două fotolii, draperii, birou** și un panou cu planul. **Nu are pat.** Nu există terasă. Nu scrie nicăieri „pat” sau „terasă” despre X7 din showroom.
- `img/x7_plan.jpg` este varianta din catalog (pat, terasă, fără blat și masă) și **contrazice** unitatea din showroom → **nu se folosește pe home**. Planul se desenează în SVG din geometria planului mic al turului 360 (`home.html`, scriptul „tur virtual”, `mini.innerHTML`).
- Orientarea reală (din planul turului, ușa jos): dormitorul în stânga (vest), baia în centru spre spate, blatul pe peretele din spate, masa și canapeaua în dreapta (est, capătul vitrat cu ușă de sticlă). Latura din spate are grilele de ventilație (lângă baie).
- `x7_8k.webp` e prea moale și cu artefacte → nefolosit. `x7s_lot/x7s_frame` (intro-ul vechi V2) → nefolosite intenționat.
- Fapte confirmate în paginile existente: „Mobilierul de bucătărie (blat, corpuri, hotă) este opțional: +1.050 €” și „Racordurile sunt incluse” (complet.html); textele camerelor din datele turului (`N.living.txt`, `N.masa.txt`, `N.blat.txt`, `N.baie.txt`, `N.dorm.txt`).

---

## 2. Ordinea finală a paginii

| # | id | status | eyebrow `data-n` | fundal |
|---|---|---|---|---|
| 0 | `nav` | schimbat (linkuri) | – | transparent → alb |
| 1 | `top` | **neatins** | – | noapte |
| 2 | `interior` | **nou** | 01 „Interior” | #070b16 → #fff (doar în modul film) |
| 3 | `caracteristici` | mutat, text identic | – | #fff + linie jos |
| 4 | `exterior` | **nou** | 02 „Exterior” | #f4f5f7 (`.alt`) |
| 5 | `zi-noapte` | **nou** | 03 „Zi și seară” | #fff, bandă foto pe toată lățimea |
| 6 | `model` | neatins (doar renumerotare) | 04 „Casele noastre” | `.alt` |
| 7 | `tur` | neatins (mutat, renumerotat) | 05 „Tur virtual 360°” | #fff |
| 8 | `la-comanda` (+ `#cmodal`) | neatins (renumerotat) | 06 „Capsule la comandă” | `.alt` |
| 9 | `galerie` | schimbat (x7_photo adăugat) | 07 „De ce noi” | `.alt` |
| 10 | `mai-mult` | neatins (renumerotat) | 08 „Tot ce mai vrei să știi” | #fff |
| 11 | `contact` | neatins (renumerotat) | 09 „Ciorogârla” | poză cu voal alb |
| 12 | `footer` | schimbat (2 linkuri) | – | #f4f5f7 |

11 secțiuni după hero, inclusiv contact și subsol. Nicio secțiune scoasă. „De la prima vizită la casa ta” rămâne scoasă.

---

## 3. Sistemul de design comun

**Tokeni existenți (blocul „TEMA ALBĂ”, nu se schimbă):** `--bg #fff`, `--bg2 #f4f5f7`, `--ink #0e1116`, `--mute #5d6572`, `--line rgba(15,20,30,.10)`, `--accent #d4a24c`, `--accent-ink #9a6c1c`, `--shadow`, `--display 'Unbounded'`, `--body 'Manrope'`.

**Tokeni noi** (o singură dată, în `<style id="caps-shared-css">`):
```
:root{--night:#070b16;--glass:#c9dbe8;--plan-floor:#efe7da;--plan-fur:#d8cdbb;--plan-wall:#d9dde3;--plan-edge:#c4c9d1;--nav-h:72px;--ease:cubic-bezier(.2,.7,.2,1);
--win-v:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' preserveAspectRatio='none'%3E%3Cpath d='M.10 0H.80L1 .09V.91L.80 1H.10C.045 1 0 .97 0 .92V.08C0 .03 .045 0 .10 0Z'/%3E%3C/svg%3E");
--win-p:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' preserveAspectRatio='none'%3E%3Cpath d='M.09 0H.82L1 .12V.88L.82 1H.09C.04 1 0 .96 0 .91V.09C0 .04 .04 0 .09 0Z'/%3E%3C/svg%3E");
--win-l:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' preserveAspectRatio='none'%3E%3Cpath d='M.06 0H.90L1 .16V.84L.90 1H.06C.027 1 0 .95 0 .90V.10C0 .05 .027 0 .06 0Z'/%3E%3C/svg%3E")}
```
`--win-*` = **conturul ferestrei X7** (rotunjit pe o parte, teșit spre ușă): V pentru cadre 9:16, P pentru 4:5, L pentru 16:10. Se aplică cu `-webkit-mask:var(--win-v) center/100% 100% no-repeat;mask:var(--win-v) center/100% 100% no-repeat`. **Se folosește doar pe cadrele camerelor din `#interior`.** Umbra cadrului se pune pe un wrapper nemascat: `filter:drop-shadow(0 30px 50px rgba(15,20,30,.22))`.

**Tipografie:** titluri de secțiune = clasa existentă `.title` (Unbounded 500, `clamp(32px,5vw,66px)`, ultimele cuvinte în `<em>` auriu-închis, exact ca secțiunile păstrate; scriptul existent le animă cuvânt cu cuvânt dacă titlul e în HTML static). `#interior` își micșorează titlul (vezi secțiunea). Eyebrow = `.eyebrow` existent cu `data-n`. Note = `.note` (13px mute) sau 15–16px mute unde e scris. Nume de cameră/unghi: Unbounded 500 19–26px. Text de corp Manrope 14–16px/1.5.

**Componente comune (în `caps-shared-css`):**
- `.caps-seg` — grup de pastile Zi/Seara, varianta deschisă (stă pe alb, lângă numele camerei): `display:inline-flex;background:var(--bg2);border:1px solid var(--line);border-radius:999px;padding:3px`; butoane `border:0;background:none;color:var(--mute);font:600 13px var(--body);padding:6px 12px;border-radius:999px;min-height:32px` (pe telefon `min-height:40px`); `[aria-pressed=true]{background:var(--accent);color:#111}`; `:focus-visible{outline:2px solid var(--accent-ink);outline-offset:2px}`.
- `.caps-play` — buton „▶ Pornește” pe cadru (centrat, `background:rgba(7,11,22,.6);color:#fff;font:700 14px var(--body);padding:12px 18px;border-radius:999px;border:0;backdrop-filter:blur(8px)`), `hidden` implicit.
- `.caps-label` — etichetă „de muzeu” pe imagine: `position:absolute;left:0;bottom:0;background:#fff;color:var(--ink);font:600 13px/1.35 var(--body);padding:8px 12px;border-top-right-radius:10px;max-width:calc(100% - 24px)`.
- `.caps-round` — buton rotund 44px (săgeți): alb, `box-shadow:var(--shadow)`, `border:1px solid var(--line)`, „‹”/„›” 20px ink, `:focus-visible{outline:3px solid var(--accent);outline-offset:2px}`.
- `.caps-sr` — text doar pentru cititoare de ecran (clip 1px).

**Culoare:** #d4a24c doar pentru linii, markere, butonul liniei, contururi active și fundaluri de pastile active. Text auriu = #9a6c1c. Pastilele pe poze au mereu fundal propriu. Navy `--night` doar în hero și în intrarea `#interior` (modul film).

**Spațiere și forme:** `.wrap` existent (`min(1240px,100% - 32px)`). Padding secțiuni noi `clamp(70px,8vw,110px) 0` (excepții în secțiune). Carduri: radius 18, `var(--shadow)`, border `var(--line)`. Cadre exterior: radius 16. Butoane: `.btn .btn-accent/.btn-ghost/.btn-light` existente.

**Puncte de rupere:** ≤560 · ≤800 (telefon) · 801–1100 (tabletă) · ≥1101 (calculator) · ≥1600 (XL) · **înălțime ≤620px = „ecran scurt”** (include panoul 506×506 și telefonul culcat).

**Mișcare:** doar `transform`/`opacity` în `requestAnimationFrame`, ascultători `passive`. Easing `--ease`. Crossfade 450ms. Cel mult **un singur moment care rulează singur** pe secțiune (interior: linia aurie care desenează fereastra; exterior: un singur tur automat; zi-noapte: „răsăritul” liniei). Regula globală existentă `@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}` rămâne; JS-ul fiecărei secțiuni verifică și el `prefers-reduced-motion` și nu pornește nimic.

**Prefixe:** `.s-int-*` (#interior), `.s-ext-*` (#exterior), `.s-zn-*` (#zi-noapte), `.caps-*` (comun). ID-uri: `int*`, `ext*`, `zn*`.

**JS comun** (`<script id="caps-shared">`, înaintea scripturilor secțiunilor):
```js
window.CAPS=(function(){const mq=q=>matchMedia(q);return{
 rm:mq('(prefers-reduced-motion: reduce)'),fine:mq('(hover:hover) and (pointer:fine)'),
 short:mq('(max-height:620px)'),phone:mq('(max-width:800px)'),
 clamp:(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),lerp:(a,b,t)=>a+(b-a)*t,
 ease:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
 WIN:{V:'M.10 0H.80L1 .09V.91L.80 1H.10C.045 1 0 .97 0 .92V.08C0 .03 .045 0 .10 0Z',
      P:'M.09 0H.82L1 .12V.88L.82 1H.09C.04 1 0 .96 0 .91V.09C0 .04 .04 0 .09 0Z',
      L:'M.06 0H.90L1 .16V.84L.90 1H.06C.027 1 0 .95 0 .90V.10C0 .05 .027 0 .06 0Z'},
 afterLoad(fn){document.readyState==='complete'?fn():addEventListener('load',fn,{once:true})},
 near(el,margin,fn){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();fn()}},{rootMargin:margin});io.observe(el)},
 play(v,btn){try{const p=v.play();if(p&&p.then)p.then(()=>{if(btn)btn.hidden=true}).catch(()=>{if(btn)btn.hidden=false})}catch(e){if(btn)btn.hidden=false}},
 lb(list,i){if(window.openLB)window.openLB(list,i)}
}})();
```
**Lightbox comun:** `#lb` existent primește API-ul `window.openLB(list,i)` (`list` = `[[src, legendă],…]`), vezi Integrare.

---

## 4. Navigarea

Bara de sus, în ordine: **Interior** (`#interior`, primește `class="navhl"` în locul „Tur virtual”) · **Exterior** (`#exterior`) · X7 (`#model`) · Tur virtual (`#tur`) · Capsule la comandă (`#la-comanda`) · Galerie (`#galerie`) · Preț (`complet.html#configurator`) · Investitori (`complet.html#investitori`) · Contact (`#contact`).
„Specificații” și „Legal” ies din bară (tot 9 linkuri, ca acum); rămân în cardurile „Tot ce mai vrei să știi” și în subsol. Neschimbate: sigla „CAPSULA·ROMÂNIA” (`#top`), „RO · EN · BG”, butonul „Programează o vizită” (`#contact`), meniul burger (≤1000px, cum e acum), comportamentul transparent → alb (`.solid`).

---

## 5. Secțiunile

### 5.1 `top` — Case Capsula și Case Modulare · **neatins**
- **Scop:** deschiderea de noapte. Clientul: „vreau să rămână doar așa partea pe noapte când se deschide site-ul”. Nimic nu se schimbă (markup, CSS `.nh*`, scriptul WebGL `nhGL`, scriptul `at-top`).
- **Dependență:** butonul „Intră în capsulă ↓” duce la `#interior`, care acum există. Primul cadru al lui `#interior` (modul film) are fundal `#070b16`, aceeași culoare ca partea de jos a hero-ului pe telefon.
- **Regulă:** nimic luminat ca ziua nu se încarcă la prima afișare: tot ce e sub hero folosește `data-src`/`data-poster` atașate după evenimentul `load` și doar aproape de ecran.

### 5.2 `interior` — Înăuntru, de la un capăt la altul · **nou** (`data-n="01"`)

**Scop:** scena 1 a „filmului”. Tăietura din noaptea de afară în interiorul cald, apoi o plimbare condusă de derulare prin camerele reale, în ordinea lor reală pe lungimea de 11,5 m: Livingul → Masa → Bucătăria → Baia → Dormitorul. Planul real al capsulei (SVG) e harta și bara de progres. Folosește toate clipurile și toate fotografiile de interior.

**Două moduri** (JS pune clasa pe `<section>`; fără JS rămâne modul B):
- **Mod A „film”** (`.s-int--film`): dacă `(min-height:621px)` și **nu** `prefers-reduced-motion`. Acoperă 390×844, 820×1180, 1440×900, 1920×960.
- **Mod B „glisare”** (implicit): ecrane scurte (≤620px înălțime: panoul 506×506, telefon culcat) și mișcare redusă la orice mărime. Fără sticky.
- JS ascultă `change` pe `CAPS.short` și `CAPS.rm`; la schimbare refaci măsurătorile și scoți transformările.

**Markup (static, cu camerele generate din `window.ROOMS`):**
```html
<section id="interior" class="s-int" aria-labelledby="intTitle">
 <div class="s-int-stage">
  <div class="s-int-glow" aria-hidden="true"></div>
  <div class="wrap s-int-head">
   <div class="s-int-hl">
    <div class="eyebrow reveal" data-n="01">Interior</div>
    <h2 class="title" id="intTitle">Înăuntru, de la un capăt <em>la altul.</em></h2>
    <p class="s-int-sub"><span class="s-int-sub-l">…lung…</span><span class="s-int-sub-s">…telefon…</span><span class="s-int-sub-x">…glisare…</span></p>
   </div>
   <figure class="s-int-plan"> <div class="s-int-plan3d"><div class="s-int-rig"> [SVG podea] [3× SVG pereți] [SVG overlay: zone + marker] </div></div>
     <figcaption class="s-int-plan-cap"><span>Planul capsulei X7 (orientativ)</span><b id="intRoomName" aria-live="polite">Livingul</b></figcaption>
     <div class="s-int-ruler"><span>0 m</span><i></i><span>11,5 m</span></div>
   </figure>
  </div>
  <div class="wrap s-int-foot"><p>Capsula X7 din showroom-ul din Ciorogârla. Mobilierul și unele elemente prezentate sunt opționale.</p><a class="s-int-skip" href="#caracteristici">Sari peste ↓</a></div>
  <div class="s-int-viewport"><div class="s-int-track" id="intTrack" role="group" aria-label="Camerele capsulei X7"><!-- .s-int-room × N + .s-int-end --></div></div>
 </div>
</section>
```
`.s-int-foot` stă în DOM înaintea pistei (linkul „Sari peste ↓” vine primul la tastatură): în modul A e poziționat absolut jos în scenă; în modul B are `order` după pistă (scena e `display:flex;flex-direction:column`) și linkul e ascuns.

Camera (generată):
```html
<article class="s-int-room" data-id="living" aria-label="Livingul">
 <div class="s-int-room-in">
  <div class="s-int-fw">                       <!-- wrapper nemascat: umbra + linia aurie -->
   <div class="s-int-frame">                   <!-- mascat cu --win-v / --win-p / --win-l -->
     <video muted playsinline loop preload="none" data-src="img/vid/x7_living_lumina.mp4" data-poster="img/vid/x7_living_lumina.webp" aria-label="Clip: livingul capsulei X7, cu luminatorul din tavan"></video>
     <!-- sau <img class="s-int-kb"> când camera nu are clip -->
     <img class="s-int-fn" alt="" data-src="(noaptea camerei)">   <!-- doar dacă are noapte -->
     <button class="caps-play" type="button" hidden>▶ Pornește</button>
   </div>
   <svg class="s-int-line" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="…CAPS.WIN.V…"/></svg>
  </div>
  <div class="s-int-text">
   <div class="s-int-nrow"><h3>Livingul</h3><div class="caps-seg" role="group" aria-label="Momentul zilei"><button type="button" aria-pressed="true">☀ Zi</button><button type="button" aria-pressed="false">☾ Seara</button></div></div>
   <p>…legenda…</p>
   <figure class="s-int-still"><img class="d" …><img class="n" …></figure>
   <div class="s-int-extras"><button><img …></button><button><img …></button></div>   <!-- doar living -->
  </div>
 </div>
</article>
```
`.caps-seg` apare doar dacă camera are imagine de seară. Cardul final:
```html
<aside class="s-int-end"><h3>Vrei să te uiți singur în jur?</h3><a class="btn btn-accent" href="#tur">Începe turul 360°</a><a class="btn btn-ghost" href="#model">Vezi prețul X7</a></aside>
```

**Datele `window.ROOMS`** (scrise de builder după `ls`; ce lipsește se omite, nu se ghicește):
```js
window.ROOMS=[
{id:'living',n:'Livingul',t:'Luminator în tavan, vitraj pe trei laturi și bandă LED. Seara, draperiile închid complet spațiul.',
 v:'img/vid/x7_living_lumina',vw:true,vop:'50% 30%',
 still:['img/int/int_living_a.webp','Livingul capsulei X7, cu vitraj pe trei laturi și canapeaua lângă geam'],
 night:['img/int/int_living_n_a.webp','Livingul cu draperiile trase și lumina LED aprinsă'],
 extra:[['img/int/int_living_b.webp','Livingul spre blatul de bucătărie, cu luminatorul deasupra'],['img/int/int_tavan_n_a.webp','Benzile LED din tavan, aprinse'],['img/int/int_tavan_a.webp','Luminatorul din tavan și benzile LED']],
 p:['img/int/int_living_p.webp','Livingul, cu luminatorul deasupra'],x:.95,z:'living'},
{id:'masa',n:'Masa',t:'Loc de luat masa pentru două persoane, între blatul de bucătărie și zona de relaxare.',
 v:'img/vid/x7_living_masa',vw:true,vop:'50% 60%',
 still:['img/int/int_masa_a.webp','Masa rotundă din living, lângă vitraj'],
 /* night:['img/int/int_masa_n_a.webp','Masa, seara, cu lumina indirectă aprinsă']  — DOAR dacă fișierul există (pasul A0) */
 x:2.3,z:'masa'},
{id:'blat',n:'Bucătăria',t:'Blat din lemn cu dulapuri, prize pregătite și racorduri pentru bucătărie. Mobilierul de bucătărie este opțional (+1.050 €).',
 v:null,frame:['img/int/int_blat_p.webp','Zona de bucătărie, sub luminator'],fop:'45% 55%',
 still:['img/int/int_blat_a.webp','Blatul de bucătărie din lemn, cu dulapuri verzi'],
 extra:[['img/int/int_blat_b.webp','Blatul de lemn și dulapurile verzi, de aproape']],x:4.22,z:'blat'},
{id:'baie',n:'Baia',t:'Baie completă: duș cu cabină de sticlă, lavoar suspendat, oglindă cu LED și WC smart.',
 v:'img/vid/x7_baie',vw:false,vop:'50% 50%',
 still:['img/int/int_baie_a.webp','Lavoarul și oglinda din baie'],
 night:['img/int/int_baie_n_a.webp','Baia, cu oglinda cu LED aprinsă'],
 extra:[['img/int/int_baie_p.webp','Dușul cu cabină de sticlă'],['img/int/int_hol_a.webp','Holul central, spre living']],
 x:6.2,z:'baie'},
{id:'dorm',n:'Dormitorul',t:'Dormitor separat, cu vitraj panoramic pe tot capătul, aer condiționat și loc de birou. Aici e amenajat cu fotolii.',
 v:'img/vid/x7_dormitor',vw:true,vop:'50% 55%',
 still:['img/int/int_dorm_a.webp','Dormitorul, cu draperii și două fotolii'],
 /* night:['img/int/int_dorm_n_a.webp','Dormitorul, seara, cu lumina LED indirectă'] — DOAR dacă există (A0) */
 p:['img/int/int_dorm_p.webp','Dormitorul, cu fotoliile lângă draperii'],x:9.8,z:'dorm'}];
```
`v` → `v+'.mp4'` și poster `v+'.webp'`; `vw:true` → există `v+'_w.mp4'` și `v+'_w.webp'`. `x` = centrul camerei pe plan (unități de plan, 0–11,6). Lista lightbox a unei camere = `[still, night?, ...extra, p?, frame?]` (fără duplicate).
Dacă lipsește un clip → cadrul folosește `frame` sau `p` sau `still` cu Ken Burns. Lipsește o imagine → se ascunde. Lipsește o cameră întreagă → dispare panoul și zona ei de pe plan.

**Planul (SVG, unități ≈ metri).** Geometria turului 360 **rotită 180°** (nu oglindită: aceeași capsulă, văzută dinspre spate), ca plimbarea să meargă de la stânga la dreapta: livingul în stânga, dormitorul în dreapta, ușa pe latura de sus. Aceeași orientare se folosește și pe harta din `#exterior`.
```html
<svg class="s-int-floor" viewBox="-0.2 -0.7 12 4" aria-hidden="true">
 <defs><clipPath id="intShell"><rect width="11.6" height="3" rx="1.1"/></clipPath></defs>
 <rect width="11.6" height="3" rx="1.1" fill="var(--plan-floor)" stroke="#0e1116" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
 <path d="M1.1 0A1.1 1.1 0 0 0 0 1.1V1.9A1.1 1.1 0 0 0 1.1 3" fill="none" stroke="var(--glass)" stroke-width="3" vector-effect="non-scaling-stroke"/>
 <path d="M10.5 0A1.1 1.1 0 0 1 11.6 1.1V1.9A1.1 1.1 0 0 1 10.5 3" fill="none" stroke="var(--glass)" stroke-width="3" vector-effect="non-scaling-stroke"/>
 <rect x="1.4" y=".75" width="1.6" height="1.5" rx=".12" fill="none" stroke="#9aa1ad" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>  <!-- luminator, poziție aproximativă -->
 <g fill="var(--plan-fur)">
  <rect x="3.45" y="2.5" width="1.55" height=".42" rx=".08"/>   <!-- blat -->
  <circle cx="2.3" cy="2.38" r=".3"/>                           <!-- masa -->
  <rect x=".45" y=".3" width=".5" height="1.45" rx=".18"/>       <!-- canapea -->
  <rect x="8.1" y="2.03" width=".45" height=".85" rx=".05"/>     <!-- birou -->
  <rect x="10.7" y="1.9" width=".55" height=".55" rx=".12"/><rect x="10.7" y=".5" width=".55" height=".55" rx=".12"/>  <!-- fotolii -->
 </g>
 <rect x="5.15" y="-.5" width="1.1" height=".38" rx=".06" fill="var(--plan-wall)"/>   <!-- treptele -->
 <line x1="5.3" y1="0" x2="6.1" y2="0" stroke="#d4a24c" stroke-width="3" vector-effect="non-scaling-stroke"/>  <!-- ușa -->
 <g class="s-int-lbl" font-family="Manrope" font-weight="600" font-size=".3" fill="#5d6572" text-anchor="middle">
  <text x="1.05" y="2.55" data-z="living">Living</text><text x="2.3" y="1.75" data-z="masa">Masa</text>
  <text x="4.22" y="2.3" data-z="blat">Bucătărie</text><text x="6.2" y="2.3" data-z="baie">Baie</text>
  <text x="9.6" y="1.65" data-z="dorm">Dormitor</text><text x="6.4" y="-.2" text-anchor="start" font-size=".26">Intrare</text>
 </g>
</svg>
```
Pereți (3 copii, `--i` = 1, 2, 3, același `viewBox`): `<rect width="11.6" height="3" rx="1.1"/>` + baia `<rect x="5.1" y="1.4" width="2.2" height="1.55"/>` + peretele dormitorului `<line x1="8" y1="1.25" x2="8" y2="2.95"/>`, toate `fill:none;stroke-width:3px;vector-effect:non-scaling-stroke`; copiile 1–2 `stroke:var(--plan-wall)`, copia 3 `stroke:#fff` plus aceeași formă deasupra cu `stroke:var(--plan-edge);stroke-width:1px`.
Overlay (deasupra, interactiv, același `viewBox`): în `<g clip-path="url(#intShell)">` cinci zone `rect.s-int-z` cu `data-z`, `role="button"`, `tabindex="0"`, `aria-label` = numele camerei:
living `x0 w1.9 h3` · masa `x1.9 w1.3 h3` · blat `x3.2 w1.9 h3` · baie `x5.1 y1.4 w2.2 h1.55` · dorm `x8 w3.6 h3`.
Stil zonă: `fill:rgba(212,162,76,0);stroke:none`; `.on{fill:rgba(212,162,76,.24);stroke:#d4a24c;stroke-width:1.5px;vector-effect:non-scaling-stroke}`; tranziție `fill .4s`. Hover pe pointer fin: `fill:rgba(212,162,76,.12)`.
Marker: `<g class="s-int-mk" style="transform:translateX(.95px)"><line y1="-.15" y2="3.15" stroke="#d4a24c" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cy="-.32" r=".16" fill="#d4a24c"/></g>` (`translateX` în px = unități SVG; în modul B `transition:transform .5s var(--ease)`).
Eticheta camerei active: `fill:#0e1116`.

**Layout — mod A, calculator ≥1101 (1440×900, 1920×960):**
- `#interior.s-int--film{padding:0;position:relative;background:#fff;overflow-x:clip}`; înălțimea secțiunii o pune JS în px (vezi interacțiuni).
- `.s-int-stage{position:sticky;top:0;height:100svh;overflow:hidden;padding-top:calc(var(--nav-h) + 24px);display:flex;flex-direction:column}` (fundalul îl pune JS).
- `.s-int-head`: `.wrap`, `display:flex;justify-content:space-between;align-items:flex-end;gap:32px`.
  - stânga: eyebrow; `h2.title` cu `font-size:clamp(28px,3.4vw,50px);max-width:13em` (2 rânduri, de verificat la 1440 și 1920); `.s-int-sub` Manrope 16px/1.55, `color:var(--mute)`, `max-width:46ch`, `margin-top:12px` (se vede doar `.s-int-sub-l`).
  - dreapta: `.s-int-plan` alb, radius 18, `var(--shadow)`, `padding:12px 14px 10px`, `width:clamp(320px,30vw,460px)`. `.s-int-plan3d{perspective:900px}`; `.s-int-rig{position:relative;aspect-ratio:3/1;transform-style:preserve-3d;transform:rotateX(var(--rx,0deg));transform-origin:50% 60%;transition:transform 1.2s var(--ease)}`; straturile `position:absolute;inset:0;width:100%;height:100%`; pereții `transform:translateZ(calc(var(--i)*var(--wz,0px)));transition:transform .9s var(--ease) calc(var(--i)*60ms)`. `figcaption`: rând flex, „Planul capsulei X7 (orientativ)” 12px mute stânga, numele camerei active 13px/600 ink dreapta. Rigla: rând flex 12px mute „0 m” – linie de 1px `var(--line)` – „11,5 m”.
- `.s-int-viewport{position:relative;flex:1;margin-top:clamp(16px,2.6svh,32px);perspective:1400px}`.
- `.s-int-track{display:flex;align-items:flex-end;gap:5vw;width:max-content;padding-left:max(16px,calc((100vw - 1240px)/2));padding-right:10vw;will-change:transform}`.
- `.s-int-room-in{display:grid;grid-template-columns:auto 340px;gap:28px;align-items:end;transform-style:preserve-3d}` (≥1600: coloana de text 360px).
- Cadru: `--fh:clamp(260px,min(52svh,100svh - 400px),540px)`; `.s-int-frame{height:var(--fh);aspect-ratio:9/16;position:relative;background:#141a2b;mask:var(--win-v)…}`; video/imagine `width:100%;height:100%;object-fit:cover;object-position:var(--vop)`.
- `.s-int-line{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}`, `path{fill:none;stroke:#d4a24c;stroke-width:1.5px;vector-effect:non-scaling-stroke;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.2s var(--ease)}`, `.drawn path{stroke-dashoffset:0}`.
- Coloana de text: `h3` Unbounded 500 26px; `.s-int-nrow` flex, space-between; `p` Manrope 16px/1.55 mute, `max-width:32ch`, `margin:8px 0 16px`; `.s-int-still` 16:10, 100% lățime, radius 14, `overflow:hidden`, două imagini suprapuse (`.n` cu `opacity:0`, crossfade 450ms), click → lightbox; `.caps-seg` stă în rândul cu numele camerei (`.s-int-nrow`), în toate modurile (un singur grup pe cameră). La living: `.s-int-extras` = 2 butoane 158×99 (16:10, radius 10, gap 10, `margin-top:10px`), `int_living_b` și `int_tavan_n_a`.
- `.s-int-end{flex:0 0 340px;align-self:center;background:#fff;border:1px solid var(--line);border-radius:18px;padding:28px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:10px}`, `h3` Unbounded 500 22px/1.2 + `margin-bottom:8px`.
- `.s-int-foot` (mod A): `position:absolute;left:0;right:0;bottom:16px`, rând flex `gap:14px`, `p` 13px mute, linkul 14px/600 ink subliniat. Nu în dreapta jos (acolo e butonul WhatsApp `.wa`).
- **Verificare de înălțime 1440×900:** 96 (nav+24) + ~200 (antet) + 24 + 468 (cadru) + 40 (subsol) ≈ 830 < 900. La 1920×960 cadrul = 499px.

**Layout — mod A, tabletă 801–1100 (820×1180):** antet pe o coloană: titlul `clamp(30px,4.6vw,40px)`, sub-titlul lung, apoi planul pe toată lățimea `.wrap` (max 520px, `margin-top:16px`). `--fh:clamp(300px,44svh,560px)`; coloana de text 300px. Restul ca la calculator. Total ≈ 96 + 420 + 24 + 519 + 40 ≈ 1100 < 1180.

**Layout — mod A, telefon ≤800 (390×844):** `padding-top:calc(var(--nav-h) + 10px)`; eyebrow ascuns; titlul 26px/1.08; se vede `.s-int-sub-s` (14px); planul pe toată lățimea, **etichetele SVG ascunse** (numele camerei e în `figcaption`), `--rx` final 20deg. Camera: `--pw:min(76vw,calc((100svh - 474px)*.8))`; `.s-int-room{flex:0 0 var(--pw)}`, `.s-int-room-in{grid-template-columns:1fr;gap:8px}`; cadrul `width:100%;aspect-ratio:4/5;height:auto;mask:var(--win-p)` (linia aurie folosește `CAPS.WIN.P`); sub cadru rândul nume (Unbounded 500 19px) + `.caps-seg` (12px); legenda 14px/1.45, 2 rânduri (`-webkit-line-clamp:2`); `.s-int-still` și `.s-int-extras` ascunse. Pista: `gap:6vw;padding-left:16px;padding-right:12vw`. Cardul final `flex:0 0 var(--pw)`. `.s-int-foot` 12px, `max-width:calc(100% - 84px)` (lângă `.wa`). Verificare: 82 + ~240 + 14 + 370 + 76 + 32 ≈ 814 < 844.

**Layout — mod B (506×506, ecrane scurte, mișcare redusă la orice mărime):**
- `#interior{padding:clamp(48px,7vw,96px) 0;scroll-margin-top:var(--nav-h);background:#fff}`; fără sticky, fără fundal închis.
- Antet pe o coloană: eyebrow; titlul `clamp(24px,5.4vw,40px)`; se vede `.s-int-sub-x` (1 rând, 14px); planul `max-width:440px`, `margin-top:16px`, etichete vizibile — **planul e meniul** (zonele se apasă; la 506 zona „Masa” are ~47px lățime).
- `.s-int-track{display:flex;gap:14px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none;padding:4px max(16px,calc((100vw - 1240px)/2)) 12px;scroll-padding-left:max(16px,calc((100vw - 1240px)/2))}` + `::-webkit-scrollbar{display:none}`. Pista e propriul ei scroller: nu produce derulare orizontală a paginii.
- Panou: `--bw:clamp(240px,min(74vw,760px,calc((100svh - 250px)*1.6)),760px)`; `.s-int-room{flex:0 0 var(--bw);scroll-snap-align:start}`; cadru `aspect-ratio:16/10;mask:var(--win-l)` (linia `CAPS.WIN.L`), conținut: clipul orizontal `_w` (living, masa, dorm), sau poza orizontală (`still`) pentru baie și bucătărie; sub el rândul nume (Unbounded 500 18px) + `.caps-seg`, apoi legenda 14px (2 rânduri). Fără `.s-int-still`/`.s-int-extras` (atingerea cadrului deschide lightbox-ul camerei).
- Cardul final `flex:0 0 min(74vw,360px);align-self:stretch`, conținut centrat vertical.
- `.s-int-foot` static sub pistă, linkul „Sari peste ↓” ascuns.
- La 506×506 secțiunea are ≈ 760px (se derulează normal).

**Interacțiuni și 3D — mod A:**
- Măsurători (la `load`, `resize`, `document.fonts.ready`, schimbare de mod): `stageH = stage.offsetHeight`; `travel = track.scrollWidth - innerWidth` (≥0); `K = 1.5` (constantă la începutul scriptului: dacă pagina pare lungă, se mărește la 1.8); `E = 0.30*stageH`; `W = travel/K`; `HOLD = 0.10*stageH`; `section.style.height = (stageH + E + W + HOLD) + 'px'`. Centrul fiecărei camere în coordonatele pistei: `c_i = room.offsetLeft + room.offsetWidth/2` (fără `getBoundingClientRect`, ca transformările să nu influențeze).
- În rAF, la `scroll`: `S = -section.getBoundingClientRect().top`; `e = CAPS.clamp(S/E)`; `w = CAPS.clamp((S-E)/W)`.
- **Faza A (intrarea, `e` 0→1):** fundalul scenei = `rgb(lerp(7,255), lerp(11,255), lerp(22,255))` cu `t = CAPS.ease(e)`; clasa `.is-dark` cât timp `t < .45` (titlu `#fff`, `em` `#d4a24c`, sub-titlu `rgba(255,255,255,.78)`, eyebrow `rgba(255,255,255,.7)`, subsolul `rgba(255,255,255,.7)`); comutarea culorii textului are `transition:color .25s` (nu interpolare liniară, ca să nu treacă prin gri pe gri). Planul: `opacity:e; transform:translateY((1-e)*12px)`. Cadrul primei camere (`.s-int-fw` al ei): `scale(1.12 - .12*t)`, `transform-origin:50% 60%`. `.s-int-glow` (un div poziționat de JS în spatele primului cadru, 1,6× mărimea lui, `background:radial-gradient(closest-side,rgba(255,186,110,.55),rgba(255,186,110,0))`): `opacity:1-t`. Efect: fereastra luminată din hero devine camera.
- **Ridicarea planului (o singură dată):** când `e` ajunge prima dată la 1 → `.s-int-rig.up` cu `--rx:28deg` (calculator/tabletă) sau `20deg` (telefon) și `--wz:2.2px` (pereții se ridică în cascadă). Planul pornește ca un desen plat și devine machetă.
- **Faza B (plimbarea, `w` 0→1):** `track.style.transform = translate3d(${-w*travel}px,0,0)`. Pentru fiecare cameră: `d = (c_i - w*travel - innerWidth/2)/innerWidth`; pe `.s-int-room-in`: `rotateY(${CAPS.clamp(-d*12,-14,14)}deg) translateZ(${-60*Math.abs(d)}px)` (telefon: ±10deg, −40px). Camerele din față se întorc puțin spre tine, ca pe un perete de-a lungul căruia mergi.
- Markerul: `C = w*travel + innerWidth/2`; găsește `i` cu `c_i ≤ C < c_{i+1}`; `x = x_i + (C-c_i)/(c_{i+1}-c_i)*(x_{i+1}-x_i)`; înainte de prima cameră = `x_0`, după ultima = `x_last`. `marker.style.transform = translateX(${x}px)`.
- Camera activă = `argmin |d|` (cardul final contează: când el e activ, markerul rămâne pe dormitor și zona are `opacity:.5`). La schimbare: zona `.on`, eticheta activă, `#intRoomName` (crossfade 200ms), clipul (vezi mai jos), și **linia aurie** a camerei: `.s-int-fw.drawn` (o singură dată pe cameră; prima cameră se desenează când `e` atinge 1).
- Click pe o zonă de pe plan → `scrollTo({top: section.offsetTop + E + CAPS.clamp((c_i - innerWidth/2)/travel)*W, behavior:'smooth'})`. Aceeași formulă la `focusin` în interiorul unei camere (tastatura duce camera în centru).
- Butonul „Sari peste ↓” → `#caracteristici` (derulare normală).

**Interacțiuni — mod B:** planul = meniu (click/Enter/Space pe zonă → `track.scrollTo({left: room.offsetLeft - paddingLeft, behavior})`); camera activă se calculează la `scroll` pe pistă (cea mai apropiată de marginea de start); markerul sare la `x` cu tranziție .5s; ridicarea planului când planul e 35% vizibil (`--rx:18deg`, `--wz:2px`), **dar cu mișcare redusă planul rămâne plat** (`--rx:0`, `--wz:0`); linia aurie se desenează la prima activare (cu mișcare redusă e afișată direct, fără animație). Săgețile ←/→ pe pistă (are `tabindex="0"`) trec la camera următoare.

**Clipuri (ambele moduri):**
- Sursele (`data-src`/`data-poster` → `src`/`poster`) se atașează după `load` și când secțiunea e la cel mult un ecran distanță (`CAPS.near(section,'100% 0px',…)`). Mod A folosește clipurile verticale; mod B folosește `_w` (dacă există) sau poza.
- Doar clipul camerei active rulează (`CAPS.play(video, playBtn)`); celelalte `pause()`. Toate se opresc când secțiunea iese din ecran (IntersectionObserver) sau la `document.hidden`.
- Dacă `play()` e refuzat (iOS Low Power), rămâne posterul și apare „▶ Pornește”. **Nu apare buton pe cadrele fără clip.**
- Cameră fără clip (bucătăria; baia în mod B): imaginea din cadru are Ken Burns (`@keyframes s-int-kb{from{transform:scale(1)}to{transform:scale(1.06)}}`, 9s, `ease-in-out infinite alternate`) doar cât camera e activă; fără Ken Burns la mișcare redusă.
- Mișcare redusă: niciun clip nu pornește singur; pe cadrele cu clip apare „▶ Pornește”; la apăsare rulează acel clip, celelalte se opresc.

**Zi / Seara** (doar camerele cu `night`; azi: livingul și baia): butoane cu `aria-pressed`. Calculator, mod A: schimbă poza din coloana de text (crossfade 450ms). Telefon (mod A) și mod B: `img.s-int-fn` (`object-fit:cover;object-position:55% 50%`) apare peste cadru (crossfade 450ms) și clipul se oprește; „☀ Zi” o ascunde și repornește clipul dacă e camera activă.

**Lightbox:** click pe poza din coloană / pe miniaturi (calculator) sau atingere pe cadru (telefon, mod B) → `CAPS.lb(listaCamerei, index)`.

**Accesibilitate:** fiecare cameră e `<article aria-label>`; zonele planului sunt `role="button"` cu `aria-label`; `#intRoomName` are `aria-live="polite"`; clipurile au `aria-label`; imaginile au `alt` din `ROOMS`; ordinea de focus: titlu → „Sari peste ↓” → zone plan → camere → card final.

**Text (RO, exact):**
- Eyebrow: „Interior” (`data-n="01"`).
- Titlu: „Înăuntru, de la un capăt **la altul.**” (`la altul.` în `<em>`).
- Sub (calculator/tabletă): „Living, zonă de bucătărie, baie completă și dormitor separat, pe 36,5 m² utili. Derulează ca să mergi prin capsulă.”
- Sub (telefon, mod A): „36,5 m² utili. Derulează ca să mergi prin capsulă.”
- Sub (mod B): „Glisează sau atinge o cameră pe plan.”
- Plan: „Planul capsulei X7 (orientativ)”; riglă „0 m” … „11,5 m”; etichete „Living”, „Masa”, „Bucătărie”, „Baie”, „Dormitor”, „Intrare”.
- Camere (nume / legendă): „Livingul” / „Luminator în tavan, vitraj pe trei laturi și bandă LED. Seara, draperiile închid complet spațiul.” · „Masa” / „Loc de luat masa pentru două persoane, între blatul de bucătărie și zona de relaxare.” · „Bucătăria” / „Blat din lemn cu dulapuri, prize pregătite și racorduri pentru bucătărie. Mobilierul de bucătărie este opțional (+1.050 €).” · „Baia” / „Baie completă: duș cu cabină de sticlă, lavoar suspendat, oglindă cu LED și WC smart.” · „Dormitorul” / „Dormitor separat, cu vitraj panoramic pe tot capătul, aer condiționat și loc de birou. Aici e amenajat cu fotolii.”
- Comutator: „☀ Zi” / „☾ Seara” (grup `aria-label` „Momentul zilei”).
- Card final: „Vrei să te uiți singur în jur?” + „Începe turul 360°” (auriu, `#tur`) + „Vezi prețul X7” (contur, `#model`).
- Notă (obligatorie): „Capsula X7 din showroom-ul din Ciorogârla. Mobilierul și unele elemente prezentate sunt opționale.”
- Link: „Sari peste ↓”. Buton clip: „▶ Pornește”.
- `aria-label` clipuri: „Clip: livingul capsulei X7, cu luminatorul din tavan” · „Clip: masa rotundă din living” · „Clip: baia, cu oglinda cu LED și WC-ul smart” · „Clip: dormitorul, cu draperii și fotolii”.
- `alt`-urile pozelor: exact cele din `window.ROOMS`.

**Verificări specifice:** captură la mijlocul plimbării la toate cele 5 mărimi; derulare rapidă hero → mijlocul secțiunii fără flash alb/negru; fără linie vizibilă la marginea de jos a hero-ului; `document.documentElement.scrollWidth <= innerWidth`; un singur `<video>` care rulează în orice moment (în toată pagina).

### 5.3 `caracteristici` — 4 puncte · **mutat, text identic**
- **Scop:** pauza albă după interior, cu cele 4 repere (rezumă ce ai văzut înăuntru).
- **Schimbare:** doar poziția (după `#interior`, înainte de `#exterior`). Markup, CSS (`.feat`, `.ft`), etichetele „01 · Spațiu” … „04 · Smart home”, titlurile, textele și efectele 3D existente (`rise` + `tilt(max 6, pitch 5)`) rămân exact.
- **Telefon:** neschimbat (2 coloane ≤900, 1 coloană ≤560).
- **Text:** neschimbat: „01 · Spațiu / 36,5 m² utili / Living luminos, dormitor separat și baie completă, pe 39 m² construiți.” · „02 · Structură / Oțel și aluminiu / Oțel galvanizat, aluminiu fluorocarbon și izolație din spumă poliuretanică: acoperiș 15 cm, pereți 10 cm, pardoseală 15 cm.” · „03 · Vitraj / Geam triplu LOW-E / Ferestre panoramice cu forme rotunjite. Natura intră în casă din toate unghiurile.” · „04 · Smart home / Control vocal / Iluminat interior și exterior, încuietoare smart, 2 × Midea Inverter 12.000 BTU.”

### 5.4 `exterior` — Ocolește capsula · **nou** (`data-n="02"`)

**Scop:** scena 3, ziua: plimbare în jurul X7 prin fotografiile reale din curtea showroom-ului, ca un carusel 3D (coverflow) pe derulare nativă, cu o hartă de sus care arată unde stă camera. Imagine mare, aproape fără text. Nu promite 10 unghiuri: are **8 opriri reale** (6 decupaje noi + 2 fotografii reale pentru colțurile lipsă).

**Opriri `window.EXT`** (ordinea = un ocol complet; poziții verificate pe poze, harta în aceeași orientare rotită ca planul din interior: ușa sus, livingul la stânga):

| # | fișier calculator | fișier telefon (4:5) | φ (grade) | punct pe hartă (x, y) | `op` lat | `op` telefon | legendă |
|---|---|---|---|---|---|---|---|
| 1 | `ext/ext_04a.webp` | același, decupat | 180 | (0, −46) | 50% 55% | 50% 60% | Latura cu intrarea și scărița |
| 2 | `ext/ext_07a.webp` | `ext/ext_07p.webp` | 140 | (−29.57, −35.24) | 55% 55% | 50% 55% | Colțul vitrat de lângă intrare |
| 3 | `ext/ext_05p.webp` (doar portret) | același | 110 | (−43.23, −15.73) | 50% 55% | 50% 55% | Capătul vitrat, cu ușa de sticlă |
| 4 | `ext/ext_06a.webp` | același, decupat | 75 | (−44.43, 11.91) | 45% 50% | 42% 50% | Capătul vitrat, văzut din față |
| 5 | `ext/ext_08a.webp` | `ext/ext_08p.webp` | 45 | (−32.53, 32.53) | 40% 50% | 50% 55% | Colțul spre latura din spate, cu grilele de ventilație |
| 6 | `ext/real_v5.webp` (din `n_v5.jpg`, pasul A0) | același, decupat | −15 | (11.91, 44.43) | 62% 55% | 66% 55% | Latura din spate: fereastra panoramică și ventilația |
| 7 | `ext/ext_03p.webp` (doar portret) | același | −45 | (32.53, 32.53) | 50% 50% | 50% 50% | Fereastra panoramică, de aproape |
| 8 | `ext/real_v1.webp` (din `n_v1.jpg`, pasul A0) | același, decupat | −130 | (35.24, −29.57) | 45% 55% | 40% 55% | Colțul vitrat de la celălalt capăt |

Format: `{f, fp?, kind:'L'|'P', phi, x, y, op, opp, t}`. Dacă `real_v*.webp` lipsesc, se folosește `img/n_v5.jpg` / `img/n_v1.jpg`. Un fișier lipsă → oprirea dispare (și punctul ei de pe hartă).

**Markup:**
```html
<section id="exterior" class="alt s-ext" aria-labelledby="extTitle">
 <div class="wrap head-row s-ext-head">
  <div><div class="eyebrow reveal" data-n="02">Exterior</div><h2 class="title" id="extTitle">Ocolește <em>capsula.</em></h2>
   <p class="s-ext-note"><span class="l">…</span><span class="s">…</span></p></div>
  <div class="s-ext-nav"> <div class="s-ext-map">[SVG hartă]</div>
   <div class="s-ext-ctl"><button class="caps-round" id="extPrev" aria-label="Unghiul anterior">‹</button><span id="extCount">1 / 8</span><button class="caps-round" id="extNext" aria-label="Unghiul următor">›</button></div></div>
 </div>
 <div class="s-ext-track" id="extTrack" tabindex="0" role="region" aria-roledescription="carusel" aria-label="Capsula X7 din exterior">
   <figure class="s-ext-f L|P" data-i="0"><picture><source media="(max-width:800px) and (min-height:621px)" data-srcset="img/ext/ext_07p.webp"><img data-src="img/ext/ext_07a.webp" width="1600" height="1000" alt="Colțul vitrat de lângă intrare" decoding="async"></picture><figcaption class="caps-label">Colțul vitrat de lângă intrare</figcaption></figure> …
 </div>
 <p class="caps-sr" id="extLive" aria-live="polite"></p>
 <p class="wrap note s-ext-fine">Fotografii din curtea showroom-ului din Ciorogârla.</p>
</section>
```

**Harta (SVG, `viewBox="-60 -60 120 120"`, `role="group"`, `aria-label="Harta din jurul capsulei: alege de unde privești"`):**
```html
<defs><radialGradient id="extConeG" cx="0" cy="46" r="22" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e8c27a" stop-opacity=".85"/><stop offset="1" stop-color="#e8c27a" stop-opacity="0"/></radialGradient></defs>
<circle r="46" fill="none" stroke="#c9ccd3" stroke-width="1" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>
<g transform="translate(-33.64 -8.7) scale(5.8)">   <!-- planul rotit, aceleași coordonate ca în #interior -->
 <rect width="11.6" height="3" rx="1.1" fill="#fff" stroke="#0e1116" stroke-width="1.25" vector-effect="non-scaling-stroke"/>
 <path d="M1.1 0A1.1 1.1 0 0 0 0 1.1V1.9A1.1 1.1 0 0 0 1.1 3" fill="none" stroke="#c9dbe8" stroke-width="3" vector-effect="non-scaling-stroke"/>
 <path d="M10.5 0A1.1 1.1 0 0 1 11.6 1.1V1.9A1.1 1.1 0 0 1 10.5 3" fill="none" stroke="#c9dbe8" stroke-width="3" vector-effect="non-scaling-stroke"/>
 <rect x="5.1" y="1.4" width="2.2" height="1.55" fill="none" stroke="#d9dde3" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
 <line x1="8" y1="1.25" x2="8" y2="2.95" stroke="#d9dde3" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
 <rect x="5.15" y="-.5" width="1.1" height=".38" rx=".06" fill="#d9dde3"/>
 <line x1="5.3" y1="0" x2="6.1" y2="0" stroke="#d4a24c" stroke-width="3" vector-effect="non-scaling-stroke"/>
</g>
<text x="0" y="-15.5" text-anchor="middle" font-family="Manrope" font-weight="600" font-size="6" fill="#5d6572">Intrare</text>
<!-- câte un punct pe oprire -->
<g class="s-ext-dot" role="button" tabindex="0" aria-label="Privește din: Latura cu intrarea și scărița" transform="translate(0 -46)"><circle r="7" fill="transparent"/><circle r="3" fill="#9aa1ad"/></g> …
<!-- camera activă, ultima (deasupra) -->
<g class="s-ext-cam" style="transform:rotate(180deg);transform-box:view-box;transform-origin:0 0;transition:transform .6s var(--ease)">
 <path d="M0 46L-11 28A21 21 0 0 1 11 28Z" fill="url(#extConeG)"/><circle cx="0" cy="46" r="5" fill="#d4a24c" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/></g>
```
Rotirea grupului `s-ext-cam` cu φ mută punctul auriu pe cerc și conul arată mereu spre capsulă. Unghiul se acumulează pe drumul cel mai scurt: `phi += ((target - phi + 540) % 360) - 180`.

**Layout calculator (≥1101):** `section.alt` (#f4f5f7), `padding:clamp(70px,8vw,110px) 0`. Antet `.head-row`: stânga eyebrow + titlu + notă (`.s-ext-note`, Manrope 15px mute, `max-width:46ch`, `margin-top:14px`); dreapta `.s-ext-nav`: harta 200×200 (card alb, radius 18, `var(--shadow)`, padding 8) și sub ea `.s-ext-ctl` (rând: săgeată 44px, contorul Manrope 600 14px `font-variant-numeric:tabular-nums` „1 / 8”, săgeată 44px).
Pista: `margin-top:40px;display:flex;align-items:center;gap:28px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;perspective:1500px;--fh:min(60svh,580px);--lw:min(calc(var(--fh)*1.6),84vw);--H:calc(var(--lw)/1.6);padding:24px calc(50% - var(--lw)/2)`. `figure.s-ext-f{flex:none;height:var(--H);border-radius:16px;overflow:hidden;position:relative;scroll-snap-align:center;background:#e9ebef;box-shadow:0 30px 60px -30px rgba(15,20,30,.35);will-change:transform,opacity}`; `.L{width:calc(var(--H)*1.6)}`, `.P{width:calc(var(--H)*.8)}`; `img{width:100%;height:100%;object-fit:cover;object-position:var(--op)}`. `.caps-label` pe fiecare cadru, vizibilă doar pe cel activ (`opacity` 0→1, 300ms). La 1440×900: H = 540px (lat 864, portret 432). La 1920×960: H = 576px.
Sub pistă: nota mică „Fotografii din curtea showroom-ului din Ciorogârla.” (13px, mute, `margin-top:14px`).

**Tabletă (801–1100, 820×1180):** `--fh:min(46svh,520px)` (H ≈ 430, lat ≈ 689); harta 150×150.

**Telefon ≤800 și înalt (390×844):** antet pe o coloană (titlu 32px din `.title`, nota lungă 14px). Cadrele sunt toate **4:5**: `width:min(78vw,380px);aspect-ratio:4/5;height:auto` (304×380), folosind portretele (`fp`) acolo unde există și decupajul cu `--opp` în rest; `padding:16px calc(50% - min(39vw,190px))`; `gap:14px`. Sub pistă, în `.wrap`: un rând cu harta 112×112 (card alb) în stânga și, în dreapta, contorul plus săgețile (44px). Există un singur nod `.s-ext-nav`: JS îl mută (`appendChild`) într-un `<div class="wrap s-ext-below">` de după pistă când `CAPS.phone` sau `CAPS.short` e adevărat și înapoi în antet altfel (ascultă `change`).
**Ecran scurt (≤620px, 506×506):** se vede nota scurtă (1 rând); cadrele au înălțimea `H:min(56svh,calc(84vw/1.6),300px)` (≈266px la 506; lat 425, portret 213), cu fișierele late (`f`); harta ascunsă; sub pistă un rând centrat „‹ 3 / 8 ›” (săgeți 44px). Fără derulare orizontală a paginii (pista e scroller propriu).

**Interacțiuni și 3D:**
- Coverflow pe derularea pistei (rAF): pentru fiecare cadru `d = (offsetLeft + offsetWidth/2 - (scrollLeft + clientWidth/2)) / offsetWidth`, limitat la ±2; `transform: rotateY(${d*-24}deg) translateZ(${-Math.abs(d)*90}px) scale(${1-Math.abs(d)*.06})`; `opacity: 1-Math.min(Math.abs(d),2)*.25`. Mersul prin pistă arată ca un ocol în jurul casei.
- Cadrul activ = `argmin |d|`: clasa `.on` (eticheta apare), contorul, harta (rotirea `s-ext-cam`, punctul activ `fill:#d4a24c`), textul din `#extLive`.
- Săgeți, ←/→ (pe pistă cu focus), Home/End, click pe un cadru lateral și pe un punct de pe hartă → `track.scrollTo({left: f.offsetLeft + f.offsetWidth/2 - track.clientWidth/2, behavior:'smooth'})`. Nu `scrollIntoView` (mișcă și pagina).
- Tragere cu mouse-ul (doar pointer fin): `pointerdown` pe pistă (nu pe butoane) → `setPointerCapture`, `scroll-snap-type:none`, `scrollLeft = start - dx`; la eliberare readuci snap-ul și centrezi cadrul cel mai apropiat; dacă s-a mișcat >6px, blochezi click-ul. Pe touch, derulare nativă (`touch-action:pan-x pan-y` implicit).
- **Turul automat (un singur moment care rulează singur):** prima dată când pista e ≥50% vizibilă și nimeni n-a atins-o, după 2,4 s trece la următorul unghi la fiecare 4 s, **o singură tură** (se oprește înapoi la 1). Pauză la hover, focus, tab ascuns sau dacă iese din ecran; se oprește definitiv la orice interacțiune (pointerdown, wheel pe pistă, tastă, săgeți, puncte).
- Încărcare: imaginile primesc `src`/`srcset` din `data-*` când secțiunea e la un ecran distanță; apoi `loading="lazy"` nativ în pistă. Nimic nu se încarcă la prima afișare.
- **Mișcare redusă:** fără rotateY/translateZ/scale (cadrele inactive doar `opacity:.6`), fără tur automat, `scroll-behavior:auto`, harta fără tranziție.

**Text (RO, exact):**
- Eyebrow: „Exterior” (`data-n="02"`). Titlu: „Ocolește **capsula.**” (`capsula.` în `<em>`).
- Notă (calculator/tabletă): „Trage de imagini sau alege un punct de pe hartă. X7 are aproximativ 11,5 × 3,4 m și 3,45 m înălțime.”
- Notă (telefon): „Glisează ca să ocolești capsula. X7 are aproximativ 11,5 × 3,4 m și 3,45 m înălțime.”
- Notă scurtă (ecran scurt): „Glisează ca să ocolești capsula.”
- Contor: „{i} / {n}”. Săgeți: „Unghiul anterior” / „Unghiul următor”. Puncte: „Privește din: {legendă}”. Harta: „Harta din jurul capsulei: alege de unde privești”. Pista: `aria-roledescription` „carusel”, `aria-label` „Capsula X7 din exterior”.
- Legendele (și `alt`): cele 8 din tabel. Notă: „Fotografii din curtea showroom-ului din Ciorogârla.”

### 5.5 `zi-noapte` — Ziua și seara · **nou** (`data-n="03"`)

**Scop:** după ocolul în lumina zilei, aceeași capsulă ca în deschidere: o linie aurie desparte seara (stânga) de zi (dreapta), iar vizitatorul compară. Pornește pe **noapte completă** (continuă hero-ul), apoi „răsare” dimineața din dreapta. Bloc complet independent: dacă clientul nu-l vrea, se șterge secțiunea + `<style id="s-zn-css">` + scriptul ei, fără alte efecte.

**Markup:**
```html
<section id="zi-noapte" class="s-zn" aria-labelledby="znTitle">
 <div class="wrap head-row"><div><div class="eyebrow reveal" data-n="03">Zi și seară</div><h2 class="title" id="znTitle">Ziua și <em>seara.</em></h2></div>
  <p class="note s-zn-note"><span class="l">…</span><span class="s">…</span></p></div>
 <div class="s-zn-stage" id="znStage">
  <div class="s-zn-pan"><img class="s-zn-day" data-src="img/x7s_day.webp" alt="Capsula X7 ziua" width="2149" height="1209"></div>
  <div class="s-zn-clip"><div class="s-zn-pan"><img class="s-zn-night" data-src="img/x7s_night.webp" alt="Capsula X7 seara, cu luminile aprinse" width="2149" height="1209"></div></div>
  <canvas class="s-zn-gl" aria-hidden="true"></canvas>
  <span class="s-zn-pill n">☾ Seara</span><span class="s-zn-pill d">☀ Ziua</span>
  <div class="s-zn-line" aria-hidden="true"></div>
  <button class="s-zn-knob" type="button" role="slider" aria-label="Mută linia dintre seară și zi" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" aria-valuetext="Seara 100%, ziua 0%">‹ ›</button>
  <small class="caps-label s-zn-cap">Vizualizare realizată pornind de la fotografia capsulei X7.</small>
 </div>
</section>
```
`--split` (0…1) = cât din lățime e noapte, de la stânga.

**Layout calculator (≥1101):** `padding:clamp(70px,8vw,110px) 0 0` (fără padding jos: banda se lipește de `#model`). Antet `.head-row`: stânga eyebrow + titlu; dreapta nota (`max-width:400px`, 15px mute). Banda: `margin-top:36px;position:relative;width:100%;height:min(84svh,56.25vw);overflow:hidden;background:#070b16;touch-action:pan-y;user-select:none;cursor:ew-resize` (cursorul doar pe pointer fin). `.s-zn-pan,.s-zn-clip{position:absolute;inset:0}`; `.s-zn-clip{clip-path:inset(0 calc(100% - var(--split)*100%) 0 0)}` (decupajul e pe un element **netransformat**, ca marginea să rămână sub linie); imaginile `width:100%;height:100%;object-fit:cover;object-position:var(--op,50% 55%)`. Pastile: `top:24px`, „☾ Seara” la `left:24px` (`background:rgba(7,11,22,.55);color:#fff;backdrop-filter:blur(8px)`), „☀ Ziua” la `right:24px` (`background:#fff;color:var(--ink)`), Manrope 600 13px, `padding:7px 12px;border-radius:999px`. Linia: `position:absolute;top:0;bottom:0;left:calc(var(--split)*100%);width:2px;margin-left:-1px;background:#d4a24c;box-shadow:0 0 12px rgba(212,162,76,.6)`. Butonul: `position:absolute;top:50%;left:calc(var(--split)*100%);width:56px;height:56px;transform:translate(-50%,-50%);border-radius:50%;background:#fff;color:var(--ink);font:700 18px var(--body);box-shadow:0 10px 30px rgba(15,20,30,.3);border:0`, `:focus-visible{outline:3px solid var(--accent);outline-offset:3px}`. Eticheta `.s-zn-cap` (caps-label) jos-stânga, 12.5px.
**Tabletă (820×1180):** înălțime `max(56.25vw,52svh)` (≈614px), `--op:62% 55%`.
**Telefon ≤800 (390×844):** titlu 32px (din `.title`), nota lungă (14px, ~3 rânduri); banda `height:min(52svh,120vw)` (≈439px), `--op:64% 52%` (se văd capătul vitrat luminat și ușa), buton 48px, pastile `top:12px;left/right:12px`, 12px.
**Ecran scurt (506×506):** nota scurtă (1 rând); banda `height:clamp(240px,60svh,320px)` (≈304px, se vede toată capsula), `--op:64% 52%`, buton 44px (ținta de atingere rămâne 44px), pastilele rămân. Fără derulare orizontală.

**Interacțiuni și 3D:**
- Imaginile primesc `src` din `data-src` doar când banda e la 600px de ecran (`CAPS.near(stage,'600px 0px',…)`). Ziua nu se încarcă la prima afișare.
- **Răsăritul (singurul moment automat):** la prima vizibilitate ≥40%, `--split` 1,0 → 0,5 în 2,4 s (`CAPS.ease`), apoi butonul pulsează o dată (`scale 1→1.12→1`, 600ms). Orice `pointerdown` în timpul animației o anulează.
- Tragere: `pointerdown` oriunde pe bandă → `setPointerCapture`; `--split = clamp((clientX - rect.left)/rect.width)`; doar orizontal (`touch-action:pan-y` lasă derularea verticală pe telefon). Click/atingere simplă mută linia acolo. Tastatura pe buton: ←/→ ±5%, Home 0%, End 100%. `aria-valuenow = round(split*100)`, `aria-valuetext` „Seara {x}%, ziua {100−x}%”.
- **WebGL (îmbunătățire, doar calculator):** numai dacă `(hover:hover) and (pointer:fine)`, `innerWidth > 800`, fără mișcare redusă și dacă `getContext('webgl')` reușește. Contextul se creează leneș când banda e la 600px de ecran, desenează în rAF doar cât banda e vizibilă și `!document.hidden`, și se eliberează (`WEBGL_lose_context` + scoaterea canvas-ului) când banda e la peste 2 ecrane distanță (se recreează la revenire). Pe `webglcontextlost` → înapoi la imaginile cu clip-path. Shader: copia fragment-shader-ului din hero (`c=vec2(.62,.6)`, `f=.42`, 7 iterații pe canalul **G** din `img/x7s_depth.png`) + `uniform sampler2D t1; uniform float split;` → aceeași coordonată deplasată `u` pentru ambele texturi și `gl_FragColor = vec4(v.x < split ? texture2D(t0,uu).rgb : texture2D(t1,uu).rgb, 1.)` (`v.x` = coordonata pe ecran, 0 = stânga; `uu = clamp(u, .001, .999)`). Linia rămâne în DOM, peste canvas. Cameră: `zm = 1.04`, `dol = .03`, `A = .04`, `ox = A*(.9*(2q-1) + .3*mx)`, `oy = A*.25*my`, unde `q = clamp((innerHeight - rect.top)/(innerHeight + rect.height))` (o deplasare lentă stânga→dreapta cât derulezi) și `mx,my` = poziția mouse-ului pe bandă (−1…1, netezită ×0,05, 0 când iese). `pos` = `object-position` al imaginii (`.5,.55`). Cu WebGL activ: `.s-zn-stage.gl` ascunde `.s-zn-pan/.s-zn-clip` (`visibility:hidden`) și arată canvas-ul.
- **Telefon / fără WebGL:** mișcare 3D ușoară doar din CSS: pe ambele `.s-zn-pan` același `transform:scale(1.08) translateX(calc((var(--q) - .5) * -4%))`, cu `--q` actualizat în rAF doar cât banda e vizibilă (decupajul e pe `.s-zn-clip`, deci linia rămâne aliniată).
- **Mișcare redusă:** fără răsărit (pornește la 50%), fără pan, fără WebGL, fără puls.

**Text (RO, exact):**
- Eyebrow: „Zi și seară” (`data-n="03"`). Titlu: „Ziua și **seara.**” (`seara.` în `<em>`).
- Notă: „Trage linia ca să compari. Iluminatul interior și exterior se controlează din sistemul smart home, inclusiv vocal.”
- Notă scurtă (ecran scurt): „Trage linia ca să compari ziua cu seara.”
- Pastile: „☾ Seara” (stânga), „☀ Ziua” (dreapta). Buton: `aria-label` „Mută linia dintre seară și zi”; `aria-valuetext` „Seara {x}%, ziua {100−x}%”.
- `alt`: „Capsula X7 ziua” / „Capsula X7 seara, cu luminile aprinse”.
- Etichetă (onestitate, obligatorie): „Vizualizare realizată pornind de la fotografia capsulei X7.”

### 5.6 `model` — Descoperă următoarea ta casă · **neatins** (doar `data-n="04"`)
Markup, text, tabel, preț (39.500 €, 41.000 € tăiat, „Preț promoțional”), nota, cele 3 butoane, imaginea `n_hero.jpg` cu tilt și umbra 3D pe „X7” rămân exact. Se mută după `#zi-noapte`. Telefon: neschimbat.

### 5.7 `tur` — Intră în capsula X7 · **neatins** (mutat, `data-n="05"`)
Turul e pus pe pauză de client: nu se atinge nimic din `#vt`, Pannellum, scriptul turului sau CSS-ul lui. Doar se mută după `#model` și eyebrow-ul primește `data-n="05"`. Cardul final din `#interior` („Începe turul 360°”) duce aici.

### 5.8 `la-comanda` — Sau alege un model la comandă · **neatins** (`data-n="06"`)
Neschimbat (caruselul `window.CAT`, filtrele, `#cmodal`, textele). `#cmodal` rămâne imediat după secțiune.

### 5.9 `galerie` — Capsule reale, pe care le vezi azi · **schimbat** (`data-n="07"`)
- **Scop:** dovada „capsule reale”. Singura schimbare: se adaugă ultima fotografie reală nefolosită, `img/x7_photo.jpg` (verticală), ca toate pozele reale să fie pe pagină.
- **Date:** `window.GAL` primește la **final** `["img/x7_photo.jpg","Capsula X7, capătul vitrat și intrarea"]` (indicii 1 și 2 rămân `n_v1`, `n_v2`, pe care îi folosește modalul X7 din `la-comanda`).
- **Afișare:** grila se desenează în ordinea `[0, 9, 1, 2, 3, 4, 5, 6, 7, 8]` (x7_photo pe locul 2), cu `data-i` = indicele real din `GAL` (lightbox-ul merge în ordinea `GAL`). Butonul x7_photo are clasa `tall`. Numerotarea `<i>01</i>…` urmează ordinea afișată.
- **CSS:** `.gal{grid-auto-flow:dense}` · `.gal button.tall{grid-row:span 2}` · `.gal button.tall img{object-position:50% 38%}` · se înlocuiește `.gal button:nth-child(n+6){display:none}` cu `.gal button:nth-child(n+8){display:none}` · în `@media (max-width:800px)` se înlocuiește `.gal button:nth-child(n+4){display:none}` cu `.gal button:nth-child(n+5){display:none}`.
- **Rezultat verificat:** calculator 4 coloane × 3 rânduri, fără găuri (n_hero 2×2, x7_photo 1×2, n_v1, n_v2 / n_v3, n_v4 lat, n_v5); 801–1000: 2 coloane, fără găuri (cu `dense`); ≤800: n_hero 2×2, apoi x7_photo înalt + n_v1 + n_v2. Verifică la 390 și 506 că x7_photo nu e tăiat ca o fâșie.
- Antetul, „Toată galeria →”, banda cu 4 casete și efectele (rise, tilt, parallax, lightbox) rămân. Nu se pun aici imaginile AI (`x7s_*`) sau `ext_*`/`int_*`.

### 5.10 `mai-mult` — Tot ce mai vrei să știi · **neatins** (`data-n="08"`)
Cele 6 carduri și tilt-ul rămân. „Specificații” și „Legal” sunt intrarea principală acum că au ieșit din bara de sus.

### 5.11 `contact` — Vino să o vezi înainte să alegi · **neatins** (`data-n="09"`)
Fundalul `n_v3.jpg` cu voal alb, adresa, butoanele („Intră în turul 360°”, „Vezi traseul pe hartă ↗”), formularul spre WhatsApp și nota de confidențialitate rămân exact.

### 5.12 `footer` — Subsol · **schimbat** (2 linkuri)
În lista „Descoperă”, la început: „Interiorul capsulei” (`#interior`) și „Ocolește capsula” (`#exterior`). Restul rămâne, inclusiv „Denumire firmă SRL · CUI ____ · Nr. Reg. Com. ____ (de completat)” (așteaptă datele de la client).

---

## 6. Integrare (pentru orchestrator)

**Pasul 0 — copie de siguranță:** `mkdir -p versiuni/inainte-film && cp site/home.html versiuni/inainte-film/home.html`.

**Pasul A0 — imagini (înainte de builderi):**
1. Obligatoriu: `img/ext/real_v5.webp` și `img/ext/real_v1.webp` din `img/n_v5.jpg` și `img/n_v1.jpg`: redimensionare la 1600×900 (fără decupaj), WebP calitate 82, `method=6` (≤250 KB).
2. Opțional: `img/int/int_masa_n_a.webp` și `img/int/int_dorm_n_a.webp` din `p360/masa_n_x.webp` și `p360/dorm_n_x.webp` cu `surse/final/pano_view.py` (`--preview` ca să alegi `yaw/pitch` care seamănă cu `int_masa_a` / `int_dorm_a`; `--w 1600 --h 1000`, `--fov` ~90; WebP q84). Se păstrează doar dacă arată curat; atunci se adaugă `night` în `ROOMS` la masa / dormitor. Altfel camerele acelea nu au Zi/Seara.
3. `ls site/img/int site/img/vid site/img/ext` chiar înainte de a scrie `ROOMS` și `EXT`.

**Unde intră codul:**
- CSS: `<style id="caps-shared-css">`, apoi `<style id="s-int-css">`, `<style id="s-ext-css">`, `<style id="s-zn-css">`, toate imediat după `</style>`-ul principal (înainte de `<style id="pnlm-css">`).
- HTML: în ordinea din §2. `#interior` imediat după `#top`; `#caracteristici` după el; `#exterior`, `#zi-noapte`; apoi `#model`, `#tur`, `#la-comanda` + `#cmodal`, `#galerie`, `#mai-mult`, `#contact`, `footer`, `#lb`, `.wa`, scripturile.
- JS: la finalul `<body>`, după scriptul `at-top`: `<script id="caps-shared">`, apoi `s-int`, `s-ext`, `s-zn` (fiecare IIFE cu `'use strict'`; singurele globale: `window.CAPS`, `window.ROOMS`, `window.EXT`, `window.openLB`). Secțiunile noi nu depind una de alta.
- Titlurile `.title` trebuie să fie în HTML static (scriptul existent le împarte în cuvinte la încărcare).

**Modificări mici în codul existent (singurele):**
1. Lightbox (scriptul principal): în loc de `const G=window.GAL` folosit direct, o listă curentă `let L=window.GAL`; `show(i)` lucrează pe `L`; `window.openLB=(list,i)=>{L=list;show(i)}`; butoanele din `#gal` apelează `openLB(window.GAL,+b.dataset.i)`. Opțional: glisare stânga/dreapta pe `#lb` (touch). Galeria se desenează în ordinea de afișare din §5.9.
2. `window.GAL`: se adaugă x7_photo la final (§5.9).
3. CSS galerie (§5.9).
4. Navigare (§4), subsol (§5.12), renumerotarea `data-n`: tur 05, model 04, la-comanda 06, galerie 07, mai-mult 08, contact 09 (azi sunt 01, 02, 03, 04, 06, 07).
- **Nu se ating:** `#top` și scriptul `nhGL`, scriptul `at-top`, `#vt`/Pannellum/scriptul turului, scriptul `la-comanda`, formularul, calculatoarele, scriptul 3D „sub hero” (nu adaugă `.t3/.r3` la secțiunile noi).

**Capcane cunoscute:**
- `section{padding:clamp(80px,11vw,140px) 0}` se aplică și secțiunilor noi: suprascrie-l cu id-ul secțiunii.
- `body{overflow-x:hidden}` se propagă la viewport, deci `position:sticky` merge; nu pune `overflow:hidden` pe `#interior` (folosește `overflow-x:clip`). Dacă totuși sticky nu merge, schimbă doar `body{overflow-x:clip}`.
- Atributul `poster` se descarcă imediat: folosește `data-poster`.
- `pathLength` cu `vector-effect:non-scaling-stroke` poate să nu anime în Safari: dacă nu merge, linia apare direct desenată.
- Gradientul hărții are id propriu `extConeG` (turul are deja `vtConeG`).
- 3 contexte WebGL posibile (hero, zi-noapte pe calculator, Pannellum): cel din zi-noapte e leneș și se eliberează când e departe.
- Regula globală pentru mișcare redusă oprește toate tranzițiile CSS; JS-ul nu trebuie să depindă de `transitionend`.

**Unelte și verificare:**
- `tools/make_v1.py` nu mai merge din commit-ul c2a7830 (nu mai există `body.v2`): nu-l rula și nu reintroduce V1/V2. `home_v1.html` e vechi: nu-l șterge fără acordul clientului.
- `tools/test_pagini.js`: testează doar `home.html` (scoate `home_v1.html` din `PAGES`) la 506×506, 390×844, 820×1180, 1440×900, 1920×960. Pe lângă captura de sus, fă capturi la: începutul `#interior`, mijlocul plimbării (`scrollY = interior.offsetTop + .5*(interior.offsetHeight - innerHeight)`), `#exterior`, `#zi-noapte` (după 3 s, ca să se termine răsăritul), `#galerie`; plus `emulateMedia({reducedMotion:'reduce'})` la 1440×900 și 390×844. Criterii: zero `pageerror`, zero răspunsuri 4xx, `document.documentElement.scrollWidth <= innerWidth`, cel mult un `<video>` care rulează.
- Documentație după aprobare: tabelul din `docs/DETALII-TEHNICE.md` §2 cu noua ordine și un paragraf nou pentru `interior`, `exterior`, `zi-noapte`; în `CLAUDE.md`, părțile despre V1/V2 și `make_v1.py` marcate ca depășite (de întrebat clientul înainte de ștergere).
- La final, clientului i se scrie în 2–4 rânduri (§0).

**Dacă pagina pare prea lungă:** întâi `K = 1.8` în `#interior`; apoi se unesc „Masa” și „Bucătăria” într-un singur panou; scenele nu se taie. Dacă clientul nu vrea ziua: se șterge doar blocul `#zi-noapte`.
