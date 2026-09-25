import React from 'react';
import { Target } from 'lucide-react';
import { LAB_CONFIG } from '../lib/config';

export function Aim() {
  return (
    <section id="aim" className="scroll-mt-28 max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Centered statement glass card (Glass UI) */}
      <div className="bg-[#0a0f0d]/65 backdrop-blur-2xl border border-white/10 rounded-3xl py-12 px-6 sm:px-12 flex flex-col items-center text-center space-y-5 relative shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30">
          <Target className="w-3.5 h-3.5 text-[#34d399]" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#34d399]">
            Laboratory Objective
          </span>
        </div>

        <p className="text-xl sm:text-2xl md:text-3xl text-white font-medium max-w-3xl leading-snug tracking-tight">
          &ldquo;{LAB_CONFIG.aim}&rdquo;
        </p>

        <span className="text-xs font-mono text-neutral-400 tracking-wider">
          {LAB_CONFIG.department} &bull; {LAB_CONFIG.institution}
        </span>
      </div>
    </section>
  );
}
