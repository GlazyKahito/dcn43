'use client';

import React, { useEffect, useState } from 'react';
import { Terminal, Shield, Cpu, Activity, ArrowRight } from 'lucide-react';

interface LabBootSequenceProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  'INITIALIZING SOMAIYA VIRTUAL NETWORK LAB...',
  'NETWORK CORE KERNEL: ONLINE',
  'OSI L1-L7 DIAGNOSTIC MATRIX: CALIBRATED',
  'TOPOLOGY & PACKET SIMULATION ENGINE: READY',
  'SYSTEM READY &bull; LAUNCHING WORKS WHEEL',
];

export function LabBootSequence({ onComplete }: LabBootSequenceProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < BOOT_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(onComplete, 400);
          return prev;
        }
      });
    }, 280);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl cursor-pointer select-none"
    >
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#080d0a]/90 border border-emerald-500/30 shadow-[0_0_60px_rgba(52,211,153,0.18)] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              KJSSE Virtual Lab &bull; System Boot
            </span>
          </div>

          <span className="text-[10px] font-mono text-neutral-400 hover:text-white transition-colors">
            Click to Skip &rarr;
          </span>
        </div>

        {/* Boot Sequence Lines */}
        <div className="font-mono text-xs space-y-2.5 text-neutral-300 min-h-[140px]">
          {BOOT_STEPS.slice(0, currentStep + 1).map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-150 ${
                i === currentStep ? 'text-emerald-300 font-bold' : 'text-neutral-400'
              }`}
            >
              <span className="text-emerald-500">&gt;</span>
              <span dangerouslySetInnerHTML={{ __html: step }} />
              {i === currentStep && i < BOOT_STEPS.length - 1 && (
                <span className="inline-block w-2 h-3.5 bg-emerald-400 animate-pulse ml-1" />
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-emerald-400 transition-all duration-200 shadow-[0_0_8px_#34d399]"
            style={{ width: `${((currentStep + 1) / BOOT_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
