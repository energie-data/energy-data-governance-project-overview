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
