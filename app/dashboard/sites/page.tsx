'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const colors = {
  blue: '#2563eb',
  blueHover: '#1d4ed8',
  blueBg: '#eff6ff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  bg: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
  success: '#16a34a',
  successBg: '#dcfce7',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  white: '#ffffff',
};

interface Site {
  id: string;
  name: string;
  domain: string;
  bot_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SiteWithStats extends Site {
  conversationCount: number;
  knowledgeCount: number;
  lastActivity: string | null;
}

export default function SitesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadSites = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch sites
      const { data: sitesData, error: sitesErr } = await supabase
        .from('sites')
        .select('id, name, domain, bot_name, is_active, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (sitesErr) throw sitesErr;

      const result: SiteWithStats[] = [];
      for (const site of (sitesData || [])) {
        // Conversation count
        const { count: convCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', site.id);

        // Knowledge sources count
        const { count: knowledgeCount } = await supabase
          .from('knowledge_sources')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', site.id);

        // Last activity (most recent conversation)
        const { data: lastConv } = await supabase
          .from('conversations')
          .select('started_at')
          .eq('site_id', site.id)
          .order('started_at', { ascending: false })
          .limit(1);

        result.push({
          ...site,
          conversationCount: convCount || 0,
          knowledgeCount: knowledgeCount || 0,
          lastActivity: lastConv?.[0]?.started_at || null,
        });
      }

      setSites(result);
    } catch (err: any) {
      setError(err.message || 'Kunne ikke laste nettsteder');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadSites();
  }, [user]);

  const handleDelete = async (siteId: string) => {
    setDeleting(siteId);
    setDeleteConfirm(null);
    try {
      const { error: delErr } = await supabase.from('sites').delete().eq('id', siteId);
      if (delErr) throw delErr;
      setSites((prev) => prev.filter((s) => s.id !== siteId));
    } catch (err: any) {
      alert(err.message || 'Feil ved sletting');
    } finally {
      setDeleting(null);
    }
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return 'Ingen aktivitet';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Akkurat na';
    if (minutes < 60) return `${minutes} min siden`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} t siden`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} d siden`;
    return new Date(dateStr).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily, alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: `3px solid ${colors.border}`, borderTopColor: colors.blue,
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: colors.textMuted, fontSize: 14, fontWeight: 500, marginTop: 16 }}>Laster nettsteder...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily, alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{ color: colors.danger, fontSize: 15, fontWeight: 500, marginBottom: 16 }}>{error}</div>
        <button
          onClick={loadSites}
          style={{
            padding: '10px 20px', backgroundColor: colors.white, color: colors.text,
            border: `1px solid ${colors.border}`, borderRadius: 8, cursor: 'pointer',
            fontSize: 14, fontWeight: 500, fontFamily,
          }}
        >
          Prov igjen
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily, minHeight: '100vh', backgroundColor: colors.bg }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.white, borderBottom: `1px solid ${colors.border}`,
        padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0, letterSpacing: '-0.02em' }}>Nettsteder</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: '4px 0 0' }}>
            Administrer chatbotene dine og se ytelsen til hvert nettsted.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/sites/new')}
          style={{
            padding: '10px 20px', backgroundColor: colors.blue, color: colors.white,
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
            fontSize: 14, fontFamily, transition: 'all 0.15s', display: 'flex',
            alignItems: 'center', gap: 6,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.blue; e.currentTarget.style.transform = 'none'; }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 2v12M2 8h12" /></svg>
          Nytt nettsted
        </button>
      </div>

      {/* Content */}
      <main style={{ padding: 32, flex: 1 }}>
        {sites.length === 0 ? (
          <div style={{
            backgroundColor: colors.white, borderRadius: 16, border: `1px solid ${colors.border}`,
            padding: '80px 32px', textAlign: 'center', maxWidth: 520, margin: '40px auto',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, backgroundColor: colors.blueBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Ingen nettsteder enna</div>
            <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24, lineHeight: 1.6 }}>
              Opprett ditt forste nettsted for a komme i gang med chatboten.
            </div>
            <button
              onClick={() => router.push('/dashboard/sites/new')}
              style={{
                padding: '12px 24px', backgroundColor: colors.blue, color: colors.white,
                border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily,
              }}
            >
              Opprett nettsted
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {sites.map((site) => (
              <div
                key={site.id}
                style={{
                  backgroundColor: colors.white, borderRadius: 14, border: `1px solid ${colors.border}`,
                  overflow: 'hidden', transition: 'all 0.2s', cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative',
                }}
                onClick={() => router.push('/dashboard/sites/' + site.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                {/* Card header */}
                <div style={{ padding: '20px 20px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {site.name}
                      </h3>
                      <p style={{ fontSize: 13, color: colors.textMuted, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {site.domain || 'Ingen domene satt'}
                      </p>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      backgroundColor: site.is_active ? colors.successBg : colors.borderLight,
                      color: site.is_active ? colors.success : colors.textMuted,
                      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, marginLeft: 12,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        backgroundColor: site.is_active ? colors.success : '#94a3b8',
                      }} />
                      {site.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 20, paddingTop: 12, borderTop: `1px solid ${colors.borderLight}` }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{site.conversationCount}</div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>Samtaler</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{site.knowledgeCount}</div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>Kunnskapskilder</div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>{formatRelativeTime(site.lastActivity)}</div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>Siste aktivitet</div>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div style={{
                  padding: '12px 20px', borderTop: `1px solid ${colors.borderLight}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: colors.bg,
                }}>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>
                    Opprettet {new Date(site.created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/dashboard/sites/' + site.id);
                      }}
                      style={{
                        padding: '5px 14px', backgroundColor: 'transparent', color: colors.blue,
                        border: `1px solid ${colors.border}`, borderRadius: 6, cursor: 'pointer',
                        fontSize: 12, fontWeight: 500, fontFamily, transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.blueBg; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      Rediger
                    </button>
                    {deleteConfirm === site.id ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(site.id); }}
                          disabled={deleting === site.id}
                          style={{
                            padding: '5px 10px', backgroundColor: colors.danger, color: colors.white,
                            border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                            fontWeight: 500, fontFamily, opacity: deleting === site.id ? 0.6 : 1,
                          }}
                        >
                          {deleting === site.id ? '...' : 'Bekreft'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                          style={{
                            padding: '5px 10px', backgroundColor: 'transparent', color: colors.textMuted,
                            border: `1px solid ${colors.border}`, borderRadius: 6, cursor: 'pointer',
                            fontSize: 12, fontFamily,
                          }}
                        >
                          Avbryt
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(site.id); }}
                        style={{
                          padding: '5px 14px', backgroundColor: 'transparent', color: colors.danger,
                          border: `1px solid ${colors.border}`, borderRadius: 6, cursor: 'pointer',
                          fontSize: 12, fontWeight: 500, fontFamily, transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.dangerBg; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        Slett
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
