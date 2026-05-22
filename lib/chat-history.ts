import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import { CHAT_JSON_OUTPUT_INSTRUCTIONS } from './prompt-output.js';

export type ChatHistoryTurn = {
  role: 'user' | 'assistant';
  content: string;
};

const MAX_HISTORY_TURNS = 12;
const MAX_TURN_CHARS = 2000;
const MAX_TOTAL_HISTORY_CHARS = 12_000;

/** Platte tekst uit opgeslagen assistant-HTML (sessionStorage). */
export function historyContentToPlain(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseChatHistory(body: unknown): ChatHistoryTurn[] {
  if (!body || typeof body !== 'object' || !('history' in body)) return [];
  const raw = (body as { history: unknown }).history;
  if (!Array.isArray(raw)) return [];

  const turns: ChatHistoryTurn[] = [];
  let totalChars = 0;

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string') continue;

    const plain =
      role === 'assistant' ? historyContentToPlain(content) : content.trim();
    if (!plain) continue;

    const clipped = plain.slice(0, MAX_TURN_CHARS);
    if (totalChars + clipped.length > MAX_TOTAL_HISTORY_CHARS) break;

    turns.push({ role, content: clipped });
    totalChars += clipped.length;
    if (turns.length >= MAX_HISTORY_TURNS) break;
  }

  return turns;
}

/** Query voor retrieval: recente beurten + huidige vraag (vervolgvragen). */
export function buildRetrievalQuery(message: string, history: ChatHistoryTurn[]): string {
  const recent = history.slice(-6);
  const parts = recent.map(t => t.content).filter(Boolean);
  parts.push(message);
  return parts.join(' ').trim().slice(0, 4000);
}

export function buildChatCompletionMessages(
  systemPrompt: string,
  history: ChatHistoryTurn[],
  contextBlock: string,
  message: string,
): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${systemPrompt}\n\nHoud rekening met het voorgaande gesprek bij vervolgvragen (bijv. "het", "die", "daar", "meer daarover"). Feiten blijven uit de Context-chunks van dit verzoek.`,
    },
  ];

  for (const turn of history) {
    messages.push({ role: turn.role, content: turn.content });
  }

  messages.push({
    role: 'user',
    content: `Context:\n\n${contextBlock}\n\n---\n\nVraag: ${message}\n\n${CHAT_JSON_OUTPUT_INSTRUCTIONS}`,
  });

  return messages;
}
