'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Led } from '@/components/chrome/Led';
import { OutputLines } from '@/components/network/Terminal';
import { TopologyView } from '@/components/network/TopologyView';
import { runCommand, type Flight } from '@/lib/sim/commands';
import { createRng } from '@/lib/sim/engine';
import { detectFaults, faultDef } from '@/lib/sim/faults';
import { verificationSuite } from '@/lib/sim/health';
import { PROBES } from '@/lib/sim/interpret';
import { CAUSES, REPAIRS, SCENARIOS, type CauseId, type RepairId } from '@/lib/sim/scenarios';
import { createBaseline } from '@/lib/sim/topology';
import type { NetState, OutLine } from '@/lib/sim/types';

interface RoundDef {
  id: string;
  title: string;
  ticket: string;
  build: () => NetState;
  cause: CauseId;
  fix: RepairId;
  distractors: CauseId[];
  repairs: RepairId[];
  hint: string;
}

const fromScenario = (id: string): RoundDef => {
  const s = SCENARIOS.find((x) => x.id === id)!;
  return {
    id,
    title: s.title,
    ticket: s.ticket,
    build: () => faultDef(s.fault).inject(createBaseline(), s.link),
    cause: s.cause,
    fix: s.fix,
    distractors: s.causeOptions.filter((c) => c !== s.cause),
    repairs: s.repairs,
    hint: s.hint,
  };
};

/** Faults named in the brief for the game: wrong IP, wrong gateway, broken cable, failed router, DNS, DHCP, firewall. */
const POOL: RoundDef[] = [
  {
    id: 'wrong-ip',
    title: 'Wrong IP address',
    ticket: 'A student re-typed PC1’s address from a sticky note. Nothing works, not even the printer on PC2.',
    build: () => faultDef('wrong-ip').inject(createBaseline()),
    cause: 'ip-config',
    fix: 'dhcp-mode',
    distractors: ['gateway-config', 'access-cable', 'dhcp-service', 'router-down', 'duplicate-ip'],
    repairs: ['dhcp-mode', 'set-gateway', 'reconnect-access', 'power-r1', 'flush-dns'],
    hint: 'Compare PC1’s address and mask with the 192.168.1.0/24 plan.',
  },
  fromScenario('gateway-unreachable'),
  fromScenario('broken-link'),
  fromScenario('router-failure'),
  fromScenario('dns-failure'),
  fromScenario('dhcp-failure'),
  fromScenario('firewall-block'),
];

type Level = 'cadet' | 'technician' | 'engineer';
const LEVELS: Record<Level, { label: string; seconds: number; options: number; probeCost: number; hints: boolean; concealed: boolean; mult: number; note: string }> = {
  cadet: { label: 'Cadet', seconds: 120, options: 4, probeCost: 2, hints: true, concealed: false, mult: 1, note: '120 s · hints · link lamps visible' },
  technician: { label: 'Technician', seconds: 75, options: 5, probeCost: 4, hints: false, concealed: false, mult: 1.5, note: '75 s · no hints · 5 suspects' },
  engineer: { label: 'Engineer', seconds: 50, options: 6, probeCost: 5, hints: false, concealed: true, mult: 2, note: '50 s · remote site: no lamps' },
};
const ROUNDS = 5;
const ATTEMPTS = 3;

type Phase = 'observe' | 'diagnose' | 'repair' | 'verify' | 'won' | 'lost';

interface RoundResult {
  title: string;
  won: boolean;
  points: number;
  seconds: number;
  answer: string;
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function FaultRepairGame() {
  const [level, setLevel] = useState<Level>('technician');
  const [queue, setQueue] = useState<RoundDef[] | null>(null);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [best, setBest] = useState<Partial<Record<Level, number>>>({});

  useEffect(() => {
    try {
      setBest(JSON.parse(localStorage.getItem('svl-exp10-game-best') ?? '{}'));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const start = () => {
    setQueue(shuffle(POOL).slice(0, ROUNDS));
    setRound(0);
    setResults([]);
  };

  const finishRound = (r: RoundResult) => {
    const next = [...results, r];
    setResults(next);
    if (next.length === ROUNDS) {
      const total = next.reduce((a, b) => a + b.points, 0);
      if (!best[level] || total > best[level]!) {
        const nb = { ...best, [level]: total };
        setBest(nb);
        try {
          localStorage.setItem('svl-exp10-game-best', JSON.stringify(nb));
        } catch {
          /* ignore */
        }
      }
    }
  };

  if (!queue) return <Menu level={level} setLevel={setLevel} best={best} onStart={start} />;
  if (results.length === ROUNDS) return <Summary results={results} level={level} best={best[level]} onAgain={start} onMenu={() => setQueue(null)} />;

  return (
    <Round
      key={`${round}-${queue[round].id}`}
      def={queue[round]}
      index={round}
      level={level}
      score={results.reduce((a, b) => a + b.points, 0)}
      onDone={finishRound}
      onNext={() => setRound((r) => r + 1)}
      onQuit={() => setQueue(null)}
      last={round === ROUNDS - 1}
    />
  );
}

function Menu({ level, setLevel, best, onStart }: { level: Level; setLevel: (l: Level) => void; best: Partial<Record<Level, number>>; onStart: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="panel p-6 sm:p-8">
        <p className="label">Briefing</p>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-paper">
          Five trouble calls. Each one breaks the lab network in a different way. Run probes to observe, name the root cause, apply one repair, and the network is re-tested automatically.
        </p>
        <ul className="mt-5 grid gap-px border border-hair bg-hair sm:grid-cols-4">
          {['Observe', 'Diagnose', 'Repair', 'Verify'].map((s, i) => (
            <li key={s} className="bg-graphite px-3 py-3">
              <span className="font-mono text-[10px] text-signal">{String(i + 1).padStart(2, '0')}</span>
              <p className="font-display text-[15px] uppercase tracking-wide text-paper">{s}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[13px] leading-relaxed text-muted">
          Every probe costs clock time. A wrong diagnosis or a repair that fails verification costs one of three attempts. Points: 400 per repaired network plus 8 per second left, minus 15 per probe, times the level multiplier.
        </p>
      </div>
      <div className="panel flex flex-col p-6">
        <p className="label mb-3">Difficulty</p>
        <div role="radiogroup" aria-label="Difficulty" className="space-y-2">
          {(Object.keys(LEVELS) as Level[]).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={level === l}
              onClick={() => setLevel(l)}
              className={`flex w-full items-center justify-between gap-3 rounded-[2px] border px-4 py-3 text-left transition-colors ${level === l ? 'border-silver/50 bg-steel/60' : 'border-hair hover:border-hair-strong'}`}
            >
              <span>
                <span className="block font-display text-lg uppercase tracking-wide text-paper">
                  {LEVELS[l].label} <span className="font-mono text-[11px] text-dim">×{LEVELS[l].mult}</span>
                </span>
                <span className="font-mono text-[11px] text-muted">{LEVELS[l].note}</span>
              </span>
              <span className="text-right font-mono text-[10.5px] text-dim">
                best
                <span className="block text-[13px] text-paper">{best[l] ?? '—'}</span>
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary mt-5 w-full py-3" onClick={onStart}>
          Start shift
        </button>
      </div>
    </div>
  );
}

function Round({
  def,
  index,
  level,
  score,
  onDone,
  onNext,
  onQuit,
  last,
}: {
  def: RoundDef;
  index: number;
  level: Level;
  score: number;
  onDone: (r: RoundResult) => void;
  onNext: () => void;
  onQuit: () => void;
  last: boolean;
}) {
  const cfg = LEVELS[level];
  const [net, setNet] = useState<NetState>(() => def.build());
  const [phase, setPhase] = useState<Phase>('observe');
  const [time, setTime] = useState(cfg.seconds);
  const [attempts, setAttempts] = useState(ATTEMPTS);
  const [probes, setProbes] = useState<string[]>([]);
  const [output, setOutput] = useState<OutLine[]>([]);
  const [flight, setFlight] = useState<(Flight & { id: number }) | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: 'ok' | 'err' } | null>(null);
  const [verifyLines, setVerifyLines] = useState<{ label: string; pass: boolean }[]>([]);
  const [points, setPoints] = useState(0);
  const flightId = useRef(0);
  const settled = useRef(false);

  const [causes] = useState(() => shuffle([def.cause, ...shuffle(def.distractors).slice(0, cfg.options - 1)]));
  const [repairs] = useState(() => shuffle(def.repairs));
  const running = phase === 'observe' || phase === 'diagnose' || phase === 'repair';

  const settle = useCallback(
    (won: boolean, remaining: number, probeCount: number) => {
      if (settled.current) return;
      settled.current = true;
      const pts = won ? Math.max(0, Math.round((400 + remaining * 8 - probeCount * 15) * cfg.mult)) : 0;
      setPoints(pts);
      setPhase(won ? 'won' : 'lost');
      onDone({ title: def.title, won, points: pts, seconds: cfg.seconds - remaining, answer: CAUSES[def.cause].label });
    },
    [cfg, def, onDone],
  );

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setTime((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (running && time <= 0) {
      setMessage({ text: 'Time expired. The outage was escalated.', tone: 'err' });
      settle(false, 0, probes.length);
    }
  }, [time, running, settle, probes.length]);

  const probe = (id: string) => {
    if (!running) return;
    const p = PROBES.find((x) => x.id === id)!;
    const res = runCommand({ state: net, host: 'PC1', rng: createRng(Date.now()) }, p.command);
    setOutput([{ text: `PC1> ${p.command}`, tone: 'cmd' }, ...res.lines]);
    if (res.flight) setFlight({ ...res.flight, id: ++flightId.current });
    setProbes((ps) => [...ps, id]);
    setTime((s) => Math.max(0, s - cfg.probeCost));
    if (phase === 'observe') setPhase('diagnose');
  };

  const loseAttempt = (text: string) => {
    const left = attempts - 1;
    setAttempts(left);
    setMessage({ text, tone: 'err' });
    if (left <= 0) settle(false, time, probes.length);
  };

  const diagnose = (c: CauseId) => {
    if (phase !== 'diagnose' && phase !== 'observe') return;
    if (probes.length === 0) {
      setMessage({ text: 'Observe first: run at least one probe before diagnosing.', tone: 'err' });
      return;
    }
    if (c === def.cause) {
      setMessage({ text: 'Diagnosis confirmed. Choose a repair.', tone: 'ok' });
      setPhase('repair');
    } else loseAttempt(`Not supported by the evidence: “${CAUSES[c].label}”.`);
  };

  const repair = (r: RepairId) => {
    if (phase !== 'repair') return;
    const next = REPAIRS[r].apply(net);
    setNet(next);
    setPhase('verify');
    setMessage(null);
    const steps = verificationSuite(next);
    const residual = detectFaults(next).length === 0;
    const all = [...steps.map((s) => ({ label: `${s.command}`, pass: s.pass })), { label: 'reference check', pass: residual }];
    setVerifyLines([]);
    all.forEach((s, i) => window.setTimeout(() => setVerifyLines((v) => [...v, s]), 180 * (i + 1)));
    window.setTimeout(() => {
      const ok = all.every((s) => s.pass);
      if (ok) {
        setFlight({ proto: 'tcp', forward: ['PC1', 'SW1', 'R1', 'FW1', 'SRV1'], back: ['SRV1', 'FW1', 'R1', 'SW1', 'PC1'], delivered: true, label: 'HTTP → www.lab.local', id: ++flightId.current });
        setMessage({ text: 'Verification passed. Network recovered.', tone: 'ok' });
        settle(true, time, probes.length);
      } else {
        setPhase('repair');
        loseAttempt(`Verification failed after “${REPAIRS[r].label}”.`);
      }
    }, 180 * (all.length + 1));
  };

  const stageIndex = { observe: 0, diagnose: 1, repair: 2, verify: 3, won: 4, lost: 4 }[phase];
  const urgent = time <= 15 && running;

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Stat label="Call" value={`${index + 1}/${ROUNDS}`} />
        <Stat label="Time" value={`${String(Math.floor(time / 60)).padStart(1, '0')}:${String(time % 60).padStart(2, '0')}`} tone={urgent ? 'err' : undefined} />
        <div>
          <p className="label">Attempts</p>
          <p className="mt-1 flex gap-1.5">
            {Array.from({ length: ATTEMPTS }, (_, i) => (
              <Led key={i} tone={i < attempts ? 'ok' : 'off'} />
            ))}
          </p>
        </div>
        <Stat label="Score" value={String(score + (phase === 'won' ? points : 0))} />
        <Stat label="Level" value={cfg.label} />
        <ol className="ml-auto flex gap-px border border-hair" aria-label="Round stage">
          {['Observe', 'Diagnose', 'Repair', 'Verify'].map((s, i) => (
            <li key={s} aria-current={stageIndex === i ? 'step' : undefined} className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${stageIndex > i ? 'bg-signal-soft text-signal' : stageIndex === i ? 'bg-steel text-paper' : 'text-dim'}`}>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="panel p-4 lg:col-span-7">
          <p className="label">Trouble call</p>
          <p className="mt-2 text-[15px] leading-relaxed text-paper">“{def.ticket}”</p>
          {cfg.hints && <p className="mt-2 font-mono text-[11px] text-dim">Hint: {def.hint}</p>}
          <div className="mt-4 rounded-[2px] border border-hair bg-ink/40">
            <TopologyView net={net} flight={flight} concealed={cfg.concealed} label="Game network" />
          </div>
        </div>

        <div className="panel flex flex-col p-4 lg:col-span-5">
          <p className="label mb-2">Probes · −{cfg.probeCost} s each</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PROBES.map((p) => (
              <button key={p.id} type="button" disabled={!running} onClick={() => probe(p.id)} className="btn justify-start truncate px-2 py-1.5 normal-case tracking-normal">
                <span className="truncate font-mono text-[10.5px]">{p.command}</span>
              </button>
            ))}
          </div>
          <div data-lenis-prevent className="scanlines thin-scroll mt-3 h-[190px] flex-1 overflow-y-auto rounded-[2px] border border-hair bg-[#07090a] px-3 py-2 font-mono text-[11px] leading-[1.45]">
            {output.length ? <OutputLines lines={output} /> : <p className="text-dim">Output of your last probe.</p>}
          </div>
        </div>

        <div className="panel p-4 lg:col-span-6">
          <p className="label mb-2">Diagnose · root cause</p>
          <div className="space-y-1.5">
            {causes.map((c) => (
              <button
                key={c}
                type="button"
                disabled={!(phase === 'observe' || phase === 'diagnose')}
                onClick={() => diagnose(c)}
                className={`flex w-full items-center gap-2 rounded-[2px] border px-3 py-2 text-left text-[13px] transition-colors ${
                  phase !== 'observe' && phase !== 'diagnose' && c === def.cause ? 'border-signal/50 bg-signal-soft text-paper' : 'border-hair text-muted enabled:hover:border-hair-strong enabled:hover:text-paper'
                } disabled:cursor-default`}
              >
                <span className="w-10 font-mono text-[10px] text-dim">{CAUSES[c].layer}</span>
                {CAUSES[c].label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel p-4 lg:col-span-6">
          <p className="label mb-2">Repair → automatic verification</p>
          <div className="space-y-1.5">
            {repairs.map((r) => (
              <button
                key={r}
                type="button"
                disabled={phase !== 'repair'}
                onClick={() => repair(r)}
                className="flex w-full flex-col items-start rounded-[2px] border border-hair px-3 py-2 text-left transition-colors enabled:hover:border-hair-strong disabled:opacity-50"
              >
                <span className="text-[13px] text-paper">{REPAIRS[r].label}</span>
                <span className="font-mono text-[10px] text-dim">{REPAIRS[r].command}</span>
              </button>
            ))}
          </div>
          {verifyLines.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-1 font-mono text-[10.5px]">
              {verifyLines.map((v) => (
                <li key={v.label} className={`flex items-center gap-1.5 ${v.pass ? 'text-signal' : 'text-alarm'}`}>
                  <Led tone={v.pass ? 'ok' : 'err'} /> {v.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div
        role="status"
        className={`flex min-h-[56px] flex-wrap items-center justify-between gap-3 rounded-[3px] border px-4 py-3 ${
          phase === 'won' ? 'border-signal/50 bg-signal-soft' : phase === 'lost' ? 'border-alarm/50 bg-alarm-soft' : 'border-hair bg-graphite/60'
        }`}
      >
        <p className={`text-[14px] ${message?.tone === 'ok' ? 'text-signal' : message?.tone === 'err' ? 'text-alarm' : 'text-muted'}`}>
          {phase === 'won' && <span className="mr-2 font-display text-lg uppercase tracking-wide">Recovered +{points}</span>}
          {phase === 'lost' && <span className="mr-2 font-display text-lg uppercase tracking-wide">Call failed</span>}
          {phase === 'lost' ? `Root cause was: ${CAUSES[def.cause].label}. Fix: ${REPAIRS[def.fix].label}.` : message?.text ?? 'Start by observing: pick a probe.'}
        </p>
        <div className="flex gap-2">
          {(phase === 'won' || phase === 'lost') && (
            <button type="button" className="btn-primary" onClick={onNext}>
              {last ? 'Shift report' : 'Next call'} →
            </button>
          )}
          {running && (
            <button type="button" className="btn-ghost" onClick={onQuit}>
              Abandon shift
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'err' }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className={`mt-0.5 font-mono text-[16px] tabular-nums ${tone === 'err' ? 'text-alarm' : 'text-paper'}`}>{value}</p>
    </div>
  );
}

function Summary({ results, level, best, onAgain, onMenu }: { results: RoundResult[]; level: Level; best?: number; onAgain: () => void; onMenu: () => void }) {
  const total = results.reduce((a, b) => a + b.points, 0);
  const won = results.filter((r) => r.won).length;
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="panel p-6">
        <p className="label">Shift report · {LEVELS[level].label}</p>
        <p className="mt-3 font-display text-7xl font-light text-paper">{total}</p>
        <p className="mt-1 font-mono text-[12px] text-muted">
          {won}/{results.length} networks recovered · best {best ?? total}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" className="btn-primary" onClick={onAgain}>
            New shift
          </button>
          <button type="button" className="btn" onClick={onMenu}>
            Change difficulty
          </button>
        </div>
      </div>
      <div className="panel p-6">
        <ol className="divide-y divide-hair">
          {results.map((r, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3 py-3">
              <Led tone={r.won ? 'ok' : 'err'} />
              <span className="font-mono text-[11px] text-dim">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-[14px] text-paper">{r.title}</span>
              <span className="font-mono text-[11px] text-muted">{r.won ? `${r.seconds}s` : r.answer}</span>
              <span className="w-14 text-right font-mono text-[13px] text-paper">{r.points}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
