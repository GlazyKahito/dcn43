'use client';

import React, { useState } from 'react';
import { Simulation1Terminal } from './sims/Simulation1Terminal';
import { Simulation2FaultLab } from './sims/Simulation2FaultLab';
import { Simulation3OsiWalkthrough } from './sims/Simulation3OsiWalkthrough';
import { Terminal, ShieldAlert, Layers } from 'lucide-react';

export function InteractiveLab() {
  const [activeTab, setActiveTab] = useState<'sim1' | 'sim2' | 'sim3'>('sim2');

  const tabs = [
    {
      id: 'sim1' as const,
      number: '01',
      title: 'Virtual Terminal',
      subtitle: 'Free Exploration & Path Tracing',
      icon: Terminal,
      accent: '#2997ff',
    },
    {
      id: 'sim2' as const,
      number: '02',
      title: 'Fault Injection Lab',
      subtitle: '8 Pre-Built Faults & Root Cause Triage',
      icon: ShieldAlert,
      accent: '#ff9f0a',
    },
    {
      id: 'sim3' as const,
      number: '03',
      title: 'OSI Walkthrough',
      subtitle: 'Layer-by-Layer Bottom-Up Step Test',
      icon: Layers,
      accent: '#bf5af2',
    },
  ];

  return (
    <section id="simulation" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Section Header */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <span className="font-mono text-xs uppercase tracking-wider text-[#2997ff] font-semibold block">
          Interactive Lab
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Network Troubleshooting Simulator Suite
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
          Switch between free terminal diagnostic exploration, structured fault triage scenarios, and the layer-by-layer OSI bottom-up test engine.
        </p>
      </div>

      {/* Tab Switcher Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 flex items-center gap-3.5 cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-neutral-900 border-white text-white shadow-xl scale-[1.02]'
                  : 'bg-[#161617] border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isActive
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase font-bold text-neutral-500">
                    SIM {tab.number}
                  </span>
                </div>
                <div className="text-sm font-bold tracking-tight text-white truncate">
                  {tab.title}
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {tab.subtitle}
                </div>
              </div>

              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ backgroundColor: tab.accent }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Simulation View */}
      <div className="w-full">
        {activeTab === 'sim1' && <Simulation1Terminal />}
        {activeTab === 'sim2' && <Simulation2FaultLab />}
        {activeTab === 'sim3' && <Simulation3OsiWalkthrough />}
      </div>
    </section>
  );
}
