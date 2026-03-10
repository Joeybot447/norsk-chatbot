/**
 * NorskBot AI Chat Widget
 * Embeddable, zero-dependency, Shadow DOM isolated
 * Features: 6-hour localStorage persistence, conversation restore, rate limit handling
 * (c) 2026 NorskBot AS
 */
(function() {
  'use strict';

  // ── Read config from script tag ──
  var script = document.currentScript;
  if (!script) return;

  var siteId = script.getAttribute('data-site-id');
  var apiKey = script.getAttribute('data-api-key');
  var apiUrl = script.getAttribute('data-api-url') || script.src.replace(/\/widget\.js(\?.*)?$/, '');

  if (!siteId || !apiKey) {
    console.error('NorskBot: data-site-id og data-api-key attributter er pakrevd');
    return;
  }

  // ── Constants ──
  var STORAGE_KEY = 'norskbot_chat_' + siteId;
  var VISITOR_KEY = 'norskbot_visitor_' + siteId;
  var MAX_PERSISTENCE_MS = 6 * 60 * 60 * 1000; // 6 hours
  var MAX_STORED_MESSAGES = 50;

  // ── Utilities ──
  function generateId() {
    return 'v_' + Math.random().toString(36).substr(2, 16);
  }

  function hasLocalStorage() {
    try {
      var test = '__norskbot_ls_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  var canPersist = hasLocalStorage();

  // ── Persistence helpers ──
  function saveConversation() {
    if (!canPersist) return;
    try {
      var toStore = state.messages.slice();
      // Trim to max stored messages (keep newest)
      if (toStore.length > MAX_STORED_MESSAGES) {
        toStore = toStore.slice(toStore.length - MAX_STORED_MESSAGES);
      }
      var data = {
        conversationId: state.conversationId,
        messages: toStore,
        lastActivity: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Storage full or unavailable — silently fail
    }
  }

  function loadConversation() {
    if (!canPersist) return null;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.lastActivity || !data.messages) return null;

      var age = Date.now() - data.lastActivity;
      if (age > MAX_PERSISTENCE_MS) {
        // Expired — clear it
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function clearConversation() {
    state.messages = [];
    state.conversationId = null;
    state.restoredCount = 0;
    if (canPersist) {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }
  }

  // ── State ──
  var state = {
    isOpen: false,
    isLoading: false,
    messages: [],
    conversationId: null,
    visitorId: null,
    config: null,
    configLoaded: false,
    rateLimited: false,
    restoredCount: 0 // how many messages were restored from storage
  };

  // Load visitor ID
  try {
    state.visitorId = localStorage.getItem(VISITOR_KEY) || generateId();
    localStorage.setItem(VISITOR_KEY, state.visitorId);
  } catch (e) {
    state.visitorId = generateId();
  }

  // ── Styles ──
  var CSS = [
    ':host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }',

    /* Bubble */
    '.nb-bubble {',
    '  position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;',
    '  width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;',
    '  background: var(--nb-primary, #2563eb); color: #fff;',
    '  display: flex; align-items: center; justify-content: center;',
    '  box-shadow: 0 4px 16px rgba(0,0,0,0.18);',
    '  transition: transform 0.2s ease, box-shadow 0.2s ease;',
    '  padding: 0; outline: none;',
    '}',
    '.nb-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(0,0,0,0.22); }',
    '.nb-bubble:focus-visible { box-shadow: 0 0 0 3px rgba(37,99,235,0.5); }',
    '.nb-bubble svg { width: 28px; height: 28px; fill: currentColor; }',
    '.nb-bubble--open .nb-icon-chat { display: none; }',
    '.nb-bubble--open .nb-icon-close { display: block; }',
    '.nb-bubble:not(.nb-bubble--open) .nb-icon-chat { display: block; }',
    '.nb-bubble:not(.nb-bubble--open) .nb-icon-close { display: none; }',

    /* Unread badge */
    '.nb-badge {',
    '  position: absolute; top: -2px; right: -2px; width: 18px; height: 18px;',
    '  background: #ef4444; border-radius: 50%; border: 2px solid #fff;',
    '  display: none; pointer-events: none;',
    '}',
    '.nb-badge--visible { display: block; }',

    /* Window */
    '.nb-window {',
    '  position: fixed; bottom: 100px; right: 24px; z-index: 2147483646;',
    '  width: 380px; height: 520px;',
    '  background: #fff; border-radius: 16px;',
    '  box-shadow: 0 20px 60px rgba(0,0,0,0.15);',
    '  display: flex; flex-direction: column; overflow: hidden;',
    '  opacity: 0; transform: translateY(16px) scale(0.96);',
    '  transition: opacity 0.3s ease, transform 0.3s ease;',
    '  pointer-events: none;',
    '}',
    '.nb-window--visible {',
    '  opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;',
    '}',

    /* Header */
    '.nb-header {',
    '  background: var(--nb-primary, #2563eb); color: #fff;',
    '  padding: 14px 16px; display: flex; align-items: center; justify-content: space-between;',
    '  flex-shrink: 0;',
    '}',
    '.nb-header-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }',
    '.nb-header-title { font-size: 16px; font-weight: 600; line-height: 1.2; }',
    '.nb-header-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }',
    '.nb-new-chat {',
    '  background: rgba(255,255,255,0.15); border: none; color: #fff; cursor: pointer;',
    '  padding: 5px 10px; border-radius: 6px; font-size: 12px; font-family: inherit;',
    '  outline: none; transition: background 0.15s; white-space: nowrap;',
    '}',
    '.nb-new-chat:hover { background: rgba(255,255,255,0.25); }',
    '.nb-header-close {',
    '  background: none; border: none; color: #fff; cursor: pointer;',
    '  padding: 4px; display: flex; align-items: center; justify-content: center;',
    '  border-radius: 4px; outline: none; opacity: 0.8; transition: opacity 0.15s;',
    '}',
    '.nb-header-close:hover, .nb-header-close:focus-visible { opacity: 1; }',
    '.nb-header-close svg { width: 20px; height: 20px; fill: currentColor; }',

    /* Messages */
    '.nb-messages {',
    '  flex: 1; overflow-y: auto; padding: 16px 16px 8px; display: flex; flex-direction: column; gap: 8px;',
    '  scroll-behavior: smooth;',
    '}',
    '.nb-msg { max-width: 80%; padding: 10px 14px; font-size: 14px; line-height: 1.5; word-wrap: break-word; white-space: pre-wrap; }',
    '.nb-msg--user {',
    '  align-self: flex-end; background: var(--nb-primary, #2563eb); color: #fff;',
    '  border-radius: 16px 16px 4px 16px;',
    '}',
    '.nb-msg--assistant {',
    '  align-self: flex-start; background: #f1f5f9; color: #1e293b;',
    '  border-radius: 16px 16px 16px 4px;',
    '}',

    /* Divider */
    '.nb-divider {',
    '  display: flex; align-items: center; gap: 10px; margin: 8px 0; color: #94a3b8; font-size: 11px;',
    '}',
    '.nb-divider::before, .nb-divider::after {',
    '  content: ""; flex: 1; height: 1px; background: #e2e8f0;',
    '}',

    /* Typing indicator */
    '.nb-typing {',
    '  align-self: flex-start; background: #f1f5f9; border-radius: 16px 16px 16px 4px;',
    '  padding: 12px 18px; display: flex; gap: 5px; align-items: center;',
    '}',
    '.nb-typing-dot {',
    '  width: 7px; height: 7px; background: #94a3b8; border-radius: 50%;',
    '  animation: nb-dot 1.4s infinite ease-in-out both;',
    '}',
    '.nb-typing-dot:nth-child(2) { animation-delay: 0.16s; }',
    '.nb-typing-dot:nth-child(3) { animation-delay: 0.32s; }',
    '@keyframes nb-dot {',
    '  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }',
    '  40% { opacity: 1; transform: scale(1); }',
    '}',

    /* Input area */
    '.nb-input-area {',
    '  display: flex; align-items: center; padding: 12px 16px; border-top: 1px solid #e2e8f0;',
    '  flex-shrink: 0; gap: 8px; background: #fff;',
    '}',
    '.nb-input {',
    '  flex: 1; border: 1px solid #e2e8f0; border-radius: 24px; padding: 10px 16px;',
    '  font-size: 14px; font-family: inherit; outline: none; resize: none;',
    '  line-height: 1.4; background: #f8fafc; transition: border-color 0.15s;',
    '}',
    '.nb-input:focus { border-color: var(--nb-primary, #2563eb); }',
    '.nb-input::placeholder { color: #94a3b8; }',
    '.nb-send {',
    '  width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;',
    '  background: var(--nb-primary, #2563eb); color: #fff;',
    '  display: flex; align-items: center; justify-content: center;',
    '  flex-shrink: 0; padding: 0; outline: none;',
    '  transition: opacity 0.15s, transform 0.15s;',
    '}',
    '.nb-send:hover { transform: scale(1.05); }',
    '.nb-send:focus-visible { box-shadow: 0 0 0 3px rgba(37,99,235,0.4); }',
    '.nb-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }',
    '.nb-send svg { width: 18px; height: 18px; fill: currentColor; }',

    /* Footer */
    '.nb-footer {',
    '  text-align: center; padding: 6px 16px 10px; font-size: 11px; color: #94a3b8;',
    '  flex-shrink: 0; background: #fff;',
    '}',
    '.nb-footer a { color: #94a3b8; text-decoration: none; }',
    '.nb-footer a:hover { color: #64748b; text-decoration: underline; }',

    /* Error */
    '.nb-error { font-style: italic; color: #ef4444; }',

    /* Restore animation */
    '.nb-msg--restored {',
    '  animation: nb-fade-in 0.3s ease forwards;',
    '  opacity: 0;',
    '}',
    '@keyframes nb-fade-in {',
    '  from { opacity: 0; transform: translateY(4px); }',
    '  to { opacity: 1; transform: translateY(0); }',
    '}',

    /* Mobile */
    '@media (max-width: 480px) {',
    '  .nb-window { top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; border-radius: 0; }',
    '  .nb-bubble { bottom: 16px; right: 16px; }',
    '}'
  ].join('\n');

  // ── SVG Icons ──
  var ICON_CHAT = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

  // ── Create Shadow DOM Host ──
  var host = document.createElement('div');
  host.id = 'norskbot-widget';
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: 'closed' });

  // Inject styles
  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  shadow.appendChild(styleEl);

  // ── Build DOM ──

  // Bubble
  var bubble = document.createElement('button');
  bubble.className = 'nb-bubble';
  bubble.setAttribute('aria-label', 'Apne chat');
  bubble.innerHTML = '<span class="nb-icon-chat">' + ICON_CHAT + '</span><span class="nb-icon-close">' + ICON_CLOSE + '</span>';

  // Unread badge
  var badge = document.createElement('span');
  badge.className = 'nb-badge';
  bubble.appendChild(badge);

  shadow.appendChild(bubble);

  // Window
  var win = document.createElement('div');
  win.className = 'nb-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'Chat med NorskBot');

  // Header
  var header = document.createElement('div');
  header.className = 'nb-header';

  var headerLeft = document.createElement('div');
  headerLeft.className = 'nb-header-left';
  var headerTitle = document.createElement('div');
  headerTitle.className = 'nb-header-title';
  headerTitle.textContent = 'NorskBot';
  headerLeft.appendChild(headerTitle);

  var headerActions = document.createElement('div');
  headerActions.className = 'nb-header-actions';

  var newChatBtn = document.createElement('button');
  newChatBtn.className = 'nb-new-chat';
  newChatBtn.textContent = 'Ny samtale';
  newChatBtn.setAttribute('aria-label', 'Start ny samtale');
  headerActions.appendChild(newChatBtn);

  var closeBtn = document.createElement('button');
  closeBtn.className = 'nb-header-close';
  closeBtn.setAttribute('aria-label', 'Lukk chat');
  closeBtn.innerHTML = ICON_CLOSE;
  headerActions.appendChild(closeBtn);

  header.appendChild(headerLeft);
  header.appendChild(headerActions);
  win.appendChild(header);

  // Messages
  var messagesEl = document.createElement('div');
  messagesEl.className = 'nb-messages';
  messagesEl.setAttribute('role', 'log');
  messagesEl.setAttribute('aria-live', 'polite');
  win.appendChild(messagesEl);

  // Input area
  var inputArea = document.createElement('div');
  inputArea.className = 'nb-input-area';
  var input = document.createElement('input');
  input.className = 'nb-input';
  input.type = 'text';
  input.placeholder = 'Skriv en melding...';
  input.setAttribute('aria-label', 'Skriv en melding');
  var sendBtn = document.createElement('button');
  sendBtn.className = 'nb-send';
  sendBtn.setAttribute('aria-label', 'Send melding');
  sendBtn.innerHTML = ICON_SEND;
  inputArea.appendChild(input);
  inputArea.appendChild(sendBtn);
  win.appendChild(inputArea);

  // Footer with branding
  var footer = document.createElement('div');
  footer.className = 'nb-footer';
  footer.innerHTML = 'Drevet av <a href="https://norskbot.no" target="_blank" rel="noopener">NorskBot</a>';
  win.appendChild(footer);

  shadow.appendChild(win);

  // ── DOM helpers ──
  function scrollToBottom() {
    requestAnimationFrame(function() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function appendMessageEl(role, content, options) {
    var opts = options || {};
    var div = document.createElement('div');
    div.className = 'nb-msg nb-msg--' + role;
    if (opts.restored) {
      div.classList.add('nb-msg--restored');
      div.style.animationDelay = (opts.index || 0) * 30 + 'ms';
    }
    div.textContent = content;
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function appendDivider(text) {
    var div = document.createElement('div');
    div.className = 'nb-divider';
    div.textContent = text;
    messagesEl.appendChild(div);
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'nb-typing';
    el.id = 'nb-typing';
    el.setAttribute('aria-label', 'Skriver...');
    for (var i = 0; i < 3; i++) {
      var dot = document.createElement('div');
      dot.className = 'nb-typing-dot';
      el.appendChild(dot);
    }
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function hideTyping() {
    var el = shadow.getElementById('nb-typing');
    if (el) el.remove();
  }

  function showError(msg) {
    var div = document.createElement('div');
    div.className = 'nb-msg nb-msg--assistant nb-error';
    div.textContent = msg || 'Beklager, noe gikk galt. Prov igjen.';
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function clearMessagesEl() {
    messagesEl.innerHTML = '';
  }

  function showUnreadBadge() {
    if (!state.isOpen) {
      badge.classList.add('nb-badge--visible');
    }
  }

  function hideUnreadBadge() {
    badge.classList.remove('nb-badge--visible');
  }

  function applyTheme(primaryColor) {
    if (primaryColor) {
      var themed = ':host { --nb-primary: ' + primaryColor + '; }\n' + CSS;
      styleEl.textContent = themed;
    }
  }

  // ── Restore saved conversation ──
  function restoreConversation() {
    var saved = loadConversation();
    if (!saved || !saved.messages || saved.messages.length === 0) {
      return false;
    }

    state.conversationId = saved.conversationId || null;
    state.messages = saved.messages;
    state.restoredCount = saved.messages.length;

    // Render divider and restored messages with staggered animation
    appendDivider('Tidligere samtale');
    for (var i = 0; i < saved.messages.length; i++) {
      var m = saved.messages[i];
      appendMessageEl(m.role, m.content, { restored: true, index: i });
    }

    return true;
  }

  // ── Start new conversation (Ny samtale button) ──
  function startNewConversation() {
    clearConversation();
    clearMessagesEl();

    // Re-show welcome message if available
    var welcome = null;
    if (state.config) {
      welcome = state.config.welcomeMessage || state.config.welcome_message;
    }
    if (welcome) {
      state.messages.push({ role: 'assistant', content: welcome });
      appendMessageEl('assistant', welcome);
    }
    input.focus();
  }

  // ── API ──
  function loadConfig(callback) {
    if (state.configLoaded) {
      callback();
      return;
    }

    fetch(apiUrl + '/api/widget?siteId=' + encodeURIComponent(siteId))
      .then(function(res) {
        if (!res.ok) throw new Error('Config load failed');
        return res.json();
      })
      .then(function(data) {
        state.config = data;
        state.configLoaded = true;

        // Apply config
        if (data.botName) headerTitle.textContent = data.botName;
        if (data.bot_name) headerTitle.textContent = data.bot_name;
        if (data.primaryColor) applyTheme(data.primaryColor);
        if (data.primary_color) applyTheme(data.primary_color);
        var themeConfig = data.themeConfig || data.theme_config;
        if (themeConfig) {
          if (themeConfig.primaryColor) applyTheme(themeConfig.primaryColor);
          if (themeConfig.primary_color) applyTheme(themeConfig.primary_color);
        }

        // Try to restore saved conversation first
        var restored = restoreConversation();

        // Welcome message only if no restored conversation
        if (!restored) {
          var welcome = data.welcomeMessage || data.welcome_message;
          if (welcome && state.messages.length === 0) {
            state.messages.push({ role: 'assistant', content: welcome });
            appendMessageEl('assistant', welcome);
          }
        }

        callback();
      })
      .catch(function(err) {
        console.error('NorskBot: Kunne ikke laste konfigurasjon', err);
        state.configLoaded = true;

        // Still try to restore saved conversation
        restoreConversation();

        callback();
      });
  }

  function sendMessage(text) {
    if (!text.trim() || state.isLoading || state.rateLimited) return;

    var msg = text.trim();

    // Client-side length check
    if (msg.length > 2000) {
      showError('Meldingen er for lang');
      return;
    }

    state.messages.push({ role: 'user', content: msg });
    appendMessageEl('user', msg);
    saveConversation();
    input.value = '';
    state.isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    // Rate limit: 1s cooldown between sends
    state.rateLimited = true;
    setTimeout(function() { state.rateLimited = false; }, 1000);

    var body = {
      message: msg,
      visitorId: state.visitorId,
      siteId: siteId
    };
    if (state.conversationId) {
      body.conversationId = state.conversationId;
    }

    fetch(apiUrl + '/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(body)
    })
      .then(function(res) {
        if (res.status === 429) {
          return res.json().then(function(data) {
            throw { rateLimited: true, message: data.error || 'Du har sendt for mange meldinger. Prov igjen om litt.' };
          });
        }
        if (!res.ok) throw new Error('Chat request failed: ' + res.status);
        return res.json();
      })
      .then(function(data) {
        hideTyping();
        state.isLoading = false;
        sendBtn.disabled = false;

        var reply = data.reply || data.message || data.content || '';
        if (reply) {
          state.messages.push({ role: 'assistant', content: reply });
          appendMessageEl('assistant', reply);

          // Show unread badge if chat is closed
          if (!state.isOpen) {
            showUnreadBadge();
          }
        }

        // Store conversationId
        var newConvId = data.conversationId || data.conversation_id;
        if (newConvId) {
          state.conversationId = newConvId;
        }

        // Save to localStorage after bot response
        saveConversation();

        input.focus();
      })
      .catch(function(err) {
        hideTyping();
        state.isLoading = false;
        sendBtn.disabled = false;

        if (err && err.rateLimited) {
          showError(err.message);
        } else {
          console.error('NorskBot: Feil ved sending av melding', err);
          showError('Beklager, noe gikk galt. Prov igjen.');
        }

        input.focus();
      });
  }

  // ── Toggle Chat ──
  function openChat() {
    state.isOpen = true;
    bubble.classList.add('nb-bubble--open');
    bubble.setAttribute('aria-label', 'Lukk chat');
    win.classList.add('nb-window--visible');
    hideUnreadBadge();

    loadConfig(function() {
      input.focus();
    });
  }

  function closeChat() {
    state.isOpen = false;
    bubble.classList.remove('nb-bubble--open');
    bubble.setAttribute('aria-label', 'Apne chat');
    win.classList.remove('nb-window--visible');
  }

  function toggleChat() {
    if (state.isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  // ── Event Listeners ──
  bubble.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', closeChat);
  newChatBtn.addEventListener('click', startNewConversation);

  sendBtn.addEventListener('click', function() {
    sendMessage(input.value);
  });

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  // Escape to close
  shadow.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && state.isOpen) {
      closeChat();
      bubble.focus();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && state.isOpen) {
      closeChat();
      bubble.focus();
    }
  });

  // ── Auto-check for expired conversations on page load ──
  // If there's a saved conversation older than 6 hours, clean it up immediately
  if (canPersist) {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.lastActivity && (Date.now() - parsed.lastActivity > MAX_PERSISTENCE_MS)) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {}
  }

})();
