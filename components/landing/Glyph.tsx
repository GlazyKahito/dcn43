import type { GlyphId } from '@/data/modules';

/** Line-art instrument faces for the launcher cards. Drawn on a 120×80 plate. */
export function Glyph({ id, className }: { id: GlyphId; className?: string }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1, vectorEffect: 'non-scaling-stroke' as const };
  const accent = { ...s, stroke: 'var(--glyph-accent, #5fae8a)' };
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      {id === 'scope' && (
        <>
          <path {...s} d="M4 40h112M60 6v68" opacity={0.25} />
          <path {...accent} d="M4 40 L22 40 L28 18 L34 62 L40 40 L58 40 L62 30 L66 50 L70 40 L84 40 L88 40 L90 12 L93 40 L116 40" />
          <circle {...s} cx={90} cy={12} r={3} />
        </>
      )}
      {id === 'reticle' && (
        <>
          <circle {...s} cx={60} cy={40} r={30} />
          <circle {...s} cx={60} cy={40} r={16} opacity={0.6} />
          <path {...s} d="M60 2v16M60 62v16M22 40h16M82 40h16" />
          <circle {...accent} cx={60} cy={40} r={2.5} />
        </>
      )}
      {id === 'stack' && (
        <>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} {...(i === 4 ? accent : s)} x={28 + i * 1.5} y={8 + i * 9.4} width={64 - i * 3} height={7} />
          ))}
        </>
      )}
      {id === 'topology' && (
        <>
          <path {...s} d="M14 22 L40 40 M14 58 L40 40 M40 40 H64 M64 40 H86 M86 40 H108" />
          <path {...accent} d="M40 40 H64" strokeDasharray="3 3" />
          {[
            [14, 22],
            [14, 58],
            [40, 40],
            [64, 40],
            [86, 40],
            [108, 40],
          ].map(([x, y], i) => (
            <rect key={i} {...s} x={x - 4} y={y - 4} width={8} height={8} />
          ))}
        </>
      )}
      {id === 'probe' && (
        <>
          <rect {...s} x={10} y={10} width={100} height={60} />
          <path {...accent} d="M18 26 l6 5 -6 5" />
          <path {...s} d="M30 36h26M18 48h60M18 58h40" opacity={0.6} />
          <rect x={60} y={31} width={5} height={8} fill="currentColor" opacity={0.7} />
        </>
      )}
      {id === 'checklist' && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect {...s} x={24} y={10 + i * 16} width={9} height={9} />
              <path {...s} d={`M40 ${14.5 + i * 16}h${56 - i * 8}`} opacity={0.6} />
            </g>
          ))}
          <path {...accent} d="M26 14 l3 3 5 -6 M26 30 l3 3 5 -6" />
        </>
      )}
      {id === 'fault' && (
        <>
          <path {...s} d="M8 40 H46 M74 40 H112" />
          <path {...accent} d="M46 40 L54 30 L58 46 L66 34 L74 40" />
          <circle {...s} cx={8} cy={40} r={3} />
          <circle {...s} cx={112} cy={40} r={3} />
          <path {...s} d="M52 16 L60 24 M68 16 L60 24 M60 24 V30" opacity={0.6} />
        </>
      )}
      {id === 'ten' && (
        <>
          <text x={60} y={58} textAnchor="middle" fontSize={50} fontFamily="var(--font-display)" fontWeight={600} fill="none" stroke="currentColor" strokeWidth={1}>
            10
          </text>
          <path {...accent} d="M14 68h92" />
          <path {...s} d="M14 64v8M106 64v8" />
        </>
      )}
      {id === 'synthesis' && (
        <>
          <path {...s} d="M10 70 H112 M10 70 V8" opacity={0.5} />
          <path {...accent} d="M12 62 C 34 60, 40 30, 60 30 S 92 14, 110 12" />
          {[24, 44, 64, 84, 104].map((x) => (
            <path key={x} {...s} d={`M${x} 70v-3`} />
          ))}
        </>
      )}
      {id === 'power' && (
        <>
          <circle {...s} cx={60} cy={42} r={24} />
          <path {...accent} d="M60 14 V40" strokeWidth={1.6} />
          <circle {...s} cx={60} cy={42} r={31} strokeDasharray="1 5" opacity={0.6} />
        </>
      )}
    </svg>
  );
}
