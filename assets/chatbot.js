/* assets/chatbot.js — zwevende chatwidget (RAG via serverless API) */

(function initChatbot() {
  const config = window.CHAT_CONFIG || {};
  const apiUrl = (config.apiUrl || '').trim().replace(/\/$/, '');

  const STORAGE_MESSAGES = 'energy-data-chat-messages';
  const STORAGE_PANEL_OPEN = 'energy-data-chat-panel-open';
  const WELCOME_ID = 'chat-welcome';

  const root = document.createElement('div');
  root.className = 'chatRoot';
  root.innerHTML = `
    <button type="button" class="chatFab" id="chatFab" aria-expanded="false" aria-controls="chatPanel" aria-label="Open chat over dit rapport">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="chatFab-label">Vraag</span>
    </button>
    <section class="chatPanel" id="chatPanel" role="dialog" aria-label="Chat over het rapport" aria-hidden="true" hidden>
      <header class="chatHeader">
        <div>
          <h2 class="chatTitle">Vraag over het rapport</h2>
          <p class="chatSubtitle">Antwoorden op basis van de website-inhoud</p>
        </div>
        <button type="button" class="chatClose" id="chatClose" aria-label="Sluit chat">×</button>
      </header>
      <div class="chatMessages" id="chatMessages" role="log" aria-live="polite"></div>
      <form class="chatForm" id="chatForm">
        <label class="visuallyHidden" for="chatInput">Uw vraag</label>
        <textarea id="chatInput" class="chatInput" rows="2" placeholder="Bijv. welke use cases gebruiken netdata?" maxlength="2000" required></textarea>
        <button type="submit" class="chatSend" id="chatSend">Verstuur</button>
      </form>
      <p class="chatHint" id="chatHint"></p>
    </section>
  `;
  document.body.appendChild(root);

  const fab = root.querySelector('#chatFab');
  const panel = root.querySelector('#chatPanel');
  const closeBtn = root.querySelector('#chatClose');
  const messagesEl = root.querySelector('#chatMessages');
  const form = root.querySelector('#chatForm');
  const input = root.querySelector('#chatInput');
  const sendBtn = root.querySelector('#chatSend');
  const hint = root.querySelector('#chatHint');

  if (!apiUrl) {
    hint.textContent = 'Chat-API is nog niet geconfigureerd (assets/chat-config.js).';
  }

  function loadStoredMessages() {
    try {
      const raw = sessionStorage.getItem(STORAGE_MESSAGES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string'
      );
    } catch {
      return [];
    }
  }

  function saveStoredMessages(messages) {
    try {
      sessionStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
    } catch (err) {
      console.warn('Chatgeschiedenis kon niet worden opgeslagen', err);
    }
  }

  let storedMessages = loadStoredMessages();

  function isPanelOpen() {
    return panel.classList.contains('is-open');
  }

  function setOpen(open) {
    panel.classList.toggle('is-open', open);
    panel.hidden = !open;
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    try {
      sessionStorage.setItem(STORAGE_PANEL_OPEN, open ? '1' : '0');
    } catch { /* ignore */ }
    if (open) {
      scheduleScrollToBottom();
      input.focus({ preventScroll: true });
    }
  }

  fab.addEventListener('click', e => {
    e.stopPropagation();
    setOpen(!isPanelOpen());
  });

  closeBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  });

  panel.addEventListener('click', e => e.stopPropagation());

  messagesEl.addEventListener('mousedown', e => {
    if (e.target.closest('a')) e.preventDefault();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isPanelOpen()) setOpen(false);
  });

  function scrollMessagesToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function scheduleScrollToBottom() {
    scrollMessagesToBottom();
    requestAnimationFrame(scrollMessagesToBottom);
  }

  function resolveUrl(url) {
    if (!url) return '#';
    if (/^https?:\/\//i.test(url)) return url;
    try {
      return new URL(url, window.location.href).href;
    } catch {
      return url;
    }
  }

  const ALLOWED_HTML_TAGS = new Set([
    'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'UL', 'OL', 'LI', 'H3', 'H4'
  ]);

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function sanitizeChatHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let changed = true;

    while (changed) {
      changed = false;
      const elements = [...doc.body.querySelectorAll('*')];
      for (const el of elements) {
        if (!ALLOWED_HTML_TAGS.has(el.tagName)) {
          const parent = el.parentNode;
          if (!parent) continue;
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
          changed = true;
          break;
        }
        [...el.attributes].forEach(attr => el.removeAttribute(attr.name));
      }
    }

    return doc.body.innerHTML;
  }

  function formatAssistantHtml(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';
    if (/<\/?[a-z][\s>/]/i.test(trimmed)) {
      return sanitizeChatHtml(trimmed);
    }
    return trimmed
      .split(/\n{2,}/)
      .map(block => `<p>${block.split('\n').map(escapeHtml).join('<br>')}</p>`)
      .join('');
  }

  function setBubbleContent(bubble, role, text) {
    if (role === 'assistant') {
      bubble.innerHTML = formatAssistantHtml(text);
    } else {
      bubble.textContent = text;
    }
  }

  function appendMessage(role, text, sources, id, options = {}) {
    const { persist = true, scroll = true } = options;

    const wrap = document.createElement('div');
    wrap.className = `chatMsg chatMsg--${role}`;
    if (id) wrap.id = id;

    const bubble = document.createElement('div');
    bubble.className = 'chatBubble';
    setBubbleContent(bubble, role, text);
    wrap.appendChild(bubble);

    const srcList = Array.isArray(sources) ? sources : [];
    if (srcList.length) {
      const srcWrap = document.createElement('div');
      srcWrap.className = 'chatSources';
      const label = document.createElement('span');
      label.className = 'chatSources-label';
      label.textContent = 'Pagina\'s op deze site:';
      srcWrap.appendChild(label);
      const list = document.createElement('ul');
      list.className = 'chatSources-list';
      for (const s of srcList) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = resolveUrl(s.url);
        a.textContent = s.title || s.url || 'Bron';
        a.target = '_self';
        li.appendChild(a);
        list.appendChild(li);
      }
      srcWrap.appendChild(list);
      wrap.appendChild(srcWrap);
    }

    messagesEl.appendChild(wrap);
    if (scroll) scrollMessagesToBottom();

    if (persist) {
      storedMessages.push({
        role,
        text,
        sources: srcList.map(s => ({
          title: s.title || '',
          url: s.url || ''
        })),
        id: id || null
      });
      saveStoredMessages(storedMessages);
    }

    return wrap;
  }

  function restoreSession() {
    const live = messagesEl.getAttribute('aria-live');
    messagesEl.setAttribute('aria-live', 'off');

    if (!storedMessages.length) {
      appendMessage(
        'assistant',
        'Stel een vraag over use cases, initiatieven of de reflectie op aanbevelingen uit 2023. Ik verwijs naar pagina\'s op deze site.',
        [],
        WELCOME_ID,
        { scroll: false }
      );
      messagesEl.setAttribute('aria-live', live || 'polite');
      return;
    }

    for (const m of storedMessages) {
      appendMessage(m.role, m.text, m.sources || [], m.id || undefined, { persist: false, scroll: false });
    }

    messagesEl.setAttribute('aria-live', live || 'polite');
  }

  restoreSession();

  try {
    if (sessionStorage.getItem(STORAGE_PANEL_OPEN) === '1') {
      setOpen(true);
    } else {
      scheduleScrollToBottom();
    }
  } catch {
    scheduleScrollToBottom();
  }

  function setLoading(on) {
    sendBtn.disabled = on;
    input.disabled = on;
    sendBtn.textContent = on ? 'Bezig…' : 'Verstuur';
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    if (!apiUrl) {
      appendMessage('assistant', 'De chat-API is nog niet ingesteld. Neem contact op met de beheerder van de site.');
      return;
    }

    appendMessage('user', message);
    input.value = '';
    setLoading(true);

    const loadingEl = appendMessage('assistant', 'Antwoord wordt opgehaald…', [], 'chat-loading', {
      persist: false
    });

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (config.apiKey) headers['X-Chat-Api-Key'] = config.apiKey;

      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message })
      });

      const data = await res.json().catch(() => ({}));

      loadingEl.remove();

      if (!res.ok) {
        const errText = data.error || `Fout (${res.status})`;
        appendMessage('assistant', errText);
        return;
      }

      appendMessage('assistant', data.answer || 'Geen antwoord ontvangen.', data.sources || []);
    } catch (err) {
      loadingEl.remove();
      console.error(err);
      appendMessage('assistant', 'Kon geen verbinding maken met de chat-API. Controleer uw netwerk of probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  });
})();
