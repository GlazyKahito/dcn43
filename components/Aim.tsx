import React from 'react';
import { Target } from 'lucide-react';
import { LAB_CONFIG } from '../lib/config';

export function Aim() {
  return (
    <section id="aim" className="scroll-mt-28 max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Centered statement block with hairline dividers above and below (lab0.ai style) */}
      <div className="border-y border-hairline py-12 px-6 sm:px-12 flex flex-col items-center text-center space-y-5 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-tint border border-emerald-glow/30">
          <Target className="w-3.5 h-3.5 text-[#34d399]" />
          <span className="text-[11px] font-homevideo uppercase tracking-widest text-[#34d399]">
            EXPERIMENT AIM
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
