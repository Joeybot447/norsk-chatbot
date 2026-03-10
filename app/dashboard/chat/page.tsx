'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Site {
  id: string;
  name: string;
  domain: string;
  bot_name: string;
  is_active: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  retryPayload?: { siteId: string; message: string; conversationId?: string };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Strip markdown formatting from text, returning clean readable plain text.
 */
function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/^```\w*\n?/, '').replace(/\n?```$/, ''),
    )
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/^[\s]*[-*+]\s+/gm, '- ')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Format a timestamp as HH:MM
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a date for day separators
 */
function formatDateSeparator(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'I dag';
  if (date.toDateString() === yesterday.toDateString()) return 'I gar';

  return date.toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Check if two dates are on different days
 */
function isDifferentDay(a: Date, b: Date): boolean {
  return a.toDateString() !== b.toDateString();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Typing indicator with text */
function TypingIndicator({ botName }: { botName: string }) {
  return (
    <div className="flex justify-start animate-[fadeSlideUp_0.3s_ease-out]">
      <div className="max-w-[80%]">
        <div className="text-[11px] font-medium mb-1 text-[#64748b]">{botName}</div>
        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[#f1f5f9] border border-slate-200/60 inline-flex items-center gap-2">
          <span className="text-[13px] text-[#94a3b8] italic">skriver</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-[5px] h-[5px] bg-[#94a3b8] rounded-full animate-[typingDot_1.4s_ease-in-out_infinite]" />
            <span
              className="w-[5px] h-[5px] bg-[#94a3b8] rounded-full animate-[typingDot_1.4s_ease-in-out_infinite]"
              style={{ animationDelay: '0.2s' }}
            />
            <span
              className="w-[5px] h-[5px] bg-[#94a3b8] rounded-full animate-[typingDot_1.4s_ease-in-out_infinite]"
              style={{ animationDelay: '0.4s' }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Date separator between messages on different days */
function DateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-200/70" />
      <span className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wide">
        {formatDateSeparator(date)}
      </span>
      <div className="flex-1 h-px bg-slate-200/70" />
    </div>
  );
}

/** Single chat message bubble — clean, no sources, no tokens */
function ChatBubble({
  msg,
  botName,
  onRetry,
}: {
  msg: Message;
  botName: string;
  onRetry?: (payload: NonNullable<Message['retryPayload']>) => void;
}) {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-[fadeSlideUp_0.3s_ease-out]`}
    >
      <div className="max-w-[75%]">
        {/* Sender label + timestamp */}
        <div
          className={`flex items-center gap-2 mb-1 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <span className="text-[11px] font-medium text-[#94a3b8]">
            {isUser ? 'Du' : isError ? 'System' : botName}
          </span>
          <span className="text-[10px] text-[#cbd5e1] tabular-nums">{formatTime(msg.timestamp)}</span>
        </div>

        {/* Bubble */}
        {isError ? (
          <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-red-50 border border-red-200/60 text-sm text-red-700 leading-relaxed">
            <p>{msg.content}</p>
            {msg.retryPayload && onRetry && (
              <button
                onClick={() => onRetry(msg.retryPayload!)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Prov igjen
              </button>
            )}
          </div>
        ) : (
          <div
            className={`px-4 py-3 text-[14px] leading-[1.6] ${
              isUser
                ? 'bg-[#2563eb] text-white rounded-2xl rounded-br-[6px]'
                : 'bg-[#f1f5f9] text-[#1e293b] rounded-2xl rounded-bl-[6px] border border-slate-200/60'
            }`}
          >
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!user) return;
    const loadSites = async () => {
      setLoadingSites(true);
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('id, name, domain, bot_name, is_active')
          .eq('user_id', (user as any).id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setSites((data || []) as Site[]);
      } catch {
        // Sites load error handled by empty state
      } finally {
        setLoadingSites(false);
      }
    };
    loadSites();
  }, [user]);

  useEffect(() => {
    if (selectedSiteId) {
      const site = sites.find((s) => s.id === selectedSiteId) || null;
      setSelectedSite(site);
    } else {
      setSelectedSite(null);
    }
  }, [selectedSiteId, sites]);

  // ---------------------------------------------------------------------------
  // Smooth auto-scroll
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, sending]);

  // Focus input when site selected
  useEffect(() => {
    if (selectedSite) inputRef.current?.focus();
  }, [selectedSite]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    inputRef.current?.focus();
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    setMessages([]);
    setConversationId(null);
  };

  /**
   * Send a chat request with 401 retry logic.
   */
  const sendChatRequest = useCallback(
    async (payload: { siteId: string; message: string; conversationId?: string }) => {
      const attempt = async (isRetry: boolean): Promise<any> => {
        const token = await getAccessToken();
        if (!token) throw new Error('Ikke autentisert. Prov a laste siden pa nytt.');

        const response = await fetch('/api/chat/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });

        if (response.status === 401 && !isRetry) {
          const {
            data: { session },
          } = await supabase.auth.refreshSession();
          if (session?.access_token) return attempt(true);
          throw new Error('Ikke autentisert. Prov a laste siden pa nytt.');
        }

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Feil ${response.status}`);
        }

        return response.json();
      };
      return attempt(false);
    },
    [getAccessToken],
  );

  const handleSend = async (overridePayload?: {
    siteId: string;
    message: string;
    conversationId?: string;
  }) => {
    const msgText = overridePayload?.message ?? input.trim();
    const siteId = overridePayload?.siteId ?? selectedSiteId;
    if (!msgText || !siteId || sending) return;

    // If this is a fresh send (not retry), add user message
    if (!overridePayload) {
      const userMessage: Message = {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        role: 'user',
        content: msgText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }

    setSending(true);

    const payload = {
      siteId,
      message: msgText,
      conversationId: overridePayload?.conversationId ?? conversationId ?? undefined,
    };

    try {
      const data = await sendChatRequest(payload);

      if (data.conversationId) setConversationId(data.conversationId);

      const assistantMessage: Message = {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        role: 'assistant',
        content: stripMarkdown(data.response),
        timestamp: new Date(),
      };

      // Remove any existing error messages for this exchange, then add response
      setMessages((prev) => {
        const cleaned = overridePayload
          ? prev.filter((m) => !(m.role === 'error' && m.retryPayload?.message === msgText))
          : prev;
        return [...cleaned, assistantMessage];
      });
    } catch (err: any) {
      const errorMessage: Message = {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        role: 'error',
        content: err.message || 'Kunne ikke sende melding. Sjekk tilkoblingen og prov igjen.',
        timestamp: new Date(),
        retryPayload: payload as any,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleRetry = (payload: NonNullable<Message['retryPayload']>) => {
    handleSend(payload);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 140) + 'px';
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (authLoading || loadingSites) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#2563eb] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-[#94a3b8] font-medium">Laster...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const botName = selectedSite?.bot_name || 'NorskBot';

  return (
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30%            { opacity: 1;   transform: scale(1); }
        }
      `}</style>

      <div className="flex flex-col h-screen bg-white">
        {/* ----------------------------------------------------------------- */}
        {/* Top Bar                                                           */}
        {/* ----------------------------------------------------------------- */}
        <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-[17px] font-semibold text-[#0f172a] tracking-[-0.01em] m-0">
              Testchat
            </h1>

            {/* Site selector */}
            <div className="relative">
              <select
                value={selectedSiteId}
                onChange={(e) => handleSiteChange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-[7px] bg-[#f8fafc] border border-slate-200/80 rounded-lg text-[13px] text-[#334155] font-medium focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]/40 transition-all min-w-[220px] cursor-pointer hover:border-slate-300"
              >
                <option value="">Velg nettsted...</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                    {site.domain ? ` \u2014 ${site.domain}` : ''}
                  </option>
                ))}
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedSite && (
              <button
                onClick={handleNewConversation}
                className="inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-white border border-slate-200/80 rounded-lg text-[13px] font-medium text-[#475569] hover:bg-[#f8fafc] hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Ny samtale
              </button>
            )}
          </div>
        </header>

        {/* ----------------------------------------------------------------- */}
        {/* Conversation header (when site is selected)                       */}
        {/* ----------------------------------------------------------------- */}
        {selectedSite && (
          <div className="bg-[#f8fafc] border-b border-slate-100 px-6 py-2.5 flex-shrink-0">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[13px] font-bold">
                  {(selectedSite.bot_name || selectedSite.name).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#0f172a] truncate">
                  {botName}
                </p>
                <p className="text-[11px] text-[#94a3b8] truncate">
                  {selectedSite.domain || selectedSite.name}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                <span className="text-[11px] text-[#94a3b8]">Tilkoblet</span>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Empty state (no site selected)                                    */}
        {/* ----------------------------------------------------------------- */}
        {!selectedSite ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-14 h-14 bg-[#f1f5f9] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-[16px] font-semibold text-[#0f172a] mb-2">
                Test chatboten din
              </h2>
              <p className="text-[13px] text-[#64748b] leading-relaxed">
                Velg et nettsted fra nedtrekkslisten for a starte en testsamtale.
                Samtalen bruker kunnskapsbasen du har lastet opp.
              </p>
              {sites.length === 0 && (
                <div className="mt-6 p-4 bg-[#fffbeb] border border-amber-200/60 rounded-xl">
                  <p className="text-[13px] text-amber-800">
                    Du har ingen aktive nettsteder enna.
                  </p>
                  <a
                    href="/dashboard/sites/new"
                    className="inline-block mt-3 px-4 py-2 bg-[#0f172a] text-white rounded-lg text-[13px] font-medium no-underline hover:bg-[#1e293b] active:scale-[0.98] transition-all"
                  >
                    Opprett nettsted
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* ------------------------------------------------------------- */}
            {/* Messages area                                                  */}
            {/* ------------------------------------------------------------- */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
              {/* Chat-start empty state */}
              {messages.length === 0 && !sending && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center animate-[fadeIn_0.5s_ease-out]">
                    <div className="w-12 h-12 bg-[#f1f5f9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-[15px] font-semibold text-[#0f172a] mb-1">
                      Start en samtale
                    </h3>
                    <p className="text-[13px] text-[#64748b] leading-relaxed max-w-xs">
                      Still et sporsmaal til {botName} og se hvordan chatboten svarer
                      basert pa kunnskapsbasen din.
                    </p>
                  </div>
                </div>
              )}

              {/* Message list */}
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((msg, idx) => {
                  // Show date separator if day changed
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showDateSep = prevMsg && isDifferentDay(prevMsg.timestamp, msg.timestamp);

                  return (
                    <div key={msg.id}>
                      {showDateSep && <DateSeparator date={msg.timestamp} />}
                      <ChatBubble
                        msg={msg}
                        botName={botName}
                        onRetry={handleRetry}
                      />
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {sending && <TypingIndicator botName={botName} />}

                <div ref={messagesEndRef} className="h-1" />
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Input area                                                     */}
            {/* ------------------------------------------------------------- */}
            <div className="border-t border-slate-100 bg-white px-4 sm:px-6 py-3.5 flex-shrink-0">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-end gap-2.5">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onInput={handleTextareaInput}
                      placeholder="Skriv en melding..."
                      rows={1}
                      disabled={sending}
                      className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-[14px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb]/40 focus:bg-white transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed leading-[1.5]"
                      style={{ minHeight: '42px', maxHeight: '140px' }}
                    />
                  </div>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || sending}
                    className="flex-shrink-0 w-[42px] h-[42px] flex items-center justify-center bg-[#2563eb] text-white rounded-xl hover:bg-[#1d4ed8] active:scale-[0.95] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#2563eb] cursor-pointer"
                    aria-label="Send melding"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                    >
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-[11px] text-[#cbd5e1] mt-2 pl-1">
                  Enter for a sende &middot; Shift+Enter for ny linje
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
