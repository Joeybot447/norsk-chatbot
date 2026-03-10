'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/hooks';

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

interface Site {
  id: string;
  name: string;
}

interface KnowledgeSource {
  id: string;
  title: string;
  type: string;
  status: string;
  chunk_count: number | null;
  file_size: number | null;
  created_at: string;
}

export default function KnowledgePage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('sources');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load user's sites
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('sites')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (err) throw err;
        const siteList = (data || []) as Site[];
        setSites(siteList);
        if (siteList.length > 0 && !selectedSiteId) {
          setSelectedSiteId(siteList[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Kunne ikke laste nettsteder');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Load knowledge sources for selected site
  useEffect(() => {
    if (!selectedSiteId || !user) {
      setSources([]);
      return;
    }
    setSourcesLoading(true);
    setError(null);
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        const response = await fetch('/api/ingest?siteId=' + selectedSiteId, {
          headers: { 'Authorization': 'Bearer ' + token },
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'Kunne ikke laste kunnskapskilder');
        }
        const data = await response.json();
        setSources(data.sources || data || []);
      } catch (err: any) {
        setError(err.message || 'Feil ved lasting av kilder');
      } finally {
        setSourcesLoading(false);
      }
    })();
  }, [selectedSiteId, user]);

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne kilden?')) return;
    setDeleting(sourceId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const response = await fetch('/api/ingest?sourceId=' + sourceId, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke slette kilden');
      }
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    } catch (err: any) {
      alert(err.message || 'Feil ved sletting');
    } finally {
      setDeleting(null);
    }
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = { document: 'Dokument', webpage: 'Nettside', text: 'Tekst', faq: 'FAQ', csv: 'CSV' };
    return map[type] || type;
  };

  const statusConfig = (status: string) => {
    const map: Record<string, { bg: string; color: string; dotColor: string; label: string }> = {
      ready: { bg: '#d1fae5', color: '#065f46', dotColor: '#22c55e', label: 'Klar' },
      processing: { bg: '#fef3c7', color: '#92400e', dotColor: '#f59e0b', label: 'Behandler' },
      error: { bg: '#fee2e2', color: '#991b1b', dotColor: '#dc2626', label: 'Feil' },
      pending: { bg: '#e0f2fe', color: '#075985', dotColor: '#3b82f6', label: 'Venter' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#64748b', dotColor: '#94a3b8', label: status };
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: fontStack, alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>Laster...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: fontStack }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Kunnskapsbase</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Administrer kilder og dokumenter som boten skal lære fra
        </p>
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px', flex: 1, overflow: 'auto', maxWidth: '720px' }}>
        {/* Site selector */}
        {sites.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Velg nettsted</label>
            <select
              value={selectedSiteId || ''}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: fontStack, backgroundColor: '#fff', minWidth: 200 }}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
        )}

        {sites.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Ingen nettsteder</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Opprett et nettsted først for å legge til kunnskapskilder.</div>
            <a href="/dashboard/sites/new" style={{ display: 'inline-block', padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
              + Legg til nettsted
            </a>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '32px' }}>
                <button
                  onClick={() => setActiveTab('sources')}
                  style={{
                    paddingBottom: '12px',
                    fontWeight: activeTab === 'sources' ? '600' : '400',
                    fontSize: '14px',
                    borderBottom: activeTab === 'sources' ? '2px solid #2563eb' : '2px solid transparent',
                    color: activeTab === 'sources' ? '#2563eb' : '#64748b',
                    background: 'none',
                    border: 'none',
                    borderBottomWidth: '2px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: activeTab === 'sources' ? '#2563eb' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: fontStack,
                    transition: 'color 0.15s',
                  }}
                >
                  Kilder ({sources.length})
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  style={{
                    paddingBottom: '12px',
                    fontWeight: activeTab === 'settings' ? '600' : '400',
                    fontSize: '14px',
                    borderBottom: activeTab === 'settings' ? '2px solid #2563eb' : '2px solid transparent',
                    color: activeTab === 'settings' ? '#2563eb' : '#64748b',
                    background: 'none',
                    border: 'none',
                    borderBottomWidth: '2px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: activeTab === 'settings' ? '#2563eb' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: fontStack,
                    transition: 'color 0.15s',
                  }}
                >
                  Innstillinger
                </button>
              </div>
            </div>

            {/* Sources Tab */}
            {activeTab === 'sources' && (
              <div>
                {/* Upload link */}
                <div style={{ marginBottom: 24 }}>
                  <a
                    href="/dashboard/knowledge/upload"
                    style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontFamily: fontStack,
                    }}
                  >
                    + Last opp dokumenter
                  </a>
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                    <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
                  </div>
                )}

                <div>
                  <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Aktiverte kilder:</p>
                  {sourcesLoading ? (
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' as const, color: '#64748b', fontSize: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      Laster kilder...
                    </div>
                  ) : sources.length === 0 ? (
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' as const, color: '#64748b', fontSize: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      Ingen kilder lagt til ennå
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {sources.map((source) => {
                        const st = statusConfig(source.status);
                        return (
                          <div key={source.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', margin: '0 0 4px 0' }}>{source.title}</p>
                              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
                                <span>{typeLabel(source.type)}</span>
                                {source.chunk_count != null && <span>{source.chunk_count} chunks</span>}
                                {source.file_size != null && <span>{(source.file_size / 1024).toFixed(0)} KB</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', backgroundColor: st.bg, color: st.color, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: st.dotColor, display: 'inline-block' }} />
                                {st.label}
                              </span>
                              <button
                                onClick={() => handleDeleteSource(source.id)}
                                disabled={deleting === source.id}
                                style={{
                                  padding: '6px 12px', backgroundColor: 'transparent', color: deleting === source.id ? '#94a3b8' : '#ef4444',
                                  border: '1px solid #fecaca', borderRadius: '6px', cursor: deleting === source.id ? 'not-allowed' : 'pointer',
                                  fontSize: '12px', fontFamily: fontStack, transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => { if (deleting !== source.id) e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                {deleting === source.id ? 'Sletter...' : 'Slett'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontWeight: '600', color: '#0f172a', fontSize: '16px', marginBottom: '16px', marginTop: 0 }}>Innstillinger</h3>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Mer kommer snart...</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
