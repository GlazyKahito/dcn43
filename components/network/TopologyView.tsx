'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Flight } from '@/lib/sim/commands';
import { BASE_LATENCY, DEVICE_ORDER, LINK_ORDER } from '@/lib/sim/topology';
import type { DeviceId, LinkId, NetState } from '@/lib/sim/types';

export type Selection = { type: 'device'; id: DeviceId } | { type: 'link'; id: LinkId } | null;

const WIDE: { w: number; h: number; pos: Record<DeviceId, [number, number]> } = {
  w: 1000,
  h: 340,
  pos: { PC1: [95, 95], PC2: [95, 250], SW1: [285, 172], R1: [480, 172], FW1: [675, 172], SRV1: [880, 172] },
};
const TALL: typeof WIDE = {
  w: 380,
  h: 700,
  pos: { PC1: [95, 65], PC2: [285, 65], SW1: [190, 200], R1: [190, 345], FW1: [190, 490], SRV1: [190, 635] },
};

const KIND_CODE: Record<string, string> = { host: 'PC', switch: 'L2', router: 'RT', firewall: 'FW', server: 'SV' };

interface Props {
  net: NetState;
  flight?: (Flight & { id: number }) | null;
  selection?: Selection;
  onSelect?: (s: Selection) => void;
  /** Hide carrier LEDs and link states (used by the hardest game level). */
  concealed?: boolean;
  label?: string;
}

export function TopologyView({ net, flight, selection, onSelect, concealed = false, label = 'Network topology' }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);
  const L = tall ? TALL : WIDE;

  useLayoutEffect(() => {
    const el = wrap.current!;
    const read = () => setTall(el.clientWidth < 560);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pktRef = useRef<SVGGElement>(null);
  const [caption, setCaption] = useState<{ text: string; ok: boolean | null; at?: DeviceId; reason?: string } | null>(null);

  // Packet animation: walk the forward path, then the return path, or stop where the packet died.
  useEffect(() => {
    if (!flight) return;
    const g = pktRef.current;
    if (!g) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pts = [...flight.forward, ...flight.back.slice(1)].map((d) => L.pos[d]);
    const outLen = flight.forward.length - 1;
    const lastDev = flight.delivered ? flight.back[flight.back.length - 1] ?? flight.forward[flight.forward.length - 1] : flight.forward[flight.forward.length - 1];
    const seg = 300;
    const total = Math.max(1, pts.length - 1) * seg;
    setCaption({ text: flight.label, ok: null });
    let raf = 0;
    const start = performance.now();
    const finish = () => {
      g.style.opacity = '0';
      setCaption({ text: flight.label, ok: flight.delivered, at: lastDev, reason: flight.reason });
    };
    if (reduced || pts.length < 2) {
      finish();
      return;
    }
    g.style.opacity = '1';
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(total, now - start));
      const i = Math.min(pts.length - 2, Math.floor(t / seg));
      const f = (t - i * seg) / seg;
      const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      g.setAttribute('transform', `translate(${x1 + (x2 - x1) * e} ${y1 + (y2 - y1) * e})`);
      g.dataset.dir = i < outLen ? 'out' : 'back';
      if (t < total) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // L changes only on layout flips; restarting the flight then is fine.
  }, [flight, L]);

  const sel = (s: Selection) => onSelect?.(s);
  const interactive = !!onSelect;

  return (
    <div ref={wrap} className="relative w-full">
      <svg viewBox={`0 0 ${L.w} ${L.h}`} className="block h-auto w-full" role="group" aria-label={label}>
        <defs>
          <pattern id="topo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="rgba(232,228,218,0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={L.w} height={L.h} fill="url(#topo-grid)" />

        {/* subnet brackets */}
        {!tall && (
          <g className="font-mono" fontSize="10" fill="#6f6f6a" letterSpacing="1.5">
            <text x={40} y={24}>LAN 192.168.1.0/24</text>
            <text x={505} y={120}>TRANSIT 10.0.0.0/30</text>
            <text x={735} y={24}>DMZ 172.16.0.0/24</text>
            <path d="M40 32 H 500" stroke="rgba(232,228,218,0.12)" />
            <path d="M735 32 H 960" stroke="rgba(232,228,218,0.12)" />
          </g>
        )}

        {LINK_ORDER.map((id) => {
          const link = net.links[id];
          const [x1, y1] = L.pos[link.a];
          const [x2, y2] = L.pos[link.b];
          const impaired = link.lossPct > 0 || link.latencyMs > BASE_LATENCY[id] * 5;
          const color = concealed ? '#8a8b86' : !link.up ? '#d0584b' : impaired ? '#d6a24e' : '#9c9e9a';
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const selected = selection?.type === 'link' && selection.id === id;
          return (
            <g
              key={id}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? `Link ${id}, ${link.up ? 'carrier up' : 'carrier down'}` : undefined}
              onClick={() => sel({ type: 'link', id })}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && sel({ type: 'link', id })}
              className={interactive ? 'cursor-pointer outline-none' : ''}
            >
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={18} />
              {selected && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(95,174,138,0.35)" strokeWidth={7} />}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={link.up || concealed ? 1.6 : 1.4}
                strokeDasharray={!concealed && !link.up ? '5 6' : impaired && !concealed ? '10 3' : undefined}
              />
              {!concealed && !link.up && (
                <g transform={`translate(${mx} ${my})`}>
                  <rect x={-9} y={-9} width={18} height={18} fill="#0a0b0c" stroke="#d0584b" />
                  <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#d0584b" strokeWidth={1.5} />
                </g>
              )}
              {!concealed && link.up && impaired && (
                <text x={mx} y={my - 9} textAnchor="middle" fontSize="10" fill="#d6a24e" className="font-mono">
                  {link.lossPct > 0 ? `${link.lossPct}% LOSS` : `${Math.round(link.latencyMs)} ms`}
                </text>
              )}
            </g>
          );
        })}

        {DEVICE_ORDER.map((id) => {
          const d = net.devices[id];
          const [x, y] = L.pos[id];
          const ip = d.interfaces[0]?.ip;
          const selected = selection?.type === 'device' && selection.id === id;
          const w = 104;
          const h = 58;
          const failedHere = caption?.ok === false && caption.at === id;
          return (
            <g
              key={id}
              transform={`translate(${x - w / 2} ${y - h / 2})`}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? `${d.label}${d.powered ? '' : ', powered off'}` : undefined}
              onClick={() => sel({ type: 'device', id })}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && sel({ type: 'device', id })}
              className={interactive ? 'cursor-pointer outline-none' : ''}
              opacity={d.powered || concealed ? 1 : 0.45}
            >
              <rect width={w} height={h} rx={3} fill="#15181a" stroke={selected ? '#e8e4da' : failedHere ? '#d0584b' : 'rgba(232,228,218,0.22)'} strokeWidth={selected ? 1.5 : 1} />
              <rect x={0.5} y={0.5} width={w - 1} height={16} fill="rgba(255,255,255,0.03)" />
              <text x={8} y={12} fontSize="9" fill="#6f6f6a" letterSpacing="1.5" className="font-mono">
                {KIND_CODE[d.kind]}
              </text>
              <circle cx={w - 10} cy={8.5} r={3.2} fill={concealed ? '#262a2e' : d.powered ? '#5fae8a' : '#d0584b'} />
              <text x={8} y={34} fontSize="15" fill="#e8e4da" fontWeight={500} className="font-display" letterSpacing="0.6">
                {id}
              </text>
              <text x={8} y={49} fontSize="9.5" fill="#a09e97" className="font-mono">
                {d.kind === 'switch' ? 'layer 2' : ip}
              </text>
              {[0, 1, 2, 3].map((p) => (
                <rect key={p} x={w - 46 + p * 7} y={6.5} width={4} height={4} fill="rgba(232,228,218,0.18)" />
              ))}
            </g>
          );
        })}

        <g ref={pktRef} opacity={0} pointerEvents="none">
          <circle r={11} fill="rgba(232,228,218,0.08)" />
          <circle r={4.5} fill="#e8e4da" />
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex justify-start" aria-live="polite">
        {caption && (
          <span
            className={`chip bg-ink/80 ${caption.ok === true ? 'border-signal/50 text-signal' : caption.ok === false ? 'border-alarm/50 text-alarm' : 'text-paper'}`}
          >
            {caption.text}
            {caption.ok === true && ' · delivered'}
            {caption.ok === false && ` · ${caption.reason ?? `lost at ${caption.at}`}`}
          </span>
        )}
      </div>
    </div>
  );
}
