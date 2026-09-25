export type DeviceType = 'host' | 'router' | 'switch' | 'server';

export interface NetworkInterface {
  name: string;
  ip: string;
  mask: string;
  cidr: number;
  mac: string;
  enabled: boolean;
}

export interface RouteEntry {
  destination: string;
  mask: string;
  gateway: string;
  interfaceName: string;
  metric: number;
}

export interface ArpEntry {
  ip: string;
  mac: string;
  type: 'dynamic' | 'static';
  incomplete?: boolean;
}

export interface ServiceEntry {
  protocol: 'TCP' | 'UDP';
  address: string;
  port: number;
  state: 'LISTENING' | 'ESTABLISHED' | 'CLOSED';
  serviceName: string;
}

export interface DeviceFirewall {
  blockedPorts: number[];
  dropIcmp?: boolean;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  interfaces: NetworkInterface[];
  defaultGateway?: string;
  dnsServer?: string;
  hostname?: string;
  routes: RouteEntry[];
  arpCache: ArpEntry[];
  services: ServiceEntry[];
  firewall: DeviceFirewall;
  dhcpEnabled?: boolean;
  status: 'up' | 'down' | 'misconfigured';
  x: number;
  y: number;
}

export interface NetworkLink {
  id: string;
  nodeA: string;
  nodeB: string;
  up: boolean;
  latencyMs: number;
}

export interface TopologyModel {
  devices: Record<string, Device>;
  links: NetworkLink[];
  dnsRecords: Record<string, string>; // hostname -> IP
}

// IP utility helpers
export function ipToLong(ip: string): number {
  return (
    ip
      .split('.')
      .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0) >>>
    0
  );
}

export function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join('.');
}

export function cidrToMask(cidr: number): string {
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  return longToIp(mask);
}

export function maskToCidr(mask: string): number {
  const long = ipToLong(mask);
  let count = 0;
  for (let i = 31; i >= 0; i--) {
    if ((long & (1 << i)) !== 0) count++;
    else break;
  }
  return count;
}

export function isIpInSubnet(ip: string, networkIp: string, mask: string): boolean {
  try {
    const ipL = ipToLong(ip);
    const netL = ipToLong(networkIp);
    const maskL = ipToLong(mask);
    return (ipL & maskL) === (netL & maskL);
  } catch {
    return false;
  }
}

export function isValidIpv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}

/**
 * Creates the clean, healthy default lab topology as specified.
 */
export function createDefaultTopology(): TopologyModel {
  return {
    dnsRecords: {
      'dns.lab.local': '172.16.0.53',
      'www.lab.local': '172.16.0.80',
    },
    links: [
      { id: 'PC1-SW1', nodeA: 'PC1', nodeB: 'SW1', up: true, latencyMs: 1 },
      { id: 'PC2-SW1', nodeA: 'PC2', nodeB: 'SW1', up: true, latencyMs: 1 },
      { id: 'SW1-R1', nodeA: 'SW1', nodeB: 'R1', up: true, latencyMs: 1 },
      { id: 'R1-R2', nodeA: 'R1', nodeB: 'R2', up: true, latencyMs: 5 },
      { id: 'R2-DNS', nodeA: 'R2', nodeB: 'DNS', up: true, latencyMs: 2 },
      { id: 'R2-WEB', nodeA: 'R2', nodeB: 'WEB', up: true, latencyMs: 2 },
    ],
    devices: {
      PC1: {
        id: 'PC1',
        name: 'Workstation 1',
        type: 'host',
        interfaces: [
          {
            name: 'Ethernet0',
            ip: '192.168.1.10',
            mask: '255.255.255.0',
            cidr: 24,
            mac: 'AA:BB:CC:00:00:10',
            enabled: true,
          },
        ],
        defaultGateway: '192.168.1.1',
        dnsServer: '172.16.0.53',
        hostname: 'PC1.lab.local',
        routes: [
          {
            destination: '0.0.0.0',
            mask: '0.0.0.0',
            gateway: '192.168.1.1',
            interfaceName: 'Ethernet0',
            metric: 1,
          },
          {
            destination: '192.168.1.0',
            mask: '255.255.255.0',
            gateway: 'On-link',
            interfaceName: 'Ethernet0',
            metric: 256,
          },
        ],
        arpCache: [
          { ip: '192.168.1.1', mac: 'AA:BB:CC:01:00:01', type: 'dynamic' },
          { ip: '192.168.1.11', mac: 'AA:BB:CC:00:00:11', type: 'dynamic' },
        ],
        services: [],
        firewall: { blockedPorts: [] },
        dhcpEnabled: false,
        status: 'up',
        x: 80,
        y: 110,
      },
      PC2: {
        id: 'PC2',
        name: 'Workstation 2',
        type: 'host',
        interfaces: [
          {
            name: 'Ethernet0',
            ip: '192.168.1.11',
            mask: '255.255.255.0',
            cidr: 24,
            mac: 'AA:BB:CC:00:00:11',
            enabled: true,
          },
        ],
        defaultGateway: '192.168.1.1',
        dnsServer: '172.16.0.53',
        hostname: 'PC2.lab.local',
        routes: [
          {
            destination: '0.0.0.0',
            mask: '0.0.0.0',
            gateway: '192.168.1.1',
            interfaceName: 'Ethernet0',
            metric: 1,
          },
          {
            destination: '192.168.1.0',
            mask: '255.255.255.0',
            gateway: 'On-link',
            interfaceName: 'Ethernet0',
            metric: 256,
          },
        ],
        arpCache: [
          { ip: '192.168.1.1', mac: 'AA:BB:CC:01:00:01', type: 'dynamic' },
          { ip: '192.168.1.10', mac: 'AA:BB:CC:00:00:10', type: 'dynamic' },
        ],
        services: [],
        firewall: { blockedPorts: [] },
        dhcpEnabled: false,
        status: 'up',
        x: 80,
        y: 290,
      },
      SW1: {
        id: 'SW1',
        name: 'LAN Switch 1',
        type: 'switch',
        interfaces: [
          {
            name: 'Port1-4',
            ip: '',
            mask: '',
            cidr: 0,
            mac: 'AA:BB:CC:FF:00:01',
            enabled: true,
          },
        ],
        routes: [],
        arpCache: [],
        services: [],
        firewall: { blockedPorts: [] },
        status: 'up',
        x: 230,
        y: 200,
      },
      R1: {
        id: 'R1',
        name: 'Gateway Router 1',
        type: 'router',
        interfaces: [
          {
            name: 'GigabitEthernet0/0',
            ip: '192.168.1.1',
            mask: '255.255.255.0',
            cidr: 24,
            mac: 'AA:BB:CC:01:00:01',
            enabled: true,
          },
          {
            name: 'GigabitEthernet0/1',
            ip: '10.0.0.1',
            mask: '255.255.255.252',
            cidr: 30,
            mac: 'AA:BB:CC:01:00:02',
            enabled: true,
          },
        ],
        hostname: 'R1.lab.local',
        routes: [
          {
            destination: '192.168.1.0',
            mask: '255.255.255.0',
            gateway: 'On-link',
            interfaceName: 'GigabitEthernet0/0',
            metric: 0,
          },
          {
            destination: '10.0.0.0',
            mask: '255.255.255.252',
            gateway: 'On-link',
            interfaceName: 'GigabitEthernet0/1',
            metric: 0,
          },
          {
            destination: '172.16.0.0',
            mask: '255.255.255.0',
            gateway: '10.0.0.2',
            interfaceName: 'GigabitEthernet0/1',
            metric: 1,
          },
          {
            destination: '0.0.0.0',
            mask: '0.0.0.0',
            gateway: '10.0.0.2',
            interfaceName: 'GigabitEthernet0/1',
            metric: 10,
          },
        ],
        arpCache: [
          { ip: '192.168.1.10', mac: 'AA:BB:CC:00:00:10', type: 'dynamic' },
          { ip: '192.168.1.11', mac: 'AA:BB:CC:00:00:11', type: 'dynamic' },
          { ip: '10.0.0.2', mac: 'AA:BB:CC:02:00:01', type: 'dynamic' },
        ],
        services: [],
        firewall: { blockedPorts: [] },
        status: 'up',
        x: 400,
        y: 200,
      },
      R2: {
        id: 'R2',
        name: 'Core Router 2',
        type: 'router',
        interfaces: [
          {
            name: 'GigabitEthernet0/0',
            ip: '10.0.0.2',
            mask: '255.255.255.252',
            cidr: 30,
            mac: 'AA:BB:CC:02:00:01',
            enabled: true,
          },
          {
            name: 'GigabitEthernet0/1',
            ip: '172.16.0.1',
            mask: '255.255.255.0',
            cidr: 24,
            mac: 'AA:BB:CC:02:00:02',
            enabled: true,
          },
        ],
        hostname: 'R2.lab.local',
        routes: [
          {
            destination: '10.0.0.0',
            mask: '255.255.255.252',
            gateway: 'On-link',
            interfaceName: 'GigabitEthernet0/0',
            metric: 0,
          },
          {
            destination: '172.16.0.0',
            mask: '255.255.255.0',
            gateway: 'On-link',
            interfaceName: 'GigabitEthernet0/1',
            metric: 0,
          },
          {
            destination: '192.168.1.0',
            mask: '255.255.255.0',
            gateway: '10.0.0.1',
            interfaceName: 'GigabitEthernet0/0',
            metric: 1,
          },
        ],
        arpCache: [
          { ip: '10.0.0.1', mac: 'AA:BB:CC:01:00:02', type: 'dynamic' },
          { ip: '172.16.0.53', mac: 'AA:BB:CC:03:00:53', type: 'dynamic' },
          { ip: '172.16.0.80', mac: 'AA:BB:CC:04:00:80', type: 'dynamic' },
        ],
        services: [],
        firewall: { blockedPorts: [] },
        status: 'up',
        x: 580,
        y: 200,
      },
      DNS: {
        id: 'DNS',
        name: 'DNS Server',
        type: 'server',
        interfaces: [
          {
            name: 'eth0',
            ip: '172.16.0.53',
            mask: '255.255.255.0',
            cidr: 24,
            mac: 'AA:BB:CC:03:00:53',
            enabled: true,
          },
        ],
        defaultGateway: '172.16.0.1',
        hostname: 'dns.lab.local',
        routes: [
          {
            destination: '0.0.0.0',
            mask: '0.0.0.0',
            gateway: '172.16.0.1',
            interfaceName: 'eth0',
            metric: 1,
          },
          {
            destination: '172.16.0.0',
            mask: '255.255.255.0',
            gateway: 'On-link',
            interfaceName: 'eth0',
            metric: 256,
          },
        ],
        arpCache: [
          { ip: '172.16.0.1', mac: 'AA:BB:CC:02:00:02', type: 'dynamic' },
          { ip: '172.16.0.80', mac: 'AA:BB:CC:04:00:80', type: 'dynamic' },
        ],
        services: [
          {
            protocol: 'UDP',
            address: '0.0.0.0',
            port: 53,
            state: 'LISTENING',
            serviceName: 'named / DNS',
          },
        ],
        firewall: { blockedPorts: [] },
        status: 'up',
        x: 740,
        y: 110,
      },
      WEB: {
        id: 'WEB',
        name: 'Web Server',
        type: 'server',
        interfaces: [
          {
            name: 'eth0',
            ip: '172.16.0.80',
            mask: '255.255.255.0',
            cidr: 24,
            mac: 'AA:BB:CC:04:00:80',
            enabled: true,
          },
        ],
        defaultGateway: '172.16.0.1',
        dnsServer: '172.16.0.53',
        hostname: 'www.lab.local',
        routes: [
          {
            destination: '0.0.0.0',
            mask: '0.0.0.0',
            gateway: '172.16.0.1',
            interfaceName: 'eth0',
            metric: 1,
          },
          {
            destination: '172.16.0.0',
            mask: '255.255.255.0',
            gateway: 'On-link',
            interfaceName: 'eth0',
            metric: 256,
          },
        ],
        arpCache: [
          { ip: '172.16.0.1', mac: 'AA:BB:CC:02:00:02', type: 'dynamic' },
          { ip: '172.16.0.53', mac: 'AA:BB:CC:03:00:53', type: 'dynamic' },
        ],
        services: [
          {
            protocol: 'TCP',
            address: '0.0.0.0',
            port: 80,
            state: 'LISTENING',
            serviceName: 'http / nginx',
          },
          {
            protocol: 'TCP',
            address: '0.0.0.0',
            port: 443,
            state: 'LISTENING',
            serviceName: 'https / nginx',
          },
        ],
        firewall: { blockedPorts: [] },
        status: 'up',
        x: 740,
        y: 290,
      },
    },
  };
}

/**
 * Deep clone utility for topology to avoid mutating default state.
 */
export function cloneTopology(topology: TopologyModel): TopologyModel {
  return JSON.parse(JSON.stringify(topology));
}
