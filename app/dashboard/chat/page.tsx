'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { MessageSquare, Send, Plus, RefreshCw } from 'lucide-react';

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

function formatTime(date: Date): string {
  return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'I dag';
  if (date.toDateString() === yesterday.toDateString()) return 'I gar';
  return date.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' });
}

function isDifferentDay(a: Date, b: Date): boolean {
  return a.toDateString() !== b.toDateString();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator({ botName }: { botName: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="text-[11px] font-medium mb-1 text-slate-400">{botName}</div>
        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-100 border border-slate-200 inline-flex items-center gap-2">
          <span className="text-[13px] text-slate-400 italic">skriver</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-[5px] h-[5px] bg-slate-400 rounded-full animate-pulse" />
            <span className="w-[5px] h-[5px] bg-slate-400 rounded-full animate-pulse [animation-delay:200ms]" />
            <span className="w-[5px] h-[5px] bg-slate-400 rounded-full animate-pulse [animation-delay:400ms]" />
          </span>
        </div>
      </div>
    </div>
  );
}

function DateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
        {formatDateSeparator(date)}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[75%]">
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] font-medium text-slate-400">
            {isUser ? 'Du' : isError ? 'System' : botName}
          </span>
          <span className="text-[10px] text-slate-300 tabular-nums">{formatTime(msg.timestamp)}</span>
        </div>

        {isError ? (
          <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-red-50 border border-red-200 text-sm text-red-700 leading-relaxed">
            <p>{msg.content}</p>
            {msg.retryPayload && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(msg.retryPayload!)}
                className="mt-2 h-auto p-0 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-transparent"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Prov igjen
              </Button>
            )}
          </div>
        ) : (
          <div
            className={`px-4 py-3 text-[14px] leading-[1.6] ${
              isUser
                ? 'bg-blue-600 text-white rounded-2xl rounded-br-[6px]'
                : 'bg-slate-100 text-slate-900 rounded-2xl rounded-bl-[6px] border border-slate-200'
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        // handled by empty state
      } finally {
        setLoadingSites(false);
      }
    };
    loadSites();
  }, [user]);

  useEffect(() => {
    if (selectedSiteId) {
      setSelectedSite(sites.find((s) => s.id === selectedSiteId) || null);
    } else {
      setSelectedSite(null);
    }
  }, [selectedSiteId, sites]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  useEffect(() => {
    if (selectedSite) inputRef.current?.focus();
  }, [selectedSite]);

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
          const { data: { session } } = await supabase.auth.refreshSession();
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

  const handleSend = async (overridePayload?: { siteId: string; message: string; conversationId?: string }) => {
    const msgText = overridePayload?.message ?? input.trim();
    const siteId = overridePayload?.siteId ?? selectedSiteId;
    if (!msgText || !siteId || sending) return;

    if (!overridePayload) {
      const userMessage: Message = {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        role: 'user',
        content: msgText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }

    setSending(true);
    const payload = { siteId, message: msgText, conversationId: overridePayload?.conversationId ?? conversationId ?? undefined };

    try {
      const data = await sendChatRequest(payload);
      if (data.conversationId) setConversationId(data.conversationId);
      const assistantMessage: Message = {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        role: 'assistant',
        content: stripMarkdown(data.response),
        timestamp: new Date(),
      };
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

  if (authLoading || loadingSites) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-400 font-medium">Laster...</p>
      </div>
    );
  }

  const botName = selectedSite?.bot_name || 'NorskBot';

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight whitespace-nowrap">Testchat</h1>

          <Select value={selectedSiteId} onValueChange={handleSiteChange}>
            <SelectTrigger className="w-full sm:w-[240px] h-9 text-sm">
              <SelectValue placeholder="Velg nettsted..." />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}{site.domain ? ` — ${site.domain}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSite && (
          <Button variant="outline" size="sm" onClick={handleNewConversation} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Ny samtale
          </Button>
        )}
      </header>

      {/* Bot info bar */}
      {selectedSite && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[13px] font-bold">
                {(selectedSite.bot_name || selectedSite.name).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{botName}</p>
              <p className="text-[11px] text-slate-400 truncate">{selectedSite.domain || selectedSite.name}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-[11px] text-slate-400">Tilkoblet</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state or chat */}
      {!selectedSite ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="h-6 w-6 text-slate-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Test chatboten din</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Velg et nettsted fra nedtrekkslisten for a starte en testsamtale.
              Samtalen bruker kunnskapsbasen du har lastet opp.
            </p>
            {sites.length === 0 && (
              <Card className="mt-6 border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <p className="text-sm text-amber-800 mb-3">Du har ingen aktive nettsteder enna.</p>
                  <Button asChild size="sm">
                    <a href="/dashboard/sites/new">Opprett nettsted</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
            {messages.length === 0 && !sending && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Start en samtale</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                    Still et sporsmaal til {botName} og se hvordan chatboten svarer basert pa kunnskapsbasen din.
                  </p>
                </div>
              </div>
            )}

            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((msg, idx) => {
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const showDateSep = prevMsg && isDifferentDay(prevMsg.timestamp, msg.timestamp);
                return (
                  <div key={msg.id}>
                    {showDateSep && <DateSeparator date={msg.timestamp} />}
                    <ChatBubble msg={msg} botName={botName} onRetry={handleRetry} />
                  </div>
                );
              })}
              {sending && <TypingIndicator botName={botName} />}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-slate-200 bg-white px-4 sm:px-6 py-3.5 flex-shrink-0">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-end gap-2.5">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onInput={handleTextareaInput}
                    placeholder="Skriv en melding..."
                    rows={1}
                    disabled={sending}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/40 focus:bg-white transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed leading-[1.5] min-h-[42px] max-h-[140px]"
                  />
                </div>
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || sending}
                  size="icon"
                  className="flex-shrink-0 w-[42px] h-[42px] rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 pl-1">
                Enter for a sende &middot; Shift+Enter for ny linje
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
