'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const MetricCard = ({ label, value, trend, trendUp }: { label: string; value: string | number; trend: string; trendUp: boolean }) => (
  <div style={{
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    flex: 1,
    minWidth: '200px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    fontFamily,
  }}>
    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px', margin: '0 0 8px 0' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
      <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{value}</p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: trendUp ? '#d1fae5' : '#fee2e2',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={trendUp ? '#16a34a' : '#dc2626'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d={trendUp ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
        </svg>
      </span>
      <p style={{ fontSize: '12px', color: trendUp ? '#16a34a' : '#dc2626', margin: 0 }}>
        {trend}
      </p>
    </div>
  </div>
);

interface SiteStats {
  siteName: string;
  conversations: number;
  messages: number;
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [dateRange, setDateRange] = useState(7);
  const [loading, setLoading] = useState(true);
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [siteStats, setSiteStats] = useState<SiteStats[]>([]);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      // Get user's sites
      const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('id, name')
        .eq('user_id', user.id);

      if (sitesError) throw sitesError;
      if (!sites || sites.length === 0) {
        setTotalConversations(0);
        setTotalMessages(0);
        setSiteStats([]);
        setLoading(false);
        return;
      }

      const siteIds = sites.map((s) => s.id);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - dateRange);
      const dateStr = dateThreshold.toISOString();

      // Total conversations
      const { count: convCount, error: convError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in('site_id', siteIds)
        .gte('started_at', dateStr);

      if (convError) throw convError;
      setTotalConversations(convCount ?? 0);

      // Get conversations with their IDs for message counting
      const { data: conversations, error: convDataError } = await supabase
        .from('conversations')
        .select('id, site_id')
        .in('site_id', siteIds)
        .gte('started_at', dateStr);

      if (convDataError) throw convDataError;

      // Total messages across all conversations
      let msgTotal = 0;
      if (conversations && conversations.length > 0) {
        const convIds = conversations.map((c) => c.id);
        const { count: msgCount, error: msgError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', convIds);

        if (msgError) throw msgError;
        msgTotal = msgCount ?? 0;
      }
      setTotalMessages(msgTotal);

      // Conversations per site
      const statsMap: Record<string, { name: string; conversations: number; messages: number }> = {};
      for (const site of sites) {
        statsMap[site.id] = { name: site.name, conversations: 0, messages: 0 };
      }

      if (conversations) {
        for (const conv of conversations) {
          if (statsMap[conv.site_id]) {
            statsMap[conv.site_id].conversations++;
          }
        }

        // Count messages per site
        if (conversations.length > 0) {
          const { data: messages } = await supabase
            .from('messages')
            .select('conversation_id')
            .in('conversation_id', conversations.map((c) => c.id));

          if (messages) {
            const convToSite: Record<string, string> = {};
            for (const conv of conversations) {
              convToSite[conv.id] = conv.site_id;
            }
            for (const msg of messages) {
              const siteId = convToSite[msg.conversation_id];
              if (siteId && statsMap[siteId]) {
                statsMap[siteId].messages++;
              }
            }
          }
        }
      }

      const statsList = Object.values(statsMap)
        .sort((a, b) => b.conversations - a.conversations);
      setSiteStats(statsList);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Kunne ikke laste analysedata';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    if (!authLoading && user) {
      loadAnalytics();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, loadAnalytics]);

  const dateRangeLabel = dateRange === 7 ? '7 dager' : dateRange === 30 ? '30 dager' : '90 dager';

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', fontFamily }}>
        <p style={{ color: '#64748b', fontSize: '16px' }}>Laster...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily }}>
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Analyse</h1>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Analyse</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(Number(e.target.value))}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#64748b',
            fontFamily,
          }}
        >
          <option value={7}>Siste 7 dager</option>
          <option value={30}>Siste 30 dager</option>
          <option value={90}>Siste 90 dager</option>
        </select>
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
        {/* Nokkeltall */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#0f172a', margin: '0 0 16px 0' }}>Nokkeltall</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <MetricCard label="Totale samtaler" value={totalConversations.toLocaleString('nb-NO')} trend={`Siste ${dateRangeLabel}`} trendUp={totalConversations > 0} />
            <MetricCard label="Totale meldinger" value={totalMessages.toLocaleString('nb-NO')} trend={`Siste ${dateRangeLabel}`} trendUp={totalMessages > 0} />
            <MetricCard label="Nettsteder" value={siteStats.length} trend="Aktive nettsteder" trendUp={siteStats.length > 0} />
            <MetricCard label="Snitt meldinger/samtale" value={totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : '0'} trend="Per samtale" trendUp={totalConversations > 0} />
          </div>
        </div>

        {/* Samtaler per nettsted */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Samtaler per nettsted (siste {dateRangeLabel})</h3>
          </div>
          <div style={{ padding: '20px' }}>
            {siteStats.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Ingen samtaler funnet i denne perioden.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Nettsted</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Samtaler</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Meldinger</th>
                  </tr>
                </thead>
                <tbody>
                  {siteStats.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < siteStats.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '12px', color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{row.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#0f172a', fontSize: '14px' }}>{row.conversations}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#0f172a', fontSize: '14px' }}>{row.messages}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
