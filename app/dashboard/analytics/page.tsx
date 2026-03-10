'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
}

interface TopQuery {
  content: string;
  count: number;
}

interface UsageLogEntry {
  date: string;
  tokens: number;
  calls: number;
}

type DateRangeKey = 7 | 30 | 90 | 0;
type SortColumn = 'name' | 'conversations' | 'messages' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

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
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  return `${(s / 60).toFixed(1)} min`;
}

// ---------------------------------------------------------------------------
// Period selector options
// ---------------------------------------------------------------------------

const PERIODS: { label: string; value: DateRangeKey }[] = [
  { label: 'Siste 7 dager', value: 7 },
  { label: 'Siste 30 dager', value: 30 },
  { label: 'Siste 90 dager', value: 90 },
  { label: 'Alt', value: 0 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<DateRangeKey>(30);
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

  // Sort state for site table
  const [sortCol, setSortCol] = useState<SortColumn>('conversations');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  const loadAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const threshold = dateThreshold(period);

      // 1. Get user's sites
      const { data: sites, error: sitesErr } = await supabase
        .from('sites')
        .select('id, name, domain');
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

      // 2. Conversations (with optional date filter)
      let convQuery = supabase
        .from('conversations')
        .select('id, site_id, status, started_at')
        .in('site_id', siteIds);
      if (threshold) convQuery = convQuery.gte('started_at', threshold);
      const { data: conversations, error: convErr } = await convQuery;
      if (convErr) throw convErr;

      const convs = conversations || [];
      const convIds = convs.map((c: { id: string }) => c.id);

      // Total & active conversations
      setTotalConversations(convs.length);
      setActiveConversations(convs.filter((c: { status: string }) => c.status === 'active').length);

      // 3. Messages for these conversations
      let allMessages: { id: string; conversation_id: string; role: string; content: string; tokens_used: number; created_at: string }[] = [];
      if (convIds.length > 0) {
        // Fetch in batches of 500 to avoid URL length limits
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

      // User vs bot messages
      const uMsgs = allMessages.filter((m) => m.role === 'user').length;
      const bMsgs = allMessages.filter((m) => m.role === 'assistant').length;
      setUserMessages(uMsgs);
      setBotMessages(bMsgs);

      // 4. Daily conversation counts (for bar chart)
      const dailyMap: Record<string, number> = {};
      for (const c of convs) {
        const day = (c as { started_at: string }).started_at.slice(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + 1;
      }
      // Fill gaps
      const sortedDays = Object.keys(dailyMap).sort();
      const filled: DailyCount[] = [];
      if (sortedDays.length > 0) {
        const start = new Date(sortedDays[0]);
        const end = new Date(sortedDays[sortedDays.length - 1]);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          filled.push({ date: key, count: dailyMap[key] || 0 });
        }
      }
      setDailyCounts(filled);

      // 5. Per-site stats
      const siteMap: Record<string, SiteStats> = {};
      for (const s of sites) {
        siteMap[s.id] = { siteId: s.id, siteName: s.name, domain: s.domain, conversations: 0, messages: 0, lastActivity: null };
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
        if (sid && siteMap[sid]) siteMap[sid].messages++;
        // Update lastActivity from messages too
        if (sid && siteMap[sid]) {
          if (!siteMap[sid].lastActivity || m.created_at > siteMap[sid].lastActivity!) {
            siteMap[sid].lastActivity = m.created_at;
          }
        }
      }
      setSiteStats(Object.values(siteMap));

      // 6. Top queries (exact match grouping)
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
      // For each conversation, pair user→assistant messages and compute delta
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
            if (delta > 0 && delta < 300000) { // Cap at 5 min to filter outliers
              totalDelta += delta;
              pairCount++;
            }
          }
        }
      }
      setAvgResponseTime(pairCount > 0 ? totalDelta / pairCount : null);

      // 8. Usage logs (token usage over time)
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
        setUsageLogs(Object.entries(logMap).map(([date, v]) => ({ date, ...v })));
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
        case 'name': cmp = a.siteName.localeCompare(b.siteName, 'nb'); break;
        case 'conversations': cmp = a.conversations - b.conversations; break;
        case 'messages': cmp = a.messages - b.messages; break;
        case 'lastActivity': cmp = (a.lastActivity || '').localeCompare(b.lastActivity || ''); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return copy;
  }, [siteStats, sortCol, sortDir]);

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  // Chart helpers
  const maxDaily = Math.max(...dailyCounts.map((d) => d.count), 1);
  const totalMsgCount = userMessages + botMessages;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Laster analysedata...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header period={period} setPeriod={setPeriod} />
        <div className="p-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header period={period} setPeriod={setPeriod} />

      <main className="flex-1 overflow-auto p-6 max-w-[1400px] mx-auto w-full">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Totale samtaler" value={totalConversations} />
          <SummaryCard label="Totale meldinger" value={totalMessages} />
          <SummaryCard label="Aktive samtaler" value={activeConversations} accent />
          <SummaryCard label="Snitt meldinger / samtale" value={avgMessagesPerConv} decimal />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Conversations over time — spans 2 cols */}
          <Card title="Samtaler over tid" className="lg:col-span-2">
            {dailyCounts.length === 0 ? (
              <EmptyState text="Ingen samtaler i denne perioden" />
            ) : (
              <div className="flex items-end gap-[2px] h-48 pt-4">
                {dailyCounts.map((d) => {
                  const pct = (d.count / maxDaily) * 100;
                  return (
                    <div key={d.date} className="group relative flex-1 flex flex-col justify-end min-w-0">
                      <div
                        className="w-full rounded-t transition-colors bg-blue-500 hover:bg-blue-600"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                          <span className="font-medium">{d.count}</span>
                          <span className="text-slate-400 ml-1">samtaler</span>
                          <br />
                          <span className="text-slate-400">{formatDate(d.date)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {dailyCounts.length > 0 && (
              <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                <span>{formatDate(dailyCounts[0].date)}</span>
                <span>{formatDate(dailyCounts[dailyCounts.length - 1].date)}</span>
              </div>
            )}
          </Card>

          {/* Messages breakdown */}
          <Card title="Meldingsfordeling">
            {totalMsgCount === 0 ? (
              <EmptyState text="Ingen meldinger enna" />
            ) : (
              <div className="flex flex-col gap-5 pt-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">Bruker</span>
                    <span className="font-medium text-slate-900">{userMessages.toLocaleString('nb-NO')}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(userMessages / totalMsgCount) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">Assistent</span>
                    <span className="font-medium text-slate-900">{botMessages.toLocaleString('nb-NO')}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(botMessages / totalMsgCount) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {totalMsgCount > 0 ? Math.round((userMessages / totalMsgCount) * 100) : 0}% bruker
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {totalMsgCount > 0 ? Math.round((botMessages / totalMsgCount) * 100) : 0}% assistent
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Response Time + Top Queries */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Response time */}
          <Card title="Gjennomsnittlig responstid">
            <div className="flex flex-col items-center justify-center h-32">
              {avgResponseTime !== null ? (
                <>
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">
                    {formatDuration(avgResponseTime)}
                  </span>
                  <span className="text-sm text-slate-400 mt-1">per melding</span>
                </>
              ) : (
                <span className="text-sm text-slate-400">Ingen data tilgjengelig</span>
              )}
            </div>
          </Card>

          {/* Top queries */}
          <Card title="Vanligste sporsmaal" className="lg:col-span-2">
            {topQueries.length === 0 ? (
              <EmptyState text="Ingen brukermelding funnet" />
            ) : (
              <div className="divide-y divide-slate-100">
                {topQueries.map((q, i) => {
                  const maxQ = topQueries[0].count;
                  const pct = (q.count / maxQ) * 100;
                  return (
                    <div key={i} className="flex items-center gap-4 py-2.5">
                      <span className="text-xs font-medium text-slate-400 w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{q.content}</p>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-500 tabular-nums">{q.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Per-site breakdown */}
        <Card title="Nettstedoversikt" className="mb-8">
          {sortedSites.length === 0 ? (
            <EmptyState text="Ingen nettsteder funnet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <SortHeader label="Nettsted" col="name" active={sortCol} dir={sortDir} onClick={handleSort} />
                    <SortHeader label="Samtaler" col="conversations" active={sortCol} dir={sortDir} onClick={handleSort} align="right" />
                    <SortHeader label="Meldinger" col="messages" active={sortCol} dir={sortDir} onClick={handleSort} align="right" />
                    <SortHeader label="Siste aktivitet" col="lastActivity" active={sortCol} dir={sortDir} onClick={handleSort} align="right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedSites.map((s, i) => (
                    <tr key={s.siteId} className={`border-b border-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-3 pr-4">
                        <span className="text-sm font-medium text-slate-900">{s.siteName}</span>
                        {s.domain && (
                          <span className="text-xs text-slate-400 ml-2">{s.domain}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-slate-700 tabular-nums">{s.conversations}</td>
                      <td className="py-3 px-4 text-right text-sm text-slate-700 tabular-nums">{s.messages}</td>
                      <td className="py-3 pl-4 text-right text-sm text-slate-400">{formatDateTime(s.lastActivity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Usage Logs */}
        {usageLogs.length > 0 && (
          <Card title="Tokenforbruk over tid" className="mb-8">
            <div className="flex items-end gap-[3px] h-40 pt-4">
              {(() => {
                const maxTokens = Math.max(...usageLogs.map((l) => l.tokens), 1);
                return usageLogs.map((l) => {
                  const pct = (l.tokens / maxTokens) * 100;
                  return (
                    <div key={l.date} className="group relative flex-1 flex flex-col justify-end min-w-0">
                      <div
                        className="w-full rounded-t bg-violet-400 hover:bg-violet-500 transition-colors"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                          <span className="font-medium">{l.tokens.toLocaleString('nb-NO')}</span>
                          <span className="text-slate-400 ml-1">tokens</span>
                          <br />
                          <span className="text-slate-400">{l.calls} kall</span>
                          <br />
                          <span className="text-slate-400">{formatDate(l.date)}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            {usageLogs.length > 0 && (
              <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                <span>{formatDate(usageLogs[0].date)}</span>
                <span>{formatDate(usageLogs[usageLogs.length - 1].date)}</span>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header({ period, setPeriod }: { period: DateRangeKey; setPeriod: (v: DateRangeKey) => void }) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Analyse</h1>
        <p className="text-sm text-slate-400 mt-0.5">Oversikt over samtaler, meldinger og bruk</p>
      </div>
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${period === p.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }
            `}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent, decimal }: { label: string; value: number; accent?: boolean; decimal?: boolean }) {
  const display = decimal ? value.toFixed(1) : value.toLocaleString('nb-NO');
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${accent ? 'text-blue-600' : 'text-slate-900'}`}>
        {display}
      </p>
    </div>
  );
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="px-5 py-4">
        {children}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function SortHeader({
  label,
  col,
  active,
  dir,
  onClick,
  align = 'left',
}: {
  label: string;
  col: SortColumn;
  active: SortColumn;
  dir: SortDirection;
  onClick: (col: SortColumn) => void;
  align?: 'left' | 'right';
}) {
  const isActive = active === col;
  return (
    <th
      className={`py-2.5 px-4 first:pl-0 last:pr-0 text-${align} cursor-pointer select-none group`}
      onClick={() => onClick(col)}
    >
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}
        >
          <path
            d={dir === 'desc' && isActive ? 'M2 3.5L5 7L8 3.5' : 'M2 6.5L5 3L8 6.5'}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </th>
  );
}
