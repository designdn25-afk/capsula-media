#!/usr/bin/env python3
"""Scoate din primul <style> al unei pagini regulile CSS care țintesc doar clase/id-uri ce nu mai apar nicăieri
în pagină (nici în HTML, nici în scripturi). Folosire: python3 tools/css_mort.py site/home.html [--scrie]"""
import re, sys
p = sys.argv[1]; write = '--scrie' in sys.argv
s = open(p, encoding='utf-8').read()
a = s.index('<style>') + len('<style>'); b = s.index('</style>', a)
css = s[a:b]
rest = s[:a] + s[b:]
rest_nocss = re.sub(r'<style[^>]*>.*?</style>', '', rest, flags=re.S)
# fișiere suplimentare care pot folosi clasele (ex. părțile asamblate): --cu f1,f2
if '--cu' in sys.argv:
    for f in sys.argv[sys.argv.index('--cu')+1].split(','):
        rest_nocss += open(f, encoding='utf-8').read()
def used(tok):
    return re.search(r'(?<![\w-])' + re.escape(tok) + r'(?![\w-])', rest_nocss) is not None
def sel_dead(sel):
    toks = re.findall(r'[.#]([A-Za-z_][\w-]*)', re.sub(r'url\([^)]*\)', '', sel))
    return any(not used(t) for t in toks)
removed = []
def process(block):
    out = []; i = 0; n = len(block)
    while i < n:
        j = block.find('{', i)
        if j < 0: out.append(block[i:]); break
        head = block[i:j]
        # găsește acolada pereche
        d = 0; k = j
        while k < n:
            if block[k] == '{': d += 1
            elif block[k] == '}':
                d -= 1
                if d == 0: break
            k += 1
        body = block[j + 1:k]
        h = head.strip()
        lead = head[:len(head) - len(head.lstrip())]
        if h.startswith('@media') or h.startswith('@supports'):
            inner = process(body)
            if inner.strip(): out.append(lead + h + '{' + inner + '}')
            else: removed.append(h + ' {gol}')
        elif h.startswith('@'):
            # @keyframes etc.: păstrează dacă numele e folosit în CSS rămas sau în pagină
            out.append(head + '{' + body + '}')
        else:
            # comentarii în fața selectorului
            cm = ''.join(re.findall(r'/\*.*?\*/', h, flags=re.S)); hs = re.sub(r'/\*.*?\*/', '', h, flags=re.S).strip()
            sels = [x.strip() for x in hs.split(',') if x.strip()]
            keep = [x for x in sels if not sel_dead(x)]
            if not keep:
                removed.append(hs[:90]); out.append(lead + (cm + '\n' if cm else ''))
            elif len(keep) < len(sels):
                removed.append('(parțial) ' + ','.join(x for x in sels if x not in keep)[:90])
                out.append(lead + (cm + '\n' if cm else '') + ','.join(keep) + '{' + body + '}')
            else:
                out.append(head + '{' + body + '}')
        i = k + 1
    return ''.join(out)
new = process(css)
# keyframes nefolosite
for m in re.findall(r'@keyframes\s+([\w-]+)', new):
    if not re.search(r'(?<![\w-])' + re.escape(m) + r'(?![\w-])', re.sub(r'@keyframes\s+' + re.escape(m), '', new)) and not used(m):
        new = re.sub(r'@keyframes\s+' + re.escape(m) + r'\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}', '', new); removed.append('@keyframes ' + m)
print(f'reguli scoase: {len(removed)}; CSS {len(css)} -> {len(new)} caractere')
for r in removed: print('  -', r)
if write:
    open(p, 'w', encoding='utf-8').write(s[:a] + new + s[b:]); print('scris')
