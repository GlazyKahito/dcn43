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
  BookOpen,
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
      <div className="w-full max-w-2xl bg-[#161617] border border-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-800/80 flex items-center justify-between bg-black/40">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#2997ff] font-semibold">
              {phaseLabel}
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-neutral-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 [scrollbar-width:thin] [scrollbar-color:#333_transparent]">
          {!isFinished ? (
            <>
              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Question {currentIndex + 1} of {total}</span>
                  <span>{Math.round(((currentIndex + 1) / total) * 100)}% Completed</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2997ff] transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <h4 className="text-base sm:text-lg font-semibold text-white leading-relaxed tracking-tight">
                  {currentQ.question}
                </h4>

                {/* Optional code snippet */}
                {currentQ.codeSnippet && (
                  <pre className="p-4 rounded-2xl bg-black border border-neutral-800 text-xs font-mono text-neutral-300 overflow-x-auto">
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
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                        isOptSelected
                          ? 'border-[#2997ff] bg-[#2997ff]/10 text-white ring-1 ring-[#2997ff]/40 shadow-sm'
                          : 'border-neutral-800 bg-neutral-900/60 text-zinc-300 hover:border-neutral-700 hover:bg-neutral-800/40'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 border mt-0.5 ${
                          isOptSelected
                            ? 'border-[#2997ff] bg-[#2997ff] text-black'
                            : 'border-neutral-700 bg-neutral-800 text-neutral-400'
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
              <div className="p-6 rounded-[2rem] bg-black/60 border border-neutral-800 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#2997ff]/10 border border-[#2997ff]/30 text-[#2997ff] flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7" />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Assessment Completed!
                </h4>
                <div className="text-3xl sm:text-4xl font-black font-mono text-white">
                  {correctCount} / {total}
                  <span className="text-lg text-neutral-500 font-normal ml-2">
                    ({percentScore}%)
                  </span>
                </div>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  {percentScore >= 80
                    ? 'Excellent job! You have demonstrated strong mastery of diagnostic utilities and OSI methodology.'
                    : percentScore >= 50
                    ? 'Good effort! Review the detailed question explanations below to strengthen your understanding.'
                    : 'Consider re-reading the Theory sections and re-running the simulations before retaking.'}
                </p>
              </div>

              {/* Question Review Breakdown with Explanations */}
              <div className="space-y-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
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
                            ? 'border-[#30d158]/30 bg-[#30d158]/5'
                            : 'border-[#ff453a]/30 bg-[#ff453a]/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-semibold text-white">
                            {idx + 1}. {q.question}
                          </span>
                          {isRight ? (
                            <span className="flex items-center gap-1 font-mono text-[#30d158] font-bold text-[10px] shrink-0">
                              <CheckCircle2 className="w-4 h-4" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-mono text-[#ff453a] font-bold text-[10px] shrink-0">
                              <XCircle className="w-4 h-4" /> Incorrect
                            </span>
                          )}
                        </div>

                        <div className="text-neutral-400">
                          <span className="text-neutral-500 font-mono">Correct Answer: </span>
                          <span className="text-white font-medium">
                            {q.options[q.correctIndex]}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-neutral-800 text-zinc-300 leading-relaxed">
                          <span className="text-[#2997ff] font-mono font-bold block mb-1">
                            Explanation:
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
        <div className="px-6 py-4 border-t border-neutral-800 bg-black/40 flex items-center justify-between">
          {!isFinished ? (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-mono transition-colors disabled:opacity-30 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!isSelected}
                className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-sm"
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
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors cursor-pointer"
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
