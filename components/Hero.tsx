'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SilkRibbon } from './site/SilkRibbon';
import { RollText } from './site/RollText';
import { LiquidButton, MetalButton, Button } from './ui/liquid-glass-button';
import { LampContainer } from './ui/lamp';
import { LAB_CONFIG } from '../lib/config';
import {
  ArrowRight,
  ArrowDown,
  Activity,
  Terminal,
  WifiOff,
  Radio,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  RotateCcw,
  Gamepad2,
} from 'lucide-react';

export function Hero() {
  const [linkBroken, setLinkBroken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [packetCount, setPacketCount] = useState(1482);
  const [latency, setLatency] = useState(13.4);
  const [packetStream, setPacketStream] = useState<
    { id: string; proto: string; status: 'ok' | 'drop'; detail: string }[]
  >([
    { id: 'p-1', proto: 'ICMP', status: 'ok', detail: 'Echo Req -> 172.16.0.80 [14ms]' },
    { id: 'p-2', proto: 'TCP', status: 'ok', detail: 'SYN:80 -> Handshake ACK' },
    { id: 'p-3', proto: 'DNS', status: 'ok', detail: 'A www.lab.local -> 172.16.0.80' },
  ]);

  // Live telemetry pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setPacketCount((prev) => prev + 1);
      if (!linkBroken) {
        setLatency(Number((12.5 + Math.random() * 2.8).toFixed(1)));
        setPacketStream((prev) => [
          ...prev.slice(-3),
          {
            id: `p-${Date.now()}`,
            proto: Math.random() > 0.5 ? 'ICMP' : 'TCP',
            status: 'ok',
            detail: `Echo Reply from 172.16.0.80 RTT=${(12 + Math.random() * 3).toFixed(0)}ms`,
          },
        ]);
      } else {
        setLatency(999);
        setPacketStream((prev) => [
          ...prev.slice(-3),
          {
            id: `p-${Date.now()}`,
            proto: 'ICMP',
            status: 'drop',
            detail: 'Destination Host Unreachable (L1 Carrier Dropped)',
          },
        ]);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [linkBroken]);

  const copyCommand = () => {
    navigator.clipboard.writeText('ping -t 172.16.0.80');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative w-full min-h-[96vh] flex items-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 pb-20">
      {/* 1. Aceternity UI Lamp Hero Lighting Effect (Directly layered between Liquid Metal and Hero Glass) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] sm:h-[550px] pointer-events-none z-0 overflow-hidden">
        <LampContainer />
      </div>

      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[650px] h-[650px] bg-[#1f7a4d]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[#34d399]/08 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center z-10 pt-4 sm:pt-8">
        {/* Left Column: Glass Container with Eyebrow, Headline, Subhead, Interactive CLI Pill, CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6 max-w-2xl bg-[#0a0f0d]/65 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] relative z-10">
          {/* Institutional Pill Badge with Live Kernel Status */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 shadow-sm backdrop-blur-md">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                <Image
                  src="/somaiya-logo.png"
                  alt="Somaiya Emblem"
                  width={20}
                  height={20}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[11px] font-display text-[#34d399] tracking-wider uppercase">
                {LAB_CONFIG.institutionShort} &bull; EXP {LAB_CONFIG.experimentNumber}
              </span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101713] border border-[#78b496]/20 text-[10px] font-mono text-[#78b496]">
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse shadow-[0_0_8px_#34d399]" />
              <span>LIVE VLAB KERNEL // IN-MEMORY ENGINE</span>
            </div>
          </div>

          {/* Large Two-Tone Shimmer Headline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-white leading-[1.05]">
              The network is down.
            </h1>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-light tracking-tight text-[#78b496]/90 leading-[1.1]">
              Know what you&apos;re looking at.
            </h2>
          </div>

          {/* Muted Descriptive Paragraph */}
          <p className="text-sm sm:text-base text-[#c9dccf]/90 font-sans font-normal leading-relaxed max-w-xl">
            Troubleshooting is a method, not a guess. Step systematically through physical link carrier status, Layer 2 ARP resolution, Layer 3 gateway routing, and Transport firewalls in a live client-side simulator.
          </p>

          {/* Interactive Developer Quick-Command Pill */}
          <div className="w-full max-w-lg p-2.5 rounded-2xl bg-[#0a0f0d] border border-[#78b496]/20 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 pl-2 font-mono text-xs text-[#c9dccf] truncate">
              <span className="text-[#34d399] font-bold select-none">&gt;</span>
              <span className="text-white font-medium">ping -t 172.16.0.80</span>
              <span className="text-[10px] text-[#78b496]/60 hidden sm:inline select-none">
                # probe server DMZ
              </span>
            </div>

            <Button
              variant="cool"
              size="sm"
              onClick={copyCommand}
              className="inline-flex items-center gap-1.5 shrink-0 cursor-pointer font-mono text-xs text-[#34d399]"
              title="Copy test command"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#34d399]" />
                  <span className="text-[#34d399]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          {/* Action CTAs with Liquid Glass & Metal Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <LiquidButton
              type="button"
              size="xl"
              onClick={() => {
                const el = document.getElementById('simulation');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-white hover:text-[#34d399] font-display cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <span>Launch Simulator Suite</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 text-[#34d399]" />
              </span>
            </LiquidButton>

            <MetalButton
              variant="gold"
              onClick={() => {
                const el = document.getElementById('minigame');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="cursor-pointer"
            >
              <span className="flex items-center gap-2 font-display text-xs">
                <Gamepad2 className="w-4 h-4 text-[#c8b27a]" />
                <span>Play Arcade Mini-Game</span>
              </span>
            </MetalButton>

            <a
              href="#theory"
              className="inline-flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-sans font-medium text-[#78b496] hover:text-white transition-colors cursor-pointer group"
            >
              <span>Explore Theory & Reference</span>
              <ArrowDown className="w-4 h-4 text-[#34d399] transition-transform duration-200 group-hover:translate-y-0.5" />
            </a>
          </div>

          {/* Developer Specs & HUD coordinates */}
          <div className="pt-6 border-t border-[#78b496]/15 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] font-mono text-[#78b496]/70">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                <span className="font-display">OSI L1-L7 ENGINE</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                <span className="font-display">8 FAULT SCENARIOS</span>
              </span>
            </div>

            <div className="text-[10px] font-mono text-[#78b496]/50">
              SHORTCUTS: <span className="text-[#c9dccf]">[TAB]</span> AUTOCOMPLETE &bull; <span className="text-[#c9dccf]">[CTRL+C]</span> HALT
            </div>
          </div>
        </div>

        {/* Right Column: Luminous Silk Ribbon + Interactive Live Cockpit HUD */}
        <div className="lg:col-span-5 relative w-full flex items-center justify-center min-h-[420px] sm:min-h-[480px]">
          {/* Flowing Emerald Silk Ribbon behind HUD */}
          <SilkRibbon className="absolute inset-0" />

          {/* Interactive Live Diagnostic Cockpit HUD (Dark Glass Surface) */}
          <div className="relative z-10 w-full max-w-md p-6 rounded-[2.25rem] bg-[#0a0f0d]/75 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl space-y-5">
            {/* Cyber HUD Corner Brackets */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#34d399]/60 pointer-events-none rounded-tl-sm" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#34d399]/60 pointer-events-none rounded-tr-sm" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#34d399]/60 pointer-events-none rounded-bl-sm" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#34d399]/60 pointer-events-none rounded-br-sm" />

            {/* Window Top Bar with Traffic Light Dots & Status */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90 border border-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90 border border-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90 border border-[#27c93f]" />
                <span className="text-[10px] font-display text-[#78b496] ml-2 tracking-wider">
                  TELEMETRY // LIVE HUD
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-display font-bold uppercase tracking-wider ${
                  linkBroken
                    ? 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/40'
                    : 'bg-[#1f7a4d]/20 text-[#34d399] border border-[#34d399]/30'
                }`}
              >
                {linkBroken ? 'LINK SEVERED' : 'CARRIER NOMINAL'}
              </span>
            </div>

            {/* Visual 3-Node Transmission Track (Glass Surface) */}
            <div className="h-28 bg-[#050807]/75 rounded-2xl border border-white/10 p-4 flex items-center justify-between relative overflow-hidden backdrop-blur-md">
              {/* Node PC1 */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-10 h-10 rounded-xl bg-[#101713] border border-[#34d399]/40 flex items-center justify-center text-[#34d399] shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                  <Terminal className="w-5 h-5" />
                </div>
                <span className="font-display text-[9px] text-[#e8f2ec]">PC1 (10)</span>
              </div>

              {/* Cable 1 */}
              <div className="flex-1 h-0.5 mx-2 bg-[#1a2e22] relative">
                <div className="absolute inset-0 bg-[#34d399]/40" />
                <motion.div
                  animate={{ left: ['0%', '100%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]"
                />
              </div>

              {/* Node R1 Router */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-10 h-10 rounded-xl bg-[#101713] border border-[#78b496]/30 flex items-center justify-center text-[#c9dccf]">
                  <Activity className="w-5 h-5 text-[#34d399]" />
                </div>
                <span className="font-display text-[9px] text-[#e8f2ec]">R1 (GW)</span>
              </div>

              {/* Cable 2 (Interactive Severable Link) */}
              <div className="flex-1 h-0.5 mx-2 bg-[#1a2e22] relative">
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
                  className={`w-10 h-10 rounded-xl bg-[#101713] border transition-colors duration-500 flex items-center justify-center ${
                    linkBroken
                      ? 'border-[#f87171]/60 text-[#f87171]'
                      : 'border-[#78b496]/30 text-[#c9dccf]'
                  }`}
                >
                  {linkBroken ? (
                    <WifiOff className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Terminal className="w-5 h-5" />
                  )}
                </div>
                <span className="font-display text-[9px] text-[#e8f2ec]">WEB (80)</span>
              </div>
            </div>

            {/* Interactive Fault Injection Trigger Toggle (Glass Surface) */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#050807]/75 border border-white/10 backdrop-blur-md">
              <div className="space-y-0.5">
                <span className="text-[10px] font-display uppercase tracking-wider text-[#78b496] block">
                  Simulate Cable State
                </span>
                <span className="text-xs font-mono font-semibold text-white">
                  {linkBroken ? 'Link Severed (L1 Fault)' : 'Carrier Established (1 Gbps)'}
                </span>
              </div>

              <MetalButton
                type="button"
                variant={linkBroken ? "success" : "error"}
                onClick={() => setLinkBroken(!linkBroken)}
                className="font-mono text-xs font-bold flex items-center gap-1.5 h-8 px-3"
              >
                {linkBroken ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reconnect</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Sever Cable</span>
                  </>
                )}
              </MetalButton>
            </div>

            {/* Live Packet Telemetry Stream */}
            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="flex justify-between text-[#78b496]/70 pb-0.5">
                <span>PACKET TELEMETRY (TX: {packetCount})</span>
                <span>RTT: {linkBroken ? 'TIMEOUT' : `${latency}ms`}</span>
              </div>
              <div className="space-y-1">
                {packetStream.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] border border-white/10 backdrop-blur-sm truncate"
                  >
                    <span className="text-[#34d399] font-bold">[{p.proto}]</span>
                    <span className="text-[#c9dccf] truncate flex-1 mx-2">{p.detail}</span>
                    <span
                      className={
                        p.status === 'ok' ? 'text-[#34d399] font-bold' : 'text-[#f87171] font-bold'
                      }
                    >
                      {p.status === 'ok' ? 'ACK' : 'DROP'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
