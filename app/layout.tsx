import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from 'next/font/google';
import { Atmosphere } from '@/components/atmosphere/Atmosphere';
import './globals.css';

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });
const display = IBM_Plex_Sans_Condensed({ subsets: ['latin'], weight: ['300', '500', '600', '700'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'Network Troubleshooting & Simulator · Experiment 10 · Somaiya Virtual Labs',
  description:
    'Interactive network laboratory: inject faults into a five-node topology, diagnose them with ping, tracert, ipconfig, nslookup, arp and netstat, repair the network and verify recovery.',
  icons: { icon: '/somaiya-logo.png', apple: '/somaiya-logo.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0b0c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body className="min-h-screen bg-ink text-paper">
        <Atmosphere />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
