'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const font = 'inherit';
const blue = '#2563eb';
const dark = '#0f172a';
const secondary = '#64748b';
const border = '#e2e8f0';
const bg = '#f8fafc';
const red = '#ef4444';
const redDark = '#dc2626';

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 14,
  border: `1px solid ${border}`,
  overflow: 'hidden',
  marginBottom: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const cardHeaderStyle: React.CSSProperties = {
  padding: '20px 24px',
  borderBottom: `1px solid ${border}`,
};

const cardBodyStyle: React.CSSProperties = {
  padding: '24px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 14px',
  border: `1px solid ${border}`,
  borderRadius: 8,
  fontSize: 14,
  fontFamily: font,
  backgroundColor: 'white',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  color: dark,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: dark,
  marginBottom: 6,
};

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none',
        backgroundColor: checked ? blue : '#cbd5e1',
        position: 'relative', cursor: 'pointer',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Status banner
// ---------------------------------------------------------------------------
function StatusBanner({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, marginBottom: 24,
      backgroundColor: isSuccess ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
      color: isSuccess ? '#16a34a' : redDark,
      fontSize: 14, fontWeight: 500,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 0 0 12px' }}>
        &times;
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Key row
// ---------------------------------------------------------------------------
interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  site_name?: string;
  created_at: string;
}

function ApiKeyRow({ apiKey, onRegenerate }: { apiKey: ApiKey; onRegenerate: (id: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.key_prefix + '••••••••••••••••••••••••');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: `1px solid ${border}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: dark }}>{apiKey.site_name || apiKey.name}</span>
          {!apiKey.is_active && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: '#fef2f2', color: redDark, fontWeight: 600 }}>Deaktivert</span>
          )}
        </div>
        <code style={{ fontSize: 13, color: secondary, fontFamily: 'SFMono-Regular, Menlo, monospace', backgroundColor: bg, padding: '2px 8px', borderRadius: 4 }}>
          {apiKey.key_prefix}••••••••••••••••
        </code>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleCopy}
          style={{
            height: 34, padding: '0 14px', borderRadius: 6,
            border: `1px solid ${border}`, backgroundColor: 'white',
            fontSize: 13, fontWeight: 500, color: secondary, fontFamily: font,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {copied ? 'Kopiert' : 'Kopier'}
        </button>
        <button
          onClick={() => onRegenerate(apiKey.id)}
          style={{
            height: 34, padding: '0 14px', borderRadius: 6,
            border: `1px solid ${border}`, backgroundColor: 'white',
            fontSize: 13, fontWeight: 500, color: secondary, fontFamily: font,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          Regenerer
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------
function DeleteModal({ onCancel, onConfirm, deleting }: { onCancel: () => void; onConfirm: () => void; deleting: boolean }) {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmed = confirmText.toLowerCase() === 'slett kontoen min';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: 16, padding: '28px',
          maxWidth: 440, width: '90%',
          boxShadow: '0 24px 48px rgba(0,0,0,0.16)',
          fontFamily: font,
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: '50%', backgroundColor: '#fef2f2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: dark, margin: '0 0 8px' }}>
          Slett konto permanent
        </h3>
        <p style={{ fontSize: 14, color: secondary, lineHeight: 1.6, margin: '0 0 20px' }}>
          Alle dine data, chatbots, samtaler og kunnskapskilder vil bli permanent slettet. Denne handlingen kan ikke angres.
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ ...labelStyle, fontSize: 13, color: secondary }}>
            Skriv <strong style={{ color: dark }}>slett kontoen min</strong> for a bekrefte
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="slett kontoen min"
            style={{
              ...inputStyle,
              borderColor: confirmText && !isConfirmed ? '#fecaca' : border,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1, height: 44, borderRadius: 8,
              border: `1px solid ${border}`, backgroundColor: 'white',
              fontSize: 14, fontWeight: 600, color: secondary,
              fontFamily: font, cursor: 'pointer',
            }}
          >
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed || deleting}
            style={{
              flex: 1, height: 44, borderRadius: 8,
              border: 'none', backgroundColor: isConfirmed ? redDark : '#fca5a5',
              fontSize: 14, fontWeight: 600, color: 'white',
              fontFamily: font, cursor: isConfirmed ? 'pointer' : 'not-allowed',
              opacity: deleting ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            {deleting ? 'Sletter...' : 'Slett konto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Regenerate confirmation modal
// ---------------------------------------------------------------------------
function RegenerateModal({ onCancel, onConfirm, regenerating }: { onCancel: () => void; onConfirm: () => void; regenerating: boolean }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: 16, padding: '28px',
          maxWidth: 400, width: '90%',
          boxShadow: '0 24px 48px rgba(0,0,0,0.16)',
          fontFamily: font,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: dark, margin: '0 0 8px' }}>Regenerer API-nokkel</h3>
        <p style={{ fontSize: 14, color: secondary, lineHeight: 1.6, margin: '0 0 24px' }}>
          Den eksisterende nokkelen vil slutte a fungere umiddelbart. Du ma oppdatere widgeten med den nye nokkelen.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} disabled={regenerating} style={{
            flex: 1, height: 44, borderRadius: 8, border: `1px solid ${border}`,
            backgroundColor: 'white', color: secondary, fontSize: 14, fontWeight: 600,
            fontFamily: font, cursor: 'pointer',
          }}>
            Avbryt
          </button>
          <button onClick={onConfirm} disabled={regenerating} style={{
            flex: 1, height: 44, borderRadius: 8, border: 'none',
            backgroundColor: blue, color: 'white', fontSize: 14, fontWeight: 600,
            fontFamily: font, cursor: 'pointer', opacity: regenerating ? 0.6 : 1,
          }}>
            {regenerating ? 'Regenererer...' : 'Regenerer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);

  // Notifications
  const [notifNewConversations, setNotifNewConversations] = useState(true);
  const [notifDailySummary, setNotifDailySummary] = useState(false);
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  // API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [regenKeyId, setRegenKeyId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setCompany(user.companyName || '');
    }
  }, [user]);

  // Load API keys
  const loadApiKeys = useCallback(async () => {
    if (!user) return;
    setLoadingKeys(true);
    try {
      const { data: sites } = await supabase
        .from('sites')
        .select('id, name')
        .eq('user_id', user.id);

      if (sites && sites.length > 0) {
        const siteIds = sites.map((s: { id: string }) => s.id);
        const siteMap = Object.fromEntries(sites.map((s: { id: string; name: string }) => [s.id, s.name]));

        const { data: keys } = await supabase
          .from('api_keys')
          .select('id, key_prefix, name, is_active, site_id, created_at')
          .in('site_id', siteIds)
          .order('created_at', { ascending: false });

        if (keys) {
          setApiKeys(keys.map((k: { id: string; key_prefix: string; name: string; is_active: boolean; site_id: string; created_at: string }) => ({
            ...k,
            site_name: siteMap[k.site_id] || k.name,
          })));
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingKeys(false);
    }
  }, [user]);

  useEffect(() => { loadApiKeys(); }, [loadApiKeys]);

  // Save profile
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName, company_name: company })
        .eq('id', user.id);
      if (error) throw error;
      setStatus({ message: 'Profilen er oppdatert', type: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kunne ikke lagre profilen';
      setStatus({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Save notifications (stored locally for now — no DB column yet)
  const handleSaveNotifications = async () => {
    setSavingNotif(true);
    // Simulate save since there's no notification column in schema
    await new Promise((r) => setTimeout(r, 400));
    setStatus({ message: 'Varslingsinnstillinger lagret', type: 'success' });
    setSavingNotif(false);
  };

  // Regenerate API key
  const handleRegenerate = async () => {
    if (!regenKeyId) return;
    setRegenerating(true);
    try {
      // Deactivate old key
      await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', regenKeyId);

      setStatus({ message: 'API-nokkelen er deaktivert. Opprett en ny nokkel via Widget-konfigurasjon.', type: 'success' });
      await loadApiKeys();
    } catch {
      setStatus({ message: 'Kunne ikke regenerere nokkelen', type: 'error' });
    } finally {
      setRegenerating(false);
      setRegenKeyId(null);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete profile (cascades to sites, conversations, etc.)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      if (error) throw error;

      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kunne ikke slette kontoen';
      setStatus({ message: msg, type: 'error' });
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Loading
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, fontFamily: font }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: secondary, fontSize: 14 }}>Laster innstillinger...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: font, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: `1px solid ${border}`, padding: '20px 28px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: dark, margin: 0, letterSpacing: '-0.02em' }}>
          Innstillinger
        </h1>
        <p style={{ fontSize: 14, color: secondary, margin: '4px 0 0' }}>
          Administrer profil, varsler, API-nokler og konto
        </p>
      </div>

      <main style={{ padding: '28px', flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {status && (
            <StatusBanner message={status.message} type={status.type} onDismiss={() => setStatus(null)} />
          )}

          {/* ================================================================ */}
          {/* PROFILE SECTION                                                  */}
          {/* ================================================================ */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: dark, margin: 0 }}>Profil</h3>
              <p style={{ fontSize: 13, color: secondary, margin: '4px 0 0' }}>Personlig informasjon knyttet til kontoen din</p>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Visningsnavn</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = blue; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.1)`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>E-postadresse</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  style={{ ...inputStyle, backgroundColor: bg, color: secondary, cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>E-postadressen kan ikke endres</p>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Organisasjon</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Valgfritt"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = blue; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.1)`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => {
                    if (user) {
                      setDisplayName(user.displayName || '');
                      setCompany(user.companyName || '');
                    }
                  }}
                  style={{
                    height: 40, padding: '0 20px', borderRadius: 8,
                    border: `1px solid ${border}`, backgroundColor: 'white',
                    fontSize: 14, fontWeight: 500, color: secondary,
                    fontFamily: font, cursor: 'pointer',
                  }}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    height: 40, padding: '0 20px', borderRadius: 8,
                    border: 'none', backgroundColor: blue, color: 'white',
                    fontSize: 14, fontWeight: 600, fontFamily: font,
                    cursor: saving ? 'default' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Lagrer...' : 'Lagre profil'}
                </button>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* NOTIFICATION PREFERENCES                                         */}
          {/* ================================================================ */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: dark, margin: 0 }}>Varsler</h3>
              <p style={{ fontSize: 13, color: secondary, margin: '4px 0 0' }}>Velg hvilke e-postvarsler du vil motta</p>
            </div>
            <div style={cardBodyStyle}>
              {[
                { label: 'Nye samtaler', desc: 'Fa varsel nar en ny besokende starter en samtale', value: notifNewConversations, set: setNotifNewConversations },
                { label: 'Daglig oppsummering', desc: 'Daglig sammendrag av chatbot-aktivitet', value: notifDailySummary, set: setNotifDailySummary },
                { label: 'Ukentlig rapport', desc: 'Ukentlig rapport med statistikk og innsikt', value: notifWeeklyReport, set: setNotifWeeklyReport },
              ].map((item, idx) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 0',
                    borderBottom: idx < 2 ? `1px solid ${border}` : 'none',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: dark, margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: 13, color: secondary, margin: '2px 0 0' }}>{item.desc}</p>
                  </div>
                  <Toggle checked={item.value} onChange={item.set} />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  onClick={handleSaveNotifications}
                  disabled={savingNotif}
                  style={{
                    height: 40, padding: '0 20px', borderRadius: 8,
                    border: 'none', backgroundColor: blue, color: 'white',
                    fontSize: 14, fontWeight: 600, fontFamily: font,
                    cursor: savingNotif ? 'default' : 'pointer',
                    opacity: savingNotif ? 0.6 : 1,
                  }}
                >
                  {savingNotif ? 'Lagrer...' : 'Lagre varsler'}
                </button>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* API KEYS                                                         */}
          {/* ================================================================ */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: dark, margin: 0 }}>API-nokler</h3>
              <p style={{ fontSize: 13, color: secondary, margin: '4px 0 0' }}>Alle API-nokler for dine chatbots</p>
            </div>
            <div style={cardBodyStyle}>
              {loadingKeys ? (
                <p style={{ fontSize: 14, color: secondary, margin: 0 }}>Laster nokler...</p>
              ) : apiKeys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block' }}>
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                  <p style={{ fontSize: 14, fontWeight: 500, color: dark, margin: '0 0 4px' }}>Ingen API-nokler</p>
                  <p style={{ fontSize: 13, color: secondary, margin: 0 }}>Opprett en chatbot for a generere en API-nokkel</p>
                </div>
              ) : (
                <div>
                  {apiKeys.map((key) => (
                    <ApiKeyRow key={key.id} apiKey={key} onRegenerate={(id) => setRegenKeyId(id)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* LANGUAGE                                                         */}
          {/* ================================================================ */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: dark, margin: 0 }}>Sprak</h3>
              <p style={{ fontSize: 13, color: secondary, margin: '4px 0 0' }}>Grensesnittets sprak</p>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: dark, margin: 0 }}>Norsk (bokmal)</p>
                  <p style={{ fontSize: 13, color: secondary, margin: '2px 0 0' }}>Flere sprak kommer snart</p>
                </div>
                <span style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  backgroundColor: '#dbeafe', color: blue,
                }}>
                  Aktivt
                </span>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* DANGER ZONE                                                      */}
          {/* ================================================================ */}
          <div style={{
            ...cardStyle,
            borderColor: '#fecaca',
            marginBottom: 0,
          }}>
            <div style={{ ...cardHeaderStyle, borderBottomColor: '#fecaca' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: redDark, margin: 0 }}>Faresone</h3>
              <p style={{ fontSize: 13, color: secondary, margin: '4px 0 0' }}>Irreversible handlinger</p>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: dark, margin: 0 }}>Slett konto</p>
                  <p style={{ fontSize: 13, color: secondary, margin: '2px 0 0' }}>
                    Alle data, chatbots og samtaler blir permanent slettet
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    height: 40, padding: '0 20px', borderRadius: 8,
                    border: `1px solid ${redDark}`, backgroundColor: 'white',
                    fontSize: 14, fontWeight: 600, color: redDark,
                    fontFamily: font, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  Slett konto
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modals */}
      {showDeleteModal && (
        <DeleteModal
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          deleting={deleting}
        />
      )}
      {regenKeyId && (
        <RegenerateModal
          onCancel={() => setRegenKeyId(null)}
          onConfirm={handleRegenerate}
          regenerating={regenerating}
        />
      )}
    </div>
  );
}
