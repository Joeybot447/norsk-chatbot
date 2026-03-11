'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Check, FileText, Mail } from 'lucide-react';

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
    features: ['1 chatbot', '100 meldinger per måned', 'Grunnleggende widget', 'E-poststøtte'],
    highlighted: false,
  },
  professional: {
    label: 'Pro',
    price: '990',
    period: 'kr/mnd',
    messages: 10_000,
    chatbots: 5,
    features: ['5 chatbots', '10 000 meldinger per måned', 'Widget-tilpasning', 'Prioritert støtte', 'Analyse-dashboard', 'API-tilgang'],
    highlighted: true,
  },
  enterprise: {
    label: 'Enterprise',
    price: 'Tilpasset',
    period: '',
    messages: Infinity,
    chatbots: Infinity,
    features: ['Ubegrenset chatbots', 'Ubegrenset meldinger', 'Hvit-merke widget', 'Dedikert kontaktperson', 'SLA-garanti', 'Egendefinerte integrasjoner', 'SSO / SAML'],
    highlighted: false,
  },
};

const PLAN_ORDER = ['free', 'professional', 'enterprise'] as const;

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
function ProgressBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = !isFinite(limit);
  const pct = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const overThreshold = pct > 80;

  return (
    <div className="mb-5">
      <div className="flex justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        <span className="text-sm text-slate-500">
          {used.toLocaleString('nb-NO')} / {isUnlimited ? 'Ubegrenset' : limit.toLocaleString('nb-NO')}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${overThreshold ? 'bg-red-500' : 'bg-blue-600'}`}
          style={{ width: isUnlimited ? '0%' : `${pct}%` }}
        />
      </div>
      {overThreshold && (
        <p className="text-xs text-red-600 mt-1 font-medium">
          {pct >= 100 ? 'Grensen er nadd' : 'Naermer seg grensen'}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upgrade modal
// ---------------------------------------------------------------------------
function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <Card className="max-w-[420px] w-[90%] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Oppgradering kommer snart</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Stripe-betaling er under utvikling. Kontakt oss for å oppgradere planen din allerede i dag.
          </p>
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-slate-900 mb-1">hei@norskbot.no</p>
              <p className="text-sm text-slate-500">Vi svarer innen 24 timer</p>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Lukk</Button>
            <Button onClick={() => { window.location.href = 'mailto:hei@norskbot.no?subject=Oppgradering%20NorskBot'; }} className="flex-1 gap-2">
              <Mail className="h-4 w-4" />
              Send e-post
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
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
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_name, status, current_period_start, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      setSubscription(sub);

      const { count: sites } = await supabase
        .from('sites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setSiteCount(sites ?? 0);

      const periodStart = sub?.current_period_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: logs } = await supabase
        .from('usage_logs')
        .select('action_type')
        .eq('user_id', user.id)
        .gte('created_at', periodStart);

      if (logs) {
        let msgs = 0, docs = 0;
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Laster fakturering...</p>
        </div>
      </div>
    );
  }

  const nextBilling = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const planIdx = PLAN_ORDER.indexOf(currentPlanKey as typeof PLAN_ORDER[number]);

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-5">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Fakturering</h1>
        <p className="text-sm text-slate-500 mt-1">Administrer abonnement, forbruk og betalinger</p>
      </div>

      <div className="p-4 md:p-6">
        <div className="max-w-[1120px] mx-auto">
          {/* Current plan + Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Current Plan */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">Navaerende plan</p>
                    <h2 className="text-2xl font-bold text-slate-900">{plan.label}</h2>
                  </div>
                  <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Aktiv
                  </Badge>
                </div>

                {currentPlanKey !== 'enterprise' ? (
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-slate-900 tracking-tight">{plan.price}</span>
                    <span className="text-base text-slate-500">{plan.period}</span>
                  </div>
                ) : (
                  <p className="text-base text-slate-500 font-medium mb-4">Tilpasset pris</p>
                )}

                {nextBilling && (
                  <p className="text-sm text-slate-500">
                    Neste fakturering: <strong className="text-slate-900">{nextBilling}</strong>
                  </p>
                )}
                {!subscription && (
                  <p className="text-sm text-slate-500">Ingen betalt abonnement</p>
                )}
              </CardContent>
            </Card>

            {/* Usage */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-5">Forbruk denne perioden</h3>
                <ProgressBar label="Meldinger" used={usageMessages} limit={plan.messages} />
                <ProgressBar label="Chatbots" used={siteCount} limit={plan.chatbots} />
                <ProgressBar label="Kunnskapskilder" used={usageDocs} limit={plan.chatbots * 10} />
              </CardContent>
            </Card>
          </div>

          {/* Plan cards */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tilgjengelige planer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {PLAN_ORDER.map((key, idx) => {
                const p = PLANS[key];
                const isCurrent = key === currentPlanKey;
                const isHigher = idx > planIdx;
                const isEnterprise = key === 'enterprise';

                return (
                  <Card
                    key={key}
                    className={`relative flex flex-col ${p.highlighted ? 'border-blue-600 border-2 shadow-md shadow-blue-600/10' : ''}`}
                  >
                    <CardContent className="p-6 flex-1 flex flex-col">
                      {/* Badges */}
                      {isCurrent && (
                        <Badge className="absolute top-4 right-4 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50 text-[11px]">
                          Navaerende plan
                        </Badge>
                      )}
                      {p.highlighted && !isCurrent && (
                        <Badge className="absolute top-4 right-4 bg-blue-600 text-white hover:bg-blue-600 text-[11px]">
                          Mest populær
                        </Badge>
                      )}

                      <h4 className="text-lg font-bold text-slate-900 mb-2">{p.label}</h4>

                      {!isEnterprise ? (
                        <div className="flex items-baseline gap-1 mb-5">
                          <span className="text-4xl font-bold text-slate-900 tracking-tight">{p.price}</span>
                          <span className="text-sm text-slate-500">{p.period}</span>
                        </div>
                      ) : (
                        <p className="text-base font-semibold text-slate-500 mb-5">Tilpasset pris</p>
                      )}

                      <ul className="space-y-2.5 flex-1 mb-6">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => { if (!isCurrent) setShowUpgradeModal(true); }}
                        disabled={isCurrent}
                        variant={isCurrent ? 'secondary' : isHigher && p.highlighted ? 'default' : 'outline'}
                        className="w-full"
                      >
                        {isCurrent
                          ? 'Navaerende plan'
                          : isEnterprise
                            ? 'Kontakt oss'
                            : isHigher
                              ? 'Oppgrader'
                              : 'Bytt plan'
                        }
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Billing history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Faktureringshistorikk</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-12 text-center">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <p className="text-base font-semibold text-slate-900 mb-1">Ingen fakturaer enna</p>
              <p className="text-sm text-slate-500">
                Fakturaer vil vises her nar du oppgraderer til en betalt plan
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
}
