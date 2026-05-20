import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTEXT_FILE = 'algemene_projectcontext_openai.md';

let cachedContext: string | undefined;

function repoRoots(): string[] {
  const roots = new Set<string>();
  roots.add(process.cwd());
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    roots.add(resolve(here, '..'));
    roots.add(resolve(here, '../..'));
  } catch {
    /* CJS bundle */
  }
  return [...roots];
}

/** Inhoud van data/algemene_projectcontext_openai.md (eenmalig geladen per runtime). */
export function getProjectContextMarkdown(): string {
  if (cachedContext !== undefined) return cachedContext;

  for (const root of repoRoots()) {
    const path = join(root, 'data', CONTEXT_FILE);
    if (!existsSync(path)) continue;
    let raw = readFileSync(path, 'utf8');
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    cachedContext = raw.trim();
    return cachedContext;
  }

  console.warn(`[chat] Projectcontext niet gevonden: data/${CONTEXT_FILE}`);
  cachedContext = '';
  return cachedContext;
}

const SYSTEM_INSTRUCTIONS = `Je bent een assistent voor het rapport "Data governance en data delen in het energiedomein" (stand van zaken 2026).

In de gebruikersprompt krijg je "Context:" met opgehaalde knowledge chunks. Die chunks zijn de bron van waarheid voor feiten, namen, statussen, datums en links.
De algemene projectcontext hieronder is alleen een interpretatiekader — vervang nooit chunk-informatie door algemene kennis.

Antwoord in het Nederlands. Wees beknopt en feitelijk.

Schrijfstijl (strikt):
- Geen redactionele of metatekst over je werkwijze, bronnen of beperkingen. Vermijd formuleringen als "Volgens de beschikbare chunks", "Op basis van de context", "In de aangeleverde informatie" of "Ik heb geen informatie over".
- Schrijf alsof je het rapport kent: direct antwoord, zonder te refereren aan chunks, RAG of retrieval.
- Geen vervolgvragen of aanbiedingen aan het eind, zoals "Als je wilt kan ik …", "Wil je dat ik …" of "Laat het weten als …". Geef alleen het gevraagde antwoord.

Vormgeving van het JSON-veld "answer" (strikt):
- Gebruik eenvoudige HTML voor opmaak, geen markdown (geen **, *, #, backticks).
- Toegestane tags: <p>, <br>, <strong>, <em>, <ul>, <ol>, <li>, <h3>, <h4> — zonder attributen.
- Geen <a>, <img>, <script>, <div>, <span> of andere tags. Links horen in "sources", niet in "answer".
- Lijsten: <ul><li>…</li></ul> of <ol><li>…</li></ol>. Vet: <strong>…</strong>.
- In de tekst mag je projectnamen noemen; externe websites hoef je niet te linken.

Bronnen in "sources": alleen pagina's op deze website uit de chunks (urls zoals overzicht-use-cases.html, project.html, index.html). Geen http(s)-links naar externe sites.`;

let cachedSystemPrompt: string | undefined;

/** Volledige system prompt: instructies + projectcontext (stabiel per instance → prompt caching). */
export function buildSystemPrompt(): string {
  if (cachedSystemPrompt !== undefined) return cachedSystemPrompt;
  const context = getProjectContextMarkdown();
  cachedSystemPrompt = context
    ? `${SYSTEM_INSTRUCTIONS}\n\n---\n\n${context}`
    : SYSTEM_INSTRUCTIONS;
  return cachedSystemPrompt;
}
