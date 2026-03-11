'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../_lib/supabase/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { ArrowLeft, Check, AlertTriangle, Copy, MessageSquare } from 'lucide-react';
import Link from 'next/link';

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

  // API key success screen
  if (createdApiKey) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 bg-slate-50">
        <Card className="max-w-[520px] w-full shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Nettsted opprettet</h2>
            <p className="text-sm text-slate-500 mb-7 leading-relaxed">
              Her er API-nokkelen din. Den brukes i widget-koden for a koble chatboten til nettstedet ditt.
            </p>

            <Card className="mb-4">
              <CardContent className="p-4">
                <code className="text-sm text-slate-900 font-mono break-all leading-relaxed">{createdApiKey}</code>
              </CardContent>
            </Card>

            <Button
              onClick={handleCopyKey}
              className={`w-full mb-4 ${copied ? 'bg-green-600 hover:bg-green-600' : ''}`}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? 'Kopiert til utklippstavle' : 'Kopier API-nokkel'}
            </Button>

            <Card className="border-amber-200 bg-amber-50 mb-7 text-left">
              <CardContent className="p-4 flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium leading-relaxed">
                  Lagre denne nokkelen na. Den vises bare en gang og kan ikke hentes fram igjen.
                </p>
              </CardContent>
            </Card>

            <Button variant="outline" onClick={() => router.push('/dashboard/sites')}>
              Ga til nettsteder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create form
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <Link href="/dashboard/sites" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors mb-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          Tilbake til nettsteder
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Opprett nytt nettsted</h1>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 max-w-[1100px]">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nettstedsinformasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label htmlFor="siteName" className="mb-1.5">Nettstedsnavn</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => { setSiteName(e.target.value); setFieldErrors((p) => ({ ...p, siteName: '' })); }}
                  placeholder="F.eks. Min Bedrift AS"
                  className={fieldErrors.siteName ? 'border-red-500' : ''}
                />
                {fieldErrors.siteName && <p className="text-xs text-red-600 mt-1">{fieldErrors.siteName}</p>}
              </div>

              <div>
                <Label htmlFor="domain" className="mb-1.5">Domene</Label>
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => { setDomain(e.target.value); setFieldErrors((p) => ({ ...p, domain: '' })); }}
                  placeholder="https://minbedrift.no"
                  className={fieldErrors.domain ? 'border-red-500' : ''}
                />
                {fieldErrors.domain && <p className="text-xs text-red-600 mt-1">{fieldErrors.domain}</p>}
              </div>

              <div>
                <Label htmlFor="botName" className="mb-1.5">Bot-navn</Label>
                <Input
                  id="botName"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="NorskBot"
                />
                <p className="text-xs text-slate-400 mt-1">Navnet som vises i chat-vinduet.</p>
              </div>

              <div>
                <Label htmlFor="welcomeMsg" className="mb-1.5">Velkomstmelding</Label>
                <Textarea
                  id="welcomeMsg"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label className="mb-3">Temafarge</Label>
                <div className="flex gap-2.5 flex-wrap">
                  {themeColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setThemeColor(c.value)}
                      className={`w-10 h-10 rounded-lg cursor-pointer transition-all border-2 ${
                        themeColor === c.value
                          ? 'border-slate-900 ring-2 ring-white shadow-md'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={submitting} className="mt-2">
                {submitting ? 'Oppretter...' : 'Opprett nettsted'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="lg:sticky lg:top-6 self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Forhandsvisning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-lg">
                  {/* Chat header */}
                  <div className="px-4 py-3.5 flex items-center gap-3" style={{ backgroundColor: themeColor }}>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                      {(botName || 'N').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{botName || 'NorskBot'}</div>
                      <div className="text-[11px] text-white/80">Tilgjengelig na</div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="bg-slate-50 p-4 min-h-[180px]">
                    <div className="flex gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: themeColor }}>
                        {(botName || 'N').charAt(0).toUpperCase()}
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl rounded-bl-sm px-3 py-2.5 text-sm text-slate-900 max-w-[220px] leading-relaxed">
                        {welcomeMessage || 'Hei! Hvordan kan jeg hjelpe deg?'}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="rounded-xl rounded-br-sm px-3 py-2.5 text-sm text-white max-w-[220px]" style={{ backgroundColor: themeColor }}>
                        Hei, jeg trenger hjelp!
                      </div>
                    </div>
                  </div>

                  {/* Input area */}
                  <div className="bg-white border-t border-slate-200 px-3 py-2.5 flex gap-2">
                    <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400">
                      Skriv en melding...
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}>
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-4 text-center">
                  Slik vil chatten se ut pa {domain || 'ditt nettsted'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
