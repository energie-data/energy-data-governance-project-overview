import type { VercelRequest, VercelResponse } from '@vercel/node';

import OpenAI from 'openai';

import { corsHeaders, isOriginAllowed } from '../lib/cors.js';

import { getOpenAiApiKey } from '../lib/load-env.js';

import { getAllChunks } from '../lib/knowledge.js';

import { checkRateLimit } from '../lib/rate-limit.js';

import { buildSystemPrompt } from '../lib/project-context.js';

import { CHAT_JSON_OUTPUT_INSTRUCTIONS } from '../lib/prompt-output.js';

import { formatContext, retrieveRelevantChunks } from '../lib/retrieval.js';

import {

  resolveInternalSources,

  sanitizeAnswerHtml,

} from '../lib/response-format.js';

import type { ChatResponse, ChatSource } from '../lib/types.js';



const DEFAULT_MODEL = 'gpt-5.5';



function getClientIp(req: VercelRequest): string {

  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();

  if (Array.isArray(forwarded)) return String(forwarded[0] ?? 'unknown');

  return req.socket?.remoteAddress ?? 'unknown';

}



function validateClientKey(req: VercelRequest): boolean {
  const expected = (process.env.CHAT_CLIENT_API_KEY ?? '').trim();
  if (!expected) return true;
  const provided = req.headers['x-chat-api-key'];
  return typeof provided === 'string' && provided === expected;
}



function parseResponseJson(raw: string): ChatResponse {

  const parsed = JSON.parse(raw) as ChatResponse;

  if (!parsed || typeof parsed.answer !== 'string') {

    throw new Error('Invalid response shape');

  }

  const sources = Array.isArray(parsed.sources)

    ? parsed.sources.filter(

        s => s && typeof s.title === 'string' && typeof s.url === 'string',

      )

    : [];

  return {

    answer: sanitizeAnswerHtml(parsed.answer),

    sources,

  };

}

function parseRequestBody(req: VercelRequest): unknown {
  if (typeof req.body !== 'string') return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    return undefined;
  }
}



export default async function handler(req: VercelRequest, res: VercelResponse) {

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

  const cors = corsHeaders(origin);



  if (req.method === 'OPTIONS') {
    if (!isOriginAllowed(origin)) {
      return res.status(403).json({ error: 'Origin not allowed by CORS' });
    }
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    return res.status(204).end();
  }

  if (!isOriginAllowed(origin)) {
    return res.status(403).json({ error: 'Origin not allowed by CORS' });
  }

  for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);

  if (req.method !== 'POST') {

    return res.status(405).json({ error: 'Method not allowed' });

  }



  if (!validateClientKey(req)) {

    return res.status(401).json({
      error:
        'Unauthorized: de chat-widget stuurt geen geldige X-Chat-Api-Key. Verwijder CHAT_CLIENT_API_KEY in Vercel of zet dezelfde waarde in assets/chat-config.js (apiKey).',
    });

  }



  const openAiApiKey = getOpenAiApiKey();

  if (!openAiApiKey) {

    return res.status(503).json({ error: 'Chat API is not configured' });

  }



  const ip = getClientIp(req);

  const rate = checkRateLimit(ip);

  if (!rate.ok) {

    res.setHeader('Retry-After', String(rate.retryAfterSec ?? 3600));

    return res.status(429).json({ error: 'Te veel verzoeken. Probeer later opnieuw.' });

  }



  const body = parseRequestBody(req);

  const message =
    body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
      ? body.message.trim()
      : '';

  if (!message || message.length > 2000) {

    return res.status(400).json({ error: 'message is required (max 2000 characters)' });

  }



  const allChunks = getAllChunks();

  if (allChunks.length === 0) {
    console.error('[chat] Knowledge base leeg — controleer data/knowledge_chunks.json en Vercel includeFiles');
    return res.status(503).json({
      error:
        'Knowledge base niet geladen op de server. Zorg dat data/knowledge_chunks.json in de deploy zit (vercel.json includeFiles) en deploy opnieuw.',
    });
  }

  const relevant = retrieveRelevantChunks(message, allChunks, 8);

  const context = relevant.length

    ? formatContext(relevant)

    : 'Geen relevante context gevonden.';



  const openai = new OpenAI({ apiKey: openAiApiKey });

  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;



  try {

    const completion = await openai.chat.completions.create({

      model,

      //temperature: 0.2,

      response_format: { type: 'json_object' },

      messages: [

        { role: 'system', content: buildSystemPrompt() },

        {

          role: 'user',

          content: `Context:\n\n${context}\n\n---\n\nVraag: ${message}\n\n${CHAT_JSON_OUTPUT_INSTRUCTIONS}`,

        },

      ],

    });



    const raw = completion.choices[0]?.message?.content ?? '{}';

    const parsed = parseResponseJson(raw);



    const result: ChatResponse = {

      answer: parsed.answer,

      sources: resolveInternalSources(parsed.sources, relevant),

    };



    return res.status(200).json(result);

  } catch (err) {

    console.error('chat error', err instanceof Error ? err.message : err);

    return res.status(500).json({ error: 'Kon geen antwoord genereren' });

  }

}


