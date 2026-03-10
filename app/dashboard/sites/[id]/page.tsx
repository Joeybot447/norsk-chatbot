'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../_lib/supabase/client';
import { useAuth } from '../../../_lib/supabase/hooks';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ── Design tokens ──
const colors = {
  blue: '#2563eb',
  blueHover: '#1d4ed8',
  blueBg: '#eff6ff',
  border: '#e2e8f0',
  bg: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
  success: '#16a34a',
  successBg: '#dcfce7',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  white: '#ffffff',
};

const presetColors = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#ea580c', '#d97706', '#db2777', '#0891b2'];

const tabs = [
  { key: 'general', label: 'Generelt' },
  { key: 'knowledge', label: 'Kunnskapsbase' },
  { key: 'widget', label: 'Widget-tilpasning' },
  { key: 'cta', label: 'CTA-er og automatisering' },
  { key: 'stats', label: 'Statistikk' },
];

interface Site {
  id: string;
  name: string;
  domain: string;
  welcome_message: string;
  bot_name: string;
  theme_config: any;
  is_active: boolean;
  created_at: string;
  stats: { conversations: number; messages: number; knowledgeSources: number };
  apiKeys: { id: string; key_prefix: string; name: string; is_active: boolean; last_used_at: string | null; created_at: string }[];
}

interface KnowledgeSource {
  id: string;
  type: string;
  title: string;
  file_size: number | null;
  chunk_count: number;
  status: string;
  created_at: string;
}

// ── Shared styles ──
const cardStyle: React.CSSProperties = {
  background: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 12px',
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 14,
  fontFamily,
  color: colors.text,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: colors.text,
  marginBottom: 6,
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: colors.blue,
  color: colors.white,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: 14,
  fontFamily,
};

const btnSecondary: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: colors.white,
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: 14,
  fontFamily,
};

const btnDanger: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: 'transparent',
  color: colors.danger,
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  fontFamily,
};

const fieldGroup: React.CSSProperties = { marginBottom: 20 };

// ── Main Page ──
export default function SiteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;
  const { user, loading: authLoading, getAccessToken } = useAuth();

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSite = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/sites/' + siteId, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke laste nettstedet');
      }
      const data = await res.json();
      setSite(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [siteId, getAccessToken]);

  useEffect(() => {
    if (user && siteId) fetchSite();
  }, [user, siteId, fetchSite]);

  const patchSite = async (updates: Record<string, any>) => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/sites/' + siteId, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke lagre');
      }
      const updated = await res.json();
      setSite((prev) => (prev ? { ...prev, ...updated } : prev));
      setSuccessMsg('Endringer lagret!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, fontFamily }}>
        <div style={{ color: colors.textMuted, fontSize: 16, fontWeight: 500 }}>Laster...</div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, fontFamily }}>
        <div style={{ color: colors.danger, fontSize: 16, fontWeight: 500, marginBottom: 16 }}>{error || 'Nettsted ikke funnet'}</div>
        <button onClick={() => router.push('/dashboard/sites')} style={btnSecondary}>← Tilbake til nettsteder</button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: colors.white, borderBottom: `1px solid ${colors.border}`, padding: '16px 24px' }}>
        <button
          onClick={() => router.push('/dashboard/sites')}
          style={{ background: 'none', border: 'none', color: colors.blue, cursor: 'pointer', fontSize: 14, fontFamily, padding: 0, marginBottom: 8, display: 'block' }}
        >
          ← Tilbake til nettsteder
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, margin: 0 }}>{site.name}</h1>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div style={{ background: colors.successBg, color: colors.success, padding: '10px 24px', fontSize: 14, fontWeight: 500, borderBottom: `1px solid #bbf7d0` }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ backgroundColor: colors.white, borderBottom: `1px solid ${colors.border}`, padding: '0 24px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? colors.blue : colors.textMuted,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? `2px solid ${colors.blue}` : '2px solid transparent',
              cursor: 'pointer',
              fontFamily,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: 24, maxWidth: 900 }}>
        {activeTab === 'general' && <GeneralTab site={site} onSave={patchSite} saving={saving} />}
        {activeTab === 'knowledge' && <KnowledgeTab siteId={siteId} getAccessToken={getAccessToken} />}
        {activeTab === 'widget' && <WidgetTab site={site} siteId={siteId} onSave={patchSite} saving={saving} />}
        {activeTab === 'cta' && <CTATab site={site} onSave={patchSite} saving={saving} />}
        {activeTab === 'stats' && <StatsTab siteId={siteId} site={site} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab 1: Generelt
// ═══════════════════════════════════════════════════════
function GeneralTab({ site, onSave, saving }: { site: Site; onSave: (u: any) => Promise<void>; saving: boolean }) {
  const [name, setName] = useState(site.name || '');
  const [domain, setDomain] = useState(site.domain || '');
  const [botName, setBotName] = useState(site.bot_name || '');
  const [welcomeMsg, setWelcomeMsg] = useState(site.welcome_message || '');
  const [isActive, setIsActive] = useState(site.is_active);

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 20px' }}>Generelle innstillinger</h2>

      <div style={fieldGroup}>
        <label style={labelStyle}>Nettstedsnavn</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Min Bedrift" onFocus={(e) => (e.target.style.borderColor = colors.blue)} onBlur={(e) => (e.target.style.borderColor = colors.border)} />
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Domene</label>
        <input style={inputStyle} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="https://eksempel.no" onFocus={(e) => (e.target.style.borderColor = colors.blue)} onBlur={(e) => (e.target.style.borderColor = colors.border)} />
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Bot-navn</label>
        <input style={inputStyle} value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="NorskBot" onFocus={(e) => (e.target.style.borderColor = colors.blue)} onBlur={(e) => (e.target.style.borderColor = colors.border)} />
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Velkomstmelding</label>
        <textarea
          value={welcomeMsg}
          onChange={(e) => setWelcomeMsg(e.target.value)}
          placeholder="Hei! Hvordan kan jeg hjelpe deg?"
          rows={3}
          style={{ ...inputStyle, height: 'auto', padding: 12, resize: 'vertical' }}
          onFocus={(e) => (e.target.style.borderColor = colors.blue)}
          onBlur={(e) => (e.target.style.borderColor = colors.border)}
        />
      </div>

      <div style={{ ...fieldGroup, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ ...labelStyle, margin: 0 }}>Status</label>
        <button
          onClick={() => setIsActive(!isActive)}
          style={{
            width: 48,
            height: 26,
            borderRadius: 13,
            border: 'none',
            backgroundColor: isActive ? colors.blue : '#cbd5e1',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background-color 0.2s',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: isActive ? 25 : 3,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: colors.white,
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </button>
        <span style={{ fontSize: 13, color: isActive ? colors.success : colors.textMuted }}>{isActive ? 'Aktiv' : 'Inaktiv'}</span>
      </div>

      <button
        onClick={() => onSave({ name, domain, bot_name: botName, welcome_message: welcomeMsg, is_active: isActive })}
        disabled={saving}
        style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Lagrer...' : 'Lagre endringer'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab 2: Kunnskapsbase
// ═══════════════════════════════════════════════════════
function KnowledgeTab({ siteId, getAccessToken }: { siteId: string; getAccessToken: () => Promise<string | null> }) {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showTextForm, setShowTextForm] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [submittingText, setSubmittingText] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // URL scrape state
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeResult, setScrapeResult] = useState<{ pagesCrawled: number; chunksCreated: number } | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch('/api/ingest?siteId=' + siteId, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [siteId, getAccessToken]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('siteId', siteId);
      fd.append('title', file.name);
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Opplasting feilet');
      }
      await fetchSources();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (sourceId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne kilden?')) return;
    setDeleting(sourceId);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/ingest?sourceId=' + sourceId, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) throw new Error('Kunne ikke slette');
      await fetchSources();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleTextSubmit = async () => {
    if (!textTitle.trim() || !textContent.trim()) return;
    setSubmittingText(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, title: textTitle, text: textContent, type: 'text' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke lagre tekst');
      }
      setTextTitle('');
      setTextContent('');
      setShowTextForm(false);
      await fetchSources();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingText(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapeError(null);
    setScrapeResult(null);
    setScrapeStatus('Starter skanning...');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');

      // Start scrape — returns immediately with sourceId
      const res = await fetch('/api/ingest/scrape', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl, siteId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Skanning feilet');
      }
      const data = await res.json();
      const sourceId = data.sourceId;
      if (!sourceId) throw new Error('Ingen kilde-ID mottatt');

      // Poll for progress every 3 seconds
      setScrapeStatus('Kobler til nettside...');
      let done = false;
      let attempts = 0;
      const maxAttempts = 120; // 6 minutes max (120 * 3s)
      while (!done && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 3000));
        attempts++;
        try {
          const pollRes = await fetch('/api/ingest/scrape?sourceId=' + sourceId, {
            headers: { Authorization: 'Bearer ' + token },
          });
          if (!pollRes.ok) continue;
          const poll = await pollRes.json();

          if (poll.status === 'processing') {
            // Show the progress text from the backend content field
            const chunks = poll.chunksCreated || 0;
            setScrapeStatus(poll.progressText || `Skanner... (${chunks} deler opprettet)`);
          } else if (poll.status === 'ready') {
            setScrapeResult({ pagesCrawled: 0, chunksCreated: poll.chunksCreated || 0 });
            setScrapeStatus(null);
            setScrapeUrl('');
            await fetchSources();
            done = true;
          } else if (poll.status === 'error') {
            throw new Error('Skanning feilet. Sjekk at nettadressen er korrekt.');
          }
        } catch (pollErr: any) {
          if (pollErr.message.includes('feilet')) throw pollErr;
          // Network error during poll — keep trying
        }
      }
      if (!done) {
        throw new Error('Skanning tok for lang tid. Sjekk status i kunnskapsbasen.');
      }
    } catch (err: any) {
      setScrapeError(err.message);
      setScrapeStatus(null);
    } finally {
      setScraping(false);
    }
  };

  const typeBadge = (type: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      document: { label: 'PDF', bg: '#fef3c7', color: '#92400e' },
      text: { label: 'Tekst', bg: '#dbeafe', color: '#1e40af' },
      webpage: { label: 'URL', bg: '#e0e7ff', color: '#3730a3' },
      csv: { label: 'CSV', bg: '#d1fae5', color: '#065f46' },
      faq: { label: 'FAQ', bg: '#fce7f3', color: '#9d174d' },
    };
    const m = map[type] || { label: type.toUpperCase(), bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: m.bg, color: m.color }}>
        {m.label}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      ready: { label: 'Klar', bg: colors.successBg, color: colors.success },
      processing: { label: 'Behandler', bg: '#fef3c7', color: '#92400e' },
      error: { label: 'Feil', bg: colors.dangerBg, color: colors.danger },
      pending: { label: 'Venter', bg: '#f1f5f9', color: '#64748b' },
    };
    const m = map[status] || { label: status, bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: m.bg, color: m.color }}>
        {m.label}
      </span>
    );
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div style={{ color: colors.textMuted, padding: 20 }}>Laster kunnskapskilder...</div>;
  }

  return (
    <div>
      {/* URL Scrape section */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: '0 0 12px' }}>Importer fra nettside</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <label style={labelStyle}>Nettadresse</label>
            <input
              style={inputStyle}
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://dinbedrift.no"
              disabled={scraping}
              onFocus={(e) => (e.target.style.borderColor = colors.blue)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !scraping) handleScrape(); }}
            />
          </div>
          <button
            onClick={handleScrape}
            disabled={scraping || !scrapeUrl.trim()}
            style={{ ...btnPrimary, opacity: scraping || !scrapeUrl.trim() ? 0.7 : 1, whiteSpace: 'nowrap' }}
          >
            {scraping ? 'Skanner...' : 'Skann nettside'}
          </button>
        </div>
        {scrapeStatus && (
          <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: '#eff6ff', borderRadius: 8, fontSize: 13, color: colors.blue, fontWeight: 500 }}>
            {scrapeStatus}
          </div>
        )}
        {scrapeError && (
          <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: colors.dangerBg, borderRadius: 8, fontSize: 13, color: colors.danger, fontWeight: 500 }}>
            {scrapeError}
          </div>
        )}
        {scrapeResult && (
          <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: colors.successBg, borderRadius: 8, fontSize: 13, color: colors.success, fontWeight: 500 }}>
            Ferdig! {scrapeResult.pagesCrawled} sider skannet, {scrapeResult.chunksCreated} kunnskapsdeler opprettet.
          </div>
        )}
      </div>

      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>Kunnskapsbase</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowTextForm(!showTextForm)} style={btnSecondary}>
            + Legg til tekst
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...btnPrimary, opacity: uploading ? 0.7 : 1 }}>
            {uploading ? 'Laster opp...' : '📁 Last opp fil'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.md,.csv" style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      </div>

      {/* Text snippet form */}
      {showTextForm && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Legg til tekstinnhold</h3>
          <div style={fieldGroup}>
            <label style={labelStyle}>Tittel</label>
            <input style={inputStyle} value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="F.eks. Åpningstider" onFocus={(e) => (e.target.style.borderColor = colors.blue)} onBlur={(e) => (e.target.style.borderColor = colors.border)} />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Innhold</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Skriv eller lim inn teksten her..."
              rows={6}
              style={{ ...inputStyle, height: 'auto', padding: 12, resize: 'vertical' }}
              onFocus={(e) => (e.target.style.borderColor = colors.blue)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleTextSubmit} disabled={submittingText} style={{ ...btnPrimary, opacity: submittingText ? 0.7 : 1 }}>
              {submittingText ? 'Lagrer...' : 'Lagre tekst'}
            </button>
            <button onClick={() => { setShowTextForm(false); setTextTitle(''); setTextContent(''); }} style={btnSecondary}>Avbryt</button>
          </div>
        </div>
      )}

      {/* Sources list */}
      {sources.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 15, color: colors.textMuted }}>
            Ingen kunnskapskilder ennå. Last opp dokumenter eller legg til tekst for å trene chatboten din.
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Tittel</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Type</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Deler</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Størrelse</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Dato</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src, i) => (
                <tr key={src.id} style={{ borderBottom: i < sources.length - 1 ? `1px solid #f1f5f9` : 'none' }}>
                  <td style={{ padding: '12px', fontSize: 14, color: colors.text, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.title}</td>
                  <td style={{ padding: '12px' }}>{typeBadge(src.type)}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: 14, color: colors.text }}>{src.chunk_count}</td>
                  <td style={{ padding: '12px' }}>{statusBadge(src.status)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: 13, color: colors.textMuted }}>{formatSize(src.file_size)}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: colors.textMuted }}>{new Date(src.created_at).toLocaleDateString('nb-NO')}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(src.id)}
                      disabled={deleting === src.id}
                      style={{ ...btnDanger, opacity: deleting === src.id ? 0.5 : 1 }}
                    >
                      {deleting === src.id ? '...' : 'Slett'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab 3: Widget-tilpasning
// ═══════════════════════════════════════════════════════
function WidgetTab({ site, siteId, onSave, saving }: { site: Site; siteId: string; onSave: (u: any) => Promise<void>; saving: boolean }) {
  const tc = site.theme_config || {};
  const [primaryColor, setPrimaryColor] = useState(tc.primaryColor || '#2563eb');
  const [customHex, setCustomHex] = useState('');
  const [position, setPosition] = useState(tc.position || 'bottom-right');
  const [autoOpenDelay, setAutoOpenDelay] = useState(tc.autoOpenDelay || 0);
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="https://cdn.norskbot.no/widget.js" data-site-id="${siteId}"></script>`;
  const apiKeyPrefix = site.apiKeys?.[0]?.key_prefix || null;

  const handleSave = () => {
    onSave({
      theme_config: {
        ...tc,
        primaryColor,
        position,
        autoOpenDelay,
      },
    });
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      {/* Color picker */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Temafarge</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          {presetColors.map((c) => (
            <button
              key={c}
              onClick={() => setPrimaryColor(c)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: c,
                border: primaryColor === c ? '3px solid #0f172a' : '2px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'transform 0.1s',
              }}
              title={c}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            style={{ ...inputStyle, width: 120 }}
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#hex"
            onFocus={(e) => (e.target.style.borderColor = colors.blue)}
            onBlur={(e) => (e.target.style.borderColor = colors.border)}
          />
          <button
            onClick={() => { if (/^#[0-9a-fA-F]{6}$/.test(customHex)) setPrimaryColor(customHex); }}
            style={btnSecondary}
          >
            Bruk
          </button>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: primaryColor, border: `1px solid ${colors.border}`, flexShrink: 0 }} />
        </div>
      </div>

      {/* Position */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Chat-boble posisjon</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {(['bottom-right', 'bottom-left'] as const).map((pos) => (
            <label key={pos} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: colors.text }}>
              <input
                type="radio"
                name="position"
                checked={position === pos}
                onChange={() => setPosition(pos)}
                style={{ accentColor: colors.blue }}
              />
              {pos === 'bottom-right' ? 'Nederst til høyre' : 'Nederst til venstre'}
            </label>
          ))}
        </div>
      </div>

      {/* Auto-open delay */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Automatisk åpning</h2>
        <select
          value={autoOpenDelay}
          onChange={(e) => setAutoOpenDelay(Number(e.target.value))}
          style={{ ...inputStyle, width: 220, cursor: 'pointer' }}
        >
          <option value={0}>Deaktivert</option>
          <option value={3}>Etter 3 sekunder</option>
          <option value={5}>Etter 5 sekunder</option>
          <option value={10}>Etter 10 sekunder</option>
          <option value={30}>Etter 30 sekunder</option>
        </select>
      </div>

      {/* Live preview */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Forhåndsvisning</h2>
        <div style={{ backgroundColor: '#f1f5f9', borderRadius: 12, padding: 24, position: 'relative', minHeight: 280 }}>
          {/* Mini chat window */}
          <div style={{
            position: 'absolute',
            [position === 'bottom-right' ? 'right' : 'left']: 24,
            bottom: 70,
            width: 280,
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            background: colors.white,
          }}>
            <div style={{ backgroundColor: primaryColor, color: '#fff', padding: '14px 16px', fontWeight: 600, fontSize: 14 }}>
              {site.bot_name || 'NorskBot'}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ backgroundColor: '#f1f5f9', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: colors.text, marginBottom: 10, maxWidth: '85%' }}>
                {site.welcome_message || 'Hei! Hvordan kan jeg hjelpe deg?'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  placeholder="Skriv en melding..."
                  style={{ ...inputStyle, height: 36, fontSize: 13, flex: 1 }}
                />
                <button style={{ width: 36, height: 36, borderRadius: 8, border: 'none', backgroundColor: primaryColor, color: '#fff', cursor: 'default', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ↑
                </button>
              </div>
            </div>
          </div>
          {/* Bubble */}
          <div style={{
            position: 'absolute',
            [position === 'bottom-right' ? 'right' : 'left']: 24,
            bottom: 16,
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: primaryColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 22,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            💬
          </div>
        </div>
      </div>

      {/* Embed code */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 12px' }}>Innbyggingskode</h2>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 12px' }}>Legg denne koden til i &lt;head&gt; eller &lt;body&gt; på nettstedet ditt:</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <code style={{
            flex: 1,
            display: 'block',
            backgroundColor: '#f1f5f9',
            padding: '12px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'monospace',
            color: colors.text,
            wordBreak: 'break-all',
            lineHeight: 1.5,
          }}>
            {embedCode}
          </code>
          <button onClick={copyEmbed} style={{ ...btnSecondary, whiteSpace: 'nowrap' }}>
            {copied ? '✓ Kopiert!' : 'Kopier'}
          </button>
        </div>
      </div>

      {/* API key */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 12px' }}>API-nøkkel</h2>
        {apiKeyPrefix ? (
          <>
            <div style={{ fontSize: 14, color: colors.text, fontFamily: 'monospace', marginBottom: 8 }}>
              {apiKeyPrefix}...
            </div>
            <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
              Nøkkelen ble vist kun ved opprettelse. Kontakt oss hvis du trenger en ny.
            </p>
          </>
        ) : (
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Ingen API-nøkkel generert for dette nettstedet.</p>
        )}
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Lagrer...' : 'Lagre widget-innstillinger'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab 4: CTA-er og automatisering
// ═══════════════════════════════════════════════════════
function CTATab({ site, onSave, saving }: { site: Site; onSave: (u: any) => Promise<void>; saving: boolean }) {
  const tc = site.theme_config || {};
  const [ctas, setCtas] = useState<{ delay: number; message: string }[]>(tc.ctas || []);
  const [quickReplies, setQuickReplies] = useState<{ text: string; response: string }[]>(tc.quickReplies || []);

  // CTA form
  const [ctaDelay, setCtaDelay] = useState(5);
  const [ctaMessage, setCtaMessage] = useState('');

  // Quick reply form
  const [qrText, setQrText] = useState('');
  const [qrResponse, setQrResponse] = useState('');

  const addCTA = () => {
    if (!ctaMessage.trim()) return;
    setCtas([...ctas, { delay: ctaDelay, message: ctaMessage }]);
    setCtaMessage('');
  };

  const removeCTA = (i: number) => {
    setCtas(ctas.filter((_, idx) => idx !== i));
  };

  const addQuickReply = () => {
    if (!qrText.trim() || !qrResponse.trim()) return;
    setQuickReplies([...quickReplies, { text: qrText, response: qrResponse }]);
    setQrText('');
    setQrResponse('');
  };

  const removeQuickReply = (i: number) => {
    setQuickReplies(quickReplies.filter((_, idx) => idx !== i));
  };

  const moveQuickReply = (i: number, dir: -1 | 1) => {
    const ni = i + dir;
    if (ni < 0 || ni >= quickReplies.length) return;
    const arr = [...quickReplies];
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    setQuickReplies(arr);
  };

  const handleSave = () => {
    onSave({
      theme_config: { ...tc, ctas, quickReplies },
    });
  };

  return (
    <div>
      {/* Proactive messages */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 4px' }}>Proaktive meldinger</h2>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 16px' }}>
          Meldinger som boten sender automatisk etter en viss tid med inaktivitet.
        </p>

        {ctas.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {ctas.map((cta, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < ctas.length - 1 ? `1px solid #f1f5f9` : 'none' }}>
                <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap', minWidth: 80 }}>Etter {cta.delay}s:</span>
                <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>{cta.message}</span>
                <button onClick={() => removeCTA(i)} style={btnDanger}>Slett</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={labelStyle}>Forsinkelse</label>
            <select value={ctaDelay} onChange={(e) => setCtaDelay(Number(e.target.value))} style={{ ...inputStyle, width: 140 }}>
              <option value={3}>3 sekunder</option>
              <option value={5}>5 sekunder</option>
              <option value={10}>10 sekunder</option>
              <option value={15}>15 sekunder</option>
              <option value={30}>30 sekunder</option>
              <option value={60}>60 sekunder</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Melding</label>
            <input style={inputStyle} value={ctaMessage} onChange={(e) => setCtaMessage(e.target.value)} placeholder="F.eks. Trenger du hjelp?" onFocus={(e) => (e.target.style.borderColor = colors.blue)} onBlur={(e) => (e.target.style.borderColor = colors.border)} />
          </div>
          <button onClick={addCTA} style={btnPrimary}>+ Legg til</button>
        </div>
      </div>

      {/* Quick replies */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 4px' }}>Hurtigsvar-knapper</h2>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 16px' }}>
          Forhåndsdefinerte svarknapper som vises til besøkende i chat-vinduet.
        </p>

        {quickReplies.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {quickReplies.map((qr, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < quickReplies.length - 1 ? `1px solid #f1f5f9` : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button onClick={() => moveQuickReply(i, -1)} disabled={i === 0} style={{ border: 'none', background: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? '#cbd5e1' : colors.textMuted, fontSize: 10, padding: 0, lineHeight: 1 }}>▲</button>
                  <button onClick={() => moveQuickReply(i, 1)} disabled={i === quickReplies.length - 1} style={{ border: 'none', background: 'none', cursor: i === quickReplies.length - 1 ? 'default' : 'pointer', color: i === quickReplies.length - 1 ? '#cbd5e1' : colors.textMuted, fontSize: 10, padding: 0, lineHeight: 1 }}>▼</button>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 16, backgroundColor: colors.blueBg, color: colors.blue, fontSize: 13, fontWeight: 500 }}>{qr.text}</span>
                <span style={{ fontSize: 13, color: colors.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>→ {qr.response}</span>
                <button onClick={() => removeQuickReply(i)} style={btnDanger}>Slett</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 140 }}>
            <label style={labelStyle}>Knappetekst</label>
            <input style={inputStyle} value={qrText} onChange={(e) => setQrText(e.target.value)} placeholder="F.eks. Priser" onFocus={(e) => (e.target.style.borderColor = colors.blue)} onBlur={(e) => (e.target.style.borderColor = colors.border)} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Svar</label>
            <input style={inputStyle} value={qrResponse} onChange={(e) => setQrResponse(e.target.value)} placeholder="F.eks. Se våre priser her: ..." onFocus={(e) => (e.target.style.borderColor = colors.blue)} onBlur={(e) => (e.target.style.borderColor = colors.border)} />
          </div>
          <button onClick={addQuickReply} style={btnPrimary}>+ Legg til</button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Lagrer...' : 'Lagre CTA-innstillinger'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab 5: Statistikk
// ═══════════════════════════════════════════════════════
function StatsTab({ siteId, site }: { siteId: string; site: Site }) {
  const [stats, setStats] = useState<{ conversations: number; messages: number; avgMessages: number; lastActive: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get conversation count and data
        const { data: convos, count: convCount } = await supabase
          .from('conversations')
          .select('id, started_at', { count: 'exact' })
          .eq('site_id', siteId)
          .order('started_at', { ascending: false });

        const conversations = convCount || 0;

        // Get message count
        const convIds = (convos || []).map((c: any) => c.id);
        let messages = 0;
        if (convIds.length > 0) {
          const { count: msgCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', convIds);
          messages = msgCount || 0;
        }

        const avgMessages = conversations > 0 ? Math.round((messages / conversations) * 10) / 10 : 0;
        const lastActive = convos && convos.length > 0 ? convos[0].started_at : null;

        setStats({ conversations, messages, avgMessages, lastActive });
      } catch (err) {
        console.error('Stats fetch error:', err);
        setStats({ conversations: site.stats?.conversations || 0, messages: site.stats?.messages || 0, avgMessages: 0, lastActive: null });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [siteId, site]);

  if (loading) {
    return <div style={{ color: colors.textMuted, padding: 20 }}>Laster statistikk...</div>;
  }

  const statCards = [
    { label: 'Samtaler', value: stats?.conversations ?? 0, icon: '💬' },
    { label: 'Meldinger', value: stats?.messages ?? 0, icon: '✉️' },
    { label: 'Snitt meldinger/samtale', value: stats?.avgMessages ?? 0, icon: '📊' },
    { label: 'Sist aktiv', value: stats?.lastActive ? new Date(stats.lastActive).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Aldri', icon: '🕐' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 20px' }}>Statistikk</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {statCards.map((sc) => (
          <div key={sc.label} style={cardStyle}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{sc.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginBottom: 4 }}>{sc.value}</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>{sc.label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, marginTop: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: '0 0 8px' }}>Kunnskapskilder</h3>
        <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{site.stats?.knowledgeSources ?? 0}</div>
        <div style={{ fontSize: 13, color: colors.textMuted }}>opplastede kilder</div>
      </div>
    </div>
  );
}
