'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Terminal as TerminalIcon,
  Zap,
  RotateCcw,
  Search,
  ShieldAlert,
  Server,
  Activity,
  Layers,
} from 'lucide-react';

interface DiagnosticScenario {
  id: string;
  title: string;
  category: string;
  layer: string;
  symptoms: string;
  possibleCauses: string[];
  command: string;
  rawTerminalOutput: string;
  detectedFault: string;
  recommendedFix: string;
  fixedTerminalOutput: string;
}

const SCENARIOS: DiagnosticScenario[] = [
  {
    id: 'no-internet',
    title: 'No Internet / Default Gateway Unreachable',
    category: 'Layer 3 Network',
    layer: 'OSI Layer 3 (Network)',
    symptoms: 'Host can ping 127.0.0.1 and local loopback, but cannot reach any public IP or the LAN gateway.',
    possibleCauses: [
      'Default gateway IP misconfigured or left blank',
      'Local Ethernet switch uplink port disabled',
      'Router interface 192.168.1.1 is administratively down',
    ],
    command: 'ping 192.168.1.1',
    rawTerminalOutput: `Pinging 192.168.1.1 with 32 bytes of data:
Destination host unreachable.
Destination host unreachable.
Destination host unreachable.
Destination host unreachable.

Ping statistics for 192.168.1.1:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`,
    detectedFault: 'Local host has invalid or missing default gateway route. ARP request for 192.168.1.1 received no hardware replies.',
    recommendedFix: 'Run `ipconfig /all` to verify gateway assignment. Assign static gateway 192.168.1.1 on interface eth0.',
    fixedTerminalOutput: `Pinging 192.168.1.1 with 32 bytes of data:
Reply from 192.168.1.1: bytes=32 time=1ms TTL=64
Reply from 192.168.1.1: bytes=32 time=1ms TTL=64
Reply from 192.168.1.1: bytes=32 time=1ms TTL=64
Reply from 192.168.1.1: bytes=32 time=1ms TTL=64

Ping statistics: Sent = 4, Received = 4, Lost = 0 (0% loss)
RTT: min=1ms, max=1ms, avg=1ms. Gateway healthy.`,
  },
  {
    id: 'dns-failure',
    title: 'DNS Hostname Resolution Failure',
    category: 'Layer 7 Application',
    layer: 'OSI Layer 7 (Application)',
    symptoms: 'Pinging raw IP 172.16.0.80 succeeds immediately with 14ms RTT, but accessing `http://www.lab.local` fails with "Server Not Found".',
    possibleCauses: [
      'DNS daemon (named/BIND) halted on primary nameserver',
      'Local resolver configured with invalid DNS server IP',
      'Missing authoritative A-record for hostname www.lab.local',
    ],
    command: 'nslookup www.lab.local',
    rawTerminalOutput: `Server:  dns.lab.local
Address:  192.168.1.254

*** dns.lab.local can't find www.lab.local: Server failure
DNS request timed out: timeout was 2 seconds.
Query ref: A www.lab.local -> NO_DATA / SERVFAIL`,
    detectedFault: 'Nameserver 192.168.1.254 daemon is down or port 53 UDP requests are unacknowledged.',
    recommendedFix: 'Start the named/DNS service on port 53 and verify host `/etc/resolv.conf` points to 192.168.1.2.',
    fixedTerminalOutput: `Server:  dns.lab.local
Address:  192.168.1.2

Non-authoritative answer:
Name:    www.lab.local
Address: 172.16.0.80
Resolution verified in 3ms. DNS operational.`,
  },
  {
    id: 'high-latency',
    title: 'High Latency & Bufferbloat Along Transit Path',
    category: 'Layer 3 Routing',
    layer: 'OSI Layer 3 (Routing / QoS)',
    symptoms: 'Pings succeed with 0% loss, but round-trip times oscillate between 250ms and 850ms, causing application timeouts.',
    possibleCauses: [
      'Congested intermediate WAN transit link with overflowing queues',
      'Duplex mismatch on switch port causing micro-collisions',
      'Asymmetrical multi-hop satellite backhaul route',
    ],
    command: 'tracert 172.16.0.80',
    rawTerminalOutput: `Tracing route to 172.16.0.80 over a maximum of 30 hops:
  1     1 ms     1 ms     1 ms  192.168.1.1 (Gateway)
  2   482 ms   510 ms   495 ms  10.0.0.2 [CONGESTED_LINK]
  3   512 ms   530 ms   505 ms  172.16.0.1 (Router R2)
  4   520 ms   535 ms   515 ms  172.16.0.80 (Web Server)

Trace complete with average RTT = 506ms.`,
    detectedFault: 'Queue bufferbloat identified on Hop 2 (10.0.0.2). Transit bandwidth saturated at 100% capacity.',
    recommendedFix: 'Enable Fair Queueing (FQ-CoDel) on Router 1 serial interface and shape egress traffic to 95% of link capacity.',
    fixedTerminalOutput: `Tracing route to 172.16.0.80 over a maximum of 30 hops:
  1     1 ms     1 ms     1 ms  192.168.1.1
  2     4 ms     3 ms     4 ms  10.0.0.2
  3     8 ms     7 ms     8 ms  172.16.0.1
  4    13 ms    14 ms    13 ms  172.16.0.80

Trace complete with normal latency (14ms RTT).`,
  },
  {
    id: 'duplicate-ip',
    title: 'Duplicate IP Address Conflict (MAC Flapping)',
    category: 'Layer 2 / 3',
    layer: 'OSI Layer 2 (Data Link / ARP)',
    symptoms: 'Connection works for 5 seconds then drops for 5 seconds. Exactly 50% packet loss observed on ping.',
    possibleCauses: [
      'Two workstations manually configured with the same IP (192.168.1.50)',
      'Rogue device static assignment overlapping DHCP pool range',
      'Switch CAM table continuously overwriting port mapping (MAC flapping)',
    ],
    command: 'arp -a',
    rawTerminalOutput: `Interface: 192.168.1.10 --- 0xb
  Internet Address      Physical Address      Type
  192.168.1.1           00-14-22-01-23-45     dynamic
  192.168.1.50          00-1a-2b-3c-4d-5e     dynamic [CONFLICT]
  192.168.1.50          aa-bb-cc-dd-ee-ff     dynamic [CONFLICT]

[WARNING] Gratuitous ARP received: MAC mismatch for 192.168.1.50`,
    detectedFault: 'Two physical MAC addresses are replying for IP 192.168.1.50, causing switch port CAM table poisoning.',
    recommendedFix: 'Trace MAC `aa-bb-cc-dd-ee-ff` on switch port 7. Reconfigure the conflicting device to obtain a dynamic DHCP lease.',
    fixedTerminalOutput: `Interface: 192.168.1.10 --- 0xb
  Internet Address      Physical Address      Type
  192.168.1.1           00-14-22-01-23-45     dynamic
  192.168.1.50          00-1a-2b-3c-4d-5e     dynamic (Single Owner)
  192.168.1.51          aa-bb-cc-dd-ee-ff     dynamic (Reassigned)

ARP table synchronized. No packet loss.`,
  },
  {
    id: 'apipa-dhcp',
    title: 'DHCP Pool Exhaustion (APIPA 169.254.x.x)',
    category: 'Layer 3 IP Config',
    layer: 'OSI Layer 3 (IP Addressing)',
    symptoms: 'Workstation displays "Limited or No Connectivity". Host assigned IP `169.254.88.14` with subnet mask `255.255.0.0`.',
    possibleCauses: [
      'DHCP scope /24 has zero available leases left',
      'DHCP server service crashed or unreachable via broadcast',
      'VLAN tag mismatch blocking DHCP Discover UDP port 67',
    ],
    command: 'ipconfig /all',
    rawTerminalOutput: `Ethernet adapter Local Area Connection:
   Connection-specific DNS Suffix  . :
   Description . . . . . . . . . . . : Intel(R) 82579LM Gigabit
   Physical Address. . . . . . . . . : 00-21-70-4A-12-88
   DHCP Enabled. . . . . . . . . . . : Yes
   Autoconfiguration IPv4 Address. . : 169.254.88.14(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . : [BLANK]
   DNS Servers . . . . . . . . . . . : [BLANK]`,
    detectedFault: 'Client sent 4 DHCPDISCOVER broadcasts with no DHCPOFFER received; fell back to RFC 3927 Automatic Private IP Addressing (APIPA).',
    recommendedFix: 'Expand DHCP scope address pool or run `ipconfig /renew` after restarting the DHCP server service.',
    fixedTerminalOutput: `Ethernet adapter Local Area Connection:
   IPv4 Address. . . . . . . . . . . : 192.168.1.124(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
   DHCP Server . . . . . . . . . . . : 192.168.1.1
   DNS Servers . . . . . . . . . . . : 192.168.1.2
Lease obtained successfully. Network fully functional.`,
  },
  {
    id: 'firewall-block',
    title: 'Firewall ACL Dropping TCP Port 80 (HTTP)',
    category: 'Layer 4 Transport',
    layer: 'OSI Layer 4 (Transport / ACL)',
    symptoms: 'ICMP ping returns replies normally with 14ms latency, but web browser connection to port 80 hangs indefinitely.',
    possibleCauses: [
      'Firewall access control list (ACL) blocking inbound TCP port 80',
      'Web server daemon (nginx/Apache) listening only on 127.0.0.1',
      'SYN packet accepted but SYN-ACK dropped by stateful inspection',
    ],
    command: 'telnet 172.16.0.80 80',
    rawTerminalOutput: `Connecting to 172.16.0.80...
Could not open connection to the host, on port 80: Connect failed.
TCP 3-Way Handshake SYN timeout (no SYN-ACK received after 3 attempts).
ICMP Echo is passing, but TCP layer is filtered.`,
    detectedFault: 'Firewall rule 104 explicitly drops inbound TCP traffic on port 80 from subnet 192.168.1.0/24.',
    recommendedFix: 'Update firewall security policy to permit TCP traffic on destination port 80 for verified lab subnets.',
    fixedTerminalOutput: `Connecting to 172.16.0.80...
Connected to 172.16.0.80.
Escape character is '^]'.
HTTP/1.1 200 OK
Server: Lab-HTTP/2.4
TCP Handshake SYN -> SYN-ACK -> ACK verified.`,
  },
];

export function NetworkDiagnosticsModule() {
  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0].id);
  const [isFixed, setIsFixed] = useState<boolean>(false);
  const [isRunningCommand, setIsRunningCommand] = useState<boolean>(false);

  const current = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  const handleSelectScenario = (id: string) => {
    setSelectedId(id);
    setIsFixed(false);
  };

  const handleRunCommand = () => {
    setIsRunningCommand(true);
    setTimeout(() => {
      setIsRunningCommand(false);
    }, 600);
  };

  const handleApplyFix = () => {
    setIsRunningCommand(true);
    setTimeout(() => {
      setIsFixed(true);
      setIsRunningCommand(false);
    }, 700);
  };

  const handleReset = () => {
    setIsFixed(false);
  };

  return (
    <section id="diagnostics" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      {/* Module Title Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[#34d399] font-mono text-xs uppercase tracking-widest">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Intelligent Diagnostic System &bull; Live Engine</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white">
          Network Fault Diagnosis Console
        </h2>
        <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed">
          Select a real-world network failure symptom below. Interrogate the layered stack using simulated diagnostic probes (<code className="text-emerald-300 font-mono">ping</code>, <code className="text-emerald-300 font-mono">tracert</code>, <code className="text-emerald-300 font-mono">ipconfig</code>, <code className="text-emerald-300 font-mono">arp</code>), identify the root cause, and verify resolution.
        </p>
      </div>

      {/* Main Diagnostic Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Fault Scenario Selector List */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-semibold px-2 mb-1 flex items-center justify-between">
            <span>Diagnostic Scenarios ({SCENARIOS.length})</span>
            <span className="text-[10px] text-emerald-400">SELECT TO TRIAGE</span>
          </div>

          <div className="space-y-2">
            {SCENARIOS.map((scenario, index) => {
              const isActive = scenario.id === current.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleSelectScenario(scenario.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-1 relative overflow-hidden ${
                    isActive
                      ? 'bg-[#0f1712] border-emerald-400/50 shadow-[0_4px_24px_rgba(52,211,153,0.15)] ring-1 ring-emerald-400/30'
                      : 'bg-[#0a0f0d]/70 hover:bg-[#0d1410] border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-emerald-400 border border-white/10">
                      0{index + 1} &bull; {scenario.category}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight leading-snug">
                    {scenario.title}
                  </h4>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Diagnostic Triage Inspection Panel */}
        <div className="lg:col-span-8 bg-[#0a0f0d]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-6">
          {/* Top Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
                {current.layer}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {current.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider border ${
                  isFixed
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-400/40 text-rose-300'
                }`}
              >
                {isFixed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fault Resolved</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>Active Fault Detected</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Section 1: Observable Symptoms */}
          <div className="p-4 rounded-xl bg-[#070b09] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Observable Symptoms</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans">
              {current.symptoms}
            </p>
          </div>

          {/* Section 2: Candidate Root Causes */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
              Candidate Hypotheses to Evaluate:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {current.possibleCauses.map((cause, i) => (
                <li
                  key={i}
                  className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-neutral-300 leading-snug flex items-start gap-2"
                >
                  <span className="font-mono text-emerald-400 font-bold text-[10px] mt-0.5 shrink-0">
                    [{i + 1}]
                  </span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Diagnostic Probe Terminal (Simulated Execution) */}
          <div className="rounded-2xl bg-[#040605] border border-white/15 overflow-hidden shadow-inner space-y-0">
            {/* Terminal Title Bar */}
            <div className="px-4 py-2.5 bg-[#080d0a] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[10px] font-mono text-neutral-400 ml-2">
                  bash &mdash; diagnostic_probe: {current.command}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunCommand}
                  disabled={isRunningCommand}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <TerminalIcon className="w-3 h-3 text-emerald-400" />
                  <span>{isRunningCommand ? 'Probing...' : 'Re-Run Command'}</span>
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 sm:p-5 font-mono text-xs text-emerald-300/90 whitespace-pre-wrap leading-relaxed overflow-x-auto min-h-[160px]">
              <div className="text-neutral-400 mb-2 font-bold">
                $ {current.command}
              </div>
              {isRunningCommand ? (
                <div className="flex items-center gap-2 text-neutral-400 animate-pulse">
                  <Activity className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Executing ICMP/UDP protocol probe...</span>
                </div>
              ) : isFixed ? (
                <span className="text-emerald-300">{current.fixedTerminalOutput}</span>
              ) : (
                <span className="text-rose-300/90">{current.rawTerminalOutput}</span>
              )}
            </div>
          </div>

          {/* Section 4: Root Cause & Solution Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/25 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
                Detected Root Cause:
              </span>
              <p className="text-xs text-neutral-200 leading-snug">
                {current.detectedFault}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/25 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                Recommended Engineering Fix:
              </span>
              <p className="text-xs text-neutral-200 leading-snug">
                {current.recommendedFix}
              </p>
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {!isFixed ? (
              <button
                type="button"
                onClick={handleApplyFix}
                disabled={isRunningCommand}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sans transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_28px_rgba(52,211,153,0.5)] cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Apply Engineering Fix &amp; Re-Probe</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-Inject Fault</span>
              </button>
            )}

            <span className="text-xs font-mono text-neutral-400">
              OSI Triage Complete &bull; Verified in Memory
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
