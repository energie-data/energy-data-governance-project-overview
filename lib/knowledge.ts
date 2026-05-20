import knowledgeData from '../data/knowledge_chunks.json';
import type { KnowledgeChunk, KnowledgeFile } from './types.js';

const file = knowledgeData as KnowledgeFile;

export function getAllChunks(): KnowledgeChunk[] {
  return file.chunks ?? [];
}
