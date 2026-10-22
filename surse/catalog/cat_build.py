import json,base64,re,os
def uri(n):
    p='mod/'+n+'.jpg'
    return 'data:image/jpeg;base64,'+base64.b64encode(open(p,'rb').read()).decode() if os.path.exists(p) else None
B='1 dormitor · 1 living · 1 baie'
BB=B+' · balcon'
S2='1 dormitor + baie sau living + baie'
M=[
 # cod, serie, dim, suprafata, compartimentare, descriere, pret
 ('X7','X','11,5 × 3,4 × 3,45 m',39,BB,'Modelul nostru best-seller, cu vitraje mari pe ambele capete. Îl găsești în showroom-ul din Ciorogârla.','39.500 €'),
 ('X5','X','8,5 × 3,4 × 3,45 m',29,BB,'Varianta mai compactă a lui X7, cu același design și balcon pe capăt.',None),
 ('M9','M','Parter 11,5 × 3,4 × 3,45 m · Etaj (8,3 + 2,4) × 3,3 × 3,45 m',74.5,'2 dormitoare · 1 living · 1 baie · balcon','Casă capsulă pe două niveluri, cu terasă la etaj și scară exterioară. Pentru familie sau pentru un apartament turistic premium.',None),
 ('M7','M','Parter 11,5 × 3,3 × 3,3 m · Etaj 8,5 × 3,3 × 3,3 m',66,'2 dormitoare · 1 living · 1 baie · balcon','Două volume suprapuse, cu terasă mare la etaj și fațadă vitrată. Dimensiunile se pot personaliza.',None),
 ('V11','V','11,5 × 3,3 × 3,3 m',38,BB,'Vitraj panoramic pe colțuri și balcon cu parapet de sticlă.',None),
 ('V9','V','11,5 × 3,3 × 3,3 m',38,BB,'Design cu accente portocalii, vitraje pe ambele capete și luminator în tavan.',None),
 ('V8','V','9,6 × 3,3 × 3,3 m',32,'2 dormitoare · 1 baie','Două dormitoare la capete, cu baia la mijloc: potrivit pentru două cupluri sau pentru închiriere.',None),
 ('V7','V','7,0 × 3,3 × 3,3 m',23,BB,'Capsulă compactă, cu un capăt complet vitrat și balcon.',None),
 ('V6','V','8,5 × 3,3 × 3,3 m',28,BB,'Accente portocalii, luminator în tavan și balcon cu vedere.',None),
 ('V5','V','8,8 × 3,3 × 3,3 m',29,B,'Formă de tunel cu fereastră rotundă: arată foarte bine grupată într-un glamping.',None),
 ('V3','V','6,4 × 3,3 × 3,3 m',21,BB,'Formă de căsuță cu acoperiș în două ape, luminator mare și terasă.',None),
 ('V2','V','5,6 × 3,3 × 3,3 m',18.5,S2,'Cea mai mică din seria V: un studio cu un capăt vitrat.',None),
 ('PX7','PX','11,5 × 3,3 × 3,3 m',38,BB,'Linii curbe pe vitraje și luminator în tavan. Design futurist.',None),
 ('PX5','PX','8,5 × 3,3 × 3,3 m',28,BB,'Același design PX, într-o variantă mai compactă, cu balcon.',None),
 ('PX3','PX','5,6 × 3,3 × 3,3 m',18.5,S2,'Studio compact cu vitraj curbat: bun pentru început sau pentru glamping.',None),
 ('E7','E','11,5 × 3,3 × 3,3 m',38,BB,'Linii simple, vitraje mari și balcon. Potrivită pentru resorturi pe malul apei.',None),
 ('E5','E','8,5 × 3,3 × 3,3 m',28,BB,'Varianta medie din seria E, cu balcon și scară integrată.',None),
 ('E3','E','5,6 × 3,3 × 3,3 m',18.5,S2,'Modul compact cu fațade pline și un capăt vitrat. Discret și versatil.',None),
 ('T7','T','11,5 × 2,25 × 2,45 m',26,B,'Format de container 40HQ, ușor de transportat. Interior complet pe toată lungimea.',None),
 ('T5','T','5,6 × 2,25 × 2,45 m',12.6,B,'Format de container 20FT: cea mai mică și mai ușor de amplasat capsulă.',None),
]
SER={'X':'Best-seller','M':'Cu etaj','V':'Popular','PX':'Popular PX','E':'Popular E','T':'Container'}
data=[]
for c,s,d,a,l,desc,pr in M:
    imgs=[uri(c)]+[x for x in (uri(f'{c}-i{i}') for i in range(1,6)) if x]
    data.append(dict(c=c,s=s,sn=SER[s],d=d,a=a,l=l,t=desc,p=pr,img=imgs))
open('cat_data.json','w').write(json.dumps(data,ensure_ascii=False))
print(len(data), os.path.getsize('cat_data.json')//1024,'KB')
