'use client';

import React, { useState, useEffect } from 'react';
import { WorksWheel } from '../WorksWheel/WorksWheel';
import { PORTFOLIO_PROJECTS } from '../WorksWheel/projectData';
import { LabBootSequence } from './LabBootSequence';
import { LabNavigation } from './LabNavigation';
import { NetworkDiagnosticsModule } from '../Diagnostics/NetworkDiagnosticsModule';
import { NetworkTopologySimulator } from '../Simulation/NetworkTopologySimulator';
import { Exp10Section } from '../Exp10/Exp10Section';
import { Aim } from '../Aim';
import { Theory } from '../Theory';
import { PreTestCallout } from '../PreTestCallout';
import { PostTestCallout } from '../PostTestCallout';
import { MiniGameSection } from '../MiniGameSection';
import { Conclusion } from '../Conclusion';
import { Hero } from '../Hero';
import { Compass, RotateCcw } from 'lucide-react';

export function NetworkLabApp() {
  const [viewState, setViewState] = useState<'boot' | 'wheel' | 'website'>('boot');
  const [activeModuleId, setActiveModuleId] = useState<string>('diagnostics');

  // Handle ESC key to return to wheel from website view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewState === 'website') {
        handleReturnToWheel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState]);

  const handleBootComplete = () => {
    setViewState('wheel');
  };

  const handleEnterModule = (moduleId: string) => {
    if (moduleId === 'works') {
      setViewState('wheel');
      return;
    }

    setActiveModuleId(moduleId);
    setViewState('website');

    // Smoothly scroll to the target section after layout mounts
    setTimeout(() => {
      const sectionMap: Record<string, string> = {
        diagnostics: 'diagnostics',
        aim: 'aim',
        theory: 'theory',
        simulations: 'simulations',
        assessments: 'assessments',
        minigame: 'minigame',
        conclusion: 'conclusion',
        'launch-lab': 'simulations',
        exp10: 'exp10',
      };

      const targetId = sectionMap[moduleId] || moduleId;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleReturnToWheel = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setViewState('wheel');
  };

  return (
    <div className="relative min-h-screen bg-transparent text-[#e8f2ec] selection:bg-slate-400/25 selection:text-white">
      {/* 1. Technical Boot Sequence on Initial Load */}
      {viewState === 'boot' && (
        <LabBootSequence onComplete={handleBootComplete} />
      )}

      {/* 2. Interactive Works Wheel System Launcher (Primary Landing Entry) */}
      {viewState === 'wheel' && (
        <div className="relative w-full h-screen overflow-hidden animate-in fade-in duration-300">
          <WorksWheel
            items={PORTFOLIO_PROJECTS}
            label="SOMAIYA VIRTUAL LABS"
            sublabel="NETWORK DIAGNOSTICS"
            action="Launch Module"
            selectedModuleId={activeModuleId}
            onEnterModule={handleEnterModule}
          />
        </div>
      )}

      {/* 3. Actual Website View after Selecting Module */}
      {viewState === 'website' && (
        <div className="relative w-full animate-in fade-in slide-in-from-bottom-3 duration-400">
          {/* Persistent Top Navigation Bar */}
          <LabNavigation
            activeModuleId={activeModuleId}
            onSelectModule={handleEnterModule}
            onReturnToWheel={handleReturnToWheel}
          />

          {/* Floating Return to Wheel Cue */}
          <div className="fixed bottom-6 right-6 z-40">
            <button
              type="button"
              onClick={handleReturnToWheel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0a0f0d]/90 hover:bg-[#121c16] text-white border border-emerald-400/40 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_16px_rgba(52,211,153,0.2)] backdrop-blur-xl text-xs font-mono transition-all hover:scale-105 cursor-pointer"
              title="Return to Works Wheel Launcher (Esc)"
            >
              <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
              <span>Return to Wheel</span>
              <span className="text-[10px] text-neutral-400 bg-white/10 px-1.5 py-0.5 rounded">ESC</span>
            </button>
          </div>

          {/* Main Website Content Modules */}
          <main className="relative z-20 space-y-16 pb-20 pt-4">
            {/* 1. Intelligent Network Diagnostics Console */}
            <NetworkDiagnosticsModule />

            {/* 2. Laboratory Objective & Statement (Aim) */}
            <Aim />

            {/* 3. Live Diagnostic Telemetry Cockpit */}
            <section id="cockpit" className="scroll-mt-24">
              <Hero />
            </section>

            {/* 4. Theoretical Methodology & Protocols (Modules 01-04) */}
            <Theory />

            {/* 5. Interactive Topology & Fault Simulation Suite */}
            <NetworkTopologySimulator />

            {/* 6. Pre-Test & Post-Test Assessments */}
            <section id="assessments" className="scroll-mt-24 space-y-4">
              <PreTestCallout />
              <PostTestCallout />
            </section>

            {/* 7. Mini-Game: Fix The Network (Packet X-Flow) */}
            <MiniGameSection />

            {/* 8. Experiment 10 Specification & Outcomes */}
            <Exp10Section />

            {/* 9. Synthesis & RFC Standards Conclusion */}
            <Conclusion />
          </main>
        </div>
      )}
    </div>
  );
}
