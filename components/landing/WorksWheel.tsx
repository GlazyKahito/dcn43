'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MODULES, type LabModule } from '@/data/modules';
import { Glyph } from './Glyph';
import { Led } from '@/components/chrome/Led';

const N = MODULES.length;
const TICKS = N * 6;
const TAU = Math.PI * 2;

interface Geo {
  w: number;
  h: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  cardW: number;
  cardH: number;
  mobile: boolean;
}

function measure(w: number, h: number): Geo {
  const mobile = w < 768;
  if (mobile) {
    const cardW = Math.max(112, Math.min(w * 0.34, 150));
    return { w, h, mobile, cardW, cardH: cardW * 1.28, cx: w / 2, cy: h * 0.55, rx: w * 0.36, ry: Math.min(h * 0.09, 80) };
  }
  const cardW = Math.max(150, Math.min(Math.min(w, h * 1.5) * 0.14, 212));
  return { w, h, mobile, cardW, cardH: cardW * 1.28, cx: w / 2, cy: h * 0.585, rx: Math.min(w * 0.31, 470), ry: Math.min(h * 0.15, 135) };
}

const mod = (v: number, n: number) => ((v % n) + n) % n;

interface Props {
  initialIndex: number;
  onLaunch: (module: LabModule, rect: DOMRect) => void;
  status: { label: string; value: string; tone: 'ok' | 'warn' | 'err' }[];
}

export function WorksWheel({ initialIndex, onLaunch, status }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tickRefs = useRef<(SVGLineElement | null)[]>([]);
  const geo = useRef<Geo>(measure(1280, 800));
  const [layout, setLayout] = useState<Geo | null>(null);
  const [active, setActive] = useState(initialIndex);
  const [launching, setLaunching] = useState(false);

  const rot = useRef(initialIndex);
  const target = useRef(initialIndex);
  const vel = useRef(0);
  const drag = useRef<{ x: number; y: number; rot: number; t: number; last: number; lastT: number; moved: boolean } | null>(null);
  const lastInput = useRef(0);
  const launch = useRef<{ index: number; start: number } | null>(null);
  const reduced = useRef(false);
  const activeRef = useRef(initialIndex);

  useLayoutEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = stageRef.current!;
    const read = () => {
      geo.current = measure(el.clientWidth, el.clientHeight);
      setLayout(geo.current);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback((index: number) => {
    // shortest way round the dial
    const base = Math.round(target.current);
    const delta = mod(index - mod(base, N) + N / 2, N) - N / 2;
    target.current = base + delta;
    vel.current = 0;
    lastInput.current = performance.now();
  }, []);

  const startLaunch = useCallback(() => {
    if (launch.current) return;
    const index = activeRef.current;
    goTo(index);
    launch.current = { index, start: performance.now() };
    setLaunching(true);
    window.setTimeout(() => {
      const el = cardRefs.current[index];
      if (el) onLaunch(MODULES[index], el.getBoundingClientRect());
    }, reduced.current ? 60 : 340);
  }, [goTo, onLaunch]);

  // Render loop: all transforms are written directly to the DOM.
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0, Math.min(now - prev, 48));
      prev = now;
      const g = geo.current;

      if (!drag.current) {
        if (Math.abs(vel.current) > 0.0012) {
          rot.current += vel.current * dt;
          vel.current *= Math.pow(0.93, dt / 16);
          if (Math.abs(vel.current) <= 0.0012) target.current = Math.round(rot.current + vel.current * 120);
        } else {
          const k = reduced.current ? 1 : 1 - Math.pow(0.86, dt / 16);
          rot.current += (target.current - rot.current) * k;
        }
      }
      const idle = !reduced.current && !drag.current && !launch.current && now - lastInput.current > 3500;
      const shown = rot.current + (idle ? Math.sin(now / 1900) * 0.04 : 0);

      const l = launch.current;
      const lt = l ? Math.max(0, Math.min(1, (now - l.start) / 320)) : 0;
      const ease = 1 - Math.pow(1 - lt, 3);

      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const th = ((i - shown) / N) * TAU;
        const depth = (Math.cos(th) + 1) / 2; // 1 = front
        let x = g.cx + Math.sin(th) * g.rx;
        let y = g.cy + Math.cos(th) * g.ry;
        let s = 0.5 + 0.5 * Math.pow(depth, 1.25);
        let o = 0.28 + 0.72 * depth;
        const isLaunch = l && l.index === i;
        if (l) {
          if (isLaunch) {
            s *= 1 + 0.14 * ease;
            y -= (y - g.cy) * 0.25 * ease;
            x -= (x - g.cx) * 0.25 * ease;
          } else o *= 1 - 0.85 * ease;
        }
        const blur = g.mobile ? 0 : (1 - depth) * 2.4 + (l && !isLaunch ? 5 * ease : 0);
        el.style.transform = `translate3d(${x - g.cardW / 2}px, ${y - g.cardH / 2}px, 0) rotateY(${-Math.sin(th) * 24}deg) scale(${s})`;
        el.style.opacity = o.toFixed(3);
        el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : 'none';
        el.style.zIndex = String(Math.round(depth * 100));
      }

      for (let k = 0; k < TICKS; k++) {
        const t = tickRefs.current[k];
        if (!t) continue;
        const th = ((k / 6 - shown) / N) * TAU;
        const major = k % 6 === 0;
        const r1 = 1.2;
        const r2 = major ? 1.3 : 1.25;
        t.setAttribute('x1', String(g.cx + Math.sin(th) * g.rx * r1));
        t.setAttribute('y1', String(g.cy + Math.cos(th) * g.ry * r1));
        t.setAttribute('x2', String(g.cx + Math.sin(th) * g.rx * r2));
        t.setAttribute('y2', String(g.cy + Math.cos(th) * g.ry * r2));
        t.style.opacity = String((0.12 + 0.5 * ((Math.cos(th) + 1) / 2)) * (l ? 1 - ease : 1));
      }

      const nearest = mod(Math.round(rot.current), N);
      if (nearest !== activeRef.current) {
        activeRef.current = nearest;
        setActive(nearest);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keyboard: arrows turn the dial, Enter opens the module at the front.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (launch.current) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goTo(mod(Math.round(target.current) + 1, N));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goTo(mod(Math.round(target.current) - 1, N));
      } else if (e.key === 'Enter' && (e.target === document.body || e.target === stageRef.current)) {
        e.preventDefault();
        startLaunch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, startLaunch]);

  // Mouse wheel / trackpad turns the dial; it never scrolls a page here.
  useEffect(() => {
    const el = stageRef.current!;
    let settle = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (launch.current) return;
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      target.current += d / 420;
      vel.current = 0;
      lastInput.current = performance.now();
      window.clearTimeout(settle);
      settle = window.setTimeout(() => (target.current = Math.round(target.current)), 140);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(settle);
    };
  }, []);

  const pxPerStep = () => (geo.current.rx * TAU) / N * 0.85;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || launch.current) return;
    drag.current = { x: e.clientX, y: e.clientY, rot: rot.current, t: performance.now(), last: rot.current, lastT: performance.now(), moved: false };
    vel.current = 0;
    lastInput.current = performance.now();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 6) {
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const primary = Math.abs(dx) >= Math.abs(dy) ? -dx : -dy;
    const now = performance.now();
    const next = d.rot + primary / pxPerStep();
    if (now > d.lastT) vel.current = (next - d.last) / (now - d.lastT);
    d.last = next;
    d.lastT = now;
    rot.current = next;
    target.current = next;
    lastInput.current = now;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      if (performance.now() - d.lastT > 80) vel.current = 0;
      vel.current = Math.max(-0.012, Math.min(0.012, vel.current));
      if (Math.abs(vel.current) <= 0.0012) target.current = Math.round(rot.current);
      return;
    }
    // A tap: find the card under the pointer.
    const hit = (e.target as HTMLElement).closest('[data-card]');
    if (!hit) return;
    const i = Number(hit.getAttribute('data-card'));
    if (i === activeRef.current && Math.abs(rot.current - Math.round(rot.current)) < 0.15) startLaunch();
    else goTo(i);
  };

  const current = MODULES[active];

  return (
    <section aria-label="Works Wheel — laboratory module launcher" className="wheel-enter relative h-[100svh] w-full select-none overflow-hidden">
      {/* frame chrome */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[120] flex items-start justify-between gap-4 px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="space-y-1">
          <p className="label text-muted">Somaiya Virtual Labs</p>
          <p className="label">Exp 10 · Computer Networks</p>
        </div>
        <dl className="hidden gap-6 text-right md:flex">
          {status.map((s) => (
            <div key={s.label} className="space-y-1">
              <dt className="label">{s.label}</dt>
              <dd className="flex items-center justify-end gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper">
                <Led tone={s.tone} />
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div
        ref={stageRef}
        tabIndex={0}
        role="listbox"
        aria-label="Laboratory modules"
        aria-activedescendant={`wheel-card-${active}`}
        className="absolute inset-0 cursor-grab touch-none outline-none active:cursor-grabbing"
        style={{ perspective: 1400 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full text-silver" aria-hidden>
          {Array.from({ length: TICKS }, (_, k) => (
            <line key={k} ref={(n) => void (tickRefs.current[k] = n)} stroke="currentColor" strokeWidth={k % 6 === 0 ? 1.2 : 0.7} />
          ))}
        </svg>

        {/* centre title sits between the back and front halves of the dial */}
        <div
          className={`pointer-events-none absolute inset-x-0 z-[50] flex flex-col items-center px-4 text-center transition-all duration-500 ${launching ? 'scale-95 opacity-0' : 'opacity-100'}`}
          style={{ top: layout?.mobile ? '10%' : '12%' }}
        >
          <p className="label mb-3 text-muted sm:mb-5">Somaiya Virtual Labs</p>
          <h1 className="font-display text-[clamp(34px,4.8vw,78px)] font-semibold uppercase leading-[0.86] tracking-[-0.01em] text-paper">
            Network
            <br />
            Troubleshooting
            <br />
            <span className="font-light text-silver">&amp; Simulator</span>
          </h1>
          <p className="mt-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-label text-muted sm:mt-6">
            <span className="h-px w-8 bg-hair-strong" />
            Experiment 10
            <span className="h-px w-8 bg-hair-strong" />
          </p>
        </div>

        {layout &&
          MODULES.map((m, i) => (
            <button
              key={m.id}
              id={`wheel-card-${i}`}
              ref={(n) => void (cardRefs.current[i] = n)}
              data-card={i}
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              aria-label={`${m.no} ${m.title}`}
              className="absolute left-0 top-0 origin-center will-change-transform [transform-style:preserve-3d]"
              style={{ width: layout.cardW, height: layout.cardH }}
            >
              <CardFace module={m} active={i === active} compact={layout.mobile} />
            </button>
          ))}
      </div>

      {/* module index */}
      <nav aria-label="Module index" className="absolute right-8 top-1/2 z-[120] hidden -translate-y-1/2 min-[1600px]:block">
        <ol className="space-y-1.5">
          {MODULES.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => goTo(i)}
                className={`group flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors ${i === active ? 'text-paper' : 'text-dim hover:text-muted'}`}
              >
                <span className={`h-px transition-all ${i === active ? 'w-6 bg-signal' : 'w-3 bg-hair-strong group-hover:w-4'}`} />
                <span>{m.no}</span>
                <span className="w-32 text-left">{m.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* readout */}
      <div className="absolute inset-x-4 bottom-4 z-[120] sm:inset-x-auto sm:bottom-8 sm:left-8 sm:w-[330px]">
        <div className={`panel px-4 py-3.5 transition-opacity duration-300 ${launching ? 'opacity-0' : ''}`}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="label whitespace-nowrap">Module {current.no} / 10</p>
            <p className="label hidden whitespace-nowrap sm:block">← → · drag · enter</p>
          </div>
          <p className="mt-1.5 font-display text-xl font-medium uppercase tracking-wide text-paper">{current.title}</p>
          <p className="mt-1 min-h-[2.5em] text-[13px] leading-snug text-muted">{current.line}</p>
          <button type="button" onClick={startLaunch} className="btn-primary mt-3 w-full">
            {current.id === 'launch' ? 'Enter network environment' : 'Open module'}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <p className="label pointer-events-none absolute bottom-8 right-8 z-[120] hidden sm:block">
        K J Somaiya School of Engineering
      </p>
    </section>
  );
}

function CardFace({ module: m, active, compact }: { module: LabModule; active: boolean; compact: boolean }) {
  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-[4px] border bg-gunmetal/90 text-left transition-[transform,border-color,filter] duration-300 hover:scale-[1.04] hover:brightness-125 ${
        active ? 'border-silver/45' : 'border-hair'
      }`}
      style={{
        boxShadow: active
          ? '0 30px 60px -20px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.08), 0 0 0 1px rgba(95,174,138,.18)'
          : '0 24px 40px -24px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.05)',
        backgroundImage: 'linear-gradient(160deg, rgba(255,255,255,.06), transparent 40%)',
      }}
    >
      <div className="flex items-center justify-between border-b border-hair px-2.5 py-1.5">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">CH-{m.no}</span>
        <Led tone={active ? 'ok' : 'off'} />
      </div>
      <div className="grid-paper relative flex flex-1 items-center justify-center px-3 text-silver/80">
        <Glyph id={m.glyph} className="w-[78%]" />
        {[
          'left-1.5 top-1.5 border-l border-t',
          'right-1.5 top-1.5 border-r border-t',
          'bottom-1.5 left-1.5 border-b border-l',
          'bottom-1.5 right-1.5 border-b border-r',
        ].map((c) => (
          <span key={c} className={`absolute h-2 w-2 border-silver/30 ${c}`} />
        ))}
      </div>
      <div className="border-t border-hair px-2.5 pb-2.5 pt-2">
        <p className="font-display text-[26px] font-light leading-none text-silver sm:text-[30px]">{m.no}</p>
        <p className={`mt-1 font-display font-medium uppercase leading-tight tracking-wide text-paper ${compact ? 'text-[11px]' : 'text-[13px]'}`}>{m.title}</p>
      </div>
    </div>
  );
}
