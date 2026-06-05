/**
 * Genereert assets/chat-config.js vanuit omgevingsvariabelen.
 * Browsers op GitHub Pages kunnen geen .env lezen; dit is build-time injectie.
 *
 * Gebruik:
 *   CHAT_API_URL=https://jouw-api.vercel.app npm run build:chat-config
 * Of zet CHAT_API_URL in .env.local en run npm run build:chat-config
 */
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outPath = resolve(root, 'assets/chat-config.js');

config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });

const DEFAULT_PROD_CHAT_API_URL = 'https://energy-data-governance-2026-chatapi.vercel.app';

function isLocalApiUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

const rawChatApiUrl = (
  process.env.CHAT_API_URL ||
  process.env.PUBLIC_CHAT_API_URL ||
  DEFAULT_PROD_CHAT_API_URL
).trim().replace(/\/$/, '');

const PROD_CHAT_API_URL = isLocalApiUrl(rawChatApiUrl)
  ? (console.warn(
      `CHAT_API_URL=${rawChatApiUrl} is lokaal — PROD_CHAT_API_URL wordt ${DEFAULT_PROD_CHAT_API_URL}`
    ), DEFAULT_PROD_CHAT_API_URL)
  : rawChatApiUrl;

const CHAT_API_KEY = (
  process.env.CHAT_CLIENT_API_KEY ||
  process.env.PUBLIC_CHAT_API_KEY ||
  ''
).trim();

function parseChatEnabled(value) {
  if (value === undefined || value === null || value === '') return true;
  const normalized = String(value).trim().toLowerCase();
  return !['0', 'false', 'no', 'off'].includes(normalized);
}

const CHAT_ENABLED = parseChatEnabled(process.env.CHAT_ENABLED);

const source = `/**
 * AUTO-GENERATED — niet handmatig bewerken.
 * Genereer opnieuw: npm run build:chat-config
 * Bron: CHAT_API_URL, CHAT_CLIENT_API_KEY, CHAT_ENABLED (.env.local / CI / Vercel build env)
 */
(function initChatConfig() {
  const PROD_CHAT_API_URL = ${JSON.stringify(PROD_CHAT_API_URL)};
  const LOCAL_CHAT_API_URL = 'http://localhost:3000';

  function isLocalHost(hostname) {
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]'
    );
  }

  function resolveChatApiUrl() {
    const { hostname, port, origin } = window.location;

    if (isLocalHost(hostname)) {
      const params = new URLSearchParams(window.location.search);
      const override = (params.get('chatApi') || '').trim();
      if (override) return override.replace(/\\/$/, '');

      if (port === '3000') return origin.replace(/\\/$/, '');
      return LOCAL_CHAT_API_URL;
    }

    if (PROD_CHAT_API_URL) return PROD_CHAT_API_URL;
    return origin.replace(/\\/$/, '');
  }

  window.CHAT_CONFIG = {
    apiUrl: resolveChatApiUrl(),
    apiKey: ${JSON.stringify(CHAT_API_KEY)},
    enabled: ${CHAT_ENABLED}
  };
})();
`;

writeFileSync(outPath, source, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`  PROD_CHAT_API_URL = ${PROD_CHAT_API_URL || '(same origin as site)'}`);
console.log(`  CHAT_API_KEY      = ${CHAT_API_KEY ? '(set)' : '(empty — set CHAT_CLIENT_API_KEY at build time if API requires it)'}`);
console.log(`  CHAT_ENABLED      = ${CHAT_ENABLED}`);
