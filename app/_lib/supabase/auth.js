import { supabase } from './client';

export async function signUp(email, password, metadata) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: metadata.displayName,
        company_name: metadata.companyName,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, company_name, avatar_url, plan')
    .eq('id', user.id)
    .single();
  return {
    id: user.id,
    email: user.email,
    displayName: profile?.display_name || user.email.split('@')[0],
    companyName: profile?.company_name,
    avatarUrl: profile?.avatar_url,
    plan: profile?.plan || 'free',
  };
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/auth/reset-password',
  });
  if (error) throw error;
}
