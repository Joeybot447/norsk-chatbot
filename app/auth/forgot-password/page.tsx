'use client';

import { useState } from 'react';
import { resetPassword } from '@/lib/supabase/auth';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 40, height: 40, backgroundColor: '#2563eb', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: '#fff' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', fontFamily }}>NorskBot</span>
          </a>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          padding: '36px 32px',
        }}>
          {!sent ? (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', fontFamily }}>
                Glemt passord?
              </h1>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px', lineHeight: 1.5, fontFamily }}>
                Skriv inn e-postadressen din, så sender vi deg en lenke for å tilbakestille passordet.
              </p>

              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 500,
                  marginBottom: 20, fontFamily,
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{
                    display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b',
                    marginBottom: 6, fontFamily,
                  }}>
                    E-postadresse
                  </label>
                  <input
                    type="email"
                    placeholder="din@epost.no"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    required
                    style={{
                      width: '100%', height: 48, padding: '0 14px',
                      border: `1px solid ${focused ? '#2563eb' : '#e2e8f0'}`,
                      borderRadius: 8, fontSize: 14, fontFamily,
                      backgroundColor: focused ? '#fff' : '#f8fafc',
                      outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', height: 48, borderRadius: 8, border: 'none',
                    backgroundColor: '#2563eb', color: '#fff', fontSize: 15,
                    fontWeight: 600, fontFamily, cursor: 'pointer',
                    opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{
                        display: 'inline-block', width: 18, height: 18,
                        border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                      }} />
                      Sender...
                    </span>
                  ) : 'Send tilbakestillingslenke'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', backgroundColor: '#f0fdf4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: '#16a34a' }}>
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', fontFamily }}>
                Sjekk e-posten din
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 4px', lineHeight: 1.5, fontFamily }}>
                Vi har sendt deg en e-post med instruksjoner
              </p>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5, fontFamily }}>
                for å tilbakestille passordet ditt til <strong style={{ color: '#0f172a' }}>{email}</strong>.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                style={{
                  background: 'none', border: 'none', color: '#2563eb',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily,
                }}
              >
                Prøv en annen e-postadresse
              </button>
            </div>
          )}
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/auth" style={{
            fontSize: 14, color: '#2563eb', textDecoration: 'none', fontWeight: 500, fontFamily,
          }}>
            ← Tilbake til innlogging
          </a>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: '#64748b', fontFamily }}>
          {'© 2026 NorskBot \u2014 '}
          <a href="/personvern" style={{ color: '#2563eb', textDecoration: 'none' }}>Personvern</a>
          {' \u00B7 '}
          <a href="/brukervilkar" style={{ color: '#2563eb', textDecoration: 'none' }}>Vilkår</a>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
