import { inSubnet, isApipa } from './ip';
import { ADDR, BASE_LATENCY, LINK_ORDER, cloneNet, createBaseline } from './topology';
import type { DeviceId, LinkId, NetState } from './types';

export type FaultKind =
  | 'link-down'
  | 'router-failure'
  | 'wrong-ip'
  | 'wrong-gateway'
  | 'dns-failure'
  | 'dhcp-failure'
  | 'firewall-block'
  | 'packet-loss'
  | 'high-latency'
  | 'duplicate-ip';

export type Layer = 'L1 Physical' | 'L2 Data Link' | 'L3 Network' | 'L4 Transport' | 'L7 Application';

export interface FaultDef {
  kind: FaultKind;
  label: string;
  layer: Layer;
  /** What the fault does to the simulated network, in operator terms. */
  effect: string;
  /** Links the fault can be applied to; the first entry is the default. */
  links?: LinkId[];
  inject: (state: NetState, link?: LinkId) => NetState;
}

export const INJECTED_RULE_ID = 5;

const mutate = (state: NetState, fn: (s: NetState) => void) => {
  const next = cloneNet(state);
  fn(next);
  return next;
};

export const FAULTS: FaultDef[] = [
  {
    kind: 'link-down',
    label: 'Broken link',
    layer: 'L1 Physical',
    effect: 'Removes carrier on the selected cable. Every frame crossing it is lost.',
    links: ['PC1-SW1', 'SW1-R1', 'R1-FW1', 'FW1-SRV1', 'PC2-SW1'],
    inject: (s, link = 'PC1-SW1') => mutate(s, (n) => void (n.links[link].up = false)),
  },
  {
    kind: 'router-failure',
    label: 'Router failure',
    layer: 'L3 Network',
    effect: 'Powers off R1. The LAN loses its gateway and its DHCP server.',
    inject: (s) => mutate(s, (n) => void (n.devices.R1.powered = false)),
  },
  {
    kind: 'wrong-ip',
    label: 'Wrong IP address',
    layer: 'L3 Network',
    effect: 'PC1 is statically set to 192.168.10.10/24, outside the 192.168.1.0/24 LAN.',
    inject: (s) =>
      mutate(s, (n) => {
        n.devices.PC1.interfaces[0].ip = '192.168.10.10';
        n.devices.PC1.interfaces[0].prefix = 24;
        n.devices.PC1.host = { mode: 'static', gateway: ADDR.gateway, dns: ADDR.server };
      }),
  },
  {
    kind: 'wrong-gateway',
    label: 'Wrong gateway',
    layer: 'L3 Network',
    effect: 'PC1 points its default route at 192.168.1.254, an address nobody owns.',
    inject: (s) =>
      mutate(s, (n) => {
        n.devices.PC1.interfaces[0].ip = ADDR.pc1;
        n.devices.PC1.interfaces[0].prefix = 24;
        n.devices.PC1.host = { mode: 'static', gateway: '192.168.1.254', dns: ADDR.server };
      }),
  },
  {
    kind: 'dns-failure',
    label: 'DNS failure',
    layer: 'L7 Application',
    effect: 'Stops named on SRV1. UDP/53 queries go unanswered; routing is untouched.',
    inject: (s) => mutate(s, (n) => void (n.devices.SRV1.services.dns = false)),
  },
  {
    kind: 'dhcp-failure',
    label: 'DHCP failure',
    layer: 'L7 Application',
    effect: 'Stops the DHCP service on R1. PC1 fails to renew and self-assigns an APIPA address.',
    inject: (s) =>
      mutate(s, (n) => {
        n.devices.R1.services.dhcp = false;
        n.devices.PC1.interfaces[0].ip = '169.254.37.112';
        n.devices.PC1.interfaces[0].prefix = 16;
        n.devices.PC1.host = { mode: 'dhcp', gateway: '', dns: '' };
      }),
  },
  {
    kind: 'firewall-block',
    label: 'Firewall block',
    layer: 'L4 Transport',
    effect: 'Inserts rule 5 on FW1: deny tcp 192.168.1.0/24 → 172.16.0.10 eq 80, above the HTTP permit.',
    inject: (s) =>
      mutate(s, (n) => {
        if (n.firewall.some((r) => r.id === INJECTED_RULE_ID)) return;
        n.firewall.unshift({
          id: INJECTED_RULE_ID,
          action: 'deny',
          proto: 'tcp',
          src: '192.168.1.0/24',
          dst: '172.16.0.10',
          port: 80,
          remark: 'CHG-2291 (unreviewed)',
        });
      }),
  },
  {
    kind: 'packet-loss',
    label: 'Packet loss',
    layer: 'L1 Physical',
    effect: 'Damaged patch cable: 35 % of frames on the selected link fail CRC and are discarded.',
    links: ['SW1-R1', 'R1-FW1', 'PC1-SW1', 'FW1-SRV1'],
    inject: (s, link = 'SW1-R1') => mutate(s, (n) => void (n.links[link].lossPct = 35)),
  },
  {
    kind: 'high-latency',
    label: 'High latency',
    layer: 'L3 Network',
    effect: 'Congested uplink: the selected link queues every packet for about 120 ms each way.',
    links: ['R1-FW1', 'SW1-R1', 'FW1-SRV1'],
    inject: (s, link = 'R1-FW1') => mutate(s, (n) => void (n.links[link].latencyMs = 120)),
  },
  {
    kind: 'duplicate-ip',
    label: 'Duplicate IP',
    layer: 'L2 Data Link',
    effect: 'PC2 is statically given 192.168.1.10, the address already leased to PC1.',
    inject: (s) =>
      mutate(s, (n) => {
        n.devices.PC2.interfaces[0].ip = ADDR.pc1;
        n.devices.PC2.host = { mode: 'static', gateway: ADDR.gateway, dns: ADDR.server };
      }),
  },
];

export const faultDef = (kind: FaultKind) => FAULTS.find((f) => f.kind === kind)!;

export type DetectedKind = FaultKind | 'device-down' | 'service-down';

export interface DetectedFault {
  kind: DetectedKind;
  where: DeviceId | LinkId;
  text: string;
}

/** Compares the live network against the reference build. Used for telemetry and to confirm recovery. */
export function detectFaults(state: NetState): DetectedFault[] {
  const out: DetectedFault[] = [];
  const base = createBaseline();

  for (const id of LINK_ORDER) {
    const link = state.links[id];
    if (!link.up) out.push({ kind: 'link-down', where: id, text: `Link ${id} has no carrier` });
    if (link.lossPct > 0) out.push({ kind: 'packet-loss', where: id, text: `Link ${id} dropping ${link.lossPct}% of frames` });
    if (link.latencyMs > BASE_LATENCY[id] * 5) out.push({ kind: 'high-latency', where: id, text: `Link ${id} delaying ${Math.round(link.latencyMs)} ms each way` });
  }

  for (const dev of Object.values(state.devices)) {
    if (!dev.powered) {
      out.push({ kind: dev.id === 'R1' ? 'router-failure' : 'device-down', where: dev.id, text: `${dev.label} is powered off` });
    }
    for (const [svc, on] of Object.entries(base.devices[dev.id].services)) {
      if (on && !dev.services[svc as keyof typeof dev.services]) {
        const kind: DetectedKind = svc === 'dns' ? 'dns-failure' : svc === 'dhcp' ? 'dhcp-failure' : 'service-down';
        out.push({ kind, where: dev.id, text: `${svc.toUpperCase()} service stopped on ${dev.id}` });
      }
    }
  }

  for (const id of ['PC1', 'PC2'] as const) {
    const dev = state.devices[id];
    const iface = dev.interfaces[0];
    const host = dev.host!;
    if (host.mode === 'dhcp' && (isApipa(iface.ip) || iface.ip === '0.0.0.0')) {
      out.push({ kind: 'dhcp-failure', where: id, text: `${id} holds no DHCP lease (${iface.ip})` });
      continue;
    }
    if (!inSubnet(iface.ip, '192.168.1.0', 24) || iface.prefix !== 24) {
      out.push({ kind: 'wrong-ip', where: id, text: `${id} addressed ${iface.ip}/${iface.prefix}, outside 192.168.1.0/24` });
    }
    if (host.gateway !== ADDR.gateway) {
      out.push({ kind: 'wrong-gateway', where: id, text: `${id} default gateway is ${host.gateway || 'empty'}` });
    }
    if (host.dns !== ADDR.server) {
      out.push({ kind: 'dns-failure', where: id, text: `${id} DNS server is ${host.dns || 'empty'}` });
    }
  }

  const owners = new Map<string, DeviceId[]>();
  for (const dev of Object.values(state.devices)) {
    if (!dev.powered) continue;
    for (const iface of dev.interfaces) {
      if (!iface.ip || iface.ip === '0.0.0.0') continue;
      owners.set(iface.ip, [...(owners.get(iface.ip) ?? []), dev.id]);
    }
  }
  owners.forEach((devs, ip) => {
    if (devs.length > 1) out.push({ kind: 'duplicate-ip', where: devs[1], text: `${ip} claimed by ${devs.join(' and ')}` });
  });

  if (JSON.stringify(state.firewall) !== JSON.stringify(base.firewall)) {
    out.push({ kind: 'firewall-block', where: 'FW1', text: 'FW1 rule set differs from the approved policy' });
  }
  return out;
}
