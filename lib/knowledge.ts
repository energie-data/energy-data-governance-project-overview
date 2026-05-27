import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import bundledKnowledge from '../data/knowledge_chunks.json' with { type: 'json' };

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

function loadFromDisk(): KnowledgeChunk[] | undefined {
  for (const root of repoRoots()) {
    const path = join(root, 'data', KNOWLEDGE_FILE);
    if (!existsSync(path)) continue;
    let raw = readFileSync(path, 'utf8');
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    const file = JSON.parse(raw) as KnowledgeFile;
    return file.chunks ?? [];
  }
  return undefined;
}

export function getAllChunks(): KnowledgeChunk[] {
  if (cachedChunks !== undefined) return cachedChunks;

  const bundled = (bundledKnowledge as KnowledgeFile).chunks ?? [];
  if (bundled.length > 0) {
    cachedChunks = bundled;
    return cachedChunks;
  }

  const fromDisk = loadFromDisk();
  if (fromDisk?.length) {
    cachedChunks = fromDisk;
    return cachedChunks;
  }

  console.warn(`[chat] Knowledge chunks niet gevonden: data/${KNOWLEDGE_FILE}`);
  cachedChunks = [];
  return cachedChunks;
}
