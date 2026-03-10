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

export default function NewSitePage() {
  const [siteName, setSiteName] = useState('');
  const [domain, setDomain] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hei! Hvordan kan jeg hjelpe deg i dag?');
  const [botName, setBotName] = useState('NorskBot');
  const [themeColor, setThemeColor] = useState('#2563eb');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: fontStack }}>
      <SidebarNav currentPage="Nettsteder" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link href="/dashboard/sites" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>← Tilbake til nettsteder</Link>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 0 0' }}>Opprett nytt nettsted</h1>
          </div>
        </div>

        {/* Main Content */}
        <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', maxWidth: '1200px' }}>
            {/* Form */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 24px 0' }}>Nettstedsinformasjon</h2>

              {/* Site Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Nettstedsnavn *</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="F.eks. Min Bedrift AS"
                  style={{
                    width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: fontStack,
                  }}
                />
              </div>

              {/* Domain */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Domene-URL *</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="https://minbedrift.no"
                  style={{
                    width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: fontStack,
                  }}
                />
              </div>

              {/* Bot Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Bot-navn</label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="NorskBot"
                  style={{
                    width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: fontStack,
                  }}
                />
              </div>

              {/* Welcome Message */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Velkomstmelding</label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: fontStack,
                  }}
                />
              </div>

              {/* Theme Color */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '10px' }}>Temafarge</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {themeColors.map((c) => (
                    <div
                      key={c.value}
                      onClick={() => setThemeColor(c.value)}
                      style={{
                        width: '40px', height: '40px', borderRadius: '50%', backgroundColor: c.value,
                        cursor: 'pointer', border: themeColor === c.value ? '3px solid #0f172a' : '3px solid transparent',
                        boxShadow: themeColor === c.value ? '0 0 0 2px white, 0 0 0 4px ' + c.value : 'none',
                        transition: 'all 0.15s',
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Valgt: {themeColors.find(c => c.value === themeColor)?.name || themeColor}</p>
              </div>

              {/* Submit */}
              <button
                style={{
                  padding: '12px 28px', backgroundColor: '#2563eb', color: 'white', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px',
                  fontFamily: fontStack, transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                Opprett nettsted
              </button>
            </div>

            {/* Preview */}
            <div>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'sticky', top: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Forhåndsvisning av widget</h3>

                {/* Chat Widget Preview */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  {/* Widget Header */}
                  <div style={{ backgroundColor: themeColor, color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🤖</div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>{botName || 'NorskBot'}</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>Online nå</div>
                    </div>
                  </div>

                  {/* Widget Body */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '20px', minHeight: '200px' }}>
                    {/* Bot message */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🤖</div>
                      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', borderTopLeftRadius: '4px', padding: '10px 14px', fontSize: '13px', color: '#0f172a', maxWidth: '260px' }}>
                        {welcomeMessage || 'Hei! Hvordan kan jeg hjelpe deg?'}
                      </div>
                    </div>

                    {/* User message mock */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                      <div style={{ backgroundColor: themeColor, color: 'white', borderRadius: '12px', borderTopRightRadius: '4px', padding: '10px 14px', fontSize: '13px', maxWidth: '260px' }}>
                        Hei, jeg trenger hjelp!
                      </div>
                    </div>
                  </div>

                  {/* Widget Input */}
                  <div style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#94a3b8' }}>
                      Skriv en melding...
                    </div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <span style={{ color: 'white', fontSize: '16px' }}>→</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', textAlign: 'center' }}>
                  Slik vil chatten se ut på {domain || 'ditt nettsted'}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
