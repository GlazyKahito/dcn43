import React from 'react';
import { Hero } from '../components/Hero';
import { Header } from '../components/Header';
import { Aim } from '../components/Aim';
import { Theory } from '../components/Theory';
import { PreTestCallout } from '../components/PreTestCallout';
import { InteractiveLab } from '../components/InteractiveLab';
import { PostTestCallout } from '../components/PostTestCallout';
import { Conclusion } from '../components/Conclusion';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-transparent text-[#e8f2ec] selection:bg-emerald-500/25 selection:text-emerald-200">
      {/* 1. Animated Hero */}
      <Hero />

      {/* 2. Sticky Header */}
      <Header />

      {/* Main Content Flow */}
      <main className="relative z-20 space-y-16">
        {/* 3. Aim */}
        <Aim />

        {/* 4. Theory (Modules 01, 02, 03, Quick Reference, Implementations) */}
        <Theory />

        {/* 5. Pre-Test (10 MCQs in modal) */}
        <PreTestCallout />

        {/* 6. Interactive Lab (Simulations 1, 2, 3) */}
        <InteractiveLab />

        {/* 7. Post-Test (10 Harder MCQs in modal) */}
        <PostTestCallout />

        {/* 8. Conclusion */}
        <Conclusion />
      </main>
    </div>
  );
}
