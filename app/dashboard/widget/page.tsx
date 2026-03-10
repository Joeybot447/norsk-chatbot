'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

/* ─────────────────────────────────────────────
   Design tokens
   ───────────────────────────────────────────── */
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const BLUE = '#2563eb';
const DARK = '#0f172a';
const SECONDARY = '#64748b';
const BORDER = '#e2e8f0';
const BG_PAGE = '#f8fafc';
const BG_CARD = '#ffffff';
const RADIUS = '12px';
const SHADOW_SM = '0 1px 2px rgba(0,0,0,0.04)';
const SHADOW_MD = '0 4px 12px rgba(0,0,0,0.06)';
const SHADOW_WIDGET = '0 12px 40px rgba(0,0,0,0.18)';

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

/* ─────────────────────────────────────────────
   Avatar SVG icons
   ───────────────────────────────────────────── */
function AvatarIcon({ type, color, size = 20 }: { type: string; color: string; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'white', strokeWidth: '2', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

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
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: type === 'initials' ? color : `${color}cc`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: 'white', fontFamily: FONT,
      flexShrink: 0,
    }}>
      {type === 'initials' ? initial : <AvatarIcon type={type} color={color} size={size * 0.5} />}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared styles
   ───────────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: `1px solid ${BORDER}`, borderRadius: '8px',
  fontSize: '14px', fontFamily: FONT, outline: 'none',
  boxSizing: 'border-box', color: DARK,
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: DARK, marginBottom: '6px', letterSpacing: '-0.01em',
};

const hintStyle: React.CSSProperties = {
  fontSize: '12px', color: SECONDARY, marginTop: '4px', lineHeight: '1.4',
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: BG_CARD, borderRadius: RADIUS,
  border: `1px solid ${BORDER}`, padding: '28px',
  boxShadow: SHADOW_SM,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700,
  margin: '0 0 20px 0',
  textTransform: 'uppercase' as const,
  color: SECONDARY, letterSpacing: '0.05em',
};

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
  const [themeColor, setThemeColor] = useState(BLUE);
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [autoOpenDelay, setAutoOpenDelay] = useState(0);
  const [avatarType, setAvatarType] = useState('initials');

  // UI state
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(true);
  const [testOpen, setTestOpen] = useState(false);

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
  }, [user]);

  /* ── Apply config from site ─────────── */
  const applyConfig = useCallback((site: Site) => {
    setSelectedSiteId(site.id);
    setBotName(site.bot_name || 'NorskBot');
    setWelcomeMessage(site.welcome_message || 'Hei! Hvordan kan jeg hjelpe deg i dag?');
    if (site.theme_config) {
      setThemeColor(site.theme_config.color || site.theme_config.primaryColor || BLUE);
      setPosition((site.theme_config.position as 'bottom-right' | 'bottom-left') || 'bottom-right');
      setAutoOpenDelay(Number(site.theme_config.autoOpenDelay) || 0);
      setAvatarType(site.theme_config.avatarType || 'initials');
    } else {
      setThemeColor(BLUE);
      setPosition('bottom-right');
      setAutoOpenDelay(0);
      setAvatarType('initials');
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
                theme_config: { color: themeColor, position, autoOpenDelay: String(autoOpenDelay), avatarType },
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

  /* ── Test widget ───────────────────────── */
  const handleTestWidget = () => {
    if (testOpen) {
      setTestOpen(false);
      return;
    }
    setTestOpen(true);
  };

  /* ── Loading / empty states ────────────── */
  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: FONT, backgroundColor: BG_PAGE }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '36px', height: '36px', border: `3px solid ${BORDER}`,
            borderTopColor: BLUE, borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: SECONDARY, fontSize: '14px', margin: 0 }}>Laster konfigurasjon...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div style={{ fontFamily: FONT, backgroundColor: BG_PAGE, minHeight: '100vh' }}>
        <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: BG_CARD, padding: '20px 32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: DARK, margin: 0 }}>Widget</h1>
        </div>
        <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            ...sectionStyle, textAlign: 'center', padding: '80px 40px', maxWidth: '480px', width: '100%',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={SECONDARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: DARK, margin: '0 0 8px' }}>Ingen nettsteder enda</p>
            <p style={{ fontSize: '14px', color: SECONDARY, margin: 0, lineHeight: '1.5' }}>
              Opprett et nettsted for a konfigurere chat-widgeten din.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main render ───────────────────────── */
  return (
    <div style={{ fontFamily: FONT, backgroundColor: BG_PAGE, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`, backgroundColor: BG_CARD,
        padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: DARK, margin: 0, letterSpacing: '-0.02em' }}>Widget</h1>
          <p style={{ fontSize: '13px', color: SECONDARY, margin: '2px 0 0' }}>Tilpass utseende og installer pa nettstedet ditt</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Save status indicator */}
          {saveStatus === 'success' && (
            <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              Lagret
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>{saveError}</span>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            padding: '9px 20px', backgroundColor: saving ? '#93b4f4' : BLUE, color: 'white',
            border: 'none', borderRadius: '8px', cursor: saving ? 'default' : 'pointer',
            fontSize: '13px', fontWeight: 600, fontFamily: FONT,
            transition: 'background-color 0.15s',
          }}>
            {saving ? 'Lagrer...' : 'Lagre endringer'}
          </button>
        </div>
      </div>

      {/* Site selector */}
      {sites.length > 1 && (
        <div style={{ padding: '16px 32px 0', backgroundColor: BG_PAGE }}>
          <select
            value={selectedSiteId}
            onChange={(e) => handleSiteChange(e.target.value)}
            style={{
              ...inputStyle, maxWidth: '360px', cursor: 'pointer', backgroundColor: BG_CARD,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
              appearance: 'none', paddingRight: '40px',
            }}
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.name} — {site.domain}</option>
            ))}
          </select>
        </div>
      )}

      {/* Main content: settings + preview */}
      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '28px', maxWidth: '1280px' }}>
        {/* LEFT: Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Section: Utseende */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Utseende</div>

            {/* Bot name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Bot-navn</label>
              <input
                type="text" value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="NorskBot"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = `0 0 0 3px ${BLUE}1a`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p style={hintStyle}>Vises i overskriften pa chat-vinduet.</p>
            </div>

            {/* Welcome message */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Velkomstmelding</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={2}
                placeholder="Hei! Hvordan kan jeg hjelpe deg?"
                style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: '1.5' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = `0 0 0 3px ${BLUE}1a`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p style={hintStyle}>Forste melding besokende ser nar de apner widgeten.</p>
            </div>

            {/* Theme color */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Temafarge</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {THEME_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setThemeColor(c.value)}
                    title={c.name}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: c.value, border: 'none', cursor: 'pointer',
                      outline: themeColor === c.value ? `2px solid ${c.value}` : '2px solid transparent',
                      outlineOffset: '2px',
                      transition: 'outline 0.15s, transform 0.1s',
                      transform: themeColor === c.value ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                ))}
                {/* Custom color */}
                <div style={{ position: 'relative', marginLeft: '4px' }}>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      border: `2px solid ${BORDER}`, cursor: 'pointer',
                      padding: 0, appearance: 'none', backgroundColor: 'transparent',
                    }}
                    title="Egendefinert farge"
                  />
                </div>
              </div>
            </div>

            {/* Avatar type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Ikon</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAvatarType(opt.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                      border: avatarType === opt.id ? `2px solid ${BLUE}` : `1px solid ${BORDER}`,
                      backgroundColor: avatarType === opt.id ? `${BLUE}08` : BG_CARD,
                      fontFamily: FONT, fontSize: '11px', fontWeight: 500,
                      color: avatarType === opt.id ? BLUE : SECONDARY,
                      transition: 'all 0.15s',
                      minWidth: '72px',
                    }}
                  >
                    <WidgetAvatar type={opt.id} botName={botName} color={themeColor} size={32} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Posisjon</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {([
                  { value: 'bottom-right' as const, label: 'Nederst til hoyre' },
                  { value: 'bottom-left' as const, label: 'Nederst til venstre' },
                ] as const).map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => setPosition(pos.value)}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                      border: position === pos.value ? `2px solid ${BLUE}` : `1px solid ${BORDER}`,
                      backgroundColor: position === pos.value ? `${BLUE}08` : BG_CARD,
                      fontSize: '13px', fontWeight: 500, fontFamily: FONT,
                      color: position === pos.value ? BLUE : SECONDARY,
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    {/* Mini position indicator */}
                    <div style={{
                      width: '20px', height: '14px', borderRadius: '2px',
                      border: `1px solid ${position === pos.value ? BLUE : BORDER}`,
                      position: 'relative',
                    }}>
                      <div style={{
                        width: '4px', height: '4px', borderRadius: '50%',
                        backgroundColor: position === pos.value ? BLUE : SECONDARY,
                        position: 'absolute', bottom: '2px',
                        ...(pos.value === 'bottom-right' ? { right: '2px' } : { left: '2px' }),
                      }} />
                    </div>
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-open delay */}
            <div>
              <label style={labelStyle}>
                Auto-apning
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <input
                  type="range" min={0} max={30} step={1}
                  value={autoOpenDelay}
                  onChange={(e) => setAutoOpenDelay(Number(e.target.value))}
                  style={{ flex: 1, accentColor: themeColor, height: '4px' }}
                />
                <span style={{
                  fontSize: '13px', fontWeight: 600, color: DARK,
                  minWidth: '72px', textAlign: 'right',
                }}>
                  {autoOpenDelay === 0 ? 'Av' : `${autoOpenDelay} sek.`}
                </span>
              </div>
              <p style={hintStyle}>
                {autoOpenDelay === 0
                  ? 'Widgeten apnes kun nar besokende klikker pa den.'
                  : `Widgeten apnes automatisk etter ${autoOpenDelay} sekunder.`}
              </p>
            </div>
          </div>

          {/* Section: Embed-kode */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={sectionTitleStyle}>Integrasjonskode</div>
              <button
                onClick={handleCopy}
                style={{
                  padding: '7px 14px',
                  backgroundColor: copied ? '#16a34a' : DARK,
                  color: 'white', border: 'none', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  fontFamily: FONT, transition: 'background-color 0.2s',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    Kopiert
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    Kopier
                  </>
                )}
              </button>
            </div>

            {activeKey && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', backgroundColor: '#f0fdf4', borderRadius: '6px',
                marginBottom: '12px', fontSize: '12px', color: '#15803d',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Aktiv API-nokkel: <code style={{ fontWeight: 600 }}>{activeKey.key_prefix}...</code>
              </div>
            )}

            <pre style={{
              backgroundColor: DARK, color: '#e2e8f0',
              padding: '18px', borderRadius: '8px', overflow: 'auto',
              fontSize: '12.5px', lineHeight: '1.7', margin: 0,
              fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", Menlo, monospace',
            }}>
              {embedCode}
            </pre>

            <p style={{ ...hintStyle, marginTop: '10px' }}>
              Erstatt <code style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', fontSize: '11px' }}>DIN_API_NOKKEL</code> med den fullstendige API-nokkelen du fikk ved opprettelse.
            </p>
          </div>

          {/* Section: Installasjonsveiledning */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Installasjon</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { step: '1', title: 'Kopier koden', desc: 'Klikk "Kopier" pa kodeblokken ovenfor for a kopiere script-taggen.' },
                { step: '2', title: 'Lim inn i HTML-en din', desc: 'Apne HTML-filen for nettstedet ditt og lim inn koden rett for den avsluttende </body>-taggen.' },
                { step: '3', title: 'Ferdig', desc: 'Last inn nettstedet pa nytt. Chat-widgeten vises automatisk i hjornet du har valgt.' },
              ].map((item) => (
                <div key={item.step} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: `${themeColor}12`, color: themeColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, flexShrink: 0,
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: DARK, margin: '0 0 2px' }}>{item.title}</p>
                    <p style={{ fontSize: '13px', color: SECONDARY, margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test button */}
          <button
            onClick={handleTestWidget}
            style={{
              padding: '14px 24px', borderRadius: '10px', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600, fontFamily: FONT,
              border: testOpen ? `2px solid ${SECONDARY}` : `2px solid ${DARK}`,
              backgroundColor: testOpen ? BG_CARD : DARK,
              color: testOpen ? SECONDARY : 'white',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {testOpen ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                Lukk test
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                Test widget
              </>
            )}
          </button>
        </div>

        {/* RIGHT: Live Preview */}
        <div>
          <div style={{ position: 'sticky' as const, top: '24px' }}>
            <div style={{
              ...sectionStyle,
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={sectionTitleStyle}>Forhandsvisning</div>
                <button
                  onClick={() => setPreviewOpen(!previewOpen)}
                  style={{
                    padding: '5px 10px', border: `1px solid ${BORDER}`, borderRadius: '6px',
                    backgroundColor: BG_CARD, cursor: 'pointer', fontSize: '11px',
                    fontWeight: 500, color: SECONDARY, fontFamily: FONT,
                    transition: 'background-color 0.15s',
                  }}
                >
                  {previewOpen ? 'Vis boblen' : 'Vis vinduet'}
                </button>
              </div>

              {/* Browser chrome mockup */}
              <div style={{
                borderRadius: '10px', overflow: 'hidden',
                border: `1px solid ${BORDER}`,
                boxShadow: SHADOW_MD,
              }}>
                {/* Browser bar */}
                <div style={{
                  backgroundColor: '#f1f5f9', padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  borderBottom: `1px solid ${BORDER}`,
                }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fca5a5' }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fde68a' }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#86efac' }} />
                  </div>
                  <div style={{
                    flex: 1, backgroundColor: 'white', borderRadius: '4px',
                    padding: '3px 10px', fontSize: '10px', color: SECONDARY,
                    border: `1px solid ${BORDER}`,
                  }}>
                    {selectedSite?.domain || 'dinside.no'}
                  </div>
                </div>

                {/* Page content */}
                <div style={{
                  backgroundColor: '#fafbfc', padding: '20px',
                  minHeight: '480px', position: 'relative',
                }}>
                  {/* Fake page skeleton */}
                  <div style={{ opacity: 0.35 }}>
                    <div style={{ height: '10px', width: '45%', backgroundColor: '#cbd5e1', borderRadius: '4px', marginBottom: '12px' }} />
                    <div style={{ height: '7px', width: '90%', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '5px' }} />
                    <div style={{ height: '7px', width: '78%', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '5px' }} />
                    <div style={{ height: '7px', width: '85%', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '18px' }} />
                    <div style={{ height: '70px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '6px', marginBottom: '14px' }} />
                    <div style={{ height: '7px', width: '65%', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '5px' }} />
                    <div style={{ height: '7px', width: '72%', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '5px' }} />
                    <div style={{ height: '7px', width: '50%', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '18px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ height: '50px', flex: 1, backgroundColor: '#e2e8f0', borderRadius: '6px' }} />
                      <div style={{ height: '50px', flex: 1, backgroundColor: '#e2e8f0', borderRadius: '6px' }} />
                    </div>
                  </div>

                  {/* Widget preview */}
                  <div style={{
                    position: 'absolute', bottom: '14px',
                    ...(position === 'bottom-right' ? { right: '14px' } : { left: '14px' }),
                    transition: 'right 0.3s ease, left 0.3s ease',
                  }}>
                    {previewOpen ? (
                      /* Chat window */
                      <div style={{
                        width: '300px', borderRadius: '14px', overflow: 'hidden',
                        boxShadow: SHADOW_WIDGET,
                        transition: 'all 0.2s ease',
                      }}>
                        {/* Header */}
                        <div style={{
                          backgroundColor: themeColor, color: 'white', padding: '12px 14px',
                          display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                          <WidgetAvatar type={avatarType} botName={botName} color="rgba(255,255,255,0.2)" size={30} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', fontFamily: FONT }}>{botName || 'NorskBot'}</div>
                            <div style={{ fontSize: '10px', opacity: 0.8 }}>Tilgjengelig na</div>
                          </div>
                          <button onClick={() => setPreviewOpen(false)} style={{
                            background: 'none', border: 'none', color: 'white', cursor: 'pointer',
                            padding: '2px', opacity: 0.7, display: 'flex',
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>

                        {/* Messages */}
                        <div style={{ backgroundColor: '#f8fafc', padding: '12px', minHeight: '120px' }}>
                          {/* Bot message */}
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                            <WidgetAvatar type={avatarType} botName={botName} color={themeColor} size={22} />
                            <div style={{
                              backgroundColor: 'white', border: `1px solid ${BORDER}`,
                              borderRadius: '10px', borderTopLeftRadius: '3px',
                              padding: '7px 10px', fontSize: '11.5px', color: DARK,
                              maxWidth: '200px', lineHeight: '1.4', fontFamily: FONT,
                            }}>
                              {welcomeMessage || 'Hei!'}
                            </div>
                          </div>
                          {/* User message */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{
                              backgroundColor: themeColor, color: 'white',
                              borderRadius: '10px', borderTopRightRadius: '3px',
                              padding: '7px 10px', fontSize: '11.5px',
                              maxWidth: '200px', lineHeight: '1.4', fontFamily: FONT,
                            }}>
                              Hei, kan du hjelpe meg?
                            </div>
                          </div>
                        </div>

                        {/* Input */}
                        <div style={{
                          backgroundColor: 'white', borderTop: `1px solid ${BORDER}`,
                          padding: '8px 10px', display: 'flex', gap: '6px',
                        }}>
                          <div style={{
                            flex: 1, padding: '6px 10px', backgroundColor: '#f8fafc',
                            borderRadius: '6px', border: `1px solid ${BORDER}`,
                            fontSize: '11px', color: '#94a3b8', fontFamily: FONT,
                          }}>
                            Skriv en melding...
                          </div>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            backgroundColor: themeColor, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Bubble */
                      <button
                        onClick={() => setPreviewOpen(true)}
                        style={{
                          width: '52px', height: '52px', borderRadius: '50%',
                          backgroundColor: themeColor, border: 'none', cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'transform 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating test widget */}
      {testOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setTestOpen(false)}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)',
              zIndex: 9998, backdropFilter: 'blur(2px)',
            }}
          />
          <div style={{
            position: 'fixed', bottom: '24px',
            ...(position === 'bottom-right' ? { right: '24px' } : { left: '24px' }),
            width: '380px', borderRadius: '16px', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)', zIndex: 9999,
            animation: 'slideUp 0.25s ease-out',
          }}>
            <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }`}</style>

            {/* Header */}
            <div style={{
              backgroundColor: themeColor, color: 'white', padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <WidgetAvatar type={avatarType} botName={botName} color="rgba(255,255,255,0.2)" size={38} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', fontFamily: FONT }}>{botName}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>Tilgjengelig na</div>
                </div>
              </div>
              <button
                onClick={() => setTestOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                  width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontFamily: FONT,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Messages area */}
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', minHeight: '300px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <WidgetAvatar type={avatarType} botName={botName} color={themeColor} size={28} />
                <div style={{
                  backgroundColor: 'white', border: `1px solid ${BORDER}`,
                  borderRadius: '14px', borderTopLeftRadius: '4px',
                  padding: '10px 14px', fontSize: '14px', color: DARK,
                  maxWidth: '260px', lineHeight: '1.5', fontFamily: FONT,
                }}>
                  {welcomeMessage}
                </div>
              </div>

              {/* Typing indicator style info */}
              <div style={{
                textAlign: 'center', padding: '24px',
                color: SECONDARY, fontSize: '12px',
              }}>
                Dette er en forhandsvisning. Meldinger sendes ikke.
              </div>
            </div>

            {/* Input */}
            <div style={{
              backgroundColor: 'white', borderTop: `1px solid ${BORDER}`,
              padding: '14px 16px', display: 'flex', gap: '10px',
            }}>
              <input
                type="text"
                placeholder="Skriv en melding..."
                style={{
                  flex: 1, padding: '10px 14px', border: `1px solid ${BORDER}`,
                  borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: FONT,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = themeColor; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                onKeyDown={(e) => { e.preventDefault(); }}
              />
              <button style={{
                width: '42px', height: '42px', borderRadius: '10px',
                backgroundColor: themeColor, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'opacity 0.15s',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
