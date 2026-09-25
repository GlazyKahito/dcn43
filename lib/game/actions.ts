import {
  enableDhcp,
  removeFirewallRule,
  renewLease,
  restoreFirewall,
  restoreLinkQuality,
  setLinkUp,
  setService,
  setStatic,
  type StaticConfig,
} from '@/lib/sim/actions';
import { probe, resolveName } from '@/lib/sim/engine';
import { detectFaults } from '@/lib/sim/faults';
import { ADDR } from '@/lib/sim/topology';
import type { DeviceId, LinkId, NetState } from '@/lib/sim/types';
import type { IncidentMeta, VerifyKey } from './incidents';

export interface World {
  net: NetState;
  meta: IncidentMeta;
}

export type Repair =
  | { kind: 'reseat'; link: LinkId }
  | { kind: 'replace'; link: LinkId }
  | { kind: 'enable-interface'; link: LinkId }
  | { kind: 'restart-router' }
  | { kind: 'start-dhcp' }
  | { kind: 'restart-dns' }
  | { kind: 'restart-http' }
  | { kind: 'fw-delete'; rule: number }
  | { kind: 'fw-restore' }
  | { kind: 'pc-static'; pc: DeviceId; cfg: StaticConfig }
  | { kind: 'pc-dhcp'; pc: DeviceId };

export const faultCount = (w: World) => detectFaults(w.net).length;

/** Applies a physical or configuration repair. Only the right action for the right cause changes anything. */
export function applyRepair(w: World, r: Repair): World {
  const meta = { adminDown: [...w.meta.adminDown] };
  switch (r.kind) {
    case 'reseat':
      // Reseating fixes an unplugged cable, but not a shut interface or a damaged one.
      if (!w.net.links[r.link].up && !meta.adminDown.includes(r.link)) return { net: setLinkUp(w.net, r.link, true), meta };
      return w;
    case 'replace': {
      let net = w.net;
      if (net.links[r.link].lossPct > 0) net = restoreLinkQuality(net, r.link);
      if (!net.links[r.link].up && !meta.adminDown.includes(r.link)) net = setLinkUp(net, r.link, true);
      return { net, meta };
    }
    case 'enable-interface':
      if (meta.adminDown.includes(r.link)) {
        return { net: setLinkUp(w.net, r.link, true), meta: { adminDown: meta.adminDown.filter((l) => l !== r.link) } };
      }
      return w;
    case 'restart-router':
      // Running configuration survives a reload: shut interfaces and stopped services stay that way.
      return w;
    case 'start-dhcp':
      return { net: setService(w.net, 'R1', 'dhcp', true), meta };
    case 'restart-dns':
      return { net: setService(w.net, 'SRV1', 'dns', true), meta };
    case 'restart-http':
      return { net: setService(w.net, 'SRV1', 'http', true), meta };
    case 'fw-delete':
      return { net: removeFirewallRule(w.net, r.rule), meta };
    case 'fw-restore':
      return { net: restoreFirewall(w.net), meta };
    case 'pc-static':
      return { net: setStatic(w.net, r.pc, r.cfg), meta };
    case 'pc-dhcp':
      return { net: enableDhcp(w.net, r.pc).state, meta };
  }
}

export const renew = (w: World, pc: DeviceId) => {
  const out = renewLease(w.net, pc);
  return { world: { net: out.state, meta: w.meta }, ok: out.ok, message: out.message };
};

/** Which verification checks a command satisfies on the current network (only meaningful once repaired). */
export function verificationFrom(net: NetState, command: string): VerifyKey[] {
  const [cmd, ...args] = command.trim().toLowerCase().split(/\s+/);
  const target = args.find((a) => !a.startsWith('-'));
  const keys: VerifyKey[] = [];
  if (cmd === 'ping' && target) {
    const r = resolveName(net, 'PC1', target);
    if (!r.ok || !r.ip) return keys;
    const p = probe(net, 'PC1', r.ip);
    if (!p.ok || p.loss > 0) return keys;
    if (r.ip === ADDR.gateway) keys.push('gateway');
    if (r.ip === ADDR.server) keys.push('server');
    if (!/^\d/.test(target)) keys.push('dns');
  }
  if (cmd === 'nslookup' && target && resolveName(net, 'PC1', target).ok) keys.push('dns');
  if (cmd === 'curl' && target) {
    const r = resolveName(net, 'PC1', target.replace(/^https?:\/\//, '').replace(/\/.*$/, ''));
    if (r.ok && r.ip) {
      const p = probe(net, 'PC1', r.ip, 'tcp', 80);
      if (p.ok && p.service === 'open') keys.push('http', 'dns');
    }
  }
  return keys;
}

export const VERIFY_LABEL: Record<VerifyKey, string> = {
  gateway: 'ping 192.168.1.1',
  server: 'ping 172.16.0.10',
  dns: 'nslookup www.lab.local',
  http: 'curl http://www.lab.local',
};
