'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../_lib/supabase/client';
import { useAuth } from '../_lib/supabase/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  MessageSquare,
  BarChart3,
  Globe,
  Activity,
  MoreHorizontal,
  Archive,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Hash,
  Calendar,
  Clock,
} from 'lucide-react';

/* ── Types ── */

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

/* ── Helpers ── */

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

/* ── Stat Cards ── */

const statIcons = {
  conversations: MessageSquare,
  messages: BarChart3,
  active: Activity,
  sites: Globe,
};

function StatCard({
  label,
  value,
  iconKey,
}: {
  label: string;
  value: string | number;
  iconKey: keyof typeof statIcons;
}) {
  const Icon = statIcons[iconKey];
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div>
          <div className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</div>
          <div className="text-xs text-muted-foreground font-medium mt-0.5">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Main Dashboard ── */

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    totalMessages: 0,
    activeSites: 0,
    activeConversations: 0,
  });
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
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
          const sorted = [...msgs].sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
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

  // Load messages when conversation selected
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
        console.error('Kunne ikke laste meldinger:', err);
      } finally {
        setMessagesLoading(false);
      }
    })();
  }, [selectedConvo]);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  // Auto-select first conversation
  useEffect(() => {
    if (filteredConversations.length > 0 && !filteredConversations.find((c) => c.id === selectedConvo)) {
      setSelectedConvo(filteredConversations[0].id);
    } else if (filteredConversations.length === 0) {
      setSelectedConvo(null);
    }
  }, [statusFilter, filteredConversations.length]);

  const selectedConversation = conversations.find((c) => c.id === selectedConvo) || null;

  // Close conversation handler
  const handleCloseConversation = async (convoId: string) => {
    try {
      await supabase.from('conversations').update({ status: 'closed', ended_at: new Date().toISOString() }).eq('id', convoId);
      setConversations((prev) => prev.map((c) => (c.id === convoId ? { ...c, status: 'closed' } : c)));
    } catch (err) {
      console.error('Feil ved lukking av samtale:', err);
    }
  };

  /* ── Loading State ── */
  if (authLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm text-muted-foreground font-medium">Laster samtaler</div>
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm px-6">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4 text-red-500">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="text-base font-semibold text-slate-900 mb-2">Noe gikk galt</div>
          <div className="text-sm text-muted-foreground leading-relaxed">{error}</div>
        </div>
      </div>
    );
  }

  /* ── Empty State ── */
  if (conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-lg font-semibold text-slate-900 mb-2">Ingen samtaler enn&aring;</div>
          <div className="text-sm text-muted-foreground leading-relaxed mb-6">
            N&aring;r bes&oslash;kende begynner &aring; chatte med boten din, vil samtalene vises her.
            Installer widget-koden p&aring; nettstedet ditt for &aring; komme i gang.
          </div>
          <Button asChild>
            <a href="/dashboard/sites">G&aring; til nettsteder</a>
          </Button>
        </div>
      </div>
    );
  }

  /* ── Main Layout ── */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Stats Row */}
      <div className="flex-shrink-0 px-6 pt-6 pb-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Totalt samtaler" value={stats.totalConversations} iconKey="conversations" />
          <StatCard label="Totalt meldinger" value={stats.totalMessages} iconKey="messages" />
          <StatCard label="Aktive samtaler" value={stats.activeConversations} iconKey="active" />
          <StatCard label="Aktive nettsteder" value={stats.activeSites} iconKey="sites" />
        </div>
      </div>

      <Separator className="mx-6 my-2" />

      {/* Conversation Area */}
      <div className="flex flex-1 min-h-0 px-6 pb-6 pt-3 gap-4">
        {/* Conversation List */}
        <Card
          className={`flex flex-col flex-shrink-0 overflow-hidden ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-[340px]`}
        >
          {/* Filter Bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Alle samtaler ({conversations.length})
                </SelectItem>
                <SelectItem value="active">
                  Aktive ({conversations.filter((c) => c.status === 'active').length})
                </SelectItem>
                <SelectItem value="closed">
                  Lukket ({conversations.filter((c) => c.status === 'closed').length})
                </SelectItem>
              </SelectContent>
            </Select>

            <span className="ml-auto text-xs text-muted-foreground font-medium tabular-nums">
              {filteredConversations.length} samtale{filteredConversations.length !== 1 ? 'r' : ''}
            </span>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                Ingen {statusFilter === 'active' ? 'aktive' : statusFilter === 'closed' ? 'lukkede' : ''} samtaler
              </div>
            ) : (
              <Table>
                <TableBody>
                  {filteredConversations.map((convo) => {
                    const isSelected = selectedConvo === convo.id;
                    const color = getVisitorColor(convo.visitor_id);
                    const initial = getVisitorInitial(convo.visitor_id);
                    const preview =
                      convo.last_role === 'assistant'
                        ? 'Bot: ' + (convo.last_message || '').substring(0, 55)
                        : (convo.last_message || '').substring(0, 55);

                    return (
                      <TableRow
                        key={convo.id}
                        className={`cursor-pointer border-0 border-b border-slate-50 ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                        onClick={() => {
                          setSelectedConvo(convo.id);
                          setMobileShowChat(true);
                        }}
                      >
                        <TableCell className="p-3">
                          <div className="flex gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                              style={{ background: color }}
                            >
                              {initial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-sm font-semibold truncate ${
                                    isSelected ? 'text-blue-900' : 'text-slate-900'
                                  }`}
                                >
                                  {truncateVisitorId(convo.visitor_id)}
                                </span>
                                <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2 tabular-nums">
                                  {formatTime(convo.started_at)}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate leading-relaxed">
                                {preview || 'Ingen meldinger'}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant={convo.status === 'active' ? 'success' : 'muted'} className="text-[10px] px-1.5 py-0">
                                  {convo.status === 'active' ? 'Aktiv' : 'Lukket'}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{convo.site_name}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Chat Panel */}
        <Card
          className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
            !mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-3" />
                <div className="text-sm font-medium">Velg en samtale</div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setMobileShowChat(false)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
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
                      <Badge
                        variant={selectedConversation.status === 'active' ? 'success' : 'muted'}
                        className="text-[11px]"
                      >
                        {selectedConversation.status === 'active' ? 'Aktiv' : 'Lukket'}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {selectedConversation.site_name}
                    </div>
                  </div>
                </div>

                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {selectedConversation.status === 'active' && (
                      <DropdownMenuItem onClick={() => handleCloseConversation(selectedConversation.id)}>
                        <Archive className="h-4 w-4" />
                        Lukk samtale
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4" />
                      Vis nettsted
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600">
                      <Trash2 className="h-4 w-4" />
                      Slett samtale
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 bg-slate-50/50">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    Ingen meldinger i denne samtalen
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-w-2xl mx-auto">
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-2">
                      <Separator className="flex-1" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {new Date(messages[0].created_at).toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <Separator className="flex-1" />
                    </div>

                    {messages.map((msg) => {
                      if (msg.role === 'system') {
                        return (
                          <div key={msg.id} className="text-center py-2">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      const isBot = msg.role === 'assistant';

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 ${isBot ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[85%] ${
                            isBot ? 'self-end' : 'self-start'
                          }`}
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
                              className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                                isBot
                                  ? 'bg-slate-900 text-white rounded-2xl rounded-br-sm'
                                  : 'bg-white text-slate-900 border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm'
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 px-1 tabular-nums">
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
                <div className="text-xs text-muted-foreground text-center">
                  Samtalevisning &mdash; kun lesemodus
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Detail Panel (desktop) */}
        {selectedConversation && (
          <Card className="hidden xl:flex w-72 flex-col flex-shrink-0 overflow-y-auto">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-base"
                  style={{ background: getVisitorColor(selectedConversation.visitor_id) }}
                >
                  {getVisitorInitial(selectedConversation.visitor_id)}
                </div>
                <div>
                  <CardTitle className="text-sm">
                    {truncateVisitorId(selectedConversation.visitor_id)}
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedConversation.status === 'active' ? 'Aktiv samtale' : 'Avsluttet samtale'}
                  </p>
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Samtaledetaljer
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { icon: MessageSquare, label: 'Meldinger', value: String(messages.length) },
                  { icon: Hash, label: 'ID', value: '#' + selectedConversation.id.substring(0, 8) },
                  { icon: Globe, label: 'Nettsted', value: selectedConversation.site_name },
                  {
                    icon: Calendar,
                    label: 'Startet',
                    value: new Date(selectedConversation.started_at).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }),
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5" />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-900 truncate ml-2 max-w-[120px]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-5" />

              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Bes&oslash;kende
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-slate-600 truncate">{selectedConversation.visitor_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={selectedConversation.status === 'active' ? 'success' : 'muted'}
                    className="text-xs"
                  >
                    {selectedConversation.status === 'active' ? 'Aktiv' : 'Avsluttet'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
