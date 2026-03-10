'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../_lib/supabase/hooks';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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
  site_id?: string;
}

// ---------------------------------------------------------------------------
// Icons (inline SVG for zero-dependency, Apple-clean line style)
// ---------------------------------------------------------------------------
function IconDocument({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconGlobe({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconText({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function IconFaq({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconCsv({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

function IconPlus({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSearch({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconTrash({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconEmpty({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="12" y1="8" x2="12" y2="14" />
      <line x1="9" y1="11" x2="15" y2="11" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const typeConfig: Record<string, { label: string; Icon: typeof IconDocument; bgClass: string; textClass: string }> = {
  document: { label: 'Dokument', Icon: IconDocument, bgClass: 'bg-red-50', textClass: 'text-red-600' },
  webpage:  { label: 'Nettside', Icon: IconGlobe,    bgClass: 'bg-blue-50', textClass: 'text-blue-600' },
  text:     { label: 'Tekst',    Icon: IconText,     bgClass: 'bg-slate-50', textClass: 'text-slate-600' },
  faq:      { label: 'FAQ',      Icon: IconFaq,      bgClass: 'bg-amber-50', textClass: 'text-amber-600' },
  csv:      { label: 'CSV',      Icon: IconCsv,      bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' },
};

function getTypeConfig(type: string) {
  return typeConfig[type] || typeConfig.document;
}

const statusConfig: Record<string, { dotClass: string; bgClass: string; textClass: string; label: string }> = {
  ready:      { dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700', label: 'Klar' },
  processing: { dotClass: 'bg-amber-500',   bgClass: 'bg-amber-50',   textClass: 'text-amber-700',   label: 'Behandler' },
  error:      { dotClass: 'bg-red-500',     bgClass: 'bg-red-50',     textClass: 'text-red-700',     label: 'Feilet' },
  pending:    { dotClass: 'bg-blue-500',    bgClass: 'bg-blue-50',    textClass: 'text-blue-700',    label: 'Venter' },
};

function getStatusConfig(status: string) {
  return statusConfig[status] || { dotClass: 'bg-slate-400', bgClass: 'bg-slate-50', textClass: 'text-slate-600', label: status };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------
function DeleteModal({
  sourceName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  sourceName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-base font-semibold text-slate-900 mb-2">Slett kilde</h3>
        <p className="text-sm text-slate-500 mb-6">
          Er du sikker på at du vil slette «{sourceName}»? Alle tilhørende deler vil også bli fjernet. Denne handlingen kan ikke angres.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Sletter...' : 'Slett'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function KnowledgePage() {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeSource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user's sites
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/sites', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) throw new Error('Kunne ikke laste nettsteder');
        const data = await res.json();
        const siteList = (data.sites || data || []) as Site[];
        setSites(siteList);
      } catch (err: any) {
        setError(err.message || 'Kunne ikke laste nettsteder');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Load knowledge sources — all sites or a specific one
  const loadSources = useCallback(async () => {
    if (!user || sites.length === 0) {
      setSources([]);
      return;
    }
    setSourcesLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const sitesToFetch = selectedSiteId === 'all' ? sites : sites.filter((s) => s.id === selectedSiteId);
      const allSources: KnowledgeSource[] = [];

      for (const site of sitesToFetch) {
        const response = await fetch('/api/ingest?siteId=' + site.id, {
          headers: { Authorization: 'Bearer ' + (token || '') },
        });
        if (!response.ok) continue;
        const data = await response.json();
        const siteSources = (data.sources || data || []).map((s: any) => ({ ...s, site_id: site.id }));
        allSources.push(...siteSources);
      }

      // Sort by created_at descending
      allSources.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSources(allSources);
    } catch (err: any) {
      setError(err.message || 'Feil ved lasting av kilder');
    } finally {
      setSourcesLoading(false);
    }
  }, [user, sites, selectedSiteId, getAccessToken]);

  useEffect(() => {
    if (sites.length > 0) loadSources();
  }, [sites, selectedSiteId, loadSources]);

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const response = await fetch('/api/ingest?sourceId=' + deleteTarget.id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke slette kilden');
      }
      setSources((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || 'Feil ved sletting');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter sources by search query
  const filteredSources = sources.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
  });

  // Get site name by id
  const getSiteName = (siteId?: string) => {
    if (!siteId) return '';
    const site = sites.find((s) => s.id === siteId);
    return site?.name || '';
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Laster kunnskapsbase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          sourceName={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Kunnskapsbase</h1>
              <p className="mt-1 text-sm text-slate-500">
                Administrer kilder og dokumenter som chatboten din lærer fra.
              </p>
            </div>
            <Link
              href="/dashboard/knowledge/upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <IconPlus />
              Last opp ny
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 py-6 sm:px-8">
        {sites.length === 0 ? (
          /* No sites empty state */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center max-w-lg mx-auto">
            <div className="text-slate-300 mb-4 flex justify-center">
              <IconEmpty className="w-16 h-16" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Ingen nettsteder enda</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              Opprett et nettsted først, så kan du legge til kunnskapskilder som chatboten lærer fra.
            </p>
            <Link
              href="/dashboard/sites/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <IconPlus />
              Opprett nettsted
            </Link>
          </div>
        ) : (
          <>
            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <IconSearch />
                </div>
                <input
                  type="text"
                  placeholder="Søk i kilder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Site filter */}
              {sites.length > 1 && (
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="all">Alle nettsteder</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Sources table */}
            {sourcesLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Laster kilder...</p>
              </div>
            ) : filteredSources.length === 0 && sources.length === 0 ? (
              /* Empty state — no sources at all */
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center max-w-lg mx-auto">
                <div className="text-slate-300 mb-4 flex justify-center">
                  <IconEmpty className="w-16 h-16" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Ingen kilder enda</h2>
                <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                  Last opp dokumenter, lim inn tekst, eller skrap en nettside for å gi chatboten din kunnskap.
                </p>
                <Link
                  href="/dashboard/knowledge/upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <IconPlus />
                  Last opp ny kilde
                </Link>
              </div>
            ) : filteredSources.length === 0 ? (
              /* No results for search */
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <p className="text-sm text-slate-500">Ingen kilder matcher søket ditt.</p>
              </div>
            ) : (
              /* Sources list */
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span>Kilde</span>
                  <span className="w-24 text-center">Deler</span>
                  <span className="w-28 text-center">Status</span>
                  <span className="w-24 text-right">Dato</span>
                  <span className="w-16" />
                </div>

                {/* Source rows */}
                {filteredSources.map((source, i) => {
                  const tc = getTypeConfig(source.type);
                  const sc = getStatusConfig(source.status);
                  const siteName = getSiteName(source.site_id);

                  return (
                    <div
                      key={source.id}
                      className={`group grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 sm:gap-4 items-center px-5 py-4 hover:bg-slate-50/50 transition-colors ${
                        i < filteredSources.length - 1 ? 'border-b border-slate-100' : ''
                      }`}
                    >
                      {/* Title + type + site */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${tc.bgClass} ${tc.textClass} flex items-center justify-center`}>
                          <tc.Icon className="w-[18px] h-[18px]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{source.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400">{tc.label}</span>
                            {siteName && selectedSiteId === 'all' && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="text-xs text-slate-400 truncate">{siteName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Chunk count */}
                      <div className="w-24 text-center hidden sm:block">
                        <span className="text-sm text-slate-600 tabular-nums">
                          {source.chunk_count != null ? source.chunk_count : '—'}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="w-28 flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bgClass} ${sc.textClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dotClass}`} />
                          {sc.label}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="w-24 text-right hidden sm:block">
                        <span className="text-xs text-slate-400 tabular-nums">{formatDate(source.created_at)}</span>
                      </div>

                      {/* Delete button */}
                      <div className="w-16 flex justify-end">
                        <button
                          onClick={() => setDeleteTarget(source)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Slett kilde"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary footer */}
            {filteredSources.length > 0 && (
              <div className="mt-4 text-xs text-slate-400 text-right px-1">
                {filteredSources.length} {filteredSources.length === 1 ? 'kilde' : 'kilder'} totalt
                {filteredSources.reduce((sum, s) => sum + (s.chunk_count || 0), 0) > 0 && (
                  <> &middot; {filteredSources.reduce((sum, s) => sum + (s.chunk_count || 0), 0)} deler</>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
