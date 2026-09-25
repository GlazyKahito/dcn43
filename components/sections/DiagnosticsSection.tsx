'use client';

import { useState } from 'react';
import { Panel, Section } from '@/components/chrome/Section';
import { Led } from '@/components/chrome/Led';
import { OutputLines } from '@/components/network/Terminal';
import { TopologyView } from '@/components/network/TopologyView';
import { useSite } from '@/components/experience/Site';
import { detectFaults } from '@/lib/sim/faults';
import { verificationSuite, type VerifyStep } from '@/lib/sim/health';
import { interpretProbe, PROBES, type Verdict } from '@/lib/sim/interpret';
import { CAUSES, loadScenario, REPAIRS, SCENARIOS, type CauseId, type RepairId, type Scenario } from '@/lib/sim/scenarios';
import { useLab } from '@/lib/sim/store';
import { useProgress } from '@/lib/progress';
import type { OutLine } from '@/lib/sim/types';

const STAGES = ['Symptoms', 'Hypotheses', 'Probes', 'Evidence', 'Root cause', 'Fix', 'Verification'];

interface Evidence {
  probe: string;
  command: string;
  verdict: Verdict;
  finding: string;
}

interface Work {
  suspects: CauseId[];
  evidence: Evidence[];
  output: OutLine[];
  wrongCauses: CauseId[];
  cause: CauseId | null;
  fixes: RepairId[];
  verify: VerifyStep[] | null;
  recovered: boolean;
}

const fresh = (): Work => ({ suspects: [], evidence: [], output: [], wrongCauses: [], cause: null, fixes: [], verify: null, recovered: false });
const VERDICT_TONE: Record<Verdict, 'ok' | 'warn' | 'err'> = { pass: 'ok', warn: 'warn', fail: 'err' };

export function DiagnosticsSection() {
  const lab = useLab();
  const { goTo } = useSite();
  const { solveTicket } = useProgress();
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  const [work, setWork] = useState<Work>(fresh);
  const scenario = SCENARIOS.find((s) => s.id === lab.state.scenarioId) ?? null;

  const open = (s: Scenario) => {
    lab.loadScenario(s.id, loadScenario(s), `Scenario ${s.no} loaded: ${s.title}`);
    setWork(fresh());
  };

  const stage = !scenario ? -1 : work.recovered ? 7 : work.verify ? 6 : work.cause ? 5 : work.evidence.length >= 2 ? 4 : work.evidence.length ? 3 : work.suspects.length ? 2 : 1;

  const runProbe = (id: string) => {
    const def = PROBES.find((p) => p.id === id)!;
    const lines = lab.exec(def.command, 'PC1');
    const reading = interpretProbe(lab.state.net, id);
    setWork((w) => ({
      ...w,
      output: [{ text: `PC1> ${def.command}`, tone: 'cmd' }, ...lines],
      evidence: [{ probe: id, command: def.command, ...reading }, ...w.evidence.filter((e) => e.probe !== id)],
    }));
  };

  const chooseCause = (c: CauseId) => {
    if (!scenario || work.cause) return;
    if (c === scenario.cause) setWork((w) => ({ ...w, cause: c }));
    else setWork((w) => ({ ...w, wrongCauses: w.wrongCauses.includes(c) ? w.wrongCauses : [...w.wrongCauses, c] }));
  };

  const applyFix = (r: RepairId) => {
    const rep = REPAIRS[r];
    lab.apply(rep.apply(lab.state.net), `Repair: ${rep.label}`, 'fix');
    setWork((w) => ({ ...w, fixes: [...w.fixes, r], verify: null }));
  };

  const verify = () => {
    const steps = verificationSuite(lab.state.net);
    const residual = detectFaults(lab.state.net);
    const all: VerifyStep[] = [
      ...steps,
      { label: 'No residual deviations', command: 'compare with reference', pass: residual.length === 0, detail: residual[0]?.text ?? 'matches reference' },
    ];
    const ok = all.every((s) => s.pass);
    lab.send('PC1', 'www.lab.local', 'tcp');
    setWork((w) => ({ ...w, verify: all, recovered: ok }));
    if (ok && scenario) {
      setSolved((s) => ({ ...s, [scenario.id]: true }));
      solveTicket(scenario.id);
    }
  };

  return (
    <Section
      id="diagnostics"
      no="02·B"
      kicker="Simulation · Troubleshooting tickets"
      title={
        <>
          From symptom
          <br />
          to verified repair
        </>
      }
      lede="Pick a ticket, probe the network, name the cause, fix it, re-test."
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <Panel title="Trouble tickets" meta={<span className="label">{Object.keys(solved).length}/10 resolved</span>} className="lg:col-span-4" bodyClass="p-0">
          <ul className="divide-y divide-hair">
            {SCENARIOS.map((s) => {
              const on = s.id === scenario?.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => open(s)}
                    aria-current={on ? 'true' : undefined}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${on ? 'bg-steel/60' : 'hover:bg-gunmetal'}`}
                  >
                    <span className="font-mono text-[11px] text-dim">{s.no}</span>
                    <span className={`flex-1 text-[14px] ${on ? 'text-paper' : 'text-muted'}`}>{s.title}</span>
                    <Led tone={solved[s.id] ? 'ok' : on ? 'warn' : 'off'} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="min-w-0 space-y-4 lg:col-span-8">
          <ol className="no-scrollbar flex overflow-x-auto border border-hair" aria-label="Troubleshooting stages">
            {STAGES.map((name, i) => (
              <li
                key={name}
                aria-current={stage === i + 1 ? 'step' : undefined}
                className={`flex min-w-[96px] flex-1 flex-col gap-1 border-r border-hair px-3 py-2 last:border-r-0 ${stage > i + 1 ? 'bg-signal-soft' : stage === i + 1 ? 'bg-steel/60' : ''}`}
              >
                <span className="font-mono text-[10px] text-dim">{String(i + 1).padStart(2, '0')}</span>
                <span className={`font-mono text-[10.5px] uppercase tracking-[0.1em] ${stage >= i + 1 ? 'text-paper' : 'text-dim'}`}>{name}</span>
              </li>
            ))}
          </ol>

          {!scenario ? (
            <div className="panel grid min-h-[320px] place-items-center p-8 text-center">
              <div className="max-w-md">
                <p className="font-display text-2xl uppercase tracking-tight text-paper">Select a ticket</p>
                <p className="mt-2 text-[14px] text-muted">
                  Each ticket describes what a user reported. Loading one breaks the shared lab network in a specific way; the fault is not shown to you.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Panel title={`01 · Symptoms — ticket ${scenario.no}`}>
                  <p className="font-display text-xl uppercase tracking-tight text-paper">{scenario.title}</p>
                  <blockquote className="mt-2 border-l border-hair-strong pl-3 text-[14px] leading-relaxed text-muted">“{scenario.ticket}”</blockquote>
                  <p className="mt-3 font-mono text-[11px] text-dim">Hint: {scenario.hint}</p>
                </Panel>
                <Panel title="02 · Hypotheses" meta={<span className="label">mark suspects</span>}>
                  <ul className="space-y-1.5">
                    {scenario.causeOptions.map((c) => {
                      const on = work.suspects.includes(c);
                      return (
                        <li key={c}>
                          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-muted">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => setWork((w) => ({ ...w, suspects: on ? w.suspects.filter((x) => x !== c) : [...w.suspects, c] }))}
                              className="accent-[#5fae8a]"
                            />
                            <span className="w-10 font-mono text-[10px] text-dim">{CAUSES[c].layer}</span>
                            <span className={on ? 'text-paper' : ''}>{CAUSES[c].label}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              </div>

              <Panel title="03 · Diagnostic probes · run on PC1" bodyClass="p-3 sm:p-4">
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-5">
                  {PROBES.map((p) => {
                    const done = work.evidence.find((e) => e.probe === p.id);
                    return (
                      <button key={p.id} type="button" title={p.question} onClick={() => runProbe(p.id)} className="btn justify-start gap-2 truncate px-2.5 normal-case tracking-normal">
                        <Led tone={done ? VERDICT_TONE[done.verdict] : 'off'} />
                        <span className="truncate font-mono text-[11px]">{p.command}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                  <div data-lenis-prevent className="scanlines thin-scroll h-[220px] overflow-y-auto rounded-[2px] border border-hair bg-[#07090a] px-3 py-2 font-mono text-[11.5px] leading-[1.45]">
                    {work.output.length ? <OutputLines lines={work.output} /> : <p className="text-dim">Probe output appears here.</p>}
                  </div>
                  <div className="rounded-[2px] border border-hair bg-ink/40">
                    <TopologyView net={lab.state.net} flight={lab.state.flight} label="Live topology during diagnosis" />
                  </div>
                </div>
              </Panel>

              <Panel title="04 · Evidence" meta={<span className="label">{work.evidence.length} collected</span>}>
                {work.evidence.length === 0 ? (
                  <p className="text-[13px] text-dim">Run probes to collect evidence. Work bottom-up: carrier and addressing first, then the gateway, then the path, then services.</p>
                ) : (
                  <ul className="space-y-2">
                    {work.evidence.map((e) => (
                      <li key={e.probe} className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-3">
                        <span className="flex items-center gap-2 font-mono text-[11px] text-muted">
                          <Led tone={VERDICT_TONE[e.verdict]} />
                          {e.command}
                        </span>
                        <span className="text-[13px] text-paper">{e.finding}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <div className="grid gap-4 md:grid-cols-2">
                <Panel title="05 · Root cause">
                  {work.evidence.length < 2 ? (
                    <p className="text-[13px] text-dim">Collect at least two pieces of evidence before committing to a root cause.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {scenario.causeOptions.map((c) => {
                        const wrong = work.wrongCauses.includes(c);
                        const right = work.cause === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            disabled={!!work.cause || wrong}
                            onClick={() => chooseCause(c)}
                            className={`flex w-full items-center gap-2 rounded-[2px] border px-3 py-2 text-left text-[13px] transition-colors ${
                              right ? 'border-signal/60 bg-signal-soft text-paper' : wrong ? 'border-alarm/40 text-alarm line-through' : 'border-hair text-muted hover:border-hair-strong hover:text-paper'
                            } disabled:cursor-default`}
                          >
                            <span className="w-10 font-mono text-[10px] text-dim">{CAUSES[c].layer}</span>
                            {CAUSES[c].label}
                          </button>
                        );
                      })}
                      {work.wrongCauses.length > 0 && !work.cause && <p className="pt-1 font-mono text-[11px] text-alarm">The evidence does not support that cause. Re-read the findings.</p>}
                      {work.cause && <p className="pt-2 text-[13px] leading-relaxed text-signal">{scenario.lesson}</p>}
                    </div>
                  )}
                </Panel>

                <Panel title="06 · Fix">
                  {!work.cause ? (
                    <p className="text-[13px] text-dim">Identify the root cause first.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {scenario.repairs.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => applyFix(r)}
                          className="flex w-full flex-col items-start rounded-[2px] border border-hair px-3 py-2 text-left transition-colors hover:border-hair-strong"
                        >
                          <span className="flex items-center gap-2 text-[13px] text-paper">
                            {work.fixes.includes(r) && <Led tone="warn" />}
                            {REPAIRS[r].label}
                          </span>
                          <span className="font-mono text-[10.5px] text-dim">{REPAIRS[r].command}</span>
                        </button>
                      ))}
                      <p className="pt-1 text-[12px] text-dim">You can also repair it by hand in the simulator inspector; verification reads the live network either way.</p>
                    </div>
                  )}
                </Panel>
              </div>

              <Panel
                title="07 · Verification · re-test"
                meta={
                  <button type="button" className="btn-primary py-1" onClick={verify} disabled={!work.cause}>
                    Run re-test
                  </button>
                }
              >
                {!work.verify ? (
                  <p className="text-[13px] text-dim">After a repair, re-run the end-to-end checks from PC1. All six must pass.</p>
                ) : (
                  <>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {work.verify.map((v) => (
                        <li key={v.label} className="flex items-start gap-2 text-[13px]">
                          <Led tone={v.pass ? 'ok' : 'err'} className="mt-1.5" />
                          <span>
                            <span className="text-paper">{v.label}</span>
                            <span className="block font-mono text-[11px] text-dim">
                              {v.command} — {v.detail}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[2px] border px-4 py-3 ${work.recovered ? 'border-signal/50 bg-signal-soft' : 'border-alarm/40 bg-alarm-soft'}`}>
                      <p className={`font-display text-xl uppercase tracking-tight ${work.recovered ? 'text-signal' : 'text-alarm'}`}>
                        {work.recovered ? 'Network recovered' : 'Not recovered'}
                      </p>
                      {work.recovered ? (
                        <button type="button" className="btn" onClick={() => goTo('simulator')}>
                          Inspect in simulator →
                        </button>
                      ) : (
                        <p className="text-[12px] text-muted">A check still fails. Apply another repair or correct it in the simulator.</p>
                      )}
                    </div>
                  </>
                )}
              </Panel>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}
