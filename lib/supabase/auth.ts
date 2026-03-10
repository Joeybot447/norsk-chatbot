import { supabase } from './client';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  companyName?: string;
  avatarUrl?: string;
  plan: string;
}

// Sign up with email/password
export async function signUp(
  email: string,
  password: string,
  metadata: { displayName: string; companyName?: string }
) {
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

// Sign in with email/password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get current user with profile data
export async function getCurrentUser(): Promise<AuthUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, company_name, avatar_url, plan')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    displayName: profile?.display_name || user.email!.split('@')[0],
    companyName: profile?.company_name,
    avatarUrl: profile?.avatar_url,
    plan: profile?.plan || 'free',
  };
}

// Send password reset email
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}
