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
import { TextEffect } from '@/components/fx/TextEffect';
import { BorderBeam } from '@/components/fx/BorderBeam';
import { NumberTicker } from '@/components/fx/NumberTicker';
import { AnimatePresence } from 'framer-motion';
import { StartPrompt, Walkthrough, WALKTHROUGH_KEY } from './Walkthrough';

interface Props {
  /** False while the lamp intro is still on screen; the landing powers up when it turns true. */
  revealed: boolean;
  onLaunch: (module: LabModule, rect: DOMRect, target?: string) => void;
}

const STATE_LABEL: Record<ModuleState, string> = {
  complete: '✓ Verified',
  active: 'Active',
  next: 'Next',
  available: 'Anytime',
  upcoming: 'Upcoming',
};

const SIM = MODULES.findIndex((m) => m.id === 'simulator');

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
  const [prompt, setPrompt] = useState(false);
  const [touring, setTouring] = useState(false);

  // “Let’s start” appears once the landing is up, unless it was already dismissed or completed.
  useEffect(() => {
    if (!revealed) return;
    let seen = false;
    try {
      seen = !!localStorage.getItem(WALKTHROUGH_KEY);
    } catch {
      /* storage unavailable: offer it */
    }
    if (seen) return;
    const t = window.setTimeout(() => setPrompt(true), 1100);
    return () => window.clearTimeout(t);
  }, [revealed]);

  const remember = (value: string) => {
    try {
      localStorage.setItem(WALKTHROUGH_KEY, value);
    } catch {
      /* ignore */
    }
  };
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
    (i: number, target?: string, from?: HTMLElement | null) => {
      if (launching !== null) return;
      setLaunching(i);
      const el = from ?? portRefs.current[i];
      window.setTimeout(() => el && onLaunch(MODULES[i], el.getBoundingClientRect(), target), 180);
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
          <button type="button" className="ml-3 border-l border-hair pl-3 text-muted transition-colors hover:text-paper" onClick={() => {
              setPrompt(false);
              setTouring(true);
            }}
          >
            Walkthrough
          </button>
        </div>
      </header>

      <div className={`grid flex-1 items-center gap-8 py-8 transition-opacity duration-300 lg:grid-cols-12 lg:gap-10 ${launching !== null ? 'opacity-40' : ''}`}>
        <div className={`lg:col-span-5 ${reveal()}`} style={delay(120)}>
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-label text-signal">
            <span className="h-px w-8 bg-signal/60" />
            Experiment 8
          </p>
          <h1 className="mt-5 font-display text-[clamp(38px,4.3vw,74px)] font-semibold uppercase leading-[0.84] tracking-[-0.015em] text-paper">
            <TextEffect lines={['Network', 'Troubleshooting', '& Simulator']} lineClass={['', '', 'font-light text-silver']} play={revealed} delay={0.2} />
          </h1>
          <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-muted">
            A working network, running live on this page. Cut a cable on the panel, watch the packets fail at the break, then diagnose it with ping, tracert and nslookup and prove the repair.
          </p>
          <div data-tour="actions" className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn-primary relative px-5 py-3" onClick={(e) => launch(SIM, undefined, e.currentTarget)}>
              <BorderBeam size={46} duration={5} />
              Launch lab <span aria-hidden>→</span>
            </button>
            <button type="button" className="btn px-5 py-3" onClick={(e) => launch(SIM, 'diagnostics', e.currentTarget)}>
              Work a scenario
            </button>
          </div>
        </div>

        <div className={`lg:col-span-7 ${reveal()}`} style={delay(240)}>
          <div data-tour="network" className="panel overflow-hidden">
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
              <ol data-tour="readings" className="min-h-[92px] space-y-1 px-4 py-3 font-mono text-[11.5px]" aria-live="polite" aria-label="Live probe readings">
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
                      <button type="button" className="btn-primary py-1.5" onClick={(e) => launch(SIM, undefined, e.currentTarget)}>
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
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="label">
            Lab progress <span className="text-muted">· <NumberTicker value={pg.completed} /> of {MODULES.length} verified</span>
          </p>
          {nextIdx >= 0 && (
            <button type="button" data-tour="continue" className="btn-ghost text-signal hover:text-paper" onClick={() => launch(nextIdx)}>
              {pg.completed === 0 && !pg.current ? 'Begin with 01 Theory' : `Continue · ${MODULES[nextIdx].no} ${MODULES[nextIdx].title}`} <span aria-hidden>→</span>
            </button>
          )}
        </div>

        <div data-tour="progress" className="panel overflow-hidden">
          {/* recommended path: a trace with one node per bay */}
          <div aria-hidden className="relative hidden h-5 border-b border-hair md:block">
            <div className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 grid-cols-5">
              {MODULES.map((m, i) => {
                const lit = states[i] === 'complete';
                return (
                  <span key={m.id} className="relative flex items-center">
                    <span className={`h-px flex-1 ${i === 0 ? 'bg-transparent' : lit || states[i - 1] === 'complete' ? 'bg-signal/60' : 'bg-hair-strong'}`} />
                    <span
                      className={`h-2 w-2 rounded-full border transition-colors ${
                        lit ? 'border-signal bg-signal shadow-[0_0_6px_rgba(95,174,138,0.7)]' : states[i] === 'active' ? 'border-paper bg-paper' : states[i] === 'next' ? 'border-silver/70 bg-ink' : 'border-hair-strong bg-ink'
                      }`}
                    />
                    <span className={`h-px flex-1 ${i === MODULES.length - 1 ? 'bg-transparent' : lit ? 'bg-signal/60' : 'bg-hair-strong'}`} />
                  </span>
                );
              })}
            </div>
          </div>

          <ul className="grid divide-y divide-hair md:grid-cols-5 md:divide-x md:divide-y-0">
            {MODULES.map((m, i) => {
              const on = focus === i;
              const st = states[i];
              const lamps = Math.round(pg.progress[m.id].value * 5);
              const lit = st === 'complete' || st === 'active';
              return (
                <li key={m.id} className={reveal()} style={delay(450 + i * 90)}>
                  <button
                    type="button"
                    ref={(n) => void (portRefs.current[i] = n)}
                    onClick={() => launch(i)}
                    onMouseEnter={() => setFocus(i)}
                    onFocus={() => setFocus(i)}
                    onMouseMove={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                      e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
                    }}
                    aria-label={`${m.no} ${m.title}: ${m.line} ${STATE_LABEL[st]}. ${pg.progress[m.id].detail}.`}
                    className={`group relative grid h-full w-full grid-cols-[auto_1fr_auto] items-center gap-x-4 px-4 py-3.5 text-left transition-colors duration-200 md:grid-cols-1 md:gap-y-3 md:px-5 md:py-5 ${
                      launching === i ? 'bg-signal-soft' : on ? 'bg-gunmetal/80' : 'hover:bg-gunmetal/60'
                    }`}
                  >
                    {/* cursor spotlight, after Aceternity's card spotlight (MIT) */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: 'radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(232,228,218,0.07), transparent 60%)' }}
                    />
                    {st === 'active' && <span aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-signal md:inset-x-0 md:bottom-auto md:top-0 md:h-[2px] md:w-auto" />}
                    {st === 'active' && <BorderBeam size={70} duration={7} />}
                    <span className="flex items-center gap-3 md:justify-between">
                      <span className={`font-display text-[28px] font-light leading-none md:text-[34px] ${st === 'complete' ? 'text-signal' : lit || on ? 'text-paper' : 'text-silver/70'}`}>{m.no}</span>
                      <span
                        className={`h-9 w-14 transition-colors md:h-10 md:w-16 ${lit || on ? 'text-silver' : 'text-dim'}`}
                        style={{ ['--glyph-accent' as string]: lit || on ? '#5fae8a' : '#6f6f6a' }}
                      >
                        <Glyph id={m.glyph} className="h-full w-full" />
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className={`block font-display text-[17px] font-medium uppercase leading-tight tracking-wide ${lit || on ? 'text-paper' : 'text-muted'}`}>{m.title}</span>
                      <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-dim">{m.role}</span>
                      <span className="mt-2 hidden text-[12.5px] leading-snug text-muted md:block">{m.line}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1.5 md:flex-row md:items-center md:justify-between">
                      <span className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${st === 'complete' ? 'text-signal' : st === 'active' || st === 'next' ? 'text-paper' : 'text-dim'}`}>
                        {st === 'active' && <Led tone="ok" pulse />}
                        {STATE_LABEL[st]}
                      </span>
                      <span aria-hidden className="flex gap-[3px]">
                        {Array.from({ length: 5 }, (_, k) => (
                          <span key={k} className={`h-[4px] w-[8px] ${k < lamps ? (st === 'complete' ? 'bg-signal' : 'bg-silver/80') : 'bg-steel'}`} />
                        ))}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <AnimatePresence>
        {prompt && !touring && (
          <StartPrompt
            onStart={() => {
              setPrompt(false);
              setTouring(true);
            }}
            onClose={() => {
              setPrompt(false);
              remember('dismissed');
            }}
          />
        )}
      </AnimatePresence>
      {touring && (
        <Walkthrough
          onFinish={() => {
            setTouring(false);
            remember('done');
          }}
          onBegin={() => {
            setTouring(false);
            remember('done');
            launch(0);
          }}
        />
      )}
    </section>
  );
}
