'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../_lib/supabase/hooks';
import Link from 'next/link';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, Search, Trash2, FileText, Globe, Type, HelpCircle, FileSpreadsheet, BookOpen } from 'lucide-react';

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
// Helpers
// ---------------------------------------------------------------------------
const typeConfig: Record<string, { label: string; icon: typeof FileText }> = {
  document: { label: 'Dokument', icon: FileText },
  webpage:  { label: 'Nettside', icon: Globe },
  text:     { label: 'Tekst', icon: Type },
  faq:      { label: 'FAQ', icon: HelpCircle },
  csv:      { label: 'CSV', icon: FileSpreadsheet },
};

function getTypeConfig(type: string) {
  return typeConfig[type] || typeConfig.document;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ready':
      return <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">Klar</Badge>;
    case 'processing':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Behandler</Badge>;
    case 'error':
      return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">Feilet</Badge>;
    case 'pending':
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Venter</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
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
      <Card className="w-full max-w-sm mx-4 shadow-2xl">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-2">Slett kilde</h3>
          <p className="text-sm text-slate-500 mb-6">
            Er du sikker pa at du vil slette &laquo;{sourceName}&raquo;? Alle tilhorende deler vil ogsa bli fjernet. Denne handlingen kan ikke angres.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
              {isDeleting ? 'Sletter...' : 'Slett'}
            </Button>
          </div>
        </CardContent>
      </Card>
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
        setSites((data.sites || data || []) as Site[]);
      } catch (err: any) {
        setError(err.message || 'Kunne ikke laste nettsteder');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

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

  const filteredSources = sources.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
  });

  const getSiteName = (siteId?: string) => {
    if (!siteId) return '';
    return sites.find((s) => s.id === siteId)?.name || '';
  };

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
    <div className="min-h-full bg-slate-50">
      {deleteTarget && (
        <DeleteModal
          sourceName={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Kunnskapsbase</h1>
            <p className="mt-1 text-sm text-slate-500">
              Administrer kilder og dokumenter som chatboten din laerer fra.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/knowledge/upload" className="gap-2">
              <Plus className="h-4 w-4" />
              Last opp ny
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {sites.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-16 text-center">
              <div className="flex justify-center mb-4">
                <BookOpen className="h-16 w-16 text-slate-300" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Ingen nettsteder enda</h2>
              <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                Opprett et nettsted forst, sa kan du legge til kunnskapskilder som chatboten laerer fra.
              </p>
              <Button asChild>
                <Link href="/dashboard/sites/new" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Opprett nettsted
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Sok i kilder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {sites.length > 1 && (
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                >
                  <option value="all">Alle nettsteder</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              )}
            </div>

            {error && (
              <Card className="border-red-200 bg-red-50 mb-6">
                <CardContent className="p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </CardContent>
              </Card>
            )}

            {sourcesLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Laster kilder...</p>
                </CardContent>
              </Card>
            ) : filteredSources.length === 0 && sources.length === 0 ? (
              <Card className="max-w-lg mx-auto">
                <CardContent className="p-16 text-center">
                  <div className="flex justify-center mb-4">
                    <BookOpen className="h-16 w-16 text-slate-300" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">Ingen kilder enda</h2>
                  <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                    Last opp dokumenter, lim inn tekst, eller skrap en nettside for a gi chatboten din kunnskap.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/knowledge/upload" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Last opp ny kilde
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : filteredSources.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-sm text-slate-500">Ingen kilder matcher soket ditt.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kilde</TableHead>
                      <TableHead className="w-24 text-center hidden sm:table-cell">Deler</TableHead>
                      <TableHead className="w-28 text-center">Status</TableHead>
                      <TableHead className="w-24 text-right hidden sm:table-cell">Dato</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSources.map((source) => {
                      const tc = getTypeConfig(source.type);
                      const Icon = tc.icon;
                      const siteName = getSiteName(source.site_id);

                      return (
                        <TableRow key={source.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                                <Icon className="w-[18px] h-[18px]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{source.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-slate-400">{tc.label}</span>
                                  {siteName && selectedSiteId === 'all' && (
                                    <>
                                      <span className="text-slate-300">&middot;</span>
                                      <span className="text-xs text-slate-400 truncate">{siteName}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center hidden sm:table-cell">
                            <span className="text-sm text-slate-600 tabular-nums">
                              {source.chunk_count != null ? source.chunk_count : '\u2014'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(source.status)}
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell">
                            <span className="text-xs text-slate-400 tabular-nums">{formatDate(source.created_at)}</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(source)}
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}

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
