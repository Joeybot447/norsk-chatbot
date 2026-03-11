'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../_lib/supabase/hooks';

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
      if (!token) throw new Error('Ikke autentisert. Prøv å logge inn pa nytt.');
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

  // ── API key success screen ──
  if (createdApiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 md:p-8 bg-slate-50">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-12 max-w-[520px] w-full text-center shadow-md">
          <div className="w-14 h-14 rounded-[14px] bg-green-50 flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl md:text-[22px] font-bold text-slate-900 mb-2">Nettsted opprettet</h2>
          <p className="text-sm text-slate-500 mb-7 leading-relaxed">
            Her er API-nøkkelen din. Den brukes i widget-koden for å koble chatboten til nettstedet ditt.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-4 mb-4">
            <code className="text-[13px] text-slate-900 break-all font-mono leading-relaxed">
              {createdApiKey}
            </code>
          </div>

          <button
            onClick={handleCopyKey}
            className={`w-full py-3 px-6 border-none rounded-[10px] cursor-pointer font-semibold text-sm text-white transition-colors mb-4 ${
              copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {copied ? 'Kopiert til utklippstavle' : 'Kopier API-nøkkel'}
          </button>

          <div className="bg-amber-50 border border-amber-300 rounded-[10px] p-3.5 mb-7 text-left flex gap-2.5 items-start">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-[13px] text-amber-800 font-medium leading-relaxed">
              Lagre denne nøkkelen nå. Den vises bare en gang og kan ikke hentes fram igjen.
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard/sites')}
            className="inline-block py-3 px-6 bg-slate-50 text-slate-900 border border-slate-200 rounded-[10px] cursor-pointer font-medium text-sm hover:bg-slate-100 transition-colors w-full sm:w-auto"
          >
            Gå til nettsteder
          </button>
        </div>
      </div>
    );
  }

  // ── Create form ──
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4">
        <button
          onClick={() => router.push('/dashboard/sites')}
          className="bg-transparent border-none text-blue-600 cursor-pointer text-sm p-0 mb-1.5 flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Tilbake til nettsteder
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Opprett nytt nettsted</h1>
      </div>

      {/* Content */}
      <main className="p-4 md:p-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-7 max-w-[1100px]">
          {/* Form */}
          <div className="bg-white rounded-[14px] border border-slate-200 p-5 md:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Nettstedsinformasjon</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[10px] p-3 mb-5 flex gap-2 items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-900 mb-1.5">Nettstedsnavn</label>
              <input
                type="text" value={siteName}
                onChange={(e) => { setSiteName(e.target.value); setFieldErrors((p) => ({ ...p, siteName: '' })); }}
                placeholder="F.eks. Min Bedrift AS"
                className={`w-full h-11 px-3.5 border rounded-lg text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-50 ${
                  fieldErrors.siteName ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {fieldErrors.siteName && <p className="text-xs text-red-600 mt-1">{fieldErrors.siteName}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-900 mb-1.5">Domene</label>
              <input
                type="text" value={domain}
                onChange={(e) => { setDomain(e.target.value); setFieldErrors((p) => ({ ...p, domain: '' })); }}
                placeholder="https://minbedrift.no"
                className={`w-full h-11 px-3.5 border rounded-lg text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-50 ${
                  fieldErrors.domain ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {fieldErrors.domain && <p className="text-xs text-red-600 mt-1">{fieldErrors.domain}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-900 mb-1.5">Bot-navn</label>
              <input
                type="text" value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="NorskBot"
                className="w-full h-11 px-3.5 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-50"
              />
              <p className="text-xs text-slate-500 mt-1">Navnet som vises i chat-vinduet.</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-900 mb-1.5">Velkomstmelding</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-50 resize-y"
              />
            </div>

            <div className="mb-7">
              <label className="block text-sm font-medium text-slate-900 mb-3">Temafarge</label>
              <div className="flex gap-2.5 flex-wrap">
                {themeColors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setThemeColor(c.value)}
                    className="w-10 h-10 rounded-[10px] border-2 cursor-pointer transition-all"
                    style={{
                      backgroundColor: c.value,
                      borderColor: themeColor === c.value ? '#0f172a' : 'transparent',
                      boxShadow: themeColor === c.value ? `0 0 0 2px white, 0 0 0 4px ${c.value}40` : 'none',
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full sm:w-auto py-3 px-7 border-none rounded-[10px] cursor-pointer font-semibold text-[15px] text-white transition-all ${
                submitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Oppretter...' : 'Opprett nettsted'}
            </button>
          </div>

          {/* Preview - hidden on mobile, shown on lg */}
          <div className="hidden lg:block sticky top-6 self-start">
            <div className="bg-white rounded-[14px] border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-4">Forhåndsvisning</h3>

              <div className="border border-slate-200 rounded-[14px] overflow-hidden shadow-lg">
                {/* Chat header */}
                <div className="text-white px-[18px] py-3.5 flex items-center gap-2.5" style={{ backgroundColor: themeColor }}>
                  <div className="w-[34px] h-[34px] rounded-full bg-white/20 flex items-center justify-center text-sm font-bold tracking-tight">
                    {(botName || 'N').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{botName || 'NorskBot'}</div>
                    <div className="text-[11px] opacity-80">Tilgjengelig na</div>
                  </div>
                </div>

                {/* Messages */}
                <div className="bg-slate-50 p-4 min-h-[180px]">
                  <div className="flex gap-2 mb-3.5">
                    <div
                      className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ backgroundColor: themeColor }}
                    >
                      {(botName || 'N').charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl rounded-bl-sm px-3.5 py-2.5 text-[13px] text-slate-900 max-w-[240px] leading-relaxed">
                      {welcomeMessage || 'Hei! Hvordan kan jeg hjelpe deg?'}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div
                      className="text-white rounded-xl rounded-br-sm px-3.5 py-2.5 text-[13px] max-w-[240px]"
                      style={{ backgroundColor: themeColor }}
                    >
                      Hei, jeg trenger hjelp!
                    </div>
                  </div>
                </div>

                {/* Input area */}
                <div className="bg-white border-t border-slate-200 px-3.5 py-2.5 flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-400">
                    Skriv en melding...
                  </div>
                  <div
                    className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: themeColor }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3.5 text-center">
                Slik vil chatten se ut pa {domain || 'ditt nettsted'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
