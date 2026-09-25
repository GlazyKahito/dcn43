import type { DeviceId, LinkId, NetState } from './types';

export const DEVICE_ORDER: DeviceId[] = ['PC1', 'PC2', 'SW1', 'R1', 'FW1', 'SRV1'];
export const LINK_ORDER: LinkId[] = ['PC1-SW1', 'PC2-SW1', 'SW1-R1', 'R1-FW1', 'FW1-SRV1'];

/** Addresses referenced by probes, faults and content. */
export const ADDR = {
  pc1: '192.168.1.10',
  pc2: '192.168.1.11',
  gateway: '192.168.1.1',
  r1Wan: '10.0.0.1',
  fwOutside: '10.0.0.2',
  fwInside: '172.16.0.1',
  server: '172.16.0.10',
  www: 'www.lab.local',
} as const;

export const BASE_LATENCY: Record<LinkId, number> = {
  'PC1-SW1': 0.2,
  'PC2-SW1': 0.2,
  'SW1-R1': 0.3,
  'R1-FW1': 1.1,
  'FW1-SRV1': 0.3,
};

export function createBaseline(): NetState {
  return {
    dns: {
      'www.lab.local': ADDR.server,
      'ns.lab.local': ADDR.server,
      'r1.lab.local': ADDR.gateway,
      'fw1.lab.local': ADDR.fwOutside,
      'pc2.lab.local': ADDR.pc2,
    },
    links: {
      'PC1-SW1': { id: 'PC1-SW1', a: 'PC1', b: 'SW1', medium: 'Cat6 · Fa0/1', up: true, latencyMs: BASE_LATENCY['PC1-SW1'], lossPct: 0 },
      'PC2-SW1': { id: 'PC2-SW1', a: 'PC2', b: 'SW1', medium: 'Cat6 · Fa0/2', up: true, latencyMs: BASE_LATENCY['PC2-SW1'], lossPct: 0 },
      'SW1-R1': { id: 'SW1-R1', a: 'SW1', b: 'R1', medium: 'Cat6 · Gi0/24', up: true, latencyMs: BASE_LATENCY['SW1-R1'], lossPct: 0 },
      'R1-FW1': { id: 'R1-FW1', a: 'R1', b: 'FW1', medium: 'Fibre · 1000BASE-LX', up: true, latencyMs: BASE_LATENCY['R1-FW1'], lossPct: 0 },
      'FW1-SRV1': { id: 'FW1-SRV1', a: 'FW1', b: 'SRV1', medium: 'Cat6 · DMZ', up: true, latencyMs: BASE_LATENCY['FW1-SRV1'], lossPct: 0 },
    },
    firewall: [
      { id: 10, action: 'permit', proto: 'icmp', src: 'any', dst: '172.16.0.0/24', remark: 'Diagnostics' },
      { id: 20, action: 'permit', proto: 'udp', src: '192.168.1.0/24', dst: '172.16.0.10', port: 53, remark: 'DNS' },
      { id: 30, action: 'permit', proto: 'tcp', src: '192.168.1.0/24', dst: '172.16.0.10', port: 80, remark: 'HTTP' },
      { id: 90, action: 'deny', proto: 'ip', src: 'any', dst: 'any', remark: 'Implicit deny' },
    ],
    devices: {
      PC1: {
        id: 'PC1',
        kind: 'host',
        label: 'Workstation PC1',
        model: 'Windows 11 · DHCP client',
        powered: true,
        ttl: 128,
        interfaces: [{ name: 'Ethernet0', ip: ADDR.pc1, prefix: 24, mac: '00-1A-2B-3C-00-10', link: 'PC1-SW1' }],
        host: { mode: 'dhcp', gateway: ADDR.gateway, dns: ADDR.server },
        routes: [],
        services: {},
      },
      PC2: {
        id: 'PC2',
        kind: 'host',
        label: 'Workstation PC2',
        model: 'Windows 11 · static',
        powered: true,
        ttl: 128,
        interfaces: [{ name: 'Ethernet0', ip: ADDR.pc2, prefix: 24, mac: '00-1A-2B-3C-00-11', link: 'PC2-SW1' }],
        host: { mode: 'static', gateway: ADDR.gateway, dns: ADDR.server },
        routes: [],
        services: {},
      },
      SW1: {
        id: 'SW1',
        kind: 'switch',
        label: 'Access Switch SW1',
        model: 'Layer 2 · 24-port',
        powered: true,
        ttl: 255,
        interfaces: [],
        routes: [],
        services: {},
      },
      R1: {
        id: 'R1',
        kind: 'router',
        label: 'Gateway Router R1',
        model: 'Edge router · DHCP server',
        powered: true,
        ttl: 255,
        interfaces: [
          { name: 'Gi0/0', ip: ADDR.gateway, prefix: 24, mac: '00-1A-2B-01-00-01', link: 'SW1-R1' },
          { name: 'Gi0/1', ip: ADDR.r1Wan, prefix: 30, mac: '00-1A-2B-01-00-02', link: 'R1-FW1' },
        ],
        routes: [
          { network: '172.16.0.0', prefix: 24, via: ADDR.fwOutside },
          { network: '0.0.0.0', prefix: 0, via: ADDR.fwOutside },
        ],
        services: { dhcp: true },
      },
      FW1: {
        id: 'FW1',
        kind: 'firewall',
        label: 'Firewall FW1',
        model: 'Stateful packet filter',
        powered: true,
        ttl: 255,
        interfaces: [
          { name: 'outside', ip: ADDR.fwOutside, prefix: 30, mac: '00-1A-2B-02-00-01', link: 'R1-FW1' },
          { name: 'inside', ip: ADDR.fwInside, prefix: 24, mac: '00-1A-2B-02-00-02', link: 'FW1-SRV1' },
        ],
        routes: [{ network: '192.168.1.0', prefix: 24, via: ADDR.r1Wan }],
        services: {},
      },
      SRV1: {
        id: 'SRV1',
        kind: 'server',
        label: 'DNS / HTTP Server SRV1',
        model: 'Linux · named + nginx',
        powered: true,
        ttl: 64,
        interfaces: [{ name: 'eth0', ip: ADDR.server, prefix: 24, mac: '00-1A-2B-03-00-10', link: 'FW1-SRV1' }],
        host: { mode: 'static', gateway: ADDR.fwInside, dns: '127.0.0.1' },
        routes: [],
        services: { dns: true, http: true },
      },
    },
  };
}

export function cloneNet(state: NetState): NetState {
  return JSON.parse(JSON.stringify(state)) as NetState;
}
