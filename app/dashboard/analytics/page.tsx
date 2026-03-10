'use client';

import { useState } from 'react';

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const MetricCard = ({ label, value, trend, trendUp }: { label: string; value: string | number; trend: string; trendUp: boolean }) => (
  <div style={{
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    flex: 1,
    minWidth: '200px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    fontFamily,
  }}>
    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px', margin: '0 0 8px 0' }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
      <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{value}</p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: trendUp ? '#d1fae5' : '#fee2e2',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={trendUp ? '#16a34a' : '#dc2626'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d={trendUp ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
        </svg>
      </span>
      <p style={{ fontSize: '12px', color: trendUp ? '#16a34a' : '#dc2626', margin: 0 }}>
        {trend}
      </p>
    </div>
  </div>
);

export default function AnalyticsPage() {
  const [dateRange] = useState('7 days');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily }}>
      {/* Top Bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Analyse</h1>
        <select
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#64748b',
            fontFamily,
          }}
        >
          <option>Siste 7 dager</option>
          <option>Siste 30 dager</option>
          <option>Siste 90 dager</option>
        </select>
      </div>

      {/* Main Content */}
      <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
        {/* Nokkeltall */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#0f172a', margin: '0 0 16px 0' }}>Nokkeltall</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <MetricCard label="Totale samtaler" value="2 847" trend="Opp 12 % fra forrige uke" trendUp={true} />
            <MetricCard label="Gj.snittlig meldingslengde" value="142" trend="tegn per melding" trendUp={true} />
            <MetricCard label="Brukertilfredshet" value="4,6" trend="av 5,0" trendUp={true} />
            <MetricCard label="Responstid" value="312" trend="ms gjennomsnitt" trendUp={false} />
          </div>
        </div>

        {/* Samtaler per nettsted */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Samtaler per nettsted (siste 7 dager)</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Nettsted</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Samtaler</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Meldinger</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Gj.snittlig varighet</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { site: 'Bergen Shipping', conversations: 487, messages: 2145, duration: '4m 23s' },
                  { site: 'Fjordtech AS', conversations: 342, messages: 1523, duration: '3m 12s' },
                  { site: 'Stavanger Energi', conversations: 298, messages: 1067, duration: '2m 54s' },
                  { site: 'Oslo Media', conversations: 215, messages: 841, duration: '3m 01s' },
                  { site: 'Norsk Digital', conversations: 145, messages: 523, duration: '2m 15s' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '12px', color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{row.site}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#0f172a', fontSize: '14px' }}>{row.conversations}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#0f172a', fontSize: '14px' }}>{row.messages}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontSize: '14px' }}>{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mest populaere samtaleemner */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Mest populaere samtaleemner</h3>
          </div>
          <div style={{ padding: '20px' }}>
            {[
              { topic: 'Produktfunksjoner', count: 523, percentage: 28 },
              { topic: 'Priser og planer', count: 412, percentage: 22 },
              { topic: 'Kontoadministrasjon', count: 356, percentage: 19 },
              { topic: 'Teknisk support', count: 298, percentage: 16 },
              { topic: 'Faktureringsproblemer', count: 158, percentage: 8 },
              { topic: 'Annet', count: 100, percentage: 7 },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: i < 5 ? '16px' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: '500' }}>{item.topic}</span>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>{item.count}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${item.percentage}%`,
                      backgroundColor: '#2563eb',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.percentage} %</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
