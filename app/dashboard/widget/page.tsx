'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/hooks';

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const themeColors = [
  { name: 'Bla', value: '#2563eb' },
  { name: 'Gronn', value: '#16a34a' },
  { name: 'Lilla', value: '#7c3aed' },
  { name: 'Rod', value: '#dc2626' },
  { name: 'Oransje', value: '#ea580c' },
  { name: 'Rosa', value: '#db2777' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Indigo', value: '#4f46e5' },
];

interface Site {
  id: string;
  name: string;
  domain: string;
  bot_name: string | null;
  welcome_message: string | null;
  theme_config: Record<string, string> | null;
  api_keys: Array<{ key_prefix: string; is_active: boolean }>;
}

export default function WidgetPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [botName, setBotName] = useState('NorskBot');
  const [welcomeMessage, setWelcomeMessage] = useState('Hei! Hvordan kan jeg hjelpe deg i dag?');
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [autoOpenDelay, setAutoOpenDelay] = useState(5);
  const [copied, setCopied] = useState(false);
  const [showTestWidget, setShowTestWidget] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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
          const site = siteData[0];
          setSelectedSiteId(site.id);
          setBotName(site.bot_name || 'NorskBot');
          setWelcomeMessage(site.welcome_message || 'Hei! Hvordan kan jeg hjelpe deg i dag?');
          if (site.theme_config) {
            setThemeColor(site.theme_config.color || '#2563eb');
            setPosition((site.theme_config.position as 'bottom-right' | 'bottom-left') || 'bottom-right');
          }
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    };

    loadSites();
  }, [user]);

  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    const site = sites.find((s) => s.id === siteId);
    if (site) {
      setBotName(site.bot_name || 'NorskBot');
      setWelcomeMessage(site.welcome_message || 'Hei! Hvordan kan jeg hjelpe deg i dag?');
      if (site.theme_config) {
        setThemeColor(site.theme_config.color || '#2563eb');
        setPosition((site.theme_config.position as 'bottom-right' | 'bottom-left') || 'bottom-right');
      } else {
        setThemeColor('#2563eb');
        setPosition('bottom-right');
      }
    }
    setSaveMessage('');
  };

  const handleSaveConfig = async () => {
    if (!selectedSiteId) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const { error } = await supabase
        .from('sites')
        .update({
          bot_name: botName,
          welcome_message: welcomeMessage,
          theme_config: {
            color: themeColor,
            position: position,
            autoOpenDelay: autoOpenDelay,
          },
        })
        .eq('id', selectedSiteId);

      if (error) throw error;
      setSaveMessage('Konfigurasjon lagret!');

      // Update local state
      setSites((prev) =>
        prev.map((s) =>
          s.id === selectedSiteId
            ? { ...s, bot_name: botName, welcome_message: welcomeMessage, theme_config: { color: themeColor, position, autoOpenDelay: String(autoOpenDelay) } }
            : s
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kunne ikke lagre konfigurasjon';
      setSaveMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const embedCode = selectedSite
    ? `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js"
  data-site-id="${selectedSite.id}"
  data-api-key="DIN_API_NØKKEL"
  async>
<\/script>`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', fontFamily: fontStack }}>
        <p style={{ color: '#64748b', fontSize: '16px' }}>Laster...</p>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: fontStack }}>
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Widget-konfigurasjon</h1>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>Ingen nettsteder funnet</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Opprett et nettsted først for å konfigurere widgeten.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: fontStack }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Widget-konfigurasjon</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>Tilpass chat-widgeten og fa embed-koden</p>
      </div>

      <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
        {/* Site selector */}
        {sites.length > 1 && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Velg nettsted</label>
            <select
              value={selectedSiteId}
              onChange={(e) => handleSiteChange(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: fontStack, cursor: 'pointer', backgroundColor: 'white', minWidth: '300px' }}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name} ({site.domain})</option>
              ))}
            </select>
          </div>
        )}

        {saveMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: saveMessage.includes('lagret') ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${saveMessage.includes('lagret') ? '#bbf7d0' : '#fecaca'}`,
            color: saveMessage.includes('lagret') ? '#16a34a' : '#dc2626',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '24px',
          }}>
            {saveMessage}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', maxWidth: '1200px' }}>
          {/* Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Settings Card */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 24px 0' }}>Innstillinger</h2>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Bot-navn</label>
                <input type="text" value={botName} onChange={(e) => setBotName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: fontStack }} />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Velkomstmelding</label>
                <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const, fontFamily: fontStack }} />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Temafarge</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  {themeColors.map((c) => (
                    <div key={c.value} onClick={() => setThemeColor(c.value)}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: c.value, cursor: 'pointer', border: themeColor === c.value ? '3px solid #0f172a' : '2px solid transparent', transition: 'all 0.15s' }}
                      title={c.name} />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Posisjon</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {([{ value: 'bottom-right' as const, label: 'Nederst til hoyre' }, { value: 'bottom-left' as const, label: 'Nederst til venstre' }]).map((pos) => (
                    <button key={pos.value} onClick={() => setPosition(pos.value)}
                      style={{ flex: 1, padding: '10px', border: position === pos.value ? '2px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: position === pos.value ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: position === pos.value ? '#2563eb' : '#64748b', fontFamily: fontStack }}>
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>
                  Auto-apne forsinkelse: {autoOpenDelay} sekunder
                </label>
                <input type="range" min={0} max={30} value={autoOpenDelay} onChange={(e) => setAutoOpenDelay(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563eb' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                  <span>0s (umiddelbart)</span>
                  <span>30s</span>
                </div>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={saving}
                style={{
                  padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none',
                  borderRadius: '8px', cursor: saving ? 'default' : 'pointer', fontSize: '14px',
                  fontWeight: '600', fontFamily: fontStack, transition: 'background-color 0.2s',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Lagrer...' : 'Lagre konfigurasjon'}
              </button>
            </div>

            {/* Embed Code Card */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Embed-kode</h2>
                <button onClick={handleCopy}
                  style={{ padding: '8px 16px', backgroundColor: copied ? '#16a34a' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: fontStack, transition: 'background-color 0.2s' }}>
                  {copied ? 'Kopiert!' : 'Kopier kode'}
                </button>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' }}>
                Lim inn denne koden for lukke-taggen pa nettstedet ditt.
              </p>
              <p style={{ fontSize: '12px', color: '#f59e0b', margin: '0 0 12px 0', fontWeight: '500' }}>
                ⚠️ Bruk API-nøkkelen du fikk da du opprettet nettstedet. Nøkkelen vises kun én gang.
              </p>
              {selectedSite?.api_keys && selectedSite.api_keys.length > 0 && (
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                  Aktiv API-nøkkel: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{selectedSite.api_keys.find(k => k.is_active)?.key_prefix || '—'}••••</code>
                </p>
              )}
              <pre style={{ backgroundColor: '#0f172a', color: '#e2e8f0', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                {embedCode}
              </pre>
            </div>

            {/* Test Widget Button */}
            <button onClick={() => setShowTestWidget(!showTestWidget)}
              style={{ padding: '14px 24px', backgroundColor: showTestWidget ? '#64748b' : '#0f172a', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', fontFamily: fontStack, transition: 'background-color 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {showTestWidget ? 'Lukk test-widget' : 'Test widget'}
            </button>
          </div>

          {/* Live Preview */}
          <div>
            <div style={{ position: 'sticky' as const, top: '24px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Forhandsvisning</h3>

                <div style={{ backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '16px', minHeight: '460px', position: 'relative' as const, overflow: 'hidden' }}>
                  {/* Fake website content */}
                  <div style={{ opacity: 0.4 }}>
                    <div style={{ height: '12px', width: '60%', backgroundColor: '#cbd5e1', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ height: '8px', width: '90%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '8px', width: '75%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '8px', width: '85%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '20px' }} />
                    <div style={{ height: '80px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '8px', marginBottom: '12px' }} />
                    <div style={{ height: '8px', width: '70%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '8px', width: '80%', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                  </div>

                  {/* Chat Widget */}
                  <div style={{
                    position: 'absolute' as const, bottom: '16px',
                    ...(position === 'bottom-right' ? { right: '16px' } : { left: '16px' }),
                    width: '320px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                  }}>
                    <div style={{ backgroundColor: themeColor, color: 'white', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: 'white' }}>N</div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{botName || 'NorskBot'}</div>
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>Online na</div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '14px', minHeight: '140px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white', flexShrink: 0 }}>N</div>
                        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', borderTopLeftRadius: '4px', padding: '8px 12px', fontSize: '12px', color: '#0f172a', maxWidth: '220px' }}>
                          {welcomeMessage || 'Hei!'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ backgroundColor: themeColor, color: 'white', borderRadius: '10px', borderTopRightRadius: '4px', padding: '8px 12px', fontSize: '12px', maxWidth: '220px' }}>
                          Hei, kan du hjelpe meg?
                        </div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '10px 12px', display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1, padding: '7px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#94a3b8' }}>Skriv en melding...</div>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating test widget */}
      {showTestWidget && (
        <div style={{
          position: 'fixed' as const, bottom: '24px', right: '24px', width: '360px',
          borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', zIndex: 9999,
        }}>
          <div style={{ backgroundColor: themeColor, color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700' }}>N</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{botName}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Online na</div>
              </div>
            </div>
            <button onClick={() => setShowTestWidget(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', fontFamily: fontStack }}>X</button>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', minHeight: '280px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0 }}>N</div>
              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', borderTopLeftRadius: '4px', padding: '10px 14px', fontSize: '14px', color: '#0f172a' }}>
                {welcomeMessage}
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="Skriv en melding..."
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: fontStack }} />
            <button style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: themeColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
