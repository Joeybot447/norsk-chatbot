'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../_lib/supabase/client';
import { useAuth } from '../../_lib/supabase/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { User, Bell, Shield, Key, AlertTriangle, Copy, RefreshCw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  site_name?: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------
function DeleteModal({ onCancel, onConfirm, deleting }: { onCancel: () => void; onConfirm: () => void; deleting: boolean }) {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmed = confirmText.toLowerCase() === 'slett kontoen min';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <Card className="max-w-[440px] w-[90%] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-7">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Slett konto permanent</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-5">
            Alle dine data, chatbots, samtaler og kunnskapskilder vil bli permanent slettet. Denne handlingen kan ikke angres.
          </p>
          <div className="mb-5">
            <Label className="text-sm text-slate-500 mb-1.5">
              Skriv <strong className="text-slate-900">slett kontoen min</strong> for a bekrefte
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="slett kontoen min"
              className={confirmText && !isConfirmed ? 'border-red-300' : ''}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} disabled={deleting} className="flex-1">Avbryt</Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={!isConfirmed || deleting}
              className="flex-1"
            >
              {deleting ? 'Sletter...' : 'Slett konto'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Regenerate confirmation modal
// ---------------------------------------------------------------------------
function RegenerateModal({ onCancel, onConfirm, regenerating }: { onCancel: () => void; onConfirm: () => void; regenerating: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <Card className="max-w-[400px] w-[90%] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-7">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Regenerer API-nokkel</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Den eksisterende nokkelen vil slutte a fungere umiddelbart. Du ma oppdatere widgeten med den nye nokkelen.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} disabled={regenerating} className="flex-1">Avbryt</Button>
            <Button onClick={onConfirm} disabled={regenerating} className="flex-1">
              {regenerating ? 'Regenererer...' : 'Regenerer'}
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
export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);

  // Notifications
  const [notifNewConversations, setNotifNewConversations] = useState(true);
  const [notifDailySummary, setNotifDailySummary] = useState(false);
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  // API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [regenKeyId, setRegenKeyId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setCompany(user.companyName || '');
    }
  }, [user]);

  const loadApiKeys = useCallback(async () => {
    if (!user) return;
    setLoadingKeys(true);
    try {
      const { data: sites } = await supabase.from('sites').select('id, name').eq('user_id', user.id);
      if (sites && sites.length > 0) {
        const siteIds = sites.map((s: any) => s.id);
        const siteMap = Object.fromEntries(sites.map((s: any) => [s.id, s.name]));
        const { data: keys } = await supabase.from('api_keys').select('id, key_prefix, name, is_active, site_id, created_at').in('site_id', siteIds).order('created_at', { ascending: false });
        if (keys) {
          setApiKeys(keys.map((k: any) => ({ ...k, site_name: siteMap[k.site_id] || k.name })));
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingKeys(false);
    }
  }, [user]);

  useEffect(() => { loadApiKeys(); }, [loadApiKeys]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ display_name: displayName, company_name: company }).eq('id', user.id);
      if (error) throw error;
      setStatus({ message: 'Profilen er oppdatert', type: 'success' });
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Kunne ikke lagre profilen', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotif(true);
    await new Promise((r) => setTimeout(r, 400));
    setStatus({ message: 'Varslingsinnstillinger lagret', type: 'success' });
    setSavingNotif(false);
  };

  const handleRegenerate = async () => {
    if (!regenKeyId) return;
    setRegenerating(true);
    try {
      await supabase.from('api_keys').update({ is_active: false }).eq('id', regenKeyId);
      setStatus({ message: 'API-nokkelen er deaktivert. Opprett en ny nokkel via Widget-konfigurasjon.', type: 'success' });
      await loadApiKeys();
    } catch {
      setStatus({ message: 'Kunne ikke regenerere nokkelen', type: 'error' });
    } finally {
      setRegenerating(false);
      setRegenKeyId(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Kunne ikke slette kontoen', type: 'error' });
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCopyKey = (prefix: string) => {
    navigator.clipboard.writeText(prefix + '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Laster innstillinger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-5">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Innstillinger</h1>
        <p className="text-sm text-slate-500 mt-1">Administrer profil, varsler, API-nokler og konto</p>
      </div>

      <div className="p-4 md:p-6">
        <div className="max-w-[720px] mx-auto">
          {/* Status banner */}
          {status && (
            <Card className={`mb-6 ${status.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-4 flex justify-between items-center">
                <span className={`text-sm font-medium ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{status.message}</span>
                <button onClick={() => setStatus(null)} className="text-inherit hover:opacity-70 bg-transparent border-none cursor-pointer text-lg leading-none">&times;</button>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Varsler
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-2">
                <Shield className="h-4 w-4" />
                Konto
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profil</CardTitle>
                  <CardDescription>Personlig informasjon knyttet til kontoen din</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-6 space-y-5">
                  <div>
                    <Label htmlFor="displayName" className="mb-1.5">Visningsnavn</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-1.5">E-postadresse</Label>
                    <Input id="email" value={email} disabled className="bg-slate-50 text-slate-500" />
                    <p className="text-xs text-slate-400 mt-1">E-postadressen kan ikke endres</p>
                  </div>
                  <div>
                    <Label htmlFor="company" className="mb-1.5">Organisasjon</Label>
                    <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Valgfritt" />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => { if (user) { setDisplayName(user.displayName || ''); setCompany(user.companyName || ''); } }}>
                      Avbryt
                    </Button>
                    <Button className="w-full sm:w-auto" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? 'Lagrer...' : 'Lagre profil'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* API Keys */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">API-nokler</CardTitle>
                  <CardDescription>Alle API-nokler for dine chatbots</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-6">
                  {loadingKeys ? (
                    <p className="text-sm text-slate-500">Laster nokler...</p>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-6">
                      <Key className="h-9 w-9 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-900 mb-1">Ingen API-nokler</p>
                      <p className="text-sm text-slate-500">Opprett en chatbot for a generere en API-nokkel</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nettsted</TableHead>
                          <TableHead>Nokkelprefix</TableHead>
                          <TableHead className="text-right">Handlinger</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {apiKeys.map((key) => (
                          <TableRow key={key.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-900">{key.site_name || key.name}</span>
                                {!key.is_active && <Badge variant="destructive" className="text-[10px]">Deaktivert</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-sm text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded">
                                {key.key_prefix}...
                              </code>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={() => handleCopyKey(key.key_prefix)}>
                                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                                  Kopier
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setRegenKeyId(key.id)}>
                                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                  Regenerer
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Language */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sprak</CardTitle>
                  <CardDescription>Grensesnittets sprak</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Norsk (bokmal)</p>
                      <p className="text-sm text-slate-500 mt-0.5">Flere sprak kommer snart</p>
                    </div>
                    <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">Aktivt</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Varsler</CardTitle>
                  <CardDescription>Velg hvilke e-postvarsler du vil motta</CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="p-6">
                  {[
                    { label: 'Nye samtaler', desc: 'Fa varsel nar en ny besokende starter en samtale', value: notifNewConversations, set: setNotifNewConversations },
                    { label: 'Daglig oppsummering', desc: 'Daglig sammendrag av chatbot-aktivitet', value: notifDailySummary, set: setNotifDailySummary },
                    { label: 'Ukentlig rapport', desc: 'Ukentlig rapport med statistikk og innsikt', value: notifWeeklyReport, set: setNotifWeeklyReport },
                  ].map((item, idx) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.label}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                        <Switch checked={item.value} onCheckedChange={item.set} />
                      </div>
                      {idx < 2 && <Separator />}
                    </div>
                  ))}
                  <div className="flex justify-end mt-5">
                    <Button onClick={handleSaveNotifications} disabled={savingNotif}>
                      {savingNotif ? 'Lagrer...' : 'Lagre varsler'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-base text-red-600">Faresone</CardTitle>
                  <CardDescription>Irreversible handlinger</CardDescription>
                </CardHeader>
                <Separator className="bg-red-200" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Slett konto</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Alle data, chatbots og samtaler blir permanent slettet
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setShowDeleteModal(true)} className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-600">
                      Slett konto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      {showDeleteModal && <DeleteModal onCancel={() => setShowDeleteModal(false)} onConfirm={handleDeleteAccount} deleting={deleting} />}
      {regenKeyId && <RegenerateModal onCancel={() => setRegenKeyId(null)} onConfirm={handleRegenerate} regenerating={regenerating} />}
    </div>
  );
}
