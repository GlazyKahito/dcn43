'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { runCommand, flightFrom, type Flight } from './commands';
import { createRng, probe, resolveName } from './engine';
import { createBaseline } from './topology';
import type { DeviceId, NetState, OutLine, Proto } from './types';

export type LogTone = 'info' | 'fault' | 'fix' | 'packet';

export interface LogEntry {
  id: number;
  time: string;
  text: string;
  tone: LogTone;
}

interface LabState {
  net: NetState;
  log: LogEntry[];
  packets: { sent: number; delivered: number; dropped: number };
  flight: (Flight & { id: number }) | null;
  scenarioId: string | null;
  term: { host: DeviceId; lines: OutLine[]; history: string[] };
}

type Action =
  | { type: 'net'; net: NetState; log?: string; tone?: LogTone }
  | { type: 'scenario'; id: string | null; net: NetState; log: string }
  | { type: 'reset' }
  | { type: 'flight'; flight: Flight }
  | { type: 'packets'; sent: number; delivered: number }
  | { type: 'log'; text: string; tone: LogTone }
  | { type: 'term/append'; lines: OutLine[] }
  | { type: 'term/clear' }
  | { type: 'term/host'; host: DeviceId }
  | { type: 'term/history'; cmd: string };

let seq = 0;
const stamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
const entry = (text: string, tone: LogTone): LogEntry => ({ id: ++seq, time: stamp(), text, tone });

const WELCOME: OutLine[] = [
  { text: 'Lab terminal — commands run against the live simulated network.', tone: 'dim' },
  { text: 'Type help for the command list.', tone: 'dim' },
];

const initial = (): LabState => ({
  net: createBaseline(),
  log: [],
  packets: { sent: 0, delivered: 0, dropped: 0 },
  flight: null,
  scenarioId: null,
  term: { host: 'PC1', lines: WELCOME, history: [] },
});

const MAX_LOG = 60;
const MAX_LINES = 400;

function reducer(state: LabState, action: Action): LabState {
  switch (action.type) {
    case 'net':
      return {
        ...state,
        net: action.net,
        log: action.log ? [entry(action.log, action.tone ?? 'info'), ...state.log].slice(0, MAX_LOG) : state.log,
      };
    case 'scenario':
      return { ...state, net: action.net, scenarioId: action.id, log: [entry(action.log, action.id ? 'fault' : 'info'), ...state.log].slice(0, MAX_LOG) };
    case 'reset':
      return { ...state, net: createBaseline(), scenarioId: null, log: [entry('Network restored to reference configuration.', 'fix'), ...state.log].slice(0, MAX_LOG) };
    case 'flight':
      return { ...state, flight: { ...action.flight, id: ++seq } };
    case 'packets':
      return {
        ...state,
        packets: {
          sent: state.packets.sent + action.sent,
          delivered: state.packets.delivered + action.delivered,
          dropped: state.packets.dropped + (action.sent - action.delivered),
        },
      };
    case 'log':
      return { ...state, log: [entry(action.text, action.tone), ...state.log].slice(0, MAX_LOG) };
    case 'term/append':
      return { ...state, term: { ...state.term, lines: [...state.term.lines, ...action.lines].slice(-MAX_LINES) } };
    case 'term/clear':
      return { ...state, term: { ...state.term, lines: [] } };
    case 'term/host':
      return { ...state, term: { ...state.term, host: action.host } };
    case 'term/history':
      return { ...state, term: { ...state.term, history: [...state.term.history.filter((h) => h !== action.cmd), action.cmd].slice(-40) } };
  }
}

interface LabApi {
  state: LabState;
  apply: (next: NetState, log?: string, tone?: LogTone) => void;
  loadScenario: (id: string | null, net: NetState, log: string) => void;
  reset: () => void;
  /** Runs a terminal command on the live network; output is appended to the shared terminal. */
  exec: (line: string, host?: DeviceId) => OutLine[];
  /** Sends one packet and animates it. `silent` skips the event log and counters (ambient hero traffic). */
  send: (src: DeviceId, target: string, proto: Proto, silent?: boolean) => { delivered: boolean; rtt: number; ttl: number; reason?: string };
  setHost: (host: DeviceId) => void;
  clearTerm: () => void;
}

const LabContext = createContext<LabApi | null>(null);

export function LabProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  // Timestamps are client-only; logging on mount keeps server and client markup identical.
  useEffect(() => dispatch({ type: 'log', text: 'Laboratory network initialised to reference configuration.', tone: 'info' }), []);

  const apply = useCallback((net: NetState, log?: string, tone?: LogTone) => dispatch({ type: 'net', net, log, tone }), []);
  const loadScenario = useCallback((id: string | null, net: NetState, log: string) => dispatch({ type: 'scenario', id, net, log }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);
  const setHost = useCallback((host: DeviceId) => dispatch({ type: 'term/host', host }), []);
  const clearTerm = useCallback(() => dispatch({ type: 'term/clear' }), []);

  const exec = useCallback(
    (line: string, host?: DeviceId) => {
      const who = host ?? state.term.host;
      const result = runCommand({ state: state.net, host: who, rng: createRng(Date.now()) }, line);
      dispatch({ type: 'term/history', cmd: line });
      if (result.clear) {
        dispatch({ type: 'term/clear' });
        return [];
      }
      dispatch({ type: 'term/append', lines: [{ text: `${who}> ${line}`, tone: 'cmd' }, ...result.lines] });
      if (result.next) dispatch({ type: 'net', net: result.next, log: `${who}: ${line}`, tone: 'fix' });
      if (result.flight) dispatch({ type: 'flight', flight: result.flight });
      if (result.packets) dispatch({ type: 'packets', sent: result.packets.sent, delivered: result.packets.received });
      return result.lines;
    },
    [state.net, state.term.host],
  );

  const send = useCallback(
    (src: DeviceId, target: string, proto: Proto, silent = false) => {
      const port = proto === 'udp' ? 53 : proto === 'tcp' ? 80 : undefined;
      const res = resolveName(state.net, src, target);
      const ip = res.ip ?? target;
      const p = probe(state.net, src, ip, proto, port);
      const delivered = p.ok && (proto === 'icmp' || p.service === 'open');
      const label = proto === 'icmp' ? 'ICMP echo' : proto === 'udp' ? 'DNS query' : 'HTTP SYN';
      const flight = flightFrom(p, proto, `${label} → ${target}`);
      dispatch({ type: 'flight', flight: { ...flight, back: delivered ? flight.back : [], delivered } });
      const outcome = { delivered, rtt: p.rtt, ttl: p.replyTtl, reason: flight.reason };
      if (silent) return outcome;
      dispatch({ type: 'packets', sent: 1, delivered: delivered ? 1 : 0 });
      const where = p.ok ? `port ${port} ${p.service} on ${p.dst}` : p.reason === 'reply-lost' ? `reply lost returning from ${p.dst}` : `dropped at ${p.forward.at}${p.reason ? ` (${p.reason})` : ''}`;
      dispatch({
        type: 'log',
        text: delivered ? `${label} ${src} → ${target}: delivered, ${p.rtt < 1 ? '<1' : Math.round(p.rtt)} ms` : `${label} ${src} → ${target}: ${where}`,
        tone: 'packet',
      });
      return outcome;
    },
    [state.net],
  );

  const api = useMemo<LabApi>(
    () => ({ state, apply, loadScenario, reset, exec, send, setHost, clearTerm }),
    [state, apply, loadScenario, reset, exec, send, setHost, clearTerm],
  );
  return <LabContext.Provider value={api}>{children}</LabContext.Provider>;
}

export function useLab(): LabApi {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error('useLab must be used inside <LabProvider>');
  return ctx;
}
