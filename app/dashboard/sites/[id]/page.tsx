'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../_lib/supabase/client';
import { useAuth } from '../../../_lib/supabase/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Slider } from '../../../components/ui/slider';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import {
  ArrowLeft, Check, Plus, Upload, Trash2, Key, Copy, MessageSquare, BarChart3, Settings, Globe, BookOpen, Palette,
} from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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

const presetColors = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#ea580c', '#d97706', '#db2777', '#0891b2'];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
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
      const res = await fetch('/api/sites/' + siteId, { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Kunne ikke laste nettstedet'); }
      setSite(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [siteId, getAccessToken]);

  useEffect(() => { if (user && siteId) fetchSite(); }, [user, siteId, fetchSite]);

  const patchSite = async (updates: Record<string, any>) => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/sites/' + siteId, { method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Kunne ikke lagre'); }
      const updated = await res.json();
      setSite((prev) => (prev ? { ...prev, ...updated } : prev));
      setSuccessMsg('Endringer lagret');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <p className="text-base text-red-600 font-medium mb-4">{error || 'Nettsted ikke funnet'}</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/sites')}>Tilbake til nettsteder</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <Link href="/dashboard/sites" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors mb-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          Tilbake til nettsteder
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{site.name}</h1>
          <Badge className={site.is_active ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50' : 'bg-slate-100 text-slate-500 hover:bg-slate-100'}>
            {site.is_active ? 'Aktiv' : 'Inaktiv'}
          </Badge>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-2.5 flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="bg-white border-b border-slate-200 px-6">
          <TabsList className="h-auto bg-transparent p-0 gap-0">
            {[
              { key: 'general', label: 'Generelt', icon: Settings },
              { key: 'knowledge', label: 'Kunnskapsbase', icon: BookOpen },
              { key: 'ai-settings', label: 'AI-innstillinger', icon: MessageSquare },
              { key: 'widget', label: 'Widget', icon: Palette },
              { key: 'api-keys', label: 'API-nokler', icon: Key },
              { key: 'stats', label: 'Statistikk', icon: BarChart3 },
            ].map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-5 py-3.5 text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="p-6 max-w-[900px]">
          <TabsContent value="general"><GeneralTab site={site} onSave={patchSite} saving={saving} /></TabsContent>
          <TabsContent value="knowledge"><KnowledgeTab siteId={siteId} getAccessToken={getAccessToken} /></TabsContent>
          <TabsContent value="ai-settings"><AISettingsTab site={site} onSave={patchSite} saving={saving} /></TabsContent>
          <TabsContent value="widget"><WidgetTab site={site} siteId={siteId} onSave={patchSite} saving={saving} /></TabsContent>
          <TabsContent value="api-keys"><ApiKeysTab site={site} siteId={siteId} getAccessToken={getAccessToken} onRefresh={fetchSite} /></TabsContent>
          <TabsContent value="stats"><StatsTab siteId={siteId} site={site} /></TabsContent>
        </div>
      </Tabs>
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
    <Card>
      <CardHeader>
        <CardTitle>Generelle innstillinger</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-6 space-y-5">
        <div>
          <Label className="mb-1.5">Nettstedsnavn</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Min Bedrift" />
        </div>
        <div>
          <Label className="mb-1.5">Domene</Label>
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="https://eksempel.no" />
        </div>
        <div>
          <Label className="mb-1.5">Bot-navn</Label>
          <Input value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="NorskBot" />
          <p className="text-xs text-slate-400 mt-1">Navnet som vises i chat-vinduet til besokende.</p>
        </div>
        <div>
          <Label className="mb-1.5">Velkomstmelding</Label>
          <Textarea value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)} placeholder="Hei! Hvordan kan jeg hjelpe deg?" rows={3} />
        </div>
        <div className="flex items-center gap-3">
          <Label>Status</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <span className={`text-sm ${isActive ? 'text-green-600' : 'text-slate-500'}`}>{isActive ? 'Aktiv' : 'Inaktiv'}</span>
        </div>
        <Button onClick={() => onSave({ name, domain, bot_name: botName, welcome_message: welcomeMsg, is_active: isActive })} disabled={saving}>
          {saving ? 'Lagrer...' : 'Lagre endringer'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════
// Tab: AI-innstillinger
// ═══════════════════════════════════════════════════════
function AISettingsTab({ site, onSave, saving }: { site: Site; onSave: (u: any) => Promise<void>; saving: boolean }) {
  const defaults: BotConfig = { system_prompt: '', tone: 'vennlig', response_length: 'medium', temperature: 0.7, include_sources: true, fallback_message: 'Beklager, jeg fant ikke svar pa det. Kontakt oss direkte for hjelp.', max_tokens: 500 };
  const bc = site.bot_config || defaults;
  const [systemPrompt, setSystemPrompt] = useState(bc.system_prompt || '');
  const [tone, setTone] = useState(bc.tone || defaults.tone);
  const [responseLength, setResponseLength] = useState(bc.response_length || defaults.response_length);
  const [temperature, setTemperature] = useState(bc.temperature ?? defaults.temperature);
  const [includeSources, setIncludeSources] = useState(bc.include_sources ?? defaults.include_sources);
  const [fallbackMessage, setFallbackMessage] = useState(bc.fallback_message || defaults.fallback_message);
  const [maxTokens, setMaxTokens] = useState(bc.max_tokens || defaults.max_tokens);

  const handleSave = () => {
    onSave({ bot_config: { system_prompt: systemPrompt, tone, response_length: responseLength, temperature, include_sources: includeSources, fallback_message: fallbackMessage, max_tokens: maxTokens } });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Systeminstruks</CardTitle>
          <CardDescription>Tilpassede instruksjoner for hvordan chatboten skal oppfore seg.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <Label className="mb-1.5">Systemprompt</Label>
          <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder={`Du er en hjelpsom assistent for ${site.name}. Svar pa norsk.`} rows={4} />
          <p className="text-xs text-slate-400 mt-1.5">Hvis tomt brukes standard systemprompt.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Svarstil</CardTitle></CardHeader>
        <Separator />
        <CardContent className="p-6 flex gap-5 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label className="mb-1.5">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="profesjonell">Profesjonell</SelectItem>
                <SelectItem value="vennlig">Vennlig</SelectItem>
                <SelectItem value="uformell">Uformell</SelectItem>
                <SelectItem value="teknisk">Teknisk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label className="mb-1.5">Svarlengde</Label>
            <Select value={responseLength} onValueChange={setResponseLength}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kort">Kort</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="detaljert">Detaljert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kreativitet (temperatur)</CardTitle>
          <CardDescription>Lavere verdi gir mer fokuserte svar. Hoyere verdi gir mer kreative svar.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 min-w-[50px]">Fokusert</span>
            <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={0} max={1} step={0.05} className="flex-1" />
            <span className="text-sm text-slate-500 min-w-[50px] text-right">Kreativ</span>
          </div>
          <div className="text-center mt-3">
            <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50 font-mono text-sm">{temperature.toFixed(2)}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maks svarlengde</CardTitle>
          <CardDescription>Begrenser hvor langt hvert svar kan bli. 1 token er ca. 4 tegn.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <Label className="mb-1.5">Maks tokens</Label>
          <Input type="number" min={100} max={2000} step={50} value={maxTokens} onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setMaxTokens(Math.max(100, Math.min(2000, v))); }} className="w-40" />
          <p className="text-xs text-slate-400 mt-1.5">Standardverdi: 500. Tillatt: 100 til 2000.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Vis kilder</h3>
            <p className="text-sm text-slate-500 mt-0.5">Om chatboten skal vise referanser til kunnskapsbasen.</p>
          </div>
          <Switch checked={includeSources} onCheckedChange={setIncludeSources} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservemelding</CardTitle>
          <CardDescription>Meldingen som vises nar chatboten ikke finner relevante svar.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <Label className="mb-1.5">Reservemelding</Label>
          <Input value={fallbackMessage} onChange={(e) => setFallbackMessage(e.target.value)} placeholder="Beklager, jeg fant ikke svar..." />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>{saving ? 'Lagrer...' : 'Lagre AI-innstillinger'}</Button>
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
      const res = await fetch('/api/ingest', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId, title: textTitle, text: textContent, type: 'text' }) });
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
      const res = await fetch('/api/ingest/scrape', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: scrapeUrl, siteId }) });
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
    const map: Record<string, string> = { document: 'PDF', text: 'Tekst', webpage: 'URL', csv: 'CSV', faq: 'FAQ' };
    return <Badge variant="secondary" className="text-[11px]">{map[type] || type.toUpperCase()}</Badge>;
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ready': return <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 text-[11px]">Klar</Badge>;
      case 'processing': return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[11px]">Behandler</Badge>;
      case 'error': return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 text-[11px]">Feil</Badge>;
      default: return <Badge variant="secondary" className="text-[11px]">{status}</Badge>;
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '\u2014';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div className="flex items-center justify-center p-10"><div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* URL Scrape */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importer fra nettside</CardTitle>
          <CardDescription>Skann en nettside og importer innholdet automatisk.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <Label className="mb-1.5">Nettadresse</Label>
              <Input value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} placeholder="https://dinbedrift.no" disabled={scraping} onKeyDown={(e) => { if (e.key === 'Enter' && !scraping) handleScrape(); }} />
            </div>
            <Button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()}>{scraping ? 'Skanner...' : 'Skann nettside'}</Button>
          </div>
          {scrapeStatus && <Card className="mt-3 border-blue-200 bg-blue-50"><CardContent className="p-3 text-sm text-blue-700 font-medium">{scrapeStatus}</CardContent></Card>}
          {scrapeError && <Card className="mt-3 border-red-200 bg-red-50"><CardContent className="p-3 text-sm text-red-700 font-medium">{scrapeError}</CardContent></Card>}
          {scrapeResult && <Card className="mt-3 border-green-200 bg-green-50"><CardContent className="p-3 text-sm text-green-700 font-medium">Ferdig — {scrapeResult.chunksCreated} kunnskapsdeler opprettet.</CardContent></Card>}
        </CardContent>
      </Card>

      {/* Sources header */}
      <Card>
        <CardContent className="p-6 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Kunnskapsbase</h3>
            <p className="text-sm text-slate-500 mt-0.5">{sources.length} {sources.length === 1 ? 'kilde' : 'kilder'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTextForm(!showTextForm)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Legg til tekst
            </Button>
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? 'Laster opp...' : 'Last opp fil'}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.docx,.md,.csv" className="hidden" onChange={handleUpload} />
          </div>
        </CardContent>
      </Card>

      {/* Text form */}
      {showTextForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Legg til tekstinnhold</CardTitle></CardHeader>
          <Separator />
          <CardContent className="p-6 space-y-4">
            <div><Label className="mb-1.5">Tittel</Label><Input value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="F.eks. Apningstider" /></div>
            <div><Label className="mb-1.5">Innhold</Label><Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Skriv eller lim inn teksten her..." rows={6} /></div>
            <div className="flex gap-2">
              <Button onClick={handleTextSubmit} disabled={submittingText || !textTitle.trim() || !textContent.trim()}>{submittingText ? 'Lagrer...' : 'Lagre tekst'}</Button>
              <Button variant="outline" onClick={() => { setShowTextForm(false); setTextTitle(''); setTextContent(''); }}>Avbryt</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sources table */}
      {sources.length === 0 ? (
        <Card>
          <CardContent className="p-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-base font-semibold text-slate-900 mb-1">Ingen kunnskapskilder enna</p>
            <p className="text-sm text-slate-500">Last opp dokumenter eller legg til tekst for a trene chatboten din.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tittel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Deler</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Storrelse</TableHead>
                <TableHead>Dato</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((src) => (
                <TableRow key={src.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{src.title}</TableCell>
                  <TableCell>{typeBadge(src.type)}</TableCell>
                  <TableCell className="text-center">{src.chunk_count}</TableCell>
                  <TableCell>{statusBadge(src.status)}</TableCell>
                  <TableCell className="text-right text-sm text-slate-500">{formatSize(src.file_size)}</TableCell>
                  <TableCell className="text-sm text-slate-500">{new Date(src.created_at).toLocaleDateString('nb-NO')}</TableCell>
                  <TableCell className="text-center">
                    {deleteConfirm === src.id ? (
                      <div className="flex gap-1">
                        <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => handleDelete(src.id)} disabled={deleting === src.id}>{deleting === src.id ? '...' : 'Ja'}</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setDeleteConfirm(null)}>Nei</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirm(src.id)}>Slett</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
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

  const handleSave = () => { onSave({ theme_config: { ...tc, primaryColor, position, autoOpenDelay } }); };

  const copyEmbed = () => { navigator.clipboard.writeText(embedCode).then(() => { setCopiedEmbed(true); setTimeout(() => setCopiedEmbed(false), 2500); }); };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Temafarge</CardTitle></CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="flex gap-2.5 flex-wrap mb-4">
            {presetColors.map((c) => (
              <button key={c} onClick={() => setPrimaryColor(c)} className={`w-9 h-9 rounded-lg cursor-pointer transition-all border-2 ${primaryColor === c ? 'border-slate-900 ring-2 ring-white shadow-md' : 'border-slate-200 hover:scale-105'}`} style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Input value={customHex} onChange={(e) => setCustomHex(e.target.value)} placeholder="#hex" className="w-28" />
            <Button variant="outline" onClick={() => { if (/^#[0-9a-fA-F]{6}$/.test(customHex)) setPrimaryColor(customHex); }}>Bruk</Button>
            <div className="w-7 h-7 rounded-md border border-slate-200 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Chat-posisjon</CardTitle></CardHeader>
        <Separator />
        <CardContent className="p-6 flex gap-6">
          {(['bottom-right', 'bottom-left'] as const).map((pos) => (
            <label key={pos} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="radio" name="position" checked={position === pos} onChange={() => setPosition(pos)} className="accent-blue-600" />
              {pos === 'bottom-right' ? 'Nederst til hoyre' : 'Nederst til venstre'}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Automatisk apning</CardTitle></CardHeader>
        <Separator />
        <CardContent className="p-6">
          <Select value={String(autoOpenDelay)} onValueChange={(v) => setAutoOpenDelay(Number(v))}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Deaktivert</SelectItem>
              <SelectItem value="3">Etter 3 sekunder</SelectItem>
              <SelectItem value="5">Etter 5 sekunder</SelectItem>
              <SelectItem value="10">Etter 10 sekunder</SelectItem>
              <SelectItem value="30">Etter 30 sekunder</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader><CardTitle>Forhandsvisning</CardTitle></CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="bg-slate-100 rounded-xl p-6 relative min-h-[280px]">
            <div className={`absolute ${position === 'bottom-right' ? 'right-6' : 'left-6'} bottom-[70px] w-[280px] rounded-xl shadow-lg overflow-hidden bg-white`}>
              <div className="px-4 py-3 text-white font-semibold text-sm" style={{ backgroundColor: primaryColor }}>{site.bot_name || 'NorskBot'}</div>
              <div className="p-4">
                <div className="bg-slate-100 rounded-xl rounded-bl-sm px-3 py-2.5 text-sm text-slate-900 mb-3 max-w-[85%]">{site.welcome_message || 'Hei! Hvordan kan jeg hjelpe deg?'}</div>
                <div className="flex gap-2">
                  <Input readOnly placeholder="Skriv en melding..." className="h-9 text-sm flex-1" />
                  <Button size="icon" className="h-9 w-9" style={{ backgroundColor: primaryColor }}><ArrowLeft className="h-3.5 w-3.5 rotate-180" /></Button>
                </div>
              </div>
            </div>
            <div className={`absolute ${position === 'bottom-right' ? 'right-6' : 'left-6'} bottom-4 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg`} style={{ backgroundColor: primaryColor }}>
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embed code */}
      <Card>
        <CardHeader>
          <CardTitle>Innbyggingskode</CardTitle>
          <CardDescription>Legg denne koden til i head eller body pa nettstedet ditt.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="flex gap-2 items-stretch">
            <code className="flex-1 block bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs font-mono text-slate-900 break-all leading-relaxed">{embedCode}</code>
            <Button variant="outline" onClick={copyEmbed}>{copiedEmbed ? 'Kopiert' : 'Kopier'}</Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>{saving ? 'Lagrer...' : 'Lagre widget-innstillinger'}</Button>
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
    setGenerating(true); setGenerateConfirm(false);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert');
      const res = await fetch('/api/sites/' + siteId + '/api-keys', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'API-nokkel' }) });
      if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || 'Kunne ikke opprette nokkel'); }
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
      const res = await fetch('/api/sites/' + siteId + '/api-keys', { method: 'DELETE', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ keyId }) });
      if (!res.ok) throw new Error('Kunne ikke deaktivere nokkel');
      await onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setRevoking(null); }
  };

  const copyKey = () => { if (newKey) { navigator.clipboard.writeText(newKey); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2500); } };

  const activeKeys = (site.apiKeys || []).filter((k) => k.is_active);
  const revokedKeys = (site.apiKeys || []).filter((k) => !k.is_active);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-6 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">API-nokler</h3>
            <p className="text-sm text-slate-500 mt-0.5">Nokler for a autentisere chat-widgeten mot dette nettstedet.</p>
          </div>
          {generateConfirm ? (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-slate-700">Generer ny nokkel?</span>
              <Button size="sm" onClick={handleGenerate} disabled={generating}>{generating ? '...' : 'Bekreft'}</Button>
              <Button variant="outline" size="sm" onClick={() => setGenerateConfirm(false)}>Avbryt</Button>
            </div>
          ) : (
            <Button onClick={() => setGenerateConfirm(true)} disabled={generating} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Ny API-nokkel
            </Button>
          )}
        </CardContent>
      </Card>

      {newKey && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start gap-3 mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Ny API-nokkel opprettet</h3>
                <p className="text-sm text-slate-500">Kopier nokkelen na. Den vises ikke igjen.</p>
              </div>
              <button onClick={() => setNewKey(null)} className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer text-lg leading-none">&times;</button>
            </div>
            <div className="flex gap-2">
              <code className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono text-slate-900 break-all">{newKey}</code>
              <Button onClick={copyKey}><Copy className="h-4 w-4 mr-1.5" />{copiedKey ? 'Kopiert' : 'Kopier'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeKeys.length === 0 && !newKey ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Key className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-900 mb-1">Ingen aktive API-nokler</p>
            <p className="text-sm text-slate-500">Opprett en API-nokkel for a aktivere chat-widgeten.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Aktive nokler ({activeKeys.length})</CardTitle></CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nokkelprefix</TableHead>
                <TableHead>Navn</TableHead>
                <TableHead>Opprettet</TableHead>
                <TableHead>Sist brukt</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeKeys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-mono text-sm">{k.key_prefix}...</TableCell>
                  <TableCell>{k.name}</TableCell>
                  <TableCell className="text-sm text-slate-500">{new Date(k.created_at).toLocaleDateString('nb-NO')}</TableCell>
                  <TableCell className="text-sm text-slate-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('nb-NO') : 'Aldri'}</TableCell>
                  <TableCell className="text-right">
                    {revokeConfirm === k.id ? (
                      <div className="flex gap-1 justify-end">
                        <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => handleRevoke(k.id)} disabled={revoking === k.id}>{revoking === k.id ? '...' : 'Bekreft'}</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setRevokeConfirm(null)}>Avbryt</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRevokeConfirm(k.id)}>Deaktiver</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {revokedKeys.length > 0 && (
        <Card className="opacity-60">
          <CardHeader><CardTitle className="text-sm text-slate-500">Deaktiverte nokler ({revokedKeys.length})</CardTitle></CardHeader>
          <CardContent className="p-6 pt-0">
            {revokedKeys.map((k) => (
              <div key={k.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm text-slate-500">
                <span className="font-mono">{k.key_prefix}...</span>
                <span>Deaktivert</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Tab: Statistikk
// ═══════════════════════════════════════════════════════
function StatsTab({ siteId, site }: { siteId: string; site: Site }) {
  const [stats, setStats] = useState<{ conversations: number; messages: number; avgMessages: number; lastActive: string | null; totalTokens: number; apiCalls: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: convos, count: convCount } = await supabase.from('conversations').select('id, started_at', { count: 'exact' }).eq('site_id', siteId).order('started_at', { ascending: false });
        const conversations = convCount || 0;
        const convIds = (convos || []).map((c: any) => c.id);
        let messages = 0;
        if (convIds.length > 0) { const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).in('conversation_id', convIds); messages = msgCount || 0; }
        let totalTokens = 0; let apiCalls = 0;
        try { const { data: usageLogs } = await supabase.from('usage_logs').select('action_type, tokens_used').eq('site_id', siteId); if (usageLogs) { totalTokens = usageLogs.reduce((sum: number, l: any) => sum + (l.tokens_used || 0), 0); apiCalls = usageLogs.filter((l: any) => l.action_type === 'api_call' || l.action_type === 'chat_message').length; } } catch {}
        const avgMessages = conversations > 0 ? Math.round((messages / conversations) * 10) / 10 : 0;
        const lastActive = convos && convos.length > 0 ? convos[0].started_at : null;
        setStats({ conversations, messages, avgMessages, lastActive, totalTokens, apiCalls });
      } catch { setStats({ conversations: site.stats?.conversations || 0, messages: site.stats?.messages || 0, avgMessages: 0, lastActive: null, totalTokens: 0, apiCalls: 0 }); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [siteId, site]);

  if (loading) { return <div className="flex items-center justify-center p-10"><div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>; }

  const statCards = [
    { label: 'Samtaler', value: stats?.conversations ?? 0, icon: MessageSquare, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Meldinger', value: stats?.messages ?? 0, icon: Globe, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { label: 'Snitt meldinger', value: stats?.avgMessages ?? 0, icon: BarChart3, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'Tokens brukt', value: stats?.totalTokens ? stats.totalTokens.toLocaleString('nb-NO') : '0', icon: Settings, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-900">Statistikk</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((sc) => {
          const Icon = sc.icon;
          return (
            <Card key={sc.label}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-lg ${sc.iconBg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${sc.iconColor}`} />
                </div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight mb-0.5">{sc.value}</div>
                <div className="text-sm text-slate-500">{sc.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Siste aktivitet</div>
            <div className="text-base font-semibold text-slate-900">
              {stats?.lastActive
                ? new Date(stats.lastActive).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Ingen aktivitet enna'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kunnskapskilder</div>
            <div className="text-2xl font-bold text-slate-900">{site.stats?.knowledgeSources ?? 0}</div>
            <div className="text-sm text-slate-500">opplastede kilder</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
