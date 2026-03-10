'use client';

import { useState } from 'react';
import Link from 'next/link';

const SidebarNav = ({ currentPage }: { currentPage: string }) => (
  <div style={{ width: '250px', backgroundColor: '#1f2937', color: 'white', minHeight: '100vh', padding: '20px 0' }}>
    <div style={{ padding: '0 20px', marginBottom: '30px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>NorskBot</h2>
      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Admin Dashboard</p>
    </div>
    
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/dashboard/sites', label: 'Sites', icon: '🌐' },
        { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
        { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
      ].map((item) => (
        <Link key={item.href} href={item.href}>
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: currentPage === item.label ? '#374151' : 'transparent',
              cursor: 'pointer',
              borderLeft: currentPage === item.label ? '4px solid #3b82f6' : '4px solid transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (currentPage !== item.label) (e.currentTarget as HTMLElement).style.backgroundColor = '#2d3748'; }}
            onMouseLeave={(e) => { if (currentPage !== item.label) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <span style={{ marginRight: '8px' }}>{item.icon}</span>
            {item.label}
          </div>
        </Link>
      ))}
    </nav>
  </div>
);

export default function SettingsPage() {
  const [email, setEmail] = useState('admin@norskbot.no');
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <SidebarNav currentPage="Settings" />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>Settings</h1>
        </div>

        {/* Main Content */}
        <main style={{ padding: '24px', flex: 1, overflow: 'auto', maxWidth: '900px' }}>
          {/* Account Settings */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Account Settings</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Manage your account information</p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#111827', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#111827', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>Full Name</label>
                <input
                  type="text"
                  defaultValue="Admin User"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#111827', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>Organization</label>
                <input
                  type="text"
                  defaultValue="NorskBot Inc."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* API Settings */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>API Settings</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Manage your API keys and access</p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <p style={{ color: '#111827', fontWeight: '500', fontSize: '14px' }}>Production API Key</p>
                    <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>sk-prod-••••••••••••••••</p>
                  </div>
                  <button
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                  >
                    Copy
                  </button>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '12px' }}>Created on March 1, 2024</p>
              </div>

              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <p style={{ color: '#111827', fontWeight: '500', fontSize: '14px' }}>Development API Key</p>
                    <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>sk-dev-••••••••••••••••</p>
                  </div>
                  <button
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                  >
                    Copy
                  </button>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '12px' }}>Created on February 15, 2024</p>
              </div>

              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'white';
                }}
              >
                + Generate New API Key
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Preferences</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Customize your experience</p>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#111827', fontWeight: '500', fontSize: '14px' }}>Email Notifications</p>
                  <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>Receive email updates about your account</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  style={{ width: '24px', height: '24px', cursor: 'pointer' }}
                />
              </div>
              <div style={{ marginBottom: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <label style={{ display: 'block', color: '#111827', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #fee2e2' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#991b1b' }}>Danger Zone</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>Irreversible actions</p>
            </div>
            <div style={{ padding: '20px' }}>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
            >
              Save Changes
            </button>
            <button
              style={{
                padding: '10px 24px',
                backgroundColor: 'white',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'white';
              }}
            >
              Cancel
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
