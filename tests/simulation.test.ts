import { describe, expect, it } from 'vitest';
import { renewLease, setLinkUp } from '../lib/sim/actions';
import { runCommand } from '../lib/sim/commands';
import { createRng, probe, resolveName, traceroute } from '../lib/sim/engine';
import { detectFaults, FAULTS } from '../lib/sim/faults';
import { verificationSuite } from '../lib/sim/health';
import { loadScenario, REPAIRS, SCENARIOS } from '../lib/sim/scenarios';
import { createBaseline } from '../lib/sim/topology';
import type { NetState } from '../lib/sim/types';

const run = (state: NetState, line: string, host: 'PC1' | 'PC2' = 'PC1') =>
  runCommand({ state, host, rng: createRng(7) }, line).lines.map((l) => l.text).join('\n');

describe('healthy baseline', () => {
  const net = createBaseline();

  it('reaches the server across two routed hops with TTL 62', () => {
    const p = probe(net, 'PC1', '172.16.0.10');
    expect(p.ok).toBe(true);
    expect(p.replyTtl).toBe(62);
    expect(p.forward.path).toEqual(['PC1', 'SW1', 'R1', 'FW1', 'SRV1']);
    expect(p.loss).toBe(0);
  });

  it('pings the gateway with TTL 255', () => {
    expect(run(net, 'ping 192.168.1.1')).toContain('TTL=255');
  });

  it('traces R1, FW1, SRV1', () => {
    const t = traceroute(net, 'PC1', '172.16.0.10');
    expect(t.complete).toBe(true);
    expect(t.hops.map((h) => h.ip)).toEqual(['192.168.1.1', '10.0.0.2', '172.16.0.10']);
  });

  it('resolves and serves www.lab.local', () => {
    expect(resolveName(net, 'PC1', 'www.lab.local').ip).toBe('172.16.0.10');
    expect(run(net, 'curl http://www.lab.local')).toContain('200 OK');
  });

  it('has no detected faults and passes verification', () => {
    expect(detectFaults(net)).toEqual([]);
    expect(verificationSuite(net).every((s) => s.pass)).toBe(true);
  });
});

describe('faults change observable behaviour', () => {
  const inject = (kind: string, link?: never) => FAULTS.find((f) => f.kind === kind)!.inject(createBaseline(), link);

  it('DNS failure: ping by IP works, nslookup times out', () => {
    const net = inject('dns-failure');
    expect(probe(net, 'PC1', '172.16.0.10').ok).toBe(true);
    expect(run(net, 'nslookup www.lab.local')).toContain('DNS request timed out');
    expect(run(net, 'ping www.lab.local')).toContain('could not find host');
  });

  it('router failure: gateway ARP fails from PC1 itself', () => {
    const out = run(inject('router-failure'), 'ping 172.16.0.10');
    expect(out).toContain('Reply from 192.168.1.10: Destination host unreachable.');
  });

  it('uplink down: R1 reports destination net unreachable, tracert stops at hop 1', () => {
    const net = setLinkUp(createBaseline(), 'R1-FW1', false);
    expect(run(net, 'ping 172.16.0.10')).toContain('Reply from 192.168.1.1: Destination net unreachable.');
    const t = traceroute(net, 'PC1', '172.16.0.10');
    expect(t.hops[0].ip).toBe('192.168.1.1');
  });

  it('access cable unplugged: media disconnected', () => {
    const net = setLinkUp(createBaseline(), 'PC1-SW1', false);
    expect(run(net, 'ipconfig')).toContain('Media disconnected');
    expect(run(net, 'ping 192.168.1.1')).toContain('transmit failed');
  });

  it('wrong gateway: incomplete ARP for 192.168.1.254', () => {
    const net = inject('wrong-gateway');
    expect(probe(net, 'PC1', '172.16.0.10').ok).toBe(false);
    expect(probe(net, 'PC1', '192.168.1.11').ok).toBe(true);
    expect(run(net, 'arp -a')).toContain('(incomplete)');
  });

  it('firewall block: ICMP passes, HTTP times out', () => {
    const net = inject('firewall-block');
    expect(probe(net, 'PC1', '172.16.0.10').ok).toBe(true);
    expect(run(net, 'curl http://www.lab.local')).toContain('Timed out');
    expect(run(net, 'netstat -an')).toContain('SYN_SENT');
  });

  it('duplicate IP halves delivery and is flagged by ipconfig', () => {
    const net = inject('duplicate-ip');
    expect(probe(net, 'PC1', '192.168.1.1').loss).toBeCloseTo(0.5);
    expect(run(net, 'ipconfig')).toContain('(Duplicate)');
  });

  it('DHCP failure: APIPA address, renew fails until the service returns', () => {
    const net = inject('dhcp-failure');
    expect(run(net, 'ipconfig')).toContain('169.254.');
    expect(renewLease(net, 'PC1').ok).toBe(false);
  });

  it('high latency shows on the server but not the gateway', () => {
    const net = inject('high-latency');
    expect(probe(net, 'PC1', '192.168.1.1').rtt).toBeLessThan(5);
    expect(probe(net, 'PC1', '172.16.0.10').rtt).toBeGreaterThan(200);
  });
});

describe('scenarios', () => {
  for (const s of SCENARIOS) {
    it(`${s.no} ${s.title}: broken until the correct repair, then verified`, () => {
      const broken = loadScenario(s);
      expect(verificationSuite(broken).every((v) => v.pass)).toBe(false);
      for (const r of s.repairs.filter((id) => id !== s.fix)) {
        expect(verificationSuite(REPAIRS[r].apply(broken)).every((v) => v.pass)).toBe(false);
      }
      const fixed = REPAIRS[s.fix].apply(broken);
      expect(verificationSuite(fixed).every((v) => v.pass)).toBe(true);
      expect(detectFaults(fixed)).toEqual([]);
    });
  }
});
