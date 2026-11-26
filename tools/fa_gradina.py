#!/usr/bin/env python3
"""site/gradina.html = pagina doar cu grădina 3D (secțiunea 04), exact ca pe prima pagină, pentru a fi pusă în alt site ca fereastră
încadrată (iframe). Clientul (26 nov 2026): „dă-mi grădina 3D fix așa cum ai făcut-o, să o dau la chat să o bage în site”. Grădina are
~440 MB și ~2.900 de fișiere (imagini, rotiri), deci nu se dă ca arhivă: rămâne găzduită aici și se încadrează.
   python3 tools/fa_gradina.py        (o rulează și tools/publica_pages.sh)"""
import os, re, subprocess, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); out = os.path.join(R, 'site/gradina.html')
subprocess.run([sys.executable, os.path.join(R, 'tools/asambleaza.py'), '--only', 'gradina', '--out', 'site/gradina.html'], check=True, stdout=subprocess.DEVNULL)
s = open(out, encoding='utf-8').read()
s = re.sub(r'<title>.*?</title>', '<title>Grădina cu case · Case Capsulă</title>', s, count=1, flags=re.S)
css = '''<style id="doar-gradina">
html,body{background:#f4f5f2}
body.doar-gd #gradina{padding-top:clamp(16px,3vh,36px);padding-bottom:16px}
body.doar-gd #gradina a[href="#tur"]{display:none!important}
</style>'''
js = '''<script>/* pagina doar cu grădina: tot ce nu e pe drumul de la <body> la #gradina se ascunde */
(function(){var g=document.getElementById('gradina');if(!g)return;document.body.classList.add('doar-gd');
for(var e=g;e&&e!==document.body;e=e.parentElement){var p=e.parentElement;if(!p)break;Array.prototype.forEach.call(p.children,function(c){if(c!==e&&!/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(c.tagName))c.style.setProperty('display','none','important')})}
/* anunță pagina-gazdă cât de înaltă e grădina, ca fereastra încadrată să se potrivească (fără bară de derulare dublă) */
function h(){try{parent.postMessage({casecapsulaGradina:Math.ceil(document.documentElement.scrollHeight)},'*')}catch(_){}}
if(window.ResizeObserver)new ResizeObserver(h).observe(document.body);addEventListener('load',h);setTimeout(h,1500);})();</script>'''
assert '</head>' in s and '</body>' in s
s = s.replace('</head>', css + '\n</head>', 1); i = s.rindex('</body>'); s = s[:i] + js + '\n' + s[i:]
open(out, 'w', encoding='utf-8').write(s); print('scris site/gradina.html', len(s))
