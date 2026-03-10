'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../_lib/supabase/client';
import { useAuth } from '../_lib/supabase/hooks';

/* ─── Types ─── */

interface Conversation {
  id: string;
  visitor_id: string;
  status: string;
  started_at: string;
  site_id: string;
  site_name: string;
  last_message: string;
  last_role: string;
  message_count: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface Stats {
  totalConversations: number;
  totalMessages: number;
  activeSites: number;
  activeConversations: number;
}

type StatusFilter = 'all' | 'active' | 'closed';

/* ─── SVG Icon Component ─── */

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const icons = {
  chevronDown: 'M6 9l6 6 6-6',
  msg: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  hash: 'M4 9h16 M4 15h16 M10 3L8 21 M16 3l-2 18',
  calendar: 'M16 2v4 M8 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  barChart: 'M18 20V10 M12 20V4 M6 20v-6',
  archive: 'M21 8v13H3V8 M1 3h22v5H1z M10 12h4',
  close: 'M18 6L6 18 M6 6l12 12',
};

/* ─── Helpers ─── */

function truncateVisitorId(id: string): string {
  if (id.length <= 12) return id;
  return id.substring(0, 6) + '\u2026' + id.substring(id.length - 4);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'I g\u00e5r';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('nb-NO', { weekday: 'long' });
  }
  return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
}

function getVisitorColor(id: string): string {
  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getVisitorInitial(id: string): string {
  return id.charAt(0).toUpperCase();
}

/* ─── Stat Card ─── */

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex items-center gap-4 transition-shadow hover:shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
        <Icon d={icon} size={18} />
      </div>
      <div>
        <div className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</div>
        <div className="text-xs text-slate-500 font-medium mt-0.5">{label}</div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ totalConversations: 0, totalMessages: 0, activeSites: 0, activeConversations: 0 });
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to bottom of messages when they load
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load conversations and stats
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Get user's sites
        const { data: sites, error: sitesErr } = await supabase
          .from('sites')
          .select('id, is_active')
          .eq('user_id', (user as any).id);
        if (sitesErr) throw sitesErr;
        if (!sites || sites.length === 0) {
          setConversations([]);
          setStats({ totalConversations: 0, totalMessages: 0, activeSites: 0, activeConversations: 0 });
          setLoading(false);
          return;
        }

        const siteIds = sites.map((s: { id: string }) => s.id);
        const activeSiteCount = sites.filter((s: { is_active: boolean }) => s.is_active).length;

        // Get conversations with latest messages
        const { data: convos, error: convosErr } = await supabase
          .from('conversations')
          .select('id, visitor_id, status, started_at, site_id, metadata, sites(name), messages(content, role, created_at)')
          .in('site_id', siteIds)
          .order('started_at', { ascending: false })
          .limit(100);
        if (convosErr) throw convosErr;

        let totalMsgCount = 0;
        let activeConvoCount = 0;

        const mapped: Conversation[] = (convos || []).map((c: any) => {
          const msgs = c.messages || [];
          totalMsgCount += msgs.length;
          if (c.status === 'active') activeConvoCount++;
          const sorted = [...msgs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const lastMsg = sorted[0];
          return {
            id: c.id,
            visitor_id: c.visitor_id || 'ukjent',
            status: c.status || 'active',
            started_at: c.started_at,
            site_id: c.site_id,
            site_name: c.sites?.name || 'Ukjent nettsted',
            last_message: lastMsg?.content || '',
            last_role: lastMsg?.role || '',
            message_count: msgs.length,
          };
        });

        setStats({
          totalConversations: mapped.length,
          totalMessages: totalMsgCount,
          activeSites: activeSiteCount,
          activeConversations: activeConvoCount,
        });
        setConversations(mapped);
      } catch (err: any) {
        setError(err.message || 'Kunne ikke laste samtaler');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConvo) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);

    (async () => {
      try {
        const { data, error: msgErr } = await supabase
          .from('messages')
          .select('id, role, content, created_at')
          .eq('conversation_id', selectedConvo)
          .order('created_at', { ascending: true });
        if (msgErr) throw msgErr;
        setMessages((data || []) as Message[]);
      } catch (err: any) {
        console.error('Failed to load messages:', err);
      } finally {
        setMessagesLoading(false);
      }
    })();
  }, [selectedConvo]);

  // Filter conversations by status
  const filteredConversations = conversations.filter((c) => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  // Auto-select first conversation when filter changes
  useEffect(() => {
    if (filteredConversations.length > 0 && !filteredConversations.find((c) => c.id === selectedConvo)) {
      setSelectedConvo(filteredConversations[0].id);
    } else if (filteredConversations.length === 0) {
      setSelectedConvo(null);
    }
  }, [statusFilter, filteredConversations.length]);

  const selectedConversation = conversations.find((c) => c.id === selectedConvo) || null;

  const filterLabels: Record<StatusFilter, string> = {
    all: 'Alle samtaler',
    active: 'Aktive',
    closed: 'Lukket',
  };

  const filterDotColor: Record<StatusFilter, string> = {
    all: '#64748b',
    active: '#22c55e',
    closed: '#94a3b8',
  };

  /* ─── Loading State ─── */
  if (authLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm text-slate-500 font-medium">Laster samtaler</div>
        </div>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm px-6">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <Icon d={icons.close} size={20} />
          </div>
          <div className="text-base font-semibold text-slate-900 mb-2">Noe gikk galt</div>
          <div className="text-sm text-slate-500 leading-relaxed">{error}</div>
        </div>
      </div>
    );
  }

  /* ─── Empty State ─── */
  if (conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-blue-600"><Icon d={icons.msg} size={24} /></span>
          </div>
          <div className="text-lg font-semibold text-slate-900 mb-2">Ingen samtaler enn&aring;</div>
          <div className="text-sm text-slate-500 leading-relaxed mb-6">
            N&aring;r bes&oslash;kende begynner &aring; chatte med boten din, vil samtalene vises her.
            Installer widget-koden p&aring; nettstedet ditt for &aring; komme i gang.
          </div>
          <a
            href="/dashboard/sites"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            G&aring; til nettsteder
          </a>
        </div>
      </div>
    );
  }

  /* ─── Main Layout ─── */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* ─── Stats Row ─── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Totalt samtaler" value={stats.totalConversations} icon={icons.msg} />
          <StatCard label="Totalt meldinger" value={stats.totalMessages} icon={icons.barChart} />
          <StatCard label="Aktive samtaler" value={stats.activeConversations} icon={icons.msg} />
          <StatCard label="Aktive nettsteder" value={stats.activeSites} icon={icons.globe} />
        </div>
      </div>

      {/* ─── Conversation Area ─── */}
      <div className="flex flex-1 min-h-0 px-6 pb-6 pt-3 gap-4">

        {/* ─── Conversation List ─── */}
        <div className={`bg-white rounded-xl border border-slate-200/80 flex flex-col flex-shrink-0 overflow-hidden ${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-[340px]`}>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: filterDotColor[statusFilter] }}
                />
                {filterLabels[statusFilter]}
                <span className="text-slate-400">
                  <Icon d={icons.chevronDown} size={14} />
                </span>
              </button>

              {filterOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50 min-w-[160px]">
                  {(['all', 'active', 'closed'] as StatusFilter[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => { setStatusFilter(status); setFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${statusFilter === status ? 'text-blue-600 font-medium' : 'text-slate-600'}`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: filterDotColor[status] }}
                      />
                      {filterLabels[status]}
                      <span className="ml-auto text-xs text-slate-400">
                        {status === 'all' ? conversations.length
                          : conversations.filter((c) => c.status === status).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="ml-auto text-xs text-slate-400 font-medium tabular-nums">
              {filteredConversations.length} samtale{filteredConversations.length !== 1 ? 'r' : ''}
            </span>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                Ingen {statusFilter === 'active' ? 'aktive' : statusFilter === 'closed' ? 'lukkede' : ''} samtaler
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const isSelected = selectedConvo === convo.id;
                const color = getVisitorColor(convo.visitor_id);
                const initial = getVisitorInitial(convo.visitor_id);
                const preview = convo.last_role === 'assistant'
                  ? 'Bot: ' + (convo.last_message || '').substring(0, 55)
                  : (convo.last_message || '').substring(0, 55);

                return (
                  <button
                    key={convo.id}
                    onClick={() => { setSelectedConvo(convo.id); setMobileShowChat(true); }}
                    className={`w-full text-left flex gap-3 px-4 py-3.5 border-b border-slate-50 transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'}`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style={{ background: color }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                          {truncateVisitorId(convo.visitor_id)}
                        </span>
                        <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2 tabular-nums">
                          {formatTime(convo.started_at)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate leading-relaxed">
                        {preview || 'Ingen meldinger'}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${convo.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: convo.status === 'active' ? '#22c55e' : '#94a3b8' }}
                          />
                          {convo.status === 'active' ? 'Aktiv' : 'Lukket'}
                        </span>
                        <span className="text-[10px] text-slate-400">{convo.site_name}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Chat Panel ─── */}
        <div className={`flex-1 bg-white rounded-xl border border-slate-200/80 flex flex-col min-w-0 overflow-hidden ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <div className="mb-3"><Icon d={icons.msg} size={32} /></div>
                <div className="text-sm font-medium">Velg en samtale</div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ background: getVisitorColor(selectedConversation.visitor_id) }}
                  >
                    {getVisitorInitial(selectedConversation.visitor_id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {truncateVisitorId(selectedConversation.visitor_id)}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${selectedConversation.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: selectedConversation.status === 'active' ? '#22c55e' : '#94a3b8' }}
                        />
                        {selectedConversation.status === 'active' ? 'Aktiv' : 'Lukket'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{selectedConversation.site_name}</div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 bg-slate-50/50">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                    Ingen meldinger i denne samtalen
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-w-2xl mx-auto">
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {new Date(messages[0].created_at).toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {messages.map((msg) => {
                      if (msg.role === 'system') {
                        return (
                          <div key={msg.id} className="text-center py-2">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      const isBot = msg.role === 'assistant';

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 ${isBot ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[85%] ${isBot ? 'self-end' : 'self-start'}`}
                        >
                          {!isBot && selectedConversation && (
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0"
                              style={{ background: getVisitorColor(selectedConversation.visitor_id) }}
                            >
                              {getVisitorInitial(selectedConversation.visitor_id)}
                            </div>
                          )}
                          {isBot && (
                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                              N
                            </div>
                          )}
                          <div className={`flex flex-col ${isBot ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${isBot
                                ? 'bg-slate-900 text-white rounded-2xl rounded-br-sm'
                                : 'bg-white text-slate-900 border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm'
                                }`}
                            >
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 px-1 tabular-nums">
                              {new Date(msg.created_at).toLocaleTimeString('nb-NO', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Read-only footer */}
              <div className="flex-shrink-0 px-5 py-3 border-t border-slate-100 bg-white">
                <div className="text-xs text-slate-400 text-center">
                  Samtalevisning &mdash; kun lesemodus
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Detail Panel (desktop only) ─── */}
        {selectedConversation && (
          <div className="hidden xl:flex w-72 bg-white rounded-xl border border-slate-200/80 flex-col flex-shrink-0 overflow-y-auto">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-base"
                  style={{ background: getVisitorColor(selectedConversation.visitor_id) }}
                >
                  {getVisitorInitial(selectedConversation.visitor_id)}
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    {truncateVisitorId(selectedConversation.visitor_id)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {selectedConversation.status === 'active' ? 'Aktiv samtale' : 'Avsluttet samtale'}
                  </div>
                </div>
              </div>

              {/* Conversation Details */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Samtaledetaljer</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: icons.msg, label: 'Meldinger', value: String(messages.length) },
                    { icon: icons.hash, label: 'ID', value: '#' + selectedConversation.id.substring(0, 8) },
                    { icon: icons.globe, label: 'Nettsted', value: selectedConversation.site_name },
                    {
                      icon: icons.calendar,
                      label: 'Startet',
                      value: new Date(selectedConversation.started_at).toLocaleDateString('nb-NO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }),
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Icon d={item.icon} size={14} />
                        <span className="text-xs">{item.label}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-900 truncate ml-2 max-w-[120px]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visitor Info */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Bes&oslash;kende</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500"><Icon d={icons.hash} size={14} /></span>
                    <span className="text-xs text-slate-600 truncate">{selectedConversation.visitor_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: selectedConversation.status === 'active' ? '#22c55e' : '#94a3b8' }}
                    />
                    <span className="text-xs text-slate-600">
                      {selectedConversation.status === 'active' ? 'Aktiv' : 'Avsluttet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
