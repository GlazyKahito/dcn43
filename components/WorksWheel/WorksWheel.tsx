'use client';

import * as React from 'react';
import { ArrowDown, ArrowUpRight, ChevronRight, Play } from 'lucide-react';
import { WorksWheelItem, WorksWheelProps } from './types';
import { cn } from '@/lib/utils';

/* Geometry constants tuned for cinematic 3D perspective and stage adaptation */
const CARD_H = 0.38;
const CARD_MAX_W = 0.34;
const CARD_RATIO = 1.45;
const STEP = 36;
const DRUM = 2.22;
const LENS = 2.7;
const RING_R = 1.14;
const BOW = 1.82;
const TITLE = 0.11;
const INDEX = 0.032;
const CULL = 1.6;

const WHEEL_UNITS = 900;
const DRAG_UNITS = 400;
const SETTLE = 160;
const EASE = 0.12;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (deg: number) => (deg * Math.PI) / 180;
const bowAt = (drumDeg: number, bow: number) => -bow * (1 - Math.cos(rad(drumDeg)));

function place(
  ringDeg: number,
  drumDeg: number,
  ringR: number,
  drumR: number,
  bow: number,
  m: number
) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

export function WorksWheel({
  items,
  label = "SOMAIYA VIRTUAL LABS",
  sublabel = "NETWORK DIAGNOSTICS",
  action = "Launch Module",
  className,
  onEnterModule,
  selectedModuleId,
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);

  const turn = React.useRef(0);
  const target = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState({ w: 0, h: 0 });
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [zoomingId, setZoomingId] = React.useState<string | null>(null);

  const count = items.length;
  const last = Math.max(count - 1, 0);

  // prefers-reduced-motion
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, []);

  // ResizeObserver for responsive stage dimensions
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute responsive layout metrics
  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const isMobile = w < 768;
    const cardW = isMobile
      ? Math.min(w * 0.72, 320)
      : Math.min(h * CARD_H * CARD_RATIO, w * CARD_MAX_W);
    const cardH = cardW / CARD_RATIO;
    const drumR = cardH * (isMobile ? 1.8 : DRUM);
    const ringR = cardH * (isMobile ? 0.95 : RING_R);
    const ringScale = count
      ? clamp(((2 * Math.PI * ringR) / count) * 0.82 / (cardW || 1), 0.16, 1)
      : 1;

    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * (isMobile ? 1.2 : BOW),
      depth: cardH * (isMobile ? 2.2 : LENS),
      title: Math.max(isMobile ? 24 : cardH * TITLE, 28),
      index: Math.max(cardH * INDEX, 11),
      isMobile,
    };
  }, [stage, count]);

  // Turn to a target index smoothly
  const to = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, last + 1);
    },
    [last]
  );

  // If a selectedModuleId prop changes from parent, turn to it
  React.useEffect(() => {
    if (selectedModuleId) {
      const idx = items.findIndex((m) => m.id === selectedModuleId);
      if (idx !== -1) {
        to(idx + 1);
      }
    }
  }, [selectedModuleId, items, to]);

  // Main rAF animation loop
  React.useEffect(() => {
    if (!stage.h) return;
    let frame = 0;
    const { ringR, ringScale, drumR, bow } = metrics;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) {
        turn.current = target.current;
      } else {
        turn.current += gap * (reduced ? 1 : EASE);
      }

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-m * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = place(
            d * (360 / count),
            drumDeg,
            ringR,
            drumR,
            bow,
            m
          );

          // Cull cards far away on drum
          const isFar = m > 0.5 && Math.abs(d) > CULL;
          card.style.opacity = isFar ? '0' : '1';
          card.style.pointerEvents = isFar ? 'none' : 'auto';
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }

        const face = card?.firstElementChild as HTMLElement | null;
        if (face) {
          face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
        }
      }

      if (labelRef.current) {
        labelRef.current.style.opacity = String(1 - m);
        labelRef.current.style.transform = `scale(${1 - m * 0.15})`;
      }
      if (titleRef.current) {
        titleRef.current.style.opacity = String(m);
        titleRef.current.style.transform = `translateY(${lerp(12, 0, m)}px)`;
      }

      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced]);

  // Wheel event listener for scrolling through items
  const settling = React.useRef(0);
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      const next = target.current + event.deltaY / WHEEL_UNITS;
      if (next > 0 && next < last + 1) {
        event.preventDefault();
      }
      to(next);

      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(() => {
        to(Math.round(target.current));
      }, SETTLE);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(settling.current);
    };
  }, [to, last]);

  // Dragging interaction with touch & mouse
  const dragStart = React.useRef<{ x: number; y: number } | null>(null);
  const dragPrev = React.useRef<{ x: number; y: number } | null>(null);
  const lastVelocity = React.useRef(0);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragStart.current = { x: event.clientX, y: event.clientY };
    dragPrev.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || !dragPrev.current) return;
    const dy = dragPrev.current.y - event.clientY;
    const dx = dragPrev.current.x - event.clientX;
    const delta = Math.abs(dy) > Math.abs(dx) ? dy : dx;
    lastVelocity.current = delta;

    to(target.current + delta / DRAG_UNITS);
    dragPrev.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart.current) {
      const moved =
        Math.hypot(
          event.clientX - dragStart.current.x,
          event.clientY - dragStart.current.y
        ) > 6;

      dragStart.current = null;
      dragPrev.current = null;
      setIsDragging(false);

      if (moved && target.current > 0.5) {
        const momentum = clamp(lastVelocity.current * 0.05, -1, 1);
        to(Math.round(target.current + momentum));
      } else if (target.current > 0.5) {
        to(Math.round(target.current));
      }
    }
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      to(Math.round(target.current) + 1);
      event.preventDefault();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      to(Math.round(target.current) - 1);
      event.preventDefault();
    } else if (event.key === 'Enter') {
      const currentItem = items[active];
      if (currentItem) {
        triggerZoomTransition(currentItem.id);
      }
    }
  };

  // Subtle auto-rotation when idle
  React.useEffect(() => {
    if (isHovered || isDragging || zoomingId) return;

    const interval = setInterval(() => {
      if (target.current === 0) {
        // Stays at rest ring view until user interacts or scrolls
      } else if (target.current < last + 1) {
        to((Math.round(target.current) % (last + 1)) + 1);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [isHovered, isDragging, zoomingId, last, to]);

  const activeProject = items[active] || items[0];

  const triggerZoomTransition = (moduleId: string) => {
    setZoomingId(moduleId);
    setTimeout(() => {
      onEnterModule?.(moduleId);
      setZoomingId(null);
    }, 550);
  };

  const handleCardClick = (i: number, item: WorksWheelItem) => {
    // If not in front, clicking brings it to front
    if (active !== i || turn.current < 0.8) {
      to(i + 1);
    } else {
      // If already active in front, launch cinematic zoom transition
      triggerZoomTransition(item.id);
    }
  };

  return (
    <section
      aria-label="Interactive Network Lab System Launcher"
      className={cn(
        "relative w-full h-screen min-h-[640px] max-h-[1080px] overflow-hidden select-none bg-transparent text-white",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Wheel Interactive Stage */}
      <div
        ref={stageRef}
        tabIndex={0}
        role="region"
        aria-label="Interactive 3D Network Laboratory System Launcher"
        className={cn(
          "absolute inset-0 outline-none cursor-grab active:cursor-grabbing",
          "focus-visible:ring-1 focus-visible:ring-emerald-400/40",
          zoomingId && "pointer-events-none"
        )}
        style={{ perspective: `${metrics.depth}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        {/* Center Pivot Point */}
        <div
          ref={wheelRef}
          className={cn(
            "absolute top-1/2 left-1/2 [transform-style:preserve-3d] transition-transform duration-100",
            zoomingId && "scale-[1.8] opacity-0 transition-all duration-500 ease-in"
          )}
        >
          {items.map((item, i) => {
            const isFront = i === active && turn.current >= 0.8;
            const isZoomingThis = zoomingId === item.id;

            return (
              <div
                key={item.id || item.title}
                role="button"
                tabIndex={0}
                aria-label={`Module: ${item.title}`}
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(i, item);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCardClick(i, item);
                }}
                className={cn(
                  "group absolute [backface-visibility:hidden] cursor-pointer outline-none transition-[filter,box-shadow,transform] duration-300",
                  isFront && "hover:brightness-110",
                  isZoomingThis && "scale-[2.4] z-50 brightness-125 duration-500 ease-out"
                )}
                style={{
                  width: metrics.cardW,
                  height: metrics.cardH,
                  marginLeft: -metrics.cardW / 2,
                  marginTop: -metrics.cardH / 2,
                }}
              >
                {/* Card Face & Image Container */}
                <div className="relative size-full rounded-2xl overflow-hidden border border-white/15 bg-[#0a0f0d]/85 backdrop-blur-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.15)] transition-all duration-300 group-hover:border-emerald-400/60 group-hover:shadow-[0_24px_60px_-12px_rgba(52,211,153,0.3)]">
                  {/* Image */}
                  <img
                    src={item.image}
                    alt={item.title}
                    draggable={false}
                    className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="eager"
                  />

                  {/* Contrast Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 pointer-events-none" />

                  {/* Card Header Badge */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-400/35">
                      {item.badge || `0${i + 1}`}
                    </span>
                    <span className="text-[10px] font-mono text-white/80 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                      ET301 &bull; 2026
                    </span>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between gap-2 z-10">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                        {item.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug line-clamp-1 drop-shadow-md">
                        {item.title}
                      </h3>
                    </div>

                    {/* Action Pill on Card */}
                    <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 backdrop-blur-md shadow-sm transition-all duration-200 group-hover:bg-emerald-400 group-hover:text-black">
                      <span>{action}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Label at Rest: SOMAIYA VIRTUAL LABS / NETWORK DIAGNOSTICS */}
      <div
        ref={labelRef}
        className={cn(
          "pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center tracking-tight transition-all duration-300 z-10",
          zoomingId && "opacity-0 scale-90"
        )}
      >
        <span className="text-xs sm:text-sm font-mono tracking-[0.25em] text-emerald-400/90 uppercase mb-2 font-semibold">
          K J Somaiya School of Engineering
        </span>
        <div className="text-3xl sm:text-5xl md:text-6xl font-sans font-black text-white/95 tracking-tight leading-none uppercase">
          {label}
        </div>
        <div className="text-2xl sm:text-4xl md:text-5xl font-sans font-light text-emerald-300/80 tracking-wide mt-2 uppercase">
          {sublabel}
        </div>
        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-[11px] font-mono text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
          <span>Experiment 10 &bull; Intelligent Network Fault Diagnosis</span>
        </div>
        <p className="text-xs sm:text-sm text-neutral-400 font-mono mt-4 max-w-sm px-4">
          Drag or swipe to rotate the launcher &bull; Click to enter module
        </p>
      </div>

      {/* Active Project Title (shown when drum turns) */}
      <div
        ref={titleRef}
        className="pointer-events-none absolute top-14 sm:top-20 left-6 sm:left-12 max-w-md space-y-1 opacity-0 z-10"
      >
        <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 block font-semibold">
          {activeProject.category} &bull; {activeProject.badge}
        </span>
        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-white tracking-tight">
          {activeProject.title}
        </h2>
      </div>

      {/* Right-Side Vertical Index List (All 10 Modules) */}
      <aside
        aria-label="Laboratory Module Index"
        className="hidden md:flex absolute top-1/2 right-6 lg:right-10 -translate-y-1/2 flex-col items-end gap-1 z-20 pointer-events-auto"
      >
        <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5 font-semibold">
          Module Launcher ({count})
        </div>
        <ol className="flex flex-col items-end gap-1 text-right">
          {items.map((item, i) => {
            const isActive = i === active;
            return (
              <li key={item.id || item.title}>
                <button
                  type="button"
                  onClick={() => {
                    to(i + 1);
                  }}
                  className={cn(
                    "group flex items-center gap-2.5 px-3 py-1 rounded-xl text-xs font-mono transition-all duration-200 cursor-pointer text-left",
                    isActive
                      ? "text-white bg-white/[0.08] backdrop-blur-md border border-white/15 shadow-sm font-semibold"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.03]"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] transition-colors",
                      isActive ? "text-emerald-400 font-bold" : "text-neutral-500 group-hover:text-neutral-300"
                    )}
                  >
                    0{i + 1}
                  </span>
                  <span className="font-sans text-[11px]">{item.title}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Active Module Footer Card */}
      <div className="absolute bottom-16 sm:bottom-12 left-4 sm:left-12 right-4 sm:right-auto max-w-xl z-20 pointer-events-auto">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#080d0b]/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                0{active + 1} of 0{count}
              </span>
              <span className="text-xs font-mono text-neutral-400">
                {activeProject.category}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 leading-snug line-clamp-2 max-w-md">
              {activeProject.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => triggerZoomTransition(activeProject.id)}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sans transition-all shadow-[0_0_16px_rgba(52,211,153,0.3)] hover:shadow-[0_0_24px_rgba(52,211,153,0.5)] cursor-pointer"
          >
            <span>Enter Module</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Launch Direct Cue */}
      <button
        type="button"
        onClick={() => triggerZoomTransition(activeProject.id)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-widest text-neutral-400 hover:text-white bg-black/40 hover:bg-black/60 border border-white/10 backdrop-blur-md transition-all cursor-pointer z-20 group"
      >
        <span>ENTER LAB &bull; {activeProject.title}</span>
        <ArrowDown className="w-3.5 h-3.5 text-emerald-400 transition-transform group-hover:translate-y-0.5" />
      </button>
    </section>
  );
}
