'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@/lib/progress';
import { Section } from '@/components/chrome/Section';
import { Diagram } from '@/components/theory/Diagram';
import { THEORY, type TheoryTopic } from '@/data/theory';

function TopicBody({ t }: { t: TheoryTopic }) {
  return (
    <div className="space-y-5">
      <p className="text-[16px] font-medium leading-snug text-paper">{t.summary}</p>
      <dl className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {t.facts.map((f) => (
          <div key={f.k} className="rounded-[3px] border border-hair bg-ink/40 px-3 py-2.5">
            <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-dim">{f.k}</dt>
            <dd className="mt-1 font-display text-[14px] font-bold leading-tight tracking-tight text-paper">{f.v}</dd>
          </div>
        ))}
      </dl>
      <Diagram d={t.diagram} />
      {t.example && (
        <figure>
          <figcaption className="label mb-1.5">{t.example.caption}</figcaption>
          <pre data-lenis-prevent className="scanlines thin-scroll overflow-x-auto rounded-[2px] border border-hair bg-[#07090a] px-3 py-2.5 font-mono text-[11.5px] leading-[1.5] text-[#cfd2cc]">
            {t.example.lines.join('\n')}
          </pre>
        </figure>
      )}
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
      lede="The aim, then five short cards."
    >
      <div className="mb-10 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-4 sm:col-span-2 xl:col-span-1 xl:row-span-2">
          <p className="label text-signal">Aim</p>
          <p className="mt-2 font-display text-[18px] font-bold leading-snug tracking-tight text-paper">Find network faults from evidence, fix them, and prove the fix.</p>
        </div>
        {[
          ['LO1', 'Symptom → layer'],
          ['LO2', 'Read ping, tracert, ipconfig, nslookup, arp, netstat'],
          ['LO3', 'Tell link, address, route, service and filter faults apart'],
          ['LO4', 'Repair, then verify'],
          ['Tools', '9 diagnostic commands'],
          ['Network', '5 devices · 3 subnets'],
        ].map(([k, v]) => (
          <div key={k} className="panel px-4 py-3">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-dim">{k}</p>
            <p className="mt-1 text-[13.5px] font-medium leading-snug text-paper">{v}</p>
          </div>
        ))}
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
                  <span className="flex-1 font-display text-[15px] uppercase tracking-tight">{t.title}</span>
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
            <h3 className="font-display text-3xl font-bold uppercase tracking-tight text-paper">{active.title}</h3>
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
