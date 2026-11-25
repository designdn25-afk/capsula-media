# Configuratorul Modularis — copie de lucru cu casa modulară „reală” (25 nov 2026)

Originalul e făcut de client în ChatGPT: https://modularis-configurator-case.appwithchat.chatgpt.site/ (nu poate fi schimbat de aici).
Acest folder e copia lui, luată fișier cu fișier pe 25 nov 2026, cu o singură schimbare: casa modulară (Modul 32 / Modul 48) nu mai
e desenată plat, ci într-o scenă 3D adevărată (`viewer-real.js` + `vendor/three.module.min.js`): lemn, tablă, fibrociment, șindrilă,
sticlă, terasă, iarbă, cer, umbre. Toate opțiunile din panou merg la fel (vin prin același `config`). Din aceeași zi, și Capsula X7 e 3D adevărat (`x7/x7.js` + `x7/kit.js`, modelul de pe site-ul cu capsule), colorată după opțiuni;
doar vederea „Sub finisaje” a rămas pe `viewer.js`. La orice schimbare se mărește `?v=` în `index.html`, `app.js` și `studio-preview.js`
(altfel navigatorul ține fișierele vechi).
- Legătura: `studio-preview.js` importă `./viewer-real.js` în loc de `./viewer.js`. Atât s-a schimbat în fișierele originale, plus
  căile din `index.html` și `app.js` (din `/…` în `./…`, ca să meargă într-un subfolder) și `noindex`.
- Publicat la https://designdn25-afk.github.io/capsula-media/modularis/ (îl urcă `tools/publica_pages.sh`).
- **Nu merge în copie:** trimiterea cererii de ofertă (`/api/quotes` există doar la ChatGPT). Restul merge.
- Ca să ajungă schimbarea în site-ul din ChatGPT: clientul îi dă lui ChatGPT fișierele `viewer-real.js` și `vendor/three.module.min.js`
  și îi cere să schimbe importul din `studio-preview.js`.
