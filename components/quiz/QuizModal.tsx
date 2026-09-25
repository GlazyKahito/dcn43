'use client';

import React, { useState } from 'react';
import { QuizQuestion } from '../../data/quiz';
import confetti from 'canvas-confetti';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
} from 'lucide-react';

interface QuizModalProps {
  title: string;
  phaseLabel: string;
  questions: QuizQuestion[];
  isOpen: boolean;
  onClose: () => void;
}

export function QuizModal({
  title,
  phaseLabel,
  questions,
  isOpen,
  onClose,
}: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const isSelected = selectedAnswers[currentQ.id] !== undefined;

  const handleSelectOption = (optIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate score
      let correct = 0;
      questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctIndex) {
          correct++;
        }
      });

      setIsFinished(true);

      // Trigger confetti if scored 70% or more!
      if (correct >= Math.ceil(total * 0.7)) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
  };

  // Score computation
  const correctCount = questions.reduce(
    (acc, q) => (selectedAnswers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  );
  const percentScore = Math.round((correctCount / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0a0f0d] border border-[#78b496]/30 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#78b496]/20 flex items-center justify-between bg-[#101713]/80">
          <div>
            <span className="text-[10px] font-display uppercase tracking-widest text-[#34d399] font-bold">
              {phaseLabel}
            </span>
            <h3 className="text-lg font-sans font-semibold text-white tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#78b496]/70 hover:text-white p-2 rounded-xl hover:bg-[#101713] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 [scrollbar-width:thin] [scrollbar-color:#1a2e22_transparent]">
          {!isFinished ? (
            <>
              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#78b496]/80">
                  <span>Question {currentIndex + 1} of {total}</span>
                  <span>{Math.round(((currentIndex + 1) / total) * 100)}% Completed</span>
                </div>
                <div className="w-full h-1.5 bg-[#101713] border border-[#78b496]/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#34d399] transition-all duration-300 shadow-[0_0_8px_#34d399]"
                    style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <h4 className="text-base sm:text-lg font-sans font-semibold text-white leading-relaxed tracking-tight">
                  {currentQ.question}
                </h4>

                {/* Optional code snippet */}
                {currentQ.codeSnippet && (
                  <pre className="p-4 rounded-2xl bg-[#070c09] border border-[#78b496]/20 text-xs font-mono text-[#c9dccf] overflow-x-auto">
                    <code>{currentQ.codeSnippet}</code>
                  </pre>
                )}
              </div>

              {/* Option List */}
              <div className="space-y-3">
                {currentQ.options.map((option, optIdx) => {
                  const isOptSelected = selectedAnswers[currentQ.id] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-sans transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                        isOptSelected
                          ? 'border-[#34d399] bg-[#1f7a4d]/20 text-white ring-1 ring-[#34d399]/40 shadow-sm'
                          : 'border-[#78b496]/20 bg-[#101713]/70 text-[#c9dccf] hover:border-[#34d399]/40 hover:bg-[#13231a]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg font-display text-xs font-bold flex items-center justify-center shrink-0 border mt-0.5 ${
                          isOptSelected
                            ? 'border-[#34d399] bg-[#34d399] text-[#050807]'
                            : 'border-[#78b496]/30 bg-[#101713] text-[#78b496]'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1 leading-snug">{option}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Results Screen */
            <div className="space-y-6">
              <div className="p-6 rounded-[2rem] bg-[#101713] border border-[#78b496]/25 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#1f7a4d]/20 border border-[#34d399]/40 text-[#34d399] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(52,211,153,0.25)]">
                  <Award className="w-7 h-7" />
                </div>
                <h4 className="text-xl sm:text-2xl font-sans font-semibold text-white tracking-tight">
                  Assessment Completed!
                </h4>
                <div className="text-3xl sm:text-4xl font-display font-black text-[#34d399]">
                  {correctCount} / {total}
                  <span className="text-lg text-[#78b496]/70 font-normal ml-2">
                    ({percentScore}%)
                  </span>
                </div>
                <p className="text-xs text-[#78b496]/90 max-w-md mx-auto font-sans">
                  {percentScore >= 80
                    ? 'Excellent job! You have demonstrated strong mastery of diagnostic utilities and OSI methodology.'
                    : percentScore >= 50
                    ? 'Good effort! Review the detailed question explanations below to strengthen your understanding.'
                    : 'Consider re-reading the Theory sections and re-running the simulations before retaking.'}
                </p>
              </div>

              {/* Question Review Breakdown with Explanations */}
              <div className="space-y-4">
                <span className="text-[11px] font-display uppercase tracking-wider text-[#78b496] font-bold block">
                  Question Explanations & Key Learnings
                </span>

                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const studentAnswer = selectedAnswers[q.id];
                    const isRight = studentAnswer === q.correctIndex;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 sm:p-5 rounded-2xl border text-xs space-y-2 ${
                          isRight
                            ? 'border-[#34d399]/30 bg-[#1f7a4d]/10'
                            : 'border-[#f87171]/30 bg-[#f87171]/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-semibold text-white font-sans">
                            {idx + 1}. {q.question}
                          </span>
                          {isRight ? (
                            <span className="flex items-center gap-1 font-display text-[#34d399] font-bold text-[10px] shrink-0">
                              <CheckCircle2 className="w-4 h-4" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-display text-[#f87171] font-bold text-[10px] shrink-0">
                              <XCircle className="w-4 h-4" /> Incorrect
                            </span>
                          )}
                        </div>

                        <div className="text-[#78b496]/80 font-sans">
                          <span className="text-[#78b496]/50 font-mono">Correct Answer: </span>
                          <span className="text-white font-medium">
                            {q.options[q.correctIndex]}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-[#070c09] border border-[#78b496]/20 text-[#c9dccf] leading-relaxed">
                          <span className="text-[#34d399] font-display font-bold block mb-1">
                            EXPLANATION:
                          </span>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-[#78b496]/20 bg-[#101713]/80 flex items-center justify-between">
          {!isFinished ? (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl bg-[#101713] border border-[#78b496]/20 text-[#78b496] hover:text-white text-xs font-mono transition-colors disabled:opacity-30 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!isSelected}
                className="px-6 py-2.5 rounded-xl bg-[#1f7a4d] hover:bg-[#34d399] text-white hover:text-[#050807] text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.25)]"
              >
                <span>{currentIndex === total - 1 ? 'Finish & Grade' : 'Next Question'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 rounded-xl bg-[#101713] border border-[#78b496]/20 text-[#78b496] hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#1f7a4d] hover:bg-[#34d399] text-white hover:text-[#050807] text-xs font-bold transition-colors cursor-pointer"
              >
                Close Assessment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
