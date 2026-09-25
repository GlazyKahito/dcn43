'use client';

import React, { useState } from 'react';
import { PRE_TEST_QUESTIONS } from '../data/quiz';
import { QuizModal } from './quiz/QuizModal';
import { ChevronRight } from 'lucide-react';
import { LiquidButton } from './ui/liquid-glass-button';

export function PreTestCallout() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div id="pre-test" className="scroll-mt-24 max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-12">
        <div
          onClick={() => setModalOpen(true)}
          className="w-full p-6 sm:p-8 rounded-[2.25rem] border border-white/10 bg-[#0a0f0d]/65 backdrop-blur-2xl hover:border-[#34d399]/40 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-5 cursor-pointer group shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#34d399]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          <div className="space-y-1.5 z-10">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#34d399] font-semibold">
              Assessment Phase I &bull; Diagnostic Fundamentals
            </span>
            <h3 className="text-xl sm:text-2xl font-sans font-semibold tracking-tight text-white group-hover:text-white transition-colors">
              Pre-Test Assessment: Foundational Concepts
            </h3>
            <p className="text-sm text-[#78b496]/80 max-w-xl leading-relaxed font-sans">
              Assess your baseline understanding of ping ICMP mechanisms, traceroute TTL decrements, 169.254.x.x APIPA addresses, and bottom-up OSI diagnosis before starting the interactive lab.
            </p>
          </div>

          <LiquidButton
            type="button"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            className="text-white hover:text-[#34d399] font-sans shrink-0 self-start sm:self-auto cursor-pointer z-10"
          >
            <span className="flex items-center gap-2">
              <span>Take Pre-Test (10 MCQs)</span>
              <ChevronRight className="w-4 h-4 text-[#34d399]" />
            </span>
          </LiquidButton>
        </div>
      </div>

      <QuizModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Pre-Test Assessment: Network Troubleshooting Basics"
        phaseLabel="PHASE 01 // DIAGNOSTIC READINESS"
        questions={PRE_TEST_QUESTIONS}
      />
    </>
  );
}
