'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Section } from '@/components/chrome/Section';
import { Led } from '@/components/chrome/Led';
import { NetworkIncident } from '@/components/game/incident/NetworkIncident';
import { DIFFICULTY, type Difficulty } from '@/lib/game/incidents';
import { useProgress } from '@/lib/progress';

const KEY = 'svl-exp10-incident';

interface GameRecord {
  best: Partial<{ [K in Difficulty]: number }>;
  resolved: number;
}

export function MiniGameSection() {
  const [level, setLevel] = useState<Difficulty>('medium');
  const [playing, setPlaying] = useState(false);
  const [record, setRecord] = useState<GameRecord>({ best: {}, resolved: 0 });
  const { gameProgress } = useProgress();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setRecord(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
  }, []);

  // The game owns the screen while it runs: stop the page underneath from scrolling.
  useEffect(() => {
    if (!playing) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [playing]);

  const exit = ({ resolved, score }: { resolved: boolean; score: number }) => {
    setPlaying(false);
    if (!resolved) return;
    gameProgress(1, true);
    setRecord((r) => {
      const next = { resolved: r.resolved + 1, best: { ...r.best, [level]: Math.max(r.best[level] ?? 0, score) } };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <Section
      id="minigame"
      no="03"
      kicker="Mini-game · Network Incident"
      title={
        <>
          Network
          <br />
          incident
        </>
      }
      lede="Locate the fault. Diagnose the failure. Restore the network. Walk the laboratory floor, inspect the equipment, run diagnostics from the terminal and prove the repair before the clock runs out."
    >
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="panel overflow-hidden">
          <div className="grid-paper relative h-[260px] border-b border-hair bg-ink/50">
            <FloorPlan />
          </div>
          <div className="grid gap-px bg-hair sm:grid-cols-4">
            {['Investigate', 'Diagnose', 'Repair', 'Verify'].map((s, i) => (
              <div key={s} className="bg-graphite px-4 py-3">
                <p className="font-mono text-[10px] text-signal">{String(i + 1).padStart(2, '0')}</p>
                <p className="font-display text-[15px] uppercase tracking-wide text-paper">{s}</p>
              </div>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-px bg-hair text-[12px] sm:grid-cols-4">
            {[
              ['WASD', 'Move'],
              ['E', 'Interact'],
              ['Shift', 'Sprint'],
              ['Esc', 'Pause'],
            ].map(([k, v]) => (
              <div key={k} className="bg-graphite px-4 py-2.5 font-mono uppercase tracking-[0.12em]">
                <dt className="inline text-paper">{k}</dt> <dd className="inline text-dim">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="panel flex flex-col p-6">
          <p className="label mb-3">Difficulty</p>
          <div role="radiogroup" aria-label="Difficulty" className="space-y-2">
            {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={level === d}
                onClick={() => setLevel(d)}
                className={`flex w-full items-center justify-between gap-3 rounded-[2px] border px-4 py-3 text-left transition-colors ${level === d ? 'border-silver/50 bg-steel/60' : 'border-hair hover:border-hair-strong'}`}
              >
                <span>
                  <span className="block font-display text-lg uppercase tracking-wide text-paper">{DIFFICULTY[d].label}</span>
                  <span className="font-mono text-[11px] text-muted">{DIFFICULTY[d].note}</span>
                </span>
                <span className="text-right font-mono text-[10.5px] text-dim">
                  best
                  <span className="block text-[13px] text-paper">{record.best[d] ?? '—'}</span>
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="btn-primary mt-5 w-full py-3" onClick={() => setPlaying(true)}>
            Enter network incident →
          </button>
          <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-muted">
            <Led tone={record.resolved ? 'ok' : 'off'} /> {record.resolved} case{record.resolved === 1 ? '' : 's'} resolved
          </p>
        </div>
      </div>

      {/* Portalled to <body>: animated ancestors use transforms, which would otherwise trap position: fixed. */}
      {playing && createPortal(<NetworkIncident difficulty={level} onExit={exit} />, document.body)}
    </Section>
  );
}

/** Static plan of the incident floor, as a preview. */
function FloorPlan() {
  return (
    <svg viewBox="0 0 1600 1000" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-label="Floor plan of the incident laboratory">
      <g fill="none" stroke="rgba(232,228,218,0.25)" strokeWidth="6">
        <rect x="14" y="14" width="1572" height="972" />
        <path d="M1051 28 V412 M1051 568 V972" />
      </g>
      <g fill="rgba(21,24,26,0.9)" stroke="rgba(232,228,218,0.35)" strokeWidth="3">
        {[
          [110, 150, 210, 86],
          [110, 640, 210, 86],
          [370, 28, 190, 46],
          [640, 28, 280, 58],
          [470, 400, 92, 140],
          [820, 400, 92, 140],
          [380, 880, 230, 92],
          [700, 880, 250, 92],
          [1170, 250, 92, 140],
          [1390, 430, 112, 180],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g stroke="rgba(95,174,138,0.6)" strokeWidth="4" fill="none">
        <path d="M320 200 H410 V440 H470 M320 682 H410 V505 H470 M562 470 H820 M912 470 H1110 V320 H1170 M1262 320 H1330 V520 H1390" />
      </g>
      <g fill="rgba(232,228,218,0.6)" fontSize="30" fontFamily="var(--font-mono)">
        <text x="140" y="130">PC-01</text>
        <text x="140" y="780">PC-02</text>
        <text x="470" y="385">SW-01</text>
        <text x="830" y="385">R1</text>
        <text x="1180" y="235">FW1</text>
        <text x="1380" y="415">SERVER-01</text>
        <text x="380" y="865">TERMINAL</text>
        <text x="700" y="865">CONSOLE</text>
      </g>
      <circle cx="720" cy="660" r="14" fill="#d6a24e" />
    </svg>
  );
}
