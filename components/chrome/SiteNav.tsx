'use client';

import { useEffect, useState } from 'react';
import { MODULES, NAV, moduleById, type ModuleId } from '@/data/modules';
import { useLab } from '@/lib/sim/store';
import { useProgress } from '@/lib/progress';
import { detectFaults } from '@/lib/sim/faults';
import { Led } from './Led';

interface Props {
  current: ModuleId;
  onOpen: (id: ModuleId) => void;
  onIndex: () => void;
}

export function SiteNav({ current, onOpen, onIndex }: Props) {
  const [open, setOpen] = useState(false);
  const { state } = useLab();
  const faults = detectFaults(state.net).length;
  const activeNav: ModuleId = current;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (target: ModuleId | 'index') => {
    setOpen(false);
    if (target === 'index') onIndex();
    else onOpen(target);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[200] border-b border-hair bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <button type="button" onClick={() => go('index')} className="flex min-w-0 items-center gap-3 text-left" aria-label="Return to patch panel">
          <span className="grid h-7 w-7 shrink-0 place-items-center border border-hair-strong font-mono text-[10px] text-silver">08</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-mono text-[10px] uppercase tracking-[0.18em] text-dim">Somaiya Virtual Labs</span>
            <span className="block truncate font-display text-[13px] font-bold uppercase tracking-tight text-paper">
              Network Troubleshooting <span className="text-dim">· Exp 8</span>
            </span>
          </span>
        </button>

        <nav aria-label="Modules" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {NAV.map((item) => {
              const on = item.target === activeNav;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => go(item.target)}
                    aria-current={on ? 'page' : undefined}
                    className={`relative px-2.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors ${on ? 'text-paper' : 'text-dim hover:text-muted'}`}
                  >
                    {item.label}
                    <span className={`absolute inset-x-2.5 -bottom-[9px] h-px transition-colors ${on ? 'bg-signal' : 'bg-transparent'}`} />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted md:flex">
            <Led tone={faults ? 'err' : 'ok'} pulse={faults > 0} />
            {faults ? `${faults} fault${faults > 1 ? 's' : ''}` : 'Nominal'}
          </span>
          <button type="button" onClick={() => go('simulator')} className="btn-primary hidden py-1.5 sm:inline-flex">
            Launch Lab
          </button>
          <button type="button" className="btn py-1.5 xl:hidden" aria-expanded={open} aria-controls="nav-drawer" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      <ProgressRail current={current} onOpen={(id) => go(id)} />

      {open && (
        <div id="nav-drawer" data-drawer-open className="border-t border-hair bg-ink/95 xl:hidden" data-lenis-prevent>
          <ul className="mx-auto grid max-w-[1440px] gap-px px-4 py-3 sm:grid-cols-2 sm:px-6">
            {NAV.map((item, i) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => go(item.target)}
                  className={`flex w-full items-center gap-4 border-b border-hair py-3 text-left font-display text-lg uppercase tracking-tight ${item.target === activeNav ? 'text-paper' : 'text-muted'}`}
                >
                  <span className="font-mono text-[10px] text-dim">{String(i).padStart(2, '0')}</span>
                  {item.label}
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => go('simulator')} className="btn-primary mt-3 w-full">
                Launch Lab →
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

/** “LAB PROGRESS 01 ━ [02] ━ 03 ━ 04 ━ 05   02 / 05 SIMULATION” — where the student is on the recommended path. */
function ProgressRail({ current, onOpen }: { current: ModuleId; onOpen: (id: ModuleId) => void }) {
  const pg = useProgress();
  const mod = moduleById(current);
  return (
    <div className="border-t border-hair/60">
      <div className="mx-auto flex h-8 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
        <span className="label hidden shrink-0 md:inline">Lab progress</span>
        <ol className="no-scrollbar flex min-w-0 flex-1 items-center overflow-x-auto" aria-label="Lab progress">
          {MODULES.map((m, i) => {
            const s = pg.stateOf(m.id);
            const here = m.id === current;
            return (
              <li key={m.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => onOpen(m.id)}
                  aria-current={here ? 'step' : undefined}
                  title={`${m.no} ${m.title} — ${m.role}`}
                  className={`shrink-0 px-1 font-mono text-[10px] tabular-nums transition-colors ${
                    here ? 'border border-silver/50 px-1.5 text-paper' : s === 'complete' ? 'text-signal hover:text-paper' : 'text-dim hover:text-muted'
                  }`}
                >
                  {m.no}
                </button>
                {i < MODULES.length - 1 && <span className={`mx-1 h-px min-w-[10px] flex-1 ${s === 'complete' ? 'bg-signal/60' : 'bg-hair-strong'}`} />}
              </li>
            );
          })}
        </ol>
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:inline">
          <span className="text-paper">{mod.no}</span> / {String(MODULES.length).padStart(2, '0')} · {mod.title}
        </span>
      </div>
    </div>
  );
}
