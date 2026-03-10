'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  siteId: string;
  apiUrl?: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  title?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  siteId,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  primaryColor = '#0066cc',
  position = 'bottom-right',
  title = 'Chat with us',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          session_id: getSessionId(),
          message: input,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSessionId = () => {
    let sessionId = localStorage.getItem('norskbot_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('norskbot_session_id', sessionId);
    }
    return sessionId;
  };

  const positionClasses = position === 'bottom-left' ? 'left-4' : 'right-4';

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: primaryColor }}
        className={`fixed bottom-4 ${positionClasses} w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center text-white text-2xl z-40`}
      >
        💬
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed bottom-20 ${positionClasses} w-96 h-96 bg-white rounded-lg shadow-xl flex flex-col z-50`}
        >
          {/* Header */}
          <div
            style={{ backgroundColor: primaryColor }}
            className="text-white p-4 rounded-t-lg flex justify-between items-center"
          >
            <h3 className="font-bold">{title}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:opacity-80"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p>Hei! 👋 Hvordan kan vi hjelpe deg i dag?</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 px-3 py-2 rounded-lg">
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Skriv melding..."
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
