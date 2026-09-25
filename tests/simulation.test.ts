import { describe, it, expect } from 'vitest';
import { createDefaultTopology } from '../lib/net/topology';
import { canReach, pathTo, resolveName, portOpen } from '../lib/net/engine';
import { runCommand } from '../lib/net/commands';
import { FAULT_SCENARIOS } from '../lib/net/faults';

describe('Virtual Lab Network Simulation - Healthy Baseline', () => {
  it('ping 192.168.1.1 from PC1 produces 4/4 replies, TTL 64, ~1 ms', () => {
    const topo = createDefaultTopology();
    const result = runCommand('ping 192.168.1.1', topo, 'PC1');

    expect(result.command).toBe('ping');
    const replyLines = result.lines.filter((l) => l.text.includes('Reply from 192.168.1.1'));
    expect(replyLines.length).toBe(4);
    expect(replyLines[0].text).toContain('TTL=64');
    expect(replyLines[0].text).toContain('time=1ms');

    const statSummary = result.lines.find((l) => l.text.includes('Packets: Sent = 4, Received = 4, Lost = 0'));
    expect(statSummary).toBeDefined();
  });

  it('ping 172.16.0.80 from PC1 produces 4/4 replies, TTL 62, ~14 ms', () => {
    const topo = createDefaultTopology();
    const result = runCommand('ping 172.16.0.80', topo, 'PC1');

    const replyLines = result.lines.filter((l) => l.text.includes('Reply from 172.16.0.80'));
    expect(replyLines.length).toBe(4);
    expect(replyLines[0].text).toContain('TTL=62');
    expect(replyLines[0].text).toMatch(/time=1[3-5]ms/);

    const statSummary = result.lines.find((l) => l.text.includes('Received = 4, Lost = 0'));
    expect(statSummary).toBeDefined();
  });

  it('tracert www.lab.local from PC1 traces hop 1 192.168.1.1, hop 2 10.0.0.2, hop 3 172.16.0.80', () => {
    const topo = createDefaultTopology();
    const result = runCommand('tracert www.lab.local', topo, 'PC1');

    expect(result.lines.some((l) => l.text.includes('192.168.1.1'))).toBe(true);
    expect(result.lines.some((l) => l.text.includes('10.0.0.2'))).toBe(true);
    expect(result.lines.some((l) => l.text.includes('172.16.0.80'))).toBe(true);
    expect(result.lines.some((l) => l.text.includes('Trace complete.'))).toBe(true);

    const trace = pathTo(topo, 'PC1', 'www.lab.local');
    expect(trace.completed).toBe(true);
    expect(trace.hops.length).toBe(3);
    expect(trace.hops[0].ip).toBe('192.168.1.1');
    expect(trace.hops[1].ip).toBe('10.0.0.2');
    expect(trace.hops[2].ip).toBe('172.16.0.80');
  });

  it('nslookup www.lab.local resolves to server dns.lab.local (172.16.0.53) and address 172.16.0.80', () => {
    const topo = createDefaultTopology();
    const result = runCommand('nslookup www.lab.local', topo, 'PC1');

    expect(result.lines.some((l) => l.text.includes('Server:  dns.lab.local'))).toBe(true);
    expect(result.lines.some((l) => l.text.includes('Address:  172.16.0.53'))).toBe(true);
    expect(result.lines.some((l) => l.text.includes('Address:  172.16.0.80'))).toBe(true);
  });

  it('arp -a on PC1 lists 192.168.1.1 and 192.168.1.11 as dynamic', () => {
    const topo = createDefaultTopology();
    const result = runCommand('arp -a', topo, 'PC1');

    const gwEntry = result.lines.find((l) => l.text.includes('192.168.1.1') && l.text.includes('dynamic'));
    const pc2Entry = result.lines.find((l) => l.text.includes('192.168.1.11') && l.text.includes('dynamic'));
    expect(gwEntry).toBeDefined();
    expect(pc2Entry).toBeDefined();
  });

  it('netstat -an on WEB shows 0.0.0.0:80 and 0.0.0.0:443 LISTENING', () => {
    const topo = createDefaultTopology();
    const result = runCommand('netstat -an', topo, 'WEB');

    const port80 = result.lines.find((l) => l.text.includes('0.0.0.0:80') && l.text.includes('LISTENING'));
    const port443 = result.lines.find((l) => l.text.includes('0.0.0.0:443') && l.text.includes('LISTENING'));
    expect(port80).toBeDefined();
    expect(port443).toBeDefined();
  });
});

describe('Virtual Lab Network Simulation - Fault Scenarios', () => {
  it('Scenario 1: Cable SW1-R1 unplugged causes gateway reachability failure', () => {
    const scenario = FAULT_SCENARIOS.find((s) => s.number === 1)!;
    const base = createDefaultTopology();
    const broken = scenario.apply(base);

    // PC1 cannot ping R1 gateway
    const resR1 = runCommand('ping 192.168.1.1', broken, 'PC1');
    expect(resR1.lines.some((l) => l.text.includes('Destination host unreachable') || l.text.includes('General failure'))).toBe(true);

    // But PC1 can still ping local PC2 on the same switch!
    const resPC2 = runCommand('ping 192.168.1.11', broken, 'PC1');
    expect(resPC2.lines.some((l) => l.text.includes('Reply from 192.168.1.11'))).toBe(true);

    // Verify fix works
    const fixed = scenario.fix(broken);
    expect(scenario.verifyFix(fixed)).toBe(true);
    const fixedRes = runCommand('ping 192.168.1.1', fixed, 'PC1');
    expect(fixedRes.lines.some((l) => l.text.includes('Reply from 192.168.1.1'))).toBe(true);
  });

  it('Scenario 2: PC1 wrong gateway 192.168.1.254 allows local ping but breaks remote', () => {
    const scenario = FAULT_SCENARIOS.find((s) => s.number === 2)!;
    const base = createDefaultTopology();
    const broken = scenario.apply(base);

    // ipconfig shows 192.168.1.254
    const ipcfg = runCommand('ipconfig', broken, 'PC1');
    expect(ipcfg.lines.some((l) => l.text.includes('192.168.1.254'))).toBe(true);

    // Local PC2 ping succeeds
    const resLocal = runCommand('ping 192.168.1.11', broken, 'PC1');
    expect(resLocal.lines.some((l) => l.text.includes('Reply from 192.168.1.11'))).toBe(true);

    // Remote ping fails
    const resRemote = runCommand('ping 172.16.0.80', broken, 'PC1');
    expect(resRemote.lines.some((l) => l.text.includes('Destination host unreachable'))).toBe(true);

    const fixed = scenario.fix(broken);
    expect(scenario.verifyFix(fixed)).toBe(true);
  });

  it('Scenario 3: Subnet mask /16 breaks remote gateway routing', () => {
    const scenario = FAULT_SCENARIOS.find((s) => s.number === 3)!;
    const base = createDefaultTopology();
    const broken = scenario.apply(base);

    const ipcfg = runCommand('ipconfig', broken, 'PC1');
    expect(ipcfg.lines.some((l) => l.text.includes('255.255.0.0'))).toBe(true);

    const fixed = scenario.fix(broken);
    expect(scenario.verifyFix(fixed)).toBe(true);
  });

  it('Scenario 4: DHCP failure leaves APIPA 169.254.11.4 without gateway', () => {
    const scenario = FAULT_SCENARIOS.find((s) => s.number === 4)!;
    const base = createDefaultTopology();
    const broken = scenario.apply(base);

    const ipcfg = runCommand('ipconfig', broken, 'PC1');
    expect(ipcfg.lines.some((l) => l.text.includes('169.254.11.4'))).toBe(true);

    const res = runCommand('ping 172.16.0.80', broken, 'PC1');
    expect(res.lines.some((l) => l.text.includes('Destination host unreachable'))).toBe(true);

    const fixed = scenario.fix(broken);
    expect(scenario.verifyFix(fixed)).toBe(true);
  });

  it('Scenario 5: Duplicate IP produces conflict warning in arp -a', () => {
    const scenario = FAULT_SCENARIOS.find((s) => s.number === 5)!;
    const base = createDefaultTopology();
    const broken = scenario.apply(base);

    const arp = runCommand('arp -a', broken, 'PC1');
    expect(arp.lines.some((l) => l.text.includes('Duplicate IP conflict detected'))).toBe(true);

    const fixed = scenario.fix(broken);
    expect(scenario.verifyFix(fixed)).toBe(true);
  });

  it('Scenario 6: DNS server down allows IP ping but breaks name resolution', () => {
    const scenario = FAULT_SCENARIOS.find((s) => s.number === 6)!;
    const base = createDefaultTopology();
    const broken = scenario.apply(base);

    // IP ping works!
    const pingIp = runCommand('ping 172.16.0.80', broken, 'PC1');
    expect(pingIp.lines.some((l) => l.text.includes('Reply from 172.16.0.80'))).toBe(true);

    // Hostname ping fails!
    const pingName = runCommand('ping www.lab.local', broken, 'PC1');
    expect(pingName.lines.some((l) => l.text.includes('could not find host'))).toBe(true);

    // nslookup fails!
    const ns = runCommand('nslookup www.lab.local', broken, 'PC1');
    expect(ns.lines.some((l) => l.text.includes('DNS request timed out') || l.text.includes('No response'))).toBe(true);

    const fixed = scenario.fix(broken);
    expect(scenario.verifyFix(fixed)).toBe(true);
  });

  it('Scenario 7: Missing return route on R2 stops return traffic at Hop 2', () => {
    const scenario = FAULT_SCENARIOS.find((s) => s.number === 7)!;
    const base = createDefaultTopology();
    const broken = scenario.apply(base);

    // Ping times out
    const pingRes = runCommand('ping 172.16.0.80', broken, 'PC1');
    expect(pingRes.lines.some((l) => l.text.includes('Request timed out.'))).toBe(true);

    // Tracert halts at Hop 2
    const traceRes = runCommand('tracert 172.16.0.80', broken, 'PC1');
    expect(traceRes.lines.some((l) => l.text.includes('10.0.0.2'))).toBe(true);
    expect(traceRes.lines.some((l) => l.text.includes('Request timed out.'))).toBe(true);

    const fixed = scenario.fix(broken);
    expect(scenario.verifyFix(fixed)).toBe(true);
  });

  it('Scenario 8: Firewall blocking port 80 allows ping but blocks telnet', () => {
    const scenario = FAULT_SCENARIOS.find((s) => s.number === 8)!;
    const base = createDefaultTopology();
    const broken = scenario.apply(base);

    // Ping works!
    const pingRes = runCommand('ping 172.16.0.80', broken, 'PC1');
    expect(pingRes.lines.some((l) => l.text.includes('Reply from 172.16.0.80'))).toBe(true);

    // Telnet port 80 fails!
    const telnetRes = runCommand('telnet 172.16.0.80 80', broken, 'PC1');
    expect(telnetRes.lines.some((l) => l.text.includes('Connect failed'))).toBe(true);

    const fixed = scenario.fix(broken);
    expect(scenario.verifyFix(fixed)).toBe(true);

    // Fixed telnet succeeds
    const fixedTelnet = runCommand('telnet 172.16.0.80 80', fixed, 'PC1');
    expect(fixedTelnet.lines.some((l) => l.text.includes('Connected to 172.16.0.80'))).toBe(true);
  });
});
