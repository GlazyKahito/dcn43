'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@/lib/progress';
import { Section } from '@/components/chrome/Section';
import { Diagram } from '@/components/theory/Diagram';
import { THEORY, type TheoryTopic } from '@/data/theory';

function TopicBody({ t }: { t: TheoryTopic }) {
  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-paper">{t.summary}</p>
      <ul className="space-y-1.5">
        {t.points.map((p) => (
          <li key={p} className="grid grid-cols-[14px_1fr] gap-2 text-[13.5px] leading-relaxed text-muted">
            <span className="mt-[9px] h-px w-2.5 bg-silver/50" />
            {p}
          </li>
        ))}
      </ul>
      <Diagram d={t.diagram} />
      {t.example && (
        <figure>
          <figcaption className="label mb-1.5">{t.example.caption}</figcaption>
          <pre data-lenis-prevent className="scanlines thin-scroll overflow-x-auto rounded-[2px] border border-hair bg-[#07090a] px-3 py-2.5 font-mono text-[11.5px] leading-[1.5] text-[#cfd2cc]">
            {t.example.lines.join('\n')}
          </pre>
        </figure>
      )}
      <p className="flex gap-3 border-t border-hair pt-3 text-[13px] text-muted">
        <span className="label shrink-0 pt-0.5 text-signal">In the lab</span>
        {t.inLab}
      </p>
    </div>
  );
}

export function TheorySection() {
  const [open, setOpen] = useState(THEORY[0].id);
  const active = THEORY.find((t) => t.id === open) ?? THEORY[0];
  const { openTopic } = useProgress();
  useEffect(() => {
    if (open) openTopic(open);
  }, [open, openTopic]);

  return (
    <Section
      id="theory"
      no="01"
      kicker="Theory · Aim and principles"
      title={
        <>
          The protocols
          <br />
          behind the faults
        </>
      }
      lede="Start with the aim, then five short cards. Each uses this lab’s own addresses and ends with a way to see it happen in the simulation."
    >
      <div className="panel mb-10 grid gap-6 p-6 lg:grid-cols-[1fr_1fr] lg:gap-10">
        <div>
          <p className="label text-signal">Aim</p>
          <p className="mt-3 text-[16px] leading-relaxed text-paper">
            To understand systematic network troubleshooting, use standard diagnostic utilities to isolate faults in a simulated network, and verify connectivity after each repair.
          </p>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
            Faults are found from evidence only: carrier, addressing, gateway, path, name resolution and service state. A repair counts only when end-to-end tests pass again.
          </p>
        </div>
        <div>
          <p className="label">Learning outcomes</p>
          <ol className="mt-3 space-y-2">
            {[
              'Relate a reported symptom to the layer most likely at fault.',
              'Read the output of ping, tracert, ipconfig, nslookup, arp and netstat.',
              'Tell link, addressing, routing, service and filtering faults apart.',
              'Repair a fault and prove recovery with objective tests.',
            ].map((o, i) => (
              <li key={o} className="grid grid-cols-[34px_1fr] text-[14px] leading-snug text-paper">
                <span className="font-mono text-[11px] text-signal">LO{i + 1}</span>
                {o}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ol className="border-t border-hair lg:sticky lg:top-20 lg:self-start">
          {THEORY.map((t) => {
            const on = t.id === open;
            return (
              <li key={t.id} className="border-b border-hair">
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => setOpen(on ? '' : t.id)}
                  className={`flex w-full items-center gap-3 py-2.5 text-left transition-colors ${on ? 'text-paper' : 'text-muted hover:text-paper'}`}
                >
                  <span className="w-9 font-mono text-[10.5px] text-dim">{t.code}</span>
                  <span className="flex-1 font-display text-[15px] uppercase tracking-wide">{t.title}</span>
                  <span className="hidden font-mono text-[10px] text-dim sm:inline">{t.layer}</span>
                  <span aria-hidden className={`font-mono text-[12px] transition-transform lg:hidden ${on ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {on && (
                  <div className="pb-6 pt-2 lg:hidden">
                    <TopicBody t={t} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <article className="panel hidden p-6 lg:block" aria-live="polite">
          <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-hair pb-4">
            <h3 className="font-display text-3xl font-medium uppercase tracking-wide text-paper">{active.title}</h3>
            <span className="label">
              {active.code} · {active.layer}
            </span>
          </div>
          <TopicBody t={active} />
        </article>
      </div>
    </Section>
  );
}
