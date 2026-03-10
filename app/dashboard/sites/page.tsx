'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

interface Site {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
  created_at: string;
  conversations: { count: number }[];
}

export default function SitesPage() {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadSites = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('sites')
        .select('id, name, domain, is_active, created_at, conversations(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setSites((data || []) as Site[]);
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
    if (!confirm('Er du sikker på at du vil slette dette nettstedet? Alle samtaler og data vil bli slettet.')) return;
    setDeleting(siteId);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert — prøv å logge inn på nytt');
      const response = await fetch('/api/sites/' + siteId, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke slette nettstedet');
      }
      await loadSites();
    } catch (err: any) {
      alert(err.message || 'Feil ved sletting');
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily, alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>Laster...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily, alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ color: '#ef4444', fontSize: 16, fontWeight: 500 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Nettsteder</h1>
        <a
          href="/dashboard/sites/new"
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-block',
            fontFamily,
          }}
        >
          + Legg til nettsted
        </a>
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
        {sites.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌐</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Ingen nettsteder ennå</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Opprett ditt første nettsted for å komme i gang med chatboten.</div>
            <a href="/dashboard/sites/new" style={{ display: 'inline-block', padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
              + Legg til nettsted
            </a>
          </div>
        ) : (
          /* Sites Table */
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Dine nettsteder ({sites.length})</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Nettstedsnavn</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Domene</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Samtaler</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Opprettet</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site, i) => {
                    const convCount = site.conversations?.[0]?.count ?? 0;
                    const status = site.is_active ? 'active' : 'inactive';
                    return (
                      <tr key={site.id} style={{ borderBottom: i < sites.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '16px 20px', color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{site.name}</td>
                        <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '14px' }}>{site.domain}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: status === 'active' ? '#d1fae5' : '#f1f5f9',
                            color: status === 'active' ? '#065f46' : '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: status === 'active' ? '#22c55e' : '#94a3b8',
                              display: 'inline-block',
                            }} />
                            {status === 'active' ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>{convCount}</td>
                        <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '14px' }}>
                          {new Date(site.created_at).toLocaleDateString('nb-NO')}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <button
                            style={{
                              padding: '4px 12px',
                              marginRight: '8px',
                              backgroundColor: 'transparent',
                              color: '#2563eb',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontFamily,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = '#eff6ff';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            }}
                          >
                            Rediger
                          </button>
                          <button
                            onClick={() => handleDelete(site.id)}
                            disabled={deleting === site.id}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: 'transparent',
                              color: deleting === site.id ? '#94a3b8' : '#ef4444',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              cursor: deleting === site.id ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontFamily,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (deleting !== site.id) (e.currentTarget as HTMLElement).style.backgroundColor = '#fef2f2';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            }}
                          >
                            {deleting === site.id ? 'Sletter...' : 'Slett'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
