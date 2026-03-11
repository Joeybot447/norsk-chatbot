'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../_lib/supabase/hooks';
import { supabase } from '../../../_lib/supabase/client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ArrowLeft, Type, Globe, Upload, Check, Lock } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Site {
  id: string;
  name: string;
}

interface ScrapeStatus {
  sourceId: string;
  status: 'processing' | 'ready' | 'error';
  title: string;
  chunksCreated: number;
  progressText?: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function UploadKnowledgePage() {
  const { user, loading: authLoading, getAccessToken } = useAuth();

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<string>('text');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Text mode
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textSubmitting, setTextSubmitting] = useState(false);

  // URL mode
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeSubmitting, setScrapeSubmitting] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const list = (data || []) as Site[];
        setSites(list);
        if (list.length > 0) setSelectedSiteId(list[0].id);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleTextSubmit = async () => {
    if (!selectedSiteId) { setError('Velg et nettsted først.'); return; }
    if (!textTitle.trim()) { setError('Gi innholdet en tittel.'); return; }
    if (!textContent.trim()) { setError('Lim inn innholdet du vil legge til.'); return; }

    setTextSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: selectedSiteId, title: textTitle.trim(), type: 'text', text: textContent.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke lagre teksten');
      }
      const data = await res.json();
      setSuccess(`"${data.title || textTitle}" ble lagt til med ${data.chunks || 0} deler.`);
      setTextTitle('');
      setTextContent('');
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt');
    } finally {
      setTextSubmitting(false);
    }
  };

  const pollScrapeStatus = useCallback(async (sourceId: string, token: string) => {
    try {
      const res = await fetch('/api/ingest/scrape?sourceId=' + sourceId, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) return;
      const data = await res.json();
      setScrapeStatus({
        sourceId: data.sourceId,
        status: data.status,
        title: data.title,
        chunksCreated: data.chunksCreated || 0,
        progressText: data.progressText,
      });
      if (data.status === 'ready' || data.status === 'error') {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        if (data.status === 'ready') {
          setSuccess(`Nettsiden "${data.title}" ble skannet. ${data.chunksCreated || 0} deler opprettet.`);
        } else {
          setError('Skanning feilet. Sjekk at URLen er tilgjengelig.');
        }
        setScrapeSubmitting(false);
      }
    } catch {
      // silent
    }
  }, []);

  const handleUrlSubmit = async () => {
    if (!selectedSiteId) { setError('Velg et nettsted først.'); return; }
    if (!scrapeUrl.trim()) { setError('Skriv inn en URL.'); return; }
    try {
      const url = new URL(scrapeUrl.trim().startsWith('http') ? scrapeUrl.trim() : 'https://' + scrapeUrl.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('bad');
    } catch {
      setError('Ugyldig URL. Bruk formatet https://example.com');
      return;
    }

    setScrapeSubmitting(true);
    setError(null);
    setSuccess(null);
    setScrapeStatus(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const fullUrl = scrapeUrl.trim().startsWith('http') ? scrapeUrl.trim() : 'https://' + scrapeUrl.trim();
      const res = await fetch('/api/ingest/scrape', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: selectedSiteId, url: fullUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke starte skanning');
      }
      const data = await res.json();
      setScrapeStatus({ sourceId: data.sourceId, status: 'processing', title: fullUrl, chunksCreated: 0, progressText: 'Starter skanning...' });
      pollRef.current = setInterval(() => { pollScrapeStatus(data.sourceId, token); }, 3000);
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt');
      setScrapeSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <Link href="/dashboard/knowledge" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          Tilbake til kunnskapsbase
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Legg til kunnskap</h1>
        <p className="mt-1 text-sm text-slate-500">Velg en metode for å gi chatboten ny kunnskap.</p>
      </div>

      {/* Content */}
      <div className="p-6 max-w-2xl">
        {sites.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-base font-semibold text-slate-900 mb-2">Ingen nettsteder</h2>
              <p className="text-sm text-slate-500 mb-5">Du trenger minst ett nettsted for å legge til kunnskap.</p>
              <Button asChild>
                <Link href="/dashboard/sites/new">Opprett nettsted</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Site selector */}
            <div className="mb-6">
              <Label className="mb-1.5">Nettsted</Label>
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Velg nettsted..." />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error / Success */}
            {error && (
              <Card className="border-red-200 bg-red-50 mb-6">
                <CardContent className="p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </CardContent>
              </Card>
            )}
            {success && (
              <Card className="border-green-200 bg-green-50 mb-6">
                <CardContent className="p-4 flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700">{success}</p>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs value={mode} onValueChange={(v) => { setMode(v); setError(null); setSuccess(null); }}>
              <TabsList className="mb-6">
                <TabsTrigger value="text" className="gap-2">
                  <Type className="h-4 w-4" />
                  Tekst
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Nettside
                </TabsTrigger>
                <TabsTrigger value="file" disabled className="gap-2">
                  <Upload className="h-4 w-4" />
                  Fil
                  <Badge variant="secondary" className="ml-1 text-[10px]">Snart</Badge>
                </TabsTrigger>
              </TabsList>

              {/* Text mode */}
              <TabsContent value="text">
                <Card>
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <Label htmlFor="text-title" className="mb-1.5">Tittel</Label>
                      <Input
                        id="text-title"
                        value={textTitle}
                        onChange={(e) => setTextTitle(e.target.value)}
                        placeholder="F.eks. Returpolicy, Prisliste 2026"
                      />
                    </div>
                    <div>
                      <Label htmlFor="text-content" className="mb-1.5">Innhold</Label>
                      <Textarea
                        id="text-content"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Lim inn teksten chatboten skal laere fra..."
                        rows={10}
                      />
                      {textContent.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1.5 tabular-nums">
                          {textContent.length.toLocaleString('nb-NO')} tegn
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleTextSubmit}
                      disabled={textSubmitting || !textTitle.trim() || !textContent.trim()}
                    >
                      {textSubmitting ? 'Lagrer...' : 'Legg til tekst'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* URL mode */}
              <TabsContent value="url">
                <Card>
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <Label htmlFor="scrape-url" className="mb-1.5">Nettadresse</Label>
                      <Input
                        id="scrape-url"
                        type="url"
                        value={scrapeUrl}
                        onChange={(e) => setScrapeUrl(e.target.value)}
                        placeholder="https://example.com"
                        disabled={scrapeSubmitting}
                      />
                      <p className="text-xs text-slate-400 mt-1.5">
                        Vi skanner nettsiden og henter ut tekst automatisk.
                      </p>
                    </div>

                    {scrapeStatus && scrapeStatus.status === 'processing' && (
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
                            <span className="text-sm font-medium text-blue-900">Skanner nettside...</span>
                          </div>
                          {scrapeStatus.progressText && (
                            <p className="text-xs text-blue-700 mb-2">{scrapeStatus.progressText}</p>
                          )}
                          <p className="text-xs text-blue-600 tabular-nums">{scrapeStatus.chunksCreated} deler opprettet</p>
                          <div className="mt-3 w-full h-1 bg-blue-100 rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-blue-500 rounded-full animate-pulse" />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Button
                      onClick={handleUrlSubmit}
                      disabled={scrapeSubmitting || !scrapeUrl.trim()}
                    >
                      {scrapeSubmitting ? 'Skanner...' : 'Start skanning'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* File mode */}
              <TabsContent value="file">
                <Card>
                  <CardContent className="p-10 text-center">
                    <Lock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-slate-900 mb-2">Filopplasting kommer snart</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                      Støtte for direkte opplasting av PDF, DOCX og CSV-filer er under utvikling. Bruk tekstmetoden for na, eller lim inn innholdet direkte.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
