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

const StatCard = ({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color: string }) => (
  <div style={{
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    flex: 1,
    minWidth: '200px',
  }}>
    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <p style={{ fontSize: '32px', fontWeight: 'bold', color }}>{value}</p>
      {unit && <span style={{ color: '#9ca3af', fontSize: '14px' }}>{unit}</span>}
    </div>
  </div>
);

export default function DashboardPage() {
  const [user] = useState({ name: 'Admin User', email: 'admin@norskbot.no' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <SidebarNav currentPage="Dashboard" />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>{user.name}</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
          </div>
        </div>

        {/* Main Content */}
        <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          {/* Quick Stats */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Quick Stats</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <StatCard label="Active Sites" value="12" color="#3b82f6" />
              <StatCard label="Total Conversations" value="1,247" color="#10b981" />
              <StatCard label="Avg Response Time" value="245" unit="ms" color="#f59e0b" />
              <StatCard label="API Calls Today" value="8,943" color="#8b5cf6" />
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Recent Activity</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Event</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Site</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { event: 'API Request', site: 'company-a.no', time: '2 min ago', status: 'Success' },
                    { event: 'Document Upload', site: 'company-b.no', time: '15 min ago', status: 'Success' },
                    { event: 'Chat Session', site: 'company-c.no', time: '1 hour ago', status: 'Success' },
                    { event: 'Configuration Update', site: 'company-a.no', time: '3 hours ago', status: 'Success' },
                    { event: 'Widget Deploy', site: 'company-d.no', time: '5 hours ago', status: 'Failed' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '12px', color: '#111827', fontSize: '14px' }}>{row.event}</td>
                      <td style={{ padding: '12px', color: '#111827', fontSize: '14px' }}>{row.site}</td>
                      <td style={{ padding: '12px', color: '#6b7280', fontSize: '14px' }}>{row.time}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: row.status === 'Success' ? '#d1fae5' : '#fee2e2',
                          color: row.status === 'Success' ? '#065f46' : '#991b1b',
                        }}>
                          {row.status}
                        </span>
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
