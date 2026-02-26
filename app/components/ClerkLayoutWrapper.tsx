"use client";

import { usePathname } from 'next/navigation';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { SettingsProvider } from '@/app/contexts/SettingsContext';

export default function ClerkLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isJoinPage = pathname === '/join';

  if (isJoinPage) return <>{children}</>;

  return (
    <>
      <SignedOut>
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', height: '100vh', background: '#060a0e', gap: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <img src="/logo.png" alt="Biolongevity Labs" style={{ height: 60, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ color: '#e8f0f8', fontSize: 24, fontWeight: 800 }}>
            Affiliate Dashboard
          </div>
          <div style={{ color: '#5a6a7a', fontSize: 14, marginBottom: 8 }}>
            Biolongevity Labs — Internal Use Only
          </div>
          <SignInButton mode="modal">
            <button style={{
              background: '#1a4a8a', color: 'white', padding: '12px 32px',
              borderRadius: 8, border: 'none', fontSize: 15, cursor: 'pointer', fontWeight: 700
            }}>
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <SettingsProvider>
          <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 999 }}>
            <UserButton />
          </div>
          {children}
        </SettingsProvider>
      </SignedIn>
    </>
  );
}
