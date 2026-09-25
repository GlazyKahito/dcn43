import { broadcastDomain, primaryIface } from './engine';
import { isIPv4, maskToPrefix } from './ip';
import { ADDR, BASE_LATENCY, cloneNet, createBaseline } from './topology';
import type { DeviceId, LinkId, NetState, ServiceId } from './types';

/** DHCP reservations held by R1, keyed by client. */
const RESERVATIONS: Partial<Record<DeviceId, string>> = { PC1: ADDR.pc1, PC2: ADDR.pc2 };

type Mutator = (s: NetState) => void;
const edit = (state: NetState, fn: Mutator): NetState => {
  const next = cloneNet(state);
  fn(next);
  return next;
};

export const setLinkUp = (state: NetState, id: LinkId, up: boolean) => edit(state, (s) => void (s.links[id].up = up));

export const setLinkQuality = (state: NetState, id: LinkId, latencyMs: number, lossPct: number) =>
  edit(state, (s) => {
    s.links[id].latencyMs = Math.max(0.1, latencyMs);
    s.links[id].lossPct = Math.min(100, Math.max(0, lossPct));
  });

export const restoreLinkQuality = (state: NetState, id: LinkId) => setLinkQuality(state, id, BASE_LATENCY[id], 0);

export const setPower = (state: NetState, id: DeviceId, on: boolean) => edit(state, (s) => void (s.devices[id].powered = on));

export const setService = (state: NetState, id: DeviceId, svc: ServiceId, on: boolean) =>
  edit(state, (s) => void (s.devices[id].services[svc] = on));

export const removeFirewallRule = (state: NetState, ruleId: number) =>
  edit(state, (s) => void (s.firewall = s.firewall.filter((r) => r.id !== ruleId)));

export const restoreFirewall = (state: NetState) => edit(state, (s) => void (s.firewall = createBaseline().firewall));

export interface StaticConfig {
  ip: string;
  mask: string;
  gateway: string;
  dns: string;
}

export function validateStatic(cfg: StaticConfig): string | null {
  if (!isIPv4(cfg.ip)) return 'IPv4 address is not valid.';
  if (maskToPrefix(cfg.mask) === null) return 'Subnet mask is not a contiguous mask.';
  if (cfg.gateway && !isIPv4(cfg.gateway)) return 'Default gateway is not a valid address.';
  if (cfg.dns && !isIPv4(cfg.dns)) return 'DNS server is not a valid address.';
  return null;
}

export const setStatic = (state: NetState, id: DeviceId, cfg: StaticConfig) =>
  edit(state, (s) => {
    const d = s.devices[id];
    const iface = d.interfaces[0];
    iface.ip = cfg.ip;
    iface.prefix = maskToPrefix(cfg.mask) ?? 24;
    d.host = { mode: 'static', gateway: cfg.gateway, dns: cfg.dns };
  });

export const releaseLease = (state: NetState, id: DeviceId) =>
  edit(state, (s) => {
    const d = s.devices[id];
    if (d.host?.mode !== 'dhcp') return;
    d.interfaces[0].ip = '0.0.0.0';
    d.interfaces[0].prefix = 0;
    d.host.gateway = '';
    d.host.dns = '';
  });

export interface LeaseOutcome {
  state: NetState;
  ok: boolean;
  message: string;
}

/** DHCP DORA from `id`: needs carrier, a path to R1 and a running DHCP service. Falls back to APIPA. */
export function renewLease(state: NetState, id: DeviceId): LeaseOutcome {
  const dev = state.devices[id];
  const iface = primaryIface(dev);
  if (!dev.host || !iface) return { state, ok: false, message: 'Adapter does not support DHCP.' };
  if (dev.host.mode !== 'dhcp') {
    return { state, ok: false, message: `The operation failed: DHCP is not enabled on adapter ${iface.name}.` };
  }
  if (!state.links[iface.link].up) {
    return { state, ok: false, message: `No operation can be performed on ${iface.name} while it has its media disconnected.` };
  }
  const server = broadcastDomain(state, id, iface).find((m) => state.devices[m.device].services.dhcp);
  const reserved = RESERVATIONS[id];
  if (!server || !reserved) {
    const next = edit(state, (s) => {
      const d = s.devices[id];
      d.interfaces[0].ip = id === 'PC1' ? '169.254.37.112' : '169.254.81.20';
      d.interfaces[0].prefix = 16;
      d.host = { mode: 'dhcp', gateway: '', dns: '' };
    });
    return {
      state: next,
      ok: false,
      message: `An error occurred while renewing interface ${iface.name} : unable to contact your DHCP server. Request has timed out.`,
    };
  }
  const next = edit(state, (s) => {
    const d = s.devices[id];
    d.interfaces[0].ip = reserved;
    d.interfaces[0].prefix = 24;
    d.host = { mode: 'dhcp', gateway: ADDR.gateway, dns: ADDR.server };
  });
  return { state: next, ok: true, message: `Lease acquired from ${server.iface.ip}: ${reserved}/24` };
}

/** Switches a host back to DHCP and runs DORA. */
export const enableDhcp = (state: NetState, id: DeviceId): LeaseOutcome =>
  renewLease(
    edit(state, (s) => {
      const d = s.devices[id];
      if (d.host) d.host.mode = 'dhcp';
    }),
    id,
  );
