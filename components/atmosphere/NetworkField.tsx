'use client';

import { useEffect, useRef } from 'react';

interface Props {
  /** 0 = healthy; higher values drop more packets in the background traffic. */
  faults: number;
  /** Changes whenever the lab sends a packet; each change triggers a burst. */
  pulse: number;
  /** Dimmer behind dense content pages. */
  dim: boolean;
}

interface Node {
  bx: number;
  by: number;
  x: number;
  y: number;
  phase: number;
  hub: boolean;
  links: number[];
}

interface Packet {
  path: number[];
  seg: number;
  t: number;
  speed: number;
  dieAt: number; // segment index where it is dropped, or -1
  trail: [number, number][];
}

interface Flash {
  x: number;
  y: number;
  age: number;
  kind: 'ack' | 'drop';
}

const PAPER = '232,228,218';
const SIGNAL = '95,174,138';
const ALARM = '208,88,75';

function buildMesh(w: number, h: number): Node[] {
  const cell = w < 768 ? 120 : 150;
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  const nodes: Node[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.28) continue;
      const bx = (c - 0.5 + Math.random()) * cell;
      const by = (r - 0.5 + Math.random()) * cell;
      nodes.push({ bx, by, x: bx, y: by, phase: Math.random() * Math.PI * 2, hub: Math.random() < 0.14, links: [] });
    }
  }
  // Link each node to its nearest neighbours: a sparse, irregular backbone.
  nodes.forEach((n, i) => {
    const near = nodes
      .map((m, j) => ({ j, d: (m.bx - n.bx) ** 2 + (m.by - n.by) ** 2 }))
      .filter((o) => o.j !== i && o.d < (cell * 1.6) ** 2)
      .sort((a, b) => a.d - b.d)
      .slice(0, n.hub ? 4 : 2);
    for (const { j } of near) {
      if (!n.links.includes(j)) n.links.push(j);
      if (!nodes[j].links.includes(i)) nodes[j].links.push(i);
    }
  });
  return nodes;
}

/** Live packet traffic over a faint routed mesh. Mirrors lab health: faults make packets die mid-link. */
export function NetworkField({ faults, pulse, dim }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const faultsRef = useRef(faults);
  const burst = useRef(0);
  faultsRef.current = faults;

  useEffect(() => {
    burst.current += 1;
  }, [pulse]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);

    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    const packets: Packet[] = [];
    const flashes: Flash[] = [];
    const pointer = { x: -9999, y: -9999 };
    let lastBurst = burst.current;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = buildMesh(w, h);
      packets.length = 0;
    };
    resize();
    window.addEventListener('resize', resize);
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const spawn = (from?: number) => {
      const linked = nodes.map((_, i) => i).filter((i) => nodes[i].links.length);
      if (!linked.length) return;
      let cur = from ?? linked[Math.floor(Math.random() * linked.length)];
      const path = [cur];
      const hops = 3 + Math.floor(Math.random() * 5);
      for (let k = 0; k < hops; k++) {
        const options = nodes[cur].links.filter((j) => !path.includes(j));
        if (!options.length) break;
        cur = options[Math.floor(Math.random() * options.length)];
        path.push(cur);
      }
      if (path.length < 2) return;
      const dropChance = Math.min(0.75, faultsRef.current * 0.3);
      const dieAt = Math.random() < dropChance ? Math.floor(Math.random() * (path.length - 1)) : -1;
      packets.push({ path, seg: 0, t: 0, speed: 0.9 + Math.random() * 0.7, dieAt, trail: [] });
    };

    let raf = 0;
    let prev = performance.now();
    let spawnClock = 0;

    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(now - prev, 50)) / 1000;
      prev = now;
      ctx.clearRect(0, 0, w, h);

      // drift
      for (const n of nodes) {
        n.x = n.bx + Math.sin(now / 5200 + n.phase) * 6;
        n.y = n.by + Math.cos(now / 6100 + n.phase) * 6;
      }

      // links
      ctx.lineWidth = 1;
      nodes.forEach((n, i) => {
        for (const j of n.links) {
          if (j < i) continue;
          const m = nodes[j];
          const mx = (n.x + m.x) / 2 - pointer.x;
          const my = (n.y + m.y) / 2 - pointer.y;
          const near = Math.max(0, 1 - Math.sqrt(mx * mx + my * my) / 220);
          ctx.strokeStyle = `rgba(${PAPER},${0.045 + near * 0.1})`;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      });

      // nodes
      for (const n of nodes) {
        if (n.hub) {
          ctx.strokeStyle = `rgba(${PAPER},0.16)`;
          ctx.strokeRect(n.x - 3.5, n.y - 3.5, 7, 7);
        }
        ctx.fillStyle = `rgba(${PAPER},${n.hub ? 0.32 : 0.16})`;
        ctx.fillRect(n.x - 1, n.y - 1, 2, 2);
      }

      if (!reduced) {
        spawnClock += dt;
        const interval = mobile ? 0.55 : 0.32;
        while (spawnClock > interval) {
          spawnClock -= interval;
          if (packets.length < (mobile ? 14 : 28)) spawn();
        }
        if (burst.current !== lastBurst) {
          lastBurst = burst.current;
          const hubs = nodes.map((n, i) => (n.hub ? i : -1)).filter((i) => i >= 0);
          const origin = hubs[Math.floor(Math.random() * hubs.length)];
          for (let k = 0; k < 6; k++) spawn(origin);
        }

        for (let p = packets.length - 1; p >= 0; p--) {
          const pk = packets[p];
          const a = nodes[pk.path[pk.seg]];
          const b = nodes[pk.path[pk.seg + 1]];
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          pk.t += (pk.speed * 120 * dt) / len;
          const dying = pk.seg === pk.dieAt && pk.t >= 0.55;
          if (dying) {
            flashes.push({ x: a.x + (b.x - a.x) * 0.55, y: a.y + (b.y - a.y) * 0.55, age: 0, kind: 'drop' });
            packets.splice(p, 1);
            continue;
          }
          if (pk.t >= 1) {
            pk.seg += 1;
            pk.t = 0;
            if (pk.seg >= pk.path.length - 1) {
              const end = nodes[pk.path[pk.path.length - 1]];
              if (Math.random() < 0.35) flashes.push({ x: end.x, y: end.y, age: 0, kind: 'ack' });
              packets.splice(p, 1);
              continue;
            }
          }
          const s = nodes[pk.path[pk.seg]];
          const e = nodes[pk.path[pk.seg + 1]];
          const x = s.x + (e.x - s.x) * pk.t;
          const y = s.y + (e.y - s.y) * pk.t;
          pk.trail.push([x, y]);
          if (pk.trail.length > 10) pk.trail.shift();

          // lit segment under the packet
          ctx.strokeStyle = `rgba(${PAPER},0.12)`;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          for (let k = 0; k < pk.trail.length; k++) {
            const [tx, ty] = pk.trail[k];
            ctx.fillStyle = `rgba(${PAPER},${(k / pk.trail.length) * 0.22})`;
            ctx.fillRect(tx - 1, ty - 1, 2, 2);
          }
          ctx.fillStyle = `rgba(${PAPER},0.85)`;
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(${PAPER},0.08)`;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        for (let f = flashes.length - 1; f >= 0; f--) {
          const fl = flashes[f];
          fl.age += dt;
          const life = fl.kind === 'drop' ? 0.9 : 1.2;
          if (fl.age > life) {
            flashes.splice(f, 1);
            continue;
          }
          const k = fl.age / life;
          const color = fl.kind === 'drop' ? ALARM : SIGNAL;
          ctx.strokeStyle = `rgba(${color},${(1 - k) * 0.55})`;
          if (fl.kind === 'drop') {
            const r = 3 + k * 4;
            ctx.beginPath();
            ctx.moveTo(fl.x - r, fl.y - r);
            ctx.lineTo(fl.x + r, fl.y + r);
            ctx.moveTo(fl.x + r, fl.y - r);
            ctx.lineTo(fl.x - r, fl.y + r);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(fl.x, fl.y, 3 + k * 14, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!document.hidden) draw(now);
    };
    if (reduced) draw(performance.now());
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
      style={{
        opacity: dim ? 0.55 : 1,
        maskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, #000 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, #000 40%, transparent 100%)',
      }}
    />
  );
}
