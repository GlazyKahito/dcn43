'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  no: string;
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}

/** Page section with an instrument-style header: channel number, calibration rule, title and lede. */
export function Section({ id, no, kicker, title, lede, children, aside }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="relative scroll-mt-16 border-t border-hair px-4 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28">
      <div className="mx-auto max-w-[1320px]">
        <Reveal>
          <div className="mb-10 flex items-center gap-4 sm:mb-14">
            <span className="font-mono text-[11px] text-signal">{no}</span>
            <span className="label text-muted">{kicker}</span>
            <Calibration />
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end">
            <h2 id={`${id}-title`} className="font-display text-[clamp(34px,5vw,68px)] font-bold uppercase leading-[0.92] tracking-[-0.005em] text-paper">
              {title}
            </h2>
            {lede && <p className="max-w-xl text-[15px] leading-relaxed text-muted lg:justify-self-end">{lede}</p>}
          </div>
          {aside}
        </Reveal>
        <Reveal delay={0.18} className="mt-12 sm:mt-16">
          {children}
        </Reveal>
      </div>
    </section>
  );
}

function Calibration() {
  return (
    <svg className="h-3 flex-1 text-hair-strong" preserveAspectRatio="none" viewBox="0 0 400 12" aria-hidden>
      <line x1="0" y1="11.5" x2="400" y2="11.5" stroke="currentColor" />
      {Array.from({ length: 41 }, (_, i) => (
        <line key={i} x1={i * 10} x2={i * 10} y1={i % 5 === 0 ? 2 : 7} y2={12} stroke="currentColor" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Small titled instrument panel. */
export function Panel({ title, meta, children, className = '', bodyClass = 'p-4' }: { title: string; meta?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={`panel flex min-w-0 flex-col ${className}`}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-hair px-4 py-2.5">
        <h3 className="label text-muted">{title}</h3>
        {meta && <div className="flex items-center gap-2">{meta}</div>}
      </div>
      <div className={`min-h-0 flex-1 ${bodyClass}`}>{children}</div>
    </motion.div>
  );
}
