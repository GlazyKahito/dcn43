'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import { BASE_LATENCY } from '@/lib/sim/topology';
import type { DeviceId, LinkId, NetState } from '@/lib/sim/types';
import type { IncidentMeta } from '@/lib/game/incidents';
import { CABLES, PLAYER_R, SPAWN, STATIONS, WALLS, PROPS, WORLD, moveWithCollision, nearestStation, type Station } from '@/lib/game/world';

export interface MoveInput {
  x: number;
  y: number;
}

interface Props {
  net: NetState;
  meta: IncidentMeta;
  /** Movement and interaction are live only while true. */
  active: boolean;
  /** Success sequence: every link lights and carries traffic. */
  restored: boolean;
  focus: Station['id'] | null;
  touch: MutableRefObject<MoveInput>;
  interactSignal: number;
  onNear: (s: Station | null) => void;
  onInteract: (s: Station) => void;
}

const C = {
  floor: '#0d0f10',
  floorServer: '#101315',
  grid: 'rgba(232,228,218,0.035)',
  wall: '#1b1e20',
  wallEdge: '#30363a',
  body: '#15181a',
  edge: '#33393c',
  label: 'rgba(185,188,189,0.75)',
  signal: '#5fae8a',
  amber: '#d6a24e',
  alarm: '#d0584b',
  paper: '#e8e4da',
};

const PORTS: Record<DeviceId, LinkId[]> = {
  PC1: ['PC1-SW1'],
  PC2: ['PC2-SW1'],
  SW1: ['PC1-SW1', 'PC2-SW1', 'SW1-R1'],
  R1: ['SW1-R1', 'R1-FW1'],
  FW1: ['R1-FW1', 'FW1-SRV1'],
  SRV1: ['FW1-SRV1'],
};

export function IncidentCanvas({ net, meta, active, restored, focus, touch, interactSignal, onNear, onInteract }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ net, meta, active, restored, focus });
  state.current = { net, meta, active, restored, focus };
  const player = useRef({ x: SPAWN.x, y: SPAWN.y, dir: -Math.PI / 2, step: 0, moving: false });
  const keys = useRef(new Set<string>());
  const nearRef = useRef<Station | null>(null);
  const cbs = useRef({ onNear, onInteract });
  cbs.current = { onNear, onInteract };

  // Touch "E" button.
  useEffect(() => {
    if (interactSignal && nearRef.current && state.current.active) cbs.current.onInteract(nearRef.current);
  }, [interactSignal]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
        keys.current.add(k);
        if (k.startsWith('arrow')) e.preventDefault();
      }
      if (k === 'e' && state.current.active && nearRef.current) {
        e.preventDefault();
        keys.current.clear();
        cbs.current.onInteract(nearRef.current);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const mono = getComputedStyle(document.body).getPropertyValue('--font-mono') || 'monospace';
    const display = getComputedStyle(document.body).getPropertyValue('--font-display') || 'sans-serif';
    let vw = 0;
    let vh = 0;
    let zoom = 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cam = { x: SPAWN.x, y: SPAWN.y };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      vw = r.width;
      vh = r.height;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      zoom = Math.max(0.62, Math.min(1.35, Math.min(vw / 1150, vh / 740)));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let prev = performance.now();
    const leds: { x: number; y: number; c: string }[] = [];

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0, Math.min(now - prev, 50)) / 1000;
      prev = now;
      const s = state.current;
      const p = player.current;

      // movement
      let mx = 0;
      let my = 0;
      if (s.active) {
        const k = keys.current;
        if (k.has('w') || k.has('arrowup')) my -= 1;
        if (k.has('s') || k.has('arrowdown')) my += 1;
        if (k.has('a') || k.has('arrowleft')) mx -= 1;
        if (k.has('d') || k.has('arrowright')) mx += 1;
        mx += touch.current.x;
        my += touch.current.y;
      }
      const mag = Math.hypot(mx, my);
      p.moving = mag > 0.05;
      if (p.moving) {
        const speed = (keys.current.has('shift') ? 290 : 175) * Math.min(1, mag);
        const nx = (mx / mag) * speed * dt;
        const ny = (my / mag) * speed * dt;
        const moved = moveWithCollision(p.x, p.y, nx, ny);
        p.x = moved.x;
        p.y = moved.y;
        const target = Math.atan2(my, mx);
        let diff = target - p.dir;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        p.dir += diff * Math.min(1, dt * 14);
        p.step += dt * speed * 0.06;
      }

      const near = s.active ? nearestStation(p.x, p.y) : null;
      if (near?.id !== nearRef.current?.id) {
        nearRef.current = near;
        cbs.current.onNear(near);
      }

      // camera
      const viewW = vw / zoom;
      const viewH = vh / zoom;
      const tx = viewW >= WORLD.w ? WORLD.w / 2 : Math.max(viewW / 2, Math.min(WORLD.w - viewW / 2, p.x));
      const ty = viewH >= WORLD.h ? WORLD.h / 2 : Math.max(viewH / 2, Math.min(WORLD.h - viewH / 2, p.y));
      cam.x += (tx - cam.x) * Math.min(1, dt * 6);
      cam.y += (ty - cam.y) * Math.min(1, dt * 6);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#060707';
      ctx.fillRect(0, 0, vw, vh);
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (vw / 2 - cam.x * zoom), dpr * (vh / 2 - cam.y * zoom));
      leds.length = 0;

      drawFloor(ctx, mono);
      drawCables(ctx, s.net, s.meta, s.restored, now);
      for (const w of WALLS) drawWall(ctx, w.x, w.y, w.w, w.h);
      for (const b of PROPS) drawProp(ctx, b.x, b.y, b.w, b.h);
      for (const st of STATIONS) drawStation(ctx, st, s.net, s.restored, now, near?.id === st.id || s.focus === st.id, mono, leds);
      drawPlayer(ctx, p, now);

      // lighting: the room is dim, the technician carries the light
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sx = vw / 2 + (p.x - cam.x) * zoom;
      const sy = vh / 2 + (p.y - cam.y) * zoom;
      const g = ctx.createRadialGradient(sx, sy, 70 * zoom, sx, sy, Math.max(vw, vh) * 0.62);
      g.addColorStop(0, 'rgba(4,5,6,0)');
      g.addColorStop(1, s.restored ? 'rgba(4,5,6,0.35)' : 'rgba(4,5,6,0.66)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, vw, vh);

      // indicator lamps shine through the dark
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (vw / 2 - cam.x * zoom), dpr * (vh / 2 - cam.y * zoom));
      for (const l of leds) {
        ctx.fillStyle = l.c;
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillRect(l.x - 1.5, l.y - 1.5, 3, 3);
      }
      void display;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [touch]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-label="Network laboratory. Move with W A S D, interact with E." role="img" />;
}

function drawFloor(ctx: CanvasRenderingContext2D, mono: string) {
  ctx.fillStyle = C.floor;
  ctx.fillRect(0, 0, 1062, WORLD.h);
  ctx.fillStyle = C.floorServer;
  ctx.fillRect(1062, 0, WORLD.w - 1062, WORLD.h);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= 1062; x += 40) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD.h);
  }
  for (let y = 0; y <= WORLD.h; y += 40) {
    ctx.moveTo(0, y);
    ctx.lineTo(1062, y);
  }
  ctx.stroke();
  // raised-floor tiles with perforations in the server room
  ctx.strokeStyle = 'rgba(232,228,218,0.05)';
  ctx.beginPath();
  for (let x = 1062; x <= WORLD.w; x += 60) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD.h);
  }
  for (let y = 0; y <= WORLD.h; y += 60) {
    ctx.moveTo(1062, y);
    ctx.lineTo(WORLD.w, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,228,218,0.035)';
  for (let x = 1072; x < WORLD.w; x += 12) for (let y = 10; y < WORLD.h; y += 12) ctx.fillRect(x, y, 1.2, 1.2);

  // doorway threshold stripes
  ctx.save();
  ctx.beginPath();
  ctx.rect(1040, 420, 22, 148);
  ctx.clip();
  ctx.strokeStyle = 'rgba(214,162,78,0.35)';
  ctx.lineWidth = 5;
  for (let y = 400; y < 600; y += 14) {
    ctx.beginPath();
    ctx.moveTo(1036, y);
    ctx.lineTo(1066, y + 22);
    ctx.stroke();
  }
  ctx.restore();

  ctx.font = `10px ${mono}`;
  ctx.fillStyle = 'rgba(232,228,218,0.18)';
  ctx.fillText('LAB 2B · NETWORK OPERATIONS', 60, 110);
  ctx.fillText('SERVER ROOM · AUTHORISED ACCESS ONLY', 1090, 660);
  ctx.fillText('CABLE TRAY', 600, 460);
}

function strokePath(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
  ctx.stroke();
}

function pointAlong(pts: [number, number][], t: number): [number, number] {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = t * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const f = d / lens[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
}

function drawCables(ctx: CanvasRenderingContext2D, net: NetState, meta: IncidentMeta, restored: boolean, now: number) {
  for (const c of CABLES) {
    const link = net.links[c.link];
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#121416';
    ctx.lineWidth = 7;
    strokePath(ctx, c.pts);
    ctx.lineWidth = 2;
    ctx.strokeStyle = restored ? 'rgba(95,174,138,0.75)' : '#3b4144';
    // An unplugged cable leaves a visible break near its far end; a shut interface does not.
    if (!link.up && !meta.adminDown.includes(c.link)) {
      const cut = c.pts.slice(0, -1);
      const [lx, ly] = c.pts[c.pts.length - 1];
      const [px, py] = cut[cut.length - 1];
      const ang = Math.atan2(ly - py, lx - px);
      const end: [number, number] = [lx - Math.cos(ang) * 26, ly - Math.sin(ang) * 26];
      strokePath(ctx, [...cut, end]);
      ctx.fillStyle = '#5a6063';
      ctx.fillRect(end[0] - 3, end[1] - 3, 6, 6);
    } else {
      strokePath(ctx, c.pts);
    }
    if (restored && link.up) {
      for (let k = 0; k < 3; k++) {
        const t = ((now / 1600 + k / 3 + c.pts[0][0] / 997) % 1 + 1) % 1;
        const [x, y] = pointAlong(c.pts, t);
        ctx.fillStyle = C.paper;
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    void BASE_LATENCY;
  }
}

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = C.wall;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.wallEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawProp(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#121416';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#272c2f';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = 'rgba(232,228,218,0.05)';
  for (let yy = y + 10; yy < y + h; yy += 10) {
    ctx.beginPath();
    ctx.moveTo(x + 6, yy);
    ctx.lineTo(x + w - 6, yy);
    ctx.stroke();
  }
}

function portColor(net: NetState, link: LinkId, restored: boolean, now: number, seed: number): string | null {
  const l = net.links[link];
  const a = net.devices[l.a];
  const b = net.devices[l.b];
  if (!l.up || !a.powered || !b.powered) return null;
  if (l.lossPct > 0 && !restored) return Math.sin(now / 90 + seed) > 0 ? C.amber : null;
  return Math.sin(now / (140 + seed * 13) + seed) > -0.6 ? C.signal : 'rgba(95,174,138,0.35)';
}

function drawStation(
  ctx: CanvasRenderingContext2D,
  st: Station,
  net: NetState,
  restored: boolean,
  now: number,
  hot: boolean,
  mono: string,
  leds: { x: number; y: number; c: string }[],
) {
  const { x, y, w, h } = st.box;
  ctx.fillStyle = C.body;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = hot ? 'rgba(95,174,138,0.8)' : C.edge;
  ctx.lineWidth = hot ? 1.5 : 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(x + 1, y + 1, w - 2, 5);

  if (st.kind === 'desk' || st.kind === 'console') {
    const screens = st.kind === 'console' ? 3 : 1;
    const sw = st.kind === 'console' ? 60 : 84;
    for (let i = 0; i < screens; i++) {
      const sx = x + (w - screens * sw - (screens - 1) * 12) / 2 + i * (sw + 12);
      const sy = st.id === 'terminal' || st.kind === 'console' ? y + 12 : y + 10;
      ctx.fillStyle = '#0a1411';
      ctx.fillRect(sx, sy, sw, 40);
      ctx.strokeStyle = '#2d3336';
      ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, 39);
      const dev = st.device ? net.devices[st.device] : null;
      const lit = !dev || dev.powered;
      ctx.fillStyle = lit ? 'rgba(95,174,138,0.55)' : 'rgba(95,174,138,0.1)';
      for (let r = 0; r < 4; r++) ctx.fillRect(sx + 6, sy + 7 + r * 8, (sw - 14) * (0.4 + ((r * 37 + i * 11) % 50) / 100), 2);
      if (lit) leds.push({ x: sx + sw - 6, y: sy + 34, c: C.signal });
    }
    // keyboard + chair
    ctx.fillStyle = '#1d2124';
    ctx.fillRect(x + w / 2 - 34, y + h - 26, 68, 12);
    ctx.fillStyle = '#16191b';
    ctx.strokeStyle = '#2a2f32';
    ctx.beginPath();
    const chairY = st.id === 'terminal' || st.kind === 'console' ? y - 26 : y + h + 26;
    ctx.arc(x + w / 2, chairY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (st.kind === 'rack') {
    ctx.strokeStyle = 'rgba(232,228,218,0.06)';
    for (let yy = y + 14; yy < y + h - 6; yy += 12) {
      ctx.beginPath();
      ctx.moveTo(x + 8, yy);
      ctx.lineTo(x + w - 8, yy);
      ctx.stroke();
    }
    ctx.fillStyle = '#0c0e0f';
    ctx.fillRect(x + 8, y + 22, w - 16, 26);
    const dev = st.device ? net.devices[st.device] : null;
    if (dev) {
      leds.push({ x: x + w - 14, y: y + 14, c: dev.powered ? C.signal : C.alarm });
      PORTS[dev.id].forEach((link, i) => {
        const c = portColor(net, link, restored, now, i + x);
        if (c) leds.push({ x: x + 16 + i * 10, y: y + 35, c });
        else {
          ctx.fillStyle = '#23282b';
          ctx.fillRect(x + 14.5 + i * 10, y + 33.5, 3, 3);
        }
      });
    }
  }

  if (st.kind === 'wall-panel') {
    for (let i = 0; i < 12; i++) {
      const px = x + 14 + i * 14;
      ctx.fillStyle = '#0b0d0e';
      ctx.fillRect(px, y + 16, 9, 9);
      const cable = [0, 1, 2, 3, 4][i];
      if (cable !== undefined && i < 5) {
        const link = CABLES[i].link;
        const c = portColor(net, link, restored, now, i);
        if (c) leds.push({ x: px + 4.5, y: y + 34, c });
      }
    }
  }

  if (st.kind === 'wall-screen') {
    ctx.fillStyle = '#081210';
    ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
    ctx.strokeStyle = restored ? C.signal : 'rgba(95,174,138,0.6)';
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const px = x + 12 + (i / 60) * (w - 24);
      const py = y + h / 2 + Math.sin(i * 0.5 + now / 300) * 7 * (restored ? 1 : 0.4) + (i % 7 === 0 ? -5 : 0);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // label
  ctx.font = `10px ${mono}`;
  ctx.fillStyle = hot ? C.paper : C.label;
  const text = st.label.toUpperCase();
  const tw = ctx.measureText(text).width;
  const ly = st.kind === 'wall-panel' || st.kind === 'wall-screen' ? y + h + 16 : st.id === 'terminal' || st.id === 'console' ? y - 48 : y + h + 16;
  const lyAdj = st.kind === 'desk' && st.id !== 'terminal' ? y + h + 54 : ly;
  ctx.fillText(text, x + w / 2 - tw / 2, lyAdj);
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: { x: number; y: number; dir: number; step: number; moving: boolean }, now: number) {
  const bob = p.moving ? Math.sin(p.step * 2) * 1.2 : Math.sin(now / 700) * 0.4;
  // headlamp
  const cone = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 160);
  cone.addColorStop(0, 'rgba(232,228,218,0.14)');
  cone.addColorStop(1, 'rgba(232,228,218,0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.arc(p.x, p.y, 160, p.dir - 0.42, p.dir + 0.42);
  ctx.closePath();
  ctx.fill();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(p.x + 2, p.y + 4, PLAYER_R + 3, PLAYER_R, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(p.x, p.y + bob * 0.3);
  ctx.rotate(p.dir + Math.PI / 2);
  // shoulders / jacket
  ctx.fillStyle = '#2b3033';
  ctx.strokeStyle = '#8f9496';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 2, PLAYER_R, PLAYER_R * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // reflective strip
  ctx.strokeStyle = 'rgba(214,162,78,0.8)';
  ctx.beginPath();
  ctx.moveTo(-PLAYER_R + 3, 5);
  ctx.lineTo(PLAYER_R - 3, 5);
  ctx.stroke();
  // head
  ctx.fillStyle = '#b9b4a8';
  ctx.beginPath();
  ctx.arc(0, -1, 6.5, 0, Math.PI * 2);
  ctx.fill();
  // lamp
  ctx.fillStyle = '#e8e4da';
  ctx.fillRect(-2, -9, 4, 3);
  ctx.restore();
}
