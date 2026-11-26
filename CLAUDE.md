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
- **Deschiderea site-ului (din 26 nov 2026) = un film care rulează singur, fără derulare.** Clientul a trimis ca model
  https://www.ghmaisonbois.com/ (sus rulează singur un film în care casa „se formează”, cu titlul peste el) și a cerut: „vreau să-mi faci
  și mie așa la casele capsulă, cum se formează casa capsulă X7, să pară real, să nu mai fie cu scroll cum am băgat noi, dar să pară
  sută la sută real”. Acum `#top` e un singur ecran: filmul `site/img/st/formare2-1080.mp4` (telefon: `formare2-720.mp4`, imagine de
  așteptare `formare-poster.jpg`), 18 secunde, în buclă, fără sunet: capsula apare ca schiță albastră de plan, se „umple” în casă
  reală, acoperișul coboară pe ea, camera se rotește în jurul ei dimineața, apoi vine seara. Peste el: titlul, cele trei butoane și un
  rând care se schimbă odată cu filmul; buton mic de oprire; mențiunea AI rămâne. Pe ecran îngust filmul e o bandă sus, cu textul
  dedesubt. La mișcare redusă / economie de date filmul nu pornește singur. Filmul e făcut **fără credite** din cadrele filmării reale
  de la deschiderea veche (`surse/film-deschidere/face.py`: cadrele mari se scot din `site/img/st/film/v/`, apoi ffmpeg). Partea de
  pagină: `surse/final/parts/story.html` (nu mai folosește `js/story.js`). Clientul (26 nov, după ce l-a văzut): „alocă mai multă memorie să meargă mai
  fluid și să nu se blocheze” → filmul e mai ușor (5,2 MB / 2,3 MB, `-crf 30 -maxrate 2300k`, respectiv `1000k`) și e adus **întreg în
  memorie** înainte să pornească (nu se mai poate opri la mijloc după internet); nu mai are estompare peste el. Dacă tot se blochează:
  cere un filmuleț și întreabă pe ce aparat și cu ce internet. **Nu readuce derularea** fără să ceară el. Varianta veche,
  legată de derulare (cu capitolele și desenul pe straturi „Fiecare strat, gândit”): `surse/final/parts/story-derulare.html` +
  `versiuni/inainte-film-automat/`; cadrele ei (`site/img/st/film/`) au rămas pe loc, nefolosite de pagină.
- **(Istoric) Deschiderea dintre 14 și 26 nov 2026 = povestea 3D legată de derulare**: capsula X7 ca model 3D adevărat, de dimineața
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
- **Titlurile mari sunt cu serife** (Cormorant Garamond, cuvântul auriu în italic), ca în filmulețul de referință. Etichetele mici
  rămân în Unbounded / Manrope.
- **Logo-ul (din 26 nov 2026) = „case capsulă”**: clientul a trimis o captură cu logo-ul lui (o capsulă-contur verde închis cu un
  acoperiș auriu și o ușă, sub ea „case capsulă” cu „ă” auriu) și a cerut „vreau să-mi bagi și logoul ăsta”. A fost redesenat ca
  desen vectorial (nu avem fișierul original) și pus în bara de sus și în subsol (prima pagină și `complet.html`) și ca iconiță de filă,
  în locul textului „CAPSULA·ROMÂNIA”. Culori: verde `#4e5c50`, auriu `#d1a653`; peste fundal închis e alb cu acoperișul auriu.
  Fișiere: `site/img/logo-case-capsula.svg` și `logo-case-capsula-alb.svg`. Copia dinainte: `versiuni/inainte-logo-nou/`. Dacă
  clientul trimite fișierul original al logo-ului, se pune acela.
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
                         x7, t7, e7, v3, m9, t6, c20), clip.js + clip-worker.js („filmul comprimat” al rotirilor și al deschiderii:
                         cadrele mari, desfăcute pe un fir separat; vezi docs/DETALII-TEHNICE.md, §22)
  vendor/                three.js 0.170 ținut local (nu se încarcă nimic de pe alte site-uri)
  img/                   imaginile; img/ext (exterior), img/int (interior), img/vid (clipuri .mp4 + postere .webp),
                         img/st și img/gd (deschiderea și grădina: img/gd/ai = imaginile reale ale vederilor și camerelor,
                         img/gd/rot = cadrele rotirilor, img/gd/x7 = fotografiile lui X7 cu grădina la ferestre);
                         img/gd/rot/<casă>/v și img/st/film/v = filmele comprimate (h_NN.bin, lo.bin);
                         pentru telefoane: img/gd/ai/m = imaginile vederilor și planurilor la jumătate de mărime,
                         img/gd/rot/<casă>/p.bin = „pachetul mic” al rotirii, img/st/film/t = cadrele deschiderii tăiate
                         pentru telefon (f_NNNN.webp) și pachetele lor mici (p_NN.bin)
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
tools/test_telefon_*.js      probe ca pe un telefon cu legătură de mobil: deschiderea, poza casei alese, rotirea (docs/DETALII-TEHNICE.md, §23)
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

## Cerut pe 18 noiembrie 2026 — terasa lui M9 (făcut)
Clientul a văzut terasa lui M9 în pagină: „uite când te uiți de la terasă arată diferit, nu arată grădina”. Imaginea veche
(`site/img/gd/ai/m9_terasa.webp`) arăta un câmp cu copaci, fără casele din grădină. Acum, de la intrarea pe terasă (privirea
spre grădină) se vede grădina cu casele capsulă, gardul viu, copacii și halele în fundal; privirea spre spate arată camera
cu dormitorul și halele. Copia dinainte: `versiuni/inainte-terasa-m9/m9_terasa.webp`.
- **Credite:** două generări a câte 2.727 (≈ 5.450 în total). Prima, cu sursa rotită la jumătate, a lăsat o cusătură la mijloc
  (baldachinul și camera erau întinse până la margine); a doua, cu sursa `surse/ai360/m9_terasa_src_r2.jpg` (camera în centru,
  marginile pe cer și câmp), e cea publicată.
- **Ce rămâne:** privind mult spre dreapta, pe margine, marginea camerei și a baldachinului e ușor moale (cusătura panoramei,
  în dreptul colțului de sticlă). Dacă clientul o vede și o supără: refacere după `surse/ai360/CITESTE.md`, partea a noua.
- **Regulă:** la o panoramă, generatorul întinde obiectele mari spre marginile cadrului. Marginile generării trebuie puse pe
  cer sau câmp, nu pe cameră; de verificat cu ochii fiecare generare, nu doar cu măsurătoarea de aliniere.

## Cerut pe 17 noiembrie 2026, seara — telefonul (făcut și publicat)
Clientul a filmat ecranul telefonului (Android, navigatorul Brave): „am deschis pe telefon, vezi și singur, nu merge deloc bine”.
Ce se vedea în filmuleț și ce s-a făcut (pe larg: `docs/DETALII-TEHNICE.md`, §23; `surse/ai360/CITESTE.md`, partea a opta):
- **Alegi o casă și poza rămâne cea veche** (C20 a apărut după 2 secunde; la M9, V3, E7, T7, apăsate pe rând, poza nu s-a mai
  schimbat deloc). Cauza: pe telefon, fiecare casă cerea o poză de 4K (1–1,3 MB) și, în același timp, 44 de cadre ale rotirii și
  fotografia primei camere; pe o legătură de mobil, poza stătea la coadă după ele. Acum: pe ecran mic se folosesc **copii la
  jumătate de mărime** (`site/img/gd/ai/m/`, ~300 KB; `lite()` în `js/garden.js`), pozele celorlalte case se aduc **din timp**
  (și pe telefon), iar din rotire nu se cere nimic până când poza casei nu e pe ecran; când alegi altă casă, cererile celei dinainte
  se opresc. Măsurat pe un „telefon” de probă la 6 Mbps: poza casei sosea după 14 s, acum în ~1 s (sau pe loc, dacă era adusă din timp).
- **Rotirea pornea în salturi și imaginea era ștearsă.** Acum vine întâi **„pachetul mic”** (`p.bin`: un cadru din două, 768 px,
  un singur fișier, folosit pe măsură ce sosește), deci rotirea are aproape imediat ce arăta la orice unghi; apoi pozele de
  1024 px (refăcute din filmările trecute prin Topaz: mai clare) și, la oprire, cadrul mare. Pe ecran nu se amestecă la întâmplare
  cadre clare cu cadre din pachet (ar pâlpâi).
- **La deschidere, cadrele erau adesea șterse și rămâneau în urma degetului.** Telefonul primește acum cadre **tăiate la partea care
  se vede** (`site/img/st/film/t/`: de două ori mai puține date la aceeași claritate) și pachete mici cu toată povestea. Măsurat la
  6 Mbps: înainte rămânea în urmă cu ~5 cadre și sărea de 20 de ori într-o derulare; acum ține pasul, fără salturi.
- **Dunga închisă de jos, la deschidere** (apărea când se ascundea bara navigatorului): fundalul secțiunii ia acum culoarea părții
  fixe (`--st-edge`).
- Pozele întregi de rezervă ale deschiderii (`f_*.webp`, pentru tablete și Safari) au fost refăcute din cadrele mai clare.
- Fără credite: totul s-a făcut din filmările și imaginile existente.
Reguli care decurg de aici (nu le strica):
- Când se schimbă o imagine `gr_*` sau `pl_*` din `site/img/gd/ai/`, se rulează din nou `python3 surse/ai360/vederi/famedii.py`
  (altfel telefonul arată varianta veche). Când se reface o rotire: `farotire.py … --mici` (face și pozele mici, și pachetul mic) și
  se mărește `p` în `ROTIRI`. Când se reface deschiderea: și `fafilmtel.py` (apoi se mărește `FILM.tel.v` în `js/story.js`).
- Pe telefon, ce e pe ecran are întâietate: nu readuce cererea cadrelor rotirii în același timp cu poza casei și nu scoate
  pachetele mici (ele țin rotirea și deschiderea lipite de deget când legătura e înceată).
- La probe: calculatorul de probă nu are placă video și desenează foarte încet (o trecere de imagine durează acolo secunde), deci
  timpii „până apare pe ecran” măsurați aici nu spun nimic despre un telefon adevărat; se măsoară sosirea din rețea și ce cadru e
  arătat. Probele sunt descrise în `docs/DETALII-TEHNICE.md`, §23. **Nu am putut proba pe un telefon adevărat**: dacă clientul spune
  că tot nu merge bine, cere-i din nou un filmuleț și spune-i pe ce telefon și cu ce internet (Wi-Fi sau date mobile) s-a uitat.

## Cerut pe 17 noiembrie 2026, după-amiază — făcut și publicat
Clientul a filmat ecranul: „când dai în jos, de sus, când deschizi site-ul, nu se mișcă destul de lin… Și când vrei să miști capsula
360, parcă își pierde din calitate… la toate casele… și pe fundal și în spate”. Apoi: „Mai sunt 218.000 de credite. Rezolvă toate
problemele ca să fie cum trebuie.” Ce s-a găsit și ce s-a făcut (pe larg: `docs/DETALII-TEHNICE.md`, §22; `surse/ai360/CITESTE.md`,
partea a șaptea):
- **De ce pierdea calitatea:** cât stai pe loc se vede imaginea mare; la mișcare pagina arăta poze mici (1024 px) sau o copie și mai
  mică. **De ce nu era lină:** fiecare cadru era despachetat pe firul principal al paginii (o ținea în loc câteva sutimi de secundă).
- **Film comprimat** (`site/js/clip.js`, `clip-worker.js`): cadrele rotirilor și ale deschiderii stau acum într-un film (AV1) tăiat
  în bucăți, desfăcut pe un fir separat. În mișcare se văd cadre de **1920 px**; când rotirea se oprește vine cadrul de **2560 px**.
  Merge în Chrome, Edge și Firefox pe calculator; în Safari și pe telefoane rămân pozele separate (mai line ca înainte).
  **Nu readuce** amestecul lung dintre două cadre (dădea imagine dublă) și nici despachetarea din `<img>` (blochează pagina).
- **Toate filmările au fost făcute mai clare** cu Topaz („Rhea”, 2.424 de credite fiecare): 7 rotiri + 4 bucăți ale deschiderii.
- **Rotirea lui X7 a fost refăcută** (cea veche pornea din spatele casei, arăta altfel decât imaginea ei și avea o porțiune lipsă):
  acum pornește din locul vederii, ca la celelalte case, și are în fundal grădina de acum (cu T6 și C20).
- **Rotirea lui T7 a fost refăcută** și ea (cea veche avea dungi maronii pe gazon și grădina veche în fundal).
- Pe o legătură înceată, ce e pe ecran are întâietate: filmul unei case se deschide abia când imaginea vederii e gata, aduce întâi
  bucata de la unghiul vederii, apoi filmul mic, apoi restul; cele aduse „din timp” pentru alte case așteaptă.
- Credite folosite: ≈ 64.100–69.000 (din cele 218.000 anunțate).
- La probe: `node --check fisier.js` nu prinde greșelile din modulele paginii; se verifică o copie `.mjs`.

## Cerut pe 17 noiembrie 2026 (dimineața) — făcut și publicat în aceeași zi
Clientul a trimis patru lucruri și a pus credite la ElevenLabs („gata ai credite”). Cum s-a făcut fiecare și nodurile: `surse/ai360/CITESTE.md`,
partea a șasea. Credite folosite: ≈ 57.100 (din care ≈ 10.900 pe o încercare nereușită la X7).
- **„Nu se mișcă lent deloc”** (deschiderea și rotirea caselor): făcut (vezi mai jos „Mișcarea de la deschidere” și „Rotire reală”;
  refăcut mai temeinic după-amiază, vezi blocul de mai sus).
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
  panouri de 75 mm, tablă maro cu aspect de lemn, ușă dublă din aluminiu cu **geam triplu**. Clientul a fost întrebat cum vrea
  să se numească („C20” e nume de lucru), ce preț de vânzare are (acum „Preț pe ofertă”), dacă ușile dormitoarelor sunt albe (în
  filmuleț au folie albastră) și dacă vrea refăcută rotirea lui X7; a răspuns **„lasă așa”** (17 nov; înțeles ca: rămân „C20”,
  „Preț pe ofertă”, ușile albe, iar rotirea lui X7 nu se reface deocamdată; rotirea lui X7 a fost totuși refăcută după-amiază, când
  clientul a cerut „rezolvă toate problemele” la rotire și a pus credite). Nu-l mai întreba de nume, preț și uși până nu aduce el vorba. Proforma are date sensibile: nu se urcă în git. În imaginea băii,
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
  După orice imagine `gr_*` / `pl_*` schimbată se refac și copiile pentru telefon: `python3 surse/ai360/vederi/famedii.py`.
- **Rotire reală** (cerut pe 15 nov cu filmuleț: „când miști capsula 360 tot așa apare pătrățos”): la rotire pagina arată cadrele
  unei filmări reale (`ROTIRI`). **Gata la toate cele șapte case** (ecran lat; T6 din 16 nov, C20 din 17 nov), făcută cu Runway Aleph 2 din rotirea machetei
  (~13.600 de credite pe casă). 192 de cadre mici + 96 mari pe casă. Rotirea a fost rescrisă pe 16 nov (după trei filmulețe: „nu
  merge lin”, „tot parcă sunt blocaje”): cadrele se cer de lângă unghiul curent, sunt despachetate din timp în afara firului
  principal, pe ecran se trece doar prin cadre gata făcute (dacă netul nu ține pasul, rotirea așteaptă la ultimul cadru, nu sare
  și nu arată macheta), mișcarea se socotește în timp, iar după ce dai drumul alunecă puțin. **Rescrisă încă o dată pe 17 nov** („unele case nu se
  mișcă lent deloc”): imaginea urmărește mereu mâna (dacă exact cadrul unghiului nu e gata, se arată cel mai apropiat care e; din
  toată rotirea se țin copii mici, „schița”; pe calculator se aduc din timp câteva cadre ale fiecărei case). **A treia oară, tot pe
  17 nov** („când o miști își pierde din calitate”, la toate casele): pe calculator, cadrele vin acum dintr-un **film comprimat**
  (`site/js/clip.js`; `v` în `ROTIRI`; fișierele din `img/gd/rot/<casă>/v/`): în mișcare se văd cadre de 1920 px (nu pozele de
  1024 px), la oprire vine cadrul de 2560 px (`l_*.webp`, 96 pe casă); pozele mici `s_*.webp` rămân pentru Safari, telefoane și
  tablete, unde înaintea lor vine „pachetul mic” (`p.bin`, `p` în `ROTIRI`; vezi blocul din 17 nov seara).
  Filmările au fost făcute mai clare cu Topaz („Rhea”). **Rotirea lui X7 a fost refăcută** în aceeași zi, din locul vederii
  (`az0: -58`): nu mai are porțiunea lipsă din spatele casei, iar tot ce ținea de „gol” a fost scos din cod; **și a lui T7** (avea
  dungi maronii pe gazon). La V3 apare „V3” scris
  pe perete în câteva cadre. **Pe ecran îngust (vederea înaltă), la toată grădina și la plan nu există filmare**: acolo imaginea
  rămâne pe loc. Clientul a cerut „Lasă copacii”: copacii rămân în filmări. O rotire se reface cu
  `surse/ai360/vederi/farotire.py` (apoi se mărește `v`).
  Copii: `versiuni/gradina-inainte-treceri-reale/`, `versiuni/gradina-inainte-rotire-noua/`, `versiuni/gradina-inainte-fara-macheta/`,
  `versiuni/inainte-film-comprimat/`.
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
  potrivește doar dacă se refac rotirile (≈13.600 de credite pe casă, plus ≈2.400 pentru Topaz; X7 și T7 au fost refăcute pe 17 nov
  și sunt la zi; au rămas E7, V3 și M9, din care partea nouă se vede puțin). La fel C20: apare
  doar în rotirea ei și în cele două imagini cu toată grădina. Credite folosite
  pentru T6 și grădina mărită: ≈ 37.200 (5 imagini 4K, un retuș, 4 camere, rotirea).
- **Mișcarea de la deschidere** trebuie să rămână lină (clientul a reclamat de trei ori că se poticnește): nu readuce opririle
  camerei între capitole și nu ridica bugetul de pixeli fără să probezi pe un ecran mare. A treia oară (17 nov 2026: „când ai de sus
  în jos… nu se mișcă lent deloc”): filmarea are acum **toate cadrele** (648, `f_0000…f_0647`; înainte unul din două), derularea e
  urmărită cu un arc amortizat (fără smucitură la fiecare treaptă a rotiței), iar imaginea urmărește mereu derularea (se arată cel
  mai apropiat cadru gata; din toată filmarea se țin copii mici, „schița”). Nu rări cadrele și nu readuce așteptarea după cadre
  (`site/js/story.js`, `FILM`; copia dinainte: `versiuni/inainte-e7-scaun-x7-gradina/story.js`). **A patra oară (17 nov, după-amiază:
  „nu se mișcă destul de lin… își pierde din calitate”):** pe calculator filmarea vine acum dintr-un **film comprimat**
  (`FILM.v`, `img/st/film/v/`, `site/js/clip.js`): toate cele 648 de cadre la 1920 px, desfăcute pe un fir separat (pagina nu se
  mai blochează deloc); pozele `f_*.webp` rămân pentru telefoane și Safari, despachetate și ele în afara firului principal.
  Se reface cu `cadrepoveste.py` + `faclip.py` (apoi se mărește `FILM.v`). Copia dinainte: `versiuni/inainte-film-comprimat/`.
  **A cincea oară (17 nov, seara, pe telefon: „nu merge deloc bine”):** telefoanele au acum cadrele lor, tăiate la partea care se
  vede, și pachete mici cu toată povestea (`img/st/film/t/`, `FILM.tel`); vezi blocul din 17 nov seara. Copia dinainte:
  `versiuni/inainte-telefon/`.
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

## Canapeaua din livingul lui T6 (24 nov 2026)
- **Ce a cerut clientul:** în livingul lui T6 canapeaua (și măsuța) arătau „pătrățos”, ca din cuburi.
- **Ce s-a făcut:** `site/img/gd/ai/t6_living.webp` a fost retușată cu `gemini-3-pro-image` pornind chiar de la imaginea de pe site
  (nu de la machetă): s-au schimbat doar canapeaua și măsuța, restul camerei a rămas la loc (potrivire măsurată cu `fix360.py --masoara`:
  deplasare 0). Nod în flux: `snwvyjhF4BiuVaAIMjc2`. Cost: 2.272 de credite. Copia veche: `versiuni/inainte-canapea-t6/`.
- **A doua cerere, aceeași zi („și patul și prosoapele trebuie să aranjăm aici”):** aceeași imagine a mai fost retușată o dată
  (nod `tp3IuD1jl01wataMCRVm`, 2.272 de credite): pat făcut, cu pilotă și perne, noptiere și veioze reale, suport negru cu prosoape.
  Imaginea a venit mutată cu 2 px (din 1024) și a fost adusă la loc cu `fix360.py … 2`.
- **Fișierul se numește acum `t6_living_v3.webp`** (schimbat și în `gradina-data.js`): clientul vedea în continuare imaginea veche
  după reîncărcare, fiindcă navigatorul ține minute bune fișierul cu același nume. **Regulă: când înlocuiești o imagine de pe site,
  dă-i nume nou** (`_v2`, `_v3`…) și schimbă numele în date; altfel clientul vede varianta veche și crede că nu s-a făcut nimic.
- Nici numele nou n-a ajuns: Chrome, la reîncărcare, verifică doar pagina, nu și fișierele `.js` (GitHub le dă cu păstrare 10 minute),
  deci ținea `gradina-data.js` vechi. De aceea pagina cere acum `js/garden.js?v=…` (în `surse/final/parts/gradina.html`), iar
  `garden.js` cere `./gradina-data.js?v=…`. **Regulă: când schimbi `gradina-data.js` sau `garden.js`, mărește `?v=` în ambele locuri**
  și rulează `tools/asambleaza.py`.
- **De știut:** și în livingurile E7, M9 și C20 canapelele sunt cam simple; se pot reface la fel, dacă cere clientul (~2.300 credite bucata).

## Pagina de probă AgroKart (alt proiect al clientului, pe aceeași adresă)
- Stă la https://designdn25-afk.github.io/capsula-media/agrokart/ ; sursa e pe ramura `claude/agrokart-demo` (`agrokart/demo`, făcută cu
  `agrokart/tools/genereaza.py`). `tools/publica_pages.sh` o pune la loc la fiecare publicare a site-ului cu capsule.

## Casele K5 și YK5 (24 nov 2026) — în grădină, publicate; rotirea făcută în aceeași zi (vezi la sfârșitul blocului)
Clientul a trimis o ofertă (PDF, nu se urcă în git: are prețuri de achiziție și date bancare) cu două case: „vreau și casele astea
să le băgăm în grădina aia 3D, tot așa, să pară totul real”. A oprit o dată lucrul („oprește momentan”), apoi: „hai continuă cu grădina”.
- **K5** (nume de lucru): căsuță extensibilă 4,0 × 5,0 × 2,55 m, ~20 m², lamele maro, ușă dublă de sticlă + geam îngust în față, scară
  exterioară pe stânga, terasă pe tot acoperișul cu balustradă de sticlă; înăuntru canapea, pat, televizor (după desenul tehnic; în
  ofertă apare și ca „cafenea”). Model: `site/js/h_k5.js` (camere: Cameră, Terasă). x 15,5 · z 66 · rot −30.
- **YK5** (nume de lucru, „YK-5 modular house”): 9,6 × 3,3 × 3,0 m, 32 m², ramă albă, lamele de lemn, ușă glisantă mare, colț acoperit
  de terasă în stânga; living cu bucătărie, dormitor, baie (**baia nu apare în ofertă: presupunere**). Model: `site/js/h_yk5.js`
  (camere: Living, Bucătărie, Baie, Dormitor). x −15,5 · z 66 · rot 30.
- **Întrebări puse clientului, fără răspuns încă** (nu-l bombarda; întreabă o dată când aduce vorba): K5 cu pat sau cafenea; YK5 are
  baie; numele și prețurile de vânzare (acum „Preț pe ofertă”).
- **Grădina a fost mărită a doua oară**, tot spre intrare (98 → 124 m; `GRADINA`). `site/js/genv.js` are etapa a doua (`extra2`, `VECHI2`):
  tot ce exista a rămas pe loc (verificat: vederile caselor vechi au ieșit neschimbate). T6 și C20 au `sideP` în `gradina-data.js`, ca
  vederea lor de telefon să nu se mute. Vederea „toată grădina” crește cu adâncimea (`view('all')` în `garden.js`). La a treia mărire:
  încă o etapă la fel (`extra3`) și locuri la z = 92.
- **Imagini** (`site/img/gd/ai/`): `gr_all_v2`, `gr_all_p_v2` (toată grădina, nume noi), `gr_k5`, `gr_k5_p`, `gr_yk5`, `gr_yk5_p`, `pl_k5_1`,
  `pl_yk5_1`, `k5_camera`, `k5_terasa`, `yk5_living`, `yk5_bucatarie`, `yk5_baie`, `yk5_dormitor`. Sursele: `surse/ai360/…_src.jpg` și
  `surse/ai360/vederi/…_src.jpg`. Noduri în flux: etichetele încep cu „n2”. Credite: 16 imagini ≈ 40.450 (două camere refăcute:
  terasa și bucătăria ieșiseră recompuse; a doua cerere, „re-texture… WITHOUT changing geometry”, cu obiectele enumerate de la
  stânga la dreapta și fără a doua imagine de referință, a ieșit aliniată).
- **Ce e mai slab:** vederile din afară ale celor două case și terasa lui K5 arată puțin „machetă lustruită” (gazon în dungi, copaci
  rotunzi), mai puțin reale decât T6. Dacă clientul observă: se refac cu o imagine reală ca țintă, ca la `gr_c20_p`.
- **Rotirea e făcută** (clientul a ales „1” = amândouă; 24 nov): Runway Aleph 2 (noduri `WMZtY0FvRqY95tgmFtzV` K5, `f8bcQ0eTDhhjMfDynnfM` YK5;
  13.573 fiecare) + Topaz Rhea (`KVE7d4V0Pz3BxFcVKkbf`, `PwWuD1i2gRNWw6Gd7dyo`; 2.424 fiecare), apoi `farotire.py … --mici`; rânduri în `ROTIRI`
  (`az0` −60 / 60). Total ≈ 32.000 de credite; au rămas ≈ 26.800. **Promptul lui Aleph are cel mult 1000 de caractere** (altfel pică, fără cost).
  **Ce e mai slab:** Aleph pornește de la imaginea de referință, iar vederile `gr_k5` / `gr_yk5` sunt „machetă lustruită”, deci și rotirile
  arată mai puțin real decât la T6 / C20 (gazon neted, copaci rotunzi). Ca să arate real: întâi vederea refăcută cu o imagine reală ca
  țintă (~2.730), apoi rotirea din nou (~16.000 pe casă); doar cu acordul clientului și cu credite. Pe ecran îngust YK5 nu se rotește
  (vederea înaltă), ca la celelalte case. Rotirile caselor vechi nu arată casele noi în fundal.
- **„Este pătrățos” (clientul, aceeași zi, captură din livingul lui YK5 cu macheta):** imaginile reale erau puse și publicate; la el
  macheta s-a văzut cât imaginea camerei încă se încărca (imaginea dinainte e ținută pe ecran cel mult 7 secunde, apoi apărea macheta).
  Acum, într-o cameră cu imagine reală, cât imaginea nu e pe ecran, pânza se ascunde („vălul”, `veil` în `garden.js` și în
  `parts/gradina.html`, cel mult 25 s): se vede fundalul deschis al scenei, nu macheta. Nu scoate vălul.
- `surse/ai360/k5yk5/pune.py` a fost folosit la punere; acum rândurile au și `ai: [...]`, deci `--scoate` nu mai merge (se scot de mână).

## Treceri fără întreruperi între case și camere (25 nov 2026)
Clientul: „mișcarea e prea sacadată… să aloci mai multă memorie grafică… zaparea între case și zone ale caselor să fie mult mai
fluidă, fără întreruperi”. O pagină nu poate cere mai multă memorie plăcii video, dar pagina ținea doar **3 imagini** în memorie
(restul erau despachetate din nou la fiecare întoarcere). Ce s-a schimbat (copia dinainte: `versiuni/inainte-memorie-imagini/`):
- `site/js/pano.js`: imaginile se țin după un **buget de memorie** (calculator 384–512 MB, telefon 144–224 MB; cele mai vechi ies
  primele), fotografiile 360° sunt despachetate în afara firului principal și urcate pe placa video la sosire (`has`, `free` noi).
- `site/js/garden.js`: după ce imaginea camerei e pe ecran, **celelalte camere ale casei se aduc din timp**, una câte una; când mausul
  ajunge pe numele unei case, imaginea ei e despachetată pe loc. `garden.js` cere acum și `./pano.js?v=…` (se mărește la schimbare).
- Probat aici: trecerea între camere nu mai face nicio cerere nouă. **Nu s-a putut proba pe calculatorul clientului**; dacă tot se
  poticnește, cere-i un filmuleț și întreabă unde anume (la rotire, la intrarea în casă, între camere) și pe ce aparat.

## Showroomul virtual AgroKart (25 nov 2026) — publicat
- Clientul a cerut un showroom „ca la Matterport” pentru AgroKart: plimbare 360° printr-o hală, puncte pe fiecare utilaj (motor =
  specificații), sigla și „AgroKart” pe peretele din capăt; apoi „tractoarele separat și excavatoarele separat… în altă cameră”.
- Stă la https://designdn25-afk.github.io/capsula-media/agrokart/showroom.html (ramura `claude/agrokart-demo`: `agrokart/tools/showroom.py`,
  `agrokart/tools/fixsemne.py`, `agrokart/demo/showroom.html`, `demo/img/showroom/s1…s4.jpg`, `demo/vendor/pannellum.*`). Cum s-a făcut,
  ce a rămas mai slab și cum se reface: `agrokart/surse/showroom/CITESTE.md` (pe acea ramură).
- Credite: 6 imagini 360° ≈ 25.450; **au rămas ≈ 1.300** (nu mai ajung nici pentru o imagine: orice refacere cere credite noi).
- **25 nov, a doua cerere (filmuleț cu un tur Matterport al unei hale Volvo):** „cu multe puncte, poți să vezi și pe dedesubt, mult mai
  real, și din cabină, vreau să-mi faci și mie așa”. Făcut fără credite: banda de jos cu pozele tuturor utilajelor (apeși = mergi la
  utilaj) și vederea reală a halei prin ușa camerei excavatoarelor (`fixusa.py`). **Nefăcut:** opriri noi lângă fiecare utilaj, din
  cabină și de dedesubt: fiecare e o imagine nouă (~4.000 de credite), iar creditele s-au terminat (~1.300). I s-a explicat și că la
  Matterport imaginile sunt fotografii reale: cabina și dedesubtul făcute cu AI ar fi inventate (de marcat ca atare); varianta bună e
  cu poze 360° făcute în utilajele lui (o cameră 360° sau telefonul), din care turul se face fără credite. Așteaptă răspunsul lui.

## Configuratorul Modularis (25 nov 2026) — copie cu casa modulară „reală”, publicată
- Clientul are un configurator făcut în ChatGPT (https://modularis-configurator-case.appwithchat.chatgpt.site/) și a cerut: „mult mai
  interactiv… adică să fie mult mai real… restul să rămână la fel, ca omul să poată singur să-și facă configurațiile” (cu filmuleț:
  la casa modulară se schimbă fațada pe fiecare parte, materialul, culoarea, acoperișul, ușile).
- De aici nu se poate schimba site-ul din ChatGPT. S-a făcut o **copie** în `modularis/` (rădăcina proiectului), publicată la
  https://designdn25-afk.github.io/capsula-media/modularis/ . Singura schimbare: casa modulară e acum o scenă 3D adevărată
  (`modularis/viewer-real.js`, three.js local), cu aceleași opțiuni. Clientul: „la casa capsulă nu s-a schimbat nimic” → și Capsula X7
  e acum 3D adevărat (modelul `site/js/x7.js`, copiat în `modularis/x7/`), cu culoarea exterioară, bordura, pardoseala și luminile din
  opțiuni; „Sub finisaje” a rămas desenul vechi. Detalii: `modularis/CITESTE.md`.
- A treia cerere („fă-le pe amândouă mai reale… să nu fie așa de pătrățos, dar configurările să le poată schimba clientul”): fundal și
  iarbă din fotografii (tăiate din imaginile grădinii), dale rotunjite, pietre de călcat, felinar, umbră de contact. La orice schimbare
  se mărește `?v=` în `modularis/index.html`, `app.js`, `studio-preview.js`.
- Fără credite (totul e făcut în cod). Gazda `modularis-configurator-case.appwithchat.chatgpt.site` a fost adăugată la mediul de lucru.
- De știut: în copie nu merge trimiterea cererii de ofertă (serverul e la ChatGPT). Dacă clientul vrea schimbarea în site-ul lui din
  ChatGPT, primește fișierele + un text de dat lui ChatGPT.
- **25 nov, seara:** clientul i-a dat lui ChatGPT arhiva showroomului și e pus pe site-ul lui: https://agrokart-karl-utilaje.appwithchat.chatgpt.site/showroom/ .
  Apoi a cerut: fără excavator la oprirea a doua (făcut fără credite, `fixhala2.py` → `s2_v2.jpg`) și un buton X de ieșire (făcut).
  La fiecare schimbare a showroomului îi trebuie o arhivă mică de actualizare (fișierele schimbate din `showroom/`) + textul pentru ChatGPT.
