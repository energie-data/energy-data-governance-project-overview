import type { ChatSource, KnowledgeChunk } from './types.js';

/** Alleen pagina's op deze website (geen http(s)-externe URLs). */
export function isInternalSiteUrl(url: string): boolean {
  const u = url.trim();
  if (!u || u === '#') return false;
  if (/^https?:\/\//i.test(u)) return false;
  return /\.html(\?|#|$)/i.test(u) || u.endsWith('.html') || !u.includes('://');
}

/** Tags die het model mag gebruiken (prompt); b/i worden bij sanitize ook geaccepteerd. */
export const PROMPT_ALLOWED_ANSWER_TAGS =
  'p, br, strong, em, ul, ol, li, h3, h4';

const ALLOWED_ANSWER_TAGS = new Set([
  ...PROMPT_ALLOWED_ANSWER_TAGS.split(',').map(t => t.trim()),
  'b',
  'i',
]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map(block => {
      const lines = block.split('\n').map(escapeHtml).join('<br>');
      return `<p>${lines}</p>`;
    })
    .join('');
}

function stripUnsafeHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(
      /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g,
      (match, tagName: string) => {
        const tag = tagName.toLowerCase();
        if (!ALLOWED_ANSWER_TAGS.has(tag)) return '';
        if (match.startsWith('</')) return `</${tag}>`;
        if (tag === 'br') return '<br>';
        return `<${tag}>`;
      },
    );
}

/** Normaliseer en sanitizeer HTML-antwoorden (whitelist, geen attributen). */
export function sanitizeAnswerHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const looksLikeHtml = /<\/?[a-z][\s>/]/i.test(trimmed);
  const html = looksLikeHtml ? stripUnsafeHtml(trimmed) : plainTextToHtml(trimmed);

  return html.replace(/\n{3,}/g, '\n\n').trim();
}

function dedupeSources(sources: ChatSource[]): ChatSource[] {
  const seen = new Set<string>();
  const out: ChatSource[] = [];
  for (const s of sources) {
    const key = s.url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/**
 * Bronnen alleen van opgehaalde chunks, alleen interne site-URLs.
 * Model-suggesties worden genegeerd als ze niet in relevant passen.
 */
export function resolveInternalSources(
  modelSources: ChatSource[],
  relevant: KnowledgeChunk[],
  max = 6,
): ChatSource[] {
  const chunkById = new Map(relevant.map(c => [c.id, c]));
  const chunkByUrl = new Map(
    relevant.filter(c => isInternalSiteUrl(c.url)).map(c => [c.url, c]),
  );

  const matched: ChatSource[] = [];

  for (const s of modelSources) {
    const hit =
      chunkById.get(s.id) ||
      chunkByUrl.get(s.url) ||
      relevant.find(
        c =>
          isInternalSiteUrl(c.url) &&
          (c.title === s.title || c.id === s.id || c.url === s.url),
      );
    if (hit && isInternalSiteUrl(hit.url)) {
      matched.push({ id: hit.id, title: hit.title, url: hit.url });
    }
  }

  const deduped = dedupeSources(matched);
  if (deduped.length) return deduped.slice(0, max);

  return dedupeSources(
    relevant
      .filter(c => isInternalSiteUrl(c.url))
      .map(c => ({ id: c.id, title: c.title, url: c.url })),
  ).slice(0, max);
}
