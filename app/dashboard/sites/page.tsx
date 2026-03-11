'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

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
      const { data: sitesData, error: sitesErr } = await supabase
        .from('sites')
        .select('id, name, domain, bot_name, is_active, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (sitesErr) throw sitesErr;

      const result: SiteWithStats[] = [];
      for (const site of (sitesData || [])) {
        const { count: convCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', site.id);

        const { count: knowledgeCount } = await supabase
          .from('knowledge_sources')
          .select('*', { count: 'exact', head: true })
          .eq('site_id', site.id);

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
      <div className="flex flex-col items-center justify-center p-20">
        <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-blue-600 animate-spin" />
        <div className="text-slate-500 text-sm font-medium mt-4">Laster nettsteder...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <div className="text-red-600 text-[15px] font-medium mb-4">{error}</div>
        <button
          onClick={loadSites}
          className="px-5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg cursor-pointer text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Prov igjen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Nettsteder</h1>
          <p className="text-sm text-slate-500 mt-1">
            Administrer chatbotene dine og se ytelsen til hvert nettsted.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/sites/new')}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-semibold text-sm hover:bg-blue-700 transition-all w-full sm:w-auto"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 2v12M2 8h12" /></svg>
          Nytt nettsted
        </button>
      </div>

      {/* Content */}
      <main className="p-4 md:p-8 flex-1">
        {sites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 md:p-20 text-center max-w-[520px] mx-auto mt-10 shadow-sm">
            <div className="w-14 h-14 rounded-[14px] bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="text-lg font-semibold text-slate-900 mb-2">Ingen nettsteder enna</div>
            <div className="text-sm text-slate-500 mb-6 leading-relaxed">
              Opprett ditt forste nettsted for a komme i gang med chatboten.
            </div>
            <button
              onClick={() => router.push('/dashboard/sites/new')}
              className="px-6 py-3 bg-blue-600 text-white border-none rounded-[10px] cursor-pointer text-sm font-semibold hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              Opprett nettsted
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sites.map((site) => (
              <div
                key={site.id}
                className="bg-white rounded-[14px] border border-slate-200 overflow-hidden transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-slate-300 relative"
                onClick={() => router.push('/dashboard/sites/' + site.id)}
              >
                {/* Card header */}
                <div className="p-4 md:p-5 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {site.name}
                      </h3>
                      <p className="text-[13px] text-slate-500 mt-1 truncate">
                        {site.domain || 'Ingen domene satt'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ml-3 shrink-0 ${
                      site.is_active
                        ? 'bg-green-50 text-green-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        site.is_active ? 'bg-green-500' : 'bg-slate-400'
                      }`} />
                      {site.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-5 pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-lg font-bold text-slate-900">{site.conversationCount}</div>
                      <div className="text-xs text-slate-500">Samtaler</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-900">{site.knowledgeCount}</div>
                      <div className="text-xs text-slate-500">Kunnskapskilder</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-[13px] font-medium text-slate-500">{formatRelativeTime(site.lastActivity)}</div>
                      <div className="text-xs text-slate-500">Siste aktivitet</div>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-4 md:px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                  <span className="text-xs text-slate-500">
                    Opprettet {new Date(site.created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/dashboard/sites/' + site.id);
                      }}
                      className="px-3 py-1.5 bg-transparent text-blue-600 border border-slate-200 rounded-md cursor-pointer text-xs font-medium hover:bg-blue-50 transition-colors"
                    >
                      Rediger
                    </button>
                    {deleteConfirm === site.id ? (
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(site.id); }}
                          disabled={deleting === site.id}
                          className="px-2.5 py-1.5 bg-red-600 text-white border-none rounded-md cursor-pointer text-xs font-medium disabled:opacity-60"
                        >
                          {deleting === site.id ? '...' : 'Bekreft'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                          className="px-2.5 py-1.5 bg-transparent text-slate-500 border border-slate-200 rounded-md cursor-pointer text-xs"
                        >
                          Avbryt
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(site.id); }}
                        className="px-3 py-1.5 bg-transparent text-red-600 border border-slate-200 rounded-md cursor-pointer text-xs font-medium hover:bg-red-50 transition-colors"
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
