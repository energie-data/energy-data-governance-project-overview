/**
 * AUTO-GENERATED — niet handmatig bewerken.
 * Genereer opnieuw: npm run build:chat-config
 * Bron: CHAT_API_URL, CHAT_CLIENT_API_KEY (.env.local / CI / Vercel build env)
 */
(function initChatConfig() {
  const PROD_CHAT_API_URL = "http://localhost:3000";
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
      if (override) return override.replace(/\/$/, '');

      if (port === '3000') return origin.replace(/\/$/, '');
      return LOCAL_CHAT_API_URL;
    }

    if (PROD_CHAT_API_URL) return PROD_CHAT_API_URL;
    return origin.replace(/\/$/, '');
  }

  window.CHAT_CONFIG = {
    apiUrl: resolveChatApiUrl(),
    apiKey: ""
  };
})();
