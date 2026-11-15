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
- **Titlurile mari sunt cu serife** (Cormorant Garamond, cuvântul auriu în italic), ca în filmulețul de referință. Logo-ul și
  etichetele mici rămân în Unbounded / Manrope.
- **Grădina cu case model (secțiunea 04, din 14 nov 2026)**: o grădină 3D în care apeși pe o casă, intri în ea (acoperișul se
  ridică) și vezi camerele, m², dimensiunile și prețul. Cerința clientului: „o grădină frumoasă… clientul să meargă frumos prin
  fiecare casă, apasă pe casă și să poată intra în casă, să vadă configurația, metri pătrați, tot, ca un fel de tur 3D”.
  **Acum casele sunt exemple din catalog** (X7, T7, E7, V3, M9), cu datele adevărate din `window.CAT`. Clientul a spus că va
  trimite casele model pe care le-a comandat („nu toate casele alea din video le-am luat… o să-ți dau eu casele model”):
  se schimbă în `site/js/gradina-data.js`, iar modelul 3D al fiecărei case se face după `surse/final/CASE-3D.md`.
  Machetele sunt orientative (scrie și sub scenă); nu inventa dotări, prețuri sau suprafețe.
  **A doua cerere (14 nov 2026):** „vreau să pară mult mai real… arată prea ca un desen animat… aș vrea direct chiar să intre
  în casă”. De aceea: grădina are cer, iarbă, copaci și materiale realiste (`js/real.js`, `js/gscene.js`, `js/genv.js`), iar
  „Intră în casă” te duce **în interior, la nivelul ochilor** (te uiți în jur, treci dintr-o cameră în alta). În **X7 se văd
  fotografiile reale 360° din showroom** (`site/p360`), aliniate cu macheta; celelalte case arată interiorul 3D până primim
  poze 360° din ele. „Plan” (acoperișul ridicat) a rămas ca a doua vedere. Varianta dinainte (machetă simplă, doar acoperișul
  ridicat) e în `versiuni/gradina-macheta/`.
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
                         în interiorul caselor și imaginile realiste ale vederilor din afară), furn.js (mobilier, terase), h_<casă>.js (câte o casă)
  vendor/                three.js 0.170 ținut local (nu se încarcă nimic de pe alte site-uri)
  img/                   imaginile; img/ext (exterior), img/int (interior), img/vid (clipuri .mp4 + postere .webp),
                         img/st și img/gd (imaginile de rezervă pentru deschidere și grădină, când 3D-ul nu poate porni)
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
- Linkurile publice vechi („oricine are linkul”), cu variantele dinainte: V2 https://claude.ai/artifact/XA6dNq77wKbmrcDCdum9Sm ·
  V1 https://claude.ai/artifact/Fj56xUcscpsXGz7k8tMrcV (neschimbate; de actualizat doar după aprobarea clientului).

Linkurile acestea se pot actualiza doar dintr-o conversație pe claude.ai. Din Claude Code publici folderul
`site/` pe un hosting static (de exemplu Netlify, Vercel, GitHub Pages sau serverul casecapsula.ro).

## Date folosite pe site
- WhatsApp: +40 731 166 070 (https://wa.me/40731166070). Formularul de contact trimite mesajul pe WhatsApp.
- Showroom: Calea București nr. 41, 077055 Ciorogârla, Ilfov. Extindere regională: Trakia St. 12, Varna (BG).
- TikTok: @multimester. X7: 36,5 m² utili, 39 m² construiți, 11,5 × 3,4 m, h 3,45 m, 39.500 € cu TVA, rate prin TBI Bank.
- PDF-uri: https://casecapsula.ro/docs/oferta-capsula-x7-v2.pdf și https://casecapsula.ro/docs/prezentare-tehnica-x7.pdf

## Ce mai e de făcut (la 14 noiembrie 2026)
- **Casele adevărate pentru grădină**: de cerut clientului lista caselor model comandate, cu poze / planuri, dimensiuni și
  preț. Până atunci grădina arată exemple din catalog. De întrebat și cum vrea să arate grădina (alei, flori, lămpi).
- **Interiorul caselor, „real” cu AI** (cerut de client pe 14 nov 2026: „înăuntru… arată tot pătrățos, vreau să faci real, ca pe
  video”; a aprobat explicit trimiterea imaginilor la ElevenLabs și consumul de credite pentru toate casele): din fiecare cameră a
  caselor T7, E7, V3 și M9 s-a scos o imagine 360° a machetei și a fost transformată în imagine realistă (19 imagini, în
  `site/img/gd/ai/`, legate în `site/js/gradina-data.js` prin `ai: [...]`). Pe site apar cu mențiunea „Vizualizare realizată cu AI,
  orientativă” — **nu scoate mențiunea** (generatorul schimbă detalii de mobilier și finisaje). Cum se refac: `surse/ai360/CITESTE.md`.
  Dacă se schimbă forma sau mobila unei case, imaginile ei trebuie refăcute (altfel nu se mai potrivesc cu macheta). X7 rămâne cu
  fotografiile reale. Un film de prezentare făcut la fel (animație → video cu AI) nu s-a făcut încă; cere din nou acordul pentru credite.
- **Vederile din afară, „reale” cu AI** (cerut pe 14–15 nov 2026: grădina de sus și fiecare casă din afară să arate real, cu hale în
  jur, „să vadă că suntem în România, în Ciorogârla”; „folosește ambele, și Higgsfield, și ElevenLabs”): în jurul grădinii sunt hale și
  o curte de asfalt, iar fiecare vedere din afară poate primi o imagine realistă făcută din același loc (`VEDERI` în
  `site/js/gradina-data.js`), care apare peste macheta 3D ziua, cu mențiunea „Vizualizare realizată cu AI, orientativă” (**nu o scoate**).
  **Gata doar X7 pe ecran lat** (calculator, tabletă, panoul îngust). Celelalte 11 (grădina de sus, X7 pe telefon, T7, E7, V3, M9) sunt
  pregătite în ElevenLabs, dar **s-au terminat creditele** (au rămas 270): fie clientul mai pune ~25.000 de credite și se pornesc
  dintr-o comandă, fie le generează el în Higgsfield (conectorul Higgsfield din Claude **nu poate genera**, doar citește contul).
  Pagina făcută pentru el, cu pozele și textele de lipit în Higgsfield: https://claude.ai/artifact/5DRE5A9xasjCnU9aXFuMQR
  Pașii, nodurile pregătite și cifrele: `surse/ai360/CITESTE.md`, partea a doua. Dacă se mută o casă, se schimbă grădina sau locul
  camerei, imaginile trebuie refăcute.
- **Rotire reală și seară reală** (cerut pe 15 nov 2026, cu filmuleț: „când miști capsula 360 tot așa apare pătrățos… și pe zi și pe
  noapte”; poza reală pe loc îi place): pagina **știe deja** să arate, la rotire, cadrele unei filmări reale în locul machetei
  (`ROTIRI` în `site/js/gradina-data.js`) și imagini de seară (al șaselea element din `VEDERI`), dar **nu există încă nici cadre, nici
  imagini de seară**: contul ElevenLabs avea 0 credite. Sunt pregătite acolo, nepornite: 11 imagini de zi (~25.000 credite), 12 de
  seară (~27.000) și proba de rotire pentru X7 (~8.150 pe rotire cu Kling O3, ~13.700 cu Kling 4; filmările 3D ale tuturor
  celor cinci case sunt deja atașate acolo). Clientul a întrebat cum cumpără
  credite (ElevenLabs → Subscription → Pay As You Go sau abonament mai mare, pe **același cont** legat în Claude). Când apar: întâi
  imaginile de zi, apoi seara, apoi **o singură rotire de probă** și abia după aceea restul. Pași, noduri, prețuri:
  `surse/ai360/CITESTE.md`, părțile a doua și a treia.
- **Mișcarea de la deschidere** trebuie să rămână lină (clientul a reclamat de două ori că se poticnește): nu readuce opririle
  camerei între capitole și nu ridica bugetul de pixeli fără să probezi pe un ecran mare.
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
