/**
 * A short light that travels around its parent's border, after Magic UI's BorderBeam (MIT) on 21st.dev.
 * The parent must be `relative`. Uses CSS offset-path; browsers without it simply show nothing.
 */
export function BorderBeam({ size = 60, duration = 6, delay = 0, color = '#5fae8a' }: { size?: number; duration?: number; delay?: number; color?: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        border: '1px solid transparent',
        // keep only the 1px border ring visible
        WebkitMask: 'linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor',
        mask: 'linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0)',
      }}
    >
      <span
        className="border-beam absolute aspect-square"
        style={{
          width: size,
          background: `linear-gradient(to left, ${color}, transparent)`,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          animationDuration: `${duration}s`,
          animationDelay: `-${delay}s`,
        }}
      />
    </span>
  );
}
