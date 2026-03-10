'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const UsageMeter = ({ label, used, total, color }: { label: string; used: number; total: number; color: string }) => {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
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

interface Subscription {
  plan_name: string;
  status: string;
  current_period_end?: string;
}

const planLimits: Record<string, { messages: number; documents: number; sites: number }> = {
  free: { messages: 100, documents: 1, sites: 1 },
  pro: { messages: 5000, documents: 50, sites: 10 },
  enterprise: { messages: 999999, documents: 999999, sites: 999999 },
};

const planPrices: Record<string, string> = {
  free: '0',
  pro: '499',
  enterprise: '1 999',
};

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageMessages, setUsageMessages] = useState(0);
  const [usageTokens, setUsageTokens] = useState(0);
  const [usageDocs, setUsageDocs] = useState(0);

  const currentPlan = subscription?.plan_name || 'free';
  const currentPlanLabel = currentPlan === 'free' ? 'Gratis' : currentPlan === 'pro' ? 'Pro' : 'Enterprise';
  const limits = planLimits[currentPlan] || planLimits.free;

  useEffect(() => {
    if (!user) return;

    const loadBilling = async () => {
      setLoading(true);
      try {
        // Load subscription
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        setSubscription(sub);

        // Load usage logs
        const { data: logs } = await supabase
          .from('usage_logs')
          .select('action_type, tokens_used')
          .eq('user_id', user.id);

        if (logs) {
          let totalMessages = 0;
          let totalTokens = 0;
          let totalDocs = 0;

          for (const log of logs) {
            if (log.action_type === 'chat_message') {
              totalMessages++;
              totalTokens += log.tokens_used || 0;
            } else if (log.action_type === 'document_ingest') {
              totalDocs++;
            }
          }

          setUsageMessages(totalMessages);
          setUsageTokens(totalTokens);
          setUsageDocs(totalDocs);
        }
      } catch {
        // Silently handle - show defaults
      } finally {
        setLoading(false);
      }
    };

    loadBilling();
  }, [user]);

  const plans = [
    {
      name: 'Gratis',
      key: 'free',
      price: '0',
      period: '/mnd',
      features: ['100 meldinger/mnd', '1 nettsted', '1 dokument', 'Grunnleggende widget', 'E-poststotte'],
      highlighted: false,
      current: currentPlan === 'free',
    },
    {
      name: 'Pro',
      key: 'pro',
      price: '499',
      period: '/mnd',
      features: ['5 000 meldinger/mnd', '10 nettsteder', '50 dokumenter', 'Tilpassbar widget', 'Prioritert stotte', 'Analyse-dashboard', 'API-tilgang'],
      highlighted: true,
      current: currentPlan === 'pro',
    },
    {
      name: 'Enterprise',
      key: 'enterprise',
      price: '1 999',
      period: '/mnd',
      features: ['Ubegrenset meldinger', 'Ubegrenset nettsteder', 'Ubegrenset dokumenter', 'Hvit-merke widget', 'Dedikert support', 'SLA-garanti', 'Egendefinerte integrasjoner', 'SSO / SAML'],
      highlighted: false,
      current: currentPlan === 'enterprise',
    },
  ];

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', fontFamily: fontStack }}>
        <p style={{ color: '#64748b', fontSize: '16px' }}>Laster...</p>
      </div>
    );
  }

  const nextBillingDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

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
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{currentPlanLabel}</h2>
              </div>
              <span style={{ padding: '4px 12px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                Aktiv
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a' }}>{planPrices[currentPlan] || '0'}</span>
              <span style={{ fontSize: '16px', color: '#64748b' }}>kr/mnd</span>
            </div>
            {nextBillingDate && (
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px 0' }}>Neste fakturering: <strong style={{ color: '#0f172a' }}>{nextBillingDate}</strong></p>
            )}
            {!subscription && (
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Ingen aktiv betalt plan</p>
            )}
          </div>

          {/* Usage Stats */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px 0' }}>Forbruk denne maneden</h3>
            <UsageMeter label="Meldinger" used={usageMessages} total={limits.messages} color="#2563eb" />
            <UsageMeter label="Dokumenter" used={usageDocs} total={limits.documents} color="#16a34a" />
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Totalt tokens brukt: <strong style={{ color: '#0f172a' }}>{usageTokens.toLocaleString('nb-NO')}</strong>
              </p>
            </div>
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
      </main>
    </div>
  );
}
