'use client';

import React from 'react';
import { PacketXFlowGame } from './sims/PacketXFlowGame';
import { Gamepad2, Radio } from 'lucide-react';

export function MiniGameSection() {
  return (
    <section id="minigame" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c8b27a]/10 backdrop-blur-xl border border-[#c8b27a]/25 text-[#c8b27a] font-display text-xs uppercase tracking-widest shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <Gamepad2 className="w-4 h-4 text-[#c8b27a]" />
          <span>VINTAGE ARCADE LAB // 1986 EDITION</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-white crt-phosphor">
          Packet X-Flow: The Net Defender
        </h2>
        <p className="text-sm sm:text-base text-[#78b496]/80 font-sans leading-relaxed">
          Put your diagnostic reflexes to the test! Defend the campus network by repairing cut copper trunks, flipping gateway routes, and filtering malicious SYN floods at the firewall gate.
        </p>
      </div>

      {/* The Arcade Machine */}
      <PacketXFlowGame />
    </section>
  );
}
