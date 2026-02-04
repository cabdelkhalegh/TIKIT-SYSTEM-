'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const currentUser = localStorage.getItem('tikit_current_user');
    if (currentUser) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)'
    }}>
      <div style={{ textAlign: 'center', color: '#0369a1' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎫 TIKIT System</h1>
        <p>Loading...</p>
      </div>
    </div>
  );
}
