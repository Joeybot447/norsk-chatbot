'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

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

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: '28px 24px',
  marginBottom: 24,
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [focusedField, setFocusedField] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
      setCompany(user.companyName || '');
    }
  }, [user]);

  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  const getInputStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focusedField === field ? '#2563eb' : '#e2e8f0',
    backgroundColor: focusedField === field ? '#fff' : '#f8fafc',
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: name,
          company_name: company,
        })
        .eq('id', user.id);

      if (error) throw error;
      setMessage('Profilen er oppdatert!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.';
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passordene stemmer ikke overens');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Passordet må være minst 8 tegn');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMessage('Passordet er endret!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Noe gikk galt. Prøv igjen.';
      setPasswordMessage(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;
      await supabase.auth.signOut();
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kunne ikke slette kontoen. Prøv igjen.';
      setMessage(msg);
      setDeleting(false);
      setShowDeleteConfirm(false);
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
    <div style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto', fontFamily }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', fontFamily }}>
        Min profil
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px', fontFamily }}>
        Administrer kontoinformasjonen din
      </p>

      {/* Profile Header */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', backgroundColor: '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 24, fontWeight: 700, fontFamily,
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', fontFamily }}>{name || 'Ukjent'}</div>
            <div style={{ fontSize: 14, color: '#64748b', fontFamily }}>{email}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', fontFamily, marginTop: 2 }}>{company || ''}</div>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: 8,
            backgroundColor: message.includes('oppdatert') ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.includes('oppdatert') ? '#bbf7d0' : '#fecaca'}`,
            color: message.includes('oppdatert') ? '#16a34a' : '#dc2626',
            fontSize: 13, fontWeight: 500, marginBottom: 20, fontFamily,
          }}>
            {message}
          </div>
        )}

        {/* Profile Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Fullt navn</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField('')}
              style={getInputStyle('name')}
            />
          </div>
          <div>
            <label style={labelStyle}>E-postadresse</label>
            <input
              type="email" value={email} disabled
              style={{ ...getInputStyle('email'), color: '#94a3b8', cursor: 'not-allowed' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Bedrift</label>
            <input
              type="text" value={company} onChange={(e) => setCompany(e.target.value)}
              onFocus={() => setFocusedField('company')} onBlur={() => setFocusedField('')}
              style={getInputStyle('company')}
            />
          </div>
          <div>
            <label style={labelStyle}>Telefon</label>
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField('')}
              style={getInputStyle('phone')}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              if (user) {
                setName(user.displayName || '');
                setEmail(user.email || '');
                setCompany(user.companyName || '');
                setPhone('');
                setMessage('');
              }
            }}
            style={{
              height: 48, padding: '0 24px', borderRadius: 8, border: '1px solid #e2e8f0',
              backgroundColor: '#fff', color: '#64748b', fontSize: 14, fontWeight: 600,
              fontFamily, cursor: 'pointer',
            }}
          >
            Avbryt
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            style={{
              height: 48, padding: '0 24px', borderRadius: 8, border: 'none',
              backgroundColor: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600,
              fontFamily, cursor: 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Lagrer...' : 'Lagre endringer'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: '0 0 4px', fontFamily }}>
          Endre passord
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', fontFamily }}>
          Sørg for at kontoen din bruker et langt, tilfeldig passord for å holde den sikker.
        </p>

        {passwordMessage && (
          <div style={{
            padding: '12px 16px', borderRadius: 8,
            backgroundColor: passwordMessage.includes('endret') ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${passwordMessage.includes('endret') ? '#bbf7d0' : '#fecaca'}`,
            color: passwordMessage.includes('endret') ? '#16a34a' : '#dc2626',
            fontSize: 13, fontWeight: 500, marginBottom: 20, fontFamily,
          }}>
            {passwordMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nåværende passord</label>
            <input
              type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              onFocus={() => setFocusedField('currentPassword')} onBlur={() => setFocusedField('')}
              placeholder="••••••••"
              style={getInputStyle('currentPassword')}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nytt passord</label>
              <input
                type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setFocusedField('newPassword')} onBlur={() => setFocusedField('')}
                placeholder="Minst 8 tegn"
                style={getInputStyle('newPassword')}
              />
            </div>
            <div>
              <label style={labelStyle}>Bekreft nytt passord</label>
              <input
                type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField('')}
                placeholder="Gjenta passordet"
                style={getInputStyle('confirmPassword')}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            style={{
              height: 48, padding: '0 24px', borderRadius: 8, border: 'none',
              backgroundColor: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600,
              fontFamily, cursor: 'pointer',
              opacity: (savingPassword || !currentPassword || !newPassword) ? 0.5 : 1,
            }}
          >
            {savingPassword ? 'Endrer...' : 'Endre passord'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{
        ...sectionStyle,
        borderColor: '#fecaca',
        marginBottom: 0,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#dc2626', margin: '0 0 4px', fontFamily }}>
          Faresone
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', fontFamily }}>
          Når kontoen din er slettet, vil alle ressurser og data bli permanent fjernet. Denne handlingen kan ikke angres.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              height: 48, padding: '0 24px', borderRadius: 8,
              border: '1px solid #dc2626', backgroundColor: '#fff',
              color: '#dc2626', fontSize: 14, fontWeight: 600,
              fontFamily, cursor: 'pointer',
            }}
          >
            Slett kontoen min
          </button>
        ) : (
          <div style={{
            padding: 16, borderRadius: 8, backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
          }}>
            <p style={{ fontSize: 14, color: '#dc2626', fontWeight: 600, margin: '0 0 12px', fontFamily }}>
              Er du sikker? Denne handlingen kan ikke angres.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  height: 40, padding: '0 20px', borderRadius: 8, border: '1px solid #e2e8f0',
                  backgroundColor: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600,
                  fontFamily, cursor: 'pointer',
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{
                  height: 40, padding: '0 20px', borderRadius: 8, border: 'none',
                  backgroundColor: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600,
                  fontFamily, cursor: 'pointer', opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Sletter...' : 'Ja, slett kontoen min'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
