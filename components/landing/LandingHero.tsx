'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MODULES, type LabModule } from '@/data/modules';
import { setLinkUp } from '@/lib/sim/actions';
import { detectFaults } from '@/lib/sim/faults';
import { assessHealth } from '@/lib/sim/health';
import { useLab } from '@/lib/sim/store';
import { useProgress, type ModuleState } from '@/lib/progress';
import type { Proto } from '@/lib/sim/types';
import { Led, type LedTone } from '@/components/chrome/Led';
import { TopologyView, type Selection } from '@/components/network/TopologyView';
import { Glyph } from './Glyph';

interface Props {
  /** False while the lamp intro is still on screen; the landing powers up when it turns true. */
  revealed: boolean;
  onLaunch: (module: LabModule, rect: DOMRect) => void;
}

const STATE_LABEL: Record<ModuleState, string> = {
  complete: '✓ Verified',
  active: 'Active',
  next: 'Next',
  available: 'Anytime',
  upcoming: 'Upcoming',
};

const CYCLE: { proto: Proto; target: string; label: string }[] = [
  { proto: 'icmp', target: '172.16.0.10', label: 'ICMP' },
  { proto: 'udp', target: '172.16.0.10', label: 'DNS' },
  { proto: 'tcp', target: 'www.lab.local', label: 'HTTP' },
];

interface Reading {
  label: string;
  delivered: boolean;
  text: string;
}

/** Landing: the live lab network as the hero, with the modules on a rack patch panel below. */
export function LandingHero({ revealed, onLaunch }: Props) {
  const lab = useLab();
  const { state, apply, reset } = lab;
  const pg = useProgress();
  const states = MODULES.map((m) => pg.stateOf(m.id));
  const nextIdx = MODULES.findIndex((m) => m.id === pg.next);
  const [focus, setFocus] = useState(() => Math.max(0, MODULES.findIndex((m) => m.id === pg.current)));
  // Entrance stagger runs once as the intro dissolves; afterwards hovers respond immediately.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!revealed) return;
    const t = window.setTimeout(() => setSettled(true), 1800);
    return () => window.clearTimeout(t);
  }, [revealed]);
  const reveal = () =>
    `transition-[opacity,transform,filter] duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] ${revealed ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-3 opacity-0 blur-[3px]'}`;
  const delay = (ms: number) => ({ transitionDelay: revealed && !settled ? `${ms}ms` : '0ms' });
  const [launching, setLaunching] = useState<number | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const portRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const labRef = useRef(lab);
  labRef.current = lab;

  const health = useMemo(() => assessHealth(state.net), [state.net]);
  const faults = useMemo(() => detectFaults(state.net), [state.net]);
  const tone: LedTone = health.status === 'operational' ? 'ok' : health.status === 'degraded' ? 'warn' : 'err';

  // Ambient traffic: one probe from PC1 every 2.2 s, cycling ICMP, DNS and HTTP.
  useEffect(() => {
    if (!revealed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    const tick = () => {
      const c = CYCLE[i++ % CYCLE.length];
      const r = labRef.current.send('PC1', c.target, c.proto, true);
      const text = r.delivered ? `PC1 → SRV1 · ${r.rtt < 1 ? '<1' : Math.round(r.rtt)} ms${c.proto === 'icmp' ? ` · TTL ${r.ttl}` : ''}` : `PC1 → ${c.target} · ${r.reason ?? 'lost'}`;
      setReadings((rs) => [{ label: c.label, delivered: r.delivered, text }, ...rs].slice(0, 4));
    };
    const first = window.setTimeout(tick, 700);
    const t = window.setInterval(tick, 2200);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [revealed]);

  const launch = useCallback(
    (i: number) => {
      if (launching !== null) return;
      setLaunching(i);
      const el = portRefs.current[i];
      window.setTimeout(() => el && onLaunch(MODULES[i], el.getBoundingClientRect()), 180);
    },
    [launching, onLaunch],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocus((f) => {
          const n = (f + 1) % MODULES.length;
          portRefs.current[n]?.focus();
          return n;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocus((f) => {
          const n = (f - 1 + MODULES.length) % MODULES.length;
          portRefs.current[n]?.focus();
          return n;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSelect = (s: Selection) => {
    if (s?.type !== 'link') return;
    const link = state.net.links[s.id];
    apply(setLinkUp(state.net, s.id, !link.up), `Link ${s.id} ${link.up ? 'cut' : 'restored'} from the landing panel`, link.up ? 'fault' : 'fix');
    setSelection(s);
  };

  const current = MODULES[focus];

  return (
    <section aria-label="Laboratory landing" className="relative flex min-h-[100svh] w-full flex-col px-4 pb-5 pt-4 sm:px-8 sm:pt-6">
      <header className={`flex items-start justify-between gap-4 ${reveal()}`} style={delay(0)}>
        <div className="space-y-1">
          <p className="label text-muted">Somaiya Virtual Labs</p>
          <p className="label">K J Somaiya School of Engineering</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
          <Led tone={tone} pulse={tone !== 'ok'} />
          Lab network {health.status}
        </div>
      </header>

      <div className={`grid flex-1 items-center gap-8 py-8 transition-opacity duration-300 lg:grid-cols-12 lg:gap-10 ${launching !== null ? 'opacity-40' : ''}`}>
        <div className={`lg:col-span-5 ${reveal()}`} style={delay(120)}>
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-label text-signal">
            <span className="h-px w-8 bg-signal/60" />
            Experiment 10
          </p>
          <h1 className="mt-5 font-display text-[clamp(38px,4.3vw,74px)] font-semibold uppercase leading-[0.84] tracking-[-0.015em] text-paper">
            Network
            <br />
            Troubleshooting
            <br />
            <span className="font-light text-silver">&amp; Simulator</span>
          </h1>
          <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-muted">
            A working network, running live on this page. Cut a cable on the panel, watch the packets fail at the break, then diagnose it with ping, tracert and nslookup and prove the repair.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn-primary px-5 py-3" onClick={() => launch(MODULES.findIndex((m) => m.id === 'launch'))}>
              Launch lab <span aria-hidden>→</span>
            </button>
            <button type="button" className="btn px-5 py-3" onClick={() => launch(MODULES.findIndex((m) => m.id === 'diagnostics'))}>
              Work a scenario
            </button>
          </div>
        </div>

        <div className={`lg:col-span-7 ${reveal()}`} style={delay(240)}>
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-hair px-4 py-2.5">
              <p className="label flex items-center gap-2 text-muted">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-signal/60" />
                  <span className="relative h-2 w-2 rounded-full bg-signal" />
                </span>
                Live · Lab network
              </p>
              <p className="label hidden sm:block">Click a cable to cut it</p>
            </div>
            <div className="grid-paper bg-ink/40 p-2 sm:p-3">
              <TopologyView net={state.net} flight={state.flight} selection={selection} onSelect={onSelect} label="Live laboratory network — click a cable to cut or restore it" />
            </div>
            <div className="grid border-t border-hair sm:grid-cols-[1fr_auto]">
              <ol className="min-h-[92px] space-y-1 px-4 py-3 font-mono text-[11.5px]" aria-live="polite" aria-label="Live probe readings">
                {readings.length === 0 && <li className="text-dim">Waiting for first probe…</li>}
                {readings.map((r, i) => (
                  <li key={`${r.text}-${i}`} className={`flex items-center gap-2 ${i === 0 ? '' : 'opacity-50'}`}>
                    <Led tone={r.delivered ? 'ok' : 'err'} />
                    <span className="w-10 text-dim">{r.label}</span>
                    <span className={r.delivered ? 'text-[#cfd2cc]' : 'text-alarm'}>{r.text}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-col justify-center gap-2 border-t border-hair px-4 py-3 sm:border-l sm:border-t-0">
                {faults.length ? (
                  <>
                    <p className="font-mono text-[11px] text-alarm">{faults.length} fault{faults.length > 1 ? 's' : ''} on the network</p>
                    <div className="flex gap-2">
                      <button type="button" className="btn-primary py-1.5" onClick={() => launch(MODULES.findIndex((m) => m.id === 'launch'))}>
                        Diagnose it →
                      </button>
                      <button type="button" className="btn py-1.5" onClick={reset}>
                        Restore
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="font-mono text-[11px] text-muted">
                    Latency {health.latencyMs === null ? '—' : `${health.latencyMs < 1 ? '<1' : Math.round(health.latencyMs)} ms`} · loss {health.lossPct}% · DNS {health.dns.ok ? 'online' : 'failure'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav aria-label="Laboratory modules" className={reveal()} style={delay(350)}>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="label">
            Patch panel · 10 modules <span className="text-muted">· {pg.completed}/10 verified</span>
          </p>
          <p className="label hidden lg:block">
            {current.no} · {current.title} — {current.line}
          </p>
          {nextIdx >= 0 && (
            <button type="button" className="btn-ghost text-signal hover:text-paper" onClick={() => launch(nextIdx)}>
              {pg.completed === 0 && !pg.current ? 'Begin at 01' : `Continue · ${MODULES[nextIdx].no} ${MODULES[nextIdx].title}`} →
            </button>
          )}
        </div>
        <div className="panel p-2">
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 xl:grid-cols-10">
            {MODULES.map((m, i) => {
              const on = focus === i;
              const st = states[i];
              const lamps = Math.round(pg.progress[m.id].value * 5);
              return (
                <li key={m.id} className={reveal()} style={delay(450 + i * 70)}>
                  <button
                    type="button"
                    ref={(n) => void (portRefs.current[i] = n)}
                    onClick={() => launch(i)}
                    onMouseEnter={() => setFocus(i)}
                    onFocus={() => setFocus(i)}
                    aria-label={`${m.no} ${m.title}: ${m.line} ${STATE_LABEL[st]}. ${pg.progress[m.id].detail}.`}
                    className={`group relative flex h-full w-full flex-col rounded-[2px] border bg-ink/60 px-2.5 pb-2.5 pt-2 text-left transition-[border-color,background-color,transform,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-100 ${
                      launching === i ? 'border-signal bg-signal-soft' : on ? 'border-silver/45 bg-gunmetal' : st === 'complete' ? 'border-signal/30' : st === 'active' ? 'border-silver/35' : 'border-hair'
                    } ${st === 'upcoming' && !on ? 'opacity-70' : ''}`}
                  >
                    {st === 'active' && <span aria-hidden className="absolute inset-y-2 left-0 w-[2px] bg-signal" />}
                    <span className="flex items-center justify-between">
                      <span className={`font-mono text-[10px] ${st === 'complete' ? 'text-signal' : st === 'active' ? 'text-paper' : 'text-dim'}`}>{m.no}</span>
                      <Led tone={st === 'complete' ? 'ok' : on || launching === i || st === 'active' ? 'ok' : 'off'} pulse={st === 'active'} />
                    </span>
                    <span
                      className={`mt-1.5 flex h-9 items-center justify-center transition-colors ${on || st === 'active' ? 'text-silver' : 'text-dim'}`}
                      style={{ ['--glyph-accent' as string]: st === 'complete' || st === 'active' ? '#5fae8a' : '#8a8b86' }}
                    >
                      <Glyph id={m.glyph} className="h-full" />
                    </span>
                    <span className={`mt-1.5 font-display text-[12.5px] font-medium uppercase leading-tight tracking-wide ${on || st === 'active' ? 'text-paper' : 'text-muted'}`}>{m.title}</span>
                    <span className="mt-1.5 flex items-center justify-between gap-1">
                      <span className={`font-mono text-[9px] uppercase tracking-[0.12em] ${st === 'complete' ? 'text-signal' : st === 'active' || st === 'next' ? 'text-silver' : 'text-dim'}`}>
                        {STATE_LABEL[st]}
                      </span>
                      <span aria-hidden className="flex gap-[2px]">
                        {Array.from({ length: 5 }, (_, k) => (
                          <span key={k} className={`h-[4px] w-[6px] ${k < lamps ? (st === 'complete' ? 'bg-signal' : 'bg-silver/80') : 'bg-steel'}`} />
                        ))}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {/* the recommended path, 01 → 10, as a trace under the ports */}
          <div aria-hidden className="mt-2 hidden grid-cols-10 gap-1.5 xl:grid">
            {MODULES.map((m, i) => (
              <span key={m.id} className="relative flex h-2 items-center">
                <span className={`h-px flex-1 ${states[i] === 'complete' ? 'bg-signal/70' : 'bg-hair-strong'}`} />
                <span className={`h-1.5 w-1.5 rounded-full border ${states[i] === 'complete' ? 'border-signal bg-signal' : states[i] === 'active' ? 'border-paper bg-paper' : states[i] === 'next' ? 'border-silver/70' : 'border-hair-strong'}`} />
                <span className={`h-px flex-1 ${states[i] === 'complete' ? 'bg-signal/70' : 'bg-hair-strong'}`} />
              </span>
            ))}
          </div>
        </div>
      </nav>
    </section>
  );
}
