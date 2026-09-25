'use client';

import React, { useState } from 'react';
import { POST_TEST_QUESTIONS } from '../data/quiz';
import { QuizModal } from './quiz/QuizModal';
import { ChevronRight } from 'lucide-react';
import { LiquidButton } from './ui/liquid-glass-button';

export function PostTestCallout() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div id="post-test" className="scroll-mt-24 max-w-5xl mx-auto px-4 sm:px-6 py-12 pb-16">
        <div
          onClick={() => setModalOpen(true)}
          className="w-full p-6 sm:p-8 rounded-[2.25rem] border border-white/10 bg-[#0a0f0d]/65 backdrop-blur-2xl hover:border-[#34d399]/40 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-5 cursor-pointer group shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#34d399]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          <div className="space-y-1.5 z-10">
            <span className="text-[11px] font-display uppercase tracking-widest text-[#34d399] font-bold">
              PHASE 2 // VERIFICATION ASSESSMENT
            </span>
            <h3 className="text-xl sm:text-2xl font-sans font-semibold tracking-tight text-white group-hover:text-white transition-colors">
              Post-Test: Advanced Diagnostic Scenarios
            </h3>
            <p className="text-sm text-[#78b496]/80 max-w-xl leading-relaxed font-sans">
              Test your diagnostic triage mastery: parse raw traceroute hop outputs, pinpoint ipconfig mask errors, distinguish timeout vs destination unreachable, and analyze asymmetric routing.
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
              <span>Take Post-Test (10 MCQs)</span>
              <ChevronRight className="w-4 h-4 text-[#34d399]" />
            </span>
          </LiquidButton>
        </div>
      </div>

      <QuizModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post-Test Assessment: Advanced Network Diagnostics"
        phaseLabel="PHASE 02 // VERIFICATION ASSESSMENT"
        questions={POST_TEST_QUESTIONS}
      />
    </>
  );
}
