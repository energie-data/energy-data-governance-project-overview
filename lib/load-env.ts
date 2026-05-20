import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, parse } from 'dotenv';

/**
 * Vercel dev (linked projects) injecteert .env.local niet altijd in serverless functions.
 * Laad expliciet via dotenv uit de repo-root; ondersteunt UTF-8 BOM (Windows).
 */
function applyParsedEnv(raw: string): void {
  let text = raw;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const parsed = parse(text);
  for (const [key, value] of Object.entries(parsed)) {
    const k = key.replace(/^\uFEFF/, '').trim();
    if (!k) continue;
    process.env[k] = value;
  }
}

export function loadEnvFiles(): void {
  const roots = new Set<string>();
  roots.add(process.cwd());

  try {
    const here = dirname(fileURLToPath(import.meta.url));
    roots.add(resolve(here, '..'));
    roots.add(resolve(here, '../..'));
  } catch {
    /* bundled zonder import.meta */
  }

  for (const root of roots) {
    for (const name of ['.env.local', '.env']) {
      const path = join(root, name);
      if (!existsSync(path)) continue;

      applyParsedEnv(readFileSync(path, 'utf8'));
      config({ path, override: true, quiet: true });
    }
  }

  const bomKey = process.env['\ufeffOPENAI_API_KEY'];
  if (bomKey && !process.env.OPENAI_API_KEY?.trim()) {
    process.env.OPENAI_API_KEY = bomKey;
  }
}

export function getOpenAiApiKey(): string | undefined {
  loadEnvFiles();
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || undefined;
}
