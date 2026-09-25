export type DeviceId = 'PC1' | 'PC2' | 'SW1' | 'R1' | 'FW1' | 'SRV1';
export type LinkId = 'PC1-SW1' | 'PC2-SW1' | 'SW1-R1' | 'R1-FW1' | 'FW1-SRV1';
export type DeviceKind = 'host' | 'switch' | 'router' | 'firewall' | 'server';
export type ServiceId = 'dns' | 'http' | 'dhcp';
export type Proto = 'icmp' | 'udp' | 'tcp';

export interface Interface {
  name: string;
  ip: string;
  prefix: number;
  mac: string;
  link: LinkId;
}

export interface HostSettings {
  mode: 'dhcp' | 'static';
  gateway: string;
  dns: string;
}

export interface Route {
  network: string;
  prefix: number;
  via: string;
}

export interface Device {
  id: DeviceId;
  kind: DeviceKind;
  label: string;
  model: string;
  powered: boolean;
  interfaces: Interface[];
  host?: HostSettings;
  routes: Route[];
  services: Partial<Record<ServiceId, boolean>>;
  /** Initial TTL of packets this device originates. */
  ttl: number;
}

export interface Link {
  id: LinkId;
  a: DeviceId;
  b: DeviceId;
  medium: string;
  up: boolean;
  /** One-way latency in milliseconds. */
  latencyMs: number;
  /** Per-traversal loss probability, 0–100. */
  lossPct: number;
}

export interface FirewallRule {
  id: number;
  action: 'permit' | 'deny';
  proto: 'ip' | Proto;
  src: string;
  dst: string;
  port?: number;
  remark: string;
}

export interface NetState {
  devices: Record<DeviceId, Device>;
  links: Record<LinkId, Link>;
  firewall: FirewallRule[];
  dns: Record<string, string>;
}

export type Tone = 'out' | 'ok' | 'warn' | 'err' | 'dim' | 'cmd';

export interface OutLine {
  text: string;
  tone: Tone;
}
