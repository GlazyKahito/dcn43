'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import type { SectionId } from '@/data/modules';
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

const ORDER: SectionId[] = ['troubleshooting', 'aim', 'theory', 'simulator', 'diagnostics', 'assessments', 'minigame', 'experiment', 'conclusion'];
const NAV_OFFSET = -72;

interface SiteApi {
  goTo: (id: SectionId) => void;
}
const SiteContext = createContext<SiteApi>({ goTo: () => undefined });
export const useSite = () => useContext(SiteContext);

export function Site({ initialSection, onWorks }: { initialSection: SectionId; onWorks: (from?: SectionId) => void }) {
  const lenis = useRef<Lenis | null>(null);
  const [active, setActive] = useState<SectionId>(initialSection);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.getElementById(initialSection);
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + NAV_OFFSET);
    if (reduced) return;
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
  }, [initialSection]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id as SectionId);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    ORDER.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.querySelector('[data-drawer-open]')) return;
      onWorks(activeRef.current);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onWorks]);

  const goTo = useCallback((id: SectionId) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis.current) lenis.current.scrollTo(el, { offset: NAV_OFFSET, duration: 1.2 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + NAV_OFFSET });
  }, []);

  return (
    <SiteContext.Provider value={{ goTo }}>
      <SiteNav active={active} onNavigate={goTo} onWorks={() => onWorks(activeRef.current)} />
      <main className="relative">
        <TroubleshootingSection />
        <AimSection />
        <TheorySection />
        <SimulatorSection />
        <DiagnosticsSection />
        <AssessmentsSection />
        <MiniGameSection />
        <ExperimentSection />
        <ConclusionSection />
      </main>
      <footer className="border-t border-hair px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="label">Somaiya Virtual Labs · K J Somaiya School of Engineering · Experiment 10</p>
          <button type="button" className="btn-ghost" onClick={() => onWorks(activeRef.current)}>
            ← Return to Works Wheel <span className="chip">Esc</span>
          </button>
        </div>
      </footer>
    </SiteContext.Provider>
  );
}
