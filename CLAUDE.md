# Capsula România — site demo nou (casecapsula.ro)

Site static (HTML + CSS + JavaScript, fără framework și fără build) pentru Capsula România:
case capsulă și case modulare, cu modelul X7 expus în showroom-ul din Ciorogârla (Ilfov).
Conținutul vine de pe casecapsula.ro. Proiectul a fost început într-o conversație Claude (claude.ai)
și mutat aici pe 22 octombrie 2026. Din 14 noiembrie 2026 prima pagină are scene 3D adevărate (three.js, ținut local):
povestea de la deschidere și grădina cu case model. Detaliile tehnice și istoricul complet sunt în `docs/DETALII-TEHNICE.md`.

## Cum lucrezi cu clientul
- Răspunde mereu în **română**, simplu, fără jargon. Clientul scrie mesaje scurte și trimite des capturi de ecran.
- Vrea rezultatul, nu explicații lungi. La final spune în 2–4 rânduri ce s-a schimbat.
- Ce îi place clientului se **păstrează exact**. Schimbă doar ce cere. S-a supărat când s-a refăcut tot
  („ți-am spus să lași cum a fost, nu să schimbi tot”).
- Înainte de o modificare mare, salvează o copie în `versiuni/<nume-scurt>/`.

## Decizii luate (nu le schimba fără să întrebi)
- Interfața e **albă** („capsula e albă”). Accent auriu `#d4a24c`.
- Vitrajul este **geam triplu LOW-E** peste tot (niciodată „dublu”).
- Secțiunea „De la prima vizită la casa ta” a fost **scoasă** la cererea clientului. Nu o readuce.
- Secțiunea „Ziua și seara” (cele două imagini despărțite de o linie aurie) a fost **scoasă** la cererea clientului pe 14 nov 2026
  („asta vreau să o scoți”). Nu o readuce. Fișierul ei (`surse/final/parts/zi-noapte.html`) a rămas, nefolosit; copia paginii
  cu ea e în `versiuni/inainte-fara-zi-seara/`.
- **Capsula X7 reală, văzută din față:** vitrajul mare (dormitorul) e în **stânga** ușii, livingul în dreapta. Modelul 3D
  (`site/js/x7.js`) respectă asta; verifică orice desen nou al capsulei după pozele reale.
- **Deschiderea site-ului (din 14 nov 2026) = povestea 3D legată de derulare**: capsula X7 ca model 3D adevărat, de dimineața
  până seara („Seara, capsula devine felinar”), apoi desfăcută pe straturi; după ea, banda cu cifre mari. Clientul a trimis un
  filmuleț de pe Instagram (un site cu o casă 3D care se schimbă la derulare) și a cerut: „vreau și site-ul meu să fie fix așa…
  că nu-mi place cum arată, să fie mult mai interactiv, să fie frumos ochiului”. Varianta dinainte (doar capsula seara,
  `img/x7s_night.webp`, cerută pe 22 oct) e salvată în `versiuni/inainte-v3-3d/`. Variantele și mai vechi V1 / V2 sunt în
  `versiuni/inainte-site-final/` și `versiuni/home-inainte-v2-3d/`.
- **„Nu mai vreau deloc să mai apară alea pătrățoase” (clientul, 16 nov 2026, de mai multe ori, cu filmulețe):** macheta 3D **nu
  se mai arată niciodată** acolo unde există imagine reală. Reguli care decurg de aici (nu le strica):
  - Deschiderea se vede ca **filmare reală** (cadre făcute cu AI din drumul camerei 3D, `site/img/st/film/`, arătate cadru cu cadru la
    derulare): pe ecran lat umple ecranul, pe ecran îngust e o bandă sus cu textul dedesubt. Macheta rămâne doar la ultimul capitol
    („Fiecare strat, gândit”, desenul pe straturi) și pe ferestrele mici aproape pătrate cu textul în stânga (lățime > 800 px și
    raport sub 3:2).
  - În grădină: între două vederi se trece direct de la o imagine la alta (`keep` / `xf` în `js/garden.js`), inclusiv la intrarea
    în casă, între camere și la „Plan”; vederile care au doar imagine fixă (toată grădina, planul, casele pe ecran îngust) **nu se
    mai rotesc** la tragere; casele cu filmare de rotire se rotesc doar prin cadre reale; la încărcare, scena apare abia când
    imaginea reală e gata; unde poza nu ajunge până la marginea ecranului, pe lângă ea e tot ea, ștearsă (nu macheta).
  - **„Zi / Seară” e ascuns** peste tot, în afară de interiorul lui X7 (acolo există fotografii reale de seară). Revine în grădină
    când se fac imaginile de seară (12 noduri pregătite, ~2.730 de credite fiecare; făcute înainte de mărirea grădinii, deci cele
    două cu toată grădina trebuie refăcute, iar pentru T6 nu există încă). Nu-l readuce cu macheta de noapte.
  - Mențiunea de pe imaginile făcute cu AI e **mică și discretă** („Imagine realizată cu AI · orientativă”, text mic într-un colț):
    clientul a întrebat dacă se poate scoate („putem scoate vizualizare”); i s-a explicat că imaginile nu sunt fotografii și că
    trebuie marcate (reclamă înșelătoare / regulile europene despre AI), deci a rămas, dar discretă. **Nu o scoate de tot** și nu
    scoate nota de sub grădină; dacă insistă, trimite-l la avocatul / contabilul lui.
- **Titlurile mari sunt cu serife** (Cormorant Garamond, cuvântul auriu în italic), ca în filmulețul de referință. Logo-ul și
  etichetele mici rămân în Unbounded / Manrope.
- **Grădina cu case model (secțiunea 04, din 14 nov 2026)**: o grădină 3D în care apeși pe o casă, intri în ea (acoperișul se
  ridică) și vezi camerele, m², dimensiunile și prețul. Cerința clientului: „o grădină frumoasă… clientul să meargă frumos prin
  fiecare casă, apasă pe casă și să poată intra în casă, să vadă configurația, metri pătrați, tot, ca un fel de tur 3D”.
  **Cinci case sunt exemple din catalog** (X7, T7, E7, V3, M9), cu datele adevărate din `window.CAT`; a șasea, **T6** (din 16 nov
  2026), e prima casă comandată de client (nu e în catalog: datele ei stau în rândul `date` din `site/js/gradina-data.js`); a șaptea,
  **C20** (din 17 nov 2026), e casa extensibilă de 20 ft din a doua proformă (tot cu `date`; numele „C20” e de lucru). Clientul
  a spus că va trimite și celelalte case model comandate („nu toate casele alea din video le-am luat… o să-ți dau eu casele model”):
  se schimbă în `site/js/gradina-data.js`, iar modelul 3D al fiecărei case se face după `surse/final/CASE-3D.md`.
  Machetele sunt orientative (scrie și sub scenă); nu inventa dotări, prețuri sau suprafețe.
  **A doua cerere (14 nov 2026):** „vreau să pară mult mai real… arată prea ca un desen animat… aș vrea direct chiar să intre
  în casă”. De aceea: grădina are cer, iarbă, copaci și materiale realiste (`js/real.js`, `js/gscene.js`, `js/genv.js`), iar
  „Intră în casă” te duce **în interior, la nivelul ochilor** (te uiți în jur, treci dintr-o cameră în alta). În **X7 se văd
  fotografiile reale 360° din showroom** (`site/p360`), aliniate cu macheta; celelalte case arată interiorul 3D până primim
  poze 360° din ele. **Din 17 nov 2026, la ferestrele lui X7 se vede grădina, nu parcarea** (clientul: „aici aș vrea să arate din
  grădină… nu din parcare”): în cele patru fotografii de zi cu ferestre (living, masă, blat, dormitor) doar ce e dincolo de geam
  a fost schimbat cu AI, restul e fotografia reală. Copiile stau în `site/img/gd/x7/` și se folosesc **doar în grădină**
  (`pano.gradina` în `gradina-data.js`); turul 360° păstrează fotografiile neschimbate. Pe fișa casei scrie „Fotografii reale 360°
  din showroom · grădina de la ferestre e adăugată cu AI”, pe imagine apare mențiunea mică „Fotografie reală · grădina de la
  ferestre e adăugată cu AI”, iar nota de sub grădină spune același lucru: **nu scoate aceste mențiuni**. „Plan” (acoperișul ridicat) a rămas ca a doua vedere. Varianta dinainte (machetă simplă, doar acoperișul
  ridicat) e în `versiuni/gradina-macheta/`.
- **Grădina mărită + casa T6 (16 nov 2026).** Clientul: „bagă-ne ca 3D și capsula asta” (T6), apoi „și o să mai fie modele de case,
  trebuie să facem grădina mai mare”. Grădina a fost **mărită spre intrare** (adâncime 72 → 98 m; `GRADINA` în `gradina-data.js`).
  Reguli (nu le strica): **casele vechi și tot ce e în partea veche rămân exact pe loc** (imaginile reale și rotirile lor au fost
  făcute cu ele acolo; în `js/genv.js` lucrurile noi își iau numerele „la întâmplare” din șirul separat `extra(...)`, vezi comentariul
  de acolo); casele noi se pun în partea din față (locuri: x = ±15,5, z = 40). **T6 e pe locul din dreapta, C20 (din 17 nov) pe cel
  din stânga**: partea din față e plină. Când vine altă casă: grădina se mai mărește tot spre intrare (ca pe 16 nov), apoi modelul
  ei, rândul din `CASE`, **cele două imagini cu toată grădina** refăcute și imaginile casei (pașii: `surse/ai360/CITESTE.md`, partea
  a cincea; cum s-a făcut C20: partea a șasea). Copia dinainte:
  `versiuni/gradina-inainte-t6/`. T6 e **gri, ca la târg** (în poza din proformă era neagră cu lemn: clientul n-a confirmat încă
  culoarea comandată) și are **„Preț pe ofertă”** (prețul de vânzare nu se știe: nu-l inventa; prețul din proformă e de achiziție
  și nu se pune nicăieri).
- Sub hero, prima pagină are efecte 3D (apariție în perspectivă, carduri care se înclină). Versiunea dinainte: `versiuni/home-inainte-3d/`.
- Turul virtual 360° a fost pus pe pauză de client („hai să lăsăm momentan turul 360”).

## Structura
```
site/                    tot ce se publică
  home.html              PAGINA PRINCIPALĂ — GENERATĂ, nu o edita de mână (vezi mai jos)
  index.html             copie identică a home.html (generată odată cu ea)
  complet.html           pagina lungă: configurator, specificații, finanțare, investitori, legal, livrare, FAQ (se editează direct)
  home_v1.html           veche (varianta V1), nefolosită și nelegată; nu se publică
  js/                    scenele 3D (module): kit.js (unelte comune), x7.js (modelul capsulei), stage.js + story.js (deschiderea),
                         gscene.js + genv.js + real.js + garden.js + gradina-data.js (grădina), pano.js (fotografii reale 360°
                         în interiorul caselor și imaginile realiste ale vederilor din afară), furn.js (mobilier, terase), h_<casă>.js (câte o casă:
                         x7, t7, e7, v3, m9, t6, c20)
  vendor/                three.js 0.170 ținut local (nu se încarcă nimic de pe alte site-uri)
  img/                   imaginile; img/ext (exterior), img/int (interior), img/vid (clipuri .mp4 + postere .webp),
                         img/st și img/gd (deschiderea și grădina: img/gd/ai = imaginile reale ale vederilor și camerelor,
                         img/gd/rot = cadrele rotirilor, img/gd/x7 = fotografiile lui X7 cu grădina la ferestre)
  p360/                  panoramele turului: <punct>_{s,m,l,x}.webp și miniaturile t_<punct>.jpg
surse/final/home.base.html   SURSA paginii principale: tot în afară de părțile de mai jos (banda cu cifre, caracteristici,
                             model, tur, la comandă, galerie, contact, subsol, CSS/JS comun, Pannellum)
surse/final/parts/           părțile: story.html (deschiderea 3D), interior.html, exterior.html, gradina.html
                             (fiecare cu blocurile CSS/HTML/JS); zi-noapte.html nu se mai folosește
surse/final/CASE-3D.md       cum se face modelul 3D al unei case pentru grădină (reguli, materiale, testare)
surse/final/SPEC.md          specificația designului final (ordine, texte, comportamente, mărimi)
surse/final/media.json       ce arată fiecare poză/clip nou (din ce sursă, ce legendă)
surse/final/pano_view.py     scoate o poză obișnuită dintr-o panoramă 360
tools/asambleaza.py          construiește site/home.html + site/index.html din home.base.html + parts/
tools/test_pagini.js         capturi la 5 dimensiuni + verificări automate (erori, 4xx, derulare orizontală, un singur clip)
tools/css_mort.py            găsește și scoate CSS-ul nefolosit (verifică apoi stilurile calculate)
docs/DETALII-TEHNICE.md  cum funcționează fiecare secțiune; istoricul proiectului
surse/                   scripturi și imagini sursă (doar referință, nu se publică)
versiuni/                versiuni salvate la cererea clientului
istoric/                 copii vechi ale paginilor, făcute înainte de schimbările mari
```

Ordinea primei pagini: povestea 3D de la deschidere (#top) → banda cu cifre (#cifre) → 01 Interior (plimbare prin camere,
cu planul 3D) → caracteristici → 02 Exterior (ocolul capsulei, carusel 3D + hartă) → 03 Modelul X7 →
04 Grădina cu case (#gradina) → 05 Tur 360° → 06 Capsule la comandă → 07 Galerie („De ce noi”) →
08 Tot ce mai vrei să știi → 09 Contact → subsol.

## Flux de lucru
1. Previzualizare locală. Pagina trebuie deschisă prin server, altfel turul 360 nu încarcă panoramele:
   `cd site && python3 -m http.server 8765`, apoi http://localhost:8765/home.html.
2. Pentru prima pagină editezi `surse/final/home.base.html` sau `surse/final/parts/*.html`, apoi rulezi
   `python3 tools/asambleaza.py` (scrie `site/home.html` și `site/index.html`). Pentru pagina lungă editezi direct `site/complet.html`.
   `tools/make_v1.py` nu mai funcționează (nu mai există V1/V2): nu-l rula.
3. Verifici vizual cu serverul pornit: `node tools/test_pagini.js`
   (prima dată: `npm i -D playwright && npx playwright install chromium`). Derulează în teste cu `behavior:'instant'`
   (pagina are derulare lină și capturile făcute în timpul ei mint).
   Dimensiunile obligatorii sunt panou îngust 506×506, telefon 390×844, tabletă 820×1180, laptop 1440×900
   și desktop 1920×960. Clientul se uită des la site în panoul lateral îngust din aplicația Claude.
   Scenele 3D se testează în Chromium pornit cu `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`
   (așa face și `tools/test_pagini.js`); merge încet, dar arată exact ce vede clientul. O singură casă se vede în pagina de
   probă `site/_t_house.html?m=<casă>` (nu se urcă în git și nu se publică).
4. Fișierele de pe alte site-uri nu se încarcă în pagini: totul stă local în `site/img`, `site/js` și `site/vendor`.
   Excepții acceptate: Google Fonts (Manrope, Unbounded), linkurile EN/BG și PDF-urile de pe casecapsula.ro.

## Unde e publicat acum
- **Site-ul online, public (oricine are adresa, fără logare):** https://designdn25-afk.github.io/capsula-media/
  (GitHub Pages, ramura `gh-pages`; pus online pe 23 oct 2026 la cererea clientului: „pune-l online să-l vadă oricine”).
  Se actualizează cu `sh tools/publica_pages.sh` (reconstruiește pagina și urcă `site/` fără fișierele vechi).
  **Ascuns de Google** (`noindex` în pagini + `site/robots.txt`): clientul nu vrea să fie public „gen .ro”, doar cu linkul.
  Nu scoate `noindex` fără acordul lui.
- **Site-ul final (prima pagină nouă), previzualizare privată:** https://claude.ai/artifact/9KFViWSHxSHJm3UR87sfr9
  (se actualizează din această sesiune Claude Code, cu același fișier `site/home.html`).
  Are limită de 511 fișiere: cadrele rotirilor T7/E7/M9 nu încap, deci acolo doar X7 se rotește „real” (nu urca acolo
  `js/gradina-data.js` cu rotirile noi; acolo X7 a rămas cu 72 de cadre). Linkul public le are pe toate.
  Din 16 nov previzualizarea privată **a rămas în urmă** (nu are planurile reale, rotirea nouă, filmarea de la deschidere: cadrele
  nu încap în limita de fișiere). Clientul se uită pe linkul public, într-o fereastră de Chrome, uneori îngustă.
- Linkurile publice vechi („oricine are linkul”), cu variantele dinainte: V2 https://claude.ai/artifact/XA6dNq77wKbmrcDCdum9Sm ·
  V1 https://claude.ai/artifact/Fj56xUcscpsXGz7k8tMrcV (neschimbate; de actualizat doar după aprobarea clientului).

Linkurile acestea se pot actualiza doar dintr-o conversație pe claude.ai. Din Claude Code publici folderul
`site/` pe un hosting static (de exemplu Netlify, Vercel, GitHub Pages sau serverul casecapsula.ro).

## Date folosite pe site
- WhatsApp: +40 731 166 070 (https://wa.me/40731166070). Formularul de contact trimite mesajul pe WhatsApp.
- Showroom: Calea București nr. 41, 077055 Ciorogârla, Ilfov. Extindere regională: Trakia St. 12, Varna (BG).
- TikTok: @multimester. X7: 36,5 m² utili, 39 m² construiți, 11,5 × 3,4 m, h 3,45 m, 39.500 € cu TVA, rate prin TBI Bank.
- PDF-uri: https://casecapsula.ro/docs/oferta-capsula-x7-v2.pdf și https://casecapsula.ro/docs/prezentare-tehnica-x7.pdf

## Cerut pe 17 noiembrie 2026 — făcut și publicat în aceeași zi
Clientul a trimis patru lucruri și a pus credite la ElevenLabs („gata ai credite”). Cum s-a făcut fiecare și nodurile: `surse/ai360/CITESTE.md`,
partea a șasea. Credite folosite: ≈ 57.100 (din care ≈ 10.900 pe o încercare nereușită la X7).
- **„Nu se mișcă lent deloc”** (deschiderea și rotirea caselor): făcut (vezi mai jos „Mișcarea de la deschidere” și „Rotire reală”).
- **„Aici scaunul este intrat în bucătărie”** (E7): scaunul a fost scos din cele două imagini ale camerelor printr-un retuș ieftin
  (`surse/ai360/retus/retus_e7.py`); masa are acum un singur scaun în imagini. În model scaunul e mutat lângă masă
  (`site/js/h_e7.js`); cele două noduri de refacere completă (≈ 4.550 de credite) au rămas nepornite, opționale.
- **„Aici aș vrea să arate din grădină… nu din parcare”** (X7, interior): făcut (vezi „Decizii”, la grădină). Încercarea de a edita
  toată fotografia 360° dintr-o dată **nu a mers** (generatorul a inventat ferestre unde sunt pereți); a mers editarea pe bucăți,
  lipită înapoi doar unde s-a schimbat ceva (`surse/ai360/x7_geamuri/`).
- **„Hai să mai adăugăm și casa asta”**: casa extensibilă de 20 ft (**C20**) e în grădină, toată în imagini reale: vederea din afară
  (ecran lat + telefon), planul, cinci camere (Living, Bucătărie, Baie, Dormitor 1, Dormitor 2) și rotirea (ecran lat). Modelul:
  `site/js/h_c20.js`, după planul din ofertă și filmulețul din fabrică. Date (din ofertă, fără cele sensibile): 20 ft,
  5,9 × 6,2 × 2,48 m, ≈ 36,6 m², două dormitoare + living cu bucătărie + baie; structură din țeavă de oțel zincată, pereți din
  panouri de 75 mm, tablă maro cu aspect de lemn, ușă dublă din aluminiu cu **geam triplu**. **De întrebat clientul** (a fost
  întrebat, n-a răspuns încă): cum vrea să se numească („C20” e nume de lucru), prețul de vânzare (acum „Preț pe ofertă”) și dacă
  ușile dormitoarelor sunt albe (în filmuleț au folie albastră). Proforma are date sensibile: nu se urcă în git. În imaginea băii,
  așezarea obiectelor diferă puțin de machetă (generatorul le-a mutat), fără efect pentru vizitator.

## Ce mai e de făcut (la 14 noiembrie 2026)
- **Casele adevărate pentru grădină**: T6 e pusă (vezi mai jos). De cerut clientului celelalte case model comandate, cu poze /
  planuri, dimensiuni și preț; până atunci restul grădinii arată exemple din catalog. De întrebat și cum vrea să arate grădina
  (alei, flori, lămpi).
- **Interiorul caselor, „real” cu AI** (cerut de client pe 14 nov 2026: „înăuntru… arată tot pătrățos, vreau să faci real, ca pe
  video”; a aprobat explicit trimiterea imaginilor la ElevenLabs și consumul de credite pentru toate casele): din fiecare cameră a
  caselor T7, E7, V3, M9, T6 (16 nov) și C20 (17 nov) s-a scos o imagine 360° a machetei și a fost transformată în imagine realistă (28 de imagini, în
  `site/img/gd/ai/`, legate în `site/js/gradina-data.js` prin `ai: [...]`). Pe site apar cu mențiunea „Vizualizare realizată cu AI,
  orientativă” — **nu scoate mențiunea** (generatorul schimbă detalii de mobilier și finisaje). Cum se refac: `surse/ai360/CITESTE.md`.
  Dacă se schimbă forma sau mobila unei case, imaginile ei trebuie refăcute (altfel nu se mai potrivesc cu macheta). X7 rămâne cu
  fotografiile reale. Un film de prezentare făcut la fel (animație → video cu AI) nu s-a făcut încă; cere din nou acordul pentru credite.
- **Vederile din afară, „reale” cu AI** (cerut pe 14–16 nov 2026: „vreau să-mi faci toată grădina să arate așa”, cu hale în jur,
  „să vadă că suntem în România, în Ciorogârla”; clientul a pus credite la ElevenLabs pe 16 nov): **toate cele 16 vederi de zi (cu T6, C20 și grădina mărită) sunt
  pe site** (toată grădina + fiecare casă, pe ecran lat și pe telefon; `VEDERI` în `site/js/gradina-data.js`), cu mențiunea
  „Vizualizare realizată cu AI, orientativă” (**nu o scoate**). Dacă se mută o casă, se schimbă grădina sau locul camerei, imaginile
  trebuie refăcute. Rețeta care dă fotografie adevărată (nu machetă „lustruită”) și nodurile: `surse/ai360/CITESTE.md`, partea a doua.
- **Rotire reală** (cerut pe 15 nov cu filmuleț: „când miști capsula 360 tot așa apare pătrățos”): la rotire pagina arată cadrele
  unei filmări reale (`ROTIRI`). **Gata la toate cele șapte case** (ecran lat; T6 din 16 nov, C20 din 17 nov), făcută cu Runway Aleph 2 din rotirea machetei
  (~13.600 de credite pe casă). 192 de cadre mici + 96 mari pe casă. Rotirea a fost rescrisă pe 16 nov (după trei filmulețe: „nu
  merge lin”, „tot parcă sunt blocaje”): cadrele se cer de lângă unghiul curent, sunt despachetate din timp în afara firului
  principal, pe ecran se trece doar prin cadre gata făcute (dacă netul nu ține pasul, rotirea așteaptă la ultimul cadru, nu sare
  și nu arată macheta), mișcarea se socotește în timp, iar după ce dai drumul alunecă puțin. **Rescrisă încă o dată pe 17 nov** („unele case nu se
  mișcă lent deloc”): imaginea urmărește mereu mâna (dacă exact cadrul unghiului nu e gata, se arată cel mai apropiat care e; din
  toată rotirea se țin copii mici, „schița”; pe calculator se aduc din timp câteva cadre ale fiecărei case). La X7 lipsesc ~50° din
  filmare, în spatele casei (filmarea ei pornea din spate): pagina trece repede peste porțiunea aceea, topind un capăt în celălalt
  (`gol: [191, 26]` în `ROTIRI`); dispare de tot doar dacă se reface filmarea lui X7 (~13.600 de credite). La V3 apare „V3” scris pe perete în câteva cadre. **Pe ecran îngust (vederea înaltă), la toată
  grădina și la plan nu există filmare**: acolo imaginea rămâne pe loc. Clientul a cerut „Lasă copacii”: copacii rămân în filmări.
  Copii: `versiuni/gradina-inainte-treceri-reale/`, `versiuni/gradina-inainte-rotire-noua/`, `versiuni/gradina-inainte-fara-macheta/`.
  Pași și capcane: `surse/ai360/CITESTE.md`, partea a treia.
- **„Plan” real**: toate casele au planul ca imagine reală (`PLANURI`: X7, T7, E7, V3, M9 etaj + parter, T6, C20), folosit pe orice ecran
  (pe ecran îngust se folosește tot imaginea „lată”). La X7 și la M9 parter casa a rămas puțin „desenată”.
- **Deschiderea reală** (cerută pe 16 nov: „și la început aici tot așa arată pătrățos… vreau să faci totul real și lin”): **făcută**.
  Patru filmări Aleph (dimineața, ridicarea acoperișului, de sus → seara, seara) + cinci imagini-cheie. Între prânz și seară imaginea
  se topește dintr-o filmare în alta (generatorul n-a mai pus acoperișul la loc în a treia filmare). Cum s-a făcut și cum se reface:
  `surse/ai360/CITESTE.md`, partea a patra. Imaginile de rezervă (`img/st/ch*.webp`, mișcare redusă) sunt încă machetă.
- **Seara** în grădină: nu există imagini reale de seară, deci butonul „Zi / Seară” e ascuns (vezi „Decizii”). 12 noduri pregătite
  în ElevenLabs (~2.730 de credite fiecare), nepornite. Conectorul Higgsfield din Claude **nu poate genera** (doar citește contul).
- **Casa T6 (prima casă comandată de client, 2 bucăți)**: **făcută și pusă în grădină pe 16 nov 2026**, toată în imagini reale:
  modelul `site/js/h_t6.js` (după planul din proformă, filmulețul și pozele de la târg), vederea din afară (ecran lat + telefon),
  planul, cele patru camere (Living, Bucătărie, Baie, Dormitor) și rotirea (ecran lat). Date (din proformă, fără cele sensibile):
  „Tiny House T6”, casă care se extinde: la transport 5,85 × 2,27 × 2,55 m, desfăcută 5,85 × 4,17 × 2,55 m, ~24 m² (21,4 m² în
  interior), 5,2 t, 10 kW; living + chicinetă în modulul din față (fix), baie și dormitor în partea din spate (se extinde, mai
  îngustă: 5,45 m, cu podeaua cu o treaptă mai sus); fațada: perete plin 1,38 m, ușă de oțel 0,86 m, apoi 3,26 m de sticlă;
  fereastră pe capătul din dreapta al dormitorului. Structură din oțel galvanizat, pereți din panouri metalice cu spumă PU, **geam
  triplu** (comandat ca opțiune), ușă cu cheie / cod / cartelă. **De întrebat clientul:** prețul de vânzare (acum scrie „Preț pe
  ofertă”), culoarea comandată (pe site e gri, ca la târg; în proformă apare neagră cu lemn) și dacă vrea un rând de notă sub nume.
  În proformă e prețul de achiziție: nu se pune pe site și nu se urcă în git, la fel datele personale și pozele cu oameni de la târg.
  **Ce nu se potrivește încă:** în rotirile caselor vechi (filmate înainte) T6 și partea nouă a grădinii nu apar în fundal; se
  potrivește doar dacă se refac rotirile (≈13.600 de credite pe casă; X7 și T7 sunt cele din care s-ar vedea). La fel C20: apare
  doar în rotirea ei și în cele două imagini cu toată grădina. Credite folosite
  pentru T6 și grădina mărită: ≈ 37.200 (5 imagini 4K, un retuș, 4 camere, rotirea).
- **Mișcarea de la deschidere** trebuie să rămână lină (clientul a reclamat de trei ori că se poticnește): nu readuce opririle
  camerei între capitole și nu ridica bugetul de pixeli fără să probezi pe un ecran mare. A treia oară (17 nov 2026: „când ai de sus
  în jos… nu se mișcă lent deloc”): filmarea are acum **toate cadrele** (648, `f_0000…f_0647`; înainte unul din două), derularea e
  urmărită cu un arc amortizat (fără smucitură la fiecare treaptă a rotiței), iar imaginea urmărește mereu derularea (se arată cel
  mai apropiat cadru gata; din toată filmarea se țin copii mici, „schița”). Nu rări cadrele și nu readuce așteptarea după cadre
  (`site/js/story.js`, `FILM`; copia dinainte: `versiuni/inainte-e7-scaun-x7-gradina/story.js`).
- **Interior real în fiecare casă**: singurul mod ca interiorul să arate „pe bune” e cu fotografii 360° făcute în casa
  respectivă (ca la X7). Când clientul are casele, de făcut 4–5 poze 360° în fiecare; se leagă în `site/js/gradina-data.js` (rândul `pano`).

## Mai vechi (la 22 octombrie 2026, după site-ul final)
0. **Înainte de lansare (obligatoriu legal):** datele firmei în subsol. Acum sunt ascunse într-un comentariu
   `<!-- DE COMPLETAT … -->` în `surse/final/home.base.html` (și vizibile ca „____” în complet.html). Trebuie cerute clientului.
0b. La publicarea pe domeniu: `og:image` (adresă completă a `img/x7s_night.webp`) și imaginea din JSON-LD (azi pe casecapsula.ro).
0c. Fișiere care nu se mai folosesc pe prima pagină (nu se publică; de șters doar cu acordul clientului): `site/home_v1.html`,
    `img/hero_*`, `img/x7s_frame.webp`, `img/x7s_lot.webp`.
1. ~~complet.html și index.html în tema veche~~ — **făcut pe 22 oct 2026**: au primit blocul „TEMA ALBĂ” din home.html
   și formularul alb. Copia în tema închisă e în `versiuni/complet-tema-inchisa/`. Hero-ul lor (poza cu derulare) a rămas la fel.
   Atenție: complet.html are încă secțiunea `cum-cumperi` („De la prima vizită la casa ta”), scoasă doar din home.html. De întrebat clientul.
2. Datele firmei din subsol: „Denumire firmă SRL · CUI ____ · Nr. Reg. Com. ____ (de completat)” (home și complet)
   și intervalul „de la ____ € la ____ €” din complet.html. Trebuie cerute clientului.
3. Turul 360 (în pauză). Clientului nu-i plac tranzițiile dintre puncte. A cerut mai multe puncte în living și
   dormitor și unul singur în baie. Acum sunt 15 puncte: living 7, dormitor 3, baie 1.
4. ~~V1 pe calculator~~ (V1 nu mai există pe prima pagină).
5. Site-ul e doar în română. EN și BG din meniu duc la casecapsula.ro/en și casecapsula.ro/bg.
6. Hosting și domeniu pentru varianta finală.
