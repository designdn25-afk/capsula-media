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

**Ce s-a învățat la generare (16 nov 2026):** cu cererea „păstrează totul exact, pixel cu pixel”, generatorul scoate uneori o
fotografie adevărată (X7, grădina de sus, T7), alteori doar o machetă „lustruită” (iarbă și copaci ca în 3D). Rețeta care a mers
pentru cele slabe („v4”, ~2.730 de credite, la 1K costă aproape la fel, deci se face direct la 4K):
- nodul primește **două imagini**: sursa (macheta) și **imaginea reală a lui X7** (`Rga4CczKuD3XXHyWSCbR`) ca țintă de calitate;
- cererea spune ce **rămâne exact** (camera, casele, platformele de piatră, aleile de dale, lămpile, conturul gardului viu și al
  straturilor, locul halelor) și ce se **re-fotografiază liber** (gazonul: „real mown turf with mowing stripes”; frunzișul copacilor,
  florile, pereții halelor, cerul, câmpia în loc de dealuri); „nu adăuga straturi, lămpi, alei care nu sunt în prima imagine”;
  „a doua imagine e doar ținta de calitate, nu copia casa, așezarea sau obiectele ei”.
- Dacă se cere prea strict („nu schimba nimic”), rămâne aspectul de machetă (E7 „v3”); dacă se lasă prea liber („potrivește gazonul,
  halele, cerul din a doua imagine”), copiază împrejurimile din poza lui X7 (M9 „v2”, păstrată totuși pe site: arată bine și în
  cadrul ei nu se vede altă casă).
- `fixflat.py` arată câte puncte s-au potrivit cu sursa: sute = cadrul e păstrat; sub ~30 = generatorul a recompus (de verificat cu ochii).
Refăcute așa și puse pe site: `gr_v3` (`2FFRoHGN59veEtifcMOy`), `gr_e7` (`TyBdwCZ5UTmb9HrNlYm3`), `gr_v3_p` (`y4IwjXaXIpufWuyG6NTM`; a
schimbat terasa de lemn în piatră cu mobilier, de refăcut dacă deranjează), `gr_m9_p` (`dyOuHfp3VWI1HaifoxEv`), `gr_m9`
(`zGGUmewWf5busm3HHgPj`, rețeta „v4”, pusă în locul variantei „v2” ca să aibă aceeași așezare ca macheta și ca rotirea ei). Au rămas doar „aproape reale”: `gr_x7_p` și `gr_t7_p` (telefon).

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

## Ce a ieșit la probe (16 nov 2026, după ce clientul a pus credite)
- **Kling O3 Video Edit** (`uI69SqM6B14cKERVIcod`, 8.144 credite): **nereușit**. A întors filmarea aproape neschimbată (tot machetă 3D).
  Cererea era plină de „păstrează exact / nu schimba nimic” și modelul n-a schimbat nimic. Nu se mai folosește.
- **Runway Aleph 2** (`4YNdcVsqsZcG3TfXQPXp`, 13.573 credite, 1920×1080, 192 de cadre): **reușit**. Gazon, hale, cer și interior reale,
  iar casa și grădina rămân pe traseul machetei cadru cu cadru. E mai „moale” decât imaginea fixă 4K, dar mult peste machetă.
  Cererea scurtă, de tip „restyle” (e în nod): „Restyle this 3D animation as photorealistic live-action drone footage of a real place,
  with the look of the reference photo: … Same camera movement …”. Primește filmarea 3D și imaginea reală a vederii.
- **Capcana lui Aleph:** pornește de la imaginea de referință. Rotirea lui X7 pornea din spatele casei, deci primele ~25 de cadre au
  ieșit greșite (casa văzută din față, trecând treptat la traseu) și pe peretele din spate a apărut o ușă. Pe site aceste cadre sunt
  ocolite (`EVITA=0-25` la `fixspin.py`: rotirea „stă” puțin în spatele casei). **De acum rotirea pornește din locul vederii**
  (`capspin.js` face asta implicit), ca primul cadru să fie chiar imaginea de referință.
- Clientul a văzut rotirea și a trimis alt filmuleț, de la T7 (care nu avea încă rotire reală): „când se mișcă imaginea, devine
  înapoi pătrățos, nu rămâne la fel de 3D și real”. Am vrut să scot din filmare copacii prin care trece camera; a spus clar:
  **„Lasă copacii.”** Deci copacii rămân în filmările rotirii, chiar dacă acoperă casa câteva grade.
- Pe site: **X7 are rotire reală** (ecran lat): `ROTIRI.X7 = [{ zi: 'x7', n: 72, az0: 122, r: [...] }, null]`, cadrele în
  `site/img/gd/rot/x7/` (3,9 MB cele mici, 9,2 MB cele mari).

## Ce urmează la rotire (când clientul spune să continui)
1. Filmările 3D pornite din locul vederii, pentru toate casele: `rot9-<casă>.mp4` (făcute pe 16 nov în folderul de lucru al sesiunii;
   se refac oricând cu `node capspin.js <casă> 192 1920`). Se urcă temporar pe `gh-pages` și se atașează în flux.
2. Pentru fiecare casă: nod `video-generation`, model `runway-aleph2`, legat la filmare (`video`) și la imaginea reală de zi a casei
   (`image`), cu cererea din nodul lui X7 și descrierea casei. ~13.600 de credite pe casă.
3. `python3 fixspin.py filmare.mp4 ../../../site/img/gd/rot/<casă> 72`, apoi rândul din `ROTIRI` cu `az0` din `info.json` (= unghiul vederii).
4. Opțional: X7 refăcut la fel (ca să dispară porțiunea „înghețată” din spate), rotiri pentru telefon (`capspin.js <casă> 192 1920 1`),
   rotiri de seară, un arc pentru toată grădina.

## Prețuri (16 nov 2026)
- Runway Aleph 2: **~13.600 de credite pe rotire** (8 s). Kling O3 Edit: ~8.150, dar nu transformă. Kling 4 Edit 1080p: ~13.700 (neprobat).
- O imagine 4K cu o referință: ~2.270; cu două referințe: ~2.730 (la 1K: ~2.440, deci nu merită coborâtă rezoluția).

## Ce e pregătit în fluxul ElevenLabs „Gradina cu case - vizualizare reala” (`yUzMp1srSOsKx9pUwTk2`), nepornit
- ~~11 imagini de zi~~: făcute pe 16 nov 2026 (tabelul din partea a doua).
- **12 imagini de seară** (fiecare primește sursa de seară + imaginea de zi a aceleiași vederi, ca locul să arate la fel). Atenție:
  nodurile de seară sunt legate la primele noduri de zi; pentru V3, E7, M9 imaginea de zi folosită pe site vine din nodurile „v4”
  (vezi partea a doua), deci nodul de seară trebuie legat la acela (sau făcut din nou) înainte de pornire. Sursele: `vederi/gr_*_n_src.jpg`; cererile: `vederi/cereri.json`.

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
- **Rotirile T7, E7, M9 (16 nov)**: filmări 3D pornite din locul vederii (`capspin.js`, az0 = unghiul vederii: T7 58, E7 4, V3 −66,
  M9 −30), trecute prin Runway Aleph 2 cu imaginea de zi a casei ca referință; bune de la primul cadru, fără `EVITA`. Noduri: E7
  `vuMso6SpPr1IjThalhUG`, T7 `nASV7ZSwyRPsQ9O1Wi9U`, M9 `okTRyEwlp1REDWShl65Y`. **V3 e pregătit, nepornit** (lipsă credite): nodul
  `50qiw4TNoMphOWRT69Ck` (filmarea `B9m5USznZq8Rdm9S0S2H` + imaginea `2FFRoHGN59veEtifcMOy`); după rulare: `fixspin.py … rot/v3 72` și
  rândul `V3: [{ zi: 'v3', n: 72, az0: -66, r: [-1.143, 0.811, -0.597, 0.503] }, null]` în `ROTIRI`. Filmările vechi (pornite din
  spate) de mai jos nu se folosesc cu Aleph. Copacii rămân în filmări (cererea clientului).
- **Rotirea X7**: făcută cu Runway Aleph 2 (vezi mai sus). Nodurile „ROTIRE … Kling …” și „proba 4s” **nu se mai pornesc**.
- **Filmările 3D ale celorlalte case** sunt deja atașate în flux (nu mai trebuie urcate): T7 `OScVVLsjG0YoZVJylusI`, E7
  `CAFUSu5rQaEmOL9s8q5O`, V3 `0EdU80lAjiT2nO27ISmY`, M9 `CJRhjOHLkgQZCo9JK1GB` (X7: `8XUP7obXZHWDERwtIbiU`). După probă se face pentru
  fiecare un nod ca al lui X7, cu modelul care a ieșit mai bine, legat la filmare și la imaginea de zi a casei (nodul ei din tabelul
  cu imaginile de zi; deci după ce imaginile de zi există). Unghiul de pornire și cadrul fiecărei rotiri: `vederi/rotiri.json`.

# Planul caselor ca imagine reală (16 nov 2026)
Vederea „Plan” (acoperișul ridicat) se face ca vederile din afară: `__gradina.views()` dă și locurile `<casă>#<nivel>`, `rects.py` le
calculează doar pentru ecran lat, `node capflat.js pl_t7_1 …` scoate sursele `pl_<casă>_<nivel>_src.jpg` (pagina de captură primește
`&open=<index casă>:<nivel>`), apoi generatorul (o referință, 4K, proporția din `cadre.json`, 2.272 credite) și `fixflat.py`. Rândul
merge în `PLANURI`. Cererea care a mers: „…a real house whose roof has been lifted off, so the furnished rooms are seen from above like
a real-life architectural cutaway model at full scale… do not put the roof back…” (nodurile `pl_* plan real` din flux).
Reușite: T7 `Xjy2htRyjjQ4ON447P3N`, E7 `K3gqnB6xn4njOTnkffQO`, M9 etaj `Zz5SUguBVAxxLrx5th2q` (casa a rămas puțin „desenată”).
Nereușite (aproape neschimbate, nefolosite): X7 `fa4nSEYMFzgqegjZnMpJ`, V3 `QL2dAnC7yskQhKt0hWg9` — de refăcut cu a doua referință
(planul reușit al lui T7, nodul de mai sus) ca țintă de calitate. M9 parter: sursa e atașată (`9ql03ssygXQf8zohvVjG`), fără nod.
Pregătite, nepornite (lipsă credite, 16 nov; ~2.730 fiecare, cu planul lui T7 ca a doua referință): X7 `kg8PiQbTdcwBLXHcvLOV`,
V3 `7MuJ0gpikxOq36BXpWuL`, M9 parter `39EutmhAJq0eaWONwb3k`. Rotirea V3: `50qiw4TNoMphOWRT69Ck` (13.573). Clientul a spus apoi
„vreau să faci totul real și lin” (inclusiv deschiderea site-ului): se pornesc cum apar credite.

# Partea a patra: deschiderea site-ului ca filmare reală (16 nov 2026)

Clientul: „și la început aici tot așa arată pătrățos și pe exterior și pe interior… vreau să faci totul real și lin”. Povestea 3D de
la deschidere (drumul camerei din `site/js/story.js`) a fost filmată în grădina realistă, în jurul capsulei X7 de acolo, apoi
transformată în filmare reală. Pe site se arată cadru cu cadru, după derulare (`FILM` în `story.js`).

## Unelte (în `vederi/`)
- `captura-poveste.html` (se copiază în `site/_t_story.html`) — desenează cadrul pentru derularea `p`, cu aceeași cameră ca povestea pe
  ecran lat 16:9. **Cheile camerei sunt copiate din `story.js`**: dacă se schimbă acolo, se schimbă și aici (și filmările se refac).
- `cappoveste.js <bucată 0…3> [cadre=192]` — filmează o bucată (de la o cheie la următoarea: derularea .03 → .205 → .38 → .55 → .715);
  `FROM=<cadru>` reia o filmare întreruptă; `proba` scoate câte un cadru din fiecare cheie. ~5–13 s pe cadru pe mașina de lucru
  (două deodată merg de două ori mai încet; un job în fundal e oprit după limita lui de timp: se reia cu `FROM`).
- `fixpoveste.py` — scrie cadrele pentru site (`site/img/st/film/f_0000…f_0384.webp`, 1280 px; primul cadru al fiecărei bucăți e
  imaginea-cheie mare, la 1920 px). Comenzile sunt în capul fișierului.

## Rețeta care a mers
1. **Imaginea-cheie reală a primului cadru** al fiecărei bucăți (Nano Banana Pro, 4K, 16:9, două referințe: cadrul 3D + o imagine
   reală ca țintă de calitate; ~2.730 de credite). Fără ea, Aleph nu are de la ce porni.
2. **Runway Aleph 2** pe filmarea 3D a bucății (8 s, 192 de cadre, 13.573 de credite), cu imaginea-cheie ca `image`.
   **Cererea are cel mult 1000 de caractere** (una mai lungă eșuează imediat). Cererile folosite sunt în nodurile din flux.
3. Aleph pornește mereu de la imaginea de referință, deci **primul cadru al filmării trebuie să fie chiar imaginea-cheie**. Pentru
   bucata de seară, imaginea bună era la sfârșit (noaptea), așa că filmarea 3D a fost **întoarsă** (`ffmpeg -vf reverse`), dată lui
   Aleph cu imaginea de noapte, iar rezultatul se întoarce la loc în `fixpoveste.py`.
4. Ce face bine Aleph: ridicarea acoperișului (bucata 1), lumina, grădina. Ce nu face: **nu pune acoperișul la loc** (bucata 2: l-a
   lăsat ridicat, cu un „bazin” pe casă). De aceea din bucata 2 se folosesc doar primele 72 de cadre, apoi imaginea se topește în
   filmarea de seară. Dacă se reface: filmarea 3D a bucății 2 întoarsă (`pov-2r.mp4`, urcată deja o dată) + o imagine-cheie reală a
   cadrului de la apus (`pov_key3`, sursa atașată: `LFb21IJwy2LQ6iLtxDcd`), adică încă ~16.300 de credite.
5. Imaginea de sus (cheia 2): generatorul **schimbă camerele între ele** (a pus un pat în living). A mers abia cu cererea în care
   prima imagine „stabilește camera, casa, camerele și mobila”, iar a doua (varianta reală, dar greșită) e „doar pentru calitate”,
   plus lista camerelor: dreapta = living (canapea verde, masă rotundă, bucătărie verde), mijloc = baie, stânga = birou alb și două
   fotolii negre, „fără pat”. (Așa e macheta X7: `site/js/x7.js`.)

## Nodurile (fluxul `yUzMp1srSOsKx9pUwTk2`)
| ce | nod |
|---|---|
| imaginea-cheie 0 (dimineața, 06:55) | `FAOofmBXrpEUX7DQqkER` (sursa 3D `vPsa07OvkzQr5dhrIu6j`) |
| imaginea-cheie 1 (capătul vitrat, 09:10) | `m5zfkLsjaT8pEaUeM7fv` (sursa `tEC66Y9BA9oHckmFiw8u`) |
| imaginea-cheie 2 (de sus, fără acoperiș, 12:30) | `7x16psjqNMTBArmi4oyc` (sursa `qLW4ZLlKKZRaIGJJyeGR`; variantele nereușite: nodul `AysXncVcI1oeqb0Mxl1t`) |
| imaginea-cheie 4 (seara, „felinar”, 21:10) | `SdxeLOou3HPGZUvR9XDt` (sursa `5lFWHA6Z31HwZXErumqw`, ținta de calitate: fotografia reală de seară `TCkiNzWLveIef2RwU4bw`) |
| filmarea 0 (dimineața) | `rh6cuuTclCxBFNRJbQlO` (3D: `oC5Ba8s93Bwyc4CW6OFv`) |
| filmarea 1 (acoperișul se ridică) | `7O7YzJ73KWXyjn3FRnh7` (3D: `3TJEsDbw919TBeigdvh5`) |
| filmarea 2 (de sus → jos; bune doar primele 72 de cadre) | `oyFw4hKhZZAZaGXUkpFX` (3D: `1uoUDTV1vWnRvImxXGbr`) |
| filmarea 3 (seara, făcută întoarsă) | `ezCxdIJSf3XLGNLLYPM9` (3D întors: `XtAsKW58Vbi9gloBpO6k`) |

Filmările descărcate nu sunt în git (sunt mari); se iau din nou din ElevenLabs (istoricul generărilor) dacă trebuie refăcute cadrele.

## Credite pe 16 nov, după a doua încărcare (clientul a pus ~20–30 $)
Planurile X7, V3, M9 parter 8.181 · rotirea V3 13.573 · deschiderea: 6 imagini-cheie (două refăcute) 16.362 + 4 filmări 54.292.
În total ≈ 92.400. Soldul nu se poate citi din conector.

# Partea a cincea: casa T6 și grădina mărită (16 nov 2026)

Clientul a trimis proforma, un filmuleț și poze cu T6 („bagă-ne ca 3D și capsula asta”), apoi: „și o să mai fie modele de case,
trebuie să facem grădina mai mare”. Grădina a fost mărită spre intrare, T6 a fost pusă în partea nouă și totul s-a făcut real
într-o singură trecere. **Aceiași pași se repetă la fiecare casă nouă.**

## Pașii, în ordine
1. Modelul casei: `site/js/h_<casă>.js` (vezi `surse/final/CASE-3D.md`), probat în `site/_t_house.html?m=<casă>`.
2. Rândul din `CASE` (`site/js/gradina-data.js`); pentru un model care nu e în catalogul paginii, datele lui în `date: {…}`.
   Dacă a fost un strat cu flori pe locul casei (`GRADINA.straturiNoi`), se scoate.
3. Locurile camerei: pagina deschisă, `__gradina.views()` → `vederi/locuri.json` (casele vechi trebuie să iasă neschimbate).
   Punctele din interior: se intră în casă, `__gradina.H[i].walk.pts` (fiecare trebuie să fie chiar în camera lui: e nevoie de
   ~0,5 m liber în jur, altfel căutarea sare în altă cameră — așa a pățit baia lui T6 până i s-a făcut loc).
4. `python3 rects.py`, apoi `node capflat.js gr_all gr_all_p gr_<casă> gr_<casă>_p pl_<casă>_1` și, pentru camere,
   `node ../cap360.js ../<casă>_<cameră>_src.jpg 4096 "x=…&y=…&z=…&face=1536"`.
5. Sursele se urcă temporar pe `gh-pages` (`img/gd/src/`), se atașează în flux și se fac nodurile (mai jos). `creative_run_flow_nodes`
   cu `estimate_only: true` arată costul fără să pornească nimic.
6. `fixflat.py` (vederi, plan), `fix360.py` (camere), apoi rândurile din `VEDERI`, `PLANURI`, `ai: [...]`.
7. Rotirea: `node capspin.js <casă> 192 1920` (cu `IESIRE=` în afara proiectului; ~7 minute), `ffmpeg … rot9-<casă>.mp4`, apoi nodul
   Runway Aleph 2 cu filmarea și **imaginea reală a vederii** (cea care e pe site), `MARI=96 python3 fixspin.py <mp4> …/rot/<casă> 192 1024`
   și rândul din `ROTIRI` (`az0` = unghiul vederii, din `info.json`).
8. Imaginea de rezervă `site/img/gd/gradina.webp` (1600×900) se taie din `gr_all.webp`.

## Ce a mers și ce nu
- **Toată grădina**: ca țintă de calitate s-a dat **imaginea reală veche a grădinii** („aceeași grădină, înainte de a fi mărită”):
  aspectul (gazon, hale, casele albe) a rămas același, iar casa nouă a apărut la locul ei. Din prima încercare.
- **T6 din afară**: generatorul a pus pe margine **o căsuță de lemn care nu există** (și un rând de lespezi spre ea). Nu s-a refăcut
  toată imaginea: s-a tăiat bucata (1304 px), s-a cerut la un model ieftin (`gemini-3.1-flash-image`, 2K, 918 credite) „scoate
  căsuța și lespezile, pune gazon și gard viu”, iar bucata s-a lipit la loc cu margini estompate (potrivire SIFT + corecție de
  culoare). De atunci cererile spun: „The only buildings in the picture are the ones in the first image: do not add any hut, shed,
  cabin, pavilion…”. **De verificat la fiecare imagine dacă n-a apărut vreo clădire în plus.**
- **Camerele**: cererea descrie finisajele văzute în filmulețul de la târg (pardoseală de stejar deschis, pereți cu furnir bej,
  tavan alb cu spoturi, treaptă cu bandă de lumină): au ieșit foarte aproape de casa reală.
- **Rotirea**: Aleph, cu imaginea reală retușată ca referință (cea fără căsuța de lemn, urcată separat: nodul de imagine conține
  încă varianta cu căsuța). Bună de la primul cadru.

## Nodurile (fluxul `yUzMp1srSOsKx9pUwTk2`)
| ce | nod (sursa) | proporție |
|---|---|---|
| gr_all (grădina mărită) | `ZY0gsvkgRUjXQefth1fC` (`GtyWlcPxI3iDvCEyfWNs` + vechea `WdXp0s4IkSxfV22RbJLw`) | 3:2 |
| gr_all_p | `VH8ESaLFx3Y4XlqYimSb` (`s4XLPzVURvPzqeAU6VK1` + vechea `Db4atERiuIjrOWTiUTao`) | 3:4 |
| gr_t6 | `lWIUS8x2fKh3Cx1gH5QC` (`eTyLOILJkMbfhQ3Mrr6q` + X7 real); retuș: `VMLOTzHOvUmui3Kyx2p1` (bucata `KddUSyVzOYu76wnzCrQs`) | 16:9 |
| gr_t6_p | `9Lop3ur1oMnhndoigiIn` (`ug72EZLfm0MaheLvqy4e` + X7 real) | 1:1 |
| pl_t6_1 | `vnO79GkccLIkxop1mRcm` (`D3dr2JOixcBGkOesy14s` + planul real al lui T7) | 21:9 |
| t6_living / bucatarie / baie / dormitor | `dq7vUJ8BCxmDjzzkiuRU` · `uHSotaCv6kITSuf66TrJ` · `jJi8AmXe2AovGAinepvV` · `9UClrOURv7x2J6QVHeCK` | auto |
| rotirea T6 | `itW7VC4wB80UJntIPw7m` (filmarea `9JHGAEPqIadDP4cRq4Ds` + imaginea retușată `0BZ88RrKlv4B6lyQmEYY`) | 16:9 |

Credite: 5 imagini 4K cu două referințe 13.635 · retuș 918 · 4 camere 9.088 · rotirea 13.573 → **≈ 37.200** (≈ 6,8 $).

## Ce a rămas nepotrivit
- Rotirile caselor vechi au fost filmate în grădina veche: în fundalul lor nu apar T6 și partea nouă (se vede mai ales de la X7 și
  T7, când camera ajunge în spatele lor). Se potrivesc doar dacă se refac (≈13.600 de credite pe casă).
- Imaginile de seară pregătite (12 noduri) sunt din grădina veche: cele două cu toată grădina trebuie refăcute, iar T6 n-are.

