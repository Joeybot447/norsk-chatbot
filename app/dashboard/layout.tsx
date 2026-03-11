'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_lib/supabase/hooks';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  // Not authenticated and not loading — redirect is in progress
  if (!loading && !user) return null;

  // Always render sidebar to prevent layout flicker.
  // Only the main content area shows a loading state.
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-slate-50 min-h-screen overflow-y-auto pt-14 lg:pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <div className="w-10 h-10 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Laster...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
