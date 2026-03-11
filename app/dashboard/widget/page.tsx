'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Slider } from '../../components/ui/slider';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import {
  Monitor, Tablet, Smartphone, Eye, EyeOff,
  Copy, Check, Save, MessageSquare, Info,
  ChevronDown, Send, Loader2,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────── */

const THEME_COLORS = [
  { name: 'Bla', value: '#2563eb' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Lilla', value: '#7c3aed' },
  { name: 'Rosa', value: '#db2777' },
  { name: 'Rod', value: '#dc2626' },
  { name: 'Oransje', value: '#ea580c' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Gronn', value: '#16a34a' },
];

const AVATAR_OPTIONS = [
  { id: 'initials', label: 'Initialer' },
  { id: 'robot', label: 'Robot' },
  { id: 'headset', label: 'Headset' },
  { id: 'shield', label: 'Skjold' },
];

const DEVICE_WIDTHS = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
} as const;

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface Site {
  id: string;
  name: string;
  domain: string;
  bot_name: string | null;
  welcome_message: string | null;
  theme_config: Record<string, string> | null;
  api_keys: Array<{ key_prefix: string; is_active: boolean }>;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

/* ─────────────────────────────────────────────
   Avatar SVG icons
   ───────────────────────────────────────────── */
function AvatarIcon({ type, size = 20 }: { type: string; size?: number }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'white', strokeWidth: '2',
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };

  if (type === 'robot') {
    return (
      <svg {...props}>
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M12 2v6" />
        <circle cx="9" cy="14" r="1.5" fill="white" stroke="none" />
        <circle cx="15" cy="14" r="1.5" fill="white" stroke="none" />
        <path d="M9 18h6" />
      </svg>
    );
  }
  if (type === 'headset') {
    return (
      <svg {...props}>
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    );
  }
  if (type === 'shield') {
    return (
      <svg {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  return null;
}

function WidgetAvatar({ type, botName, color, size = 36 }: { type: string; botName: string; color: string; size?: number }) {
  const initial = (botName || 'N').charAt(0).toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size, height: size,
        backgroundColor: type === 'initials' ? color : `${color}cc`,
        fontSize: size * 0.4, fontWeight: 700, color: 'white',
      }}
    >
      {type === 'initials' ? initial : <AvatarIcon type={type} size={size * 0.5} />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */
export default function WidgetPage() {
  const { user, loading: authLoading } = useAuth();

  // Data state
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');

  // Config state
  const [botName, setBotName] = useState('NorskBot');
  const [welcomeMessage, setWelcomeMessage] = useState('Hei! Hvordan kan jeg hjelpe deg i dag?');
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [customHex, setCustomHex] = useState('');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [autoOpenDelay, setAutoOpenDelay] = useState(0);
  const [avatarType, setAvatarType] = useState('initials');
  const [widgetEnabled, setWidgetEnabled] = useState(true);

  // UI state
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(true);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  /* ── Load sites ────────────────────────── */
  useEffect(() => {
    if (!user) return;
    const loadSites = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('id, name, domain, bot_name, welcome_message, theme_config, api_keys(key_prefix, is_active)')
          .eq('user_id', user.id);
        if (error) throw error;
        const siteData = (data || []) as Site[];
        setSites(siteData);
        if (siteData.length > 0) {
          applyConfig(siteData[0]);
        }
      } catch {
        /* silently handle */
      } finally {
        setLoading(false);
      }
    };
    loadSites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ── Apply config from site ─────────── */
  const applyConfig = useCallback((site: Site) => {
    setSelectedSiteId(site.id);
    setBotName(site.bot_name || 'NorskBot');
    setWelcomeMessage(site.welcome_message || 'Hei! Hvordan kan jeg hjelpe deg i dag?');
    if (site.theme_config) {
      setThemeColor(site.theme_config.color || site.theme_config.primaryColor || '#2563eb');
      setPosition((site.theme_config.position as 'bottom-right' | 'bottom-left') || 'bottom-right');
      setAutoOpenDelay(Number(site.theme_config.autoOpenDelay) || 0);
      setAvatarType(site.theme_config.avatarType || 'initials');
      setWidgetEnabled(site.theme_config.enabled !== 'false');
    } else {
      setThemeColor('#2563eb');
      setPosition('bottom-right');
      setAutoOpenDelay(0);
      setAvatarType('initials');
      setWidgetEnabled(true);
    }
    setSaveStatus('idle');
  }, []);

  const handleSiteChange = (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    if (site) applyConfig(site);
  };

  /* ── Save config ───────────────────────── */
  const handleSave = async () => {
    if (!selectedSiteId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const { error } = await supabase
        .from('sites')
        .update({
          bot_name: botName,
          welcome_message: welcomeMessage,
          theme_config: {
            color: themeColor,
            position,
            autoOpenDelay: String(autoOpenDelay),
            avatarType,
            enabled: String(widgetEnabled),
          },
        })
        .eq('id', selectedSiteId);
      if (error) throw error;
      setSaveStatus('success');
      setSites((prev) =>
        prev.map((s) =>
          s.id === selectedSiteId
            ? {
                ...s,
                bot_name: botName,
                welcome_message: welcomeMessage,
                theme_config: {
                  color: themeColor,
                  position,
                  autoOpenDelay: String(autoOpenDelay),
                  avatarType,
                  enabled: String(widgetEnabled),
                },
              }
            : s
        )
      );
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Kunne ikke lagre');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } finally {
      setSaving(false);
    }
  };

  /* ── Embed code ────────────────────────── */
  const selectedSite = sites.find((s) => s.id === selectedSiteId);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const activeKey = selectedSite?.api_keys?.find((k) => k.is_active);
  const embedCode = selectedSite
    ? `<script\n  src="${origin}/widget.js"\n  data-site-id="${selectedSite.id}"\n  data-api-key="${activeKey ? activeKey.key_prefix + '...' : 'DIN_API_NOKKEL'}"\n  async>\n</script>`
    : '';

  const handleCopy = () => {
    const code = selectedSite
      ? `<script\n  src="${origin}/widget.js"\n  data-site-id="${selectedSite.id}"\n  data-api-key="DIN_API_NOKKEL"\n  async>\n</script>`
      : '';
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCustomHexApply = () => {
    const hex = customHex.startsWith('#') ? customHex : `#${customHex}`;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setThemeColor(hex);
    }
  };

  /* ── Loading / empty states ────────────── */
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Laster konfigurasjon...</p>
        </div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card px-8 py-5">
          <h1 className="text-xl font-semibold tracking-tight">Widget</h1>
        </div>
        <div className="p-8 flex justify-center">
          <Card className="text-center max-w-md w-full">
            <CardContent className="pt-12 pb-12 px-10">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold mb-2">Ingen nettsteder enda</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Opprett et nettsted for å konfigurere chat-widgeten din.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ── Main render ───────────────────────── */
  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card px-4 md:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">Widget</h1>
              <Badge variant={widgetEnabled ? 'default' : 'secondary'} className="text-xs">
                {widgetEnabled ? 'Aktiv' : 'Deaktivert'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tilpass utseende og installer pa nettstedet ditt
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <Check className="h-4 w-4" />
                Lagret
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-destructive font-medium">{saveError}</span>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lagre endringer
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Site selector */}
        {sites.length > 1 && (
          <div className="px-4 md:px-8 pt-4">
            <Select value={selectedSiteId} onValueChange={handleSiteChange}>
              <SelectTrigger className="max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name} — {site.domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Main content: settings + preview */}
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6 md:gap-8 max-w-[1400px]">
          {/* LEFT: Settings */}
          <div>
            <Tabs defaultValue="utseende" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="utseende">Utseende</TabsTrigger>
                <TabsTrigger value="oppførsel">Oppførsel</TabsTrigger>
                <TabsTrigger value="installasjon">Installasjon</TabsTrigger>
              </TabsList>

              {/* ── Tab: Utseende ──────────────────────── */}
              <TabsContent value="utseende" className="space-y-6">
                {/* Bot name */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Grunnleggende</CardTitle>
                    <CardDescription>Navn og velkomstmelding for chatboten</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="bot-name">Bot-navn</Label>
                      <Input
                        id="bot-name"
                        value={botName}
                        onChange={(e) => setBotName(e.target.value)}
                        placeholder="NorskBot"
                      />
                      <p className="text-xs text-muted-foreground">
                        Vises i overskriften pa chat-vinduet.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="welcome-msg">Velkomstmelding</Label>
                      <Textarea
                        id="welcome-msg"
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        rows={2}
                        placeholder="Hei! Hvordan kan jeg hjelpe deg?"
                      />
                      <p className="text-xs text-muted-foreground">
                        Første melding besokende ser nar de åpner widgeten.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Theme color */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Temafarge</CardTitle>
                    <CardDescription>Velg hovedfarge for widgeten</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ToggleGroup
                      type="single"
                      value={themeColor}
                      onValueChange={(val) => { if (val) setThemeColor(val); }}
                      className="flex flex-wrap gap-2 justify-start"
                    >
                      {THEME_COLORS.map((c) => (
                        <Tooltip key={c.value}>
                          <TooltipTrigger asChild>
                            <ToggleGroupItem
                              value={c.value}
                              className="w-10 h-10 rounded-full p-0 border-2 transition-all data-[state=on]:scale-110"
                              style={{
                                backgroundColor: c.value,
                                borderColor: themeColor === c.value ? c.value : 'transparent',
                                outlineOffset: '2px',
                                outline: themeColor === c.value ? `2px solid ${c.value}` : 'none',
                              }}
                              aria-label={c.name}
                            >
                              {themeColor === c.value && (
                                <Check className="h-4 w-4 text-white" />
                              )}
                            </ToggleGroupItem>
                          </TooltipTrigger>
                          <TooltipContent>{c.name}</TooltipContent>
                        </Tooltip>
                      ))}
                    </ToggleGroup>

                    <Separator />

                    <div className="flex items-center gap-3">
                      <Label htmlFor="custom-hex" className="whitespace-nowrap text-xs text-muted-foreground">
                        Egendefinert
                      </Label>
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-8 h-8 rounded-md border shrink-0"
                          style={{ backgroundColor: themeColor }}
                        />
                        <Input
                          id="custom-hex"
                          value={customHex}
                          onChange={(e) => setCustomHex(e.target.value)}
                          placeholder="#2563eb"
                          className="font-mono text-sm max-w-[140px]"
                          onKeyDown={(e) => { if (e.key === 'Enter') handleCustomHexApply(); }}
                        />
                        <Button variant="outline" size="sm" onClick={handleCustomHexApply}>
                          Bruk
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Avatar type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Ikon</CardTitle>
                    <CardDescription>Velg ikon for chat-boblen og overskriften</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      {AVATAR_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setAvatarType(opt.id)}
                          className={`flex flex-col items-center gap-2.5 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            avatarType === opt.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30 hover:bg-muted/50'
                          }`}
                        >
                          <WidgetAvatar type={opt.id} botName={botName} color={themeColor} size={36} />
                          <span className={`text-xs font-medium ${
                            avatarType === opt.id ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Position */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Posisjon</CardTitle>
                    <CardDescription>Hvor pa siden widgeten vises</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={position} onValueChange={(val) => setPosition(val as 'bottom-right' | 'bottom-left')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Nederst til hoyre</SelectItem>
                        <SelectItem value="bottom-left">Nederst til venstre</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Tab: Oppførsel ─────────────────────── */}
              <TabsContent value="oppførsel" className="space-y-6">
                {/* Widget enabled */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Widget-status</CardTitle>
                    <CardDescription>Aktiver eller deaktiver widgeten</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Widget aktiv</Label>
                        <p className="text-xs text-muted-foreground">
                          Nar deaktivert vises ikke widgeten pa nettstedet.
                        </p>
                      </div>
                      <Switch
                        checked={widgetEnabled}
                        onCheckedChange={setWidgetEnabled}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Auto-open delay */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Auto-apning</CardTitle>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[240px]">
                          Widgeten kan åpnes automatisk etter et visst antall sekunder. Sett til 0 for å deaktivere.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <CardDescription>
                      Åpne widgeten automatisk etter en forsinkelse
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                      <Slider
                        value={[autoOpenDelay]}
                        onValueChange={([val]) => setAutoOpenDelay(val)}
                        min={0}
                        max={30}
                        step={1}
                        className="flex-1"
                      />
                      <Badge variant="secondary" className="min-w-[80px] justify-center text-sm font-semibold">
                        {autoOpenDelay === 0 ? 'Av' : `${autoOpenDelay} sek.`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {autoOpenDelay === 0
                        ? 'Widgeten åpnes kun nar besokende klikker pa den.'
                        : `Widgeten åpnes automatisk etter ${autoOpenDelay} sekunder.`}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Tab: Installasjon ──────────────────── */}
              <TabsContent value="installasjon" className="space-y-6">
                {/* Embed code */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Integrasjonskode</CardTitle>
                        <CardDescription>Kopier og lim inn pa nettstedet ditt</CardDescription>
                      </div>
                      <Button
                        variant={copied ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleCopy}
                        className={copied ? 'bg-green-600 hover:bg-green-600' : ''}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Kopiert
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Kopier
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeKey && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-md text-xs text-green-700 border border-green-200">
                        <Check className="h-3.5 w-3.5" />
                        Aktiv API-nøkkel: <code className="font-semibold">{activeKey.key_prefix}...</code>
                      </div>
                    )}

                    <pre className="bg-slate-900 text-slate-200 p-5 rounded-lg overflow-auto text-[13px] leading-7 font-mono">
                      {embedCode}
                    </pre>

                    <p className="text-xs text-muted-foreground">
                      Erstatt <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">DIN_API_NOKKEL</code> med
                      den fullstendige API-nøkkelen du fikk ved opprettelse.
                    </p>
                  </CardContent>
                </Card>

                {/* Installation guide */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Installasjonsveiledning</CardTitle>
                    <CardDescription>Tre enkle steg for å komme i gang</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {[
                        {
                          step: '1',
                          title: 'Kopier koden',
                          desc: 'Klikk "Kopier" pa kodeblokken ovenfor for å kopiere script-taggen.',
                        },
                        {
                          step: '2',
                          title: 'Lim inn i HTML-en din',
                          desc: 'Apne HTML-filen for nettstedet ditt og lim inn koden rett for den avsluttende </body>-taggen.',
                        },
                        {
                          step: '3',
                          title: 'Ferdig',
                          desc: 'Last inn nettstedet pa nytt. Chat-widgeten vises automatisk i hjornet du har valgt.',
                        },
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 items-start">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
                          >
                            {item.step}
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-0.5">{item.title}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: Live Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Forhåndsvisning</CardTitle>
                      <CardDescription>Slik ser widgeten ut</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewOpen(!previewOpen)}
                    >
                      {previewOpen ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Vis boblen
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Vis vinduet
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Device selector */}
                  <div className="flex items-center gap-1 mt-3">
                    <ToggleGroup
                      type="single"
                      value={deviceType}
                      onValueChange={(val) => { if (val) setDeviceType(val as DeviceType); }}
                      variant="outline"
                      size="sm"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem value="desktop" aria-label="Desktop">
                            <Monitor className="h-4 w-4" />
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Desktop</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem value="tablet" aria-label="Nettbrett">
                            <Tablet className="h-4 w-4" />
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Nettbrett</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem value="mobile" aria-label="Mobil">
                            <Smartphone className="h-4 w-4" />
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Mobil</TooltipContent>
                      </Tooltip>
                    </ToggleGroup>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Browser chrome mockup */}
                  <div
                    className="rounded-lg overflow-hidden border shadow-md transition-all duration-300 mx-auto"
                    style={{ maxWidth: DEVICE_WIDTHS[deviceType] }}
                  >
                    {/* Browser bar */}
                    <div className="bg-muted px-3 py-2 flex items-center gap-2 border-b">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                      </div>
                      <div className="flex-1 bg-background rounded px-2.5 py-1 text-[10px] text-muted-foreground border truncate">
                        {selectedSite?.domain || 'dinside.no'}
                      </div>
                    </div>

                    {/* Page content */}
                    <div className="bg-slate-50 p-5 relative" style={{ minHeight: deviceType === 'mobile' ? '520px' : '480px' }}>
                      {/* Fake page skeleton */}
                      <div className="opacity-30 space-y-3">
                        <div className="h-2.5 w-[45%] bg-slate-300 rounded" />
                        <div className="h-[7px] w-[90%] bg-slate-200 rounded" />
                        <div className="h-[7px] w-[78%] bg-slate-200 rounded" />
                        <div className="h-[7px] w-[85%] bg-slate-200 rounded" />
                        <div className="h-[70px] w-full bg-slate-200 rounded-md mt-4" />
                        <div className="h-[7px] w-[65%] bg-slate-200 rounded mt-3" />
                        <div className="h-[7px] w-[72%] bg-slate-200 rounded" />
                        <div className="h-[7px] w-[50%] bg-slate-200 rounded" />
                        <div className="flex gap-2.5 mt-4">
                          <div className="h-[50px] flex-1 bg-slate-200 rounded-md" />
                          <div className="h-[50px] flex-1 bg-slate-200 rounded-md" />
                        </div>
                      </div>

                      {/* Widget preview */}
                      <div
                        className="absolute bottom-3.5 transition-all duration-300"
                        style={position === 'bottom-right' ? { right: '14px' } : { left: '14px' }}
                      >
                        {previewOpen ? (
                          /* Chat window */
                          <div
                            className="rounded-2xl overflow-hidden shadow-2xl transition-all duration-200"
                            style={{ width: deviceType === 'mobile' ? '280px' : '300px' }}
                          >
                            {/* Header */}
                            <div
                              className="text-white px-3.5 py-3 flex items-center gap-2.5"
                              style={{ backgroundColor: themeColor }}
                            >
                              <WidgetAvatar type={avatarType} botName={botName} color="rgba(255,255,255,0.2)" size={30} />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[13px] truncate">{botName || 'NorskBot'}</div>
                                <div className="text-[10px] opacity-80">Tilgjengelig na</div>
                              </div>
                              <button
                                onClick={() => setPreviewOpen(false)}
                                className="opacity-70 hover:opacity-100 transition-opacity"
                              >
                                <ChevronDown className="h-4 w-4 text-white" />
                              </button>
                            </div>

                            {/* Messages */}
                            <div className="bg-slate-50 px-3 py-3" style={{ minHeight: '100px' }}>
                              {/* Bot message */}
                              <div className="flex gap-1.5 mb-3">
                                <WidgetAvatar type={avatarType} botName={botName} color={themeColor} size={20} />
                                <div className="bg-white border border-slate-200 rounded-xl rounded-tl-sm px-2.5 py-1.5 text-[11.5px] text-slate-900 max-w-[200px] leading-snug">
                                  {welcomeMessage || 'Hei!'}
                                </div>
                              </div>
                              {/* User message */}
                              <div className="flex justify-end">
                                <div
                                  className="text-white rounded-xl rounded-tr-sm px-2.5 py-1.5 text-[11.5px] max-w-[200px] leading-snug"
                                  style={{ backgroundColor: themeColor }}
                                >
                                  Hei, kan du hjelpe meg?
                                </div>
                              </div>
                            </div>

                            {/* Input */}
                            <div className="bg-white border-t border-slate-200 px-2.5 py-2 flex gap-1.5">
                              <div className="flex-1 px-2.5 py-1.5 bg-slate-50 rounded-md border border-slate-200 text-[11px] text-slate-400">
                                Skriv en melding...
                              </div>
                              <div
                                className="w-7 h-7 rounded-md flex items-center justify-center"
                                style={{ backgroundColor: themeColor }}
                              >
                                <Send className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Bubble */
                          <button
                            onClick={() => setPreviewOpen(true)}
                            className="w-[52px] h-[52px] rounded-full border-none cursor-pointer shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                            style={{ backgroundColor: themeColor }}
                          >
                            <MessageSquare className="h-5 w-5 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
