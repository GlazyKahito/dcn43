'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronRight, RotateCcw, Play, Compass } from 'lucide-react';
import { LAB_MODULES, LabModule } from '../../data/labModules';
import { LAB_CONFIG } from '../../lib/config';

interface LabNavigationProps {
  activeModuleId: string;
  onSelectModule: (moduleId: string) => void;
  onReturnToWheel: () => void;
}

export function LabNavigation({
  activeModuleId,
  onSelectModule,
  onReturnToWheel,
}: LabNavigationProps) {
  return (
    <div className="sticky top-0 z-50 w-full px-4 sm:px-6 pt-3 pointer-events-none">
      <header className="pointer-events-auto max-w-7xl mx-auto rounded-2xl bg-[#080d0b]/80 backdrop-blur-3xl border border-white/12 shadow-[0_12px_40px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-all">
        <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm overflow-hidden shrink-0 border border-white/20">
              <Image
                src="/somaiya-logo.png"
                alt="Somaiya Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <button
              type="button"
              onClick={onReturnToWheel}
              className="text-left font-sans flex flex-col cursor-pointer group"
              title="Return to Works Wheel"
            >
              <div className="text-xs sm:text-sm font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                SOMAIYA VIRTUAL LABS
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                <span className="text-emerald-400 font-semibold">NETWORK DIAGNOSTICS</span>
                <span>&bull;</span>
                <span>Exp 10</span>
              </div>
            </button>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 text-xs font-mono">
            {/* Special WORKS Button that returns to Wheel */}
            <button
              type="button"
              onClick={onReturnToWheel}
              className="px-3 py-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>WORKS</span>
            </button>

            {LAB_MODULES.filter(
              (m) => m.id !== 'works' && m.id !== 'launch-lab' && m.id !== 'exp10'
            ).map((mod) => {
              const isActive = activeModuleId === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => onSelectModule(mod.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-white bg-white/[0.1] font-semibold border border-white/10 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {mod.navLabel}
                </button>
              );
            })}

            {/* Exp 10 Link */}
            <button
              type="button"
              onClick={() => onSelectModule('exp10')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeModuleId === 'exp10'
                  ? 'text-white bg-white/[0.1] font-semibold border border-white/10'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              EXP 10
            </button>
          </nav>

          {/* Right Action: LAUNCH LAB & Back to Wheel */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReturnToWheel}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-neutral-400 hover:text-white bg-black/40 hover:bg-black/60 border border-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-emerald-400" />
              <span>Wheel</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectModule('simulations')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sans transition-all shadow-[0_0_16px_rgba(52,211,153,0.3)] hover:shadow-[0_0_24px_rgba(52,211,153,0.5)] cursor-pointer"
            >
              <span>LAUNCH LAB</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
