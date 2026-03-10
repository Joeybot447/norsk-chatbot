'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../../_lib/supabase/hooks';
import { supabase } from '../../../_lib/supabase/client';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Site {
  id: string;
  name: string;
}

type UploadMode = 'text' | 'url' | 'file';

interface ScrapeStatus {
  sourceId: string;
  status: 'processing' | 'ready' | 'error';
  title: string;
  chunksCreated: number;
  progressText?: string;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function IconArrowLeft({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
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

function IconGlobe({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconUpload({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconCheck({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconLock({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Upload mode selector
// ---------------------------------------------------------------------------
function ModeTab({
  active,
  onClick,
  icon: Icon,
  label,
  disabled,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof IconText;
  label: string;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-medium transition-all border
        ${active
          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
          : disabled
            ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
        }
      `}
    >
      <Icon className="w-[18px] h-[18px]" />
      {label}
      {badge && (
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
          {badge}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function UploadKnowledgePage() {
  const { user, loading: authLoading, getAccessToken } = useAuth();

  // Shared state
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<UploadMode>('text');
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

  // Load sites
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Text submit
  // ---------------------------------------------------------------------------
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
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: selectedSiteId,
          title: textTitle.trim(),
          type: 'text',
          text: textContent.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke lagre teksten');
      }

      const data = await res.json();
      setSuccess(`«${data.title || textTitle}» ble lagt til med ${data.chunks || 0} deler.`);
      setTextTitle('');
      setTextContent('');
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt');
    } finally {
      setTextSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // URL scrape
  // ---------------------------------------------------------------------------
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
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        if (data.status === 'ready') {
          setSuccess(`Nettsiden «${data.title}» ble skannet. ${data.chunksCreated || 0} deler opprettet.`);
        } else {
          setError('Skanning feilet. Sjekk at URLen er tilgjengelig.');
        }
        setScrapeSubmitting(false);
      }
    } catch {
      // Silent polling failure
    }
  }, []);

  const handleUrlSubmit = async () => {
    if (!selectedSiteId) { setError('Velg et nettsted først.'); return; }
    if (!scrapeUrl.trim()) { setError('Skriv inn en URL.'); return; }

    // Basic URL validation
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
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: selectedSiteId,
          url: fullUrl,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke starte skanning');
      }

      const data = await res.json();
      const sourceId = data.sourceId;

      setScrapeStatus({
        sourceId,
        status: 'processing',
        title: fullUrl,
        chunksCreated: 0,
        progressText: 'Starter skanning...',
      });

      // Start polling every 3 seconds
      pollRef.current = setInterval(() => {
        pollScrapeStatus(sourceId, token);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt');
      setScrapeSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
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
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-5 sm:px-8">
          <Link
            href="/dashboard/knowledge"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-3"
          >
            <IconArrowLeft className="w-3.5 h-3.5" />
            Tilbake til kunnskapsbase
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Legg til kunnskap</h1>
          <p className="mt-1 text-sm text-slate-500">
            Velg en metode for å gi chatboten ny kunnskap.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 py-6 sm:px-8 max-w-2xl">
        {/* No sites */}
        {sites.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <h2 className="text-base font-semibold text-slate-900 mb-2">Ingen nettsteder</h2>
            <p className="text-sm text-slate-500 mb-5">
              Du trenger minst ett nettsted for å legge til kunnskap.
            </p>
            <Link
              href="/dashboard/sites/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Opprett nettsted
            </Link>
          </div>
        ) : (
          <>
            {/* Site selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nettsted
              </label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full max-w-xs px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            {/* Mode selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Kildetype</label>
              <div className="grid grid-cols-3 gap-3">
                <ModeTab
                  active={mode === 'text'}
                  onClick={() => { setMode('text'); setError(null); setSuccess(null); }}
                  icon={IconText}
                  label="Tekst"
                />
                <ModeTab
                  active={mode === 'url'}
                  onClick={() => { setMode('url'); setError(null); setSuccess(null); }}
                  icon={IconGlobe}
                  label="Nettside"
                />
                <ModeTab
                  active={mode === 'file'}
                  onClick={() => { setMode('file'); setError(null); setSuccess(null); }}
                  icon={IconUpload}
                  label="Fil"
                  disabled
                  badge="Snart"
                />
              </div>
            </div>

            {/* Error / Success messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-2.5">
                <IconCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

            {/* Text mode */}
            {mode === 'text' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tittel</label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="F.eks. Returpolicy, Prisliste 2026"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Innhold</label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Lim inn teksten chatboten skal lære fra..."
                    rows={10}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y"
                  />
                  {textContent.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1.5 tabular-nums">
                      {textContent.length.toLocaleString('nb-NO')} tegn
                    </p>
                  )}
                </div>

                <button
                  onClick={handleTextSubmit}
                  disabled={textSubmitting || !textTitle.trim() || !textContent.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {textSubmitting ? 'Lagrer...' : 'Legg til tekst'}
                </button>
              </div>
            )}

            {/* URL mode */}
            {mode === 'url' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nettadresse</label>
                  <input
                    type="url"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    placeholder="https://example.com"
                    disabled={scrapeSubmitting}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    Vi skanner nettsiden og henter ut tekst automatisk.
                  </p>
                </div>

                {/* Scrape progress */}
                {scrapeStatus && scrapeStatus.status === 'processing' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
                      <span className="text-sm font-medium text-blue-900">Skanner nettside...</span>
                    </div>
                    {scrapeStatus.progressText && (
                      <p className="text-xs text-blue-700 mb-2">{scrapeStatus.progressText}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-blue-600">
                      <span className="tabular-nums">{scrapeStatus.chunksCreated} deler opprettet</span>
                    </div>
                    {/* Indeterminate progress bar */}
                    <div className="mt-3 w-full h-1 bg-blue-100 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-blue-500 rounded-full animate-pulse" style={{ animation: 'indeterminate 1.5s ease-in-out infinite' }} />
                    </div>
                    <style jsx>{`
                      @keyframes indeterminate {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(400%); }
                      }
                    `}</style>
                  </div>
                )}

                <button
                  onClick={handleUrlSubmit}
                  disabled={scrapeSubmitting || !scrapeUrl.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {scrapeSubmitting ? 'Skanner...' : 'Start skanning'}
                </button>
              </div>
            )}

            {/* File mode (placeholder) */}
            {mode === 'file' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
                <div className="text-slate-300 mb-4 flex justify-center">
                  <IconLock className="w-12 h-12" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Filopplasting kommer snart</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Støtte for direkte opplasting av PDF, DOCX og CSV-filer er under utvikling. Bruk tekstmetoden for nå, eller lim inn innholdet direkte.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
