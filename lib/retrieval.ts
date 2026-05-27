import type { KnowledgeChunk } from './types.js';

const STOPWORDS = new Set([
  'de', 'het', 'een', 'en', 'van', 'in', 'op', 'te', 'voor', 'met', 'aan', 'als',
  'dat', 'die', 'dit', 'zijn', 'was', 'worden', 'ook', 'naar', 'bij', 'uit', 'over',
  'welke', 'welk', 'wat', 'wie', 'waar', 'hoe', 'kan', 'zijn', 'niet', 'meer',
  'the', 'and', 'or', 'is', 'are', 'to', 'of', 'a', 'an',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/i)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function scoreChunk(queryTokens: string[], chunk: KnowledgeChunk): number {
  const hay = tokenize(`${chunk.title} ${chunk.text} ${chunk.type}`);
  if (!queryTokens.length || !hay.length) return 0;
  const haySet = new Set(hay);
  let score = 0;
  for (const t of queryTokens) {
    if (haySet.has(t)) score += 2;
    else if (hay.some(h => h.includes(t) || t.includes(h))) score += 0.5;
  }
  const titleTokens = tokenize(chunk.title);
  for (const t of queryTokens) {
    if (titleTokens.includes(t)) score += 3;
  }
  return score;
}

export function retrieveRelevantChunks(
  query: string,
  chunks: KnowledgeChunk[],
  topK = 8,
): KnowledgeChunk[] {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return chunks.slice(0, topK);

  return chunks
    .map(chunk => ({ chunk, score: scoreChunk(queryTokens, chunk) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(x => x.chunk);
}

export function formatContext(chunks: KnowledgeChunk[]): string {
  return chunks
    .map(
      c =>
        `[bron: ${c.title} | ${c.url} | id=${c.id}]\n${c.text}`,
    )
    .join('\n\n---\n\n');
}
