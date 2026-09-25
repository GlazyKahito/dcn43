import { SteelField } from './SteelField';

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/**
 * Fixed background stack: steel field, dark veil, vignette and film grain.
 * The `data-phase` attribute on <html> (set by the experience shell) deepens the field during transitions.
 */
export function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink">
      <div className="atmo-field absolute inset-0 transition-[transform,filter] duration-[900ms] ease-[cubic-bezier(0.7,0,0.2,1)]">
        <SteelField />
      </div>
      <div className="atmo-veil absolute inset-0 bg-ink/15 transition-colors duration-700" />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 95% 85% at 50% 45%, transparent 45%, rgba(5,6,6,0.55) 85%, rgba(3,3,3,0.85) 100%)' }}
      />
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}
