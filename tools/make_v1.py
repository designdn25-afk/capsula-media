#!/usr/bin/env python3
"""Generează site/home_v1.html din site/home.html.

home_v1.html este aceeași pagină, doar că pornește cu Varianta 1 (hero-ul cu poza reală).
Rulează scriptul după ORICE modificare în home.html:

    python3 tools/make_v1.py
"""
from pathlib import Path

site = Path(__file__).resolve().parent.parent / "site"
src = site / "home.html"
dst = site / "home_v1.html"

text = src.read_text(encoding="utf-8")
v2_body = '<body class="v2" data-var="2">'
v1_body = '<body data-var="1">'

if v2_body not in text:
    raise SystemExit(f'Nu găsesc {v2_body!r} în {src}. A fost schimbat tagul <body>?')

dst.write_text(text.replace(v2_body, v1_body, 1), encoding="utf-8")
print(f"OK: {dst.relative_to(site.parent)} a fost regenerat din home.html")
