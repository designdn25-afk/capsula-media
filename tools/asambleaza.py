#!/usr/bin/env python3
"""Construiește pagina din surse/final/home.base.html + surse/final/parts/<nume>.html.
Fiecare parte are trei blocuri: <!--CSS-->…<!--/CSS-->, <!--HTML-->…<!--/HTML-->, <!--JS-->…<!--/JS-->.
Folosire: python3 tools/asambleaza.py [--only interior,exterior] [--out site/home.html]"""
import sys, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
only = None; out = os.path.join(R, 'site/home.html')
if '--only' in args: only = args[args.index('--only') + 1].split(',')
if '--out' in args: out = os.path.join(R, args[args.index('--out') + 1]) if not os.path.isabs(args[args.index('--out') + 1]) else args[args.index('--out') + 1]
s = open(os.path.join(R, 'surse/final/home.base.html'), encoding='utf-8').read()
css = []; js = []
for name in ['interior', 'exterior', 'zi-noapte']:
    f = os.path.join(R, 'surse/final/parts', name + '.html')
    mark = f'<!--PART:{name}-->'
    if (only and name not in only) or not os.path.exists(f):
        s = s.replace(mark, ''); continue
    t = open(f, encoding='utf-8').read()
    get = lambda k: (re.search(r'<!--' + k + r'-->(.*?)<!--/' + k + r'-->', t, re.S) or [None, ''])[1].strip()
    s = s.replace(mark, get('HTML'))
    css.append(get('CSS')); js.append(get('JS'))
s = s.replace('<!--PARTCSS-->\n', '\n'.join(c for c in css if c) + ('\n' if any(css) else ''))
s = s.replace('<!--PARTJS-->\n', '\n'.join(j for j in js if j) + ('\n' if any(js) else ''))
open(out, 'w', encoding='utf-8').write(s)
print('scris', os.path.relpath(out, R), len(s))
