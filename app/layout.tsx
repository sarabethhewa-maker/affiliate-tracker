import type { Metadata } from 'next';
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Affiliate Tracker',
  description: 'Bio Longevity Affiliate Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <SignedOut>
            <div style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              alignItems: 'center', height: '100vh', background: '#060a0e', gap: 16
            }}>
              <div style={{ color: '#e8f0f8', fontSize: 24, fontWeight: 800 }}>
                Affiliate Dashboard
              </div>
              <div style={{ color: '#5a6a7a', fontSize: 14, marginBottom: 8 }}>
                Bio Longevity Labs — Internal Use Only
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
            <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 999 }}>
              <UserButton />
            </div>
            {children}
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
