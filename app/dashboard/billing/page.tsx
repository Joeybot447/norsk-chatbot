'use client';

import { useState } from 'react';

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const UsageMeter = ({ label, used, total, color }: { label: string; used: number; total: number; color: string }) => {
  const pct = Math.min((used / total) * 100, 100);
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{label}</span>
        <span style={{ fontSize: '13px', color: '#64748b' }}>{used.toLocaleString('nb-NO')} / {total.toLocaleString('nb-NO')}</span>
      </div>
      <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct > 90 ? '#ef4444' : color, borderRadius: '5px', transition: 'width 0.5s ease' }} />
      </div>
      {pct > 80 && (
        <p style={{ fontSize: '11px', color: '#ef4444', margin: '4px 0 0 0' }}>Advarsel: {pct >= 100 ? 'Grensen er nadd!' : 'Naermer seg grensen'}</p>
      )}
    </div>
  );
};

export default function BillingPage() {
  const [currentPlan] = useState('Pro');

  const plans = [
    {
      name: 'Gratis',
      price: '0',
      period: '/mnd',
      features: ['100 meldinger/mnd', '1 nettsted', '1 dokument', 'Grunnleggende widget', 'E-poststotte'],
      highlighted: false,
      current: currentPlan === 'Gratis',
    },
    {
      name: 'Pro',
      price: '499',
      period: '/mnd',
      features: ['5 000 meldinger/mnd', '10 nettsteder', '50 dokumenter', 'Tilpassbar widget', 'Prioritert stotte', 'Analyse-dashboard', 'API-tilgang'],
      highlighted: true,
      current: currentPlan === 'Pro',
    },
    {
      name: 'Enterprise',
      price: '1 999',
      period: '/mnd',
      features: ['Ubegrenset meldinger', 'Ubegrenset nettsteder', 'Ubegrenset dokumenter', 'Hvit-merke widget', 'Dedikert support', 'SLA-garanti', 'Egendefinerte integrasjoner', 'SSO / SAML'],
      highlighted: false,
      current: currentPlan === 'Enterprise',
    },
  ];

  const invoices = [
    { id: 'INV-2024-012', date: '2024-03-01', amount: '499,00 kr', status: 'Betalt' },
    { id: 'INV-2024-011', date: '2024-02-01', amount: '499,00 kr', status: 'Betalt' },
    { id: 'INV-2024-010', date: '2024-01-01', amount: '499,00 kr', status: 'Betalt' },
    { id: 'INV-2023-009', date: '2023-12-01', amount: '499,00 kr', status: 'Betalt' },
    { id: 'INV-2023-008', date: '2023-11-01', amount: '0,00 kr', status: 'Gratis' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: fontStack }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Fakturering og abonnement</h1>
        <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>Administrer plan, forbruk og betalingsmetoder</p>
      </div>

      <main style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
        {/* Current Plan + Usage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px', maxWidth: '1100px' }}>
          {/* Current Plan */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px 0' }}>Naavaerende plan</p>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{currentPlan}</h2>
              </div>
              <span style={{ padding: '4px 12px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                Aktiv
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a' }}>499</span>
              <span style={{ fontSize: '16px', color: '#64748b' }}>kr/mnd</span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px 0' }}>Neste fakturering: <strong style={{ color: '#0f172a' }}>1. april 2024</strong></p>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Betalingsmetode: ---- 4242</p>
          </div>

          {/* Usage Stats */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px 0' }}>Forbruk denne maneden</h3>
            <UsageMeter label="Meldinger" used={3847} total={5000} color="#2563eb" />
            <UsageMeter label="Dokumenter" used={23} total={50} color="#16a34a" />
            <UsageMeter label="API-kall" used={12450} total={50000} color="#7c3aed" />
          </div>
        </div>

        {/* Plans Comparison */}
        <div style={{ marginBottom: '32px', maxWidth: '1100px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>Velg plan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  backgroundColor: 'white', borderRadius: '12px',
                  border: plan.highlighted ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  padding: '28px', boxShadow: plan.highlighted ? '0 4px 20px rgba(37,99,235,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                  position: 'relative' as const, overflow: 'hidden',
                }}
              >
                {plan.highlighted && (
                  <div style={{ position: 'absolute' as const, top: '12px', right: '-28px', backgroundColor: '#2563eb', color: 'white', fontSize: '11px', fontWeight: '600', padding: '4px 32px', transform: 'rotate(45deg)' }}>
                    Populaer
                  </div>
                )}

                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0' }}>{plan.name}</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '36px', fontWeight: '700', color: '#0f172a' }}>{plan.price}</span>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>kr{plan.period}</span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ padding: '6px 0', fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  style={{
                    width: '100%', padding: '12px',
                    backgroundColor: plan.current ? '#f1f5f9' : plan.highlighted ? '#2563eb' : 'white',
                    color: plan.current ? '#64748b' : plan.highlighted ? 'white' : '#0f172a',
                    border: plan.current || plan.highlighted ? 'none' : '1px solid #e2e8f0',
                    borderRadius: '8px', cursor: plan.current ? 'default' : 'pointer',
                    fontSize: '14px', fontWeight: '600', fontFamily: fontStack,
                    transition: 'all 0.2s',
                  }}
                  disabled={plan.current}
                >
                  {plan.current ? 'Naavaerende plan' : plan.name === 'Enterprise' ? 'Kontakt oss' : 'Oppgrader'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice History + Payment Method */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', maxWidth: '1100px' }}>
          {/* Invoices */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>Fakturahistorikk</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Faktura-ID</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Dato</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Belop</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: '600' }}></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>{inv.id}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#64748b' }}>{inv.date}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#0f172a', textAlign: 'right', fontWeight: '500' }}>{inv.amount}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                        backgroundColor: inv.status === 'Betalt' ? '#d1fae5' : '#f1f5f9',
                        color: inv.status === 'Betalt' ? '#065f46' : '#64748b',
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <button style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontFamily: fontStack }}>
                        Last ned
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Method */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', alignSelf: 'flex-start' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px 0' }}>Betalingsmetode</h3>

            {/* Card display */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              borderRadius: '12px', padding: '20px', color: 'white', marginBottom: '20px',
            }}>
              <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '20px' }}>VISA</div>
              <div style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '2px', marginBottom: '16px' }}>
                ---- ---- ---- 4242
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <div>
                  <div style={{ opacity: 0.7, marginBottom: '2px' }}>Kortinnehaver</div>
                  <div>Josef G.</div>
                </div>
                <div>
                  <div style={{ opacity: 0.7, marginBottom: '2px' }}>Utloper</div>
                  <div>12/26</div>
                </div>
              </div>
            </div>

            <button
              style={{
                width: '100%', padding: '10px', backgroundColor: 'white', color: '#0f172a',
                border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500', fontFamily: fontStack, marginBottom: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              Endre betalingsmetode
            </button>
            <button
              style={{
                width: '100%', padding: '10px', backgroundColor: 'white', color: '#ef4444',
                border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500', fontFamily: fontStack,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              Avbryt abonnement
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
