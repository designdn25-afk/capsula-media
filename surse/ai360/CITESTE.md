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

## Unde s-a ajuns (15 nov 2026)
Făcută și pusă pe site: **X7, ecran lat** (`gr_x7`). Creditele ElevenLabs s-au terminat (au rămas 270 din 50.254), așa că restul de
11 sunt doar pregătite în fluxul „Gradina cu case - vizualizare reala” (`yUzMp1srSOsKx9pUwTk2`), cu referința și cererea puse, nepornite.
Când sunt credite (~25.000), se pornesc dintr-o singură comandă (`creative_run_flow_nodes`, `generations_count: 1`):

| imagine | nod | proporție |
|---|---|---|
| gr_all | WdXp0s4IkSxfV22RbJLw | 5:4 |
| gr_all_p | Db4atERiuIjrOWTiUTao | 2:3 |
| gr_x7_p | UmRKiNBhhAH3aqg1Ljp6 | 4:3 |
| gr_t7 | tz3zv44F6xiD3KsA5qKT | 16:9 |
| gr_t7_p | RDC6yKIHJnjQJTF0IA57 | 4:3 |
| gr_e7 | m8M5dCSKeWKQyBkH4LSV | 16:9 |
| gr_e7_p | 5gWaQpHTQQDz9kLyExQ4 | 3:2 |
| gr_v3 | aeBBNlEYb3WSqapcynaN | 16:9 |
| gr_v3_p | BLLbs1qzQaVhBIdmWirs | 1:1 |
| gr_m9 | 39TOwIYaJJlZL3XmmPjp | 16:9 |
| gr_m9_p | WAU18cayCsL06NKzyqWO | 4:5 |

În același flux au rămas 12 noduri mai vechi („… afara - real”, cu surse 360°): **nu se pornesc** (metoda abandonată; două au fost
rulate ca probă și nu s-au folosit).

**Higgsfield** (cerut de client): conectorul din Claude poate doar să citească din cont (modele, imaginile făcute, credite), nu poate
genera și nu poate urca imagini. Clientul are abonament Ultra, cu „Nano Banana Pro” (același model) nelimitat: dacă generează el acolo
cu sursele și cererile de mai sus, imaginile se pot lua cu `show_generations` și se pun pe site cu `fixflat.py`.
