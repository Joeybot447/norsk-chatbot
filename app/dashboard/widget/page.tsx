'use client';

import { useState } from 'react';
import Link from 'next/link';

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const SidebarNav = ({ currentPage }: { currentPage: string }) => (
  <div style={{ width: '250px', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', padding: '20px 0', fontFamily: fontStack }}>
    <div style={{ padding: '0 20px', marginBottom: '30px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>NorskBot</h2>
      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Admin Dashboard</p>
    </div>
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {[
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/dashboard/sites', label: 'Nettsteder', icon: '🌐' },
        { href: '/dashboard/knowledge', label: 'Kunnskapsbase', icon: '📚' },
        { href: '/dashboard/widget', label: 'Widget', icon: '💬' },
        { href: '/dashboard/analytics', label: 'Analyse', icon: '📈' },
        { href: '/dashboard/billing', label: 'Fakturering', icon: '💳' },
        { href: '/dashboard/settings', label: 'Innstillinger', icon: '⚙️' },
      ].map((item) => (
        <Link key={item.href} href={item.href} style={{ textDecoration: 'none', color: 'white' }}>
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: currentPage === item.label ? '#1e293b' : 'transparent',
              cursor: 'pointer',
              borderLeft: currentPage === item.label ? '4px solid #2563eb' : '4px solid transparent',
              fontSize: '14px',
            }}
          >
            <span style={{ marginRight: '10px' }}>{item.icon}</span>
            {item.label}
          </div>
        </Link>
      ))}
    </nav>
  </div>
);

const themeColors = [
  { name: 'Blå', value: '#2563eb' },
  { name: 'Grønn', value: '#16a34a' },
  { name: 'Lilla', value: '#7c3aed' },
  { name: 'Rød', value: '#dc2626' },
  { name: 'Oransje', value: '#ea580c' },
  { name: 'Rosa', value: '#db2777' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Indigo', value: '#4f46e5' },
];

export default function WidgetPage() {
  const [botName, setBotName] = useState('NorskBot');
  const [welcomeMessage, setWelcomeMessage] = useState('Hei! Hvordan kan jeg hjelpe deg i dag?');
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [autoOpenDelay, setAutoOpenDelay] = useState(5);
  const [copied, setCopied] = useState(false);
  const [showTestWidget, setShowTestWidget] = useState(false);

  const embedCode = `<script src="https://cdn.norskbot.no/widget.js"
  data-bot-name="${botName}"
  data-welcome="${welcomeMessage}"
  data-color="${themeColor}"
  data-position="${position}"
  data-auto-open="${autoOpenDelay}"
  async>
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: fontStack }}>
      <SidebarNav currentPage="Widget" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Widget-konfigurasjon</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>Tilpass chat-widgeten og få embed-koden</p>
        </div>

        <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', maxWidth: '1200px' }}>
            {/* Configuration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Settings Card */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 24px 0' }}>Innstillinger</h2>

                {/* Bot Name */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Bot-navn</label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: fontStack }}
                  />
                </div>

                {/* Welcome Message */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Velkomstmelding</label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={2}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: fontStack }}
                  />
                </div>

                {/* Theme Color */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Temafarge</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {themeColors.map((c) => (
                      <div
                        key={c.value}
                        onClick={() => setThemeColor(c.value)}
                        style={{
                          width: '36px', height: '36px', borderRadius: '50%', backgroundColor: c.value,
                          cursor: 'pointer', border: themeColor === c.value ? '3px solid #0f172a' : '2px solid transparent',
                          transition: 'all 0.15s',
                        }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Position */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Posisjon</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { value: 'bottom-right' as const, label: 'Nederst til høyre' },
                      { value: 'bottom-left' as const, label: 'Nederst til venstre' },
                    ].map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => setPosition(pos.value)}
                        style={{
                          flex: 1, padding: '10px', border: position === pos.value ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          borderRadius: '8px', backgroundColor: position === pos.value ? '#eff6ff' : 'white',
                          cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                          color: position === pos.value ? '#2563eb' : '#64748b', fontFamily: fontStack,
                        }}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-open delay */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>
                    Auto-åpne forsinkelse: {autoOpenDelay} sekunder
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={autoOpenDelay}
                    onChange={(e) => setAutoOpenDelay(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                    <span>0s (umiddelbart)</span>
                    <span>30s</span>
                  </div>
                </div>
              </div>

              {/* Embed Code Card */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Embed-kode</h2>
                  <button
                    onClick={handleCopy}
                    style={{
                      padding: '8px 16px', backgroundColor: copied ? '#16a34a' : '#2563eb', color: 'white',
                      border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                      fontWeight: '500', fontFamily: fontStack, transition: 'background-color 0.2s',
                    }}
                  >
                    {copied ? '✓ Kopiert!' : '📋 Kopier kode'}
                  </button>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>
                  Lim inn denne koden i <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>&lt;head&gt;</code> eller før <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>&lt;/body&gt;</code> på nettstedet ditt.
                </p>
                <pre style={{
                  backgroundColor: '#0f172a', color: '#e2e8f0', padding: '16px', borderRadius: '8px',
                  overflow: 'auto', fontSize: '13px', lineHeight: '1.6', margin: 0,
                }}>
                  {embedCode}
                </pre>
              </div>

              {/* Test Widget Button */}
              <button
                onClick={() => setShowTestWidget(!showTestWidget)}
                style={{
                  padding: '14px 24px', backgroundColor: showTestWidget ? '#64748b' : '#0f172a', color: 'white',
                  border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px',
                  fontWeight: '600', fontFamily: fontStack, transition: 'background-color 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {showTestWidget ? '✕ Lukk test-widget' : '🚀 Test widget'}
              </button>
            </div>

            {/* Live Preview */}
            <div>
              <div style={{ position: 'sticky', top: '24px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Forhåndsvisning</h3>

                  {/* Mock website background */}
                  <div style={{ backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '16px', minHeight: '460px', position: 'relative', overflow: 'hidden' }}>
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
                      position: 'absolute',
                      bottom: '16px',
                      [position === 'bottom-right' ? 'right' : 'left']: '16px',
                      width: '320px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    }}>
                      {/* Header */}
                      <div style={{ backgroundColor: themeColor, color: 'white', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{botName || 'NorskBot'}</div>
                          <div style={{ fontSize: '11px', opacity: 0.8 }}>Online nå</div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div style={{ backgroundColor: '#f8fafc', padding: '14px', minHeight: '140px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>🤖</div>
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

                      {/* Input */}
                      <div style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '10px 12px', display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1, padding: '7px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#94a3b8' }}>Skriv en melding...</div>
                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white', fontSize: '14px' }}>→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating test widget */}
      {showTestWidget && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', width: '360px',
          borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          zIndex: 9999,
        }}>
          <div style={{ backgroundColor: themeColor, color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🤖</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>{botName}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Online nå</div>
              </div>
            </div>
            <button onClick={() => setShowTestWidget(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', minHeight: '280px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🤖</div>
              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', borderTopLeftRadius: '4px', padding: '10px 14px', fontSize: '14px', color: '#0f172a' }}>
                {welcomeMessage}
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Skriv en melding..."
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: fontStack }}
            />
            <button style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: themeColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '18px' }}>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
