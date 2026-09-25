'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MODULES, type ModuleId } from '@/data/modules';
import { detectFaults } from '@/lib/sim/faults';
import { useLab } from '@/lib/sim/store';

const KEY = 'svl-exp10-progress-v2';
const THEORY_CARDS = 5;

interface Facts {
  current: ModuleId | null;
  visited: ModuleId[];
  read: ModuleId[];
  topics: string[];
  tickets: string[];
  quiz: { answered: number; total: number; finished: boolean };
  game: { rounds: number; finished: boolean };
  sim: { packet: boolean; fault: boolean; command: boolean; recovered: boolean };
}

const EMPTY: Facts = {
  current: null,
  visited: [],
  read: [],
  topics: [],
  tickets: [],
  quiz: { answered: 0, total: 24, finished: false },
  game: { rounds: 0, finished: false },
  sim: { packet: false, fault: false, command: false, recovered: false },
};

export interface ModuleProgress {
  value: number;
  complete: boolean;
  detail: string;
}

export type ModuleState = 'complete' | 'active' | 'next' | 'available' | 'upcoming';

function derive(f: Facts): Record<ModuleId, ModuleProgress> {
  const out = {} as Record<ModuleId, ModuleProgress>;
  const t = Math.min(f.topics.length, THEORY_CARDS);
  out.theory = { value: t / THEORY_CARDS, complete: t >= THEORY_CARDS, detail: `${t}/${THEORY_CARDS} cards` };
  // Simulation: four lab tasks plus one troubleshooting ticket worked to verified recovery.
  const simDone = Object.values(f.sim).filter(Boolean).length + (f.tickets.length > 0 ? 1 : 0);
  out.simulator = { value: simDone / 5, complete: simDone === 5, detail: `${simDone}/5 tasks · ${f.tickets.length} ticket${f.tickets.length === 1 ? '' : 's'}` };
  out.minigame = { value: f.game.finished ? 1 : 0, complete: f.game.finished, detail: f.game.finished ? 'Case resolved' : 'No case closed' };
  out.assessments = {
    value: f.quiz.finished ? 1 : f.quiz.answered / f.quiz.total,
    complete: f.quiz.finished,
    detail: f.quiz.finished ? 'Attempt scored' : `${f.quiz.answered}/${f.quiz.total} answered`,
  };
  const read = f.read.includes('conclusion');
  out.conclusion = { value: read ? 1 : f.visited.includes('conclusion') ? 0.4 : 0, complete: read, detail: read ? 'Read' : f.visited.includes('conclusion') ? 'In progress' : 'Not started' };
  return out;
}

interface ProgressApi {
  progress: Record<ModuleId, ModuleProgress>;
  stateOf: (id: ModuleId) => ModuleState;
  current: ModuleId | null;
  next: ModuleId | null;
  completed: number;
  visit: (id: ModuleId) => void;
  markRead: (id: ModuleId) => void;
  openTopic: (topic: string) => void;
  solveTicket: (ticket: string) => void;
  quizProgress: (answered: number, total: number, finished: boolean) => void;
  gameProgress: (rounds: number, finished: boolean) => void;
  reset: () => void;
}

const Ctx = createContext<ProgressApi | null>(null);

/** Tracks real laboratory progress; it only drives presentation, never access. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [facts, setFacts] = useState<Facts>(EMPTY);
  const loaded = useRef(false);
  const { state } = useLab();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setFacts({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* storage unavailable: start fresh */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(facts));
    } catch {
      /* ignore */
    }
  }, [facts]);

  // Simulator tasks are read from what actually happened on the shared network.
  const sawFault = useRef(false);
  const lastLog = useRef(0);
  useEffect(() => {
    const fresh = state.log.filter((e) => e.id > lastLog.current);
    if (state.log[0]) lastLog.current = Math.max(lastLog.current, state.log[0].id);
    const faults = detectFaults(state.net).length;
    const patch: Partial<Facts['sim']> = {};
    if (fresh.some((e) => e.tone === 'fault') || faults > 0) {
      patch.fault = true;
      sawFault.current = true;
    }
    if (fresh.some((e) => e.tone === 'packet') || state.packets.sent > 0) patch.packet = true;
    if (state.term.history.length > 0) patch.command = true;
    if (sawFault.current && faults === 0) patch.recovered = true;
    setFacts((f) => {
      const changed = (Object.keys(patch) as (keyof Facts['sim'])[]).some((k) => patch[k] && !f.sim[k]);
      return changed ? { ...f, sim: { ...f.sim, ...patch } } : f;
    });
  }, [state.log, state.net, state.packets.sent, state.term.history.length]);

  const progress = useMemo(() => derive(facts), [facts]);
  const next = useMemo(() => MODULES.find((m) => !progress[m.id].complete)?.id ?? null, [progress]);
  const completed = MODULES.filter((m) => progress[m.id].complete).length;

  const stateOf = useCallback(
    (id: ModuleId): ModuleState => {
      if (progress[id].complete) return 'complete';
      if (id === facts.current) return 'active';
      if (id === next) return 'next';
      const m = MODULES.find((x) => x.id === id)!;
      if (m.tool) return 'available';
      const nextIdx = MODULES.findIndex((x) => x.id === next);
      return MODULES.indexOf(m) > nextIdx ? 'upcoming' : 'available';
    },
    [progress, facts.current, next],
  );

  const add = <T,>(list: T[], v: T) => (list.includes(v) ? list : [...list, v]);
  const visit = useCallback((id: ModuleId) => setFacts((f) => ({ ...f, current: id, visited: add(f.visited, id) })), []);
  const markRead = useCallback((id: ModuleId) => setFacts((f) => (f.read.includes(id) ? f : { ...f, read: add(f.read, id) })), []);
  const openTopic = useCallback((t: string) => setFacts((f) => (f.topics.includes(t) ? f : { ...f, topics: add(f.topics, t) })), []);
  const solveTicket = useCallback((t: string) => setFacts((f) => (f.tickets.includes(t) ? f : { ...f, tickets: add(f.tickets, t) })), []);
  const quizProgress = useCallback(
    (answered: number, total: number, finished: boolean) =>
      setFacts((f) => ({ ...f, quiz: { answered: Math.max(f.quiz.finished ? f.quiz.total : 0, answered), total, finished: f.quiz.finished || finished } })),
    [],
  );
  const gameProgress = useCallback(
    (rounds: number, finished: boolean) => setFacts((f) => ({ ...f, game: { rounds: Math.max(f.game.rounds, rounds), finished: f.game.finished || finished } })),
    [],
  );
  const reset = useCallback(() => {
    sawFault.current = false;
    setFacts(EMPTY);
  }, []);

  const api = useMemo<ProgressApi>(
    () => ({ progress, stateOf, current: facts.current, next, completed, visit, markRead, openTopic, solveTicket, quizProgress, gameProgress, reset }),
    [progress, stateOf, facts.current, next, completed, visit, markRead, openTopic, solveTicket, quizProgress, gameProgress, reset],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
