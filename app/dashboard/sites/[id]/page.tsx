'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../_lib/supabase/client';
import { useAuth } from '../../../_lib/supabase/hooks';



// ── Design tokens ──
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
  warning: '#d97706',
  warningBg: '#fef3c7',
  white: '#ffffff',
};

const presetColors = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#ea580c', '#d97706', '#db2777', '#0891b2'];

const tabs = [
  { key: 'general', label: 'Generelt' },
  { key: 'knowledge', label: 'Kunnskapsbase' },
  { key: 'ai-settings', label: 'AI-innstillinger' },
  { key: 'widget', label: 'Widget' },
  { key: 'api-keys', label: 'API-nokler' },
  { key: 'stats', label: 'Statistikk' },
];

interface BotConfig {
  system_prompt: string;
  tone: string;
  response_length: string;
  temperature: number;
  include_sources: boolean;
  fallback_message: string;
  max_tokens: number;
}

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface Site {
  id: string;
  name: string;
  domain: string;
  welcome_message: string;
  bot_name: string;
  theme_config: any;
  bot_config: BotConfig;
  is_active: boolean;
  created_at: string;
  stats: { conversations: number; messages: number; knowledgeSources: number };
  apiKeys: ApiKey[];
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
  borderRadius: 14,
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

  color: colors.text,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
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

  transition: 'all 0.15s',
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

  transition: 'all 0.15s',
};

const btnDanger: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: 'transparent',
  color: colors.danger,
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,

  transition: 'all 0.15s',
};

const fieldGroup: React.CSSProperties = { marginBottom: 20 };

const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = colors.blue;
  e.target.style.boxShadow = `0 0 0 3px ${colors.blueBg}`;
};
const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = colors.border;
  e.target.style.boxShadow = 'none';
};

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
      setSuccessMsg('Endringer lagret');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: `3px solid ${colors.border}`, borderTopColor: colors.blue,
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{ color: colors.danger, fontSize: 15, fontWeight: 500, marginBottom: 16 }}>{error || 'Nettsted ikke funnet'}</div>
        <button onClick={() => router.push('/dashboard/sites')} style={btnSecondary}>Tilbake til nettsteder</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg }}>
      {/* Header */}
      <div style={{ backgroundColor: colors.white, borderBottom: `1px solid ${colors.border}`, padding: '16px 32px' }}>
        <button
          onClick={() => router.push('/dashboard/sites')}
          style={{
            background: 'none', border: 'none', color: colors.blue, cursor: 'pointer',
            fontSize: 14, padding: 0, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Tilbake til nettsteder
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0, letterSpacing: '-0.02em' }}>{site.name}</h1>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            backgroundColor: site.is_active ? colors.successBg : colors.borderLight,
            color: site.is_active ? colors.success : colors.textMuted,
          }}>
            {site.is_active ? 'Aktiv' : 'Inaktiv'}
          </span>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div style={{
          background: colors.successBg, color: colors.success, padding: '10px 32px',
          fontSize: 14, fontWeight: 500, borderBottom: '1px solid #bbf7d0',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        backgroundColor: colors.white, borderBottom: `1px solid ${colors.border}`,
        padding: '0 32px', display: 'flex', gap: 0, overflowX: 'auto',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '14px 20px', fontSize: 14,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? colors.blue : colors.textMuted,
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.key ? `2px solid ${colors.blue}` : '2px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '28px 32px', maxWidth: 900 }}>
        {activeTab === 'general' && <GeneralTab site={site} onSave={patchSite} saving={saving} />}
        {activeTab === 'knowledge' && <KnowledgeTab siteId={siteId} getAccessToken={getAccessToken} />}
        {activeTab === 'ai-settings' && <AISettingsTab site={site} onSave={patchSite} saving={saving} />}
        {activeTab === 'widget' && <WidgetTab site={site} siteId={siteId} onSave={patchSite} saving={saving} />}
        {activeTab === 'api-keys' && <ApiKeysTab site={site} siteId={siteId} getAccessToken={getAccessToken} onRefresh={fetchSite} />}
        {activeTab === 'stats' && <StatsTab siteId={siteId} site={site} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab: Generelt
// ═══════════════════════════════════════════════════════
function GeneralTab({ site, onSave, saving }: { site: Site; onSave: (u: any) => Promise<void>; saving: boolean }) {
  const [name, setName] = useState(site.name || '');
  const [domain, setDomain] = useState(site.domain || '');
  const [botName, setBotName] = useState(site.bot_name || '');
  const [welcomeMsg, setWelcomeMsg] = useState(site.welcome_message || '');
  const [isActive, setIsActive] = useState(site.is_active);

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 24px' }}>Generelle innstillinger</h2>

      <div style={fieldGroup}>
        <label style={labelStyle}>Nettstedsnavn</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Min Bedrift" onFocus={handleFocus} onBlur={handleBlur} />
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Domene</label>
        <input style={inputStyle} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="https://eksempel.no" onFocus={handleFocus} onBlur={handleBlur} />
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Bot-navn</label>
        <input style={inputStyle} value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="NorskBot" onFocus={handleFocus} onBlur={handleBlur} />
        <p style={{ fontSize: 12, color: colors.textMuted, margin: '4px 0 0' }}>Navnet som vises i chat-vinduet til besokende.</p>
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Velkomstmelding</label>
        <textarea
          value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)}
          placeholder="Hei! Hvordan kan jeg hjelpe deg?"
          rows={3}
          style={{ ...inputStyle, height: 'auto', padding: 12, resize: 'vertical' as const }}
          onFocus={handleFocus as any} onBlur={handleBlur as any}
        />
      </div>

      <div style={{ ...fieldGroup, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ ...labelStyle, margin: 0 }}>Status</label>
        <button
          onClick={() => setIsActive(!isActive)}
          style={{
            width: 48, height: 26, borderRadius: 13, border: 'none',
            backgroundColor: isActive ? colors.blue : '#cbd5e1',
            cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: isActive ? 25 : 3,
            width: 20, height: 20, borderRadius: '50%', backgroundColor: colors.white,
            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
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
// Tab: AI-innstillinger
// ═══════════════════════════════════════════════════════
function AISettingsTab({ site, onSave, saving }: { site: Site; onSave: (u: any) => Promise<void>; saving: boolean }) {
  const defaults: BotConfig = {
    system_prompt: '', tone: 'vennlig', response_length: 'medium',
    temperature: 0.7, include_sources: true,
    fallback_message: 'Beklager, jeg fant ikke svar pa det. Kontakt oss direkte for hjelp.',
    max_tokens: 500,
  };
  const bc = site.bot_config || defaults;
  const [systemPrompt, setSystemPrompt] = useState(bc.system_prompt || '');
  const [tone, setTone] = useState(bc.tone || defaults.tone);
  const [responseLength, setResponseLength] = useState(bc.response_length || defaults.response_length);
  const [temperature, setTemperature] = useState(bc.temperature ?? defaults.temperature);
  const [includeSources, setIncludeSources] = useState(bc.include_sources ?? defaults.include_sources);
  const [fallbackMessage, setFallbackMessage] = useState(bc.fallback_message || defaults.fallback_message);
  const [maxTokens, setMaxTokens] = useState(bc.max_tokens || defaults.max_tokens);

  const handleSave = () => {
    onSave({
      bot_config: { system_prompt: systemPrompt, tone, response_length: responseLength, temperature, include_sources: includeSources, fallback_message: fallbackMessage, max_tokens: maxTokens },
    });
  };

  const toneOptions = [
    { value: 'profesjonell', label: 'Profesjonell' },
    { value: 'vennlig', label: 'Vennlig' },
    { value: 'uformell', label: 'Uformell' },
    { value: 'teknisk', label: 'Teknisk' },
  ];

  const lengthOptions = [
    { value: 'kort', label: 'Kort' },
    { value: 'medium', label: 'Medium' },
    { value: 'detaljert', label: 'Detaljert' },
  ];

  const placeholderPrompt = `Du er en hjelpsom assistent for ${site.name}. Svar pa norsk.`;

  return (
    <div>
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 4px' }}>Systeminstruks</h2>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 16px' }}>
          Tilpassede instruksjoner for hvordan chatboten skal oppfore seg.
        </p>
        <div style={fieldGroup}>
          <label style={labelStyle}>Systemprompt</label>
          <textarea
            value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={placeholderPrompt} rows={4}
            style={{ ...inputStyle, height: 'auto', padding: 12, resize: 'vertical' as const }}
            onFocus={handleFocus as any} onBlur={handleBlur as any}
          />
          <p style={{ fontSize: 12, color: colors.textMuted, margin: '6px 0 0' }}>
            Hvis tomt brukes standard: &quot;{placeholderPrompt}&quot;
          </p>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Svarstil</h2>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ ...fieldGroup, flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={handleFocus as any} onBlur={handleBlur as any}>
              {toneOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ ...fieldGroup, flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Svarlengde</label>
            <select value={responseLength} onChange={(e) => setResponseLength(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={handleFocus as any} onBlur={handleBlur as any}>
              {lengthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 4px' }}>Kreativitet (temperatur)</h2>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 16px' }}>
          Lavere verdi gir mer fokuserte svar. Hoyere verdi gir mer kreative svar.
        </p>
        <div style={fieldGroup}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: colors.textMuted, minWidth: 50 }}>Fokusert</span>
            <input
              type="range" min="0" max="1" step="0.05"
              value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: colors.blue, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: colors.textMuted, minWidth: 50, textAlign: 'right' }}>Kreativ</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span style={{
              display: 'inline-block', padding: '4px 14px', backgroundColor: colors.blueBg,
              borderRadius: 6, fontSize: 14, fontWeight: 600, color: colors.blue,
              fontFamily: 'SF Mono, Menlo, monospace',
            }}>
              {temperature.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 4px' }}>Maks svarlengde</h2>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 16px' }}>
          Begrenser hvor langt hvert svar kan bli. 1 token er ca. 4 tegn.
        </p>
        <div style={fieldGroup}>
          <label style={labelStyle}>Maks tokens</label>
          <input
            type="number" min={100} max={2000} step={50}
            value={maxTokens}
            onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setMaxTokens(Math.max(100, Math.min(2000, v))); }}
            style={{ ...inputStyle, width: 160 }}
            onFocus={handleFocus} onBlur={handleBlur}
          />
          <p style={{ fontSize: 12, color: colors.textMuted, margin: '6px 0 0' }}>Standardverdi: 500. Tillatt: 100 til 2000.</p>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 4px' }}>Vis kilder</h2>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Om chatboten skal vise referanser til kunnskapsbasen.</p>
          </div>
          <button
            onClick={() => setIncludeSources(!includeSources)}
            style={{
              width: 48, height: 26, borderRadius: 13, border: 'none',
              backgroundColor: includeSources ? colors.blue : '#cbd5e1',
              cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: includeSources ? 25 : 3,
              width: 20, height: 20, borderRadius: '50%', backgroundColor: colors.white,
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 4px' }}>Reservemelding</h2>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 16px' }}>
          Meldingen som vises nar chatboten ikke finner relevante svar.
        </p>
        <div style={fieldGroup}>
          <label style={labelStyle}>Reservemelding</label>
          <input style={inputStyle} value={fallbackMessage} onChange={(e) => setFallbackMessage(e.target.value)} placeholder="Beklager, jeg fant ikke svar..." onFocus={handleFocus} onBlur={handleBlur} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Lagrer...' : 'Lagre AI-innstillinger'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab: Kunnskapsbase
// ═══════════════════════════════════════════════════════
function KnowledgeTab({ siteId, getAccessToken }: { siteId: string; getAccessToken: () => Promise<string | null> }) {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showTextForm, setShowTextForm] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [submittingText, setSubmittingText] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeResult, setScrapeResult] = useState<{ chunksCreated: number } | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch('/api/ingest?siteId=' + siteId, { headers: { Authorization: 'Bearer ' + token } });
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch {} finally { setLoading(false); }
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
      const res = await fetch('/api/ingest', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Opplasting feilet'); }
      await fetchSources();
    } catch (err: any) { alert(err.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDelete = async (sourceId: string) => {
    setDeleting(sourceId);
    setDeleteConfirm(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/ingest?sourceId=' + sourceId, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('Kunne ikke slette');
      await fetchSources();
    } catch (err: any) { alert(err.message); }
    finally { setDeleting(null); }
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
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Kunne ikke lagre tekst'); }
      setTextTitle(''); setTextContent(''); setShowTextForm(false);
      await fetchSources();
    } catch (err: any) { alert(err.message); }
    finally { setSubmittingText(false); }
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true); setScrapeError(null); setScrapeResult(null); setScrapeStatus('Starter skanning...');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/ingest/scrape', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl, siteId }),
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Skanning feilet'); }
      const data = await res.json();
      const sourceId = data.sourceId;
      if (!sourceId) throw new Error('Ingen kilde-ID mottatt');

      setScrapeStatus('Kobler til nettside...');
      let done = false; let attempts = 0;
      while (!done && attempts < 120) {
        await new Promise(r => setTimeout(r, 3000)); attempts++;
        try {
          const pollRes = await fetch('/api/ingest/scrape?sourceId=' + sourceId, { headers: { Authorization: 'Bearer ' + token } });
          if (!pollRes.ok) continue;
          const poll = await pollRes.json();
          if (poll.status === 'processing') {
            setScrapeStatus(poll.progressText || `Skanner... (${poll.chunksCreated || 0} deler opprettet)`);
          } else if (poll.status === 'ready') {
            setScrapeResult({ chunksCreated: poll.chunksCreated || 0 });
            setScrapeStatus(null); setScrapeUrl(''); await fetchSources(); done = true;
          } else if (poll.status === 'error') { throw new Error('Skanning feilet. Sjekk nettadressen.'); }
        } catch (pollErr: any) { if (pollErr.message.includes('feilet')) throw pollErr; }
      }
      if (!done) throw new Error('Skanning tok for lang tid.');
    } catch (err: any) { setScrapeError(err.message); setScrapeStatus(null); }
    finally { setScraping(false); }
  };

  const typeBadge = (type: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      document: { label: 'PDF', bg: '#fef3c7', color: '#92400e' },
      text: { label: 'Tekst', bg: '#dbeafe', color: '#1e40af' },
      webpage: { label: 'URL', bg: '#e0e7ff', color: '#3730a3' },
      csv: { label: 'CSV', bg: colors.successBg, color: '#065f46' },
      faq: { label: 'FAQ', bg: '#fce7f3', color: '#9d174d' },
    };
    const m = map[type] || { label: type.toUpperCase(), bg: '#f1f5f9', color: '#475569' };
    return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: m.bg, color: m.color }}>{m.label}</span>;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      ready: { label: 'Klar', bg: colors.successBg, color: colors.success },
      processing: { label: 'Behandler', bg: '#fef3c7', color: '#92400e' },
      error: { label: 'Feil', bg: colors.dangerBg, color: colors.danger },
      pending: { label: 'Venter', bg: '#f1f5f9', color: '#64748b' },
    };
    const m = map[status] || { label: status, bg: '#f1f5f9', color: '#475569' };
    return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: m.bg, color: m.color }}>{m.label}</span>;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: `3px solid ${colors.border}`, borderTopColor: colors.blue, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* URL Scrape */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: '0 0 4px' }}>Importer fra nettside</h3>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 14px' }}>Skann en nettside og importer innholdet automatisk.</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <label style={labelStyle}>Nettadresse</label>
            <input style={inputStyle} value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} placeholder="https://dinbedrift.no" disabled={scraping} onFocus={handleFocus} onBlur={handleBlur} onKeyDown={(e) => { if (e.key === 'Enter' && !scraping) handleScrape(); }} />
          </div>
          <button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()} style={{ ...btnPrimary, opacity: scraping || !scrapeUrl.trim() ? 0.6 : 1, whiteSpace: 'nowrap' }}>
            {scraping ? 'Skanner...' : 'Skann nettside'}
          </button>
        </div>
        {scrapeStatus && <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: colors.blueBg, borderRadius: 8, fontSize: 13, color: colors.blue, fontWeight: 500 }}>{scrapeStatus}</div>}
        {scrapeError && <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: colors.dangerBg, borderRadius: 8, fontSize: 13, color: colors.danger, fontWeight: 500 }}>{scrapeError}</div>}
        {scrapeResult && <div style={{ marginTop: 12, padding: '10px 14px', backgroundColor: colors.successBg, borderRadius: 8, fontSize: 13, color: colors.success, fontWeight: 500 }}>Ferdig — {scrapeResult.chunksCreated} kunnskapsdeler opprettet.</div>}
      </div>

      {/* Header with actions */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>Kunnskapsbase</h2>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: '2px 0 0' }}>{sources.length} {sources.length === 1 ? 'kilde' : 'kilder'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowTextForm(!showTextForm)} style={btnSecondary}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2v12M2 8h12" /></svg>
              Legg til tekst
            </span>
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...btnPrimary, opacity: uploading ? 0.6 : 1 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              {uploading ? 'Laster opp...' : 'Last opp fil'}
            </span>
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.md,.csv" style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      </div>

      {/* Text form */}
      {showTextForm && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Legg til tekstinnhold</h3>
          <div style={fieldGroup}>
            <label style={labelStyle}>Tittel</label>
            <input style={inputStyle} value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="F.eks. Apningstider" onFocus={handleFocus} onBlur={handleBlur} />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Innhold</label>
            <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Skriv eller lim inn teksten her..." rows={6} style={{ ...inputStyle, height: 'auto', padding: 12, resize: 'vertical' as const }} onFocus={handleFocus as any} onBlur={handleBlur as any} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleTextSubmit} disabled={submittingText || !textTitle.trim() || !textContent.trim()} style={{ ...btnPrimary, opacity: submittingText ? 0.6 : 1 }}>
              {submittingText ? 'Lagrer...' : 'Lagre tekst'}
            </button>
            <button onClick={() => { setShowTextForm(false); setTextTitle(''); setTextContent(''); }} style={btnSecondary}>Avbryt</button>
          </div>
        </div>
      )}

      {/* Sources list */}
      {sources.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '56px 24px' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.blueBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 6 }}>Ingen kunnskapskilder enna</div>
          <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>
            Last opp dokumenter eller legg til tekst for a trene chatboten din.
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
                <th style={{ padding: '10px 12px', textAlign: 'right', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Storrelse</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Dato</th>
                <th style={{ padding: '10px 12px', width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src, i) => (
                <tr key={src.id} style={{ borderBottom: i < sources.length - 1 ? `1px solid ${colors.borderLight}` : 'none' }}>
                  <td style={{ padding: 12, fontSize: 14, color: colors.text, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.title}</td>
                  <td style={{ padding: 12 }}>{typeBadge(src.type)}</td>
                  <td style={{ padding: 12, textAlign: 'center', fontSize: 14, color: colors.text }}>{src.chunk_count}</td>
                  <td style={{ padding: 12 }}>{statusBadge(src.status)}</td>
                  <td style={{ padding: 12, textAlign: 'right', fontSize: 13, color: colors.textMuted }}>{formatSize(src.file_size)}</td>
                  <td style={{ padding: 12, fontSize: 13, color: colors.textMuted }}>{new Date(src.created_at).toLocaleDateString('nb-NO')}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    {deleteConfirm === src.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleDelete(src.id)} disabled={deleting === src.id} style={{ ...btnDanger, backgroundColor: colors.danger, color: colors.white, border: 'none', opacity: deleting === src.id ? 0.5 : 1 }}>
                          {deleting === src.id ? '...' : 'Ja'}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ ...btnDanger, color: colors.textMuted }}>Nei</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(src.id)} style={btnDanger}>Slett</button>
                    )}
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
// Tab: Widget
// ═══════════════════════════════════════════════════════
function WidgetTab({ site, siteId, onSave, saving }: { site: Site; siteId: string; onSave: (u: any) => Promise<void>; saving: boolean }) {
  const tc = site.theme_config || {};
  const [primaryColor, setPrimaryColor] = useState(tc.primaryColor || '#2563eb');
  const [customHex, setCustomHex] = useState('');
  const [position, setPosition] = useState(tc.position || 'bottom-right');
  const [autoOpenDelay, setAutoOpenDelay] = useState(tc.autoOpenDelay || 0);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const embedCode = `<script src="https://cdn.norskbot.no/widget.js" data-site-id="${siteId}"></script>`;

  const handleSave = () => {
    onSave({ theme_config: { ...tc, primaryColor, position, autoOpenDelay } });
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2500);
    });
  };

  return (
    <div>
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Temafarge</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          {presetColors.map((c) => (
            <button key={c} onClick={() => setPrimaryColor(c)} style={{
              width: 36, height: 36, borderRadius: 8, backgroundColor: c,
              border: primaryColor === c ? `2px solid ${colors.text}` : `2px solid ${colors.border}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }} title={c} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input style={{ ...inputStyle, width: 120 }} value={customHex} onChange={(e) => setCustomHex(e.target.value)} placeholder="#hex" onFocus={handleFocus} onBlur={handleBlur} />
          <button onClick={() => { if (/^#[0-9a-fA-F]{6}$/.test(customHex)) setPrimaryColor(customHex); }} style={btnSecondary}>Bruk</button>
          <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: primaryColor, border: `1px solid ${colors.border}`, flexShrink: 0 }} />
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Chat-posisjon</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {(['bottom-right', 'bottom-left'] as const).map((pos) => (
            <label key={pos} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: colors.text }}>
              <input type="radio" name="position" checked={position === pos} onChange={() => setPosition(pos)} style={{ accentColor: colors.blue }} />
              {pos === 'bottom-right' ? 'Nederst til hoyre' : 'Nederst til venstre'}
            </label>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Automatisk apning</h2>
        <select value={autoOpenDelay} onChange={(e) => setAutoOpenDelay(Number(e.target.value))} style={{ ...inputStyle, width: 220, cursor: 'pointer' }} onFocus={handleFocus as any} onBlur={handleBlur as any}>
          <option value={0}>Deaktivert</option>
          <option value={3}>Etter 3 sekunder</option>
          <option value={5}>Etter 5 sekunder</option>
          <option value={10}>Etter 10 sekunder</option>
          <option value={30}>Etter 30 sekunder</option>
        </select>
      </div>

      {/* Live preview */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Forhandsvisning</h2>
        <div style={{ backgroundColor: colors.borderLight, borderRadius: 12, padding: 24, position: 'relative', minHeight: 280 }}>
          <div style={{
            position: 'absolute',
            [position === 'bottom-right' ? 'right' : 'left']: 24, bottom: 70,
            width: 280, borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden', background: colors.white,
          }}>
            <div style={{ backgroundColor: primaryColor, color: '#fff', padding: '14px 16px', fontWeight: 600, fontSize: 14 }}>{site.bot_name || 'NorskBot'}</div>
            <div style={{ padding: 16 }}>
              <div style={{ backgroundColor: colors.borderLight, borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, color: colors.text, marginBottom: 10, maxWidth: '85%' }}>
                {site.welcome_message || 'Hei! Hvordan kan jeg hjelpe deg?'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input readOnly placeholder="Skriv en melding..." style={{ ...inputStyle, height: 36, fontSize: 13, flex: 1 }} />
                <button style={{ width: 36, height: 36, borderRadius: 8, border: 'none', backgroundColor: primaryColor, color: '#fff', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
          <div style={{
            position: 'absolute',
            [position === 'bottom-right' ? 'right' : 'left']: 24, bottom: 16,
            width: 48, height: 48, borderRadius: '50%', backgroundColor: primaryColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Embed code */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 4px' }}>Innbyggingskode</h2>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 14px' }}>Legg denne koden til i &lt;head&gt; eller &lt;body&gt; pa nettstedet ditt:</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <code style={{
            flex: 1, display: 'block', backgroundColor: colors.bg, padding: '12px 14px',
            borderRadius: 8, fontSize: 12: 'SF Mono, Menlo, monospace',
            color: colors.text, wordBreak: 'break-all', lineHeight: 1.5,
            border: `1px solid ${colors.border}`,
          }}>{embedCode}</code>
          <button onClick={copyEmbed} style={{ ...btnSecondary, whiteSpace: 'nowrap' }}>
            {copiedEmbed ? 'Kopiert' : 'Kopier'}
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Lagrer...' : 'Lagre widget-innstillinger'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab: API-nokler
// ═══════════════════════════════════════════════════════
function ApiKeysTab({ site, siteId, getAccessToken, onRefresh }: { site: Site; siteId: string; getAccessToken: () => Promise<string | null>; onRefresh: () => Promise<void> }) {
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
  const [generateConfirm, setGenerateConfirm] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateConfirm(false);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/sites/' + siteId + '/api-keys', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'API-nokkel' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke opprette nokkel');
      }
      const data = await res.json();
      setNewKey(data.key);
      await onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setGenerating(false); }
  };

  const handleRevoke = async (keyId: string) => {
    setRevoking(keyId);
    setRevokeConfirm(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/sites/' + siteId + '/api-keys', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      if (!res.ok) throw new Error('Kunne ikke deaktivere nokkel');
      await onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setRevoking(null); }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const activeKeys = (site.apiKeys || []).filter((k) => k.is_active);
  const revokedKeys = (site.apiKeys || []).filter((k) => !k.is_active);

  return (
    <div>
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>API-nokler</h2>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: '2px 0 0' }}>
            Nokler for a autentisere chat-widgeten mot dette nettstedet.
          </p>
        </div>
        {generateConfirm ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: colors.text }}>Generer ny nokkel?</span>
            <button onClick={handleGenerate} disabled={generating} style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>
              {generating ? '...' : 'Bekreft'}
            </button>
            <button onClick={() => setGenerateConfirm(false)} style={{ ...btnSecondary, padding: '8px 16px', fontSize: 13 }}>Avbryt</button>
          </div>
        ) : (
          <button onClick={() => setGenerateConfirm(true)} disabled={generating} style={btnPrimary}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2v12M2 8h12" /></svg>
              Ny API-nokkel
            </span>
          </button>
        )}
      </div>

      {/* Newly generated key banner */}
      {newKey && (
        <div style={{
          ...cardStyle, background: colors.blueBg, border: `1px solid #bfdbfe`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: '0 0 4px' }}>Ny API-nokkel opprettet</h3>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Kopier nokkelen na. Den vises ikke igjen.</p>
            </div>
            <button onClick={() => setNewKey(null)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <code style={{
              flex: 1, padding: '10px 14px', backgroundColor: colors.white, borderRadius: 8,
              fontSize: 13: 'SF Mono, Menlo, monospace', color: colors.text,
              wordBreak: 'break-all', border: `1px solid ${colors.border}`,
            }}>{newKey}</code>
            <button onClick={copyKey} style={{ ...btnPrimary, whiteSpace: 'nowrap' }}>
              {copiedKey ? 'Kopiert' : 'Kopier'}
            </button>
          </div>
        </div>
      )}

      {/* Active keys */}
      {activeKeys.length === 0 && !newKey ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.borderLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: colors.text, marginBottom: 4 }}>Ingen aktive API-nokler</div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>Opprett en API-nokkel for a aktivere chat-widgeten.</div>
        </div>
      ) : (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: '0 0 14px' }}>Aktive nokler ({activeKeys.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Nokkelprefix</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Navn</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Opprettet</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>Sist brukt</th>
                <th style={{ padding: '8px 12px', width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {activeKeys.map((k, i) => (
                <tr key={k.id} style={{ borderBottom: i < activeKeys.length - 1 ? `1px solid ${colors.borderLight}` : 'none' }}>
                  <td style={{ padding: '12px', fontSize: 13: 'SF Mono, Menlo, monospace', color: colors.text }}>{k.key_prefix}...</td>
                  <td style={{ padding: '12px', fontSize: 13, color: colors.text }}>{k.name}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: colors.textMuted }}>{new Date(k.created_at).toLocaleDateString('nb-NO')}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: colors.textMuted }}>{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('nb-NO') : 'Aldri'}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {revokeConfirm === k.id ? (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => handleRevoke(k.id)} disabled={revoking === k.id} style={{ ...btnDanger, backgroundColor: colors.danger, color: colors.white, border: 'none' }}>
                          {revoking === k.id ? '...' : 'Bekreft'}
                        </button>
                        <button onClick={() => setRevokeConfirm(null)} style={{ ...btnDanger, color: colors.textMuted }}>Avbryt</button>
                      </div>
                    ) : (
                      <button onClick={() => setRevokeConfirm(k.id)} style={btnDanger}>Deaktiver</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div style={{ ...cardStyle, opacity: 0.6 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted, margin: '0 0 12px' }}>Deaktiverte nokler ({revokedKeys.length})</h3>
          {revokedKeys.map((k) => (
            <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.borderLight}`, fontSize: 13, color: colors.textMuted }}>
              <span style={{ fontFamily: 'SF Mono, Menlo, monospace' }}>{k.key_prefix}...</span>
              <span>Deaktivert</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab: Statistikk
// ═══════════════════════════════════════════════════════
function StatsTab({ siteId, site }: { siteId: string; site: Site }) {
  const [stats, setStats] = useState<{
    conversations: number; messages: number; avgMessages: number;
    lastActive: string | null; totalTokens: number; apiCalls: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: convos, count: convCount } = await supabase
          .from('conversations')
          .select('id, started_at', { count: 'exact' })
          .eq('site_id', siteId)
          .order('started_at', { ascending: false });

        const conversations = convCount || 0;
        const convIds = (convos || []).map((c: any) => c.id);
        let messages = 0;
        if (convIds.length > 0) {
          const { count: msgCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', convIds);
          messages = msgCount || 0;
        }

        // Usage logs for tokens and API calls
        let totalTokens = 0;
        let apiCalls = 0;
        try {
          const { data: usageLogs } = await supabase
            .from('usage_logs')
            .select('action_type, tokens_used')
            .eq('site_id', siteId);
          if (usageLogs) {
            totalTokens = usageLogs.reduce((sum: number, l: any) => sum + (l.tokens_used || 0), 0);
            apiCalls = usageLogs.filter((l: any) => l.action_type === 'api_call' || l.action_type === 'chat_message').length;
          }
        } catch {} // Usage logs might not have data yet

        const avgMessages = conversations > 0 ? Math.round((messages / conversations) * 10) / 10 : 0;
        const lastActive = convos && convos.length > 0 ? convos[0].started_at : null;
        setStats({ conversations, messages, avgMessages, lastActive, totalTokens, apiCalls });
      } catch {
        setStats({ conversations: site.stats?.conversations || 0, messages: site.stats?.messages || 0, avgMessages: 0, lastActive: null, totalTokens: 0, apiCalls: 0 });
      } finally { setLoading(false); }
    };
    fetchStats();
  }, [siteId, site]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: `3px solid ${colors.border}`, borderTopColor: colors.blue, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Samtaler', value: stats?.conversations ?? 0,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
      iconBg: colors.blueBg,
    },
    {
      label: 'Meldinger', value: stats?.messages ?? 0,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>,
      iconBg: '#f5f3ff',
    },
    {
      label: 'Snitt meldinger', value: stats?.avgMessages ?? 0,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
      iconBg: colors.successBg,
    },
    {
      label: 'Tokens brukt', value: stats?.totalTokens ? stats.totalTokens.toLocaleString('nb-NO') : '0',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
      iconBg: colors.warningBg,
    },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 20px' }}>Statistikk</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        {statCards.map((sc) => (
          <div key={sc.label} style={cardStyle}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: sc.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {sc.icon}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.text, marginBottom: 2, letterSpacing: '-0.02em' }}>{sc.value}</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>{sc.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Siste aktivitet</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
            {stats?.lastActive
              ? new Date(stats.lastActive).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Ingen aktivitet enna'}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kunnskapskilder</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{site.stats?.knowledgeSources ?? 0}</div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>opplastede kilder</div>
        </div>
      </div>
    </div>
  );
}
