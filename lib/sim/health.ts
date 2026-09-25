import { primaryIface, probe, resolveName, type ProbeResult, type ResolveResult } from './engine';
import { isApipa } from './ip';
import { ADDR } from './topology';
import type { DeviceId, NetState } from './types';

export interface Health {
  gateway: ProbeResult;
  server: ProbeResult;
  dns: ResolveResult;
  http: ProbeResult;
  dhcp: 'bound' | 'apipa' | 'released' | 'static' | 'service-down';
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number | null;
  lossPct: number;
}

/** Deterministic end-to-end checks from a workstation; feeds telemetry and verification. */
export function assessHealth(state: NetState, from: DeviceId = 'PC1'): Health {
  const gateway = probe(state, from, ADDR.gateway);
  const server = probe(state, from, ADDR.server);
  const dns = resolveName(state, from, ADDR.www);
  const http = probe(state, from, ADDR.server, 'tcp', 80);

  const dev = state.devices[from];
  const ip = primaryIface(dev)?.ip ?? '';
  let dhcp: Health['dhcp'] = 'bound';
  if (dev.host?.mode === 'static') dhcp = 'static';
  if (isApipa(ip)) dhcp = 'apipa';
  if (ip === '0.0.0.0') dhcp = 'released';
  if (!state.devices.R1.services.dhcp || !state.devices.R1.powered) dhcp = dhcp === 'bound' || dhcp === 'static' ? 'service-down' : dhcp;

  const httpOk = http.ok && http.service === 'open';
  const lossPct = server.ok ? Math.round(server.loss * 100) : 100;
  const latencyMs = server.ok ? server.rtt : null;

  let status: Health['status'] = 'operational';
  if (!gateway.ok && !server.ok) status = 'down';
  else if (!server.ok || !dns.ok || !httpOk || lossPct > 0 || (latencyMs ?? 0) > 50 || dhcp === 'apipa' || dhcp === 'service-down') {
    status = 'degraded';
  }
  return { gateway, server, dns, http, dhcp, status, latencyMs, lossPct };
}

export interface VerifyStep {
  label: string;
  command: string;
  pass: boolean;
  detail: string;
}

/** The re-test run after a repair: every step must pass for the network to count as recovered. */
export function verificationSuite(state: NetState): VerifyStep[] {
  const h = assessHealth(state);
  const rtt = (p: ProbeResult) => (p.rtt < 1 ? '<1 ms' : `${Math.round(p.rtt)} ms`);
  const ip = primaryIface(state.devices.PC1)?.ip ?? '';
  return [
    {
      label: 'Valid address on 192.168.1.0/24',
      command: 'ipconfig',
      pass: ip.startsWith('192.168.1.') && h.dhcp !== 'apipa',
      detail: `PC1 ${ip || 'no address'}`,
    },
    {
      label: 'Default gateway answers',
      command: `ping ${ADDR.gateway}`,
      pass: h.gateway.ok && h.gateway.loss === 0,
      detail: h.gateway.ok ? `reply in ${rtt(h.gateway)}${h.gateway.loss ? `, ${Math.round(h.gateway.loss * 100)}% loss` : ''}` : 'no reply',
    },
    {
      label: 'Server reachable end to end',
      command: `ping ${ADDR.server}`,
      pass: h.server.ok && h.server.loss === 0 && h.server.rtt < 50,
      detail: h.server.ok ? `reply in ${rtt(h.server)}, ${Math.round(h.server.loss * 100)}% loss` : 'no reply',
    },
    {
      label: 'Name resolution',
      command: `nslookup ${ADDR.www}`,
      pass: h.dns.ok,
      detail: h.dns.ok ? `${ADDR.www} → ${h.dns.ip}` : h.dns.failure === 'no-server' ? 'no DNS server configured' : 'DNS request timed out',
    },
    {
      label: 'Web service on TCP/80',
      command: `curl http://${ADDR.www}`,
      pass: h.http.ok && h.http.service === 'open',
      detail: h.http.ok && h.http.service === 'open' ? 'HTTP/1.1 200 OK' : 'connection failed',
    },
  ];
}
