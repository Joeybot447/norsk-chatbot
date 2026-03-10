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

export default function SitesPage() {
  const [sites] = useState([
    { id: 1, name: 'Company A', domain: 'company-a.no', status: 'active', conversations: 245, created: '2024-01-15' },
    { id: 2, name: 'Company B', domain: 'company-b.no', status: 'active', conversations: 512, created: '2024-02-01' },
    { id: 3, name: 'Company C', domain: 'company-c.no', status: 'active', conversations: 89, created: '2024-02-20' },
    { id: 4, name: 'Company D', domain: 'company-d.no', status: 'inactive', conversations: 0, created: '2024-01-05' },
    { id: 5, name: 'Company E', domain: 'company-e.no', status: 'active', conversations: 341, created: '2024-03-01' },
    { id: 6, name: 'Company F', domain: 'company-f.no', status: 'active', conversations: 156, created: '2024-03-05' },
  ]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <SidebarNav currentPage="Sites" />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>Sites</h1>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            + Add Site
          </button>
        </div>

        {/* Main Content */}
        <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          {/* Sites Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Customer Sites ({sites.length})</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Site Name</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Domain</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Conversations</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Created</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site, i) => (
                    <tr key={site.id} style={{ borderBottom: i < sites.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '16px 20px', color: '#111827', fontSize: '14px', fontWeight: '500' }}>{site.name}</td>
                      <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: '14px' }}>{site.domain}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: site.status === 'active' ? '#d1fae5' : '#f3f4f6',
                          color: site.status === 'active' ? '#065f46' : '#6b7280',
                        }}>
                          {site.status === 'active' ? '🟢 Active' : '⚫ Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', color: '#111827', fontSize: '14px' }}>{site.conversations}</td>
                      <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: '14px' }}>{site.created}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button
                          style={{
                            padding: '4px 8px',
                            marginRight: '8px',
                            backgroundColor: 'transparent',
                            color: '#3b82f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = '#eff6ff';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          Edit
                        </button>
                        <button
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
