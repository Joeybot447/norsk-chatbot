'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

interface Site {
  id: string;
  name: string;
  domain: string;
  bot_name: string;
  is_active: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { content: string; similarity?: number }[];
  timestamp: Date;
}

export default function ChatPlaygroundPage() {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingSites, setLoadingSites] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load user's sites
  useEffect(() => {
    if (!user) return;
    const loadSites = async () => {
      setLoadingSites(true);
      try {
        const { data, error: err } = await supabase
          .from('sites')
          .select('id, name, domain, bot_name, is_active')
          .eq('user_id', (user as any).id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (err) throw err;
        setSites((data || []) as Site[]);
      } catch (err: any) {
        setError(err.message || 'Kunne ikke laste nettsteder');
      } finally {
        setLoadingSites(false);
      }
    };
    loadSites();
  }, [user]);

  // Update selected site when dropdown changes
  useEffect(() => {
    if (selectedSiteId) {
      const site = sites.find((s) => s.id === selectedSiteId) || null;
      setSelectedSite(site);
    } else {
      setSelectedSite(null);
    }
  }, [selectedSiteId, sites]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Focus input when site is selected
  useEffect(() => {
    if (selectedSite) {
      inputRef.current?.focus();
    }
  }, [selectedSite]);

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    inputRef.current?.focus();
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedSiteId || sending) return;

    const userMessage: Message = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Ikke autentisert — prøv å logge inn på nytt');
      }

      const response = await fetch('/api/chat/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteId: selectedSiteId,
          message: userMessage.content,
          conversationId: conversationId || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Feil ${response.status}`);
      }

      const data = await response.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Kunne ikke sende melding');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || loadingSites) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-sm">Laster...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#0f172a] m-0">Testchat</h1>
          <select
            value={selectedSiteId}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
          >
            <option value="">Velg nettsted...</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}{site.domain ? ` (${site.domain})` : ''}
              </option>
            ))}
          </select>
        </div>
        {selectedSite && (
          <button
            onClick={handleNewConversation}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-[#0f172a] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Ny samtale
          </button>
        )}
      </div>

      {/* Main Content */}
      {!selectedSite ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0f172a] mb-2">Test chatboten din</h2>
            <p className="text-sm text-[#64748b] leading-relaxed">
              Velg et nettsted fra nedtrekkslisten for å starte en testsamtale med chatboten. 
              Samtalen bruker kunnskapsbasen du har lastet opp.
            </p>
            {sites.length === 0 && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Du har ingen aktive nettsteder. Opprett et nettsted først for å teste chatboten.
                </p>
                <a
                  href="/dashboard/sites/new"
                  className="inline-block mt-3 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium no-underline hover:bg-blue-700 transition-colors"
                >
                  Opprett nettsted
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {messages.length === 0 && !sending && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-[#64748b] text-sm mb-1">
                    Samtale med <span className="font-medium text-[#0f172a]">{selectedSite.bot_name || 'NorskBot'}</span> ({selectedSite.name})
                  </p>
                  <p className="text-[#94a3b8] text-xs">
                    Skriv en melding for å starte samtalen
                  </p>
                </div>
              </div>
            )}

            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                    {/* Sender label */}
                    <div className={`text-[11px] font-medium mb-1 ${
                      msg.role === 'user' ? 'text-right text-[#64748b]' : 'text-left text-[#64748b]'
                    }`}>
                      {msg.role === 'user' ? 'Du' : (selectedSite.bot_name || 'NorskBot')}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#2563eb] text-white rounded-br-md'
                          : 'bg-slate-100 text-[#0f172a] rounded-bl-md border border-slate-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-[11px] font-medium text-[#64748b]">
                          Kilder ({msg.sources.length})
                        </div>
                        {msg.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#64748b] leading-relaxed"
                          >
                            <span className="text-[#94a3b8] font-mono mr-1">{idx + 1}.</span>
                            {source.content}
                            {source.similarity != null && (
                              <span className="ml-2 text-[10px] text-[#94a3b8]">
                                ({Math.round(source.similarity * 100)}% treff)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="text-[11px] font-medium mb-1 text-[#64748b]">
                      {selectedSite.bot_name || 'NorskBot'}
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-100 border border-slate-200 inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-6 pb-2 flex-shrink-0">
              <div className="max-w-3xl mx-auto px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-slate-200 bg-white px-6 py-4 flex-shrink-0">
            <div className="max-w-3xl mx-auto flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Skriv en melding..."
                  rows={1}
                  disabled={sending}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    minHeight: '44px',
                    maxHeight: '120px',
                    height: 'auto',
                    overflow: 'auto',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="px-4 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send
              </button>
            </div>
            <div className="max-w-3xl mx-auto mt-2">
              <p className="text-[11px] text-[#94a3b8]">
                Trykk Enter for å sende, Shift+Enter for ny linje
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
