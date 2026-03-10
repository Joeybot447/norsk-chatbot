'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 400,
      
    }}>
      <p style={{ color: '#64748b', fontSize: 14 }}>Viderekobler til innstillinger...</p>
    </div>
  );
}
