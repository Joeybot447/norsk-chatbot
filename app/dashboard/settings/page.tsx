'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.displayName || '');
      setCompany(user.companyName || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: fullName,
          company_name: company,
        })
        .eq('id', user.id);

      if (error) throw error;
      setMessage('Innstillinger lagret!');
      setMessageType('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kunne ikke lagre innstillinger';
      setMessage(msg);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', fontFamily }}>
        <p style={{ color: '#64748b', fontSize: '16px' }}>Laster...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Innstillinger</h1>
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px', flex: 1, overflow: 'auto', maxWidth: '900px' }}>
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${messageType === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: messageType === 'success' ? '#16a34a' : '#dc2626',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '24px',
          }}>
            {message}
          </div>
        )}

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
                disabled
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily,
                  boxSizing: 'border-box' as const,
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                }}
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', marginBottom: 0 }}>E-postadressen kan ikke endres her</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#0f172a', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>Fullt navn</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
                value={company}
                onChange={(e) => setCompany(e.target.value)}
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
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              API-nøkler administreres per nettsted. Gå til <strong>Widget-konfigurasjon</strong> for å se dine API-nøkler.
            </p>
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
            disabled={saving}
            style={{
              padding: '10px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: saving ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily,
              transition: 'background-color 0.2s',
              opacity: saving ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            {saving ? 'Lagrer...' : 'Lagre endringer'}
          </button>
          <button
            onClick={() => {
              if (user) {
                setFullName(user.displayName || '');
                setCompany(user.companyName || '');
                setMessage('');
              }
            }}
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
