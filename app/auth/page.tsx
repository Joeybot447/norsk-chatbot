'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/supabase/auth';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  padding: '0 14px',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 14,
  fontFamily,
  backgroundColor: '#f8fafc',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#64748b',
  marginBottom: 6,
  fontFamily,
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  borderRadius: 8,
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  fontFamily,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const socialBtnStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  backgroundColor: '#fff',
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 600,
  fontFamily,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  transition: 'background-color 0.2s',
};

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focusedField, setFocusedField] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [regCompany, setRegCompany] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await signIn(loginEmail, loginPass);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Innlogging feilet');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!termsAccepted) {
      setError('Du må godta brukervilkårene og personvernerklæringen');
      return;
    }
    if (regPass !== regConfirmPass) {
      setError('Passordene stemmer ikke overens');
      return;
    }
    if (regPass.length < 8) {
      setError('Passordet må være minst 8 tegn');
      return;
    }
    setLoading(true);
    try {
      await signUp(regEmail, regPass, {
        displayName: regName,
        companyName: regCompany,
      });
      setSuccess('Konto opprettet! Sjekk e-posten din for å bekrefte kontoen.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrering feilet');
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (name: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focusedField === name ? '#2563eb' : '#e2e8f0',
    backgroundColor: focusedField === name ? '#fff' : '#f8fafc',
  });

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    textAlign: 'center',
    padding: '12px 0',
    fontSize: 14,
    fontWeight: 600,
    fontFamily,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    color: active ? '#2563eb' : '#64748b',
    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
    transition: 'color 0.2s, border-color 0.2s',
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
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
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: 28 }}>
            <button style={tabStyle(activeTab === 'login')} onClick={() => { setActiveTab('login'); clearMessages(); }}>
              Logg inn
            </button>
            <button style={tabStyle(activeTab === 'register')} onClick={() => { setActiveTab('register'); clearMessages(); }}>
              Registrer
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2',
              border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 500,
              marginBottom: 20, fontFamily,
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              padding: '12px 16px', borderRadius: 8, backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 13, fontWeight: 500,
              marginBottom: 20, fontFamily,
            }}>
              {success}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>E-postadresse</label>
                <input
                  type="email"
                  placeholder="din@epost.no"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onFocus={() => setFocusedField('loginEmail')}
                  onBlur={() => setFocusedField('')}
                  required
                  style={getInputStyle('loginEmail')}
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Passord</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  onFocus={() => setFocusedField('loginPass')}
                  onBlur={() => setFocusedField('')}
                  required
                  style={getInputStyle('loginPass')}
                />
              </div>
              <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <a href="/auth/forgot-password" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontFamily }}>
                  Glemt passord?
                </a>
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Logger inn...
                  </span>
                ) : 'Logg inn'}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: 12 }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                <span style={{ fontSize: 12, color: '#94a3b8', fontFamily }}>eller</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              </div>

              {/* Social buttons */}
              {/* TODO: Implement OAuth - GitHub and Google login */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button type="button" style={{ ...socialBtnStyle, opacity: 0.6, cursor: 'default' }} title="Kommer snart" onClick={() => {}}>
                  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="#0f172a"/>
                  </svg>
                  Fortsett med GitHub (kommer snart)
                </button>
                <button type="button" style={{ ...socialBtnStyle, opacity: 0.6, cursor: 'default' }} title="Kommer snart" onClick={() => {}}>
                  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Fortsett med Google (kommer snart)
                </button>
              </div>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Bedriftsnavn</label>
                <input
                  type="text"
                  placeholder="Ditt Firma AS"
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  onFocus={() => setFocusedField('regCompany')}
                  onBlur={() => setFocusedField('')}
                  required
                  style={getInputStyle('regCompany')}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Fullt navn</label>
                <input
                  type="text"
                  placeholder="Ola Nordmann"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  onFocus={() => setFocusedField('regName')}
                  onBlur={() => setFocusedField('')}
                  required
                  style={getInputStyle('regName')}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>E-postadresse</label>
                <input
                  type="email"
                  placeholder="din@epost.no"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  onFocus={() => setFocusedField('regEmail')}
                  onBlur={() => setFocusedField('')}
                  required
                  style={getInputStyle('regEmail')}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Passord</label>
                <input
                  type="password"
                  placeholder="Minst 8 tegn"
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  onFocus={() => setFocusedField('regPass')}
                  onBlur={() => setFocusedField('')}
                  required
                  style={getInputStyle('regPass')}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Bekreft passord</label>
                <input
                  type="password"
                  placeholder="Gjenta passordet"
                  value={regConfirmPass}
                  onChange={(e) => setRegConfirmPass(e.target.value)}
                  onFocus={() => setFocusedField('regConfirmPass')}
                  onBlur={() => setFocusedField('')}
                  required
                  style={getInputStyle('regConfirmPass')}
                />
              </div>
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: 3, accentColor: '#2563eb' }}
                />
                <label htmlFor="terms" style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, fontFamily, cursor: 'pointer' }}>
                  Jeg godtar{' '}
                  <a href="/brukervilkar" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                    brukervilkårene
                  </a>{' '}
                  og{' '}
                  <a href="/personvern" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                    personvernerklæringen
                  </a>
                </label>
              </div>
              <button
                type="submit"
                disabled={loading || !termsAccepted}
                style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Oppretter konto...
                  </span>
                ) : 'Opprett konto'}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: 12 }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                <span style={{ fontSize: 12, color: '#94a3b8', fontFamily }}>eller</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
              </div>

              {/* TODO: Implement OAuth - GitHub and Google registration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button type="button" style={{ ...socialBtnStyle, opacity: 0.6, cursor: 'default' }} title="Kommer snart" onClick={() => {}}>
                  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="#0f172a"/>
                  </svg>
                  Fortsett med GitHub (kommer snart)
                </button>
                <button type="button" style={{ ...socialBtnStyle, opacity: 0.6, cursor: 'default' }} title="Kommer snart" onClick={() => {}}>
                  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Fortsett med Google (kommer snart)
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: '#64748b', fontFamily }}>
          <a href="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>← Tilbake til forsiden</a>
          <div style={{ marginTop: 12 }}>
            © 2026 NorskBot —{' '}
            <a href="/personvern" style={{ color: '#2563eb', textDecoration: 'none' }}>Personvern</a>{' · '}
            <a href="/brukervilkar" style={{ color: '#2563eb', textDecoration: 'none' }}>Vilkår</a>
          </div>
        </div>

        {/* Spinner keyframe */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
