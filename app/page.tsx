import React from 'react';
import { WorksWheelHero } from '../components/WorksWheel';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Aim } from '../components/Aim';
import { Theory } from '../components/Theory';
import { PreTestCallout } from '../components/PreTestCallout';
import { InteractiveLab } from '../components/InteractiveLab';
import { MiniGameSection } from '../components/MiniGameSection';
import { PostTestCallout } from '../components/PostTestCallout';
import { Conclusion } from '../components/Conclusion';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-transparent text-[#e8f2ec] selection:bg-emerald-500/25 selection:text-emerald-200">
      {/* 1. Works Wheel Landing Hero (100vh First-Viewport Interactive Drum) */}
      <section id="works" className="relative w-full min-h-screen">
        <WorksWheelHero />
      </section>

      {/* 2. Sticky Glass Header Navbar */}
      <Header />

      {/* Main Content Flow */}
      <main className="relative z-20 space-y-16">
        {/* 3. Academic Aim & Objective */}
        <Aim />

        {/* 4. Live Diagnostic Cockpit & Interactive Telemetry */}
        <section id="cockpit" className="scroll-mt-24">
          <Hero />
        </section>

        {/* 5. Theory (Modules 01, 02, 03, Quick Reference, Implementations) */}
        <Theory />

        {/* 6. Pre-Test Assessment (10 MCQs in modal) */}
        <PreTestCallout />

        {/* 7. Interactive Lab (Simulations 1, 2, 3, 4) */}
        <InteractiveLab />

        {/* 8. Packet Flow & Route Inspection Simulator */}
        <MiniGameSection />

        {/* 9. Post-Test Assessment (10 MCQs in modal) */}
        <PostTestCallout />

        {/* 10. Conclusion & Standards */}
        <Conclusion />
      </main>
    </div>
  );
}
