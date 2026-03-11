'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  MessageSquare,
  BarChart3,
  Activity,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
} from 'lucide-react';

/* ── Types ── */

interface SiteStats {
  siteId: string;
  siteName: string;
  domain: string | null;
  conversations: number;
  messages: number;
  lastActivity: string | null;
}

interface DailyCount {
  date: string;
  count: number;
  label: string;
}

interface TopQuery {
  content: string;
  count: number;
}

interface UsageLogEntry {
  date: string;
  tokens: number;
  calls: number;
  label: string;
}

interface MessageBreakdown {
  name: string;
  value: number;
  color: string;
}

type DateRangeKey = '7' | '30' | '90' | '0';
type SortColumn = 'name' | 'conversations' | 'messages' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

/* ── Utility ── */

function dateThreshold(days: number): string | null {
  if (days === 0) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  return d.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  return `${(s / 60).toFixed(1)} min`;
}

/* ── Chart Colors ── */

const PRIMARY = '#2563eb';
const SECONDARY = '#64748b';

/* ── Custom Tooltip ── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-slate-900 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: entry.color }} />
          {entry.name}: <span className="font-medium text-slate-900">{entry.value?.toLocaleString('nb-NO')}</span>
        </p>
      ))}
    </div>
  );
}

/* ── Component ── */

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<DateRangeKey>('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data state
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [activeConversations, setActiveConversations] = useState(0);
  const [avgMessagesPerConv, setAvgMessagesPerConv] = useState(0);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [userMessages, setUserMessages] = useState(0);
  const [botMessages, setBotMessages] = useState(0);
  const [siteStats, setSiteStats] = useState<SiteStats[]>([]);
  const [topQueries, setTopQueries] = useState<TopQuery[]>([]);
  const [avgResponseTime, setAvgResponseTime] = useState<number | null>(null);
  const [usageLogs, setUsageLogs] = useState<UsageLogEntry[]>([]);

  // Sort state
  const [sortCol, setSortCol] = useState<SortColumn>('conversations');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  /* ── Data Loading ── */

  const loadAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const days = parseInt(period);
      const threshold = dateThreshold(days);

      // 1. Sites
      const { data: sites, error: sitesErr } = await supabase.from('sites').select('id, name, domain');
      if (sitesErr) throw sitesErr;
      if (!sites || sites.length === 0) {
        setTotalConversations(0);
        setTotalMessages(0);
        setActiveConversations(0);
        setAvgMessagesPerConv(0);
        setDailyCounts([]);
        setUserMessages(0);
        setBotMessages(0);
        setSiteStats([]);
        setTopQueries([]);
        setAvgResponseTime(null);
        setUsageLogs([]);
        setLoading(false);
        return;
      }

      const siteIds = sites.map((s: { id: string }) => s.id);

      // 2. Conversations
      let convQuery = supabase
        .from('conversations')
        .select('id, site_id, status, started_at')
        .in('site_id', siteIds);
      if (threshold) convQuery = convQuery.gte('started_at', threshold);
      const { data: conversations, error: convErr } = await convQuery;
      if (convErr) throw convErr;

      const convs = conversations || [];
      const convIds = convs.map((c: { id: string }) => c.id);

      setTotalConversations(convs.length);
      setActiveConversations(convs.filter((c: { status: string }) => c.status === 'active').length);

      // 3. Messages
      let allMessages: {
        id: string;
        conversation_id: string;
        role: string;
        content: string;
        tokens_used: number;
        created_at: string;
      }[] = [];
      if (convIds.length > 0) {
        for (let i = 0; i < convIds.length; i += 500) {
          const batch = convIds.slice(i, i + 500);
          const { data: msgs, error: msgErr } = await supabase
            .from('messages')
            .select('id, conversation_id, role, content, tokens_used, created_at')
            .in('conversation_id', batch)
            .order('created_at', { ascending: true });
          if (msgErr) throw msgErr;
          if (msgs) allMessages = allMessages.concat(msgs);
        }
      }

      setTotalMessages(allMessages.length);
      setAvgMessagesPerConv(convs.length > 0 ? Math.round((allMessages.length / convs.length) * 10) / 10 : 0);

      const uMsgs = allMessages.filter((m) => m.role === 'user').length;
      const bMsgs = allMessages.filter((m) => m.role === 'assistant').length;
      setUserMessages(uMsgs);
      setBotMessages(bMsgs);

      // 4. Daily conversation counts
      const dailyMap: Record<string, number> = {};
      for (const c of convs) {
        const day = (c as { started_at: string }).started_at.slice(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + 1;
      }
      const sortedDays = Object.keys(dailyMap).sort();
      const filled: DailyCount[] = [];
      if (sortedDays.length > 0) {
        const start = new Date(sortedDays[0]);
        const end = new Date(sortedDays[sortedDays.length - 1]);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          filled.push({
            date: key,
            count: dailyMap[key] || 0,
            label: formatDate(key),
          });
        }
      }
      setDailyCounts(filled);

      // 5. Per-site stats
      const siteMap: Record<string, SiteStats> = {};
      for (const s of sites) {
        siteMap[s.id] = {
          siteId: s.id,
          siteName: s.name,
          domain: s.domain,
          conversations: 0,
          messages: 0,
          lastActivity: null,
        };
      }
      const convToSite: Record<string, string> = {};
      for (const c of convs) {
        const sid = (c as { site_id: string }).site_id;
        convToSite[c.id] = sid;
        if (siteMap[sid]) {
          siteMap[sid].conversations++;
          const ca = (c as { started_at: string }).started_at;
          if (!siteMap[sid].lastActivity || ca > siteMap[sid].lastActivity!) {
            siteMap[sid].lastActivity = ca;
          }
        }
      }
      for (const m of allMessages) {
        const sid = convToSite[m.conversation_id];
        if (sid && siteMap[sid]) {
          siteMap[sid].messages++;
          if (!siteMap[sid].lastActivity || m.created_at > siteMap[sid].lastActivity!) {
            siteMap[sid].lastActivity = m.created_at;
          }
        }
      }
      setSiteStats(Object.values(siteMap));

      // 6. Top queries
      const queryMap: Record<string, number> = {};
      for (const m of allMessages) {
        if (m.role === 'user' && m.content.trim().length > 0) {
          const normalized = m.content.trim().toLowerCase();
          queryMap[normalized] = (queryMap[normalized] || 0) + 1;
        }
      }
      const sorted = Object.entries(queryMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([content, count]) => ({ content, count }));
      setTopQueries(sorted);

      // 7. Average response time
      const convMsgMap: Record<string, typeof allMessages> = {};
      for (const m of allMessages) {
        if (!convMsgMap[m.conversation_id]) convMsgMap[m.conversation_id] = [];
        convMsgMap[m.conversation_id].push(m);
      }
      let totalDelta = 0;
      let pairCount = 0;
      for (const msgs of Object.values(convMsgMap)) {
        for (let i = 0; i < msgs.length - 1; i++) {
          if (msgs[i].role === 'user' && msgs[i + 1].role === 'assistant') {
            const delta = new Date(msgs[i + 1].created_at).getTime() - new Date(msgs[i].created_at).getTime();
            if (delta > 0 && delta < 300000) {
              totalDelta += delta;
              pairCount++;
            }
          }
        }
      }
      setAvgResponseTime(pairCount > 0 ? totalDelta / pairCount : null);

      // 8. Usage logs
      let usageQuery = supabase
        .from('usage_logs')
        .select('tokens_used, created_at')
        .in('site_id', siteIds)
        .order('created_at', { ascending: true });
      if (threshold) usageQuery = usageQuery.gte('created_at', threshold);
      const { data: logs } = await usageQuery;

      if (logs && logs.length > 0) {
        const logMap: Record<string, { tokens: number; calls: number }> = {};
        for (const l of logs) {
          const day = (l as { created_at: string }).created_at.slice(0, 10);
          if (!logMap[day]) logMap[day] = { tokens: 0, calls: 0 };
          logMap[day].tokens += (l as { tokens_used: number }).tokens_used || 0;
          logMap[day].calls++;
        }
        setUsageLogs(
          Object.entries(logMap).map(([date, v]) => ({
            date,
            ...v,
            label: formatDate(date),
          }))
        );
      } else {
        setUsageLogs([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kunne ikke laste analysedata');
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    if (!authLoading && user) loadAnalytics();
    else if (!authLoading && !user) setLoading(false);
  }, [authLoading, user, loadAnalytics]);

  // Sorted site stats
  const sortedSites = useMemo(() => {
    const copy = [...siteStats];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'name':
          cmp = a.siteName.localeCompare(b.siteName, 'nb');
          break;
        case 'conversations':
          cmp = a.conversations - b.conversations;
          break;
        case 'messages':
          cmp = a.messages - b.messages;
          break;
        case 'lastActivity':
          cmp = (a.lastActivity || '').localeCompare(b.lastActivity || '');
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return copy;
  }, [siteStats, sortCol, sortDir]);

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  // Message breakdown for PieChart
  const messageBreakdown: MessageBreakdown[] = useMemo(
    () => [
      { name: 'Bruker', value: userMessages, color: PRIMARY },
      { name: 'Assistent', value: botMessages, color: SECONDARY },
    ],
    [userMessages, botMessages]
  );

  const totalMsgCount = userMessages + botMessages;

  /* ── Sort Icon ── */
  function SortIcon({ col }: { col: SortColumn }) {
    if (sortCol !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'desc' ? (
      <ArrowDown className="h-3 w-3 ml-1" />
    ) : (
      <ArrowUp className="h-3 w-3 ml-1" />
    );
  }

  /* ── Loading ── */
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Laster analysedata...</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <AnalyticsHeader period={period} setPeriod={setPeriod} />
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-600 text-sm">{error}</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <AnalyticsHeader period={period} setPeriod={setPeriod} />

      <main className="flex-1 overflow-auto p-6 max-w-[1400px] mx-auto w-full">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Totale samtaler" value={totalConversations} icon={MessageSquare} />
          <SummaryCard label="Totale meldinger" value={totalMessages} icon={BarChart3} />
          <SummaryCard label="Aktive samtaler" value={activeConversations} icon={Activity} accent />
          <SummaryCard
            label="Snitt meldinger / samtale"
            value={avgMessagesPerConv}
            icon={TrendingUp}
            decimal
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Conversations over time */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Samtaler over tid</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyCounts.length === 0 ? (
                <EmptyChart text="Ingen samtaler i denne perioden" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyCounts} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Samtaler" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Messages breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Meldingsfordeling</CardTitle>
            </CardHeader>
            <CardContent>
              {totalMsgCount === 0 ? (
                <EmptyChart text="Ingen meldinger enna" />
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={messageBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {messageBreakdown.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-6 mt-2">
                    {messageBreakdown.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                        <span>
                          {entry.name}: {entry.value.toLocaleString('nb-NO')} (
                          {totalMsgCount > 0 ? Math.round((entry.value / totalMsgCount) * 100) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Response Time + Top Queries */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Gjennomsnittlig responstid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-32">
                {avgResponseTime !== null ? (
                  <>
                    <Clock className="h-5 w-5 text-muted-foreground mb-2" />
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">
                      {formatDuration(avgResponseTime)}
                    </span>
                    <span className="text-sm text-muted-foreground mt-1">per melding</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Ingen data tilgjengelig</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Vanligste henvendelser</CardTitle>
            </CardHeader>
            <CardContent>
              {topQueries.length === 0 ? (
                <EmptyChart text="Ingen brukermeldinger funnet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Henvendelse</TableHead>
                      <TableHead className="text-right w-20">Antall</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topQueries.map((q, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground font-medium">{i + 1}</TableCell>
                        <TableCell className="truncate max-w-[300px]">{q.content}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="tabular-nums">
                            {q.count}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Per-site breakdown */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Nettstedoversikt</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedSites.length === 0 ? (
              <EmptyChart text="Ingen nettsteder funnet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      <span className="inline-flex items-center">
                        Nettsted
                        <SortIcon col="name" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer select-none"
                      onClick={() => handleSort('conversations')}
                    >
                      <span className="inline-flex items-center justify-end">
                        Samtaler
                        <SortIcon col="conversations" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer select-none"
                      onClick={() => handleSort('messages')}
                    >
                      <span className="inline-flex items-center justify-end">
                        Meldinger
                        <SortIcon col="messages" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer select-none"
                      onClick={() => handleSort('lastActivity')}
                    >
                      <span className="inline-flex items-center justify-end">
                        Siste aktivitet
                        <SortIcon col="lastActivity" />
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSites.map((s) => (
                    <TableRow key={s.siteId}>
                      <TableCell>
                        <span className="font-medium text-slate-900">{s.siteName}</span>
                        {s.domain && (
                          <span className="text-xs text-muted-foreground ml-2">{s.domain}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{s.conversations}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.messages}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDateTime(s.lastActivity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Token Usage */}
        {usageLogs.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Tokenforbruk over tid</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={usageLogs} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    name="Tokens"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    fill="url(#tokenGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function AnalyticsHeader({
  period,
  setPeriod,
}: {
  period: DateRangeKey;
  setPeriod: (v: DateRangeKey) => void;
}) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Analyse</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Oversikt over samtaler, meldinger og bruk
        </p>
      </div>
      <Tabs value={period} onValueChange={(v) => setPeriod(v as DateRangeKey)}>
        <TabsList>
          <TabsTrigger value="7">7d</TabsTrigger>
          <TabsTrigger value="30">30d</TabsTrigger>
          <TabsTrigger value="90">90d</TabsTrigger>
          <TabsTrigger value="0">Alt</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
  decimal,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  decimal?: boolean;
}) {
  const display = decimal ? value.toFixed(1) : value.toLocaleString('nb-NO');
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <p
          className={`text-2xl font-semibold tracking-tight ${
            accent ? 'text-blue-600' : 'text-slate-900'
          }`}
        >
          {display}
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
