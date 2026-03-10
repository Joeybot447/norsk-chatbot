'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Kunnskapsbase', href: '/dashboard/knowledge', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { label: 'Nettsteder', href: '/dashboard/sites', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { label: 'Analyse', href: '/dashboard/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Innstillinger', href: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Min profil', href: '/dashboard/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarHover, setSidebarHover] = useState('');

  const userName = 'Ola Nordmann';
  const userInitials = userName.split(' ').map((n) => n[0]).join('').toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('norskbot_token');
    localStorage.removeItem('norskbot_site_id');
    router.push('/auth');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily }}>
      {/* Sidebar */}
      <aside style={{
        width: 260,
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            width: 36, height: 36, backgroundColor: '#2563eb', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: '#fff' }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily }}>NorskBot</span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isHover = sidebarHover === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onMouseEnter={() => setSidebarHover(item.href)}
                onMouseLeave={() => setSidebarHover('')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  marginBottom: 4,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  fontFamily,
                  color: isActive ? '#fff' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(37,99,235,0.2)' : (isHover ? 'rgba(255,255,255,0.05)' : 'transparent'),
                  transition: 'background-color 0.15s, color 0.15s',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  style={{ width: 20, height: 20, flexShrink: 0 }}
                  fill="none"
                  stroke={isActive ? '#2563eb' : '#64748b'}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* User section */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <a
            href="/dashboard/profile"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8,
              textDecoration: 'none', marginBottom: 8,
              backgroundColor: sidebarHover === 'user' ? 'rgba(255,255,255,0.05)' : 'transparent',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={() => setSidebarHover('user')}
            onMouseLeave={() => setSidebarHover('')}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700, fontFamily, flexShrink: 0,
            }}>
              {userInitials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontFamily }}>
                Gratis plan
              </div>
            </div>
          </a>

          <button
            onClick={handleLogout}
            onMouseEnter={() => setSidebarHover('logout')}
            onMouseLeave={() => setSidebarHover('')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: sidebarHover === 'logout' ? 'rgba(220,38,38,0.1)' : 'transparent',
              color: sidebarHover === 'logout' ? '#ef4444' : '#64748b',
              fontSize: 14,
              fontWeight: 500,
              fontFamily,
              cursor: 'pointer',
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logg ut
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        backgroundColor: '#f8fafc',
        overflowY: 'auto',
      }}>
        {children}
      </main>
    </div>
  );
}
