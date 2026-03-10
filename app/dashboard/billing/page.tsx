'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const font = 'inherit';
const blue = '#2563eb';
const dark = '#0f172a';
const secondary = '#64748b';
const border = '#e2e8f0';
const bg = '#f8fafc';
const red = '#ef4444';

// ---------------------------------------------------------------------------
// Plan configuration
// ---------------------------------------------------------------------------
interface PlanConfig {
  label: string;
  price: string;
  period: string;
  messages: number;
  chatbots: number;
  features: string[];
  highlighted: boolean;
}

const PLANS: Record<string, PlanConfig> = {
  free: {
    label: 'Gratis',
    price: '0',
    period: 'kr/mnd',
    messages: 100,
    chatbots: 1,
    features: [
      '1 chatbot',
      '100 meldinger per maned',
      'Grunnleggende widget',
      'E-poststotte',
    ],
    highlighted: false,
  },
  professional: {
    label: 'Pro',
    price: '990',
    period: 'kr/mnd',
    messages: 10_000,
    chatbots: 5,
    features: [
      '5 chatbots',
      '10 000 meldinger per maned',
      'Widget-tilpasning',
      'Prioritert stotte',
      'Analyse-dashboard',
      'API-tilgang',
    ],
    highlighted: true,
  },
  enterprise: {
    label: 'Enterprise',
    price: 'Tilpasset',
    period: '',
    messages: Infinity,
    chatbots: Infinity,
    features: [
      'Ubegrenset chatbots',
      'Ubegrenset meldinger',
      'Hvit-merke widget',
      'Dedikert kontaktperson',
      'SLA-garanti',
      'Egendefinerte integrasjoner',
      'SSO / SAML',
    ],
    highlighted: false,
  },
};

const PLAN_ORDER = ['free', 'professional', 'enterprise'] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressBar({ label, used, limit, color = blue }: { label: string; used: number; limit: number; color?: string }) {
  const isUnlimited = !isFinite(limit);
  const pct = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const overThreshold = pct > 80;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: dark }}>{label}</span>
        <span style={{ fontSize: 13, color: secondary }}>
          {used.toLocaleString('nb-NO')} / {isUnlimited ? 'Ubegrenset' : limit.toLocaleString('nb-NO')}
        </span>
      </div>
      <div style={{ width: '100%', height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            width: isUnlimited ? '0%' : `${pct}%`,
            height: '100%',
            backgroundColor: overThreshold ? red : color,
            borderRadius: 4,
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      {overThreshold && (
        <p style={{ fontSize: 12, color: red, margin: '4px 0 0', fontWeight: 500 }}>
          {pct >= 100 ? 'Grensen er nadd' : 'Naermer seg grensen'}
        </p>
      )}
    </div>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white', borderRadius: 16, padding: '32px 28px',
          maxWidth: 420, width: '90%',
          boxShadow: '0 24px 48px rgba(0,0,0,0.16)',
          fontFamily: font,
        }}
      >
        <h3 style={{ fontSize: 20, fontWeight: 700, color: dark, margin: '0 0 8px' }}>
          Oppgradering kommer snart
        </h3>
        <p style={{ fontSize: 14, color: secondary, lineHeight: 1.6, margin: '0 0 24px' }}>
          Stripe-betaling er under utvikling. Kontakt oss for a oppgradere planen din allerede i dag.
        </p>
        <div style={{ padding: '16px', backgroundColor: bg, borderRadius: 10, border: `1px solid ${border}`, marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: dark, fontWeight: 600, margin: '0 0 4px' }}>hei@norskbot.no</p>
          <p style={{ fontSize: 13, color: secondary, margin: 0 }}>Vi svarer innen 24 timer</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: 44, borderRadius: 8, border: `1px solid ${border}`,
              backgroundColor: 'white', color: secondary, fontSize: 14, fontWeight: 600,
              fontFamily: font, cursor: 'pointer',
            }}
          >
            Lukk
          </button>
          <button
            onClick={() => { window.location.href = 'mailto:hei@norskbot.no?subject=Oppgradering%20NorskBot'; }}
            style={{
              flex: 1, height: 44, borderRadius: 8, border: 'none',
              backgroundColor: blue, color: 'white', fontSize: 14, fontWeight: 600,
              fontFamily: font, cursor: 'pointer',
            }}
          >
            Send e-post
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Subscription {
  plan_name: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
}

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageMessages, setUsageMessages] = useState(0);
  const [usageDocs, setUsageDocs] = useState(0);
  const [siteCount, setSiteCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const currentPlanKey = subscription?.plan_name || 'free';
  const plan = PLANS[currentPlanKey] || PLANS.free;

  const loadBilling = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_name, status, current_period_start, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      setSubscription(sub);

      // Count sites
      const { count: sites } = await supabase
        .from('sites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setSiteCount(sites ?? 0);

      // Usage this period
      const periodStart = sub?.current_period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: logs } = await supabase
        .from('usage_logs')
        .select('action_type')
        .eq('user_id', user.id)
        .gte('created_at', periodStart);

      if (logs) {
        let msgs = 0;
        let docs = 0;
        for (const log of logs) {
          if (log.action_type === 'chat_message') msgs++;
          else if (log.action_type === 'document_ingest') docs++;
        }
        setUsageMessages(msgs);
        setUsageDocs(docs);
      }
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadBilling(); }, [loadBilling]);

  // ---- Loading state ----
  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, fontFamily: font }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: secondary, fontSize: 14 }}>Laster fakturering...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  const nextBilling = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const planIdx = PLAN_ORDER.indexOf(currentPlanKey as typeof PLAN_ORDER[number]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: font, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: `1px solid ${border}`, padding: '20px 28px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: dark, margin: 0, letterSpacing: '-0.02em' }}>
          Fakturering
        </h1>
        <p style={{ fontSize: 14, color: secondary, margin: '4px 0 0' }}>
          Administrer abonnement, forbruk og betalinger
        </p>
      </div>

      <main style={{ padding: '28px', flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

          {/* ---- Current plan + Usage row ---- */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 36 }}>
            {/* Current Plan Card */}
            <div style={{
              backgroundColor: 'white', borderRadius: 14, border: `1px solid ${border}`,
              padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 13, color: secondary, margin: '0 0 4px', fontWeight: 500 }}>Navaerende plan</p>
                  <h2 style={{ fontSize: 28, fontWeight: 700, color: dark, margin: 0 }}>{plan.label}</h2>
                </div>
                <span style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  backgroundColor: '#dbeafe', color: blue,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  Aktiv
                </span>
              </div>

              {currentPlanKey !== 'enterprise' && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: dark, letterSpacing: '-0.03em' }}>{plan.price}</span>
                  <span style={{ fontSize: 15, color: secondary }}>{plan.period}</span>
                </div>
              )}
              {currentPlanKey === 'enterprise' && (
                <p style={{ fontSize: 15, color: secondary, margin: '0 0 16px', fontWeight: 500 }}>Tilpasset pris</p>
              )}

              {nextBilling && (
                <p style={{ fontSize: 13, color: secondary, margin: 0 }}>
                  Neste fakturering: <strong style={{ color: dark }}>{nextBilling}</strong>
                </p>
              )}
              {!subscription && (
                <p style={{ fontSize: 13, color: secondary, margin: 0 }}>Ingen betalt abonnement</p>
              )}
            </div>

            {/* Usage Card */}
            <div style={{
              backgroundColor: 'white', borderRadius: 14, border: `1px solid ${border}`,
              padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: dark, margin: '0 0 20px' }}>
                Forbruk denne perioden
              </h3>
              <ProgressBar label="Meldinger" used={usageMessages} limit={plan.messages} />
              <ProgressBar label="Chatbots" used={siteCount} limit={plan.chatbots} color="#8b5cf6" />
              <ProgressBar label="Kunnskapskilder" used={usageDocs} limit={plan.chatbots * 10} color="#16a34a" />
            </div>
          </div>

          {/* ---- Plan cards ---- */}
          <div style={{ marginBottom: 36 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: dark, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
              Tilgjengelige planer
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {PLAN_ORDER.map((key, idx) => {
                const p = PLANS[key];
                const isCurrent = key === currentPlanKey;
                const isHigher = idx > planIdx;
                const isEnterprise = key === 'enterprise';

                return (
                  <div
                    key={key}
                    style={{
                      backgroundColor: 'white', borderRadius: 14, position: 'relative',
                      border: p.highlighted ? `2px solid ${blue}` : `1px solid ${border}`,
                      padding: '28px 24px',
                      boxShadow: p.highlighted ? `0 4px 24px rgba(37,99,235,0.12)` : '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex', flexDirection: 'column',
                    }}
                  >
                    {/* Badges */}
                    {isCurrent && (
                      <span style={{
                        position: 'absolute', top: 14, right: 14,
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        backgroundColor: '#dbeafe', color: blue,
                      }}>
                        Navaerende plan
                      </span>
                    )}
                    {p.highlighted && !isCurrent && (
                      <span style={{
                        position: 'absolute', top: 14, right: 14,
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        backgroundColor: blue, color: 'white',
                      }}>
                        Mest populaer
                      </span>
                    )}

                    <h4 style={{ fontSize: 18, fontWeight: 700, color: dark, margin: '0 0 8px' }}>{p.label}</h4>

                    {!isEnterprise ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                        <span style={{ fontSize: 40, fontWeight: 700, color: dark, letterSpacing: '-0.03em' }}>{p.price}</span>
                        <span style={{ fontSize: 14, color: secondary }}>{p.period}</span>
                      </div>
                    ) : (
                      <p style={{ fontSize: 16, fontWeight: 600, color: secondary, margin: '4px 0 20px' }}>Tilpasset pris</p>
                    )}

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                      {p.features.map((f) => (
                        <li key={f} style={{ padding: '5px 0', fontSize: 14, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckIcon />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => {
                        if (!isCurrent) setShowUpgradeModal(true);
                      }}
                      disabled={isCurrent}
                      style={{
                        width: '100%', height: 44, borderRadius: 8, fontSize: 14, fontWeight: 600,
                        fontFamily: font, cursor: isCurrent ? 'default' : 'pointer',
                        border: isCurrent ? 'none' : isHigher && p.highlighted ? 'none' : `1px solid ${border}`,
                        backgroundColor: isCurrent ? '#f1f5f9' : isHigher && p.highlighted ? blue : 'white',
                        color: isCurrent ? secondary : isHigher && p.highlighted ? 'white' : dark,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isCurrent
                        ? 'Navaerende plan'
                        : isEnterprise
                          ? 'Kontakt oss'
                          : isHigher
                            ? 'Oppgrader'
                            : 'Bytt plan'
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---- Billing history ---- */}
          <div style={{
            backgroundColor: 'white', borderRadius: 14, border: `1px solid ${border}`,
            overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ padding: '20px 28px', borderBottom: `1px solid ${border}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: dark, margin: 0 }}>Faktureringshistorikk</h3>
            </div>
            <div style={{ padding: '48px 28px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <FileIcon />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: dark, margin: '0 0 4px' }}>Ingen fakturaer enna</p>
              <p style={{ fontSize: 13, color: secondary, margin: 0 }}>
                Fakturaer vil vises her nar du oppgraderer til en betalt plan
              </p>
            </div>
          </div>

        </div>
      </main>

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
}
