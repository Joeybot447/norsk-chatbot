'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../_lib/supabase/client';
import { useAuth } from '../../../_lib/supabase/hooks';

// ── Design tokens ──
const presetColors = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#ea580c', '#d97706', '#db2777', '#0891b2'];

const tabs = [
  { key: 'general', label: 'Generelt' },
  { key: 'knowledge', label: 'Kunnskapsbase' },
  { key: 'ai-settings', label: 'AI-innstillinger' },
  { key: 'widget', label: 'Widget' },
  { key: 'api-keys', label: 'API-nøkler' },
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
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <div className="text-red-600 text-[15px] font-medium mb-4">{error || 'Nettsted ikke funnet'}</div>
        <button onClick={() => router.push('/dashboard/sites')} className="px-5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg cursor-pointer text-sm font-medium">
          Tilbake til nettsteder
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4">
        <button
          onClick={() => router.push('/dashboard/sites')}
          className="bg-transparent border-none text-blue-600 cursor-pointer text-sm p-0 mb-1.5 flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Tilbake til nettsteder
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{site.name}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            site.is_active ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {site.is_active ? 'Aktiv' : 'Inaktiv'}
          </span>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="bg-green-50 text-green-600 px-4 md:px-8 py-2.5 text-sm font-medium border-b border-green-200 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 flex gap-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 md:px-5 py-3.5 text-sm bg-transparent border-none cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'font-semibold text-blue-600 border-b-2 border-blue-600'
                : 'font-normal text-slate-500 border-b-2 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-7 max-w-[900px]">
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

// ═════════════════════════════════════════════════════
// Tab: Generelt
// ═════════════════════════════════════════════════════
function GeneralTab({ site, onSave, saving }: { site: Site; onSave: (u: any) => Promise<void>; saving: boolean }) {
  const [name, setName] = useState(site.name || '');
  const [domain, setDomain] = useState(site.domain || '');
  const [botName, setBotName] = useState(site.bot_name || '');
  const [welcomeMsg, setWelcomeMsg] = useState(site.welcome_message || '');
  const [isActive, setIsActive] = useState(site.is_active);

  return (
    <div className="bg-white border border-slate-200 rounded-[14px] p-5 md:p-6 mb-5">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Generelle innstillinger</h2>

      <div className="mb-5">
        <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Nettstedsnavn</label>
        <input className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 transition-colors" value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Min Bedrift" />
      </div>

      <div className="mb-5">
        <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Domene</label>
        <input className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 transition-colors" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="https://eksempel.no" />
      </div>

      <div className="mb-5">
        <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Bot-navn</label>
        <input className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 transition-colors" value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="NorskBot" />
        <p className="text-xs text-slate-500 mt-1">Navnet som vises i chat-vinduet til besokende.</p>
      </div>

      <div className="mb-5">
        <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Velkomstmelding</label>
        <textarea
          value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)}
          placeholder="Hei! Hvordan kan jeg hjelpe deg?"
          rows={3}
          className="w-full px-3 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 resize-y transition-colors"
        />
      </div>

      <div className="mb-5 flex items-center gap-3">
        <label className="text-[13px] font-semibold text-slate-900">Status</label>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`w-12 h-[26px] rounded-[13px] border-none cursor-pointer relative transition-colors ${
            isActive ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span className={`absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-[left] ${
            isActive ? 'left-[25px]' : 'left-[3px]'
          }`} />
        </button>
        <span className={`text-[13px] ${isActive ? 'text-green-600' : 'text-slate-500'}`}>{isActive ? 'Aktiv' : 'Inaktiv'}</span>
      </div>

      <button
        onClick={() => onSave({ name, domain, bot_name: botName, welcome_message: welcomeMsg, is_active: isActive })}
        disabled={saving}
        className={`w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-medium text-sm transition-all ${saving ? 'opacity-70' : 'hover:bg-blue-700'}`}
      >
        {saving ? 'Lagrer...' : 'Lagre endringer'}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════
// Tab: AI-innstillinger
// ═════════════════════════════════════════════════════
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
  const inputCls = "w-full h-11 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 transition-colors";
  const cardCls = "bg-white border border-slate-200 rounded-[14px] p-5 md:p-6 mb-5";

  return (
    <div>
      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Systeminstruks</h2>
        <p className="text-[13px] text-slate-500 mb-4">Tilpassede instruksjoner for hvordan chatboten skal oppfore seg.</p>
        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Systemprompt</label>
          <textarea
            value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={placeholderPrompt} rows={4}
            className="w-full px-3 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 resize-y transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1.5">Hvis tomt brukes standard: &quot;{placeholderPrompt}&quot;</p>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Svarstil</h2>
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-1 min-w-0 mb-5">
            <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className={inputCls + " cursor-pointer"}>
              {toneOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-0 mb-5">
            <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Svarlengde</label>
            <select value={responseLength} onChange={(e) => setResponseLength(e.target.value)} className={inputCls + " cursor-pointer"}>
              {lengthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Kreativitet (temperatur)</h2>
        <p className="text-[13px] text-slate-500 mb-4">Lavere verdi gir mer fokuserte svar. Hoyere verdi gir mer kreative svar.</p>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-slate-500 min-w-[50px]">Fokusert</span>
          <input type="range" min="0" max="1" step="0.05" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="flex-1 accent-blue-600 cursor-pointer" />
          <span className="text-[13px] text-slate-500 min-w-[50px] text-right">Kreativ</span>
        </div>
        <div className="text-center mt-2.5">
          <span className="inline-block px-3.5 py-1 bg-blue-50 rounded-md text-sm font-semibold text-blue-600 font-mono">
            {temperature.toFixed(2)}
          </span>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Maks svarlengde</h2>
        <p className="text-[13px] text-slate-500 mb-4">Begrenser hvor langt hvert svar kan bli. 1 token er ca. 4 tegn.</p>
        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Maks tokens</label>
          <input type="number" min={100} max={2000} step={50} value={maxTokens}
            onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setMaxTokens(Math.max(100, Math.min(2000, v))); }}
            className="w-full sm:w-40 h-11 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1.5">Standardverdi: 500. Tillatt: 100 til 2000.</p>
        </div>
      </div>

      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Vis kilder</h2>
            <p className="text-[13px] text-slate-500">Om chatboten skal vise referanser til kunnskapsbasen.</p>
          </div>
          <button
            onClick={() => setIncludeSources(!includeSources)}
            className={`w-12 h-[26px] rounded-[13px] border-none cursor-pointer relative transition-colors shrink-0 ${
              includeSources ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span className={`absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-[left] ${
              includeSources ? 'left-[25px]' : 'left-[3px]'
            }`} />
          </button>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Reservemelding</h2>
        <p className="text-[13px] text-slate-500 mb-4">Meldingen som vises nar chatboten ikke finner relevante svar.</p>
        <div className="mb-5">
          <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Reservemelding</label>
          <input className={inputCls} value={fallbackMessage} onChange={(e) => setFallbackMessage(e.target.value)} placeholder="Beklager, jeg fant ikke svar..." />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className={`w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-medium text-sm transition-all ${saving ? 'opacity-70' : 'hover:bg-blue-700'}`}>
        {saving ? 'Lagrer...' : 'Lagre AI-innstillinger'}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════
// Tab: Kunnskapsbase
// ═════════════════════════════════════════════════════
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
      if (res.ok) { const data = await res.json(); setSources(data.sources || []); }
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
      fd.append('file', file); fd.append('siteId', siteId); fd.append('title', file.name);
      const res = await fetch('/api/ingest', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Opplasting feilet'); }
      await fetchSources();
    } catch (err: any) { alert(err.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDelete = async (sourceId: string) => {
    setDeleting(sourceId); setDeleteConfirm(null);
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
          if (poll.status === 'processing') { setScrapeStatus(poll.progressText || `Skanner... (${poll.chunksCreated || 0} deler opprettet)`); }
          else if (poll.status === 'ready') { setScrapeResult({ chunksCreated: poll.chunksCreated || 0 }); setScrapeStatus(null); setScrapeUrl(''); await fetchSources(); done = true; }
          else if (poll.status === 'error') { throw new Error('Skanning feilet. Sjekk nettadressen.'); }
        } catch (pollErr: any) { if (pollErr.message.includes('feilet')) throw pollErr; }
      }
      if (!done) throw new Error('Skanning tok for lang tid.');
    } catch (err: any) { setScrapeError(err.message); setScrapeStatus(null); }
    finally { setScraping(false); }
  };

  const typeBadge = (type: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      document: { label: 'PDF', cls: 'bg-amber-50 text-amber-800' },
      text: { label: 'Tekst', cls: 'bg-blue-50 text-blue-800' },
      webpage: { label: 'URL', cls: 'bg-indigo-50 text-indigo-800' },
      csv: { label: 'CSV', cls: 'bg-green-50 text-green-800' },
      faq: { label: 'FAQ', cls: 'bg-pink-50 text-pink-800' },
    };
    const m = map[type] || { label: type.toUpperCase(), cls: 'bg-slate-100 text-slate-600' };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${m.cls}`}>{m.label}</span>;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      ready: { label: 'Klar', cls: 'bg-green-50 text-green-600' },
      processing: { label: 'Behandler', cls: 'bg-amber-50 text-amber-800' },
      error: { label: 'Feil', cls: 'bg-red-50 text-red-600' },
      pending: { label: 'Venter', cls: 'bg-slate-100 text-slate-500' },
    };
    const m = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${m.cls}`}>{m.label}</span>;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '\u2014';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const cardCls = "bg-white border border-slate-200 rounded-[14px] p-5 md:p-6 mb-5";
  const inputCls = "w-full h-11 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 transition-colors";
  const btnPrimary = "px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-medium text-sm hover:bg-blue-700 transition-colors";
  const btnSecondary = "px-5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg cursor-pointer font-medium text-sm hover:bg-slate-50 transition-colors";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="w-6 h-6 rounded-full border-[3px] border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* URL Scrape */}
      <div className={cardCls}>
        <h3 className="text-base font-semibold text-slate-900 mb-1">Importer fra nettside</h3>
        <p className="text-[13px] text-slate-500 mb-3.5">Skann en nettside og importer innholdet automatisk.</p>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Nettadresse</label>
            <input className={inputCls} value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} placeholder="https://dinbedrift.no" disabled={scraping} onKeyDown={(e) => { if (e.key === 'Enter' && !scraping) handleScrape(); }} />
          </div>
          <button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()} className={`${btnPrimary} whitespace-nowrap w-full sm:w-auto ${(scraping || !scrapeUrl.trim()) ? 'opacity-60' : ''}`}>
            {scraping ? 'Skanner...' : 'Skann nettside'}
          </button>
        </div>
        {scrapeStatus && <div className="mt-3 p-2.5 bg-blue-50 rounded-lg text-[13px] text-blue-600 font-medium">{scrapeStatus}</div>}
        {scrapeError && <div className="mt-3 p-2.5 bg-red-50 rounded-lg text-[13px] text-red-600 font-medium">{scrapeError}</div>}
        {scrapeResult && <div className="mt-3 p-2.5 bg-green-50 rounded-lg text-[13px] text-green-600 font-medium">Ferdig — {scrapeResult.chunksCreated} kunnskapsdeler opprettet.</div>}
      </div>

      {/* Header with actions */}
      <div className={`${cardCls} flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3`}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Kunnskapsbase</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">{sources.length} {sources.length === 1 ? 'kilde' : 'kilder'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={() => setShowTextForm(!showTextForm)} className={`${btnSecondary} flex items-center justify-center gap-1.5 w-full sm:w-auto`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2v12M2 8h12" /></svg>
            Legg til tekst
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className={`${btnPrimary} flex items-center justify-center gap-1.5 w-full sm:w-auto ${uploading ? 'opacity-60' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
            {uploading ? 'Laster opp...' : 'Last opp fil'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.md,.csv" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* Text form */}
      {showTextForm && (
        <div className={cardCls}>
          <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Legg til tekstinnhold</h3>
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Tittel</label>
            <input className={inputCls} value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="F.eks. Apningstider" />
          </div>
          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">Innhold</label>
            <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Skriv eller lim inn teksten her..." rows={6}
              className="w-full px-3 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 resize-y transition-colors" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={handleTextSubmit} disabled={submittingText || !textTitle.trim() || !textContent.trim()} className={`${btnPrimary} w-full sm:w-auto ${submittingText ? 'opacity-60' : ''}`}>
              {submittingText ? 'Lagrer...' : 'Lagre tekst'}
            </button>
            <button onClick={() => { setShowTextForm(false); setTextTitle(''); setTextContent(''); }} className={`${btnSecondary} w-full sm:w-auto`}>Avbryt</button>
          </div>
        </div>
      )}

      {/* Sources list */}
      {sources.length === 0 ? (
        <div className={`${cardCls} text-center py-14 px-6`}>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="text-[15px] font-semibold text-slate-900 mb-1.5">Ingen kunnskapskilder enna</div>
          <div className="text-[13px] text-slate-500 leading-relaxed">
            Last opp dokumenter eller legg til tekst for å trene chatboten din.
          </div>
        </div>
      ) : (
        <div className={cardCls}>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-2.5 text-left text-slate-500 text-xs font-semibold">Tittel</th>
                <th className="p-2.5 text-left text-slate-500 text-xs font-semibold">Type</th>
                <th className="p-2.5 text-center text-slate-500 text-xs font-semibold">Deler</th>
                <th className="p-2.5 text-left text-slate-500 text-xs font-semibold">Status</th>
                <th className="p-2.5 text-right text-slate-500 text-xs font-semibold hidden sm:table-cell">Storrelse</th>
                <th className="p-2.5 text-left text-slate-500 text-xs font-semibold hidden md:table-cell">Dato</th>
                <th className="p-2.5 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src, i) => (
                <tr key={src.id} className={i < sources.length - 1 ? 'border-b border-slate-100' : ''}>
                  <td className="p-3 text-sm text-slate-900 font-medium max-w-[200px] truncate">{src.title}</td>
                  <td className="p-3">{typeBadge(src.type)}</td>
                  <td className="p-3 text-center text-sm text-slate-900">{src.chunk_count}</td>
                  <td className="p-3">{statusBadge(src.status)}</td>
                  <td className="p-3 text-right text-[13px] text-slate-500 hidden sm:table-cell">{formatSize(src.file_size)}</td>
                  <td className="p-3 text-[13px] text-slate-500 hidden md:table-cell">{new Date(src.created_at).toLocaleDateString('nb-NO')}</td>
                  <td className="p-3 text-center">
                    {deleteConfirm === src.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(src.id)} disabled={deleting === src.id}
                          className="px-2.5 py-1 bg-red-600 text-white border-none rounded-md cursor-pointer text-xs disabled:opacity-50">
                          {deleting === src.id ? '...' : 'Ja'}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="px-2.5 py-1 bg-transparent text-slate-500 border border-slate-200 rounded-md cursor-pointer text-xs">Nei</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(src.id)}
                        className="px-3 py-1 bg-transparent text-red-600 border border-slate-200 rounded-md cursor-pointer text-xs hover:bg-red-50 transition-colors">Slett</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════
// Tab: Widget
// ═════════════════════════════════════════════════════
function WidgetTab({ site, siteId, onSave, saving }: { site: Site; siteId: string; onSave: (u: any) => Promise<void>; saving: boolean }) {
  const tc = site.theme_config || {};
  const [primaryColor, setPrimaryColor] = useState(tc.primaryColor || '#2563eb');
  const [customHex, setCustomHex] = useState('');
  const [position, setPosition] = useState(tc.position || 'bottom-right');
  const [autoOpenDelay, setAutoOpenDelay] = useState(tc.autoOpenDelay || 0);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const embedCode = `<script src="https://cdn.norskbot.no/widget.js" data-site-id="${siteId}"></script>`;
  const handleSave = () => { onSave({ theme_config: { ...tc, primaryColor, position, autoOpenDelay } }); };
  const copyEmbed = () => { navigator.clipboard.writeText(embedCode).then(() => { setCopiedEmbed(true); setTimeout(() => setCopiedEmbed(false), 2500); }); };

  const cardCls = "bg-white border border-slate-200 rounded-[14px] p-5 md:p-6 mb-5";
  const inputCls = "w-full h-11 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-50 transition-colors";

  return (
    <div>
      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Temafarge</h2>
        <div className="flex gap-2.5 flex-wrap mb-3.5">
          {presetColors.map((c) => (
            <button key={c} onClick={() => setPrimaryColor(c)} className="w-9 h-9 rounded-lg cursor-pointer transition-all" style={{
              backgroundColor: c,
              border: primaryColor === c ? '2px solid #0f172a' : '2px solid #e2e8f0',
            }} title={c} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input className="w-28 h-11 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600 transition-colors" value={customHex} onChange={(e) => setCustomHex(e.target.value)} placeholder="#hex" />
          <button onClick={() => { if (/^#[0-9a-fA-F]{6}$/.test(customHex)) setPrimaryColor(customHex); }} className="px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg cursor-pointer text-sm font-medium hover:bg-slate-50 transition-colors">Bruk</button>
          <div className="w-7 h-7 rounded-md border border-slate-200 shrink-0" style={{ backgroundColor: primaryColor }} />
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Chat-posisjon</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {(['bottom-right', 'bottom-left'] as const).map((pos) => (
            <label key={pos} className="flex items-center gap-2 cursor-pointer text-sm text-slate-900">
              <input type="radio" name="position" checked={position === pos} onChange={() => setPosition(pos)} className="accent-blue-600" />
              {pos === 'bottom-right' ? 'Nederst til hoyre' : 'Nederst til venstre'}
            </label>
          ))}
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Automatisk apning</h2>
        <select value={autoOpenDelay} onChange={(e) => setAutoOpenDelay(Number(e.target.value))} className="w-full sm:w-56 h-11 px-3 border border-slate-200 rounded-lg text-sm cursor-pointer outline-none focus:border-blue-600 transition-colors">
          <option value={0}>Deaktivert</option>
          <option value={3}>Etter 3 sekunder</option>
          <option value={5}>Etter 5 sekunder</option>
          <option value={10}>Etter 10 sekunder</option>
          <option value={30}>Etter 30 sekunder</option>
        </select>
      </div>

      {/* Live preview - hidden on mobile */}
      <div className={`${cardCls} hidden md:block`}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Forhåndsvisning</h2>
        <div className="bg-slate-100 rounded-xl p-6 relative min-h-[280px]">
          <div className="absolute bottom-[70px]" style={{ [position === 'bottom-right' ? 'right' : 'left']: '24px' }}>
            <div className="w-[280px] rounded-[14px] shadow-lg overflow-hidden bg-white">
              <div className="text-white py-3.5 px-4 font-semibold text-sm" style={{ backgroundColor: primaryColor }}>{site.bot_name || 'NorskBot'}</div>
              <div className="p-4">
                <div className="bg-slate-100 rounded-xl rounded-bl-sm px-3.5 py-2.5 text-[13px] text-slate-900 mb-2.5 max-w-[85%]">
                  {site.welcome_message || 'Hei! Hvordan kan jeg hjelpe deg?'}
                </div>
                <div className="flex gap-2">
                  <input readOnly placeholder="Skriv en melding..." className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px]" />
                  <button className="w-9 h-9 rounded-lg border-none text-white cursor-default flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white" style={{ backgroundColor: primaryColor, [position === 'bottom-right' ? 'right' : 'left']: '24px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Embed code */}
      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Innbyggingskode</h2>
        <p className="text-[13px] text-slate-500 mb-3.5">Legg denne koden til i &lt;head&gt; eller &lt;body&gt; pa nettstedet ditt:</p>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <code className="flex-1 block bg-slate-50 px-3.5 py-3 rounded-lg text-xs font-mono text-slate-900 break-all leading-relaxed border border-slate-200">
            {embedCode}
          </code>
          <button onClick={copyEmbed} className="px-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg cursor-pointer text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap w-full sm:w-auto">
            {copiedEmbed ? 'Kopiert' : 'Kopier'}
          </button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className={`w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-medium text-sm transition-all ${saving ? 'opacity-70' : 'hover:bg-blue-700'}`}>
        {saving ? 'Lagrer...' : 'Lagre widget-innstillinger'}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════
// Tab: API-nøkler
// ═════════════════════════════════════════════════════
function ApiKeysTab({ site, siteId, getAccessToken, onRefresh }: { site: Site; siteId: string; getAccessToken: () => Promise<string | null>; onRefresh: () => Promise<void> }) {
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
  const [generateConfirm, setGenerateConfirm] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true); setGenerateConfirm(false);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/sites/' + siteId + '/api-keys', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'API-nøkkel' }),
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Kunne ikke opprette nøkkel'); }
      const data = await res.json();
      setNewKey(data.key);
      await onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setGenerating(false); }
  };

  const handleRevoke = async (keyId: string) => {
    setRevoking(keyId); setRevokeConfirm(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/sites/' + siteId + '/api-keys', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      if (!res.ok) throw new Error('Kunne ikke deaktivere nøkkel');
      await onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setRevoking(null); }
  };

  const copyKey = () => {
    if (newKey) { navigator.clipboard.writeText(newKey); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2500); }
  };

  const activeKeys = (site.apiKeys || []).filter((k) => k.is_active);
  const revokedKeys = (site.apiKeys || []).filter((k) => !k.is_active);
  const cardCls = "bg-white border border-slate-200 rounded-[14px] p-5 md:p-6 mb-5";
  const btnPrimary = "px-5 py-2.5 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-medium text-sm hover:bg-blue-700 transition-colors";
  const btnSecondary = "px-5 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg cursor-pointer font-medium text-sm hover:bg-slate-50 transition-colors";

  return (
    <div>
      <div className={`${cardCls} flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3`}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">API-nøkler</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Nøkler for å autentisere chat-widgeten mot dette nettstedet.</p>
        </div>
        {generateConfirm ? (
          <div className="flex gap-2 items-center">
            <span className="text-[13px] text-slate-900">Generer ny nøkkel?</span>
            <button onClick={handleGenerate} disabled={generating} className={`${btnPrimary} py-2 px-4 text-[13px]`}>{generating ? '...' : 'Bekreft'}</button>
            <button onClick={() => setGenerateConfirm(false)} className={`${btnSecondary} py-2 px-4 text-[13px]`}>Avbryt</button>
          </div>
        ) : (
          <button onClick={() => setGenerateConfirm(true)} disabled={generating} className={`${btnPrimary} flex items-center gap-1.5 w-full sm:w-auto justify-center`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 2v12M2 8h12" /></svg>
            Ny API-nøkkel
          </button>
        )}
      </div>

      {/* Newly generated key banner */}
      {newKey && (
        <div className={`${cardCls} bg-blue-50 border-blue-200`}>
          <div className="flex justify-between items-start gap-3 mb-3">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Ny API-nøkkel opprettet</h3>
              <p className="text-[13px] text-slate-500">Kopier nøkkelen nå. Den vises ikke igjen.</p>
            </div>
            <button onClick={() => setNewKey(null)} className="bg-transparent border-none text-slate-500 cursor-pointer text-lg p-0 leading-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 px-3.5 py-2.5 bg-white rounded-lg text-[13px] font-mono text-slate-900 break-all border border-slate-200">{newKey}</code>
            <button onClick={copyKey} className={`${btnPrimary} whitespace-nowrap w-full sm:w-auto`}>{copiedKey ? 'Kopiert' : 'Kopier'}</button>
          </div>
        </div>
      )}

      {/* Active keys */}
      {activeKeys.length === 0 && !newKey ? (
        <div className={`${cardCls} text-center py-12 px-6`}>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <div className="text-[15px] font-medium text-slate-900 mb-1">Ingen aktive API-nøkler</div>
          <div className="text-[13px] text-slate-500">Opprett en API-nøkkel for å aktivere chat-widgeten.</div>
        </div>
      ) : (
        <div className={cardCls}>
          <h3 className="text-[15px] font-semibold text-slate-900 mb-3.5">Aktive nøkler ({activeKeys.length})</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-2 text-left text-slate-500 text-xs font-semibold">Nøkkelprefix</th>
                <th className="p-2 text-left text-slate-500 text-xs font-semibold hidden sm:table-cell">Navn</th>
                <th className="p-2 text-left text-slate-500 text-xs font-semibold hidden sm:table-cell">Opprettet</th>
                <th className="p-2 text-left text-slate-500 text-xs font-semibold hidden md:table-cell">Sist brukt</th>
                <th className="p-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {activeKeys.map((k, i) => (
                <tr key={k.id} className={i < activeKeys.length - 1 ? 'border-b border-slate-100' : ''}>
                  <td className="p-3 text-[13px] font-mono text-slate-900">{k.key_prefix}...</td>
                  <td className="p-3 text-[13px] text-slate-900 hidden sm:table-cell">{k.name}</td>
                  <td className="p-3 text-[13px] text-slate-500 hidden sm:table-cell">{new Date(k.created_at).toLocaleDateString('nb-NO')}</td>
                  <td className="p-3 text-[13px] text-slate-500 hidden md:table-cell">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('nb-NO') : 'Aldri'}</td>
                  <td className="p-3 text-right">
                    {revokeConfirm === k.id ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleRevoke(k.id)} disabled={revoking === k.id} className="px-2.5 py-1 bg-red-600 text-white border-none rounded-md cursor-pointer text-xs">{revoking === k.id ? '...' : 'Bekreft'}</button>
                        <button onClick={() => setRevokeConfirm(null)} className="px-2.5 py-1 bg-transparent text-slate-500 border border-slate-200 rounded-md cursor-pointer text-xs">Avbryt</button>
                      </div>
                    ) : (
                      <button onClick={() => setRevokeConfirm(k.id)} className="px-3 py-1 bg-transparent text-red-600 border border-slate-200 rounded-md cursor-pointer text-xs hover:bg-red-50 transition-colors">Deaktiver</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div className={`${cardCls} opacity-60`}>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">Deaktiverte nøkler ({revokedKeys.length})</h3>
          {revokedKeys.map((k) => (
            <div key={k.id} className="flex justify-between py-2 border-b border-slate-100 text-[13px] text-slate-500">
              <span className="font-mono">{k.key_prefix}...</span>
              <span>Deaktivert</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════
// Tab: Statistikk
// ═════════════════════════════════════════════════════
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
        } catch {}

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
      <div className="flex items-center justify-center p-10">
        <div className="w-6 h-6 rounded-full border-[3px] border-slate-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  const cardCls = "bg-white border border-slate-200 rounded-[14px] p-5 md:p-6 mb-5";

  const statCards = [
    { label: 'Samtaler', value: stats?.conversations ?? 0, iconBg: 'bg-blue-50', iconColor: '#2563eb', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { label: 'Meldinger', value: stats?.messages ?? 0, iconBg: 'bg-violet-50', iconColor: '#7c3aed', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg> },
    { label: 'Snitt meldinger', value: stats?.avgMessages ?? 0, iconBg: 'bg-green-50', iconColor: '#059669', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg> },
    { label: 'Tokens brukt', value: stats?.totalTokens ? stats.totalTokens.toLocaleString('nb-NO') : '0', iconBg: 'bg-amber-50', iconColor: '#d97706', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-5">Statistikk</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {statCards.map((sc) => (
          <div key={sc.label} className={cardCls}>
            <div className={`w-10 h-10 rounded-[10px] ${sc.iconBg} flex items-center justify-center mb-3`}>
              {sc.icon}
            </div>
            <div className="text-2xl md:text-[28px] font-bold text-slate-900 mb-0.5 tracking-tight">{sc.value}</div>
            <div className="text-[13px] text-slate-500">{sc.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={cardCls}>
          <div className="text-[13px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Siste aktivitet</div>
          <div className="text-base font-semibold text-slate-900">
            {stats?.lastActive
              ? new Date(stats.lastActive).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Ingen aktivitet enna'}
          </div>
        </div>
        <div className={cardCls}>
          <div className="text-[13px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Kunnskapskilder</div>
          <div className="text-2xl md:text-[28px] font-bold text-slate-900">{site.stats?.knowledgeSources ?? 0}</div>
          <div className="text-[13px] text-slate-500">opplastede kilder</div>
        </div>
      </div>
    </div>
  );
}
