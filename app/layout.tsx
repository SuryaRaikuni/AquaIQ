import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AquaIQ — Integrated Water Resource Intelligence Platform',
  description:
    'Real-time water stress monitoring, footprint calculation, irrigation advice, legal compliance and policy simulation for India.',
  keywords: ['water', 'IoT', 'irrigation', 'India', 'sustainability'],
  openGraph: {
    title:       'AquaIQ — Water Intelligence Platform',
    description: 'Real-time IoT water stress monitoring and advisory platform for India.',
    type:        'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect for faster Leaflet tile loading */}
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
        <link rel="preconnect" href="https://unpkg.com" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
