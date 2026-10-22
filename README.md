# Capsula România — site demo

Site-ul nou pentru casecapsula.ro: HTML, CSS și JavaScript, fără instalări speciale.

## Cum continui în Claude Code
- **Aplicația Claude pe calculator**: tabul **Code** → **+ New session** → Environment **Local** →
  la **Project folder** alegi folderul `capsula-romania` → scrii ce vrei să schimbi.
- **Terminal**: `cd capsula-romania` și apoi `claude`.
- **Claude Code pe web (claude.ai/code)**: are nevoie de proiect pe GitHub. Urcă folderul într-un repository și pornește de acolo.

Claude Code citește singur fișierul `CLAUDE.md` din acest folder. Acolo sunt regulile, structura și ce mai e de făcut.

## Cum vezi site-ul pe calculator
```
cd site
python3 -m http.server 8765
```
Apoi deschizi în browser:
- http://localhost:8765/home.html (pagina principală, Varianta 2)
- http://localhost:8765/home_v1.html (Varianta 1)

Nu deschide fișierele cu dublu-click: turul 360 merge doar prin server.

## Publicare
Pui conținutul folderului `site/` pe orice hosting static (Netlify, Vercel, GitHub Pages sau serverul casecapsula.ro).
