'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export const WALKTHROUGH_KEY = 'svl-exp8-walkthrough';

interface Step {
  target: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    target: 'network',
    title: 'The lab network is live',
    body: 'Five devices, running on this page. PC1 reaches the server through SW1, R1 and the FW1 firewall. Click any cable to cut it; click again to restore it.',
  },
  {
    target: 'readings',
    title: 'Probes run continuously',
    body: 'PC1 sends ICMP, DNS and HTTP probes every two seconds. When something breaks, these readings fail and say where and why.',
  },
  {
    target: 'actions',
    title: 'Two ways in',
    body: 'Launch lab opens the simulation: inject faults, run ping, tracert and nslookup. Work a scenario opens a trouble ticket to solve from symptom to verified repair.',
  },
  {
    target: 'progress',
    title: 'Five modules, one path',
    body: 'Theory → Simulation → Mini-game → Test → Conclusion is the recommended order, but any module opens at any time. Lamps fill as you actually complete work.',
  },
  {
    target: 'continue',
    title: 'Pick up where you left off',
    body: 'Continue always points to the next module on the path. Progress is kept in this browser.',
  },
];

/** Small “Let’s start” card shown after the intro. */
export function StartPrompt({ onStart, onClose }: { onStart: () => void; onClose: () => void }) {
  return (
    <motion.div
      role="dialog"
      aria-labelledby="start-title"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, transition: { duration: 0.25, delay: 0 } }}
      transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1], delay: 0.2 }}
      className="panel fixed bottom-5 right-5 z-[250] w-[min(340px,calc(100vw-40px))] bg-graphite/95 p-5"
    >
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid h-7 w-7 place-items-center font-mono text-[14px] text-dim transition-colors hover:text-paper">
        ×
      </button>
      <p className="label text-signal">Let’s start</p>
      <p id="start-title" className="mt-2 font-display text-xl font-medium uppercase tracking-wide text-paper">
        First time in the lab?
      </p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">A one-minute walkthrough of the live network, the two ways in, and how progress works.</p>
      <div className="mt-4 flex gap-2">
        <button type="button" className="btn-primary flex-1" onClick={onStart} autoFocus>
          Start walkthrough
        </button>
        <button type="button" className="btn" onClick={onClose}>
          Not now
        </button>
      </div>
    </motion.div>
  );
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Spotlight tour over elements marked with data-tour. */
export function Walkthrough({ onFinish, onBegin }: { onFinish: () => void; onBegin: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const measure = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    const pad = 8;
    setRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
  }, [step.target]);

  useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    measure();
    const t = window.setTimeout(measure, 350);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure, step.target]);

  // Capture keys so the landing's own arrow-key navigation does not fire underneath the tour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowRight', 'ArrowLeft', 'Escape', 'Enter'].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') onFinish();
      else if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1));
      else if (last) onBegin();
      else setI((n) => n + 1);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [last, onFinish, onBegin]);

  // Place the note below the spotlight if there is room, otherwise above it.
  const cardW = Math.min(360, vp.w - 32);
  const below = rect ? rect.top + rect.height + 200 < vp.h : true;
  const cardTop = rect ? (below ? rect.top + rect.height + 14 : Math.max(16, rect.top - 14 - 190)) : vp.h / 2 - 100;
  const cardLeft = rect ? Math.min(Math.max(16, rect.left + rect.width / 2 - cardW / 2), vp.w - cardW - 16) : vp.w / 2 - cardW / 2;

  return createPortal(
    <div className="fixed inset-0 z-[260]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* click-catcher; the spotlight's shadow does the dimming */}
      <div className="absolute inset-0" onClick={onFinish} />
      {rect && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute rounded-[4px] border border-signal/60"
          animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ boxShadow: '0 0 0 9999px rgba(4,5,6,0.72), 0 0 24px rgba(95,174,138,0.18)' }}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="panel absolute bg-graphite/95 p-5"
          style={{ top: cardTop, left: cardLeft, width: cardW }}
        >
          <div className="flex items-center justify-between">
            <p className="label text-signal">
              Walkthrough · {i + 1} / {STEPS.length}
            </p>
            <button type="button" className="btn-ghost text-dim" onClick={onFinish}>
              Skip
            </button>
          </div>
          <p id="tour-title" className="mt-2 font-display text-lg font-medium uppercase tracking-wide text-paper">
            {step.title}
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{step.body}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex gap-1" aria-hidden>
              {STEPS.map((_, k) => (
                <span key={k} className={`h-1 w-5 ${k <= i ? 'bg-signal' : 'bg-steel'}`} />
              ))}
            </div>
            <div className="flex gap-2">
              {i > 0 && (
                <button type="button" className="btn py-1.5" onClick={() => setI(i - 1)}>
                  Back
                </button>
              )}
              <button type="button" className="btn-primary py-1.5" onClick={() => (last ? onBegin() : setI(i + 1))} autoFocus>
                {last ? 'Start with Theory →' : 'Next →'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}
