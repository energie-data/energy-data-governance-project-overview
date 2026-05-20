import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { KnowledgeChunk, KnowledgeFile } from './types.js';

const KNOWLEDGE_FILE = 'knowledge_chunks.json';

let cachedChunks: KnowledgeChunk[] | undefined;

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

export function getAllChunks(): KnowledgeChunk[] {
  if (cachedChunks !== undefined) return cachedChunks;

  for (const root of repoRoots()) {
    const path = join(root, 'data', KNOWLEDGE_FILE);
    if (!existsSync(path)) continue;
    let raw = readFileSync(path, 'utf8');
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    const file = JSON.parse(raw) as KnowledgeFile;
    cachedChunks = file.chunks ?? [];
    return cachedChunks;
  }

  console.warn(`[chat] Knowledge chunks niet gevonden: data/${KNOWLEDGE_FILE}`);
  cachedChunks = [];
  return cachedChunks;
}
