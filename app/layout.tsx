import type { Metadata } from 'next';
import './globals.css';
import { LAB_CONFIG } from '../lib/config';
import { SmoothScrollProvider } from '../components/site/SmoothScrollProvider';
import { FluidParticlesBackground } from '../components/site/FluidParticlesBackground';
import { Lab0SilkBackground } from '../components/site/Lab0SilkBackground';

export const metadata: Metadata = {
  title: `${LAB_CONFIG.experimentTitle} — Virtual Lab | ${LAB_CONFIG.institutionShort}`,
  description: `A technical reference guide and interactive simulation platform detailing systematic network troubleshooting methodology (OSI Layer 1-7), diagnostic utilities (ping, tracert, ipconfig, nslookup, arp, netstat, telnet), and fault injection triage for ${LAB_CONFIG.institution}.`,
  icons: {
    icon: '/somaiya-logo.png',
    shortcut: '/somaiya-logo.png',
    apple: '/somaiya-logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark w-full overflow-x-hidden">
      <head>
        <link rel="icon" type="image/png" href="/somaiya-logo.png" />
        <link rel="shortcut icon" href="/somaiya-logo.png" />
        <link rel="apple-touch-icon" href="/somaiya-logo.png" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[#050807] text-[#e8f2ec] font-sans antialiased selection:bg-emerald-500/25 selection:text-emerald-200 w-full overflow-x-hidden relative">
        <SmoothScrollProvider>
          <Lab0SilkBackground />
          <FluidParticlesBackground />
          <div className="relative z-10 w-full">
            {children}
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
