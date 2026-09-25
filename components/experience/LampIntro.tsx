'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const SYSTEMS = ['Network core', 'Packet engine', 'Diagnostic engine', 'Simulation engine'];
const INK = '#0a0b0c';
const BEAM = '#6fbf99';

/** Timeline, in ms. The intro hands off to the landing on its own at HANDOFF. */
const T = { title: 450, systems: 1050, step: 170, ready: 1850, flare: 2500, handoff: 2900 };

/**
 * Opening sequence: a lamp (after Aceternity's Lamp on 21st.dev) ignites over the title,
 * the laboratory systems report in, then the light flares and the screen dissolves into the landing.
 */
export function LampIntro({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const end = reduced ? 700 : T.handoff;
    let raf = 0;
    const tick = () => {
      const now = performance.now() - start;
      setT(now);
      if (now >= end) onDone();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const skip = () => onDone();
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', skip);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [onDone, reduced]);

  const lit = reduced || t > 0;
  const flare = !reduced && t >= T.flare;
  const beamW = flare ? '46rem' : lit ? '30rem' : '14rem';
  const ease = [0.65, 0, 0.35, 1] as const;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Laboratory starting"
      className="fixed inset-0 z-[300] flex flex-col items-center overflow-hidden"
      style={{ background: INK }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: 'blur(4px)', transition: { duration: 1.2, ease: [0.45, 0, 0.15, 1] } }}
    >
      {/* lamp */}
      <div className="relative isolate flex h-[46vh] min-h-[300px] w-full scale-y-125 items-end justify-center">
        <motion.div
          initial={{ opacity: 0.25, width: '14rem' }}
          animate={{ opacity: flare ? 1 : 0.85, width: beamW }}
          transition={{ duration: flare ? 0.45 : 1.1, ease }}
          style={{ backgroundImage: `conic-gradient(from 70deg at center top, ${BEAM}, transparent, transparent)` }}
          className="absolute right-1/2 top-[38%] h-56 max-w-[50vw] overflow-visible"
        >
          <div className="absolute bottom-0 left-0 z-20 h-40 w-full" style={{ background: INK, maskImage: 'linear-gradient(to top, white, transparent)', WebkitMaskImage: 'linear-gradient(to top, white, transparent)' }} />
          <div className="absolute bottom-0 left-0 z-20 h-full w-40" style={{ background: INK, maskImage: 'linear-gradient(to right, white, transparent)', WebkitMaskImage: 'linear-gradient(to right, white, transparent)' }} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.25, width: '14rem' }}
          animate={{ opacity: flare ? 1 : 0.85, width: beamW }}
          transition={{ duration: flare ? 0.45 : 1.1, ease }}
          style={{ backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, ${BEAM})` }}
          className="absolute left-1/2 top-[38%] h-56 max-w-[50vw]"
        >
          <div className="absolute bottom-0 right-0 z-20 h-full w-40" style={{ background: INK, maskImage: 'linear-gradient(to left, white, transparent)', WebkitMaskImage: 'linear-gradient(to left, white, transparent)' }} />
          <div className="absolute bottom-0 right-0 z-20 h-40 w-full" style={{ background: INK, maskImage: 'linear-gradient(to top, white, transparent)', WebkitMaskImage: 'linear-gradient(to top, white, transparent)' }} />
        </motion.div>

        {/* floor haze and bloom */}
        <div className="absolute top-[62%] h-48 w-full scale-x-150 blur-2xl" style={{ background: INK }} />
        <div className="absolute top-[62%] z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md" />
        <motion.div
          className="absolute top-[38%] z-50 h-36 w-[28rem] max-w-[80vw] -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: BEAM }}
          initial={{ opacity: 0.15 }}
          animate={{ opacity: flare ? 0.75 : 0.45 }}
          transition={{ duration: 0.9 }}
        />
        <motion.div
          className="absolute top-[38%] z-30 h-36 -translate-y-[40%] rounded-full blur-2xl"
          style={{ background: '#a9dcc4' }}
          initial={{ width: '8rem', opacity: 0.4 }}
          animate={{ width: flare ? '28rem' : '16rem', opacity: flare ? 0.9 : 0.6 }}
          transition={{ duration: flare ? 0.45 : 1.1, ease }}
        />
        {/* emitter */}
        <motion.div
          className="absolute top-[38%] z-50 h-0.5 max-w-[90vw]"
          style={{ background: 'linear-gradient(90deg, transparent, #e8e4da, transparent)', boxShadow: `0 0 18px ${BEAM}` }}
          initial={{ width: '14rem' }}
          animate={{ width: beamW }}
          transition={{ duration: flare ? 0.45 : 1.1, ease }}
        />
        <div className="absolute top-0 z-40 h-[38%] w-full" style={{ background: INK }} />
      </div>

      {/* title and system report */}
      <div className="relative z-50 -mt-[14vh] flex w-full max-w-3xl flex-col items-center px-6 text-center">
        <motion.p
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: t >= T.title - 150 || reduced ? 1 : 0, y: t >= T.title - 150 || reduced ? 0 : 10 }}
          transition={{ duration: 0.5 }}
        >
          Somaiya Virtual Labs · Experiment 8
        </motion.p>
        <motion.h1
          className="mt-4 bg-gradient-to-br from-[#f1ede4] to-[#8d918f] bg-clip-text py-2 font-display text-[clamp(38px,6.4vw,92px)] font-semibold uppercase leading-[0.9] tracking-[-0.01em] text-transparent"
          initial={{ opacity: 0.2, y: 80 }}
          animate={{ opacity: t >= T.title || reduced ? 1 : 0.2, y: t >= T.title || reduced ? 0 : 80 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          Network Troubleshooting
          <br />
          <span className="font-light">&amp; Simulator</span>
        </motion.h1>

        <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.18em] text-dim" style={{ opacity: t >= T.systems - 200 || reduced ? 1 : 0, transition: 'opacity .3s' }}>
          Initializing laboratory environment
        </p>
        <ul className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.14em]">
          {SYSTEMS.map((s, i) => {
            const on = reduced || t >= T.systems + i * T.step;
            return (
              <li key={s} className="flex items-center gap-2 transition-opacity duration-200" style={{ opacity: on ? 1 : 0 }}>
                <span className="h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_6px_rgba(95,174,138,0.8)]" />
                <span className="text-silver">{s}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-paper transition-opacity duration-300" style={{ opacity: reduced || t >= T.ready ? 1 : 0 }}>
          System ready
        </p>
      </div>

      <p className="absolute bottom-6 font-mono text-[10px] uppercase tracking-[0.18em] text-dim">Click or press any key to skip</p>
    </motion.div>
  );
}
