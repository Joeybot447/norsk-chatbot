'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { signIn, signUp, signInWithGitHub } from '../_lib/supabase/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [regCompany, setRegCompany] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleGitHub = async () => {
    clearMessages();
    setLoading(true);
    try {
      await signInWithGitHub();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub-innlogging feilet');
      setLoading(false);
    }
  };

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
      setError('Du ma godta brukervilkarene og personvernerkleringen');
      return;
    }
    if (regPass !== regConfirmPass) {
      setError('Passordene stemmer ikke overens');
      return;
    }
    if (regPass.length < 8) {
      setError('Passordet ma vaere minst 8 tegn');
      return;
    }
    setLoading(true);
    try {
      await signUp(regEmail, regPass, {
        displayName: regName,
        companyName: regCompany,
      });
      setSuccess('Konto opprettet! Sjekk e-posten din for a bekrefte kontoen.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrering feilet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-12">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563eb]">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#2563eb]">NorskBot</span>
        </Link>

        <Card className="border-[#e2e8f0] shadow-lg">
          <CardHeader className="pb-4">
            {/* Tabs */}
            <div className="flex border-b border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  clearMessages();
                }}
                className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors ${
                  activeTab === 'login'
                    ? 'border-b-2 border-[#2563eb] text-[#2563eb]'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                Logg inn
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  clearMessages();
                }}
                className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors ${
                  activeTab === 'register'
                    ? 'border-b-2 border-[#2563eb] text-[#2563eb]'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                Registrer
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Error / Success messages */}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
                {success}
              </div>
            )}

            {/* ─── Login ─── */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc]"
                  onClick={handleGitHub}
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5">
                    <path
                      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                      fill="#0f172a"
                    />
                  </svg>
                  Fortsett med GitHub
                </Button>

                <div className="flex items-center gap-4">
                  <Separator className="flex-1 bg-[#e2e8f0]" />
                  <span className="text-xs text-[#94a3b8]">eller</span>
                  <Separator className="flex-1 bg-[#e2e8f0]" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[#64748b]">
                    E-postadresse
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="din@epost.no"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="border-[#e2e8f0] bg-[#f8fafc] focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-pass" className="text-[#64748b]">
                      Passord
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-medium text-[#2563eb] hover:underline"
                    >
                      Glemt passord?
                    </Link>
                  </div>
                  <Input
                    id="login-pass"
                    type="password"
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    required
                    className="border-[#e2e8f0] bg-[#f8fafc] focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]"
                >
                  {loading ? 'Logger inn...' : 'Logg inn'}
                </Button>
              </form>
            )}

            {/* ─── Register ─── */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc]"
                  onClick={handleGitHub}
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5">
                    <path
                      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                      fill="#0f172a"
                    />
                  </svg>
                  Fortsett med GitHub
                </Button>

                <div className="flex items-center gap-4">
                  <Separator className="flex-1 bg-[#e2e8f0]" />
                  <span className="text-xs text-[#94a3b8]">eller</span>
                  <Separator className="flex-1 bg-[#e2e8f0]" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-company" className="text-[#64748b]">
                    Bedriftsnavn
                  </Label>
                  <Input
                    id="reg-company"
                    type="text"
                    placeholder="Ditt Firma AS"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    required
                    className="border-[#e2e8f0] bg-[#f8fafc] focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-[#64748b]">
                    Fullt navn
                  </Label>
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Ola Nordmann"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    className="border-[#e2e8f0] bg-[#f8fafc] focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-[#64748b]">
                    E-postadresse
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="din@epost.no"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="border-[#e2e8f0] bg-[#f8fafc] focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-pass" className="text-[#64748b]">
                    Passord
                  </Label>
                  <Input
                    id="reg-pass"
                    type="password"
                    placeholder="Minst 8 tegn"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    required
                    className="border-[#e2e8f0] bg-[#f8fafc] focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" className="text-[#64748b]">
                    Bekreft passord
                  </Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="Gjenta passordet"
                    value={regConfirmPass}
                    onChange={(e) => setRegConfirmPass(e.target.value)}
                    required
                    className="border-[#e2e8f0] bg-[#f8fafc] focus:border-[#2563eb] focus:bg-white"
                  />
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 accent-[#2563eb]"
                  />
                  <label
                    htmlFor="terms"
                    className="cursor-pointer text-sm leading-relaxed text-[#64748b]"
                  >
                    Jeg godtar{' '}
                    <Link
                      href="/brukervilkar"
                      target="_blank"
                      className="font-medium text-[#2563eb] hover:underline"
                    >
                      brukervilkarene
                    </Link>{' '}
                    og{' '}
                    <Link
                      href="/personvern"
                      target="_blank"
                      className="font-medium text-[#2563eb] hover:underline"
                    >
                      personvernerkleringen
                    </Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]"
                >
                  {loading ? 'Oppretter konto...' : 'Opprett konto'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[#64748b]">
          <Link href="/" className="font-medium text-[#2563eb] hover:underline">
            Tilbake til forsiden
          </Link>
          <div className="mt-3">
            2026 NorskBot —{' '}
            <Link href="/personvern" className="text-[#2563eb] hover:underline">
              Personvern
            </Link>{' '}
            ·{' '}
            <Link href="/brukervilkar" className="text-[#2563eb] hover:underline">
              Vilkar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
