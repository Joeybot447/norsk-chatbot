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

const MetricCard = ({ label, value, trend, trendUp }: { label: string; value: string | number; trend: string; trendUp: boolean }) => (
  <div style={{
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    flex: 1,
    minWidth: '200px',
  }}>
    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
      <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{value}</p>
    </div>
    <p style={{ fontSize: '12px', color: trendUp ? '#10b981' : '#ef4444' }}>
      {trendUp ? '📈' : '📉'} {trend}
    </p>
  </div>
);

export default function AnalyticsPage() {
  const [dateRange] = useState('7 days');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <SidebarNav currentPage="Analytics" />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>Analytics</h1>
          <select
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#6b7280',
            }}
          >
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>

        {/* Main Content */}
        <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          {/* Key Metrics */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Key Metrics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <MetricCard label="Total Conversations" value="2,847" trend="↑ 12% from last week" trendUp={true} />
              <MetricCard label="Avg Message Length" value="142" trend="chars per message" trendUp={true} />
              <MetricCard label="User Satisfaction" value="4.6" trend="out of 5.0" trendUp={true} />
              <MetricCard label="Response Time" value="312" trend="ms average" trendUp={false} />
            </div>
          </div>

          {/* Conversation Breakdown */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '32px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Conversations by Site (Last 7 Days)</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Site</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Conversations</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Messages</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#6b7280', fontSize: '12px', fontWeight: '600' }}>Avg Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { site: 'Company B', conversations: 487, messages: 2145, duration: '4m 23s' },
                    { site: 'Company A', conversations: 342, messages: 1523, duration: '3m 12s' },
                    { site: 'Company E', conversations: 298, messages: 1067, duration: '2m 54s' },
                    { site: 'Company F', conversations: 215, messages: 841, duration: '3m 01s' },
                    { site: 'Company C', conversations: 145, messages: 523, duration: '2m 15s' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '12px', color: '#111827', fontSize: '14px', fontWeight: '500' }}>{row.site}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#111827', fontSize: '14px' }}>{row.conversations}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#111827', fontSize: '14px' }}>{row.messages}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6b7280', fontSize: '14px' }}>{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Popular Topics */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Top Conversation Topics</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {[
                { topic: 'Product Features', count: 523, percentage: 28 },
                { topic: 'Pricing & Plans', count: 412, percentage: 22 },
                { topic: 'Account Management', count: 356, percentage: 19 },
                { topic: 'Technical Support', count: 298, percentage: 16 },
                { topic: 'Billing Issues', count: 158, percentage: 8 },
                { topic: 'Other', count: 100, percentage: 7 },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: i < 5 ? '16px' : '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#111827', fontSize: '14px', fontWeight: '500' }}>{item.topic}</span>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>{item.count}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${item.percentage}%`,
                        backgroundColor: '#3b82f6',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
