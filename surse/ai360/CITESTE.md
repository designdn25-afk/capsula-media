# Vizualizări „reale” făcute cu AI: interiorul caselor (360°) și vederile din afară

Clientul a cerut (14 nov 2026) ca interiorul caselor din grădină să arate real, „ca în al doilea filmuleț” (o animație 3D simplă
trecută printr-un generator cu inteligență artificială). Aici sunt sursele și pașii. X7 nu e aici: are fotografii reale.

## Ce e în folder
- `<casă>_<cameră>_src.jpg` — imaginea 360° (4096×2048) a machetei, din punctul în care stă vizitatorul în camera respectivă.
- `captura-360.html` — pagina care scoate o astfel de imagine (copie a `site/_t_pano.html`; se pune în `site/` ca să meargă).
- `cap360.js` — o deschide cu Playwright și salvează imaginea: `node cap360.js iesire.jpg 4096 "x=..&y=..&z=..&face=1536"`.
- `fix360.py` — aduce imaginea primită de la generator la 4096×2048 și potrivește marginile din stânga și din dreapta.

## Pașii
1. Punctele (în coordonatele lumii) se citesc din pagină: `__gradina.H[i].walk.pts` după ce intri în casa `i`.
   Imaginea se scoate cu centrul spre −Z și fără rotire, de aceea în `garden.js` aceste puncte au `H = −rotirea casei`.
2. Imaginea-sursă trebuie să fie la o adresă publică (a fost urcată temporar pe ramura `gh-pages`, în `img/gd/src/`; următoarea
   publicare a site-ului o șterge de acolo).
3. În ElevenLabs (conectorul din Claude): se atașează imaginea ca referință și se rulează un nod „image-generation” cu modelul
   `gemini-3-pro-image`, `aspect_ratio: auto`, `resolution: 4K`, o singură variantă (~2.270 de credite, ~0,45 $ pe imagine).
   Cererea: „fă din această machetă 3D o fotografie realistă; e o panoramă echirectangulară 360°: păstrează proiecția, poziția
   camerei, orizontul, geometria, golurile și mobila în aceleași locuri; marginile din stânga și din dreapta trebuie să se lege”
   + descrierea camerei (ce se vede în machetă) + „fără oameni, text, logo-uri sau mobilă în plus”.
4. Rezultatul vine 16:9 (5504×3072); `fix360.py` îl readuce la 2:1 și netezește cusătura. Fișierul final: `site/img/gd/ai/<nume>.webp`.
5. Numele se trec în `site/js/gradina-data.js`, în lista `ai` a casei, **în ordinea camerelor din model**.

Descărcarea rezultatelor se face de pe `elevenlabsusercontent.com`; mediul de lucru „capsula-media” are această adresă permisă.
Seara, în casele cu imagini AI se vede macheta 3D (imaginile sunt doar de zi).


# Vederile din afară (15 nov 2026)

Clientul a cerut ca și grădina văzută de sus, și fiecare casă văzută din afară să arate real („dacă te uiți pe geam tot arată
pătrățos”), cu hale în jur, „să vadă că suntem în România, în Ciorogârla”. Aici imaginea **nu** e 360°: e o „fotografie” obișnuită,
făcută exact din locul în care stă camera pe site, pe care pagina o așază peste scena 3D (etichetele și apăsatul pe case rămân
ale scenei 3D). O primă încercare cu imagini 360° n-a mers: generatorul a recompus cadrul și casele nu mai erau la locul lor.

## Ce e în `vederi/`
- `locuri.json` — locurile camerei, citite din pagină cu `__gradina.views()` (pentru fiecare vedere: ecran lat `pv 0` și ecran înalt `pv 1`).
- `rects.py` — calculează cât trebuie să cuprindă fiecare imagine ca să acopere ecranele obișnuite → `cadre_calc.json`.
- `capflat.js` + `captura-vedere.html` — scot imaginile-sursă (`gr_<casă>[_p]_src.jpg`) și scriu `cadre.json` (cadru, proporție, mărime).
- `fixflat.py` — potrivește imaginea primită de la generator peste sursă (dacă a mișcat puțin cadrul) și o salvează pentru site:
  `python3 fixflat.py gr_x7_src.jpg generat.png ../../../site/img/gd/ai/gr_x7.webp 3840` (3840 = latura mare; pentru cele de telefon, 2880).

## Pașii
1. `python3 rects.py`, apoi `node capflat.js` (cu serverul local pornit și `captura-vedere.html` copiat în `site/_t_flat.html`).
2. Sursele se urcă la o adresă publică (temporar pe `gh-pages`, în `img/gd/src/fl-*.jpg`; următoarea publicare le șterge).
3. În ElevenLabs: referința + nod „image-generation”, `gemini-3-pro-image`, `resolution: 4K`, `aspect_ratio` = proporția din `cadre.json`,
   o singură variantă (~2.270 de credite). Cererea: „fă din această machetă 3D o fotografie de arhitectură realistă; păstrează exact
   poziția camerei, cadrul, perspectiva și compoziția, fiecare clădire, alee, lampă, copac la același loc și aceeași mărime (rezultatul
   se suprapune peste referință); nu muta, nu adăuga, nu schimba clădiri” + descrierea casei + „parc industrial pe câmpia de lângă
   București, hale cu panouri gri-alb și dungă albastră, orizont plat, gazon real, lumină de dimineață; fără oameni, mașini, text”.
4. `fixflat.py`, apoi rândul din `VEDERI` (în `site/js/gradina-data.js`): `[fișier, stânga, dreapta, jos, sus]` cu cifrele din `cadre.json`.
   Unde lipsește o imagine (`null`), se vede macheta 3D. Seara se vede mereu macheta.

## Unde s-a ajuns (16 nov 2026)
Clientul a pus credite la ElevenLabs („gata, verifică acum”) după ce a cerut: „vreau să-mi faci toată grădina să arate așa” (ca vederea
reală a lui X7). **Toate cele 12 vederi de zi sunt făcute și puse pe site** (`VEDERI` complet: `gr_all`, `gr_x7`, `gr_t7`, `gr_e7`,
`gr_v3`, `gr_m9` și perechile lor `_p` pentru ecran înalt). Nodurile din flux (pentru refaceri):

| imagine | nod | proporție |
|---|---|---|
| gr_all | WdXp0s4IkSxfV22RbJLw | 5:4 |
| gr_all_p | Db4atERiuIjrOWTiUTao | 2:3 |
| gr_x7 | Rga4CczKuD3XXHyWSCbR | 16:9 |
| gr_x7_p | UmRKiNBhhAH3aqg1Ljp6 | 4:3 |
| gr_t7 | tz3zv44F6xiD3KsA5qKT | 16:9 |
| gr_t7_p | RDC6yKIHJnjQJTF0IA57 | 4:3 |
| gr_e7 | m8M5dCSKeWKQyBkH4LSV | 16:9 |
| gr_e7_p | 5gWaQpHTQQDz9kLyExQ4 | 3:2 |
| gr_v3 | aeBBNlEYb3WSqapcynaN | 16:9 |
| gr_v3_p | BLLbs1qzQaVhBIdmWirs | 1:1 |
| gr_m9 | 39TOwIYaJJlZL3XmmPjp | 16:9 |
| gr_m9_p | WAU18cayCsL06NKzyqWO | 4:5 |

**Ce s-a învățat la generare:** cu aceeași cerere, generatorul scoate uneori o fotografie adevărată (X7, grădina de sus, T7, E7 pe
telefon), alteori doar o machetă „lustruită” (iarbă și copaci ca în 3D). Pentru cele slabe se face un nod nou care primește **două
imagini**: sursa (machetă) și **imaginea reală a lui X7** ca model de aspect (~2.730 de credite). Cererea trebuie să spună apăsat că
**așezarea vine doar din prima imagine** (fiecare hală, copac, strat de flori, lampă la locul lui), iar din a doua se ia doar felul
în care arată iarba, frunzișul, piatra, cerul; altfel generatorul copiază și împrejurimile din poza lui X7 (așa a pățit prima
încercare la M9). `fixflat.py` arată câte puncte s-au potrivit: sub ~50 de potriviri înseamnă că împrejurimile au fost schimbate.

În același flux au rămas 12 noduri mai vechi („… afara - real”, cu surse 360°): **nu se pornesc** (metoda abandonată; două au fost
rulate ca probă și nu s-au folosit).

**Higgsfield** (cerut de client): conectorul din Claude poate doar să citească din cont (modele, imaginile făcute, credite), nu poate
genera și nu poate urca imagini. Pagina făcută atunci pentru el (pozele și textele de lipit în Higgsfield) nu mai e necesară:
https://claude.ai/artifact/5DRE5A9xasjCnU9aXFuMQR

# Rotirea „reală” în jurul caselor și vederile de seară (15 nov 2026, ziua)

Clientul a văzut vederea reală a lui X7 și i-a plăcut, dar: „când miști capsula 360 tot așa apare pătrățos… și pe zi și pe noapte”
(a trimis și un filmuleț: cât stă pe loc e poza reală, la rotire apare macheta 3D). Deci și rotirea, și seara trebuie să arate real.

## Cum funcționează pe site (gata, în `js/garden.js`)
- **Rotirea** (`ROTIRI` în `js/gradina-data.js`): pentru o casă există cadrele unei filmări care o ocolește complet pe cercul vederii
  ei (același centru, aceeași înălțime și distanță ca vederea din afară). Când vizitatorul trage de scenă, în locul machetei se arată
  cadrul cel mai apropiat de unghiul la care a ajuns (camera 3D sare la unghiul cadrului, deci totul rămâne potrivit). Cadrele mici
  (`s_000.webp…`, 1280 px) se încarcă din timp, de la rare la dese; când rotirea se oprește se cere cadrul mare (`l_…`, 1920 px).
  Cu rotire realistă camera nu mai revine singură la loc și nu se mai ridică/coboară. Fără cadre (`null`), se vede macheta, ca înainte.
  Pentru toată grădina (`all`) se poate pune doar un arc (`arc: 160`, cât se poate roti acolo).
- **Seara**: o vedere poate avea și imagine de seară (al șaselea element din rândul ei din `VEDERI`), iar o rotire poate avea și
  cadre de seară (`seara: 'folder'`). Fără ele, seara se vede macheta.

## Cum se fac cadrele unei rotiri
1. `node capspin.js x7 192 1920` (în `vederi/`; are nevoie de `captura-rotire.html` copiat în `site/_t_spin.html` și de serverul local):
   192 de cadre 1920×1080 ale machetei, pornind din spatele casei (unghiul vederii + 180°). Durează ~9 minute pe casă. Scrie și
   `info.json` (az0, cadrul). Pentru seară: al cincilea argument = ora (`node capspin.js x7 192 1920 0 19.9`). Pentru ecran înalt:
   al patrulea argument `1`. Cadrele sunt mari și multe: se țin în afara proiectului (`IESIRE=<folder>`).
2. `ffmpeg -framerate 24 -i rot_x7/f_%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 21 -movflags +faststart rot8-x7.mp4` (8 secunde).
   ElevenLabs taxează după numărul de cadre (24 pe secundă), deci mai multe cadre = mai scump; 192 e un compromis bun.
3. Filmarea se urcă la o adresă publică (temporar pe `gh-pages`, `img/gd/src/`) și se atașează în ElevenLabs; un nod „video-generation”
   cu un model de editare video primește **filmarea** și, ca referință, **imaginea reală a vederii** (ca aspectul să fie același).
   Cererea: „fă din această filmare 3D o filmare reală cu drona; păstrează exact traseul camerei, cadrul și viteza; fiecare clădire,
   alee, lampă, copac în același loc în fiecare cadru; potrivește aspectul cu fotografia de referință; fără neclaritate de mișcare”
   (textul întreg e în nodurile „ROTIRE X7 zi” din flux).
4. `python3 fixspin.py filmare-reala.mp4 ../../../site/img/gd/rot/x7 72` → 72 de cadre (din 5 în 5 grade), mici și mari.
5. Rândul din `ROTIRI`: `X7: [{ zi: 'x7', n: 72, az0: <az0 din info.json>, r: [cadrul din cadre.json] }, null]`.
   Mecanismul a fost probat cu cadrele machetei (X7, az0 122): merge, etichetele celorlalte case rămân la locul lor.

## Prețuri (estimări date de ElevenLabs pe 15 nov 2026, fără să se fi rulat nimic)
- Kling O3 Video Edit: ~815 credite pe secundă de filmare; filmarea de 8 s se taxează ca 10 s → **~8.150 pe rotire**, ~1,6 $.
- Kling 4.0 Video Edit, 1080p: ~1.370 credite pe secundă → **~13.700 pe rotire**, ~2,7 $.
- Seedance 2.5 Video Edit, 1080p: ~30.000 de credite pentru o probă de 4 secunde (prea scump).
- O imagine (zi sau seară), 4K: ~2.270 de credite.
Nimic din toate acestea nu s-a putut proba: contul ElevenLabs legat în Claude avea 0 credite (din 50.254). Întâi se probează o
singură rotire (X7) cu Kling O3 și, dacă nu e destul de bună, cu Kling 4; abia apoi restul caselor.

## Ce e pregătit în fluxul ElevenLabs „Gradina cu case - vizualizare reala” (`yUzMp1srSOsKx9pUwTk2`), nepornit
- ~~11 imagini de zi~~: făcute pe 16 nov 2026 (tabelul din partea a doua).
- **12 imagini de seară** (fiecare primește sursa de seară + imaginea de zi a aceleiași vederi, ca locul să arate la fel; deci se
  pornesc **după** imaginile de zi). Sursele: `vederi/gr_*_n_src.jpg`; cererile: `vederi/cereri.json`.

| imagine | nod |
|---|---|
| gr_all_n | NmvwjBkHWH2fDoOBZ4eC |
| gr_all_p_n | 1AFMquotMUZSjCjfC72M |
| gr_x7_n | GlNIWsOQIlzFdZRwrTJw |
| gr_x7_p_n | Eu9vflQmZTGZzydXQH0B |
| gr_t7_n | Se3BI8QD3Oi94tNMvARq |
| gr_t7_p_n | xYCFDFTRKjsBgsG3SGCz |
| gr_e7_n | oyGpp9JsI6YZ3FlDau1e |
| gr_e7_p_n | FhWuyeB2u4kzDxXL5d1U |
| gr_v3_n | u9960Siolrehn8SFep7A |
| gr_v3_p_n | MH3QW58IkukoKLkWjhEx |
| gr_m9_n | eQGUcX04PKEwFhFsWIgW |
| gr_m9_p_n | g0rxya8dqrhE49mJOewI |

  După descărcare: `fixflat.py` cu sursa de seară, apoi numele fișierului se adaugă ca al șaselea element în rândul vederii din `VEDERI`.
- **Rotirea X7, proba** (filmarea de 8 s, cu imaginea reală a lui X7 ca referință): **`uI69SqM6B14cKERVIcod`** (Kling O3, ~8.150
  credite) și, doar dacă prima nu e destul de bună, **`TvODuvG3eff1v3crrz9n`** (Kling 4, ~13.700). Nodurile mai vechi „ROTIRE X7 zi”
  (filmarea de 288 de cadre) și „proba 4s” au fost doar pentru estimarea prețului: **nu se pornesc**.
- **Filmările 3D ale celorlalte case** sunt deja atașate în flux (nu mai trebuie urcate): T7 `OScVVLsjG0YoZVJylusI`, E7
  `CAFUSu5rQaEmOL9s8q5O`, V3 `0EdU80lAjiT2nO27ISmY`, M9 `CJRhjOHLkgQZCo9JK1GB` (X7: `8XUP7obXZHWDERwtIbiU`). După probă se face pentru
  fiecare un nod ca al lui X7, cu modelul care a ieșit mai bine, legat la filmare și la imaginea de zi a casei (nodul ei din tabelul
  cu imaginile de zi; deci după ce imaginile de zi există). Unghiul de pornire și cadrul fiecărei rotiri: `vederi/rotiri.json`.
