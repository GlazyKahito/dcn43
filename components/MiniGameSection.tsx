'use client';

import React from 'react';
import { PacketXFlowGame } from './sims/PacketXFlowGame';
import { Gamepad2, Radio } from 'lucide-react';

export function MiniGameSection() {
  return (
    <section id="minigame" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8b27a]/10 backdrop-blur-xl border border-[#c8b27a]/25 text-[#c8b27a] font-mono text-xs uppercase tracking-widest shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <Gamepad2 className="w-4 h-4 text-[#c8b27a]" />
          <span>Interactive Simulation &bull; Packet Inspection</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white">
          Packet Flow &amp; Path Diagnostic Simulator
        </h2>
        <p className="text-sm sm:text-base text-[#78b496]/90 font-sans leading-relaxed">
          An interactive laboratory exercise in network path isolation: inspect transit hops, restore physical link interruptions, reconfigure default gateway routes, and filter malicious packet streams at the firewall boundary.
        </p>
      </div>

      {/* The Arcade Machine */}
      <PacketXFlowGame />
    </section>
  );
}
