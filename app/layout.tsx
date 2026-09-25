import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { Atmosphere } from '@/components/atmosphere/Atmosphere';
import './globals.css';

const display = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['300', '500', '600', '700', '800'], variable: '--font-display', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Network Troubleshooting & Simulator · Experiment 8 · Somaiya Virtual Labs',
  description:
    'Interactive network laboratory: inject faults into a five-node topology, diagnose them with ping, tracert, ipconfig, nslookup, arp and netstat, repair the network and verify recovery.',
  icons: { icon: [{ url: '/somaiya-emblem.png', type: 'image/png', sizes: '32x32' }], shortcut: '/favicon.ico', apple: '/somaiya-emblem.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0b0c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${mono.variable} ${display.variable}`}>
      <body className="min-h-screen bg-ink text-paper">
        <Atmosphere />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
