import React from 'react';
import { Target } from 'lucide-react';
import { LAB_CONFIG } from '../lib/config';

export function Aim() {
  return (
    <section id="aim" className="scroll-mt-24 max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-2">
      <div className="border border-neutral-800 bg-[#161617] rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2997ff]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2997ff]/10 border border-[#2997ff]/20 flex items-center justify-center text-[#2997ff]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#2997ff] font-semibold">
              Experiment Objective
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Aim
            </h2>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border-l-4 border-[#2997ff] bg-black/40 text-base sm:text-lg text-white font-medium leading-relaxed tracking-tight">
          {LAB_CONFIG.aim}
        </div>
      </div>
    </section>
  );
}
