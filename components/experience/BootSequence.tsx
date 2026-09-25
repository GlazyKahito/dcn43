'use client';

import { useEffect, useState } from 'react';

const SYSTEMS = ['Network core', 'Packet engine', 'Diagnostic engine', 'Simulation engine'];
const STEP_MS = 150;
const HOLD_MS = 320;

/** ~1.2 s technical boot. Any click or key skips it. */
export function BootSequence({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const total = SYSTEMS.length + 3;

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      const t = window.setTimeout(onDone, 400);
      setStep(total);
      return () => window.clearTimeout(t);
    }
    const timers = Array.from({ length: total }, (_, i) => window.setTimeout(() => setStep(i + 1), 80 + i * STEP_MS));
    timers.push(window.setTimeout(onDone, 80 + total * STEP_MS + HOLD_MS));
    const skip = () => onDone();
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', skip);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [onDone, total]);

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/95 px-6">
      <div className="scanlines pointer-events-none absolute inset-0" />
      <div className="w-full max-w-md font-mono text-[12px] uppercase tracking-[0.16em]">
        <p className={`text-muted transition-opacity duration-200 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>Somaiya Virtual Labs</p>
        <p className={`text-dim transition-opacity duration-200 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>Experiment 10</p>
        <p className={`mt-5 font-display text-2xl font-semibold normal-case tracking-normal text-paper transition-all duration-300 sm:text-3xl ${step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}>
          Network Troubleshooting &amp; Simulator
        </p>
        <p className={`mt-6 text-dim transition-opacity duration-200 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>Initializing laboratory environment</p>
        <ul className="mt-3 space-y-1.5">
          {SYSTEMS.map((name, i) => (
            <li key={name} className={`flex items-center gap-2 transition-opacity duration-150 ${step >= i + 3 ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-silver">{name}</span>
              <span className="h-px flex-1 border-t border-dotted border-dim" />
              <span className="text-signal">Online</span>
            </li>
          ))}
        </ul>
        <p className={`mt-5 text-paper transition-opacity duration-200 ${step >= total ? 'opacity-100' : 'opacity-0'}`}>
          System ready<span className="ml-1 inline-block h-3 w-2 translate-y-0.5 animate-blink bg-paper" />
        </p>
        <p className="mt-8 text-[10px] text-dim">Click or press any key to skip</p>
      </div>
    </div>
  );
}
