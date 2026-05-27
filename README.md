# Energy Data Governance Project Overview

Deze repository bevat een statische website over data governance en data delen in het energiedomein. De site wordt gepubliceerd via GitHub Pages. De chatfunctie gebruikt een aparte serverless API op Vercel, zodat de OpenAI API-sleutel nooit in de browser terechtkomt.

## Architectuur

- `*.html` en `assets/`: statische website met vanilla HTML, CSS en JavaScript.
- `data/*.json`: brondata voor overzichten, use cases, aanbevelingen en interoperabiliteitsinitiatieven.
- `api/chat.ts`: Vercel serverless API voor de chatwidget.
- `lib/`: gedeelde API-logica voor CORS, retrieval, rate limiting, env-loading en response-sanitization.
- `scripts/generate-chat-config.mjs`: genereert `assets/chat-config.js` met de publieke chatconfiguratie.

De browser haalt de statische website en JSON-data op vanaf GitHub Pages. Alleen chatvragen gaan naar de Vercel API.

## Vereisten

- Node.js 22 of nieuwer
- npm
- Python 3.10 of nieuwer
- Vercel CLI voor lokaal testen van de API

Installeer de Node-dependencies:

```bash
npm install
```

## Lokaal ontwikkelen

Start een eenvoudige statische server voor de website:

```bash
python -m http.server 8080
```

Open daarna `http://localhost:8080/index.html`.

Start de Vercel API in een tweede terminal:

```bash
cp .env.example .env.local
npx vercel dev
```

Vul in `.env.local` minimaal `OPENAI_API_KEY` en `CORS_ORIGINS` in. Lokale `.env`-bestanden worden alleen buiten productie gelezen; in productie gebruikt de API uitsluitend Vercel Environment Variables.

## Chatconfiguratie

De chatwidget leest `window.CHAT_CONFIG` uit `assets/chat-config.js`. Dat bestand wordt gegenereerd uit omgevingsvariabelen:

```bash
npm run build:chat-config
```

Relevante variabelen:

| Variabele | Waar | Doel |
| --- | --- | --- |
| `CHAT_ENABLED` | GitHub Pages build / lokaal | Chatwidget tonen (`true`, standaard) of verbergen (`false`, `0`, `no`, `off`) |
| `CHAT_API_URL` | GitHub Pages build / lokaal | Publieke URL van de Vercel API |
| `CHAT_CLIENT_API_KEY` | GitHub Pages build en Vercel runtime | Optionele gedeelde sleutel voor `X-Chat-Api-Key` |
| `OPENAI_API_KEY` | Alleen Vercel runtime | Server-side OpenAI API-sleutel |
| `OPENAI_MODEL` | Vercel runtime | Optioneel model, standaard `gpt-5.5` |
| `CORS_ORIGINS` | Vercel runtime | Komma-gescheiden lijst van toegestane browser-origins |
| `RATE_LIMIT_PER_HOUR` | Vercel runtime | Eenvoudige per-instance limiet, standaard `20` |

`CHAT_CLIENT_API_KEY` is zichtbaar in de browser zodra je die gebruikt. Zie dit daarom als misbruikdrempel, niet als geheim. Voor sterke bescherming is een server-side of edge-rate-limit nodig.

De queryparameter `?chatApi=` werkt alleen op `localhost`. In productie wordt deze genegeerd, zodat een link de client-key niet naar een andere host kan sturen.

## Kennisbasis Voor De Chat

Na wijzigingen in de JSON-bronnen moet de RAG-kennisbasis opnieuw worden opgebouwd:

```bash
python build_knowledge.py
```

Dit schrijft `data/knowledge_chunks.json`. Commit dit bestand samen met de gewijzigde brondata.

**Chat-prompts:** domein en antwoordstijl in `data/algemene_projectcontext_openai.md`; korte preambule + JSON/HTML-contract in `lib/prompt-output.ts` (tags sync met `lib/response-format.ts`); per vraag de opgehaalde chunks in de user prompt (`api/chat.ts`).

## Data Bewerken

De JSON-bestanden in `data/` zijn leidend voor de website. Voor sommige datasets zijn import- en exportscripts beschikbaar om Markdown als bewerkformaat te gebruiken:

```bash
python export_to_md.py
python import_from_md.py
```

Je kunt ook één bron verwerken:

```bash
python export_to_md.py --source data_sharing_2026
python import_from_md.py --source interoperability
```

Ondersteunde bronnen:

| Source | JSON-bestand |
| --- | --- |
| `data_sharing_2023` | `data/projects_data_sharing_2023.json` |
| `data_sharing_2026` | `data/projects_data_sharing_2026.json` |
| `interoperability` | `data/projects_interoperability.json` |
| `recommendations_2023` | `data/recommendations_2023.json` |

## DCAT-AP-NL export (RDF op GitHub Pages)

Voor machineleesbare ontsluiting is er een DCAT-exportscript dat metadata voor de drie JSON-kennisproducten genereert als `JSON-LD` en `Turtle` (zonder SPARQL-endpoint).

```bash
python export_dcat.py \
  --base-url "https://data-governance-2026.reports.energiedata.nl/" \
  --publisher-name "energie.data" \
  --publisher-uri "https://data-governance-2026.reports.energiedata.nl" \
  --contact-name "energie.data" \
  --contact-email "info@energiedata.nl"
```

Output komt in `data/dcat/`:

- `catalog.jsonld` en `catalog.ttl` (catalogus met 3 datasets)
- `projects-data-sharing-2026.*`
- `projects-interoperability-2026.*`
- `use-cases-2026.*`
- `interoperability-filters-skos.*` (SKOS voor filtermetadata)
- `use-case-metadata-skos.*` (SKOS voor MD1-MD9-schema)

Deze bestanden zijn statisch te hosten via GitHub Pages en daarmee direct crawlbaar/harvestbaar als RDF-resources.

## Deployment

### GitHub Pages

GitHub Pages publiceert de statische bestanden uit de repository. Zorg vóór publicatie dat `assets/chat-config.js` en `data/knowledge_chunks.json` up-to-date zijn.

### Vercel API

Zet in Vercel minimaal:

- `OPENAI_API_KEY`
- `CORS_ORIGINS`, bijvoorbeeld `https://energie-data.github.io,http://localhost:8080`
- optioneel `CHAT_CLIENT_API_KEY`, met dezelfde waarde als gebruikt bij het genereren van `assets/chat-config.js`

De Vercel-build draait `npm run build:chat-config`. De API leest in productie geen `.env.local`.

## Security

- De OpenAI API-sleutel staat alleen server-side.
- Als `CORS_ORIGINS` is gezet, laat CORS alleen die origins toe.
- Chatantwoorden worden server-side en client-side gesanitized voordat eenvoudige HTML wordt weergegeven.
- Ongeldige JSON in `/api/chat` levert een nette `400` op.
- De ingebouwde rate limiter is in-memory en daardoor beperkt geschikt voor serverless productie. Gebruik voor publieke productie bij voorkeur Vercel Firewall, Vercel KV of Redis/Upstash.

## Troubleshooting

- `401 Unauthorized`: `CHAT_CLIENT_API_KEY` staat op Vercel, maar `assets/chat-config.js` bevat geen overeenkomende `apiKey`.
- `403 Origin not allowed by CORS`: de origin van de website staat niet exact in `CORS_ORIGINS`.
- `503 Chat API is not configured`: `OPENAI_API_KEY` ontbreekt in Vercel.
- `503 Knowledge base niet geladen`: op Vercel worden `data/knowledge_chunks.json` en `data/algemene_projectcontext_openai.md` niet automatisch meegebundeld bij `readFileSync`. In `vercel.json` staan ze onder `functions.api/chat.ts.includeFiles`; na wijziging opnieuw deployen. Lokaal (`vercel dev`) werkt het vaak wel omdat de hele repo beschikbaar is.
- Chat antwoordt generiek / zonder site-inhoud (geen 503): controleer Vercel **Runtime Logs** op `[chat] Projectcontext niet gevonden` of lege retrieval; run `python build_knowledge.py` en commit `data/knowledge_chunks.json`.
- Geen chatrespons in de browser: controleer het Network-tabblad op `/api/chat`.

## Licentie

Zie `LICENSE`.
