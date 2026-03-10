'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../_lib/supabase/client';
import { useAuth } from '../../../_lib/supabase/hooks';

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

interface Site {
  id: string;
  name: string;
}

interface UploadedDoc {
  id: string;
  title: string;
  type: string;
  status: string;
  chunk_count: number | null;
  file_size: number | null;
  created_at: string;
}

export default function UploadKnowledgePage() {
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ chunks: number; title: string } | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load user's sites
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
        const siteList = (data || []) as Site[];
        setSites(siteList);
        if (siteList.length > 0 && !selectedSiteId) {
          setSelectedSiteId(siteList[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load sites:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Load existing documents for selected site
  useEffect(() => {
    if (!selectedSiteId || !user) {
      setDocuments([]);
      return;
    }
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        const response = await fetch('/api/ingest?siteId=' + selectedSiteId, {
          headers: { 'Authorization': 'Bearer ' + token },
        });
        if (response.ok) {
          const data = await response.json();
          setDocuments(data.sources || data || []);
        }
      } catch (err: any) {
        console.error('Failed to load documents:', err);
      }
    })();
  }, [selectedSiteId, user]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleUpload = async (file: File) => {
    if (!selectedSiteId) {
      setUploadError('Velg et nettsted først');
      return;
    }

    setUploadProgress(0);
    setUploadError(null);
    setUploadResult(null);

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 90) return prev;
        return prev + 10;
      });
    }, 300);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('siteId', selectedSiteId);

      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Opplasting feilet');
      }

      const data = await response.json();
      setUploadProgress(100);
      setUploadResult({
        chunks: data.chunkCount || data.chunk_count || 0,
        title: data.title || file.name,
      });

      // Refresh document list
      setTimeout(async () => {
        setUploadProgress(null);
        try {
          const refreshResponse = await fetch('/api/ingest?siteId=' + selectedSiteId, {
            headers: { 'Authorization': 'Bearer ' + token },
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            setDocuments(refreshData.sources || refreshData || []);
          }
        } catch {} // silent refresh failure
      }, 1500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadProgress(null);
      setUploadError(err.message || 'Noe gikk galt under opplasting');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Slett dette dokumentet?')) return;
    setDeleting(docId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const response = await fetch('/api/ingest?sourceId=' + docId, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke slette');
      }
      setDocuments((docs) => docs.filter((d) => d.id !== docId));
    } catch (err: any) {
      alert(err.message || 'Feil ved sletting');
    } finally {
      setDeleting(null);
    }
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

  const fileTypeBadge = (type: string) => {
    const upper = type.toUpperCase();
    const colors: Record<string, { bg: string; color: string }> = {
      PDF: { bg: '#fee2e2', color: '#991b1b' },
      TXT: { bg: '#e0f2fe', color: '#075985' },
      DOCX: { bg: '#ede9fe', color: '#5b21b6' },
      DOCUMENT: { bg: '#fee2e2', color: '#991b1b' },
      WEBPAGE: { bg: '#e0f2fe', color: '#075985' },
      TEXT: { bg: '#f1f5f9', color: '#64748b' },
    };
    return colors[upper] || { bg: '#f1f5f9', color: '#64748b' };
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
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <a href="/dashboard/knowledge" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>Tilbake til kunnskapsbase</a>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 0 0' }}>Last opp dokumenter</h1>
        </div>
      </div>

      <main style={{ padding: '24px', flex: 1, overflow: 'auto', maxWidth: '900px' }}>
        {/* Site Selector */}
        {sites.length > 0 && (
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Ingen nettsteder</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Opprett et nettsted først for å laste opp dokumenter.</div>
            <a href="/dashboard/sites/new" style={{ display: 'inline-block', padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
              + Legg til nettsted
            </a>
          </div>
        ) : (
          <>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx,.doc,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileSelect}
              style={{
                backgroundColor: isDragging ? '#eff6ff' : 'white',
                borderRadius: '12px',
                border: isDragging ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
                padding: '48px 32px',
                textAlign: 'center' as const,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M17 8l-5-5-5 5" />
                  <path d="M12 3v12" />
                </svg>
              </div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>
                Dra og slipp filer her
              </p>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px 0' }}>
                eller klikk for å velge filer
              </p>
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                {['PDF', 'TXT', 'DOCX'].map((fmt) => {
                  const badge = fileTypeBadge(fmt);
                  return (
                    <span key={fmt} style={{ padding: '4px 12px', backgroundColor: badge.bg, borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: badge.color }}>
                      {fmt}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{uploadError}</p>
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && uploadProgress === null && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: '#166534', margin: 0, fontWeight: 500 }}>
                  ✓ «{uploadResult.title}» lastet opp — {uploadResult.chunks} chunks opprettet
                </p>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress !== null && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>Laster opp...</span>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>{Math.min(uploadProgress, 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(uploadProgress, 100)}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '4px', transition: 'width 0.15s ease' }} />
                </div>
              </div>
            )}

            {/* Supported Formats Info */}
            <div style={{ backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', margin: '0 0 4px 0' }}>Støttede formater</p>
                <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
                  <strong>PDF</strong> — Produktkataloger, manualer, rapporter |
                  <strong> TXT</strong> — Vanlige tekstfiler, FAQ-er |
                  <strong> DOCX</strong> — Word-dokumenter, retningslinjer
                </p>
                <p style={{ fontSize: '12px', color: '#3b82f6', margin: '6px 0 0 0' }}>Maks filstørrelse: 25 MB per fil</p>
              </div>
            </div>

            {/* Documents List */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Opplastede dokumenter ({documents.length})</h3>
              </div>

              {documents.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' as const, color: '#64748b' }}>
                  <p style={{ fontSize: '14px' }}>Ingen dokumenter lastet opp ennå</p>
                </div>
              ) : (
                <div>
                  {documents.map((doc, i) => {
                    const st = statusConfig(doc.status);
                    const badge = fileTypeBadge(doc.type);
                    const fileSize = doc.file_size ? (doc.file_size > 1048576 ? (doc.file_size / 1048576).toFixed(1) + ' MB' : (doc.file_size / 1024).toFixed(0) + ' KB') : '';
                    return (
                      <div
                        key={doc.id}
                        style={{
                          padding: '16px 20px',
                          borderBottom: i < documents.length - 1 ? '1px solid #f1f5f9' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: badge.color }}>
                            {doc.type.substring(0, 4).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', margin: 0 }}>{doc.title}</p>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                              {fileSize}{fileSize ? ' — ' : ''}{doc.type}{doc.chunk_count ? ' — ' + doc.chunk_count + ' chunks' : ''} — {new Date(doc.created_at).toLocaleDateString('nb-NO')}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', backgroundColor: st.bg, color: st.color, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: st.dotColor, display: 'inline-block' }} />
                            {st.label}
                          </span>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deleting === doc.id}
                            style={{
                              padding: '6px 12px', backgroundColor: 'transparent', color: deleting === doc.id ? '#94a3b8' : '#ef4444',
                              border: '1px solid #fecaca', borderRadius: '6px', cursor: deleting === doc.id ? 'not-allowed' : 'pointer',
                              fontSize: '12px', fontFamily: fontStack, transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { if (deleting !== doc.id) e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            {deleting === doc.id ? 'Sletter...' : 'Slett'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
