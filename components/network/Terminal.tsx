'use client';

import { useEffect, useRef, useState } from 'react';
import { useLab } from '@/lib/sim/store';
import type { OutLine, Tone } from '@/lib/sim/types';

export const TONE_CLASS: Record<Tone, string> = {
  out: 'text-[#cfd2cc]',
  ok: 'text-signal',
  warn: 'text-amber',
  err: 'text-alarm',
  dim: 'text-dim',
  cmd: 'text-paper',
};

const QUICK = ['ipconfig /all', 'ping 192.168.1.1', 'ping www.lab.local', 'tracert www.lab.local', 'nslookup www.lab.local', 'arp -a', 'curl http://www.lab.local'];

export function OutputLines({ lines }: { lines: OutLine[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <div key={i} className={`min-h-[1.45em] whitespace-pre-wrap break-words ${TONE_CLASS[l.tone]}`}>
          {l.text}
        </div>
      ))}
    </>
  );
}

/** Simulated command prompt bound to the shared lab network. */
export function Terminal({ height = 'h-[340px]' }: { height?: string }) {
  const { state, exec, setHost, clearTerm } = useLab();
  const { lines, history, host } = state.term;
  const [input, setInput] = useState('');
  const [cursor, setCursor] = useState(-1);
  const out = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = out.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const submit = (cmd: string) => {
    if (!cmd.trim()) return;
    exec(cmd.trim());
    setInput('');
    setCursor(-1);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1);
      if (history[next] !== undefined) {
        setCursor(next);
        setInput(history[next]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cursor < 0) return;
      const next = cursor + 1;
      if (next >= history.length) {
        setCursor(-1);
        setInput('');
      } else {
        setCursor(next);
        setInput(history[next]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clearTerm();
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-[3px] border border-hair bg-[#07090a]">
      <div className="flex items-center justify-between gap-3 border-b border-hair px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="label text-muted">Terminal</span>
          <div role="radiogroup" aria-label="Terminal host" className="flex">
            {(['PC1', 'PC2'] as const).map((h) => (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={host === h}
                onClick={() => setHost(h)}
                className={`border border-hair px-2 py-0.5 font-mono text-[10.5px] first:rounded-l-[2px] last:rounded-r-[2px] ${host === h ? 'bg-steel text-paper' : 'text-dim hover:text-muted'}`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={clearTerm}>
          Clear
        </button>
      </div>
      <div
        ref={out}
        data-lenis-prevent
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
        onClick={() => field.current?.focus()}
        className={`scanlines thin-scroll relative ${height} overflow-y-auto px-3 py-2.5 font-mono text-[12px] leading-[1.45]`}
      >
        <OutputLines lines={lines} />
        <form
          className="flex items-center gap-2 text-paper"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <label htmlFor="lab-term" className="shrink-0 text-signal">
            {host}&gt;
          </label>
          <input
            id="lab-term"
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-paper caret-signal outline-none focus-visible:outline-none"
            aria-label="Command"
          />
        </form>
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-hair px-3 py-2">
        {QUICK.map((q) => (
          <button key={q} type="button" className="chip shrink-0 hover:border-silver/40 hover:text-paper" onClick={() => submit(q)}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
