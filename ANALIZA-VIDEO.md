# Analiza video — „Site-uri animate cu Claude” (Instagram, 21.10.2026)

Video-ul (3 min 29 s) e o înregistrare de ecran cu 8 reel-uri de Instagram (majoritatea în rusă) despre cum se fac site-uri animate, „premium”, cu Claude. Toate spun același lucru: **Claude Code + skill-uri de design + conectori (MCP) + biblioteci de animație = site de nivel Awwwards în câteva ore.**

## Ce arată fiecare reel

| # | Cont | Mesaj | Unelte arătate |
|---|------|-------|----------------|
| 1 | w.wearebrand | „Websites in 2026”: site 3D izometric animat la scroll (logistică, avioane, depozit) | 3D / WebGL, animații la scroll |
| 2 | kirill.leeks | „Animații profesionale prin Claude cu 4 unelte”: găsești o animație, copiezi codul/prompt-ul, îl lipești în Claude | **21st.dev**, **Framer Motion** (`npm i framer-motion`), o a 3-a unealtă (logo albastru rotund, neidentificat), **Claude Code** |
| 3 | alexandro_ai | Site „de la zero” cu Claude Code | Claude Code |
| 4 | saint4ai | „Claude fără conectori = calculator de 20 $/lună”. 4 conectori, câte un minut fiecare | **Perplexity** (căutare live), **Firecrawl** (citește orice site: prețuri, structuri, texte), **Playwright** (deschide site-ul, dă click, completează formulare, „ca un client real”), **Composio** (un conector către sute de aplicații, ex. Notion) |
| 5 | himanshubuilds | „Site animat în 5 minute”: copiezi un prompt de pe Scrolltide.co și îl lipești în Claude (exemplu: „Vesper”, sticlă de vin 3D la scroll) | **Scrolltide.co** (prompturi), 3D, WebGL, **Three.js**, **GSAP** |
| 6 | zhilnikov_it | 3 unelte ca să nu mai arate „făcut de AI” | **#1 Taste Skill** (anti-slop), **#2 Impeccable** (20 de comenzi de design: /polish, /audit, /typeset, /overdrive…), **#3 Playwright CLI** (verifici site-ul în browser) |
| 7 | dashi_agent | 5 pluginuri „de neînlocuit” pentru Claude Code | căutare/instalare automată de skill-uri (scanează ~100k skill-uri); plugin oficial Anthropic care scanează proiectul și recomandă skill-uri/subagenți; buclă de lucru „nelimitată”; schimbare automată de model (Claude/Gemini/GLM, 353 de furnizori); **Shannon** (pentest automat: îți „sparge” site-ul ca să găsească vulnerabilități); cercetare pe Instagram/LinkedIn/X/Reddit fără chei API |
| 8 | dashi_agent | Plugin gratuit **Remotion**: Claude analizează video-ul, face tăieturi și adaugă animații | Remotion |

## Rețeta comună

1. **Direcție de design** — referințe reale (Awwwards, 21st.dev, Scrolltide), nu „media” a ce a văzut modelul.
2. **Skill-uri de gust** — Taste Skill / Impeccable / frontend-design îl împiedică pe Claude să facă layout-ul generic de AI.
3. **Animație** — Framer Motion (React), GSAP + ScrollTrigger, Three.js pentru 3D.
4. **Conectori** — Firecrawl/Perplexity pentru cercetare (concurență, texte), Playwright pentru verificare în browser.
5. **Verificare** — screenshot-uri pe mobil și desktop, audit, polish, securitate.

## Ce avem deja în Claude (contul tău)

| Din video | La noi | Stare |
|---|---|---|
| Claude Code | da | ✅ |
| 21st.dev | plugin `21st` (skill `21st-ui`) | ✅ instalat |
| Firecrawl | plugin `firecrawl` (scrape, crawl, search…) | ✅ instalat |
| Playwright | plugin `playwright` (browser) | ✅ conectat |
| Remotion | plugin `remotion` | ✅ instalat |
| Plugin oficial Anthropic „recomandă skill-uri” | `claude-code-setup:claude-automation-recommender` | ✅ instalat |
| Skill-uri de design | `frontend-design`, `website-design` (landing-page, design-system, review), `design` | ✅ instalate |
| SEO / securitate site | `seo-audit`, `seo-records-website-checkup` | ✅ instalate (conectorii lor sunt blocați de rețea în cloud) |
| Perplexity | — | ❌ de adăugat |
| Composio | — | ❌ de adăugat |
| Taste Skill | — | ❌ de adăugat (am verificat codul: e OK) |
| Impeccable | — | ❌ de adăugat (am verificat codul: e OK) |
| Shannon (pentest) | — | opțional, abia după ce site-ul e online |
| Router de modele | — | nu e nevoie (folosim Claude) |

## Cum adaugi ce lipsește

### 1. Taste Skill + Impeccable (skill-uri de design)
Rulează în folderul proiectului (local sau în Claude Code):

```bash
# Taste Skill
git clone --depth 1 https://github.com/Leonxlnx/taste-skill /tmp/taste-skill
mkdir -p .claude/skills && cp -r /tmp/taste-skill/skills/taste-skill .claude/skills/

# Impeccable (doar skill-ul; fără hooks automate)
git clone --depth 1 https://github.com/pbakaus/impeccable /tmp/impeccable
cp -r /tmp/impeccable/.claude/skills/impeccable .claude/skills/
mkdir -p .claude/agents && cp /tmp/impeccable/.claude/agents/*.md .claude/agents/
```

Impeccable are și un `.claude/settings.json` cu hooks care rulează automat programul lor (descărcat la prima rulare) după fiecare editare. Copiază-l doar dacă vrei verificarea automată.

### 2. Conectori (în claude.ai → Settings → Connectors)
- **Firecrawl** — există în directorul de conectori; îl conectezi cu contul Firecrawl.
- **Perplexity** — „Add custom connector” cu URL-ul din video (`https://api.perplexity.ai/mcp`) sau, în Claude Code local:
  `claude mcp add perplexity --env PERPLEXITY_API_KEY=... -- npx -y @perplexity-ai/mcp-server`
- **Composio** — îți faci cont pe composio.dev, îți generezi URL-ul MCP personal și îl adaugi ca „custom connector”.
- **Playwright** (local): `claude mcp add playwright npx @playwright/mcp@latest`

### 3. Rețeaua mediului cloud
În sesiunile Claude Code din cloud, mai mulți conectori instalați (Figma, Canva, Notion, Ahrefs, UXKIN, SEO Records, Ullbek…) nu pornesc, pentru că rețeaua mediului îi blochează. Repari din meniul mediului (bara de titlu a sesiunii) → Edit → Network access: alegi un nivel mai larg sau adaugi domeniile la „Allowed domains”.
Ghid: https://code.claude.com/docs/en/cloud-environments#network-access

## Materialul nostru (Drive → folderul `360`)
10 panorame 360° (equirectangular 2:1) cu casa-capsulă modulară, făcute din exterior, din mai multe puncte în jurul ei. Pe site ar merge:
- **hero cu tur virtual 360°** (Pannellum / Photo Sphere Viewer), cu săgeți între cele 10 puncte;
- **animație la scroll** cu casa (GSAP ScrollTrigger), în stilul reel-urilor 1 și 5;
- secțiuni: modele, interior, specificații, prețuri, formular de contact.
