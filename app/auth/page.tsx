'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    loginEmail: '',
    loginPass: '',
    regName: '',
    regEmail: '',
    regPass: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.loginEmail,
          password: formData.loginPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('norskbot_token', data.token);
      try {
        const siteRes = await fetch('/api/demo-info');
        const siteData = await siteRes.json();
        if (siteData.siteId)
          localStorage.setItem('norskbot_site_id', siteData.siteId);
      } catch (_) {}
      router.push('/dashboard');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.regEmail,
          password: formData.regPass,
          name: formData.regName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('norskbot_token', data.token);
      try {
        const siteRes = await fetch('/api/demo-info');
        const siteData = await siteRes.json();
        if (siteData.siteId)
          localStorage.setItem('norskbot_site_id', siteData.siteId);
      } catch (_) {}
      router.push('/dashboard');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-white"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-blue-600">NorskBot</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-9">
          {/* Tabs */}
          <div className="flex border-b-2 border-gray-200 mb-7">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 text-center py-2.5 font-semibold text-sm border-b-2 transition ${
                activeTab === 'login'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              Logg inn
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 text-center py-2.5 font-semibold text-sm border-b-2 transition ${
                activeTab === 'register'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              Registrer
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  E-postadresse
                </label>
                <input
                  type="email"
                  id="loginEmail"
                  placeholder="din@epost.no"
                  value={formData.loginEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:border-blue-600 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Passord
                </label>
                <input
                  type="password"
                  id="loginPass"
                  placeholder="••••••••"
                  value={formData.loginPass}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:border-blue-600 focus:bg-white outline-none transition"
                />
              </div>
              <div className="text-right">
                <a href="#" className="text-xs text-blue-600 hover:underline">
                  Glemt passord?
                </a>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Logger inn...' : 'Logg inn'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Fullt navn
                </label>
                <input
                  type="text"
                  id="regName"
                  placeholder="Ola Nordmann"
                  value={formData.regName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:border-blue-600 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  E-postadresse
                </label>
                <input
                  type="email"
                  id="regEmail"
                  placeholder="din@epost.no"
                  value={formData.regEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:border-blue-600 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Passord
                </label>
                <input
                  type="password"
                  id="regPass"
                  placeholder="Minst 8 tegn"
                  value={formData.regPass}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:border-blue-600 focus:bg-white outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Oppretter...' : 'Opprett konto'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-7 text-xs text-gray-500">
          © 2026 NorskBot —{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Personvern
          </a>{' '}
          ·{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Vilkår
          </a>
        </div>
      </div>
    </div>
  );
}
