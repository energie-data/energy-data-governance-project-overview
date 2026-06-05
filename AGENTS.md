# AGENTS.md

## Cursor Cloud specific instructions

This is a static HTML/CSS/JS site published on **GitHub Pages**. A separate **Vercel** deployment hosts only the chat API (`/api/chat`), not the static site. Node.js 22+ and npm are required for the API and chat-config build; Python 3.10+ (stdlib only) for data scripts.

### Services

| Service | Command | Purpose |
|---------|---------|---------|
| Static HTTP server | `python3 -m http.server 8080` | Serves site so `fetch()` works in browser |
| Chat API (local) | `npx vercel dev` | Serverless API on port 3000 (set `CORS_ORIGINS` in `.env.local`) |

### Key commands

- **Local preview:** `python3 -m http.server 8080` then open `http://localhost:8080/index.html`
- **Chat config (GitHub Pages):** `npm run build:chat-config` (uses `CHAT_API_URL` from `.env.local` or env)
- **Vercel:** API-only; static files are listed in `.vercelignore`. Do not set an Output Directory in the Vercel project.
- **Export JSON→Markdown:** `python3 export_to_md.py` (all sources) or `python3 export_to_md.py --source <id>`
- **Import Markdown→JSON:** `python3 import_from_md.py` (all sources) or `python3 import_from_md.py --source <id>`

### Caveats

- Use `python3` not `python` — the VM may not have an unversioned `python` symlink.
- There is no linter, test framework, or build system configured. Validation is done by running the import/export scripts and verifying the site loads in a browser.
- The export→import round-trip may produce minor JSON formatting differences; this is expected behavior (not a bug).
