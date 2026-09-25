import { inSubnet, isIPv4, matchesCidr } from './ip';
import type { Device, DeviceId, Interface, LinkId, NetState, Proto } from './types';

export type DropReason =
  | 'src-down'
  | 'no-carrier'
  | 'no-address'
  | 'no-gateway'
  | 'gateway-off-subnet'
  | 'arp-fail'
  | 'no-route'
  | 'fw-deny'
  | 'ttl-expired'
  | 'not-forwarding'
  | 'reply-lost';

export interface L3Hop {
  device: DeviceId;
  ip: string;
}

export interface Traversal {
  status: 'delivered' | 'dropped' | 'expired';
  /** Every device the packet touched, switches included. */
  path: DeviceId[];
  /** Layer-3 devices entered after the origin, with the ingress address. */
  l3: L3Hop[];
  at: DeviceId;
  reason?: DropReason;
  /** Device that would generate an ICMP error for this drop, if any. */
  reporter?: L3Hop;
  latency: number;
  /** Probability (0–1) that this traversal loses the packet. */
  loss: number;
  conflict: boolean;
}

export interface TraverseOptions {
  proto: Proto;
  port?: number;
  ttl?: number;
  /** Reply traffic of an allowed flow; the stateful firewall passes it. */
  reply?: boolean;
  srcIp?: string;
  /** When several devices answer ARP for the same address, the one the reply was meant for. */
  expect?: DeviceId;
}

const PROCESSING_MS = 0.12;

const otherEnd = (state: NetState, link: LinkId, from: DeviceId): DeviceId =>
  state.links[link].a === from ? state.links[link].b : state.links[link].a;

export const primaryIface = (d: Device): Interface | undefined => d.interfaces[0];

export function deviceOwning(state: NetState, ip: string): Device[] {
  return Object.values(state.devices).filter((d) => d.powered && d.interfaces.some((i) => i.ip === ip));
}

const combineLoss = (a: number, b: number) => 1 - (1 - a) * (1 - b);

interface Segment {
  owners: { device: DeviceId; iface: Interface }[];
  via: DeviceId[];
  latency: number;
  loss: number;
}

/**
 * ARP for `target` out of `iface` on `from`: walks the broadcast domain across
 * powered switches and up links, returning every powered interface holding the address.
 */
export function arpResolve(state: NetState, from: DeviceId, iface: Interface, target: string): Segment {
  const empty: Segment = { owners: [], via: [], latency: 0, loss: 0 };
  const first = state.links[iface.link];
  if (!first.up) return empty;

  const owners: Segment['owners'] = [];
  let bestVia: DeviceId[] = [];
  let latency = 0;
  let loss = 0;

  const queue: { device: DeviceId; via: DeviceId[]; latency: number; loss: number; link: LinkId }[] = [
    { device: otherEnd(state, first.id, from), via: [], latency: first.latencyMs, loss: first.lossPct / 100, link: first.id },
  ];
  const seen = new Set<DeviceId>([from]);

  while (queue.length) {
    const node = queue.shift()!;
    if (seen.has(node.device)) continue;
    seen.add(node.device);
    const dev = state.devices[node.device];
    if (!dev.powered) continue;

    if (dev.kind === 'switch') {
      for (const link of Object.values(state.links)) {
        if (!link.up || link.id === node.link) continue;
        if (link.a !== dev.id && link.b !== dev.id) continue;
        queue.push({
          device: otherEnd(state, link.id, dev.id),
          via: [...node.via, dev.id],
          latency: node.latency + link.latencyMs,
          loss: combineLoss(node.loss, link.lossPct / 100),
          link: link.id,
        });
      }
      continue;
    }

    const match = dev.interfaces.find((i) => i.link === node.link && i.ip === target);
    if (match) {
      if (!owners.length) {
        bestVia = node.via;
        latency = node.latency;
        loss = node.loss;
      }
      owners.push({ device: dev.id, iface: match });
    }
  }

  return { owners, via: bestVia, latency, loss };
}

/** Every powered layer-3 endpoint sharing the broadcast domain of `iface` (used by DHCP DISCOVER). */
export function broadcastDomain(state: NetState, from: DeviceId, iface: Interface): { device: DeviceId; iface: Interface }[] {
  const members: { device: DeviceId; iface: Interface }[] = [];
  if (!state.links[iface.link].up) return members;
  const queue: { device: DeviceId; link: LinkId }[] = [{ device: otherEnd(state, iface.link, from), link: iface.link }];
  const seen = new Set<DeviceId>([from]);
  while (queue.length) {
    const node = queue.shift()!;
    if (seen.has(node.device)) continue;
    seen.add(node.device);
    const dev = state.devices[node.device];
    if (!dev.powered) continue;
    if (dev.kind === 'switch') {
      for (const link of Object.values(state.links)) {
        if (link.up && link.id !== node.link && (link.a === dev.id || link.b === dev.id)) {
          queue.push({ device: otherEnd(state, link.id, dev.id), link: link.id });
        }
      }
      continue;
    }
    const match = dev.interfaces.find((i) => i.link === node.link);
    if (match) members.push({ device: dev.id, iface: match });
  }
  return members;
}

interface RouteDecision {
  iface: Interface;
  nextHop: string;
}

export function routeLookup(state: NetState, dev: Device, dst: string): RouteDecision | null {
  let best: (RouteDecision & { len: number }) | null = null;
  const live = dev.interfaces.filter((i) => i.ip && state.links[i.link].up);

  for (const iface of live) {
    if (inSubnet(dst, iface.ip, iface.prefix) && (!best || iface.prefix > best.len)) {
      best = { iface, nextHop: dst, len: iface.prefix };
    }
  }
  for (const route of dev.routes) {
    if (!inSubnet(dst, route.network, route.prefix)) continue;
    const egress = live.find((i) => inSubnet(route.via, i.ip, i.prefix));
    if (!egress) continue;
    if (!best || route.prefix > best.len) best = { iface: egress, nextHop: route.via, len: route.prefix };
  }
  return best ? { iface: best.iface, nextHop: best.nextHop } : null;
}

export function firewallVerdict(state: NetState, src: string, dst: string, proto: Proto, port?: number) {
  for (const rule of state.firewall) {
    if (rule.proto !== 'ip' && rule.proto !== proto) continue;
    if (!matchesCidr(src, rule.src) || !matchesCidr(dst, rule.dst)) continue;
    if (rule.port !== undefined && rule.port !== port) continue;
    return rule;
  }
  return null;
}

/** Forwards a single packet hop by hop until it is delivered, dropped or its TTL expires. */
export function traverse(state: NetState, origin: DeviceId, dst: string, opts: TraverseOptions): Traversal {
  const originDev = state.devices[origin];
  const result: Traversal = {
    status: 'dropped',
    path: [origin],
    l3: [],
    at: origin,
    latency: 0,
    loss: 0,
    conflict: false,
  };
  const drop = (reason: DropReason, reporter?: L3Hop): Traversal => ({ ...result, status: 'dropped', reason, reporter });

  if (!originDev.powered) return drop('src-down');
  const srcIp = opts.srcIp ?? primaryIface(originDev)?.ip ?? '';
  let ttl = opts.ttl ?? originDev.ttl;
  let cur: Device = originDev;
  let ingress: Interface | undefined;

  for (let guard = 0; guard < 16; guard++) {
    if (cur.interfaces.some((i) => i.ip === dst)) {
      return { ...result, status: 'delivered', at: cur.id };
    }

    let decision: RouteDecision;
    if (cur.kind === 'host' || cur.kind === 'server') {
      if (cur.id !== origin) return drop('not-forwarding');
      const iface = primaryIface(cur);
      if (!iface || !iface.ip || iface.ip === '0.0.0.0') return drop('no-address');
      if (!state.links[iface.link].up) return drop('no-carrier');
      if (inSubnet(dst, iface.ip, iface.prefix)) {
        decision = { iface, nextHop: dst };
      } else {
        const gw = cur.host?.gateway ?? '';
        if (!gw) return drop('no-gateway');
        if (!inSubnet(gw, iface.ip, iface.prefix)) return drop('gateway-off-subnet');
        decision = { iface, nextHop: gw };
      }
    } else {
      const here: L3Hop = { device: cur.id, ip: ingress?.ip ?? '' };
      if (cur.kind === 'firewall' && !opts.reply) {
        const rule = firewallVerdict(state, srcIp, dst, opts.proto, opts.port);
        if (rule?.action === 'deny') return drop('fw-deny', here);
      }
      if (cur.id !== origin) {
        ttl -= 1;
        if (ttl <= 0) return { ...result, status: 'expired', reporter: here };
      }
      const found = routeLookup(state, cur, dst);
      if (!found) return drop('no-route', here);
      decision = found;
    }

    const seg = arpResolve(state, cur.id, decision.iface, decision.nextHop);
    if (!seg.owners.length) {
      return drop('arp-fail', { device: cur.id, ip: cur.id === origin ? srcIp : ingress?.ip ?? '' });
    }
    let owner = seg.owners[0];
    if (seg.owners.length > 1) {
      result.conflict = true;
      owner = seg.owners.find((o) => o.device === opts.expect) ?? owner;
      // Competing ARP replies poison caches: roughly half the frames go to the wrong station.
      result.loss = combineLoss(result.loss, 0.5);
    }

    result.path = [...result.path, ...seg.via, owner.device];
    result.latency += seg.latency + PROCESSING_MS;
    result.loss = combineLoss(result.loss, seg.loss);
    cur = state.devices[owner.device];
    ingress = owner.iface;
    result.at = cur.id;
    result.l3 = [...result.l3, { device: cur.id, ip: owner.iface.ip }];
  }
  return drop('ttl-expired');
}

export type ServiceState = 'open' | 'closed' | 'refused' | 'n/a';

export interface ProbeResult {
  ok: boolean;
  target: string;
  forward: Traversal;
  reverse?: Traversal;
  dst?: DeviceId;
  rtt: number;
  /** Expected loss for a single echo, 0–1. */
  loss: number;
  replyTtl: number;
  reason?: DropReason;
  /** ICMP error message that made it back to the sender, if any. */
  icmpError?: { from: string; text: string };
  service: ServiceState;
}

const PORT_SERVICE: Record<string, 'dns' | 'http' | 'dhcp'> = {
  'udp/53': 'dns',
  'tcp/80': 'http',
  'udp/67': 'dhcp',
};

function icmpErrorText(reason: DropReason): string | null {
  if (reason === 'no-route') return 'Destination net unreachable.';
  if (reason === 'arp-fail') return 'Destination host unreachable.';
  return null;
}

/** Round trip: request, reply and any ICMP error that can find its way home. */
export function probe(state: NetState, src: DeviceId, target: string, proto: Proto = 'icmp', port?: number): ProbeResult {
  const srcDev = state.devices[src];
  const srcIp = primaryIface(srcDev)?.ip ?? '';
  const forward = traverse(state, src, target, { proto, port });
  const base: ProbeResult = {
    ok: false,
    target,
    forward,
    rtt: 0,
    loss: 1,
    replyTtl: 0,
    reason: forward.reason,
    service: 'n/a',
  };

  if (forward.status !== 'delivered') {
    const errText = forward.reason ? icmpErrorText(forward.reason) : null;
    if (forward.reporter && errText) {
      if (forward.reporter.device === src) {
        return { ...base, icmpError: { from: srcIp, text: errText } };
      }
      const back = traverse(state, forward.reporter.device, srcIp, { proto: 'icmp', reply: true, srcIp: forward.reporter.ip, expect: src });
      if (back.status === 'delivered' && back.at === src) {
        return { ...base, icmpError: { from: forward.reporter.ip, text: errText } };
      }
    }
    return base;
  }

  const dstDev = state.devices[forward.at];
  let service: ServiceState = 'n/a';
  if (proto !== 'icmp') {
    const svc = PORT_SERVICE[`${proto}/${port}`];
    const running = svc ? !!dstDev.services[svc] : false;
    service = running ? 'open' : proto === 'tcp' ? 'refused' : 'closed';
  }

  const reverse = traverse(state, dstDev.id, srcIp, { proto, port, reply: true, srcIp: target, expect: src });
  if (reverse.status !== 'delivered' || reverse.at !== src) {
    return { ...base, reverse, dst: dstDev.id, reason: 'reply-lost', service };
  }
  const routersBack = reverse.l3.filter((h) => state.devices[h.device].kind === 'router' || state.devices[h.device].kind === 'firewall').length;
  const loss = combineLoss(forward.loss, reverse.loss);
  return {
    ...base,
    ok: true,
    reverse,
    dst: dstDev.id,
    rtt: forward.latency + reverse.latency,
    loss,
    replyTtl: dstDev.ttl - routersBack,
    reason: undefined,
    service,
  };
}

export interface ResolveResult {
  ok: boolean;
  name: string;
  ip?: string;
  server?: string;
  failure?: 'no-server' | 'timeout' | 'nxdomain';
}

export function resolveName(state: NetState, src: DeviceId, name: string): ResolveResult {
  const clean = name.trim().toLowerCase();
  if (isIPv4(clean)) return { ok: true, name: clean, ip: clean };
  const server = state.devices[src].host?.dns ?? '';
  if (!server) return { ok: false, name: clean, failure: 'no-server' };
  const query = probe(state, src, server, 'udp', 53);
  if (!query.ok || query.service !== 'open') return { ok: false, name: clean, server, failure: 'timeout' };
  const ip = state.dns[clean] ?? state.dns[`${clean}.lab.local`];
  if (!ip) return { ok: false, name: clean, server, failure: 'nxdomain' };
  return { ok: true, name: clean, ip, server };
}

export interface TraceHop {
  ttl: number;
  ip?: string;
  device?: DeviceId;
  rtt: number;
  kind: 'hop' | 'dest' | 'timeout' | 'unreachable';
  note?: string;
}

/** ICMP traceroute: raises TTL until the destination answers or the trace stalls. */
export function traceroute(state: NetState, src: DeviceId, target: string, maxHops = 8): { hops: TraceHop[]; complete: boolean } {
  const srcIp = primaryIface(state.devices[src])?.ip ?? '';
  const hops: TraceHop[] = [];
  let silent = 0;

  for (let ttl = 1; ttl <= maxHops; ttl++) {
    const fwd = traverse(state, src, target, { proto: 'icmp', ttl });

    if (fwd.status === 'dropped' && fwd.reporter?.device === src && fwd.reason === 'arp-fail') {
      hops.push({ ttl, ip: srcIp, device: src, rtt: 0, kind: 'unreachable', note: 'reports: Destination host unreachable.' });
      return { hops, complete: true };
    }

    const responder = fwd.status === 'expired' ? fwd.reporter : fwd.status === 'delivered' ? { device: fwd.at, ip: target } : undefined;
    if (!responder) {
      const errText = fwd.reason ? icmpErrorText(fwd.reason) : null;
      if (fwd.reporter && errText && fwd.reporter.device !== src) {
        const back = traverse(state, fwd.reporter.device, srcIp, { proto: 'icmp', reply: true, srcIp: fwd.reporter.ip, expect: src });
        if (back.status === 'delivered') {
          hops.push({ ttl, ip: fwd.reporter.ip, device: fwd.reporter.device, rtt: fwd.latency + back.latency, kind: 'unreachable', note: `reports: ${errText}` });
          return { hops, complete: true };
        }
      }
      hops.push({ ttl, rtt: 0, kind: 'timeout' });
      silent++;
      if (silent >= 3) return { hops, complete: false };
      continue;
    }

    const back = traverse(state, responder.device, srcIp, { proto: 'icmp', reply: true, srcIp: responder.ip, expect: src });
    if (back.status !== 'delivered' || back.at !== src) {
      hops.push({ ttl, rtt: 0, kind: 'timeout' });
      silent++;
      if (silent >= 3) return { hops, complete: false };
      continue;
    }
    silent = 0;
    const done = fwd.status === 'delivered';
    hops.push({ ttl, ip: responder.ip, device: responder.device, rtt: fwd.latency + back.latency, kind: done ? 'dest' : 'hop' });
    if (done) return { hops, complete: true };
  }
  return { hops, complete: false };
}

/** Mulberry32: small deterministic PRNG so the terminal and tests can share one code path. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
