'use client';

import React from 'react';
import { LiquidButton, MetalButton, Button } from "@/components/ui/liquid-glass-button";
import { Sparkles, Zap, ShieldCheck, Trophy } from "lucide-react";

export function DemoOne() {
  return (
    <section id="ui-showcase" className="scroll-mt-24 max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34d399]/15 border border-[#34d399]/30 text-[#34d399] font-display text-xs uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-[#34d399]" />
          <span>UI COMPONENT SHOWCASE // SHADCN</span>
        </div>
        <h3 className="text-2xl sm:text-4xl font-display font-bold text-white crt-phosphor">
          Liquid Glass & Metal Buttons
        </h3>
        <p className="text-xs sm:text-sm text-[#78b496]/80 font-mono max-w-lg mx-auto">
          Experimental UI primitives integrated directly into <code className="text-[#34d399]">@/components/ui/liquid-glass-button.tsx</code> with SVG refraction and 3D metallic physics.
        </p>
      </div>

      <div className="p-8 sm:p-12 rounded-[2.5rem] bg-[#0a0f0d]/90 border border-[#78b496]/20 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center gap-8">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#34d399]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Primary Liquid Button Showcase */}
        <div className="flex flex-col items-center gap-3 z-10">
          <span className="text-[10px] font-mono uppercase text-[#78b496]/60 tracking-wider">
            Refractive Fluid SVG Filter
          </span>
          <LiquidButton size="xxl" className="text-white hover:text-[#34d399] font-display">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#34d399]" />
              <span>Liquid Glass Button</span>
            </span>
          </LiquidButton>
        </div>

        {/* 3D Metal Buttons Showcase */}
        <div className="flex flex-col items-center gap-3 pt-4 border-t border-[#78b496]/15 w-full z-10">
          <span className="text-[10px] font-mono uppercase text-[#78b496]/60 tracking-wider">
            Hardware-Accelerated 3D Metal Buttons
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <MetalButton variant="success">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#34d399]" />
                <span>Emerald Metal</span>
              </span>
            </MetalButton>

            <MetalButton variant="gold">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#c8b27a]" />
                <span>Gold Metal</span>
              </span>
            </MetalButton>

            <MetalButton variant="primary">
              <span>Cyber Primary</span>
            </MetalButton>

            <Button variant="cool" size="lg">
              <span>Cool Radix Slot</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DemoOne;
