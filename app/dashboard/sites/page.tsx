'use client';

import { useState } from 'react';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export default function SitesPage() {
  const [sites] = useState([
    { id: 1, name: 'Fjordtech AS', domain: 'fjordtech.no', status: 'active', conversations: 245, created: '2024-01-15' },
    { id: 2, name: 'Bergen Shipping', domain: 'bergenshipping.no', status: 'active', conversations: 512, created: '2024-02-01' },
    { id: 3, name: 'Norsk Digital', domain: 'norskdigital.no', status: 'active', conversations: 89, created: '2024-02-20' },
    { id: 4, name: 'Stavanger Energi', domain: 'stavangerenergi.no', status: 'inactive', conversations: 0, created: '2024-01-05' },
    { id: 5, name: 'Oslo Media', domain: 'oslomedia.no', status: 'active', conversations: 341, created: '2024-03-01' },
    { id: 6, name: 'Tromso Helse', domain: 'tromsohelse.no', status: 'active', conversations: 156, created: '2024-03-05' },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Nettsteder</h1>
        <a
          href="/dashboard/sites/new"
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-block',
            fontFamily,
          }}
        >
          + Legg til nettsted
        </a>
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
        {/* Sites Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Kundens nettsteder ({sites.length})</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Nettstedsnavn</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Domene</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Samtaler</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Opprettet</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site, i) => (
                  <tr key={site.id} style={{ borderBottom: i < sites.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '16px 20px', color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{site.name}</td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '14px' }}>{site.domain}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: site.status === 'active' ? '#d1fae5' : '#f1f5f9',
                        color: site.status === 'active' ? '#065f46' : '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: site.status === 'active' ? '#22c55e' : '#94a3b8',
                          display: 'inline-block',
                        }} />
                        {site.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', color: '#0f172a', fontSize: '14px' }}>{site.conversations}</td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '14px' }}>{site.created}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button
                        style={{
                          padding: '4px 12px',
                          marginRight: '8px',
                          backgroundColor: 'transparent',
                          color: '#2563eb',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#eff6ff';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        Rediger
                      </button>
                      <button
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        Slett
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
  );
}
