import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SYSTEM_PROMPT_PREAMBLE } from './prompt-output.js';

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

let cachedSystemPrompt: string | undefined;

/** System prompt: korte preambule + domeincontext (stabiel → prompt caching). */
export function buildSystemPrompt(): string {
  if (cachedSystemPrompt !== undefined) return cachedSystemPrompt;

  const context = getProjectContextMarkdown();
  cachedSystemPrompt = context
    ? `${SYSTEM_PROMPT_PREAMBLE}\n\n---\n\n${context}`
    : SYSTEM_PROMPT_PREAMBLE;
  return cachedSystemPrompt;
}
