'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MODULES, type LabModule } from '@/data/modules';
import { setLinkUp } from '@/lib/sim/actions';
import { detectFaults } from '@/lib/sim/faults';
import { assessHealth } from '@/lib/sim/health';
import { useLab } from '@/lib/sim/store';
import type { Proto } from '@/lib/sim/types';
import { Led, type LedTone } from '@/components/chrome/Led';
import { TopologyView, type Selection } from '@/components/network/TopologyView';
import { Glyph } from './Glyph';

interface Props {
  initialIndex: number;
  onLaunch: (module: LabModule, rect: DOMRect) => void;
}

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
export function LandingHero({ initialIndex, onLaunch }: Props) {
  const lab = useLab();
  const { state, apply, reset } = lab;
  const [focus, setFocus] = useState(initialIndex);
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
  }, []);

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
    <section aria-label="Laboratory landing" className="wheel-enter relative flex min-h-[100svh] w-full flex-col px-4 pb-5 pt-4 sm:px-8 sm:pt-6">
      <header className="flex items-start justify-between gap-4">
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
        <div className="lg:col-span-5">
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

        <div className="lg:col-span-7">
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

      <nav aria-label="Laboratory modules">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <p className="label">Patch panel · 10 modules</p>
          <p className="label hidden sm:block">
            {current.no} · {current.title} — {current.line}
          </p>
        </div>
        <div className="panel p-2">
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 xl:grid-cols-10">
            {MODULES.map((m, i) => {
              const on = focus === i;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    ref={(n) => void (portRefs.current[i] = n)}
                    onClick={() => launch(i)}
                    onMouseEnter={() => setFocus(i)}
                    onFocus={() => setFocus(i)}
                    aria-label={`${m.no} ${m.title}: ${m.line}`}
                    className={`group relative flex h-full w-full flex-col rounded-[2px] border bg-ink/60 px-2.5 pb-2.5 pt-2 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 ${
                      launching === i ? 'border-signal bg-signal-soft' : on ? 'border-silver/45 bg-gunmetal' : 'border-hair'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-dim">{m.no}</span>
                      <Led tone={on || launching === i ? 'ok' : 'off'} />
                    </span>
                    <span className={`mt-1.5 flex h-9 items-center justify-center transition-colors ${on ? 'text-silver' : 'text-dim'}`}>
                      <Glyph id={m.glyph} className="h-full" />
                    </span>
                    <span className={`mt-1.5 font-display text-[12.5px] font-medium uppercase leading-tight tracking-wide ${on ? 'text-paper' : 'text-muted'}`}>{m.title}</span>
                    <span aria-hidden className="absolute bottom-1 right-1.5 flex gap-[3px]">
                      <span className="h-1 w-1 rounded-full bg-hair-strong" />
                      <span className="h-1 w-1 rounded-full bg-hair-strong" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </section>
  );
}
