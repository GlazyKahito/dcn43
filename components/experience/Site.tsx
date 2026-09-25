'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';
import { MODULES, moduleById, type ModuleId, type SectionId } from '@/data/modules';
import { useProgress } from '@/lib/progress';
import { SiteNav } from '@/components/chrome/SiteNav';
import { TroubleshootingSection } from '@/components/sections/TroubleshootingSection';
import { AimSection } from '@/components/sections/AimSection';
import { TheorySection } from '@/components/sections/TheorySection';
import { SimulatorSection } from '@/components/sections/SimulatorSection';
import { DiagnosticsSection } from '@/components/sections/DiagnosticsSection';
import { AssessmentsSection } from '@/components/sections/AssessmentsSection';
import { MiniGameSection } from '@/components/sections/MiniGameSection';
import { ExperimentSection } from '@/components/sections/ExperimentSection';
import { ConclusionSection } from '@/components/sections/ConclusionSection';

const VIEWS: Record<SectionId, () => ReactNode> = {
  troubleshooting: () => <TroubleshootingSection />,
  aim: () => <AimSection />,
  theory: () => <TheorySection />,
  simulator: () => <SimulatorSection />,
  diagnostics: () => <DiagnosticsSection />,
  assessments: () => <AssessmentsSection />,
  minigame: () => <MiniGameSection />,
  experiment: () => <ExperimentSection />,
  conclusion: () => <ConclusionSection />,
};

/** Modules that count as complete once read to the end. */
const READ_TO_END: ModuleId[] = ['troubleshooting', 'aim', 'experiment', 'conclusion'];

interface SiteApi {
  /** Opens the module that owns a section (used by in-content links such as “Open the simulator”). */
  goTo: (id: SectionId) => void;
}
const SiteContext = createContext<SiteApi>({ goTo: () => undefined });
export const useSite = () => useContext(SiteContext);

export function Site({ initialModule, onIndex }: { initialModule: ModuleId; onIndex: () => void }) {
  const [current, setCurrent] = useState<ModuleId>(initialModule);
  const lenis = useRef<Lenis | null>(null);
  const { visit, markRead } = useProgress();
  const reduced = useReducedMotion();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const l = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.current = l;
    let raf = 0;
    const loop = (t: number) => {
      l.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      l.destroy();
      lenis.current = null;
    };
  }, []);

  // Entering a module: record the visit and start at the top.
  useEffect(() => {
    visit(current);
    if (lenis.current) lenis.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [current, visit]);

  // Reading modules complete when their last line has been on screen.
  useEffect(() => {
    if (!READ_TO_END.includes(current) || !sentinel.current) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && markRead(current));
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [current, markRead]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.querySelector('[data-drawer-open]')) return;
      onIndex();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onIndex]);

  const goTo = useCallback((section: SectionId) => {
    const m = MODULES.find((x) => x.section === section);
    if (m) setCurrent(m.id);
  }, []);

  const mod = moduleById(current);
  const idx = MODULES.indexOf(mod);
  const prev = MODULES[idx - 1];
  const next = MODULES[idx + 1];

  return (
    <SiteContext.Provider value={{ goTo }}>
      <SiteNav current={current} onOpen={setCurrent} onIndex={onIndex} />
      <main className="relative pt-[88px]">
        <motion.div
          key={current}
          initial={reduced ? false : { opacity: 0, y: 14, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
        >
          {VIEWS[mod.section]()}
          <div ref={sentinel} aria-hidden className="h-px" />
        </motion.div>
      </main>

      <footer className="relative border-t border-hair px-4 py-8 sm:px-8">
        <div className="mx-auto grid max-w-[1320px] items-center gap-4 sm:grid-cols-3">
          <div>
            {prev && (
              <button type="button" className="group text-left" onClick={() => setCurrent(prev.id)}>
                <span className="label block">← Previous</span>
                <span className="mt-1 block font-display text-lg uppercase tracking-wide text-muted transition-colors group-hover:text-paper">
                  {prev.no} {prev.title}
                </span>
              </button>
            )}
          </div>
          <div className="sm:text-center">
            <button type="button" className="btn-ghost" onClick={onIndex}>
              Patch panel <span className="chip">Esc</span>
            </button>
          </div>
          <div className="sm:text-right">
            {next && (
              <button type="button" className="group sm:text-right" onClick={() => setCurrent(next.id)}>
                <span className="label block">Next on the path →</span>
                <span className="mt-1 block font-display text-lg uppercase tracking-wide text-muted transition-colors group-hover:text-paper">
                  {next.no} {next.title}
                </span>
              </button>
            )}
          </div>
        </div>
        <p className="label mx-auto mt-8 max-w-[1320px]">Somaiya Virtual Labs · K J Somaiya School of Engineering · Experiment 10</p>
      </footer>
    </SiteContext.Provider>
  );
}
