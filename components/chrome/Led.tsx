export type LedTone = 'ok' | 'warn' | 'err' | 'off';

const COLORS: Record<LedTone, string> = {
  ok: 'bg-signal shadow-[0_0_6px_rgba(95,174,138,0.7)]',
  warn: 'bg-amber shadow-[0_0_6px_rgba(214,162,78,0.7)]',
  err: 'bg-alarm shadow-[0_0_6px_rgba(208,88,75,0.8)]',
  off: 'bg-steel',
};

/** Panel indicator lamp. */
export function Led({ tone, pulse = false, className = '' }: { tone: LedTone; pulse?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full ring-1 ring-black/60 ${COLORS[tone]} ${pulse ? 'animate-pulse' : ''} ${className}`}
    />
  );
}
