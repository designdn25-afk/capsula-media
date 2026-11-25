#!/bin/sh
# Publică folderul site/ pe GitHub Pages (ramura gh-pages): https://designdn25-afk.github.io/capsula-media/
# Fișierele vechi nefolosite (home_v1.html, hero_*, x7s_frame, x7s_lot) și paginile de probă (_t_*.html) nu se publică.
# Folosire (din rădăcina proiectului): sh tools/publica_pages.sh
set -eu
ROOT=$(pwd)
python3 tools/asambleaza.py
TMP=$(mktemp -d)
cp -r site/. "$TMP/"
cd "$TMP"
rm -f home_v1.html img/hero_far_* img/hero_near_* img/hero_glass.png img/x7s_frame.webp img/x7s_lot.webp _t_*.html
find . -name __pycache__ -prune -exec rm -rf {} +
touch .nojekyll
# Pagina de probă AgroKart stă pe aceeași adresă, în folderul agrokart/ (sursa: ramura claude/agrokart-demo, agrokart/demo).
# Se pune la loc la fiecare publicare, altfel dispare de pe link.
if git -C "$ROOT" fetch -q origin claude/agrokart-demo 2>/dev/null; then
  git -C "$ROOT" archive FETCH_HEAD agrokart/demo | tar -x && mv agrokart/demo _ak && rm -rf agrokart && mv _ak agrokart
fi
# Copia configuratorului Modularis (folderul modularis/ din rădăcina proiectului) stă tot pe aceeași adresă, în modularis/.
[ -d "$ROOT/modularis" ] && cp -r "$ROOT/modularis" modularis && rm -f modularis/CITESTE.md
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$ROOT" log -1 --format=%an)" -c user.email="$(git -C "$ROOT" log -1 --format=%ae)" \
  commit -q -m "Site Capsula România pentru GitHub Pages ($(git -C "$ROOT" rev-parse --short HEAD))"
git push -q -f "$(git -C "$ROOT" remote get-url origin)" gh-pages
echo "Publicat. Adresa: https://designdn25-afk.github.io/capsula-media/ (GitHub o actualizează în 1–2 minute)"
