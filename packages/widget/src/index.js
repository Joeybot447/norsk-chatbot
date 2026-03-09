/**
 * NorskBot Widget
 * Lightweight embeddable chat widget
 * Usage: <script src="..." data-site-id="xxx"></script>
 */

import ChatWidget from './chat.js';
import './styles.css';

// Initialize widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const script = document.currentScript;
  const siteId = script?.getAttribute('data-site-id');
  const apiUrl = script?.getAttribute('data-api-url') || 'https://api.norsk-chatbot.no';

  if (!siteId) {
    console.error('NorskBot: Missing data-site-id attribute');
    return;
  }

  // Initialize widget
  const widget = new ChatWidget({
    siteId,
    apiUrl,
  });

  widget.init();
});

export default ChatWidget;
