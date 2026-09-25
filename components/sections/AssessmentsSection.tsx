'use client';

import { useEffect, useMemo, useState } from 'react';
import { Section } from '@/components/chrome/Section';
import { Led } from '@/components/chrome/Led';
import { QUESTIONS, type Question, type QuestionKind } from '@/data/assessment';
import { useProgress } from '@/lib/progress';
import { NumberTicker } from '@/components/fx/NumberTicker';

const KIND_LABEL: Record<QuestionKind, string> = { mcq: 'Concept', scenario: 'Scenario', diagnostic: 'Diagnostic' };
const BEST_KEY = 'svl-exp10-assessment-best';

interface Item {
  q: Question;
  order: number[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const build = (qs: Question[]): Item[] => qs.map((q) => ({ q, order: shuffle([0, 1, 2, 3]) }));

export function AssessmentsSection() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [best, setBest] = useState<number | null>(null);
  const { quizProgress } = useProgress();

  useEffect(() => {
    try {
      const v = localStorage.getItem(BEST_KEY);
      if (v) setBest(Number(v));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const done = items && index >= items.length;
  const fullRun = items?.length === QUESTIONS.length;
  const answeredCount = items ? items.filter((it) => answers[it.q.id] !== undefined).length : 0;
  useEffect(() => {
    if (items && fullRun) quizProgress(answeredCount, QUESTIONS.length, !!done);
  }, [items, fullRun, answeredCount, done, quizProgress]);
  const score = items ? items.filter((it) => answers[it.q.id] === it.q.answer).length : 0;

  useEffect(() => {
    if (!done || !items || items.length !== QUESTIONS.length) return;
    const pct = Math.round((score / items.length) * 100);
    if (best === null || pct > best) {
      setBest(pct);
      try {
        localStorage.setItem(BEST_KEY, String(pct));
      } catch {
        /* ignore */
      }
    }
  }, [done, items, score, best]);

  const start = (qs: Question[]) => {
    setItems(build(qs));
    setIndex(0);
    setAnswers({});
  };

  return (
    <Section
      id="assessments"
      no="04"
      kicker="Test · Assessment"
      title={
        <>
          Test the
          <br />
          diagnosis, not recall
        </>
      }
      lede="24 questions: concepts, real terminal evidence, next-step decisions."
    >
      {!items ? (
        <Intro best={best} onStart={() => start(QUESTIONS)} />
      ) : done ? (
        <Results items={items} answers={answers} best={best} onRetry={() => start(QUESTIONS)} onRetryMissed={() => start(items.filter((it) => answers[it.q.id] !== it.q.answer).map((it) => it.q))} />
      ) : (
        <QuestionCard
          key={items[index].q.id}
          item={items[index]}
          index={index}
          total={items.length}
          score={score}
          chosen={answers[items[index].q.id]}
          onChoose={(opt) => setAnswers((a) => ({ ...a, [items[index].q.id]: opt }))}
          onNext={() => setIndex((i) => i + 1)}
        />
      )}
    </Section>
  );
}

function Intro({ best, onStart }: { best: number | null; onStart: () => void }) {
  const counts = useMemo(() => {
    const c: Record<QuestionKind, number> = { mcq: 0, scenario: 0, diagnostic: 0 };
    QUESTIONS.forEach((q) => c[q.kind]++);
    return c;
  }, []);
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
      <div className="grid gap-px border border-hair bg-hair sm:grid-cols-3">
        {(Object.keys(counts) as QuestionKind[]).map((k) => (
          <div key={k} className="bg-graphite p-5">
            <p className="label">{KIND_LABEL[k]}</p>
            <p className="mt-2 font-display text-5xl font-light text-paper">{counts[k]}</p>
            <p className="mt-2 text-[13px] text-muted">
              {k === 'mcq' && 'Layers, addressing, protocols and tool behaviour.'}
              {k === 'scenario' && 'Read real terminal evidence and name the root cause.'}
              {k === 'diagnostic' && 'Choose the next test or interpret an output.'}
            </p>
          </div>
        ))}
      </div>
      <div className="panel flex flex-col justify-between gap-4 p-5 md:w-[260px]">
        <div>
          <p className="label">Best score</p>
          <p className="mt-2 font-display text-5xl font-light text-paper">{best === null ? '—' : `${best}%`}</p>
          <p className="mt-2 text-[12px] text-dim">Stored in this browser only.</p>
        </div>
        <button type="button" className="btn-primary w-full" onClick={onStart}>
          Begin assessment
        </button>
      </div>
    </div>
  );
}

function QuestionCard({
  item,
  index,
  total,
  score,
  chosen,
  onChoose,
  onNext,
}: {
  item: Item;
  index: number;
  total: number;
  score: number;
  chosen: number | undefined;
  onChoose: (opt: number) => void;
  onNext: () => void;
}) {
  const { q, order } = item;
  const answered = chosen !== undefined;
  const correct = chosen === q.answer;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="panel p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="chip">{KIND_LABEL[q.kind]}</span>
          <span className="chip">{q.topic}</span>
          <span className="label ml-auto">
            {index + 1} / {total}
          </span>
        </div>
        <h3 className="text-[18px] leading-snug text-paper sm:text-[20px]">{q.prompt}</h3>
        {q.exhibit && (
          <pre data-lenis-prevent className="scanlines thin-scroll mt-4 overflow-x-auto rounded-[2px] border border-hair bg-[#07090a] px-3 py-2.5 font-mono text-[11.5px] leading-[1.5] text-[#cfd2cc]">
            {q.exhibit.join('\n')}
          </pre>
        )}
        <fieldset className="mt-5 space-y-2" disabled={answered}>
          <legend className="sr-only">Options</legend>
          {order.map((opt, i) => {
            const isAnswer = opt === q.answer;
            const isChosen = opt === chosen;
            const style = !answered
              ? 'border-hair text-muted hover:border-hair-strong hover:text-paper'
              : isAnswer
                ? 'border-signal/60 bg-signal-soft text-paper'
                : isChosen
                  ? 'border-alarm/50 bg-alarm-soft text-paper'
                  : 'border-hair text-dim';
            return (
              <button key={opt} type="button" onClick={() => onChoose(opt)} className={`flex w-full items-start gap-3 rounded-[2px] border px-3.5 py-3 text-left text-[14px] leading-snug transition-colors ${style}`}>
                <span className="mt-px font-mono text-[11px] text-dim">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">{q.options[opt]}</span>
                {answered && isAnswer && <Led tone="ok" className="mt-1.5" />}
                {answered && isChosen && !isAnswer && <Led tone="err" className="mt-1.5" />}
              </button>
            );
          })}
        </fieldset>
        {answered && (
          <div className="mt-5 flex flex-col gap-4 border-t border-hair pt-4 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-[14px] leading-relaxed text-muted" role="status">
              <span className={`font-mono text-[11px] uppercase tracking-[0.14em] ${correct ? 'text-signal' : 'text-alarm'}`}>{correct ? 'Correct' : 'Incorrect'} · </span>
              {q.explanation}
            </p>
            <button type="button" className="btn-primary shrink-0" onClick={onNext} autoFocus>
              {index + 1 === total ? 'See results' : 'Next question'} →
            </button>
          </div>
        )}
      </div>
      <aside className="panel h-fit p-5">
        <p className="label">Progress</p>
        <div className="mt-3 flex flex-wrap gap-1" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-2 w-3 ${i < index ? 'bg-silver/60' : i === index ? 'bg-signal' : 'bg-steel'}`} />
          ))}
        </div>
        <p className="mt-5 label">Running score</p>
        <p className="mt-1 font-display text-4xl font-light text-paper">
          {score}
          <span className="text-dim"> / {index + (answered ? 1 : 0)}</span>
        </p>
      </aside>
    </div>
  );
}

function Results({ items, answers, best, onRetry, onRetryMissed }: { items: Item[]; answers: Record<string, number>; best: number | null; onRetry: () => void; onRetryMissed: () => void }) {
  const right = items.filter((it) => answers[it.q.id] === it.q.answer);
  const pct = Math.round((right.length / items.length) * 100);
  const missed = items.filter((it) => answers[it.q.id] !== it.q.answer);
  const band = pct >= 85 ? 'Ready for independent fault diagnosis' : pct >= 60 ? 'Sound fundamentals; review the missed topics' : 'Revisit the theory cards and repeat the diagnostics scenarios';
  const byKind = (Object.keys(KIND_LABEL) as QuestionKind[]).map((k) => {
    const all = items.filter((it) => it.q.kind === k);
    return { k, total: all.length, right: all.filter((it) => answers[it.q.id] === it.q.answer).length };
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="panel p-6">
        <p className="label">Result</p>
        <p className="mt-2 font-display text-7xl font-light text-paper">
          <NumberTicker value={pct} duration={1.2} />%
        </p>
        <p className="mt-1 font-mono text-[12px] text-muted">
          {right.length} of {items.length} correct{best !== null && items.length === QUESTIONS.length ? ` · best ${best}%` : ''}
        </p>
        <p className="mt-4 text-[14px] text-paper">{band}</p>
        <div className="mt-5 space-y-2">
          {byKind
            .filter((b) => b.total)
            .map((b) => (
              <div key={b.k}>
                <div className="flex justify-between font-mono text-[11px] text-muted">
                  <span>{KIND_LABEL[b.k]}</span>
                  <span>
                    {b.right}/{b.total}
                  </span>
                </div>
                <div className="mt-1 h-1 bg-steel">
                  <div className="h-full bg-signal" style={{ width: `${(b.right / b.total) * 100}%` }} />
                </div>
              </div>
            ))}
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" className="btn-primary" onClick={onRetry}>
            Retry all questions
          </button>
          {missed.length > 0 && (
            <button type="button" className="btn" onClick={onRetryMissed}>
              Retry the {missed.length} missed
            </button>
          )}
        </div>
      </div>
      <div className="panel p-6">
        <p className="label mb-4">Review</p>
        {missed.length === 0 ? (
          <p className="text-[14px] text-signal">No incorrect answers.</p>
        ) : (
          <ol className="space-y-4">
            {missed.map((it) => (
              <li key={it.q.id} className="border-b border-hair pb-4 last:border-0">
                <p className="text-[14px] text-paper">{it.q.prompt}</p>
                <p className="mt-1 font-mono text-[11.5px] text-signal">Answer: {it.q.options[it.q.answer]}</p>
                <p className="mt-1 text-[13px] text-muted">{it.q.explanation}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
