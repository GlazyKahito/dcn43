'use client';

import React, { useState } from 'react';
import { Simulation1Terminal } from './sims/Simulation1Terminal';
import { Simulation2FaultLab } from './sims/Simulation2FaultLab';
import { Simulation3OsiWalkthrough } from './sims/Simulation3OsiWalkthrough';
import { PacketXFlowGame } from './sims/PacketXFlowGame';
import { Terminal, ShieldAlert, Layers, Gamepad2 } from 'lucide-react';
import { RollText } from './site/RollText';

export function InteractiveLab() {
  const [activeTab, setActiveTab] = useState<'sim1' | 'sim2' | 'sim3' | 'sim4'>('sim2');

  const tabs = [
    {
      id: 'sim1' as const,
      number: '01',
      title: 'Virtual Terminal',
      subtitle: 'Free Exploration & Path Tracing',
      icon: Terminal,
    },
    {
      id: 'sim2' as const,
      number: '02',
      title: 'Fault Injection Lab',
      subtitle: '8 Pre-Built Faults & Root Cause Triage',
      icon: ShieldAlert,
    },
    {
      id: 'sim3' as const,
      number: '03',
      title: 'OSI Walkthrough',
      subtitle: 'Layer-by-Layer Bottom-Up Step Test',
      icon: Layers,
    },
    {
      id: 'sim4' as const,
      number: '04',
      title: 'Packet X-Flow',
      subtitle: 'Vintage Arcade Net Defender Game',
      icon: Gamepad2,
    },
  ];

  return (
    <section id="simulation" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1f7a4d]/15 border border-[#34d399]/30 text-[#34d399] font-display text-xs uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
          SIMULATION ENVIRONMENT // 4 MODES
        </div>
        <h2 className="text-3xl sm:text-5xl font-sans font-semibold tracking-tight text-[#e8f2ec]">
          Network Troubleshooting Suite
        </h2>
        <p className="text-sm sm:text-base text-[#78b496]/80 leading-relaxed font-sans">
          Toggle between free terminal diagnostic exploration, structured fault triage scenarios, the layer-by-layer OSI bottom-up test engine, and the Packet X-Flow vintage arcade mini-game.
        </p>
      </div>

      {/* Product Window Shell */}
      <div className="rounded-[2.25rem] border border-[#78b496]/20 bg-[#0a0f0d] p-3 sm:p-5 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1f7a4d]/10 rounded-full blur-3xl pointer-events-none -mt-20" />

        {/* Window Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-2 border-b border-[#78b496]/15">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]/80 inline-block border border-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]/80 inline-block border border-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]/80 inline-block border border-[#27c93f]" />
            </div>
            <span className="text-[11px] font-display tracking-widest text-[#78b496]/70 uppercase pl-2 border-l border-[#78b496]/20">
              EXP_10 // LAB_RUNNER
            </span>
          </div>

          <div className="text-[11px] font-mono text-[#78b496]/60">
            ENGINE_STATE: <span className="text-[#34d399] font-bold">CLIENT_IN_MEMORY</span>
          </div>
        </div>

        {/* Tab Switcher Pills (Responsive 2x2 or 4-column) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-300 flex items-center gap-3.5 cursor-pointer relative overflow-hidden group ${
                  isActive
                    ? 'bg-[#101713] border-[#34d399]/60 text-white shadow-[0_0_25px_rgba(52,211,153,0.15)] scale-[1.01]'
                    : 'bg-[#0e1411]/60 border-[#78b496]/15 text-[#78b496]/70 hover:border-[#78b496]/35 hover:text-[#e8f2ec]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                    isActive
                      ? 'bg-[#1f7a4d] text-white border-[#34d399]/40 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                      : 'bg-[#101713] border-[#78b496]/20 text-[#78b496]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-[10px] uppercase font-bold text-[#34d399]">
                      MODE {tab.number}
                    </span>
                  </div>
                  <div className="text-sm font-sans font-semibold tracking-tight text-[#e8f2ec] truncate">
                    <RollText text={tab.title} />
                  </div>
                  <div className="text-[11px] font-sans text-[#78b496]/70 truncate">
                    {tab.subtitle}
                  </div>
                </div>

                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#34d399] to-transparent" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Simulation View with stable minimum container height */}
        <div className="w-full pt-2 min-h-[520px]">
          {activeTab === 'sim1' && <Simulation1Terminal />}
          {activeTab === 'sim2' && <Simulation2FaultLab />}
          {activeTab === 'sim3' && <Simulation3OsiWalkthrough />}
          {activeTab === 'sim4' && <PacketXFlowGame />}
        </div>
      </div>
    </section>
  );
}
