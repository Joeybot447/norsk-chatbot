/**
 * NorskBot AI Chat Widget
 * Embeddable, zero-dependency, Shadow DOM isolated
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

  // ── Utilities ──
  function generateId() {
    return 'v_' + Math.random().toString(36).substr(2, 16);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
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
    rateLimited: false
  };

  try {
    state.conversationId = localStorage.getItem('norskbot_conv_' + siteId) || null;
    state.visitorId = localStorage.getItem('norskbot_visitor_' + siteId) || generateId();
    localStorage.setItem('norskbot_visitor_' + siteId, state.visitorId);
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
    '  padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;',
    '  flex-shrink: 0;',
    '}',
    '.nb-header-title { font-size: 16px; font-weight: 600; line-height: 1.2; }',
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
  shadow.appendChild(bubble);

  // Window
  var win = document.createElement('div');
  win.className = 'nb-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'Chat med NorskBot');

  // Header
  var header = document.createElement('div');
  header.className = 'nb-header';
  var headerTitle = document.createElement('div');
  headerTitle.className = 'nb-header-title';
  headerTitle.textContent = 'NorskBot';
  var closeBtn = document.createElement('button');
  closeBtn.className = 'nb-header-close';
  closeBtn.setAttribute('aria-label', 'Lukk chat');
  closeBtn.innerHTML = ICON_CLOSE;
  header.appendChild(headerTitle);
  header.appendChild(closeBtn);
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

  // Footer
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

  function appendMessageEl(role, content) {
    var div = document.createElement('div');
    div.className = 'nb-msg nb-msg--' + role;
    div.textContent = content;
    messagesEl.appendChild(div);
    scrollToBottom();
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

  function showError() {
    var div = document.createElement('div');
    div.className = 'nb-msg nb-msg--assistant nb-error';
    div.textContent = 'Beklager, noe gikk galt. Prov igjen.';
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function applyTheme(primaryColor) {
    if (primaryColor) {
      host.style.setProperty('--nb-primary', primaryColor);
      // Also set on shadow root for CSS variable inheritance
      styleEl.textContent = CSS.replace(/var\(--nb-primary, #2563eb\)/g, primaryColor);
      // Rebuild with both fallback and override
      var themed = ':host { --nb-primary: ' + primaryColor + '; }\n' + CSS;
      styleEl.textContent = themed;
    }
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

        // Welcome message
        var welcome = data.welcomeMessage || data.welcome_message;
        if (welcome && state.messages.length === 0) {
          state.messages.push({ role: 'assistant', content: welcome });
          appendMessageEl('assistant', welcome);
        }

        callback();
      })
      .catch(function(err) {
        console.error('NorskBot: Kunne ikke laste konfigurasjon', err);
        state.configLoaded = true; // Don't retry infinitely
        callback();
      });
  }

  function sendMessage(text) {
    if (!text.trim() || state.isLoading || state.rateLimited) return;

    var msg = text.trim();
    state.messages.push({ role: 'user', content: msg });
    appendMessageEl('user', msg);
    input.value = '';
    state.isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    // Rate limit: 1s cooldown
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
        }

        // Store conversationId
        var newConvId = data.conversationId || data.conversation_id;
        if (newConvId) {
          state.conversationId = newConvId;
          try {
            localStorage.setItem('norskbot_conv_' + siteId, newConvId);
          } catch (e) { /* localStorage unavailable */ }
        }

        input.focus();
      })
      .catch(function(err) {
        console.error('NorskBot: Feil ved sending av melding', err);
        hideTyping();
        state.isLoading = false;
        sendBtn.disabled = false;
        showError();
        input.focus();
      });
  }

  // ── Toggle Chat ──
  function openChat() {
    state.isOpen = true;
    bubble.classList.add('nb-bubble--open');
    bubble.setAttribute('aria-label', 'Lukk chat');
    win.classList.add('nb-window--visible');

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

  // Also listen on document for Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && state.isOpen) {
      closeChat();
      bubble.focus();
    }
  });

})();
