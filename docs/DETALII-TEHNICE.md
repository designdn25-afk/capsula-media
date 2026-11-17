# Detalii tehnice și istoric

> **Din 22 oct 2026 (site-ul final):** prima pagină se generează din `surse/final/home.base.html` + `surse/final/parts/*.html`
> cu `python3 tools/asambleaza.py`. Specificația completă a secțiunilor noi (texte, mărimi, comportamente) e în
> `surse/final/SPEC.md`; ce arată fiecare poză/clip nou e în `surse/final/media.json`. Secțiunile 4 (hero V1) și 5 (hero V2)
> de mai jos descriu variante scoase din pagină; rămân ca referință.

Citește secțiunea potrivită înainte să lucrezi la hero, la turul 360 sau la imagini.
Sursa de adevăr este întotdeauna `site/home.html`: tot CSS-ul și JavaScript-ul sunt inline acolo.

## 1. Tema albă
- Blocul `/* ===================== TEMA ALBĂ ===================== */` din `<style>` suprascrie tema veche (închisă).
- Culori: `--bg:#ffffff`, `--bg2:#f4f5f7`, `--ink:#0e1116`, `--mute:#5d6572`, `--accent:#d4a24c`, `--accent-ink:#9a6c1c`.
- Fonturi (Google Fonts): `--display: 'Unbounded'` pentru titluri, `--body: 'Manrope'` pentru text.
- `complet.html` / `index.html` au aceeași temă albă: blocul „TEMA ALBĂ” copiat din home.html (fără regulile care schimbă hero-ul: `.stage3d{height:100vh}` și ascunderea `#rl1…#rl5`), plus regulile formularului alb (care în home.html stau la finalul stilului Pannellum). Dacă schimbi tema în home.html, copiaz-o și aici.

## 2. Secțiunile din home.html (în ordine)
| id | ce conține |
|---|---|
| `bld` | hero Varianta 2: construcția ca un video |
| `top` | hero Varianta 1: poza reală cu efect 3D (`section.stage3d`) |
| `caracteristici` | 4 puncte: Spațiu 36,5 m² · Structură oțel și aluminiu · Geam triplu LOW-E · Smart home |
| `tur` | turul virtual 360° |
| `model` | fișa modelului X7 (39.500 €, rate TBI) |
| `la-comanda` | caruselul cu cele 20 de modele la comandă |
| `galerie` | „De ce noi”: capsule reale din showroom |
| `mai-mult` | carduri care duc la complet.html (configurator, rate, investitori, specificații, legal, FAQ) |
| `contact` | adresa showroom-ului, harta, formularul care trimite pe WhatsApp |

`complet.html` are secțiunile: top, idee, model, la-comanda, compartimentare, interior, configurator, investitori,
galerie, cum-cumperi, livrare, finantare, despre, specificatii, legal, incredere, faq, contact.

## 3. Comutatorul Varianta 1 / Varianta 2
- Markup: `<div class="vsw" id="vsw"><button data-v="1">…</button><button data-v="2">…</button></div>`.
- `home.html` are `<body class="v2" data-var="2">`. `home_v1.html` are `<body data-var="1">` (generat de `tools/make_v1.py`).
- `#v1` / `#v2` în adresă alege varianta. Clasa `v2` pe `<body>` decide ce hero se vede:
  `body.v2 .stage3d{display:none}` și `body:not(.v2) .bld{display:none}`.
- La comutare pagina urcă sus, iar V2 pornește de la început (`window.bldRestart()`).

## 4. Hero Varianta 1 (`#top` → `#rl0 .h3d`)
**Straturi** (de jos în sus):
- `.h3-bg`: imaginea din spate, foarte blurată, umple marginile când straturile se mișcă.
- `.h3-far`: cerul și fundalul fără capsulă (capsula a fost ștearsă din acest strat).
- `.h3-near`: capsula și tot solul (opac); deasupra are `.h3-sweep` (luciul care trece peste geam, prin mască)
  și `.h3-flare` (strălucirea soarelui în geam).
- `.h3-vig`: umbrirea care face textul lizibil.

**Mișcarea**: straturile au `inset:-4%`. Un script mișcă `far` și `near` diferit după mouse sau giroscop (parallax),
plus o mișcare lentă continuă. La încărcare are loc o apropiere de 3,4 s. Pe ecrane ≤800 px scara de bază e 0,96.
Cu `prefers-reduced-motion` mișcarea e oprită.

**Imaginile** (alese prin `<picture>` cu `<source media="(max-aspect-ratio: 5/4)">`):
| fișier | mărime | când | ce este |
|---|---|---|---|
| `img/hero_near_w.webp`, `img/hero_far_w.webp` | 2149×2240 | ecrane late | compoziția APROBATĂ de client: fotografia, plus 700 px extinși în stânga |
| `img/hero_near_t.webp`, `img/hero_far_t.webp` | 1417×2240 | ecrane înalte sau pătrate | doar fotografia reală |
| `img/hero_glass.png` / `img/hero_glass_t.png` | jumătate de rezoluție | – | masca geamurilor pentru luciu |

**Încadrarea** (`object-position`, iar masca luciului folosește aceleași valori):
- late: `100% 42%` pe calculator, `66% 38%` la ≤800 px (blocul „hero 3D din fotografia reală”);
- înalte: `12% 46%` (blocul „hero V1: pe ecrane late rămâne compoziția aprobată…”), ca să se vadă colțul din față al capsulei.

**Strălucirea soarelui**: `sunOf()` din JS dă poziția relativă a reflexiei în imagine:
late `[(700+740)/2149, (1037-180)/2240]`, înalte `[(740-32)/1417, (1037-180)/2240]`.
Dacă schimbi dimensiunile imaginilor, actualizează `sunOf()`, măștile și `object-position`.

**Ce s-a făcut pe 22 oct 2026** (după ce clientul a zis că în panoul îngust imaginea arată „foarte nasol, mai ales jos”):
- pe ecranele înalte sau pătrate se vede doar fotografia reală, fără partea extinsă din stânga, care avea o îmbinare;
- de pe pavaj au fost scoase cablul negru (care părea o dâră de ulei) și o bucată albă de gunoi, cu
  `surse/hero-v1/shiftfill2.py`, care copiază textura pavajului dintr-un loc vecin și taie de-a lungul unei linii invizibile;
- dunga neagră de 32 px din marginea stângă a fotografiei a fost tăiată;
- în imaginea lată tot solul a trecut pe stratul `near`, ca pavajul să nu se mai dubleze la mișcare.
  În repaus imaginea a rămas identică cu cea aprobată.
- Originalele aprobate (cu cablu) sunt păstrate în `surse/hero-v1/hero_*_aprobat_cu_cablu.webp`.
  `surse/hero-v1/build_layers.py` arată cum au fost construite straturile; căile din el trebuie adaptate.

## 5. Hero Varianta 2 (`#bld`) — construcția ca un video
**Imaginile** (toate aliniate pe aceeași fotografie, 2149 px lățime):
`img/x7s_lot.webp` (terenul gol) → `img/x7s_frame.webp` (structura din oțel) → `img/x7s_day.webp` (capsula reală, ziua)
→ `img/x7s_night.webp` (seara). Au fost generate cu AI în YouArt, pornind de la fotografia reală extinsă (`surse/hero-v2/day_2149.png`),
apoi aliniate cu `surse/hero-v2/align.py` (ECC afin pe hărți de contururi).

**Cronologia** (secunde, în scriptul „hero varianta 2”):
- titlul de intro dispare între 2,4 și 3,1 s;
- etapele încep la `S0=[2.8, 4.6, 6.8, 9.0, 10.6, 12.9]`; `FIN=13.0`, `END=14.2`;
- structura apare între 4,0 și 5,3 s; panourile și vitrajul se „construiesc” de jos în sus între 6,6 și 8,7 s
  (mască cu variabila `--r`); seara vine între 10,3 și 11,9 s.
- Timpul curge doar cât hero-ul e vizibil. Pornește după ce s-au încărcat imaginile (cel mult 6 s așteptare).
- „Sari peste ›” sare la final; „↺ Vezi din nou” repornește (`window.bldRestart()`). Cu `prefers-reduced-motion` arată direct finalul.
- Etichetele etapelor (vectorul `ST`): Terenul · Structura din oțel · Panouri și vitraj · Capsula finalizată · Seara, acasă.
- Pe ecrane ≤800 px imaginea stă sus (de la 64 px, înălțime 50svh, `object-position:80% 50%`), iar textele sunt dedesubt.

### Hero V2 în 3D (22 oct 2026)
- Scriptul „hero V2 în 3D” din home.html randează cele 4 imagini într-o `<canvas id="bldGL">` (WebGL 1), în locul imaginilor `.L`
  (clasa `gl3d` pe `.bld-cam` le ascunde). Cronometrul vechi rămâne sursa timpului: scrie `window.__bldT`, iar textele, etapele și
  butoanele merg ca înainte.
- `img/x7s_depth.png`: harta de adâncime (alb = aproape). Canalul R e pentru teren și structură (cu stiva de panouri), G pentru capsula
  finalizată și seara. Se generează cu `surse/hero-v2-3d/depth.py` (rulează din `site/img`; orizontul e la rândul 815, iar linia de
  contact a capsulei cu solul merge de la (900, 915) la (1930, 850)).
- Camera: paralaxă după adâncime, cu capsula ca punct fix (`f=.42`). Amplitudinea e 0,045 pe calculator și 0,03 pe telefon
  (`A` în script). Merge de la stânga la dreapta în 13,5 s, apoi se leagănă ușor. Pe calculator urmărește puțin mouse-ul.
- Etapele: structura apare de jos în sus între 3,4 și 5,8 s, panourile între 6,3 și 9,2 s (cu linia aurie doar pe pixelii care se
  schimbă), iar seara între 10,0 și 12,6 s (întâi se întunecă, apoi se aprind luminile).
- Fără WebGL sau cu `prefers-reduced-motion` se văd imaginile obișnuite, ca înainte.

## 6. Turul 360 (`#tur`)
- Motor: Pannellum (commit 99f4afd, compilat din sursă), inclus inline în home.html (`<style id="pnlm-css">` și scriptul lui).
- Datele sunt în scriptul „tur virtual interior X7”:
  - `SEQ`: ext, prag, intrare, living, masa, mijloc, canapea, vitraj, colt, blat, hol, baie, dormu, dorm, dormf;
  - `N`: pentru fiecare punct, `n` (nume), `H` (corecția direcției), `p` (poziția pe planul mic), `v` (privirea inițială [yaw, pitch]),
    `txt`, `f` (dotări), `tags` (etichete [yaw, pitch, text, parte]) și `links` (săgețile de pe podea [punct, yaw, pitch]);
  - `NIGHT`: living → living_n, masa → masa_n, baie → baie_n, dorm → dorm_n (butonul „☾ Seara”).
- Fișiere: `p360/<punct>_s.webp`, `_m`, `_l`, `_x` (de la mic la foarte mare). Se încarcă întâi varianta mică, apoi
  cele mari în fundal (fetch → blob). `p360/t_<punct>.jpg` sunt miniaturile.
- Interfața: card „Începe turul”, numele camerei, Zi/Seara, ecran complet, plan mic, săgeți, bandă cu miniaturi,
  panou cu descriere și „▶ Turul automat”. Trecerea între puncte folosește o captură a imaginii care se estompează.
- Fotografiile 360 originale sunt în release-ul GitHub https://github.com/designdn25-afk/capsula-media/releases/tag/v1
  (fișiere `IMG_2026100x_HHMMSS_00_NNN.jpg`). `surse/tur360/proc.py` leagă fiecare punct de fișierul original (dicționarul `R`),
  pune sigla Capsula România jos (nadir), șterge trepiedul și scoate cele 4 mărimi.
  `surse/tur360/t360.*` sunt o copie mai veche a codului; versiunea actuală e cea din home.html.

## 7. Caruselul „Capsule la comandă” (`#la-comanda`)
- 20 de modele: X7, X5, M9, M7, V11, V9, V8, V7, V6, V5, V3, V2, PX7, PX5, PX3, E7, E5, E3, T7, T5.
  Doar X7 are preț afișat (39.500 €). Imaginile sunt randări din catalogul producătorului, incluse direct în pagină (data URI).
- A fost generat inițial cu `surse/catalog/cat_build.py` din `surse/catalog/mod/*.jpg`. Versiunea actuală e cea din home.html.

## 8. Resurse externe
- GitHub (media): https://github.com/designdn25-afk/capsula-media (release `v1`: fotografii 360, poze și video).
- YouArt: proiectul „Capsula X7 — construcție scroll (hero)”, id `12fe7f23-4b67-452b-ad0d-32b03df472b6`.
  Creditele erau 0 la 22 oct 2026; pentru imagini AI noi trebuie reîncărcat contul.
- Site-ul actual: https://casecapsula.ro (sursa textelor; EN/BG și PDF-urile trimit acolo).
- Datele structurate (JSON-LD) din `<head>` folosesc o imagine de pe casecapsula.ro. Pentru SEO e normal.

## 9. Istoric pe scurt
1. Pagina principală nouă, cu tot conținutul de pe casecapsula.ro; pagina lungă `complet.html`.
2. Turul 360 refăcut de la zero din pozele 360 de pe GitHub: 15 puncte, zi și seară, încărcare progresivă HD.
   S-a scos un deget care se vedea la început. Apoi clientul a pus turul pe pauză.
3. Hero V1: capsula reală pe exterior, cu efect 3D. Partea din stânga, care era blurată, a fost extinsă.
   O propunere care schimba tot a fost refuzată și s-a revenit la varianta inițială. Petele de pe pavaj, care păreau ulei, au fost curățate.
   Clientul a aprobat varianta și a cerut să fie salvată (`versiuni/v1-hero-3d/`).
4. Interfața a trecut pe alb, „Geam triplu LOW-E” a fost pus peste tot, iar secțiunea „De la prima vizită la casa ta” a fost scoasă.
5. Hero V2: construcția „de la schiță”, după un video de referință al clientului. Prima variantă (desen) a fost refuzată,
   apoi a fost refăcută cu imagini AI realiste și transformată într-un „video” care rulează singur, fără scroll.
6. Demo-ul a fost publicat cu două linkuri publice (V1 și V2).
7. 22 oct 2026: V1 a fost curățat pe telefon și în panoul îngust (vezi secțiunea 4), salvat în `versiuni/v1-hero-curat/`.
   Apoi proiectul a fost mutat în Claude Code.

## 10. Unelte folosite
- Python 3 cu `numpy`, `opencv-python`, `pillow`, `scipy` pentru scripturile din `surse/`.
- Node + Playwright (Chromium) pentru `tools/test_pagini.js`.
- Imaginile se salvează în WebP (calitate 82–86, `method=6`). PNG doar pentru măști.

## 11. Site-ul final (22 oct 2026)
> Din 14 nov 2026 hero-ul descris mai jos a fost înlocuit de povestea 3D (vezi secțiunea 12); restul secțiunilor au rămas.
- **Hero (#top):** doar `img/x7s_night.webp`, randată în WebGL cu harta de adâncime `img/x7s_depth.png` (canalul G):
  cameră care „respiră” (perioade 24 s / 33 s), urmează puțin mouse-ul, se ridică la derulare; bucla se oprește când hero-ul
  nu se vede. Textul: un rând de titlu, un rând de informații, două butoane. Butonul WhatsApp apare abia după hero (`body.at-top`).
  Bara de sus rămâne închisă la culoare (`nav.dark`) peste noapte și peste intrarea întunecată din #interior.
- **#interior** (`parts/interior.html`): mod „film” (scenă fixată, derularea mișcă pista de camere) pe ecrane de cel puțin
  621px înălțime (telefon: 740px) fără mișcare redusă; altfel mod „glisare” (pistă orizontală, planul e meniul).
  Intrarea: fundal de noapte, apoi lumina zilei se deschide ca un cerc din prima fereastră (`--rv`, `--cx`, `--cy`).
  Camerele vin din `window.ROOMS` (clipuri din `img/vid`, poze din `img/int`). Ramele au forma ferestrei X7 (`--win-v/p/l`).
  Planul e SVG după geometria turului 360, rotit 180° (livingul în stânga).
- **#exterior** (`parts/exterior.html`): 8 opriri din `window.EXT` (poze din panoramele de exterior + 2 fotografii reale),
  carusel cu scroll-snap nativ și rotire 3D după distanța de centru, hartă de sus cu conul camerei, un singur tur automat.
- **#zi-noapte** (`parts/zi-noapte.html`): `x7s_night` (stânga) și `x7s_day` (dreapta) despărțite de o linie aurie;
  „răsăritul” o singură dată; WebGL leneș pe calculator (același shader ca hero-ul), clip-path în rest.
  Eticheta „Vizualizare realizată pornind de la fotografia capsulei X7.” e obligatorie (imaginile sunt făcute cu AI).
- **Galerie:** `window.GAL` are la final `x7_photo.jpg`; afișarea urmează `ORD`, iar lightbox-ul comun
  `window.openLB(listă, i)` primește lista în ordinea de pe ecran.
- **Pozele noi:** `surse/final/pano_view.py` (decupaje din panoramele 360: exteriorul din release-ul GitHub `v1`, PNG 8192×4096;
  interiorul din `site/p360/*_x.webp`). Clipurile: din video-urile `1020.*.mp4` (release `v1`), H.264 720×1280, fără sunet.
- **Verificare:** `node tools/test_pagini.js` (5 mărimi + mișcare redusă). Ultima rulare: toate „ok”.

## 12. Site-ul în 3D (14 nov 2026)
Clientul a trimis un filmuleț de pe Instagram (un site cu o casă 3D care trece din zi în noapte la derulare, apoi se desface
pe straturi, urmată de o bandă cu cifre) și un filmuleț cu o grădină cu case model prin care se plimbă vizitatorul.
A cerut ca site-ul să fie „fix așa” și un tur 3D prin case, „mai jos un pic la site”. Copia dinainte: `versiuni/inainte-v3-3d/`.

- **three.js 0.170 e ținut local** în `site/vendor/` (plus `RoomEnvironment.js`, `RoundedBoxGeometry.js`, licența). Modulele din
  `site/js/` îl importă cu `'../vendor/three.module.min.js'`; pagina îl cere din timp cu `<link rel="modulepreload">`.
- **`js/kit.js`** — unelte comune: conturul în plan cu colțuri rotunjite (`perimeter`), suprafețe plimbate de-a lungul lui
  (`sweep`, `cap`), poligoane „desfășurate” așezate pe carcasă (`wrapPoly`, cu culori pe vârfuri pentru reflexia cerului pe geam),
  materialele comune, copaci, texturi desenate local, cheile de lumină pe ore (`DAY`, `dayAt`, `clock`).
- **`js/x7.js`** — capsula X7 construită din cod (11,5 × 3,4 × 3,45 m): carcasă, ferestre, ușă, acoperiș cu luminator, șasiu,
  structură din oțel, interior ca în showroom. Comenzi: `explode`, `blueprint`, `openRoof`, `liftRoof`, `night`.
- **Deschiderea** (`parts/story.html`, `js/stage.js`, `js/story.js`): secțiune de 680vh cu scenă fixată; derularea mișcă ora
  (06:50 → 21:10), camera (chei separate pentru ecran lat și ecran înalt, amestecate după proporția ecranului) și cele 6 capitole
  de text. Bara de sus își schimbă culoarea după cer (`window.__skyDark`). Pe tablete ținute în picioare se folosește așezarea de
  telefon (`max-aspect-ratio:1/1`). Fără WebGL sau cu mișcare redusă: capitolele apar unul sub altul, cu imaginile `img/st/ch0…5.webp`.
- **Banda cu cifre** (`#cifre`, în `home.base.html`): 36,5 m² utili · 39 m² construiți · 11,5 m · 39.500 €; numerele cresc de la zero
  când intră în ecran. Bara de sus rămâne închisă la culoare peste ea.
- **Grădina cu case** (`parts/gradina.html`, `js/garden.js`, `js/gscene.js`, `js/gradina-data.js`):
  - casele sunt o listă în `gradina-data.js` (cod din catalog, fișierul modelului, loc, rotire); datele afișate vin din `window.CAT`;
  - fiecare casă e un modul `js/h_<nume>.js` cu `info` și `build(M)` → `{ root, levels, openRoof(k), rooms, size }`
    (regulile sunt în `surse/final/CASE-3D.md`). Acoperișul și etajul folosesc `F.fadeSet(M)` + `F.lift(...)` din `js/furn.js`,
    ca să se ridice și să dispară singure; seara, toate casele se aprind din `gscene.js` (materiale comune + copiile lor);
  - trei stări: toată grădina → o casă (fișa cu m², dimensiuni, împărțire, preț) → în casă (acoperișul ridicat, etichete pe
    camere; la M9 se alege Etaj / Parter). Se ajunge cu apăsare pe casă, pe eticheta ei, din meniul de jos sau cu „Tur ghidat”;
  - camera se potrivește în zona liberă (fără fișă și fără meniul de jos) și alege singură partea din care nu stă altă casă în față;
  - umbra se recalculează doar când se schimbă ora sau se mișcă un acoperiș; scena se desenează doar cât se mișcă ceva;
  - „Fotografii” deschide fișa modelului din catalog (`window.CATopen`), „Cere ofertă” duce pe WhatsApp cu modelul completat;
  - fără WebGL: imaginea `img/gd/gradina.webp` și lista caselor. Cu mișcare redusă: 3D fără zboruri și fără tur ghidat.
- **Titluri**: `.title` folosește `--serif` (Cormorant Garamond), cuvântul din `<em>` e auriu și italic.
- **Meniul de sus** are un link în plus („Grădina”); „Capsule la comandă” a devenit „La comandă” ca să încapă.
- **Verificare:** `node tools/test_pagini.js` are și opririle „poveste-mijloc”, „cifre” și „gradina”. Ultima rulare (14 nov 2026):
  toate cele 7 treceri „ok” (5 mărimi + 2 cu mișcare redusă).

## 13. Grădina, a doua trecere: mai real și cu intrat în casă (14 nov 2026, seara)
Clientul: „arată prea ca un desen animat… vreau să pară mult mai real… aș vrea direct chiar să intre în casă”. Tot atunci a cerut
scoaterea secțiunii „Ziua și seara”. Copii: `versiuni/gradina-macheta/` (grădina dinainte), `versiuni/inainte-fara-zi-seara/`.

- **X7 era în oglindă**: în realitate, văzută din față, capsula are vitrajul mare al dormitorului în stânga ușii și livingul în
  dreapta (se vede în pozele reale și în datele turului 360). `x7.js` oglindește acum modelul o singură dată (`root.scale.x = -1`);
  etichetele camerelor din `story.js` și `h_x7.js` au fost întoarse la fel.
- **Intrarea în casă** (`garden.js`): starea „în casă” are două vederi, `inView = 'walk'` (la nivelul ochilor, implicit) și
  `'plan'` (de sus, cu acoperișul ridicat; la M9 cu Etaj / Parter). `buildWalk(casă)` găsește o singură dată punctele de stat:
  pentru fiecare cameră caută cu raze podeaua (materialul `M.floor`, sau lemnul terasei), un loc liber de mobilă în jurul
  etichetei camerei și direcția cea mai deschisă (cu un plus pentru geamuri). Trecerea dintre afară și înăuntru e o amestecare
  lină a poziției și orientării camerei (`blend`). În casă: tragi ca să te uiți în jur, apeși pe o cameră (din fișă sau pe
  eticheta din scenă) ca să mergi acolo.
- **Fotografii reale 360°** (`pano.js`): un strat desenat peste scena 3D cu un shader (panoramă echirectangulară), aliniat cu
  macheta. Casa X7 are în `gradina-data.js` rândul `pano` (punctele din turul 360: living, masă, blat, baie, dormitor), iar
  pozițiile și orientările vin din `window.VTN` / `window.VTNIGHT` (datele turului, expuse din `home.base.html`).
  Legătura plan tur → model: `x_model = x_plan − 5,75`, `z_model = y_plan − 1,7`; unghiul în fotografie = `H + 180 − (privirea −
  rotirea casei)`. Seara se folosesc variantele de noapte unde există. Cât fotografia e complet vizibilă, scena 3D nu se mai desenează.
- **Realism** (`real.js`, `gscene.js`, `genv.js`): vezi comentariile din fișiere (cer cu soare și nori, iarbă, copaci din frunze,
  texturi desenate local și așezate după poziția din lume, geam transparent cu reflexii). `genv.js` = fosta parte de grădină din `garden.js`.
- Pagina de probă `site/_t_env.html` arată grădina fără meniuri (din afară sau din interiorul unei case) și nu depinde de `garden.js`.
- **Mișcarea de la deschidere** (clientul: „nu se mișcă lin… când dau în jos”, cu filmare de pe MacBook): pe ecrane mari și dese
  desenul se face cu un buget de pixeli (`kit.fit(..., maxPx)`, implicit 3,6 MP, scade singur dacă placa video nu ține pasul);
  umbra se recalculează doar când se mută soarele sau capsula (`stage.shadow()`), cel mult o dată la două cadre; straturile
  capsulei sunt unite în câteva piese mari (`kit.mergeMeshes`, ~50 de desene în loc de 200). Camera nu mai stă pe loc în fiecare
  capitol ca să sară apoi la următorul: trece prin mijlocul capitolelor și curge continuu (`PTS` în `story.js`), iar derularea e
  urmărită cu o netezire după timp (`1 − e^(−3,6·dt)`). La fel, `garden.js` unește piesele fiecărei case (`mergeHouse`) și
  construiește casele pe rând, câte una pe cadru.
- **Realismul grădinii**, pe scurt: `real.js` desenează local texturile (iarbă, frunze, lemn, piatră, pavaj, țesătură) și le așază
  după poziția din lume (`triplanar`, fără coordonate de textură pe modele); `gscene.js` are cerul (soare, nori, dealuri, stele),
  lumina zilei și a serii, mediul pentru reflexii (refăcut doar când ora s-a schimbat destul) și geamul LOW-E transparent, care
  devine mai limpede când camera e în casă; `genv.js` are gardul viu, aleile, straturile cu flori, copacii din „cartonașe” de frunze
  și umbrele de contact. Scena din pagină: ~100–150 de desene, ~150.000 de triunghiuri.


## 14. Interior „real” cu AI în casele din grădină (14 nov 2026, noaptea)
Clientul: „înăuntru la capsule… arată tot pătrățos, vreau să faci real, ca pe video” și a aprobat trimiterea imaginilor la ElevenLabs
pentru toate casele. Pentru T7, E7, V3 și M9, fiecare cameră are acum o panoramă 360° realistă (`site/img/gd/ai/*.webp`, 19 fișiere,
~11 MB în total, încărcate doar la cerere), făcută din imaginea 360° a machetei. `garden.js` le tratează ca pe fotografiile reale
din X7 (`pano.js`), cu trei diferențe: cheia începe cu `ai:`, orientarea e `H = −rotirea casei` (imaginile sunt aliniate cu lumea)
și seara nu se afișează (rămâne macheta). Fișa casei arată „Vizualizare realizată cu AI, orientativă”. La intrarea într-o cameră,
privirea e îndreptată spre interior (cea mai lungă direcție care nu dă în geam). Pașii de refacere: `surse/ai360/CITESTE.md`.

## 15. Vederi „reale” din afară în grădină (15 nov 2026)

Cereri: „hai să facem și aici mai realistic” (grădina de sus), „și pe exterior, din afară, dacă te uiți pe geam tot arată totul
pătrățos”, „în afară să fie așa hale… să vadă că suntem în România, în Ciorogârla”, „folosește ambele, și Higgsfield, și ElevenLabs”.

- **Hale** în jurul grădinii și o curte de asfalt în față (`js/genv.js`), mai puțini copaci în afara gardului viu.
- **Camera stă în locuri fixe** (`view()` în `js/garden.js`): pentru fiecare vedere (toată grădina, fiecare casă) există un loc pentru
  ecran lat și unul pentru ecran înalt; pe ecran se schimbă doar unghiul de vedere. Dintre cele două locuri se alege cel din care
  subiectul se vede mai mare în spațiul liber (`pvOf`; pe ecran mare rămâne vederea lată dacă diferența e mică). Înainte se alegea
  după proporția spațiului liber și, pe unele telefoane, ieșea o vedere foarte deformată (unghi de 84°).
- **Imaginea realistă** a unei vederi (`VEDERI` în `js/gradina-data.js`) e o imagine obișnuită, făcută din același loc; `js/pano.js`
  (`renderFlat`) o desenează peste scena 3D, potrivită cu unghiul de vedere și cu decalajul camerei, deci etichetele caselor și
  apăsatul pe ele rămân corecte. Unde imaginea nu ajunge până la marginea ecranului se stinge lin în macheta 3D. Apare după ce
  camera a ajuns la loc; la zbor, la rotire cu degetul/mouse-ul și seara se vede macheta. După o rotire, camera revine singură
  (2,6 s) și imaginea reapare.
- Pe scenă apare mențiunea „Vizualizare realizată cu AI, orientativă” (`.gd-ai`) cât timp se vede o imagine făcută cu AI (și în
  interior, și afară); pe ecran mic stă deasupra fișei casei. Textul de sub scenă spune același lucru.
- Cum se fac imaginile, ce e gata și ce a rămas: `surse/ai360/CITESTE.md` (partea a doua). Pe scurt: gata X7 pe ecran lat; restul
  de 11 așteaptă credite ElevenLabs sau generarea de către client în Higgsfield.

## 16. Rotire „reală” și seară „reală” în grădină: pregătite, așteaptă credite (15 nov 2026, ziua)

Clientul a văzut vederea reală a lui X7 („îmi place cum arată”), dar a reclamat, cu un filmuleț, că la rotire și seara apare tot
macheta: „când miști capsula 360 tot așa apare pătrățos… și pe zi și pe noapte”.

- **În pagină e gata** (`js/garden.js`, `ROTIRI` și `VEDERI` în `js/gradina-data.js`): o casă poate avea cadrele unei filmări care o
  ocolește (rotire) și fiecare vedere poate avea și imagine de seară. Cât timp nu există cadre/imagini, totul se poartă ca înainte.
  La rotire se arată cadrul cel mai apropiat de unghi (camera 3D sare la unghiul cadrului, etichetele rămân potrivite); cadre mici
  în mișcare, cadrul mare la oprire; pe telefon se încarcă întâi un sfert din cadre.
- **Sursele sunt gata**: cele 12 vederi de seară ale machetei (`surse/ai360/vederi/gr_*_n_src.jpg`) și filmările 3D ale rotirii pentru
  cele cinci case (192 de cadre, 8 s; se refac cu `capspin.js`, nu sunt în git fiindcă sunt mari; sunt deja atașate în ElevenLabs).
- **În ElevenLabs sunt pregătite, nepornite**: 11 imagini de zi, 12 de seară și proba de rotire pentru X7. Contul avea 0 credite.
  Cifre, noduri și pași: `surse/ai360/CITESTE.md`, părțile a doua și a treia.
- Ordinea când apar creditele: (1) cele 11 imagini de zi, (2) cele 12 de seară, (3) o singură rotire de probă (X7) și, dacă arată
  bine, restul caselor; apoi rotirile pentru telefon și de seară, dacă clientul le vrea (dublează costul).

## 17. Toată grădina în vederi reale de zi și prima rotire reală (16 nov 2026)

Clientul: „vreau să-mi faci toată grădina să arate așa” (vederea reală a lui X7), apoi „gata, verifică acum” (a pus credite).
- Făcute și publicate cele 11 vederi de zi rămase; cinci dintre ele (V3, E7, M9 pe ecran lat; V3, M9 pe telefon) au fost refăcute cu
  o cerere mai bună, fiindcă prima dată ieșiseră „machetă lustruită”. `VEDERI` e complet.
- Rotire reală și la T7, E7, M9 (16 nov 2026), la fel; V3 încă nu (lipsă credite).
- Treceri reale între vederi (`xf` în `js/garden.js`): la `goTo` între două vederi din afară care au imagine, imaginea de pe ecran
  rămâne pe loc, camera sare la vederea nouă și imaginea ei apare peste cea veche. Rotirea: `n` cadre mici (192, 1024 px) și `nl`
  cadre mari (96, 1920 px); `fixspin.py … 192 1024` cu `MARI=96`; cadrele se cer pornind de la unghiul curent; la oprire rotirea
  se așază pe un cadru care are și varianta mare.
- Rotire reală la X7: `ROTIRI.X7`, 72 de cadre (din 5 în 5 grade) scoase dintr-o filmare Runway Aleph 2 a rotirii machetei.
  Proba cu Kling O3 a fost bani pierduți (a întors filmarea neschimbată).
- `tools/test_pagini.js` a trecut (7/7) înainte de aceste imagini; după, s-au verificat cu capturi vederile din afară pe 1440×900,
  390×844 și 506×506 și rotirea pe 1440×900 și 506×506.
- Credite ElevenLabs folosite în ziua aceea: ~65.500 (11 imagini ≈ 25.000; refaceri și probe de imagini ≈ 18.800; filmarea nereușită
  8.144; filmarea reușită 13.573).



## 18. Fără machetă: filmarea de la deschidere, treceri și rotire (16 noiembrie 2026)

Cerința clientului: „nu mai vreau deloc să mai apară alea pătrățoase”. Macheta 3D rămâne în spate (pentru etichete, apăsat pe case,
desenul pe straturi), dar pe ecran e mereu o imagine reală.

**Deschiderea (`js/story.js`, `FILM`)**: cadrele `img/st/film/f_0000…f_0384.webp` se arată după derulare. `FILM.T` = bucățile
(primul cadru, câte cadre, derularea primului cadru, pasul, dacă se topește în următoarea). Primele trei bucăți merg pe drumul
camerei 3D (de aceea etichetele camerelor cad la locul lor: cât se vede doar filmarea, camera 3D primește proiecția filmării,
`fcam`); a patra (seara) are pasul ei și se termină la derularea .78; între .80 și .87 filmarea se stinge peste desenul pe straturi.
Cadrele se cer doar din jurul locului curent, sunt despachetate în afara firului principal (`createImageBitmap`) și pe ecran se
trece doar prin cadre gata făcute. Ecran lat (raport ≥ 3:2): filmarea umple ecranul, un voal alb / închis în stânga ține textul
lizibil. Ecran îngust (aceeași regulă ca în CSS: ≤ 800 px sau ≤ 1100 px și mai înalt decât lat): bandă sus, tăiată în jurul
capsulei (`FILM.cx`), cu marginea de jos stinsă (mască CSS, `--fa` / `--fb`), fundal alb ziua și bleumarin seara. Ceasul arată
ora filmării (`FILM.time`), textul devine deschis de la `FILM.dark`.

**Grădina (`js/garden.js`)**:
- `keep()` / `settle()` / `xf`: imaginea de pe ecran (poză, cadru de rotire sau fotografie 360°) rămâne până când imaginea vederii
  noi e gata, apoi se topește în ea. Folosit la alegerea unei case, intrare, ieșire, „Plan”, nivel, cameră → cameră, zi ↔ seară.
- `rotLocked()`: vederile cu imagine fixă nu se rotesc la tragere. `spin*`: rotirea prin cadre (vezi comentariul din cod).
- desen: `G.render()` (macheta) se cheamă doar când nu e o imagine reală întreagă pe ecran; `pano.renderBack` umple marginile.
- pornire: `gd--live` se pune abia când prima imagine reală e pe pânză (sau după 9 s).
- „Zi / Seară” (`dnBox`) e ascuns în afară de interiorul caselor cu fotografii de seară (X7).
- planul folosește mereu locul „lat” al camerei când există imagine (`pvNow`).

**Teste** (în scratchpad-ul sesiunii, de refăcut la nevoie după aceleași idei): `gwalk.js` (drumul casă → înăuntru → cameră → plan →
afară, numără cadrele în care nu e nicio imagine reală pe ecran: trebuie 0), `gsmooth.js` (rotire pe net încet: fără machetă, fără
pași înapoi), `glock.js` (vederile fixe rămân pe loc), `story.js` (capturi ale deschiderii la derulări date).

## 19. Casa T6 și grădina mărită (16 noiembrie 2026)

**Cererea.** Clientul a trimis proforma, un filmuleț și poze de la târg cu „Tiny House T6” (prima casă comandată) și a cerut să fie
pusă în grădină ca model 3D; apoi: „și o să mai fie modele de case, trebuie să facem grădina mai mare”.

**Modelul (`site/js/h_t6.js`).** Casă care se extinde: modulul din față (fix, 5,85 × 2,27 m, colțurile de sus rotunjite) are livingul
cu chicinetă; partea din spate (5,45 m lățime, cu 12 cm mai joasă, podeaua cu 10 cm mai sus) are baia și dormitorul. Carcasa e un
material propriu, gri (cu `emissive` diferit de zero, ca `genv.js` să nu o treacă printre lucrurile luminate seara). Fațada e o
singură formă plană cu golurile ușii și vitrajului tăiate ca niște crestături (golurile trec de tăietura acoperișului, deci nu pot fi
„găuri” într-o formă). Partea de deasupra tăieturii (`YC`) e în grupul acoperișului, cu seturi `fadeSet`. Camerele: Living,
Bucătărie, Baie, Dormitor (în această ordine sunt și imaginile `ai`).

**Datele casei.** T6 nu e în catalogul paginii (`window.CAT`), așa că rândul ei din `CASE` are `date: { s, sn, d, a, l, t, p }`;
`garden.js` ia datele cu `catOf(c)` = catalog sau `c.date`. Butonul „Fotografii” (care deschide fișa din catalog) apare doar la
casele din catalog (`inCat`).

**Grădina mărită.** `GRADINA = { latime: 64, adancime: 98, centruZ: 5, intrareZ: 54, straturiNoi }` (înainte 72 / −8 / 28): gardul
din spate a rămas la z = −44, cel din față s-a mutat de la 28 la 54. În `genv.js`:
- generatorul de numere „la întâmplare” e unul singur, cu sămânță fixă; ca partea veche să rămână exact la fel, după gardul viu
  (acum mai lung) sămânța e readusă la valoarea pe care o avea în grădina veche, iar tot ce e nou (aleea de la poarta nouă, aleile
  caselor din partea nouă, straturile, tufele și copacii din față) își ia numerele din șirul separat `extra(() => …)`. S-a verificat
  că valorile seminței după alei, straturi și copaci sunt aceleași ca înainte (1891905295 / 273289321 / 926850888 / 394009525);
- `VECHI = { ez: 28, gz: -8 }` ține locul porții și mijlocul vechi: aleea veche, straturile de lângă vechiul gard din față, lampa din
  spatele rondului și cercurile de copaci din afara gardului se așază după ele, nu după grădina nouă;
- curtea de asfalt și stâlpii porții se mută odată cu poarta.
Vederea cu toată grădina (`view()` în `garden.js`): `L = { tz: GZ + 10, el: 31, fw: 82, fh: 58 }`, `P = { tz: GZ + 10, el: 50, fw: 50,
fh: 84 }`; camera e cu ~13% mai departe pe ecran lat, la fel de departe pe telefon. Umbrele acoperă acum ±60 m (`half: 60`).

**Alte schimbări din aceeași trecere.**
- `isLong(s)` = casă de cel puțin 1,5 ori mai lată decât adâncă: doar acelea se privesc „din lateral” pe ecran înalt (T6, aproape
  pătrată, se vede din față, ca V3). Casele vechi au rămas cu aceleași locuri ale camerei (verificat cu `__gradina.views()`).
- Indiciul „Apasă pe o casă…” stă acum jos, deasupra barei cu case, pe orice ecran (sus acoperea eticheta casei din fundul grădinii).
- Până apare scena, desenul nu mai adoarme (`awake` rămâne treaz cât `live` e fals): dacă imaginea reală nu venea, scena putea
  rămâne la „Se pregătește grădina…” până la prima atingere.
- `surse/ai360/vederi/capflat.js` citește ordinea caselor din `gradina-data.js` (nu mai are lista scrisă de mână).

**Imaginile reale** (toate făcute în aceeași zi; rețeta și nodurile: `surse/ai360/CITESTE.md`, partea a cincea): `gr_all`, `gr_all_p`
(grădina mărită), `gr_t6`, `gr_t6_p`, `pl_t6_1`, `t6_living`, `t6_bucatarie`, `t6_baie`, `t6_dormitor`, cadrele `img/gd/rot/t6/`.
`img/gd/gradina.webp` (imaginea de rezervă) e tăiată din `gr_all`. Copia dinainte: `versiuni/gradina-inainte-t6/`.

**De știut.** Rotirile caselor vechi nu arată T6 și partea nouă în fundal (au fost filmate înainte). Locul din stânga al părții noi
(−15,5 · 40) e liber, cu un strat de flori (`GRADINA.straturiNoi`).


## 20. Mișcare lină: filmarea de la deschidere și rotirea caselor (17 noiembrie 2026)

Clientul: „când deschizi site-ul, când ai de sus în jos… îmi place tot cum arată casa, dar numai că nu se mișcă lent deloc. Și chiar
și în grădina cu case, tot așa, unele case nu se mișcă lent deloc” („lent” = lin). Ce s-a găsit și ce s-a schimbat:

**Deschiderea** (`site/js/story.js`, obiectul `FILM` și `drawFilm`).
- Filmarea folosea un cadru din două: o treaptă a rotiței sărea ~10 cadre și se vedea sacadat. Acum sunt **toate cadrele**: 648
  (`site/img/st/film/f_0000.webp … f_0647.webp`, 41 MB; se refac cu `surse/ai360/vederi/fixpoveste.py`, comenzile sunt în capul lui).
  `FILM.T` spune ce bucăți are filmarea: [primul cadru, câte cadre, de unde începe în poveste, cât ține un cadru, …].
- Derularea era urmărită cu o netezire simplă, care dădea o smucitură la fiecare treaptă a rotiței. Acum e un **arc amortizat**
  (`FOLLOW = .34` s): viteza crește și scade lin.
- Imaginea **urmărește mereu derularea**: dacă exact cadrul cerut nu e încă încărcat, se arată cel mai apropiat care e (înainte
  aștepta cadrele unul după altul). Ca să existe mereu ceva aproape, din toată filmarea se țin copii mici („schița”, un cadru din
  6–8, lățime 320–480 px), încărcate primele, de la rare la dese. Cadrele mari se despachetează în jurul locului spre care merge
  derularea și se eliberează cele rămase departe. Două cadre vecine se amestecă doar dacă sunt aproape; la oprire rămâne un singur
  cadru, clar. Pe telefoane se încarcă un cadru din două (`SKIP = 2`), ca să nu coste date.
- Când filmarea acoperă tot ecranul, macheta 3D de dedesubt nu se mai calculează (acoperiș, straturi, umbre).
- Măsurat cu `tools`-ul de probă din sesiune (derulare cu rotița, 100 px la 110 ms): imaginea rămâne la cel mult un cadru de
  locul cerut la 20 Mbps și fără limită; la 8 Mbps, pe ecran îngust, cel mult 5 cadre pentru o clipă.

**Rotirea caselor** (`site/js/garden.js`, `spinPrep`, `spinFeed`, bucla de desen).
- Înainte, rotirea aștepta cadrele unul după altul („dacă netul nu ține pasul, rotirea așteaptă la ultimul cadru”) și le cerea abia
  după ce alegeai casa: pe o legătură obișnuită prima mișcare venea după 2–5 secunde și părea blocată. Acum poziția arătată e mereu
  cea a mâinii (`spin.pos = q`), iar pe ecran e cel mai apropiat cadru gata (căutat până la 64 de cadre în ambele părți); două
  cadre se amestecă doar dacă sunt vecine și mișcarea e înceată.
- „Schița” rotirii: copii mici (`SPW = 512` px) ale unui cadru din `SPK = 4`, ținute în memorie cât e aleasă casa. Ordinea
  cererilor: cadrele de lângă unghiul curent → schița din 16 în 16, din 8 în 8, din 4 în 4 → restul.
- `warmSpin()` (doar pe calculator, nu la „economisire date”): după ce grădina a apărut, aduce în memoria navigatorului, pentru
  fiecare casă, cadrele din jurul vederii ei și un cadru din opt. La 6 Mbps prima mișcare vine acum în 0,2–2 s.
- **„Golul” lui X7.** Filmarea lui X7 nu are imagini bune pe ~50° în spatele casei (cadrele 191 → 26 erau copii ale celor două
  capete), deci acolo rotirea părea înțepenită, apoi sărea. Acum, în `ROTIRI.X7`, `gol: [191, 26]` spune unde e porțiunea, iar
  pagina: nu mai cere copiile; trece prin gol de ~7 ori mai repede decât trage mâna (`GOLW = 4` cadre de tras, `spinDrag`), restul
  turului mergând cu 12% mai încet, ca un tur complet să rămână 360° de tras; pe ecran un capăt se topește în celălalt; la oprire
  nu rămâne niciodată în mijlocul golului. Se scoate (`gol`) când se reface filmarea lui X7.
- Verificări (în folderul de lucru al sesiunii, nu în proiect): rotire completă trasă încet la X7 în ambele sensuri (macheta nu
  se vede, golul ține ~15 px de tras), rotire la 6 și 20 Mbps (fără pași înapoi), vederile fără rotire rămân pe loc, trecerile
  dintre vederi, mersul prin case.

## 21. Casa C20, grădina la ferestrele lui X7, scaunul din E7 (17 noiembrie 2026)

**Casa C20** (extensibilă, 20 ft; a doua casă comandată de client). `site/js/h_c20.js`: miez de 2,2 m cu ramă neagră și două aripi
cu acoperiș înclinat; pereții dinăuntru sunt după planul din ofertă (peretele dormitoarelor la x = 0,62, în interiorul miezului;
dormitoare inegale; baia de 1,39 m). Material propriu pentru panourile maro (`lemn`, cu `emissive` diferit de zero) și pentru
pardoseală (`podea`, cu lumină proprie constantă: materialele proprii nu primesc lumina de interior a celor comune, iar fără ea
pardoseala ieșea aproape neagră în capturile 360°). Fiindcă pardoseala nu e `M.floor`, pagina își ia înălțimea podelei din punctul
camerei: toate camerele au `y = pardoseala + 1,1`. În grădină stă pe locul din stânga al părții noi (−15,5 · 40, rot 30), în locul
stratului cu flori; datele ei sunt în rândul `date` (ca la T6). Are toate imaginile reale (vedere lată + de telefon, plan, cinci
camere, rotire): `VEDERI.C20`, `PLANURI.C20`, `ROTIRI.C20`, `ai: [...]`. `surse/ai360/c20/pune_c20.py` o pune / o scoate din
`gradina-data.js` (a fost ținută afară cât nu avea imagini, ca să nu se vadă macheta).

**X7: grădina la ferestre.** `CASE[X7].pano.gradina = ['living', 'masa', 'blat', 'dorm']`: pentru aceste puncte `panoUrl` (în
`garden.js`) ia fotografia din `img/gd/x7/` (copie a fotografiei reale în care doar ce e dincolo de geam e schimbat cu AI), ziua;
seara și baia rămân pe `p360/`. Punctele poartă `g: true`; fișa casei scrie „Fotografii reale 360° din showroom · grădina de la
ferestre e adăugată cu AI”, iar mențiunea mică de pe imagine (`.gd-ai`) își schimbă textul după ce e pe ecran (`pAI`: 1 = imagine
făcută cu AI, 2 = fotografie reală cu grădina adăugată). Turul 360° (secțiunea 05) folosește în continuare `p360/` neschimbat.
Cum s-au făcut copiile: `surse/ai360/CITESTE.md`, partea a șasea, și `surse/ai360/x7_geamuri/`.

**E7.** Scaunul care intra în corpul de bucătărie a fost scos din `e7_living.webp` și `e7_bucatarie.webp` printr-un retuș pe
bucăți (`surse/ai360/retus/`).

**De știut la probe.** Imediat după încărcare, pe calculatorul de probă (fără placă video) pagina desenează foarte rar (filmarea de
la deschidere și rotirile își aduc cadrele din timp): o probă care intră într-o casă trebuie să aștepte până când `state.pOp`,
`state.bl` și `state.wk` ajung la 1 (au fost adăugate în `__gradina.state`), nu un număr fix de secunde.

## 22. Filmul comprimat: imagine mare și în mișcare (17 noiembrie 2026, după-amiază)

Clientul (cu un filmuleț al ecranului): „când dai în jos, de sus, când deschizi site-ul, nu se mișcă destul de lin… Și când vrei să
miști capsula 360, parcă își pierde din calitate… la toate casele… și pe fundal”. Ce se vedea în filmuleț: cât stă pe loc, imaginea
de 3840 px; la rotire, pozele mici (1024 px) sau „schița” (512 px) întinse pe tot ecranul, uneori două cadre amestecate (imagine
dublă). Ce s-a măsurat: despachetarea unui cadru cu `createImageBitmap(<img>)` se face, în Chrome, **pe firul principal** (~13 ms pe
cadru pe mașina de probă): la o derulare a poveștii, 91 de blocări de peste 50 ms (6,3 s din 15). Cu `createImageBitmap(blob)` se
face în afara lui.

**Ce s-a schimbat.**
- `site/js/clip.js` + `site/js/clip-worker.js` — „filmul comprimat”. Aceleași cadre, la **1920×1080**, într-un film AV1 tăiat în
  bucăți (`h_00.bin …`, câte 16 cadre la rotiri și 24 la deschidere; un cadru-cheie la 8 cadre) plus un film mic (`lo.bin`, 640 px).
  O rotire are ≈ 11 MB (înainte: 8 MB de poze de 1024 px + 13 MB de cadre mari); deschiderea 28 MB (înainte 39 MB la 1280 px).
  Fișierele: `site/img/gd/rot/<casă>/v/` și `site/img/st/film/v/`; le scrie `surse/ai360/vederi/faclip.py` (formatul e în capul lui).
- Firul separat aduce bucățile (întâi cele de lângă locul curent), desface grupurile de cadre cu WebCodecs (`VideoDecoder`, AV1, în
  procesor: `prefer-software`, la fel pe orice calculator) și **ține cadrele desfăcute la el**, în forma compactă (YUV). Pagina cere
  ca imagine doar cadrele pe care le arată: cel sub care va fi „mâna” când sosește imaginea (ținta se mută în față cu întârzierea
  măsurată, `lat`), următorul pe drum și cel de aici; ține doar câteva imagini (puțină memorie video). `c.want(poziție, viteză,
  cadrele de pe ecran)` se cheamă la fiecare cadru desenat, `c.pick(poziție)` spune ce se arată.
- Ce se arată: cadrul mare cel mai apropiat de poziție. Cadrul mic (`lo`) apare doar cât bucata mare de acolo **nu a sosit din rețea**;
  dacă a sosit, se așteaptă cadrul mare (câteva sutimi de secundă) cu cel mare de alături pe ecran. Două cadre vecine se topesc unul
  în altul doar la mișcare foarte lentă (sub `SLOWMIX = 14` cadre pe secundă) și doar pe mijlocul drumului dintre ele; altfel e mereu
  un singur cadru, clar.
- Unde nu merge (navigator fără WebCodecs sau fără AV1 în procesor: Safari; orice eroare pe parcurs), `state` devine `'off'` și se
  folosesc **pozele separate**, ca înainte (`s_*.webp`, `f_*.webp`), aduse acum ca Blob și despachetate în afara firului principal.
  Telefoanele și tabletele rămân pe poze (filmul comprimat se deschide doar cu mouse: `(hover:hover) and (pointer:fine)`).
- Calculator fără placă video (desenul în procesor; și mașina de probă): transformarea cadrului în imagine se face pe firul separat,
  la jumătate de mărime (`soft`), ca să nu se înfunde desenul paginii. `window.__clipSoft = true / false` alege cu mâna.
- Când rotirea se oprește, vine ca înainte cadrul mare de oprire (`l_*.webp`), acum de **2560 px**.
- Cât secțiunea nu e pe ecran, cadrele desfăcute se eliberează (`c.rest()`); la casa următoare clipul vechi se închide.
- `warmSpin()` aduce din timp, pentru fiecare casă, filmul mic și bucățile din jurul vederii (un sfert de tur). La deschidere, restul
  filmului se aduce în fundal abia după ce pagina s-a încărcat (și nu la „economisire date”).

- **Ordinea pe o legătură înceată** (probat la 4 Mbps): ce e pe ecran are întâietate. Filmul unei case se deschide în bucla de
  desen abia când imaginea vederii e gata (`spin.pend`; cel mult două secunde de așteptare); firul separat aduce întâi bucata de la
  unghiul vederii, singură, apoi filmul mic, singur, apoi restul câte trei; restul rotirii vine în fundal doar după ce imaginea e pe
  ecran sau vizitatorul a început să rotească (`all`); `warm()` și `warmSpin()` așteaptă cât `hungry()` (imaginea de pe ecran încă se
  încarcă). Înainte de asta, la 4 Mbps imaginea casei apărea după ~30 s; acum după ~5 s, iar rotirea e gata la ~3 s.
- Plasă de siguranță: dacă grupul de la unghiul curent e desfăcut de 6 secunde și tot nu a venit nicio imagine, sau trei cereri de
  imagine la rând sunt refuzate, clipul se închide (`why` spune de ce; în `__gradina.state.spin.why`) și rămân pozele separate.

**Sursele.** Toate filmările (7 rotiri, 4 bucăți ale deschiderii) au fost trecute prin Topaz („Rhea”, 4K): margini mai clare, fără
detalii inventate. Rotirile lui X7 și T7 au fost refăcute din locul vederii, în grădina de acum (X7: fără „gol”, codul golului a fost
scos; T7: fără dungile maronii de pe gazon). Detalii, noduri și credite: `surse/ai360/CITESTE.md`, partea a șaptea.

**Cum se reface.** `python3 surse/ai360/vederi/farotire.py <casă> <filmare.mp4> [--mici]` (filmul comprimat + cadrele de oprire +,
la cerere, pozele mici); pentru deschidere `cadrepoveste.py` apoi `faclip.py … --seg 24`. Apoi se mărește `v` în `ROTIRI` (respectiv
`FILM.v` în `story.js`).

**De știut la probe.**
- `node --check fisier.js` **nu** prinde greșelile de sintaxă din modulele paginii (le citește ca scripturi obișnuite și trece mai
  departe): se copiază fișierul cu extensia `.mjs` și se verifică acela.
- Starea de probă: `__gradina.state.spin.vc` și `__story.film.vc` (`state`, `soft`, `lat` = întârzierea măsurată în ms, `gms` = cât
  durează desfăcutul unui grup, `hi` = câte imagini mari ține pagina, `dec` = câte grupuri sunt desfăcute, `seg` = câte bucăți au sosit).
- Pe mașina de probă (4 procesoare, fără placă video) un grup de cadre se desface în 110–180 ms (pe un calculator obișnuit, de
  câteva ori mai repede), deci la derulare rapidă imaginea rămâne în urmă acolo; la derulare normală urmărește la sub un cadru.
  Măsurat la aceeași derulare a poveștii: varianta veche 91 de blocări ale firului principal (6,3 s), cea nouă niciuna.

## 23. Telefonul: poza casei întâi, pachete mici, cadre tăiate (17 noiembrie 2026, seara)

Clientul (filmuleț al ecranului de pe un telefon Android, navigatorul Brave): „am deschis pe telefon, vezi și singur, nu merge
deloc bine”. Ce se vedea, cadru cu cadru (filmulețul are un cadru la fiecare schimbare a ecranului, deci pauzele se pot măsura):
- în grădină, după ce alegi o casă, fișa se schimbă, dar poza rămâne cea veche: 2 secunde la C20; la M9, V3, E7, T7, apăsate
  una după alta, poza nu s-a mai schimbat deloc;
- rotirea pornește în salturi (pauze de 100–340 ms în prima secundă), iar cadrele din mișcare sunt mai șterse decât imaginea de pe loc;
- la deschidere, multe cadre sunt șterse (copia de 320 px întinsă pe tot ecranul) și filmarea rămâne în urma degetului;
- după ce bara navigatorului se ascunde, sub partea fixă a deschiderii rămâne o dungă închisă.

**De ce.** Pe telefon (ca pe orice ecran cu atingere) nu se folosește filmul comprimat, ci pozele separate. La alegerea unei case
se cereau deodată: imaginea vederii la 4K (1–1,3 MB), 44 de cadre ale rotirii (16 în paralel, ~1,8 MB) și fotografia primei
camere; la prima rotire, toate cele 192 de cadre. Cererile unei case nu se opreau când alegeai alta. La deschidere, fiecare cadru
era poza întreagă de 1280 px (62 KB), din care pe telefon se vede jumătate și care era oricum micșorată la 960 px. Dunga: partea
fixă are `100svh`, iar fereastra crește când se ascund barele; dedesubt se vedea fundalul secțiunii (`#0c1326`).

**Ce s-a schimbat.**
- *Imaginile vederilor.* `site/img/gd/ai/m/` ține copii la jumătate de mărime ale imaginilor `gr_*` și `pl_*` (le scrie
  `surse/ai360/vederi/famedii.py`; 7,4 MB în loc de 29,5 MB). `panoUrl()` le alege când `lite()` (fereastră sub 800 px): pânza
  grădinii are acolo cel mult ~1300 px. `warm()` (adusul din timp al imaginilor celorlalte case) merge acum și pe ecran mic; locul
  din care se va vedea fiecare casă se socotește cu spațiul liber de atunci (`pvIn`), nu cu cel de acum.
- *Ordinea.* `spin.pend` (deschiderea rotirii abia după ce imaginea vederii e gata) e acum pentru orice navigator, nu doar pentru
  filmul comprimat; pe ecranele cu atingere așteaptă cel mult 5 secunde. `extLoad()`, `enter()`, `leave()` și `room()` pun `hungryT`
  chiar în clipa apăsării (nu se mai bazează pe bucla de desen). Fotografia primei camere (`roomPre`) se cere după ce imaginea
  vederii e pe ecran, acum pentru toate casele (înainte doar la X7). Cererile cadrelor au `AbortController` (`spin.ac`): la altă
  casă se opresc. Cât vizitatorul e în casă sau la toată grădina, nu se mai cer cadre, iar cele desfăcute se eliberează (`spinRest`).
- *Pachetul mic al rotirii.* `site/img/gd/rot/<casă>/p.bin` (`p` în `ROTIRI`): 96 de cadre (cele cu număr par) la 768×432, WebP,
  într-un singur fișier de 1,6–2,2 MB. Formatul („CPP2”) e în capul lui `farotire.py`: fiecare cadru are numărul lui, iar cadrele
  stau **de la rare la dese** (întâi câte unul din 16 de jur împrejur, apoi din 8, din 4, din 2; în fiecare treaptă, de la locul
  vederii în ambele părți). Pagina îl citește pe măsură ce sosește (`fetch` + `getReader`): după primele ~200 KB are deja 12 cadre
  de jur împrejur. Cadrele rămân ca `Blob` (comprimate) și se desfac doar într-o fereastră în jurul locului curent (`lowDec`,
  `spin.px`); câte unul din 16 rămâne mereu desfăcut. Cât vine pachetul nu se cere nimic altceva; apoi pozele `s_*.webp` (1024 px),
  cele mai apropiate de locul curent întâi, câte 6 deodată pe telefon (12 pe calculator); tot turul casei alese se aduce în fundal
  (nu la „economisire date” sau pe 2G/3G: acolo doar câteva, iar restul la prima rotire).
- *Ce se arată la rotire* (`spin.tier`): încet sau pe loc, cadrul clar de la unghiul curent, dacă e gata. În mișcare: cadre din
  pachet până când cele clare sunt desfăcute pe o bucată în față (cât parcurge rotirea în ~0,15 s), apoi doar clare; dacă lipsește
  cadrul clar, se trece înapoi la pachet. Așa nu alternează cadre clare cu cadre mai mici. La oprire vine, ca înainte, cadrul mare
  (`l_*.webp`); cât e pe drum, se mai cer doar cadrul de aici și vecinii lui.
- *Pozele mici.* `s_*.webp` ale caselor E7, V3, M9, T6 și C20 au fost refăcute din filmările trecute prin Topaz (X7 și T7 erau deja).
- *Deschiderea pe telefon.* `site/img/st/film/t/` (le scrie `surse/ai360/vederi/fafilmtel.py`): `f_NNNN.webp`, un cadru din două,
  **tăiat** la partea din jurul capsulei (de la x = 614 din 1920 până la marginea din dreapta), 726×600, ~29 KB; `p_NN.bin`, 12
  pachete mici („CPP1”) cu toate cadrele cu număr par la 363×300 (27 pe pachet, ~220 KB). În `story.js`: `FILM.tel` și `SETS`
  (0 = pozele întregi, 1 = cele pentru telefon); `telSet()` alege setul 1 pe ecran cu atingere, îngust (sub 700 px), când din
  lățimea cadrului se vede cel mult `fmax = .7`; la desen, cadrul tăiat e pus la locul lui (`sx`, `sw_`). Dacă felul ecranului se
  schimbă (telefon întors pe lat), `filmInit()` o ia de la capăt cu celălalt set. Pachetele au întâietate: cât lipsește cel de la
  locul curent nu se cere niciun cadru clar (în afară de prima imagine a paginii), cât lipsește următorul, unul singur, cât lipsește
  al treilea, cel mult trei; pachetele depărtate vin abia când nu mai e niciun cadru clar de adus. Cât povestea nu e pe ecran,
  nu se mai cere nimic (`filmVis`). Aceeași regulă de afișare ca la rotire (`film.tier`).
  Pe tablete și în navigatoarele de calculator fără film comprimat rămân pozele întregi (`f_*.webp`, refăcute și ele din cadrele
  mai clare), cu schița ca înainte.
- *Derularea.* `progress()` se măsoară față de înălțimea părții fixe (`pin.offsetHeight`), nu a ferestrei (care pe telefon se
  schimbă când se ascunde bara). Pe ecranele cu atingere imaginea urmărește derularea mai strâns (`FOLLOW = .16` s; pe calculator
  a rămas .34).
- *Dunga de jos.* `#top.st{background:var(--st-edge,#0c1326)}`; `story.js` pune `--st-edge` = culoarea de jos a părții fixe.

**Măsurat** (Chromium cu ecran de telefon 360×664, legătura limitată la 6 Mbps cu 80 ms întârziere; varianta veche → cea nouă):
- poza casei alese, de la apăsare până la sosirea din rețea: 14 s → ~1 s (0 dacă fusese adusă din timp);
- deschiderea, derulată cu 40 de cadre de film pe secundă: decalaj mediu față de deget 4,8 cadre → 0,6; salturi de peste 6 cadre:
  20 → 0; date aduse: 16 MB → 12 MB. La 12 Mbps și peste, toate cadrele sunt cele clare; la 6 Mbps, cam o cincime sunt din pachete;
- rotirea trasă la 0,3 s după ce apare casa, la 3 Mbps: înainte stătea pe primul cadru până sosea ceva; acum urmărește degetul de
  la început (decalaj mediu ~1 cadru), cu cadre din pachet, apoi clare.

**De știut la probe.**
- Calculatorul de probă desenează în procesor: o trecere de imagine (care pe un telefon durează 0,4 s) ține acolo secunde, iar
  la mărimea de tabletă un singur cadru poate dura zeci de secunde. Timpii „până apare pe ecran” nu se pot judeca aici; se
  măsoară când sosește fișierul din rețea și ce cadru e arătat la fiecare desen.
- `tools/test_telefon_deschidere.js [Mbps] [cadre de film pe secundă]`, `tools/test_telefon_poza.js [Mbps] [casă] [lățime] [înălțime]`
  și `tools/test_telefon_rotire.js [Mbps] [casă] [px pe secundă]` (cu serverul local pornit; `PORT`, `PAGE` din mediu). Rotirea e
  trasă cu evenimente de atingere trimise din pagină, după ceas (cele trimise din afară se pierd când navigatorul e ocupat).
- Starea de probă: `__gradina.state.img` (imaginea vederii e gata), `.spin.pk` (1 = pachetul vine, 2 = a venit), `.spin.lo` /
  `.spin.nl` (cadre din pachet sosite / desfăcute), `.spin.tier`; `__story.film.set`, `.tier`, `.lo`, `.nl`.
- **Nu s-a putut proba pe un telefon adevărat.** Ce nu se vede în aceste probe: cât de repede desenează un telefon și câtă memorie
  are. Dacă apar probleme acolo, primul lucru de cerut e un filmuleț nou și ce telefon / ce internet a folosit clientul.
