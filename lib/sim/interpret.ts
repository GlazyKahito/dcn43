import { primaryIface, probe, resolveName, traceroute } from './engine';
import { inSubnet, isApipa } from './ip';
import { ADDR } from './topology';
import type { NetState } from './types';

export interface ProbeDef {
  id: string;
  command: string;
  question: string;
}

/** The diagnostic probes offered by the console and the game; each is a real terminal command on PC1. */
export const PROBES: ProbeDef[] = [
  { id: 'ipconfig', command: 'ipconfig /all', question: 'Does PC1 have carrier and a valid configuration?' },
  { id: 'ping-gw', command: `ping ${ADDR.gateway}`, question: 'Can PC1 reach its default gateway?' },
  { id: 'ping-peer', command: `ping ${ADDR.pc2}`, question: 'Is the local segment working?' },
  { id: 'ping-srv', command: `ping ${ADDR.server}`, question: 'Is the server reachable by address?' },
  { id: 'ping-name', command: `ping ${ADDR.www}`, question: 'Is the server reachable by name?' },
  { id: 'tracert', command: `tracert ${ADDR.server}`, question: 'Where along the path does traffic stop or slow?' },
  { id: 'nslookup', command: `nslookup ${ADDR.www}`, question: 'Does the DNS server answer?' },
  { id: 'arp', command: 'arp -a', question: 'Which neighbours answer ARP?' },
  { id: 'netstat', command: 'netstat -an', question: 'What state are PC1’s TCP connections in?' },
  { id: 'curl', command: `curl http://${ADDR.www}`, question: 'Does the web service answer on TCP/80?' },
];

export type Verdict = 'pass' | 'fail' | 'warn';

/** One-line engineering reading of a probe against the current network. */
export function interpretProbe(state: NetState, id: string): { verdict: Verdict; finding: string } {
  const pc = state.devices.PC1;
  const iface = primaryIface(pc)!;
  const ms = (v: number) => (v < 1 ? '<1 ms' : `${Math.round(v)} ms`);

  switch (id) {
    case 'ipconfig': {
      if (!state.links[iface.link].up) return { verdict: 'fail', finding: 'Media disconnected: PC1 has no carrier on Ethernet0.' };
      if (isApipa(iface.ip)) return { verdict: 'fail', finding: `APIPA address ${iface.ip} with no gateway: the DHCP request went unanswered.` };
      if (!inSubnet(iface.ip, '192.168.1.0', 24)) return { verdict: 'fail', finding: `Address ${iface.ip} is outside 192.168.1.0/24; the gateway is not on PC1’s subnet.` };
      if (pc.host?.gateway !== ADDR.gateway) return { verdict: 'fail', finding: `Default gateway is ${pc.host?.gateway || 'empty'}; the router is 192.168.1.1.` };
      const dup = Object.values(state.devices).some((d) => d.id !== 'PC1' && d.powered && d.interfaces.some((i) => i.ip === iface.ip));
      if (dup) return { verdict: 'fail', finding: `Address ${iface.ip} is marked (Duplicate): another station claims it.` };
      return { verdict: 'pass', finding: `Configuration consistent: ${iface.ip}/24, gateway ${ADDR.gateway}, DNS ${pc.host?.dns}.` };
    }
    case 'ping-gw':
    case 'ping-peer':
    case 'ping-srv': {
      const target = id === 'ping-gw' ? ADDR.gateway : id === 'ping-peer' ? ADDR.pc2 : ADDR.server;
      const name = id === 'ping-gw' ? 'Gateway' : id === 'ping-peer' ? 'PC2' : 'Server';
      const p = probe(state, 'PC1', target);
      if (p.ok) {
        const loss = Math.round(p.loss * 100);
        if (loss) return { verdict: 'warn', finding: `${name} replies but about ${loss}% of echoes are lost.` };
        if (p.rtt > 50) return { verdict: 'warn', finding: `${name} replies slowly: ${ms(p.rtt)} round trip.` };
        return { verdict: 'pass', finding: `${name} replies in ${ms(p.rtt)}, TTL ${p.replyTtl}, no loss.` };
      }
      if (p.icmpError) return { verdict: 'fail', finding: `${p.icmpError.from} reports “${p.icmpError.text}”.` };
      if (p.reason === 'no-carrier') return { verdict: 'fail', finding: 'Transmit failed: nothing leaves PC1’s adapter.' };
      if (p.reason === 'gateway-off-subnet' || p.reason === 'no-gateway') return { verdict: 'fail', finding: 'Transmit failed: PC1 has no usable route off its subnet.' };
      return { verdict: 'fail', finding: `${name} does not answer: requests time out.` };
    }
    case 'ping-name': {
      const r = resolveName(state, 'PC1', ADDR.www);
      if (!r.ok) return { verdict: 'fail', finding: 'Name does not resolve: “could not find host”.' };
      const p = probe(state, 'PC1', r.ip!);
      return p.ok ? { verdict: 'pass', finding: `${ADDR.www} resolves to ${r.ip} and replies.` } : { verdict: 'fail', finding: `${ADDR.www} resolves to ${r.ip} but does not reply.` };
    }
    case 'tracert': {
      const t = traceroute(state, 'PC1', ADDR.server);
      if (t.complete && t.hops[t.hops.length - 1]?.kind === 'dest') {
        const jump = t.hops.reduce((acc, h, i) => (i && h.rtt - t.hops[i - 1].rtt > 50 ? i : acc), -1);
        if (jump > 0) return { verdict: 'warn', finding: `Path completes, but delay jumps by ${ms(t.hops[jump].rtt - t.hops[jump - 1].rtt)} at hop ${jump + 1} (${t.hops[jump].ip}).` };
        return { verdict: 'pass', finding: `Path completes in ${t.hops.length} hops: ${t.hops.map((h) => h.ip).join(' → ')}.` };
      }
      const last = [...t.hops].reverse().find((h) => h.kind === 'hop');
      const unreach = t.hops.find((h) => h.kind === 'unreachable');
      if (unreach) return { verdict: 'fail', finding: `Trace ends at hop ${unreach.ttl}: ${unreach.ip} ${unreach.note}` };
      return { verdict: 'fail', finding: last ? `Last responding hop is ${last.ip}; beyond it the trace goes silent.` : 'No hop responds at all.' };
    }
    case 'nslookup': {
      const r = resolveName(state, 'PC1', ADDR.www);
      if (r.ok) return { verdict: 'pass', finding: `DNS server ${r.server} answers: ${ADDR.www} = ${r.ip}.` };
      if (r.failure === 'no-server') return { verdict: 'fail', finding: 'No DNS server is configured on PC1.' };
      return { verdict: 'fail', finding: `DNS request to ${r.server} timed out.` };
    }
    case 'arp': {
      const gw = pc.host?.gateway;
      const p = gw ? probe(state, 'PC1', gw) : null;
      if (!state.links[iface.link].up) return { verdict: 'fail', finding: 'No ARP entries: the adapter is disconnected.' };
      if (gw && p && !p.ok && p.reason === 'arp-fail') return { verdict: 'fail', finding: `ARP for gateway ${gw} is incomplete: nothing answers for that address.` };
      if (p?.forward.conflict || p?.reverse?.conflict) return { verdict: 'fail', finding: 'Two MAC addresses answer for the same IP on the LAN.' };
      return { verdict: 'pass', finding: `Gateway ${gw} resolves to a MAC address; the LAN neighbours answer ARP.` };
    }
    case 'netstat':
    case 'curl': {
      const r = resolveName(state, 'PC1', ADDR.www);
      const p = probe(state, 'PC1', r.ip ?? ADDR.server, 'tcp', 80);
      if (p.ok && p.service === 'open') return { verdict: 'pass', finding: id === 'curl' ? 'HTTP/1.1 200 OK from nginx.' : 'TCP session to 172.16.0.10:80 completed (TIME_WAIT).' };
      if (id === 'curl' && !r.ok) return { verdict: 'fail', finding: 'curl cannot resolve the host name.' };
      if (p.forward.status === 'dropped' && p.forward.reason === 'fw-deny') return { verdict: 'fail', finding: 'SYN sent to 172.16.0.10:80 and never answered (SYN_SENT): a silent drop in the path.' };
      return { verdict: 'fail', finding: 'TCP/80 does not complete a handshake.' };
    }
  }
  return { verdict: 'warn', finding: 'No reading.' };
}
