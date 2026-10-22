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
- Pagina principală are **două variante de hero**, cu comutatorul „Varianta 1 / Varianta 2”:
  - **V1**: poza reală a capsulei, cu efect 3D (straturi și parallax). Încadrarea pe calculator e **aprobată**.
  - **V2**: construcția capsulei „ca un video” (teren gol → structură → panouri → capsula → seara).
    Rulează singură, **fără scroll**.
    Din 22 oct 2026 e randată **în 3D (WebGL)**: camera se rotește lent în jurul capsulei, structura și panourile se
    construiesc de jos în sus cu o linie aurie, seara luminile se aprind după ce se întunecă cerul (la cererea clientului:
    „O refac în 3D”). Versiunea dinainte: `versiuni/home-inainte-v2-3d/`.
- Sub hero, prima pagină are efecte 3D (apariție în perspectivă, carduri care se înclină). Versiunea dinainte: `versiuni/home-inainte-3d/`.
- Turul virtual 360° a fost pus pe pauză de client („hai să lăsăm momentan turul 360”).

## Structura
```
site/                    tot ce se publică
  home.html              PAGINA PRINCIPALĂ (pornește cu V2). Sursa unică: CSS, JS, Pannellum, turul 360, totul inline
  home_v1.html           generată din home.html (pornește cu V1); nu o edita de mână
  complet.html           pagina lungă: configurator, specificații, finanțare, investitori, legal, livrare, FAQ
  index.html             copie identică a complet.html
  img/                   imaginile folosite de pagini
  p360/                  panoramele turului: <punct>_{s,m,l,x}.webp și miniaturile t_<punct>.jpg
tools/make_v1.py         regenerează site/home_v1.html din site/home.html
tools/test_pagini.js     capturi de ecran la 5 dimensiuni și erori JavaScript (Playwright)
docs/DETALII-TEHNICE.md  cum funcționează hero V1, hero V2 și turul 360; istoricul proiectului
surse/                   scripturi și imagini sursă (doar referință, nu se publică)
versiuni/                versiuni salvate la cererea clientului
istoric/                 copii vechi ale paginilor, făcute înainte de schimbările mari
```

## Flux de lucru
1. Previzualizare locală. Pagina trebuie deschisă prin server, altfel turul 360 nu încarcă panoramele:
   `cd site && python3 -m http.server 8765`, apoi http://localhost:8765/home.html (V2) sau
   http://localhost:8765/home_v1.html (V1). `#v1` sau `#v2` la finalul adresei alege varianta.
2. Editezi doar `site/home.html` (și `site/complet.html` pentru pagina lungă).
3. După orice modificare în home.html rulezi `python3 tools/make_v1.py`.
4. Verifici vizual cu serverul pornit: `node tools/test_pagini.js`
   (prima dată: `npm i -D playwright && npx playwright install chromium`).
   Dimensiunile obligatorii sunt panou îngust 506×506, telefon 390×844, tabletă 820×1180, laptop 1440×900
   și desktop 1920×960. Clientul se uită des la site în panoul lateral îngust din aplicația Claude.
5. Fișierele de pe alte site-uri nu se încarcă în pagini: totul stă local în `site/img`.
   Excepții acceptate: Google Fonts (Manrope, Unbounded), linkurile EN/BG și PDF-urile de pe casecapsula.ro.

## Unde e publicat acum
Demo-ul e publicat ca pagini Claude publice („oricine are linkul”):
- Varianta 2 (pagina principală): https://claude.ai/artifact/XA6dNq77wKbmrcDCdum9Sm
- Varianta 1: https://claude.ai/artifact/Fj56xUcscpsXGz7k8tMrcV

Linkurile acestea se pot actualiza doar dintr-o conversație pe claude.ai. Din Claude Code publici folderul
`site/` pe un hosting static (de exemplu Netlify, Vercel, GitHub Pages sau serverul casecapsula.ro).

## Date folosite pe site
- WhatsApp: +40 731 166 070 (https://wa.me/40731166070). Formularul de contact trimite mesajul pe WhatsApp.
- Showroom: Calea București nr. 41, 077055 Ciorogârla, Ilfov. Extindere regională: Trakia St. 12, Varna (BG).
- TikTok: @multimester. X7: 36,5 m² utili, 39 m² construiți, 11,5 × 3,4 m, h 3,45 m, 39.500 € cu TVA, rate prin TBI Bank.
- PDF-uri: https://casecapsula.ro/docs/oferta-capsula-x7-v2.pdf și https://casecapsula.ro/docs/prezentare-tehnica-x7.pdf

## Ce mai e de făcut (la 22 octombrie 2026)
1. ~~complet.html și index.html în tema veche~~ — **făcut pe 22 oct 2026**: au primit blocul „TEMA ALBĂ” din home.html
   și formularul alb. Copia în tema închisă e în `versiuni/complet-tema-inchisa/`. Hero-ul lor (poza cu derulare) a rămas la fel.
   Atenție: complet.html are încă secțiunea `cum-cumperi` („De la prima vizită la casa ta”), scoasă doar din home.html. De întrebat clientul.
2. Datele firmei din subsol: „Denumire firmă SRL · CUI ____ · Nr. Reg. Com. ____ (de completat)” (home și complet)
   și intervalul „de la ____ € la ____ €” din complet.html. Trebuie cerute clientului.
3. Turul 360 (în pauză). Clientului nu-i plac tranzițiile dintre puncte. A cerut mai multe puncte în living și
   dormitor și unul singur în baie. Acum sunt 15 puncte: living 7, dormitor 3, baie 1.
4. V1 pe calculator: în stânga jos, sub titlu, se vede o îmbinare veche a pavajului (era și în varianta aprobată).
   Se repară doar dacă cere clientul.
5. Site-ul e doar în română. EN și BG din meniu duc la casecapsula.ro/en și casecapsula.ro/bg.
6. Hosting și domeniu pentru varianta finală.
