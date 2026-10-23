# Capsula România — site demo nou (casecapsula.ro)

Site static (HTML + CSS + JavaScript, fără framework și fără build) pentru Capsula România:
case capsulă și case modulare, cu modelul X7 expus în showroom-ul din Ciorogârla (Ilfov).
Conținutul vine de pe casecapsula.ro. Proiectul a fost început într-o conversație Claude (claude.ai)
și mutat aici pe 22 octombrie 2026. Detaliile tehnice și istoricul complet sunt în `docs/DETALII-TEHNICE.md`.

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
- **Deschiderea site-ului = doar capsula X7 seara** (`img/x7s_night.webp`), cu o cameră 3D lentă (WebGL + harta de adâncime).
  Cerința clientului (22 oct 2026): „vreau să rămână doar așa partea pe noapte când se deschide site-ul”.
  Variantele vechi V1 / V2 (poza 3D de zi, construcția „ca un video”) și comutatorul lor au fost **scoase**;
  copiile sunt în `versiuni/inainte-site-final/` și `versiuni/home-inainte-v2-3d/`.
- Sub hero, prima pagină are efecte 3D (apariție în perspectivă, carduri care se înclină). Versiunea dinainte: `versiuni/home-inainte-3d/`.
- Turul virtual 360° a fost pus pe pauză de client („hai să lăsăm momentan turul 360”).

## Structura
```
site/                    tot ce se publică
  home.html              PAGINA PRINCIPALĂ — GENERATĂ, nu o edita de mână (vezi mai jos)
  index.html             copie identică a home.html (generată odată cu ea)
  complet.html           pagina lungă: configurator, specificații, finanțare, investitori, legal, livrare, FAQ (se editează direct)
  home_v1.html           veche (varianta V1), nefolosită și nelegată; nu se publică
  img/                   imaginile; img/ext (exterior), img/int (interior), img/vid (clipuri .mp4 + postere .webp)
  p360/                  panoramele turului: <punct>_{s,m,l,x}.webp și miniaturile t_<punct>.jpg
surse/final/home.base.html   SURSA paginii principale: tot în afară de cele 3 secțiuni noi (hero, caracteristici, model,
                             tur, la comandă, galerie, contact, subsol, CSS/JS comun, Pannellum)
surse/final/parts/           secțiunile noi: interior.html, exterior.html, zi-noapte.html (fiecare cu blocurile CSS/HTML/JS)
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

Ordinea primei pagini: hero de noapte (#top) → 01 Interior (plimbare prin camere, cu planul 3D) → caracteristici →
02 Exterior (ocolul capsulei, carusel 3D + hartă) → 03 Zi și seară (linie aurie) → 04 Modelul X7 → 05 Tur 360° →
06 Capsule la comandă → 07 Galerie („De ce noi”) → 08 Tot ce mai vrei să știi → 09 Contact → subsol.

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
4. Fișierele de pe alte site-uri nu se încarcă în pagini: totul stă local în `site/img`.
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

## Ce mai e de făcut (la 22 octombrie 2026, după site-ul final)
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
