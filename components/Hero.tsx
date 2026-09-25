'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDown,
  Layers,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
  WifiOff,
} from 'lucide-react';

export function Hero() {
  const [bootPhase, setBootPhase] = useState<'booting' | 'beat1' | 'beat2'>('booting');
  const [linkFailing, setLinkFailing] = useState<boolean>(false);

  useEffect(() => {
    // 1. Initial boot up sequence
    const t1 = setTimeout(() => {
      setBootPhase('beat1');
    }, 1200);

    // 2. Link fails and packets start dropping
    const t2 = setTimeout(() => {
      setLinkFailing(true);
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div id="hero-section" className="relative w-full min-h-[95vh] bg-[#030305] flex flex-col items-center justify-center overflow-hidden px-4 py-16 sm:py-24">
      {/* Background radial glow & grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(41,151,255,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Booting Phase Screen */}
      <AnimatePresence>
        {bootPhase === 'booting' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2997ff] animate-ping" />
              <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.25em] text-neutral-400">
                Bringing up interfaces & topology...
              </span>
            </div>
            <div className="w-48 h-1 bg-neutral-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
                className="h-full bg-[#2997ff]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col items-center text-center space-y-10">
        {/* Network Mini-Topology Canvas */}
        <div className="relative w-full max-w-xl mx-auto h-40 sm:h-48 bg-[#161617]/80 border border-neutral-800 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl flex items-center justify-between px-8 sm:px-14 overflow-hidden">
          {/* Subtle grid in topology card */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Node 1: Workstation */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-[#2997ff] shadow-lg">
              <Terminal className="w-6 h-6" />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
              Host PC1
            </span>
          </div>

          {/* Link 1: PC1 to Router R1 */}
          <div className="flex-1 h-0.5 relative mx-2 sm:mx-4 bg-neutral-800 overflow-visible">
            <div className="absolute inset-0 bg-[#2997ff]/40" />
            {/* Packet animation */}
            <motion.div
              animate={{ left: ['0%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#2997ff] shadow-[0_0_8px_#2997ff]"
            />
          </div>

          {/* Node 2: Core Router */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white shadow-lg">
              <Activity className="w-6 h-6 text-neutral-300" />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
              Router R1
            </span>
          </div>

          {/* Link 2: R1 to Web Server (FAILS AND GOES RED!) */}
          <div className="flex-1 h-0.5 relative mx-2 sm:mx-4 bg-neutral-800 overflow-visible">
            <div
              className={`absolute inset-0 transition-colors duration-700 ${
                linkFailing ? 'bg-[#ff453a]' : 'bg-[#2997ff]/40'
              }`}
            />
            {/* Packet dropping effect */}
            {!linkFailing ? (
              <motion.div
                animate={{ left: ['0%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#2997ff] shadow-[0_0_8px_#2997ff]"
              />
            ) : (
              <motion.div
                animate={{ left: ['0%', '50%'], opacity: [1, 0], scale: [1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#ff453a] shadow-[0_0_10px_#ff453a]"
              />
            )}

            {linkFailing && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <span className="px-2 py-0.5 rounded bg-[#ff453a] text-black font-mono text-[8px] font-bold tracking-wider animate-bounce">
                  PACKET LOSS
                </span>
              </div>
            )}
          </div>

          {/* Node 3: Target Web Server */}
          <div className="flex flex-col items-center gap-2 z-10">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900 border transition-all duration-700 flex items-center justify-center shadow-lg ${
                linkFailing
                  ? 'border-[#ff453a]/60 text-[#ff453a]'
                  : 'border-white/10 text-neutral-300'
              }`}
            >
              {linkFailing ? <WifiOff className="w-6 h-6 animate-pulse" /> : <Terminal className="w-6 h-6" />}
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
              Web Server
            </span>
          </div>
        </div>

        {/* Beat 1: "The network is down. Now what?" */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff453a]/10 border border-[#ff453a]/30 text-[#ff453a] font-mono text-xs font-semibold uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Incident Report: Link Offline</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-tight">
            The network is down. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-white">
              Now what?
            </span>
          </h1>

          <p className="text-lg sm:text-2xl text-neutral-300 max-w-2xl mx-auto font-light leading-relaxed">
            Random rebooting is not a strategy. True network engineers isolate issues with precision.
          </p>
        </div>

        {/* Beat 2: "Troubleshooting is a method, not a guess." */}
        <div className="w-full max-w-4xl p-6 sm:p-8 rounded-[2.5rem] bg-[#161617]/90 border border-neutral-800 shadow-2xl backdrop-blur-md grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Column 1: The Layered Method */}
          <div className="p-6 rounded-[2rem] bg-black/40 border border-neutral-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#2997ff]/10 border border-[#2997ff]/20 flex items-center justify-center text-[#2997ff]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              1. The Layered Method
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Work up the OSI stack systematically from Physical (L1) to Application (L7). A layer can only function if every single layer beneath it is operational.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-zinc-300">
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">Physical</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">Data Link</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">Network</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">Transport</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">Application</span>
            </div>
          </div>

          {/* Column 2: The Diagnostic Toolbox */}
          <div className="p-6 rounded-[2rem] bg-black/40 border border-neutral-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#30d158]/10 border border-[#30d158]/20 flex items-center justify-center text-[#30d158]">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              2. The Diagnostic Toolbox
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Every utility answers one specific question. Master the exact syntax, healthy baselines, and fault signatures of standard tools.
            </p>
            <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-zinc-300">
              <span className="px-2 py-0.5 rounded bg-[#2997ff]/10 border border-[#2997ff]/30 text-[#2997ff]">ping</span>
              <span className="px-2 py-0.5 rounded bg-[#2997ff]/10 border border-[#2997ff]/30 text-[#2997ff]">tracert</span>
              <span className="px-2 py-0.5 rounded bg-[#2997ff]/10 border border-[#2997ff]/30 text-[#2997ff]">ipconfig</span>
              <span className="px-2 py-0.5 rounded bg-[#2997ff]/10 border border-[#2997ff]/30 text-[#2997ff]">nslookup</span>
              <span className="px-2 py-0.5 rounded bg-[#2997ff]/10 border border-[#2997ff]/30 text-[#2997ff]">arp -a</span>
              <span className="px-2 py-0.5 rounded bg-[#2997ff]/10 border border-[#2997ff]/30 text-[#2997ff]">netstat</span>
            </div>
          </div>
        </div>

        {/* Call to action anchor buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="#simulation"
            className="px-8 py-4 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer"
          >
            <span>Launch Virtual Lab</span>
            <ArrowDown className="w-4 h-4" />
          </a>

          <a
            href="#theory"
            className="px-8 py-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            Read Theory Reference
          </a>
        </div>
      </div>
    </div>
  );
}
