# python3 rects.py  -> calculează, pentru fiecare vedere din afară, cât trebuie să cuprindă imaginea (în tangente) ca să acopere
# ecranele obișnuite (calculator, tabletă, panou îngust, telefon), după aceleași reguli ca js/garden.js (measure, pvOf, unghiul de vedere).
# Citește locuri.json, scrie cadre_calc.json. Dacă se schimbă fișa casei sau regulile din garden.js, se schimbă și aici.
import json, math
V = json.load(open(__file__.rsplit('/', 1)[0] + '/locuri.json'))
desk = [(1280,720),(1366,768),(1440,900),(1536,864),(1680,1050),(1920,960),(1920,1080),(2560,1300),(2560,1440),(1024,768),(1180,820),(3440,1440),(1100,700)]
small = [(506,506),(506,800),(600,900),(820,1180),(768,1024),(700,560),(880,600)]
phone = [(390,844),(360,640),(375,667),(412,915),(430,932),(360,780)]
RAT = {'21:9':21/9,'16:9':16/9,'3:2':1.5,'4:3':4/3,'5:4':1.25,'1:1':1,'4:5':.8,'3:4':.75,'2:3':2/3,'9:16':9/16}
TARGETS = [(w, h, [0]) for (w, h) in desk] + [(506,506,[180,195]), (506,800,[205,235]), (600,900,[210,240]), (820,1180,[240]), (768,1024,[240]), (390,844,[205,235]), (360,640,[180,200]), (375,667,[185,205]), (412,915,[205,235]), (430,932,[205,235]), (360,780,[205,235])]
def stage(vw, vh):
    if vw < 900: return vw - 20, min(760, max(500, .86 * vh))
    return min(1640, vw - 32), min(880, max(480, .84 * vh))
BY = {}
def need(st, vw, vh, house, cardH):
    W, Hh = stage(vw, vh); x0 = 0; y0 = 0; y1 = Hh - 64
    if house:
        if W >= 900: x0 = 368
        else: y0 = 46; y1 = max(y0 + 120, Hh - cardH - 70)
    fW = W - x0; fH = y1 - y0; mP = min(1, max(0, (1.25 - fW / fH) / .5)); ox = (x0 + W) / 2 / W - .5; oy = (y0 + y1) / 2 / Hh - .5
    A = st['fh'] / 2 / st['dist']; B = st['fw'] / 2 / st['dist']; asp = W / Hh
    th = min(math.tan(math.radians(42)), max(A * Hh / fH, B / asp * W / fW))
    X = lambda px: ((px / W) * 2 - 1 - 2 * ox) * th * asp
    Y = lambda py: (1 - 2 * py / Hh + 2 * oy) * th
    if house and W < 900: r = [X(0), X(W), Y(y1 + 10), Y(0)]
    else: r = [X(0), X(W), Y(Hh), Y(0)]
    fit = min(fH / st['fh'], fW / st['fw'])
    return fit, r, 2 * math.degrees(math.atan(th)), (W, Hh)
out = {}
for st in V:
    house = st['k'] != 'all'; U = None; rows = []
    plan = '#' in st['k']   # vederea „Plan” (acoperișul ridicat): doar ecran lat
    if plan and st['pv']: continue
    for (vw, vh, cards) in TARGETS:
        if plan and vw < 900: continue
        for cardH in (cards if vw < 900 and house else [0]):
            fit, r, fov, sz = need(st, vw, vh, house, cardH)
            other = [o for o in V if o['k'] == st['k'] and o['pv'] != st['pv']][0]; fo = need(other, vw, vh, house, cardH)[0]
            k = .8 if sz[0] >= 900 else 1
            pick = 1 if (fo if st['pv'] == 0 else fit) * k > (fit if st['pv'] == 0 else fo) else 0
            if pick != st['pv']: continue
            if fov > 76: print('      (prea lat, se lasă)', vw, vh, cardH, round(fov)); continue
            rows.append((vw, vh, [round(v, 3) for v in r], round(fov, 1)))
            U = r[:] if U is None else [min(U[0], r[0]), max(U[1], r[1]), min(U[2], r[2]), max(U[3], r[3])]
    w = U[1] - U[0]; h = U[3] - U[2]; a = w / h
    print(st['k'], st['pv'], 'union', [round(v, 3) for v in U], 'asp %.2f' % a, 'n', len(rows), 'fov max %.0f' % max(r[3] for r in rows), ' '.join(sorted(set('%dx%d' % (r[0], r[1]) for r in rows if r[0] < 1200))))
    # proporția permisă cea mai apropiată; dreptunghiul se lărgește până la ea, cu 4% margine
    m = .04; U = [U[0] - w * m, U[1] + w * m, U[2] - h * m, U[3] + h * m]; w = U[1] - U[0]; h = U[3] - U[2]; a = w / h
    name, ra = min(RAT.items(), key=lambda kv: abs(math.log(kv[1] / a)))
    if ra > a: d = (h * ra - w) / 2; U[0] -= d; U[1] += d
    else: d = (w / ra - h) / 2; U[2] -= d; U[3] += d
    print('     ->', name, [round(v, 3) for v in U])
    out[st['k'] + str(st['pv'])] = {'r': [round(v, 3) for v in U], 'ratio': name}
json.dump(out, open(__file__.rsplit('/', 1)[0] + '/cadre_calc.json', 'w'))
