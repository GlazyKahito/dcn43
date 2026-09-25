'use client';

import { useEffect, useState } from 'react';
import { NAV, type SectionId } from '@/data/modules';
import { useLab } from '@/lib/sim/store';
import { detectFaults } from '@/lib/sim/faults';
import { Led } from './Led';

interface Props {
  active: SectionId;
  onNavigate: (id: SectionId) => void;
  onWorks: () => void;
}

export function SiteNav({ active, onNavigate, onWorks }: Props) {
  const [open, setOpen] = useState(false);
  const { state } = useLab();
  const faults = detectFaults(state.net).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (target: SectionId | 'works') => {
    setOpen(false);
    if (target === 'works') onWorks();
    else onNavigate(target);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[200] border-b border-hair bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <button type="button" onClick={() => go('works')} className="flex min-w-0 items-center gap-3 text-left" aria-label="Return to index">
          <span className="grid h-7 w-7 shrink-0 place-items-center border border-hair-strong font-mono text-[10px] text-silver">10</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-mono text-[10px] uppercase tracking-[0.18em] text-dim">Somaiya Virtual Labs</span>
            <span className="block truncate font-display text-[13px] font-medium uppercase tracking-wider text-paper">
              Network Troubleshooting <span className="text-dim">· Exp 10</span>
            </span>
          </span>
        </button>

        <nav aria-label="Sections" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {NAV.map((item) => {
              const on = item.target === active;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => go(item.target)}
                    aria-current={on ? 'true' : undefined}
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
          <button
            type="button"
            className="btn py-1.5 xl:hidden"
            aria-expanded={open}
            aria-controls="nav-drawer"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {open && (
        <div id="nav-drawer" data-drawer-open className="border-t border-hair bg-ink/95 xl:hidden" data-lenis-prevent>
          <ul className="mx-auto grid max-w-[1440px] gap-px px-4 py-3 sm:grid-cols-2 sm:px-6">
            {NAV.map((item, i) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => go(item.target)}
                  className={`flex w-full items-center gap-4 border-b border-hair py-3 text-left font-display text-lg uppercase tracking-wide ${item.target === active ? 'text-paper' : 'text-muted'}`}
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
