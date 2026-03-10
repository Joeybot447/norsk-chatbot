'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../_lib/supabase/hooks';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const colors = {
  blue: '#2563eb',
  blueHover: '#1d4ed8',
  blueBg: '#eff6ff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  bg: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
  success: '#16a34a',
  successBg: '#dcfce7',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  warning: '#d97706',
  warningBg: '#fef3c7',
  warningBorder: '#fbbf24',
  white: '#ffffff',
};

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 14px',
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 14,
  fontFamily,
  color: colors.text,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: colors.text,
  marginBottom: 6,
};

export default function NewSitePage() {
  const router = useRouter();
  const { user, getAccessToken } = useAuth();
  const [siteName, setSiteName] = useState('');
  const [domain, setDomain] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hei! Hvordan kan jeg hjelpe deg i dag?');
  const [botName, setBotName] = useState('NorskBot');
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!siteName.trim()) errors.siteName = 'Nettstedsnavn er pakrevd';
    if (!domain.trim()) errors.domain = 'Domene er pakrevd';
    else if (!/^https?:\/\//.test(domain.trim()) && !/^[a-zA-Z0-9]/.test(domain.trim())) {
      errors.domain = 'Oppgi en gyldig nettadresse';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Ikke autentisert. Prov a logge inn pa nytt.');
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          name: siteName.trim(),
          domain: domain.trim(),
          welcomeMessage,
          botName,
          themeConfig: { primaryColor: themeColor, position: 'bottom-right' },
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
        router.push('/dashboard/sites');
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
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = colors.blue;
    e.target.style.boxShadow = `0 0 0 3px ${colors.blueBg}`;
  };
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = colors.border;
    e.target.style.boxShadow = 'none';
  };

  // ── API key success screen ──
  if (createdApiKey) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', fontFamily, alignItems: 'center',
        justifyContent: 'center', minHeight: '70vh', padding: 32, backgroundColor: colors.bg,
      }}>
        <div style={{
          backgroundColor: colors.white, borderRadius: 16, border: `1px solid ${colors.border}`,
          padding: 48, maxWidth: 520, width: '100%', textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, backgroundColor: colors.successBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Nettsted opprettet</h2>
          <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 28, lineHeight: 1.6 }}>
            Her er API-nokkelen din. Den brukes i widget-koden for a koble chatboten til nettstedet ditt.
          </p>

          <div style={{
            background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10,
            padding: 16, marginBottom: 16,
          }}>
            <code style={{ fontSize: 13, color: colors.text, wordBreak: 'break-all', fontFamily: 'SF Mono, Menlo, monospace', lineHeight: 1.5 }}>
              {createdApiKey}
            </code>
          </div>

          <button
            onClick={handleCopyKey}
            style={{
              padding: '12px 24px', width: '100%',
              backgroundColor: copied ? colors.success : colors.blue,
              color: colors.white, border: 'none', borderRadius: 10, cursor: 'pointer',
              fontWeight: 600, fontSize: 14, fontFamily, marginBottom: 16,
              transition: 'background-color 0.2s',
            }}
          >
            {copied ? 'Kopiert til utklippstavle' : 'Kopier API-nokkel'}
          </button>

          <div style={{
            background: colors.warningBg, border: `1px solid ${colors.warningBorder}`,
            borderRadius: 10, padding: '14px 16px', marginBottom: 28, textAlign: 'left',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p style={{ fontSize: 13, color: '#92400e', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
              Lagre denne nokkelen na. Den vises bare en gang og kan ikke hentes fram igjen.
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard/sites')}
            style={{
              display: 'inline-block', padding: '12px 24px',
              backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
              borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: 14, fontFamily,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.borderLight; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.bg; }}
          >
            Ga til nettsteder
          </button>
        </div>
      </div>
    );
  }

  // ── Create form ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily, backgroundColor: colors.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: colors.white, borderBottom: `1px solid ${colors.border}`, padding: '16px 32px' }}>
        <button
          onClick={() => router.push('/dashboard/sites')}
          style={{
            background: 'none', border: 'none', color: colors.blue, cursor: 'pointer',
            fontSize: 14, fontFamily, padding: 0, marginBottom: 6, display: 'flex',
            alignItems: 'center', gap: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Tilbake til nettsteder
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, margin: 0, letterSpacing: '-0.02em' }}>Opprett nytt nettsted</h1>
      </div>

      {/* Content */}
      <main style={{ padding: 32, flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, maxWidth: 1100 }}>
          {/* Form */}
          <div style={{
            backgroundColor: colors.white, borderRadius: 14, border: `1px solid ${colors.border}`,
            padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, margin: '0 0 24px' }}>Nettstedsinformasjon</h2>

            {error && (
              <div style={{
                background: colors.dangerBg, border: '1px solid #fecaca', borderRadius: 10,
                padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <p style={{ fontSize: 13, color: colors.danger, margin: 0 }}>{error}</p>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Nettstedsnavn</label>
              <input
                type="text" value={siteName} onChange={(e) => { setSiteName(e.target.value); setFieldErrors((p) => ({ ...p, siteName: '' })); }}
                placeholder="F.eks. Min Bedrift AS"
                style={{ ...inputStyle, borderColor: fieldErrors.siteName ? colors.danger : colors.border }}
                onFocus={handleInputFocus} onBlur={handleInputBlur}
              />
              {fieldErrors.siteName && <p style={{ fontSize: 12, color: colors.danger, margin: '4px 0 0' }}>{fieldErrors.siteName}</p>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Domene</label>
              <input
                type="text" value={domain} onChange={(e) => { setDomain(e.target.value); setFieldErrors((p) => ({ ...p, domain: '' })); }}
                placeholder="https://minbedrift.no"
                style={{ ...inputStyle, borderColor: fieldErrors.domain ? colors.danger : colors.border }}
                onFocus={handleInputFocus} onBlur={handleInputBlur}
              />
              {fieldErrors.domain && <p style={{ fontSize: 12, color: colors.danger, margin: '4px 0 0' }}>{fieldErrors.domain}</p>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Bot-navn</label>
              <input
                type="text" value={botName} onChange={(e) => setBotName(e.target.value)}
                placeholder="NorskBot"
                style={inputStyle}
                onFocus={handleInputFocus} onBlur={handleInputBlur}
              />
              <p style={{ fontSize: 12, color: colors.textMuted, margin: '4px 0 0' }}>Navnet som vises i chat-vinduet.</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Velkomstmelding</label>
              <textarea
                value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3}
                style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical' as const }}
                onFocus={handleInputFocus as any} onBlur={handleInputBlur as any}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ ...labelStyle, marginBottom: 12 }}>Temafarge</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {themeColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setThemeColor(c.value)}
                    style={{
                      width: 40, height: 40, borderRadius: 10, backgroundColor: c.value,
                      border: themeColor === c.value ? `2px solid ${colors.text}` : '2px solid transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                      boxShadow: themeColor === c.value ? `0 0 0 2px ${colors.white}, 0 0 0 4px ${c.value}40` : 'none',
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '12px 28px', backgroundColor: submitting ? '#93c5fd' : colors.blue,
                color: colors.white, border: 'none', borderRadius: 10, cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: 15, fontFamily, transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = colors.blue; }}
            >
              {submitting ? 'Oppretter...' : 'Opprett nettsted'}
            </button>
          </div>

          {/* Preview */}
          <div style={{ position: 'sticky' as const, top: 24, alignSelf: 'start' }}>
            <div style={{
              backgroundColor: colors.white, borderRadius: 14, border: `1px solid ${colors.border}`,
              padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: '0 0 16px' }}>Forhandsvisning</h3>

              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                {/* Chat header */}
                <div style={{
                  backgroundColor: themeColor, color: colors.white, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em',
                  }}>
                    {(botName || 'N').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{botName || 'NorskBot'}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>Tilgjengelig na</div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ backgroundColor: colors.bg, padding: '18px 16px', minHeight: 180 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', backgroundColor: themeColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: colors.white, flexShrink: 0,
                    }}>
                      {(botName || 'N').charAt(0).toUpperCase()}
                    </div>
                    <div style={{
                      backgroundColor: colors.white, border: `1px solid ${colors.border}`,
                      borderRadius: '12px 12px 12px 4px', padding: '10px 14px',
                      fontSize: 13, color: colors.text, maxWidth: 240, lineHeight: 1.5,
                    }}>
                      {welcomeMessage || 'Hei! Hvordan kan jeg hjelpe deg?'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{
                      backgroundColor: themeColor, color: colors.white,
                      borderRadius: '12px 12px 4px 12px', padding: '10px 14px',
                      fontSize: 13, maxWidth: 240,
                    }}>
                      Hei, jeg trenger hjelp!
                    </div>
                  </div>
                </div>

                {/* Input area */}
                <div style={{
                  backgroundColor: colors.white, borderTop: `1px solid ${colors.border}`,
                  padding: '10px 14px', display: 'flex', gap: 8,
                }}>
                  <div style={{
                    flex: 1, padding: '8px 12px', backgroundColor: colors.bg,
                    borderRadius: 8, border: `1px solid ${colors.border}`,
                    fontSize: 12, color: '#94a3b8',
                  }}>
                    Skriv en melding...
                  </div>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, backgroundColor: themeColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 14, textAlign: 'center' }}>
                Slik vil chatten se ut pa {domain || 'ditt nettsted'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
