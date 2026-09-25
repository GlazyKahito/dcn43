'use client';

import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Counts up (or down) to `value`, after Magic UI's NumberTicker (MIT) on 21st.dev. */
export function NumberTicker({ value, pad = 0, duration = 0.9, className }: { value: number; pad?: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = (v: number) => String(Math.round(v)).padStart(pad, '0');
    if (reduced) {
      el.textContent = fmt(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => (el.textContent = fmt(v)),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, pad, duration, reduced]);
  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`}>
      {String(0).padStart(pad, '0')}
    </span>
  );
}
