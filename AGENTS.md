# AGENTS.md

## Cursor Cloud specific instructions

This is a static HTML/CSS/JS site with no build step, no package manager, and no external dependencies. Python 3.10+ (stdlib only) is the only requirement.

### Services

| Service | Command | Purpose |
|---------|---------|---------|
| Static HTTP server | `python3 -m http.server 8080` | Serves site so `fetch()` works in browser |

### Key commands

- **Local preview:** `python3 -m http.server 8080` then open `http://localhost:8080/index.html`
- **Export JSON→Markdown:** `python3 export_to_md.py` (all sources) or `python3 export_to_md.py --source <id>`
- **Import Markdown→JSON:** `python3 import_from_md.py` (all sources) or `python3 import_from_md.py --source <id>`

### Caveats

- Use `python3` not `python` — the VM may not have an unversioned `python` symlink.
- There is no linter, test framework, or build system configured. Validation is done by running the import/export scripts and verifying the site loads in a browser.
- The export→import round-trip may produce minor JSON formatting differences; this is expected behavior (not a bug).
