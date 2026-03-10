'use client';

import { useState } from 'react';
import { supabase } from '../../../_lib/supabase/client';
import { useAuth } from '../../../_lib/supabase/hooks';

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

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
  const { user } = useAuth();
  const [siteName, setSiteName] = useState('');
  const [domain, setDomain] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hei! Hvordan kan jeg hjelpe deg i dag?');
  const [botName, setBotName] = useState('NorskBot');
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!siteName.trim() || !domain.trim()) {
      setError('Nettstedsnavn og domene er påkrevd');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session?.session?.access_token,
        },
        body: JSON.stringify({
          name: siteName,
          domain: domain,
          welcomeMessage: welcomeMessage,
          botName: botName,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Kunne ikke opprette nettsted');
      }
      const data = await response.json();
      if (data.apiKey) {
        setCreatedApiKey(data.apiKey);
      } else {
        window.location.href = '/dashboard/sites';
      }
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyKey = async () => {
    if (createdApiKey) {
      await navigator.clipboard.writeText(createdApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // API key success modal
  if (createdApiKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: fontStack, alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px', maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Nettsted opprettet!</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
            Her er API-nøkkelen din. Den brukes i widget-koden for å koble chatboten til nettstedet ditt.
          </p>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px', marginBottom: 16, position: 'relative' as const }}>
            <code style={{ fontSize: 14, color: '#0f172a', wordBreak: 'break-all' as const, fontFamily: 'monospace' }}>{createdApiKey}</code>
          </div>

          <button
            onClick={handleCopyKey}
            style={{
              padding: '10px 24px',
              backgroundColor: copied ? '#16a34a' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              fontFamily: fontStack,
              marginBottom: 16,
              transition: 'background-color 0.2s',
              width: '100%',
            }}
          >
            {copied ? '✓ Kopiert!' : 'Kopier API-nøkkel'}
          </button>

          <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: '#92400e', margin: 0, fontWeight: 600 }}>
              ⚠️ Lagre denne nøkkelen — den vises bare én gang!
            </p>
          </div>

          <a
            href="/dashboard/sites"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              backgroundColor: '#f1f5f9',
              color: '#0f172a',
              border: 'none',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '14px',
              fontFamily: fontStack,
            }}
          >
            Gå til nettsteder →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: fontStack }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <a href="/dashboard/sites" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>Tilbake til nettsteder</a>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 0 0' }}>Opprett nytt nettsted</h1>
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', maxWidth: '1200px' }}>
          {/* Form */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 24px 0' }}>Nettstedsinformasjon</h2>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Nettstedsnavn *</label>
              <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="F.eks. Min Bedrift AS"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: fontStack }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Domene-URL *</label>
              <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="https://minbedrift.no"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: fontStack }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Bot-navn</label>
              <input type="text" value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="NorskBot"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: fontStack }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '6px' }}>Velkomstmelding</label>
              <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const, fontFamily: fontStack }} />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '10px' }}>Temafarge</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                {themeColors.map((c) => (
                  <div key={c.value} onClick={() => setThemeColor(c.value)}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: c.value, cursor: 'pointer', border: themeColor === c.value ? '3px solid #0f172a' : '3px solid transparent', boxShadow: themeColor === c.value ? '0 0 0 2px white, 0 0 0 4px ' + c.value : 'none', transition: 'all 0.15s' }}
                    title={c.name} />
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Valgt: {themeColors.find(c => c.value === themeColor)?.name || themeColor}</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ padding: '12px 28px', backgroundColor: submitting ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px', fontFamily: fontStack, transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => { if (!submitting) (e.currentTarget.style.backgroundColor = '#1d4ed8'); }}
              onMouseLeave={(e) => { if (!submitting) (e.currentTarget.style.backgroundColor = '#2563eb'); }}>
              {submitting ? 'Oppretter...' : 'Opprett nettsted'}
            </button>
          </div>

          {/* Preview */}
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'sticky' as const, top: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Forhåndsvisning av widget</h3>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <div style={{ backgroundColor: themeColor, color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700' }}>N</div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{botName || 'NorskBot'}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Online nå</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '20px', minHeight: '200px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0 }}>N</div>
                    <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', borderTopLeftRadius: '4px', padding: '10px 14px', fontSize: '13px', color: '#0f172a', maxWidth: '260px' }}>
                      {welcomeMessage || 'Hei! Hvordan kan jeg hjelpe deg?'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: themeColor, color: 'white', borderRadius: '12px', borderTopRightRadius: '4px', padding: '10px 14px', fontSize: '13px', maxWidth: '260px' }}>
                      Hei, jeg trenger hjelp!
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#94a3b8' }}>
                    Skriv en melding...
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', textAlign: 'center' as const }}>
                Slik vil chatten se ut på {domain || 'ditt nettsted'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
