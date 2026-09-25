'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MODULES, type LabModule, type SectionId } from '@/data/modules';
import { detectFaults } from '@/lib/sim/faults';
import { NetworkField } from '@/components/atmosphere/NetworkField';
import { LabProvider, useLab } from '@/lib/sim/store';
import { LandingHero } from '@/components/landing/LandingHero';
import { LampIntro } from './LampIntro';
import { Site } from './Site';

type Phase = 'boot' | 'landing' | 'site';

interface Surface {
  module: LabModule;
  rect: { top: number; left: number; width: number; height: number };
}

export function Experience() {
  return (
    <LabProvider>
      <Shell />
    </LabProvider>
  );
}

function Shell() {
  const { state } = useLab();
  const [phase, setPhase] = useState<Phase>('boot');
  const [surface, setSurface] = useState<Surface | null>(null);
  const [section, setSection] = useState<SectionId>('troubleshooting');
  const [landingIndex, setLandingIndex] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.phase = surface ? 'transition' : phase;
  }, [phase, surface]);

  const bootDone = useCallback(() => setPhase((p) => (p === 'boot' ? 'landing' : p)), []);

  const launch = useCallback((module: LabModule, r: DOMRect) => {
    setLandingIndex(MODULES.indexOf(module));
    setSection(module.section);
    setSurface({ module, rect: { top: r.top, left: r.left, width: r.width, height: r.height } });
  }, []);

  const toLanding = useCallback((from?: SectionId) => {
    if (from) {
      const idx = MODULES.findIndex((m) => m.section === from);
      if (idx >= 0) setLandingIndex(idx);
    }
    window.scrollTo(0, 0);
    setPhase('landing');
  }, []);

  const faultCount = useMemo(() => detectFaults(state.net).length, [state.net]);

  return (
    <>
      <NetworkField faults={faultCount} pulse={state.flight?.id ?? 0} dim={phase === 'site'} />
      <AnimatePresence>{phase === 'boot' && <LampIntro key="intro" onDone={bootDone} />}</AnimatePresence>
      {(phase === 'boot' || phase === 'landing') && <LandingHero initialIndex={landingIndex} onLaunch={launch} />}
      {phase === 'site' && <Site initialSection={section} onWorks={toLanding} />}

      <AnimatePresence>
        {surface && (
          <motion.div
            key="surface"
            aria-hidden
            className="fixed z-[400] overflow-hidden border border-silver/40 bg-gunmetal"
            initial={{ ...surface.rect, borderRadius: 4, opacity: 1 }}
            animate={{ top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
            transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
            onAnimationComplete={(def) => {
              if (typeof def === 'object' && def && 'top' in def) {
                setPhase('site');
                window.setTimeout(() => setSurface(null), 60);
              }
            }}
          >
            <div className="grid-paper absolute inset-0 opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }} className="text-center">
                <p className="label">Entering module {surface.module.no}</p>
                <p className="mt-2 font-display text-3xl font-medium uppercase tracking-wide text-paper sm:text-5xl">{surface.module.title}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
