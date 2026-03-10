'use client';

import { useState } from 'react';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export default function SettingsPage() {
  const [email, setEmail] = useState('admin@norskbot.no');
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');

  const handleSave = () => {
    alert('Innstillinger lagret!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Innstillinger</h1>
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px', flex: 1, overflow: 'auto', maxWidth: '900px' }}>
        {/* Kontoinnstillinger */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Kontoinnstillinger</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>Administrer kontoinformasjonen din</p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#0f172a', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>E-postadresse</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily,
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#0f172a', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>Fullt navn</label>
              <input
                type="text"
                defaultValue="Admin Bruker"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily,
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#0f172a', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>Organisasjon</label>
              <input
                type="text"
                defaultValue="NorskBot AS"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily,
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
          </div>
        </div>

        {/* API-innstillinger */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>API-innstillinger</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>Administrer API-nokler og tilgang</p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <p style={{ color: '#0f172a', fontWeight: '500', fontSize: '14px', margin: 0 }}>Produksjons-API-nokkel</p>
                  <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>sk-prod-••••••••••••••••</p>
                </div>
                <button
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    fontFamily,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                  Kopier
                </button>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Opprettet 1. mars 2024</p>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <p style={{ color: '#0f172a', fontWeight: '500', fontSize: '14px', margin: 0 }}>Utviklings-API-nokkel</p>
                  <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>sk-dev-••••••••••••••••</p>
                </div>
                <button
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    fontFamily,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                  Kopier
                </button>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>Opprettet 15. februar 2024</p>
            </div>

            <button
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#2563eb',
                border: '1px solid #2563eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#eff6ff';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'white';
              }}
            >
              + Generer ny API-nokkel
            </button>
          </div>
        </div>

        {/* Preferanser */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Preferanser</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>Tilpass opplevelsen din</p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#0f172a', fontWeight: '500', fontSize: '14px', margin: 0 }}>E-postvarsler</p>
                <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>Motta e-postoppdateringer om kontoen din</p>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                style={{ width: '24px', height: '24px', cursor: 'pointer' }}
              />
            </div>
            <div style={{ marginBottom: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', color: '#0f172a', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>Tema</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  fontFamily,
                }}
              >
                <option value="light">Lyst</option>
                <option value="dark">Morkt</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Faresone */}
        <div style={{ backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #fee2e2' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#991b1b', margin: 0 }}>Faresone</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>Irreversible handlinger</p>
          </div>
          <div style={{ padding: '20px' }}>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
            >
              Slett konto
            </button>
          </div>
        </div>

        {/* Lagre-knapper */}
        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            Lagre endringer
          </button>
          <button
            style={{
              padding: '10px 24px',
              backgroundColor: 'white',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'white';
            }}
          >
            Avbryt
          </button>
        </div>
      </main>
    </div>
  );
}
