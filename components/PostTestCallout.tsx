'use client';

import React, { useState } from 'react';
import { POST_TEST_QUESTIONS } from '../data/quiz';
import { QuizModal } from './quiz/QuizModal';
import { ChevronRight, Award } from 'lucide-react';

export function PostTestCallout() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div id="post-test" className="scroll-mt-24 max-w-5xl mx-auto px-4 sm:px-6 py-12 pb-16">
        <div
          onClick={() => setModalOpen(true)}
          className="w-full p-6 sm:p-8 rounded-[2.25rem] border border-neutral-800 bg-[#161617] hover:border-[#30d158]/40 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-5 cursor-pointer group shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#30d158]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          <div className="space-y-1.5 z-10">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#30d158] font-semibold">
              Phase 2 &bull; Verification Assessment
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-white transition-colors">
              Post-Test: Advanced Diagnostic Scenarios
            </h3>
            <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
              Test your diagnostic triage mastery: parse raw traceroute hop outputs, pinpoint ipconfig mask errors, distinguish timeout vs destination unreachable, and analyze asymmetric routing.
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs sm:text-sm font-bold hover:bg-neutral-200 active:scale-95 transition-all shadow-md shrink-0 self-start sm:self-auto cursor-pointer z-10"
          >
            <span>Take Post-Test (10 MCQs)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <QuizModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post-Test Assessment: Advanced Network Diagnostics"
        phaseLabel="Phase 2 • Verification Assessment"
        questions={POST_TEST_QUESTIONS}
      />
    </>
  );
}
