/**
 * Chat Widget Component
 * Handles UI and messaging logic
 */

import axios from 'axios';

class ChatWidget {
  constructor(options = {}) {
    this.siteId = options.siteId;
    this.apiUrl = options.apiUrl || 'https://api.norsk-chatbot.no';
    this.sessionId = this.generateSessionId();
    this.isOpen = false;
    this.messages = [];
    this.config = {};

    this.containerEl = null;
    this.chatWindowEl = null;
    this.messageListEl = null;
    this.inputEl = null;
    this.sendButtonEl = null;
  }

  /**
   * Initialize the widget
   */
  async init() {
    try {
      // Load widget configuration
      await this.loadConfig();

      // Create DOM elements
      this.createWidget();

      // Attach event listeners
      this.attachListeners();
    } catch (err) {
      console.error('NorskBot: Initialization failed', err);
    }
  }

  /**
   * Load widget configuration from API
   */
  async loadConfig() {
    try {
      const response = await axios.get(
        `${this.apiUrl}/v1/widget/${this.siteId}`,
        {
          timeout: 5000,
        }
      );

      this.config = response.data.config || {};
    } catch (err) {
      console.warn('NorskBot: Failed to load config, using defaults');
      this.config = {
        primary_color: '#007bff',
        secondary_color: '#6c757d',
        position: 'bottom-right',
        welcome_message: 'Hej! Hvordan kan jeg hjelpe deg?',
      };
    }
  }

  /**
   * Create widget DOM elements
   */
  createWidget() {
    // Container
    this.containerEl = document.createElement('div');
    this.containerEl.id = 'norsk-chatbot';
    this.containerEl.className = 'norsk-chatbot-container';

    // Chat button
    const buttonEl = document.createElement('button');
    buttonEl.className = 'norsk-chatbot-button';
    buttonEl.innerHTML = '💬';
    buttonEl.style.backgroundColor = this.config.primary_color || '#007bff';
    buttonEl.onclick = () => this.toggle();

    // Chat window
    this.chatWindowEl = document.createElement('div');
    this.chatWindowEl.className = 'norsk-chatbot-window norsk-chatbot-hidden';
    this.chatWindowEl.innerHTML = `
      <div class="norsk-chatbot-header" style="background-color: ${
        this.config.primary_color || '#007bff'
      }">
        <h3>${this.config.name || 'Chat'}</h3>
        <button class="norsk-chatbot-close" onclick="this.closest('.norsk-chatbot-container').querySelector('.norsk-chatbot-widget').click()">✕</button>
      </div>
      <div class="norsk-chatbot-messages"></div>
      <div class="norsk-chatbot-input-area">
        <input type="text" placeholder="Skriv ditt spørsmål..." class="norsk-chatbot-input">
        <button class="norsk-chatbot-send">Send</button>
      </div>
    `;

    // Attach elements
    this.containerEl.appendChild(buttonEl);
    this.containerEl.appendChild(this.chatWindowEl);
    document.body.appendChild(this.containerEl);

    // Cache element references
    this.messageListEl = this.chatWindowEl.querySelector('.norsk-chatbot-messages');
    this.inputEl = this.chatWindowEl.querySelector('.norsk-chatbot-input');
    this.sendButtonEl = this.chatWindowEl.querySelector('.norsk-chatbot-send');

    // Welcome message
    this.addMessage('assistant', this.config.welcome_message || 'Hej! Hvordan kan jeg hjelpe deg?');
  }

  /**
   * Attach event listeners
   */
  attachListeners() {
    this.sendButtonEl.onclick = () => this.sendMessage();
    this.inputEl.onkeypress = (e) => {
      if (e.key === 'Enter') this.sendMessage();
    };

    // Keyboard shortcut (Cmd+I or Ctrl+I)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        this.toggle();
      }
    });
  }

  /**
   * Toggle chat window visibility
   */
  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.chatWindowEl.classList.remove('norsk-chatbot-hidden');
      this.inputEl.focus();
    } else {
      this.chatWindowEl.classList.add('norsk-chatbot-hidden');
    }
  }

  /**
   * Send a message
   */
  async sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text) return;

    // Add user message to UI
    this.addMessage('user', text);
    this.inputEl.value = '';

    // Send to API
    try {
      this.sendButtonEl.disabled = true;
      const response = await axios.post(
        `${this.apiUrl}/v1/chat/message`,
        {
          message: text,
          sessionId: this.sessionId,
        },
        {
          headers: {
            'X-Site-Id': this.siteId,
          },
          timeout: 30000,
        }
      );

      const { message, sources } = response.data;
      this.addMessage('assistant', message, sources);
    } catch (err) {
      console.error('NorskBot: Message failed', err);
      this.addMessage(
        'assistant',
        'Jeg kunne ikke svare på det nå. Vennligst prøv igjen eller kontakt oss direkte.'
      );
    } finally {
      this.sendButtonEl.disabled = false;
      this.inputEl.focus();
    }
  }

  /**
   * Add message to chat
   */
  addMessage(role, content, sources = []) {
    const messageEl = document.createElement('div');
    messageEl.className = `norsk-chatbot-message norsk-chatbot-message-${role}`;

    let html = `<div class="norsk-chatbot-message-text">${this.escapeHtml(content)}</div>`;

    if (sources && sources.length > 0) {
      html += '<div class="norsk-chatbot-sources">';
      sources.forEach((source) => {
        if (source.url) {
          html += `<a href="${source.url}" target="_blank" rel="noopener">${this.escapeHtml(
            source.title || 'Source'
          )}</a>`;
        }
      });
      html += '</div>';
    }

    messageEl.innerHTML = html;
    this.messageListEl.appendChild(messageEl);

    // Auto-scroll to bottom
    this.messageListEl.scrollTop = this.messageListEl.scrollHeight;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }
}

export default ChatWidget;
