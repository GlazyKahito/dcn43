import type { DeviceId, LinkId } from '@/lib/sim/types';

export const WORLD = { w: 1600, h: 1000 };
export const SPAWN = { x: 720, y: 660 };
export const PLAYER_R = 13;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type StationId = 'pc1' | 'pc2' | 'switch' | 'router' | 'firewall' | 'server' | 'patch' | 'monitor' | 'terminal' | 'console';

export type StationKind = 'desk' | 'rack' | 'wall-panel' | 'wall-screen' | 'console';

export interface Station {
  id: StationId;
  label: string;
  verb: string;
  kind: StationKind;
  box: Box;
  device?: DeviceId;
}

const T = 28; // wall thickness

export const WALLS: Box[] = [
  { x: 0, y: 0, w: WORLD.w, h: T },
  { x: 0, y: WORLD.h - T, w: WORLD.w, h: T },
  { x: 0, y: 0, w: T, h: WORLD.h },
  { x: WORLD.w - T, y: 0, w: T, h: WORLD.h },
  // partition between the lab floor and the server room, doorway at y 420–560
  { x: 1040, y: T, w: 22, h: 392 },
  { x: 1040, y: 568, w: 22, h: WORLD.h - 568 - T },
];

export const STATIONS: Station[] = [
  { id: 'pc1', label: 'PC-01', verb: 'Inspect PC-01', kind: 'desk', box: { x: 110, y: 150, w: 210, h: 86 }, device: 'PC1' },
  { id: 'pc2', label: 'PC-02', verb: 'Inspect PC-02', kind: 'desk', box: { x: 110, y: 640, w: 210, h: 86 }, device: 'PC2' },
  { id: 'patch', label: 'Patch panel', verb: 'Inspect patch panel', kind: 'wall-panel', box: { x: 370, y: T, w: 190, h: 46 } },
  { id: 'monitor', label: 'Network monitor', verb: 'Read network monitor', kind: 'wall-screen', box: { x: 640, y: T, w: 280, h: 58 } },
  { id: 'switch', label: 'SW-01', verb: 'Inspect switch SW-01', kind: 'rack', box: { x: 470, y: 400, w: 92, h: 140 }, device: 'SW1' },
  { id: 'router', label: 'Router R1', verb: 'Inspect router R1', kind: 'rack', box: { x: 820, y: 400, w: 92, h: 140 }, device: 'R1' },
  { id: 'terminal', label: 'Virtual terminal', verb: 'Use virtual terminal', kind: 'desk', box: { x: 380, y: 880, w: 230, h: 92 } },
  { id: 'console', label: 'Control console', verb: 'Open control console', kind: 'console', box: { x: 700, y: 880, w: 250, h: 92 } },
  { id: 'firewall', label: 'Firewall FW1', verb: 'Inspect firewall FW1', kind: 'rack', box: { x: 1170, y: 250, w: 92, h: 140 }, device: 'FW1' },
  { id: 'server', label: 'SERVER-01', verb: 'Inspect SERVER-01', kind: 'rack', box: { x: 1390, y: 430, w: 112, h: 180 }, device: 'SRV1' },
];

/** Non-interactive furniture that still blocks movement. */
export const PROPS: Box[] = [
  { x: 1390, y: 700, w: 112, h: 150 }, // spare rack
  { x: 1170, y: 720, w: 92, h: 120 }, // UPS cabinet
];

export const SOLIDS: Box[] = [...WALLS, ...STATIONS.map((s) => s.box), ...PROPS];

/** Floor cable runs; each follows the tray from port to port. */
export const CABLES: { link: LinkId; run: string; pts: [number, number][] }[] = [
  { link: 'PC1-SW1', run: '01', pts: [[320, 200], [410, 200], [410, 440], [470, 440]] },
  { link: 'PC2-SW1', run: '02', pts: [[320, 682], [410, 682], [410, 505], [470, 505]] },
  { link: 'SW1-R1', run: '03', pts: [[562, 470], [820, 470]] },
  { link: 'R1-FW1', run: '04', pts: [[912, 470], [1110, 470], [1110, 320], [1170, 320]] },
  { link: 'FW1-SRV1', run: '05', pts: [[1262, 320], [1330, 320], [1330, 520], [1390, 520]] },
];

export const RUN_LABEL: Record<LinkId, string> = {
  'PC1-SW1': 'PC-01 ↔ SW-01 Fa0/1',
  'PC2-SW1': 'PC-02 ↔ SW-01 Fa0/2',
  'SW1-R1': 'SW-01 Gi0/24 ↔ R1 G0/0',
  'R1-FW1': 'R1 G0/1 ↔ FW1 outside',
  'FW1-SRV1': 'FW1 inside ↔ SERVER-01 eth0',
};

export function distToBox(px: number, py: number, b: Box): number {
  const dx = Math.max(b.x - px, 0, px - (b.x + b.w));
  const dy = Math.max(b.y - py, 0, py - (b.y + b.h));
  return Math.hypot(dx, dy);
}

/** Moves a circle by (dx, dy), resolving each axis separately so the player slides along obstacles. */
export function moveWithCollision(x: number, y: number, dx: number, dy: number, r = PLAYER_R): { x: number; y: number } {
  const hits = (cx: number, cy: number) => SOLIDS.some((b) => distToBox(cx, cy, b) < r);
  let nx = x + dx;
  if (hits(nx, y)) nx = x;
  let ny = y + dy;
  if (hits(nx, ny)) ny = y;
  return { x: nx, y: ny };
}

export const INTERACT_RANGE = 46;

export function nearestStation(x: number, y: number): Station | null {
  let best: Station | null = null;
  let bestD = INTERACT_RANGE;
  for (const s of STATIONS) {
    const d = distToBox(x, y, s.box);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}
