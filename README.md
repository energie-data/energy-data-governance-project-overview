# Energy data governance — project overview

Static HTML site that presents Dutch-language overviews of energy-sector data governance: data-sharing initiatives, interoperability initiatives, and 2023 policy recommendations. Content lives in JSON under `data/` and is loaded by the pages in the repository root (`initiatieven-*.html`, `aanbevelingen.html`, and related views).

## Requirements

- Python 3.10+ (for import/export scripts only; the site itself is plain HTML/CSS/JS).

## Data layout

| Source id (`--source`)   | JSON file                         | Role |
|--------------------------|-----------------------------------|------|
| `data_sharing_2023`      | `data/projects_data_sharing_2023.json` | Initiatives snapshot (2023) |
| `data_sharing_2026`      | `data/projects_data_sharing_2026.json` | Initiatives snapshot (2026) |
| `interoperability`       | `data/projects_interoperability.json`   | Interoperability: `meta`, `initiatieven`, `bronbijlage`, `filter_metadata_definities` |
| `recommendations_2023`   | `data/recommendations_2023.json`        | Recommendations legend + nested structure |

The static assets in `assets/*.js` fetch these JSON files (paths are relative to each HTML page).

## Import and export (Markdown ↔ JSON)

Workflow:

1. **Export** — JSON → Markdown for readable, diff-friendly editing in Git.
2. Edit the `.md` files (or edit JSON directly if you prefer).
3. **Import** — Markdown → JSON so the site and any JSON-first tooling stay in sync.

Commands (from the repo root):

```bash
# Export everything (default)
python export_to_md.py

# Export one dataset
python export_to_md.py --source data_sharing_2026

# Import everything (default)
python import_from_md.py

# Import interoperability only
python import_from_md.py --source interoperability

# Several sources
python import_from_md.py --source data_sharing_2023 --source recommendations_2023
```

- **Export** writes `data/*.md` from `data/*.json`. Filenames are fixed per source (see table above).
- **Import** reads those Markdown files and overwrites the corresponding JSON.  
  Interoperability import **preserves** `meta`, `bronbijlage` en `filter_metadata_definities` in `projects_interoperability.json`; alleen `initiatieven` wordt uit de Markdown opgebouwd.

Markdown formats differ by dataset (block structure, section headings). The canonical round-trip pair is **export then import** on the same source; avoid hand-editing field names unless you match the exporter’s layout.

Data-sharing Markdown includes a **`### links`** block after `tags` (one line per link: `- label=…; url=https://…`). Import maps that back to the JSON `links` array; if the block is missing or empty, `links` becomes `[]`.

Interoperability Markdown (v11): per initiatief een blok `## id: …` met **kopregels** (`naam:`, `type_initiatief:`, `jaar_start:`, enz.), daarna **`###`-secties** voor langere tekst (`korte_omschrijving`, `uitgebreide_omschrijving`, …) en lijsten met `- regels` voor `alternatieve_namen`, `opgeleverd`, `verwante_initiatieven`. **`### aanvullende_websites`** gebruikt hetzelfde `- label=…; url=…`-patroon als data-sharing links.

## Local preview

Open any HTML file in a browser from a local checkout. If the browser blocks `fetch()` to `file://` URLs, serve the folder with a small static server, for example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/index.html`.

## Chatbot (RAG over website-inhoud)

De site heeft een zwevende chatwidget (`assets/chatbot.js`) die vragen beantwoordt op basis van de rapportinhoud. De OpenAI API-sleutel staat **niet** op GitHub Pages; een kleine serverless API op Vercel verwerkt verzoeken.

### Kennisbasis bouwen

Na wijzigingen in de JSON-bronnen:

```bash
python build_knowledge.py
```

Dit schrijft `data/knowledge_chunks.json` (gebruikt door de API). De builder neemt alle velden uit de JSON op, gebruikt officiële MD-/filtermetadata-labels, legenda-chunks voor use cases en interoperabiliteit, plus links en looptijden. Commit dit bestand samen met de databronnen.

**Algemene projectcontext:** [`data/algemene_projectcontext_openai.md`](data/algemene_projectcontext_openai.md) wordt bij elke chat-aanroep in de **system prompt** geladen (interpretatiekader; feiten blijven uit de chunks). Wijzig dit bestand en redeploy de Vercel API om gedrag aan te passen.

### API lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul OPENAI_API_KEY en CORS_ORIGINS in
npx vercel dev
```

**Let op:** bij een gekoppeld Vercel-project (`vercel link`) worden variabelen uit `.env.local` niet altijd automatisch in `/api/chat` geladen. De API leest `.env.local` daarom zelf in. Na wijzigingen in `.env.local`: `vercel dev` herstarten. Zet `OPENAI_API_KEY` ook in het Vercel-dashboard (Environment → Development) voor dezelfde projectnaam als je lokaal problemen blijft houden.

Test: `POST http://localhost:3000/api/chat` met body `{"message":"Welke use cases gaan over netdata?"}`.

Environment variables (Vercel project → Settings → Environment Variables):

| Variable | Verplicht | Beschrijving |
|----------|-----------|--------------|
| `OPENAI_API_KEY` | ja | OpenAI API-sleutel |
| `OPENAI_MODEL` | nee | Standaard `gpt-5.5` |
| `CORS_ORIGINS` | ja (productie) | Komma-gescheiden origins, bv. `https://<org>.github.io,http://localhost:8080` |
| `CHAT_CLIENT_API_KEY` | nee | Indien gezet: widget moet dezelfde waarde als header `X-Chat-Api-Key` sturen |
| `RATE_LIMIT_PER_HOUR` | nee | Standaard `20` per IP |

### Productie koppelen

De widget draait in de **browser** (GitHub Pages); die kan geen `.env` lezen. De productie-API-URL wordt daarom bij **build** uit omgevingsvariabelen in [`assets/chat-config.js`](assets/chat-config.js) gezet:

```bash
# .env.local of CI-secret
CHAT_API_URL=https://jouw-project.vercel.app
CHAT_CLIENT_API_KEY=   # optioneel, zelfde waarde als op Vercel

npm run build:chat-config
```

Commit het gegenereerde `assets/chat-config.js` (of run `build:chat-config` in je GitHub Actions-workflow vóór deploy naar Pages).

| Variabele | Waar | Doel |
|-----------|------|------|
| `CHAT_API_URL` | `.env.local` / CI / Vercel build | Productie-URL van `/api/chat` |
| `CHAT_CLIENT_API_KEY` | idem | Optionele header voor de widget |
| `OPENAI_API_KEY` | alleen Vercel API | Server-side; nooit in de widget |

**Lokaal** blijft werken zonder rebuild: op `localhost` kiest de widget automatisch `http://localhost:3000` (of dezelfde origin op poort 3000 met `vercel dev`). Test override: `?chatApi=...` in de URL.

1. Deploy de API naar Vercel; zet `OPENAI_API_KEY` en `CORS_ORIGINS` daar.
2. Zet `CHAT_API_URL` op die Vercel-URL en run `npm run build:chat-config` vóór publicatie op GitHub Pages.

### Deep links use cases

Use cases zijn linkbaar via `overzicht-use-cases.html?id=P001` (opent het detailpaneel).
