'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SilkRibbon } from './site/SilkRibbon';
import { RollText } from './site/RollText';
import { LAB_CONFIG } from '../lib/config';
import {
  ArrowRight,
  ArrowDown,
  Activity,
  Terminal,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export function Hero() {
  const [linkBroken, setLinkBroken] = useState(false);

  useEffect(() => {
    // Break the link after 2.8s to show packet drop
    const timer = setTimeout(() => {
      setLinkBroken(true);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative w-full min-h-[92vh] flex items-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-10 pb-16">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-glow/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10">
        {/* Left Column: Headline, Pill, Subhead, CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6 max-w-2xl">
          {/* Institutional Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0d1410] border border-hairline-bright shadow-sm">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 overflow-hidden shrink-0">
              <Image
                src="/somaiya-logo.png"
                alt="Somaiya Emblem"
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[11px] font-homevideo text-[#34d399] tracking-wider uppercase">
              {LAB_CONFIG.institutionShort} &bull; EXP {LAB_CONFIG.experimentNumber}
            </span>
          </div>

          {/* Large Two-Tone Headline */}
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
              The network is down.
            </h1>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-neutral-400 leading-[1.1]">
              Know what you&apos;re looking at.
            </h2>
          </div>

          {/* Muted Descriptive Paragraph */}
          <p className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed max-w-xl">
            Troubleshooting is a method, not a guess. Step systematically through physical link carrier status, Layer 2 ARP resolution, Layer 3 gateway routing, and Transport firewalls in a live in-memory simulator.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#simulation"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-solid hover:bg-emerald-hover text-white text-xs sm:text-sm font-semibold tracking-wide border border-emerald-glow/40 shadow-[0_0_25px_rgba(52,211,153,0.3)] transition-all active:scale-95 group cursor-pointer"
            >
              <RollText text="Start the simulation" />
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>

            <a
              href="#theory"
              className="inline-flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer group"
            >
              <span>Read the theory</span>
              <ArrowDown className="w-4 h-4 text-[#34d399] transition-transform duration-200 group-hover:translate-y-0.5" />
            </a>
          </div>

          {/* Trust Specs Strip */}
          <ul className="pt-6 border-t border-hairline flex flex-wrap gap-4 text-[10px] font-homevideo tracking-widest text-neutral-500 uppercase">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
              <span>OSI L1-L7 METHOD</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
              <span>DIAGNOSTIC TOOLBOX</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
              <span>ZERO REAL NETWORKING</span>
            </li>
          </ul>
        </div>

        {/* Right Column: Luminous Silk Ribbon + Mini Live Telemetry Triage Card */}
        <div className="lg:col-span-5 relative w-full flex items-center justify-center min-h-[380px] sm:min-h-[440px]">
          {/* Silk Ribbon flowing in the background */}
          <SilkRibbon className="absolute inset-0" />

          {/* Interactive Mini-Topology Card */}
          <div className="relative z-10 w-full max-w-md p-6 rounded-[2rem] bg-[#0c120f]/85 border border-hairline-bright shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl space-y-5">
            {/* Window Top Bar with Traffic Light Dots */}
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                <span className="text-[10px] font-homevideo text-neutral-400 ml-2 tracking-wider">
                  TELEMETRY / LIVE RUN
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-tint border border-emerald-glow/30 text-[#34d399] uppercase tracking-wider">
                {linkBroken ? 'LINK OFFLINE' : 'TRAFFIC NOMINAL'}
              </span>
            </div>

            {/* Visual Node Link Simulation */}
            <div className="h-28 bg-[#050807]/90 rounded-2xl border border-hairline p-4 flex items-center justify-between relative overflow-hidden">
              {/* Node PC1 */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-hairline-bright flex items-center justify-center text-[#34d399]">
                  <Terminal className="w-5 h-5" />
                </div>
                <span className="font-homevideo text-[8px] text-neutral-400">PC1 (10)</span>
              </div>

              {/* Cable 1 */}
              <div className="flex-1 h-0.5 mx-2 bg-neutral-800 relative">
                <div className="absolute inset-0 bg-[#34d399]/40" />
                <motion.div
                  animate={{ left: ['0%', '100%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]"
                />
              </div>

              {/* Node R1 Router */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-hairline flex items-center justify-center text-white">
                  <Activity className="w-5 h-5 text-neutral-300" />
                </div>
                <span className="font-homevideo text-[8px] text-neutral-400">R1 (GW)</span>
              </div>

              {/* Cable 2 (Breaks and drops packet) */}
              <div className="flex-1 h-0.5 mx-2 bg-neutral-800 relative">
                <div
                  className={`absolute inset-0 transition-colors duration-500 ${
                    linkBroken ? 'bg-[#f87171]' : 'bg-[#34d399]/40'
                  }`}
                />
                {!linkBroken ? (
                  <motion.div
                    animate={{ left: ['0%', '100%'] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]"
                  />
                ) : (
                  <motion.div
                    animate={{ left: ['0%', '50%'], opacity: [1, 0], scale: [1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#f87171] shadow-[0_0_8px_#f87171]"
                  />
                )}
              </div>

              {/* Node Server */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div
                  className={`w-10 h-10 rounded-xl bg-neutral-900 border transition-colors duration-500 flex items-center justify-center ${
                    linkBroken
                      ? 'border-[#f87171]/60 text-[#f87171]'
                      : 'border-hairline text-neutral-300'
                  }`}
                >
                  {linkBroken ? <WifiOff className="w-5 h-5 animate-pulse" /> : <Terminal className="w-5 h-5" />}
                </div>
                <span className="font-homevideo text-[8px] text-neutral-400">WEB (80)</span>
              </div>
            </div>

            {/* Telemetry rows */}
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between p-2 rounded-xl bg-[#080d0b] border border-hairline">
                <span className="text-neutral-400">Target Address:</span>
                <span className="text-white font-medium">www.lab.local [172.16.0.80]</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-[#080d0b] border border-hairline">
                <span className="text-neutral-400">Active Diagnosis:</span>
                <span
                  className={
                    linkBroken
                      ? 'text-[#f87171] font-bold font-homevideo'
                      : 'text-[#34d399] font-bold font-homevideo'
                  }
                >
                  {linkBroken ? 'PHYSICAL / L1 LINK DOWN' : 'BIDIRECTIONAL RTT 14ms'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
