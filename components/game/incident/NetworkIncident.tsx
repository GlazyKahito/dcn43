'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Led, type LedTone } from '@/components/chrome/Led';
import { NumberTicker } from '@/components/fx/NumberTicker';
import { applyRepair, faultCount, renew as renewLease, verificationFrom, type Repair, type World } from '@/lib/game/actions';
import { CAUSE_LABEL, createCase, DIFFICULTY, scoreCase, type CaseFile, type CauseId, type Difficulty, type VerifyKey } from '@/lib/game/incidents';
import type { Station, StationId } from '@/lib/game/world';
import { cloneNet, createBaseline } from '@/lib/sim/topology';
import { assessHealth } from '@/lib/sim/health';
import type { DeviceId, OutLine } from '@/lib/sim/types';
import { IncidentCanvas, type MoveInput } from './IncidentCanvas';
import { PANEL_TITLE, StationPanel, runIn, type Evidence, type PanelApi } from './StationPanel';

type Phase = 'briefing' | 'play' | 'paused' | 'restored' | 'result' | 'failed';

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

interface Props {
  difficulty: Difficulty;
  onExit: (result: { resolved: boolean; score: number }) => void;
}

/** NETWORK INCIDENT: walk the lab, investigate, diagnose, repair and verify a hidden fault. */
export function NetworkIncident({ difficulty, onExit }: Props) {
  const cfg = DIFFICULTY[difficulty];
  const [caseNo, setCaseNo] = useState(7);
  const [file, setFile] = useState<CaseFile>(() => createCase(difficulty));
  const [world, setWorld] = useState<World>(() => ({ net: file.net, meta: file.meta }));
  const [phase, setPhase] = useState<Phase>('briefing');
  const [time, setTime] = useState(cfg.seconds);
  const [near, setNear] = useState<Station | null>(null);
  const [open, setOpen] = useState<StationId | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [actions, setActions] = useState(0);
  const [diagnosis, setDiagnosis] = useState<{ correct: boolean; wrong: CauseId[]; wrongCount: number }>({ correct: false, wrong: [], wrongCount: 0 });
  const [wrongRepairs, setWrongRepairs] = useState(0);
  const [verified, setVerified] = useState<VerifyKey[]>([]);
  const [termLines, setTermLines] = useState<OutLine[]>([]);
  const [httpAttempts, setHttpAttempts] = useState(0);
  const [toast, setToast] = useState<{ text: string; tone: LedTone } | null>(null);
  const [interact, setInteract] = useState(0);
  const touch = useRef<MoveInput>({ x: 0, y: 0 });
  const seed = useRef(1);
  const evId = useRef(0);

  const required = useMemo(() => Array.from(new Set(file.incidents.flatMap((i) => i.verify))), [file]);
  const repaired = faultCount(world) === 0;
  const health = useMemo(() => assessHealth(world.net), [world.net]);

  const flash = useCallback((text: string, tone: LedTone) => {
    setToast({ text, tone });
    window.setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 2600);
  }, []);

  const log = useCallback((source: string, text: string, tone: Evidence['tone']) => {
    setEvidence((e) => (e.some((x) => x.source === source && x.text === text) ? e : [{ id: ++evId.current, source, text, tone }, ...e].slice(0, 40)));
  }, []);

  // Clock
  useEffect(() => {
    if (phase !== 'play') return;
    const t = window.setInterval(() => setTime((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (phase === 'play' && time <= 0) {
      setOpen(null);
      setPhase('failed');
    }
  }, [time, phase]);

  // A later mistake can break a repaired network again; verification must then be redone.
  useEffect(() => {
    if (!repaired) setVerified([]);
  }, [repaired]);

  // Case closes only with the right diagnosis, a repaired network and every verification check.
  useEffect(() => {
    if (phase !== 'play') return;
    if (diagnosis.correct && repaired && required.every((k) => verified.includes(k))) {
      setOpen(null);
      setPhase('restored');
      window.setTimeout(() => setPhase('result'), 2200);
    }
  }, [diagnosis.correct, repaired, required, verified, phase]);

  const run = useCallback(
    (cmd: string, host: DeviceId = 'PC1') => {
      const res = runIn(world, cmd, host, ++seed.current * 7919);
      if (res.next) setWorld((w) => ({ ...w, net: res.next! }));
      setActions((a) => a + 1);
      const c = cmd.trim().toLowerCase();
      if (c.startsWith('curl') || c.startsWith('netstat')) setHttpAttempts((n) => n + 1);
      const first = res.lines.find((l) => l.tone === 'err' || l.tone === 'ok' || l.tone === 'warn');
      if (first) log(host === 'PC1' ? 'PC-01' : 'PC-02', `${cmd.trim()} → ${first.text.trim()}`, first.tone === 'ok' ? 'ok' : first.tone === 'warn' ? 'warn' : 'err');
      const net = res.next ?? world.net;
      if (host === 'PC1' && faultCount({ net, meta: world.meta }) === 0) {
        const keys = verificationFrom(net, cmd);
        if (keys.length) setVerified((v) => Array.from(new Set([...v, ...keys])));
      }
      return res.lines;
    },
    [world, log],
  );

  const observe = useCallback(
    (source: string, text: string, tone: Evidence['tone']) => {
      setActions((a) => a + 1);
      log(source, text, tone);
    },
    [log],
  );

  const repair = useCallback(
    (r: Repair, label: string) => {
      const before = faultCount(world);
      const next = applyRepair(world, r);
      const after = faultCount(next);
      setWorld(next);
      if (after < before) {
        log('Repair', label, 'ok');
        flash(after === 0 ? 'Change applied. Verify connectivity.' : 'Change applied.', 'ok');
      } else {
        setWrongRepairs((n) => n + 1);
        log('Repair', `${label} — no improvement`, 'err');
        flash(after > before ? 'That change made things worse.' : 'No change in network state.', 'err');
      }
    },
    [world, log, flash],
  );

  const renew = useCallback(
    (pc: DeviceId) => {
      const out = renewLease(world, pc);
      setWorld(out.world);
      setActions((a) => a + 1);
      log(pc === 'PC1' ? 'PC-01' : 'PC-02', `ipconfig /renew → ${out.message}`, out.ok ? 'ok' : 'err');
      return out.message;
    },
    [world, log],
  );

  const fileDiagnosis = useCallback(
    (picked: CauseId[]) => {
      const truth = file.incidents.map((i) => i.id).sort().join();
      if ([...picked].sort().join() === truth) {
        setDiagnosis((d) => ({ ...d, correct: true }));
        log('Console', `Diagnosis filed: ${picked.map((p) => CAUSE_LABEL[p]).join(' + ')}`, 'ok');
        flash('Diagnosis accepted.', 'ok');
      } else {
        setDiagnosis((d) => ({ ...d, wrong: Array.from(new Set([...d.wrong, ...picked.filter((p) => !file.incidents.some((i) => i.id === p))])), wrongCount: d.wrongCount + 1 }));
        log('Console', 'Diagnosis rejected', 'err');
        flash('Diagnosis rejected.', 'err');
      }
    },
    [file, log, flash],
  );

  const newCase = (same: boolean) => {
    const fresh = same ? restartCase(file) : createCase(difficulty, Math.random, file.incidents[0].id);
    setFile(fresh);
    setWorld({ net: fresh.net, meta: fresh.meta });
    setCaseNo((n) => (same ? n : n + 1));
    setTime(cfg.seconds);
    setEvidence([]);
    setActions(0);
    setDiagnosis({ correct: false, wrong: [], wrongCount: 0 });
    setWrongRepairs(0);
    setVerified([]);
    setTermLines([]);
    setHttpAttempts(0);
    setOpen(null);
    setPhase('briefing');
  };

  // Esc: close a panel, else pause/resume.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      if (open) setOpen(null);
      else if (phase === 'play') setPhase('paused');
      else if (phase === 'paused') setPhase('play');
      else if (phase === 'briefing') onExit({ resolved: false, score: 0 });
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, phase, onExit]);

  useEffect(() => {
    if (phase !== 'briefing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') setPhase('play');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const elapsed = cfg.seconds - time;
  const score = useMemo(
    () =>
      scoreCase({
        diagnosisCorrect: diagnosis.correct,
        wrongDiagnoses: diagnosis.wrongCount,
        wrongRepairs,
        verified: required.every((k) => verified.includes(k)),
        elapsed,
        limit: cfg.seconds,
        actions,
        freeActions: cfg.freeActions,
        modifier: file.incidents.reduce((a, i) => a + i.scoreModifier, 0),
      }),
    [diagnosis, wrongRepairs, required, verified, elapsed, cfg, actions, file],
  );

  const api: PanelApi = {
    world,
    difficulty,
    run,
    observe,
    repair,
    renew,
    evidence,
    suspects: file.suspects,
    faultsToFind: file.incidents.length,
    diagnosis: { correct: diagnosis.correct, wrong: diagnosis.wrong },
    fileDiagnosis,
    verify: { required, done: verified, repaired },
    httpAttempts,
    termLines,
    setTermLines,
  };

  const status: [string, LedTone] =
    phase === 'restored' || phase === 'result'
      ? ['Operational', 'ok']
      : repaired
        ? ['Unverified', 'warn']
        : health.status === 'down'
          ? ['Down', 'err']
          : ['Degraded', 'warn'];

  const objective = phase === 'restored' || phase === 'result'
    ? 'Case resolved'
    : !diagnosis.correct
      ? repaired
        ? 'File your diagnosis at the control console'
        : 'Locate the network fault'
      : !repaired
        ? 'Repair the fault'
        : 'Verify connectivity from PC-01';

  const hint = difficulty === 'easy' && phase === 'play' ? easyHint(diagnosis.correct, repaired, evidence.length) : null;
  const playing = phase === 'play' && !open;

  return (
    <div className="fixed inset-0 z-[500] overflow-hidden bg-[#060707] text-paper" data-lenis-prevent role="application" aria-label="Network Incident mini-game">
      <IncidentCanvas
        net={world.net}
        meta={world.meta}
        active={playing}
        restored={phase === 'restored' || phase === 'result'}
        focus={open}
        touch={touch}
        interactSignal={interact}
        onNear={setNear}
        onInteract={(s) => setOpen(s.id)}
      />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-60" />

      {/* HUD */}
      {phase !== 'briefing' && (
        <>
          <div className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-5">
            <p className="font-display text-[15px] font-bold uppercase tracking-[0.12em] text-paper">Network Incident</p>
            <p className="label">Case {String(caseNo).padStart(2, '0')} · {cfg.label}</p>
          </div>
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 text-center sm:top-5">
            <p className="label">Time</p>
            <p className={`font-mono text-[22px] tabular-nums ${time <= 30 ? "text-alarm" : "text-paper"}`}>{fmt(time)}</p>
          </div>
          <div className="pointer-events-none absolute right-4 top-4 text-right sm:right-6 sm:top-5">
            <p className="label">Network status</p>
            <p className="mt-1 flex items-center justify-end gap-2 font-mono text-[12px] uppercase tracking-[0.12em]">
              <Led tone={status[1]} pulse={status[1] !== 'ok'} /> {status[0]}
            </p>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 hidden font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted sm:left-6 sm:block">
            <p><span className="text-paper">WASD</span>  Move</p>
            <p><span className="text-paper">E</span>  Interact</p>
            <p><span className="text-paper">Shift</span>  Sprint</p>
            <p><span className="text-paper">Esc</span>  Pause</p>
          </div>
          <div className="pointer-events-none absolute bottom-4 right-4 max-w-[280px] text-right sm:right-6">
            <p className="label">Objective</p>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.12em] text-paper">{objective}</p>
            {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
          </div>
        </>
      )}

      {/* Interaction prompt */}
      {playing && near && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 rounded-[2px] border border-hair-strong bg-ink/85 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper">
          <span className="text-signal">[E]</span> {near.verb}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.text}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 top-20 flex -translate-x-1/2 items-center gap-2 rounded-[2px] border border-hair-strong bg-ink/90 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em]"
          >
            <Led tone={toast.tone} /> {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Station panel */}
      <AnimatePresence>
        {open && phase === 'play' && (
          <motion.aside
            key={open}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="panel absolute bottom-3 right-3 top-3 flex w-[min(460px,calc(100vw-24px))] flex-col bg-graphite/95"
            aria-label={PANEL_TITLE[open][0]}
          >
            <div className="flex items-start justify-between gap-3 border-b border-hair px-4 py-3">
              <div>
                <p className="font-display text-lg font-bold uppercase tracking-tight text-paper">{PANEL_TITLE[open][0]}</p>
                <p className="label">{PANEL_TITLE[open][1]}</p>
              </div>
              <button type="button" className="btn py-1" onClick={() => setOpen(null)}>
                Close <span className="text-dim">Esc</span>
              </button>
            </div>
            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-4">
              <StationPanel id={open} api={api} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Touch controls */}
      {phase === 'play' && !open && <TouchControls touch={touch} onInteract={() => setInteract((n) => n + 1)} canInteract={!!near} />}

      {/* Briefing */}
      <AnimatePresence>
        {phase === 'briefing' && (
          <motion.div key="brief" className="absolute inset-0 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}>
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.5 }} className="w-full max-w-lg border border-hair-strong bg-graphite/95 font-mono">
              <div className="flex items-center justify-between border-b border-hair px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-muted">
                <span>03 / Mini-game</span>
                <span className="flex items-center gap-2 text-alarm">
                  <Led tone="err" pulse /> Alert
                </span>
              </div>
              <div className="px-5 py-6">
                <p className="font-display text-4xl font-extrabold uppercase tracking-tight text-paper">Network Incident</p>
                <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-dim">Incident #{String(caseNo).padStart(2, '0')} · {cfg.label}</p>
                <p className="mt-6 text-[13px] uppercase tracking-[0.16em] text-alarm">Network failure detected</p>
                <p className="mt-2 font-sans text-[15px] leading-relaxed text-paper">{file.incidents[0].report}</p>
                {file.incidents.length > 1 && <p className="mt-2 font-sans text-[13px] text-muted">Reports suggest more than one problem.</p>}
                <p className="mt-4 font-sans text-[14px] text-muted">Locate the fault and restore network connectivity.</p>
                <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-hair pt-4 text-[11px] uppercase tracking-[0.14em]">
                  <div>
                    <dt className="text-dim">Time limit</dt>
                    <dd className="mt-1 text-lg text-paper">{fmt(cfg.seconds)}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Procedure</dt>
                    <dd className="mt-1 text-paper">Investigate · Diagnose · Repair · Verify</dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair px-5 py-3">
                <button type="button" className="btn-ghost" onClick={() => onExit({ resolved: false, score: 0 })}>
                  ← Back to lab
                </button>
                <button type="button" className="btn-primary" onClick={() => setPhase('play')} autoFocus>
                  Begin investigation <span className="text-dim">Enter</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause */}
      {phase === 'paused' && (
        <div className="absolute inset-0 grid place-items-center bg-ink/75 backdrop-blur-sm">
          <div className="w-[300px] space-y-2 border border-hair-strong bg-graphite/95 p-5">
            <p className="font-display text-2xl uppercase tracking-tight text-paper">Paused</p>
            <p className="label">Case {String(caseNo).padStart(2, '0')} · {fmt(time)} left</p>
            <button type="button" className="btn-primary mt-3 w-full" onClick={() => setPhase('play')} autoFocus>
              Resume
            </button>
            <button type="button" className="btn w-full" onClick={() => newCase(true)}>
              Restart this case
            </button>
            <button type="button" className="btn w-full" onClick={() => newCase(false)}>
              New case
            </button>
            <button type="button" className="btn w-full" onClick={() => onExit({ resolved: false, score: 0 })}>
              Exit to lab
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      <AnimatePresence>
        {phase === 'restored' && (
          <motion.div key="restored" className="pointer-events-none absolute inset-x-0 top-1/3 text-center" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <p className="font-display text-5xl font-extrabold uppercase tracking-tight text-signal sm:text-6xl">Network restored</p>
            <p className="label mt-2">All links carrying traffic</p>
          </motion.div>
        )}
      </AnimatePresence>

      {(phase === 'result' || phase === 'failed') && (
        <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-ink/80 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg border border-hair-strong bg-graphite/95 font-mono">
            <div className="border-b border-hair px-5 py-4">
              <p className={`font-display text-3xl font-extrabold uppercase tracking-tight ${phase === 'result' ? 'text-signal' : 'text-alarm'}`}>{phase === 'result' ? 'Network restored' : 'Time expired'}</p>
              <p className="text-[12px] uppercase tracking-[0.16em] text-muted">{phase === 'result' ? 'Case resolved' : 'Incident escalated'}</p>
            </div>
            <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
              <dl className="space-y-1.5 text-[12px] uppercase tracking-[0.12em]">
                {[
                  ['Diagnosis', diagnosis.correct],
                  ['Repair', repaired],
                  ['Verification', required.every((k) => verified.includes(k))],
                ].map(([k, ok]) => (
                  <div key={String(k)} className="flex justify-between">
                    <dt className="text-muted">{k}</dt>
                    <dd className={ok ? 'text-signal' : 'text-alarm'}>{ok ? '✓' : '✕'}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-hair pt-1.5">
                  <dt className="text-muted">Time</dt>
                  <dd className="text-paper">{fmt(elapsed)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Accuracy</dt>
                  <dd className="text-paper">{score.accuracy}%</dd>
                </div>
                <div className="flex justify-between text-[14px]">
                  <dt className="text-muted">Score</dt>
                  <dd className="text-paper">{phase === 'result' ? <NumberTicker value={score.total} duration={1.4} /> : 0}</dd>
                </div>
              </dl>
              {phase === 'result' ? (
                <ul className="space-y-1 text-[11px]">
                  {score.rows.map((r) => (
                    <li key={r.label} className="flex justify-between gap-2">
                      <span className="text-dim">{r.label}</span>
                      <span className={r.value < 0 ? 'text-alarm' : 'text-paper'}>
                        {r.value > 0 ? '+' : ''}
                        {r.value}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="font-sans text-[13px] leading-relaxed text-muted">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Root cause</p>
                  {file.incidents.map((i) => (
                    <div key={i.id} className="mt-1">
                      <p className="text-paper">{CAUSE_LABEL[i.id]}</p>
                      <p className="text-[12px]">Evidence: {i.clues.join(' · ')}</p>
                      <p className="text-[12px]">Repair: {i.repair}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-hair px-5 py-3">
              <button type="button" className="btn" onClick={() => newCase(phase === 'failed')}>
                {phase === 'failed' ? 'Try again' : 'New case'}
              </button>
              <button type="button" className="btn-primary" onClick={() => onExit({ resolved: phase === 'result', score: phase === 'result' ? score.total : 0 })}>
                Return to lab
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/** Re-injects the same incidents on a fresh network, so a restart is a genuine retry. */
function restartCase(f: CaseFile): CaseFile {
  const net = cloneNet(createBaseline());
  const meta: CaseFile['meta'] = { adminDown: [] };
  for (const inc of f.incidents) inc.apply(net, meta);
  return { ...f, net, meta };
}

function TouchControls({ touch, onInteract, canInteract }: { touch: React.MutableRefObject<MoveInput>; onInteract: () => void; canInteract: boolean }) {
  const [show, setShow] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  useEffect(() => setShow(window.matchMedia('(pointer: coarse)').matches), []);
  if (!show) return null;
  const R = 44;
  const end = () => {
    origin.current = null;
    touch.current = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0 });
  };
  return (
    <>
      <div
        className="absolute bottom-8 left-8 h-32 w-32 touch-none rounded-full border border-hair-strong bg-ink/50"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2, id: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const o = origin.current;
          if (!o || o.id !== e.pointerId) return;
          let dx = e.clientX - o.x;
          let dy = e.clientY - o.y;
          const d = Math.hypot(dx, dy);
          if (d > R) {
            dx = (dx / d) * R;
            dy = (dy / d) * R;
          }
          setKnob({ x: dx, y: dy });
          touch.current = { x: dx / R, y: dy / R };
        }}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label="Movement joystick"
      >
        <span className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-silver/40 bg-steel/80" style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }} />
      </div>
      <button
        type="button"
        onClick={onInteract}
        disabled={!canInteract}
        className="absolute bottom-12 right-8 grid h-20 w-20 place-items-center rounded-full border border-signal/60 bg-signal-deep font-mono text-lg text-paper disabled:border-hair disabled:bg-ink/50 disabled:text-dim"
        aria-label="Interact"
      >
        E
      </button>
    </>
  );
}

function easyHint(diagnosed: boolean, repaired: boolean, evidence: number): string {
  if (!evidence) return 'Start at PC-01: check its status and ping the gateway.';
  if (!diagnosed && evidence < 3) return 'Compare what works with what does not: gateway, server, names.';
  if (!diagnosed) return 'When the evidence points one way, file it at the control console.';
  if (!repaired) return 'Fix it at the device that owns the fault.';
  return 'Use the virtual terminal: ping the gateway, then the server.';
}

