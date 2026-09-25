'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type LabModule, type ModuleId } from '@/data/modules';
import { detectFaults } from '@/lib/sim/faults';
import { NetworkField } from '@/components/atmosphere/NetworkField';
import { LabProvider, useLab } from '@/lib/sim/store';
import { ProgressProvider } from '@/lib/progress';
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
      <ProgressProvider>
        <Shell />
      </ProgressProvider>
    </LabProvider>
  );
}

function Shell() {
  const { state } = useLab();
  const [phase, setPhase] = useState<Phase>('boot');
  const [surface, setSurface] = useState<Surface | null>(null);
  const [moduleId, setModuleId] = useState<ModuleId>('troubleshooting');

  useEffect(() => {
    document.documentElement.dataset.phase = surface ? 'transition' : phase;
  }, [phase, surface]);

  const bootDone = useCallback(() => setPhase((p) => (p === 'boot' ? 'landing' : p)), []);

  const launch = useCallback((module: LabModule, r: DOMRect) => {
    setModuleId(module.id);
    setSurface({ module, rect: { top: r.top, left: r.left, width: r.width, height: r.height } });
  }, []);

  const toPanel = useCallback(() => {
    window.scrollTo(0, 0);
    setPhase('landing');
  }, []);

  const faultCount = useMemo(() => detectFaults(state.net).length, [state.net]);

  return (
    <>
      <NetworkField faults={faultCount} pulse={state.flight?.id ?? 0} dim={phase === 'site'} />
      <AnimatePresence>{phase === 'boot' && <LampIntro key="intro" onDone={bootDone} />}</AnimatePresence>
      {(phase === 'boot' || phase === 'landing') && <LandingHero revealed={phase === 'landing'} onLaunch={launch} />}
      {phase === 'site' && <Site initialModule={moduleId} onIndex={toPanel} />}

      {/* Card-to-page transition: the selected card becomes the surface and its number takes the screen. */}
      <AnimatePresence>
        {surface && (
          <motion.div
            key="surface"
            aria-hidden
            className="fixed z-[400] overflow-hidden border border-silver/40 bg-gunmetal"
            initial={{ ...surface.rect, borderRadius: 3, opacity: 1 }}
            animate={{ top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeOut' } }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
            onAnimationComplete={(def) => {
              if (typeof def === 'object' && def && 'top' in def) {
                setPhase('site');
                window.setTimeout(() => setSurface(null), 80);
              }
            }}
          >
            <div className="grid-paper absolute inset-0 opacity-60" />
            <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-signal" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <motion.p
                  className="font-display font-light leading-none text-paper"
                  initial={{ fontSize: '38px', opacity: 0.9 }}
                  animate={{ fontSize: 'clamp(120px, 22vw, 300px)', opacity: 1 }}
                  transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
                >
                  {surface.module.no}
                </motion.p>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }} className="mt-2 font-display text-2xl font-medium uppercase tracking-wide text-paper sm:text-4xl">
                  {surface.module.title}
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35, duration: 0.3 }} className="label mt-3">
                  {surface.module.no} / 10 · {surface.module.role}
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
