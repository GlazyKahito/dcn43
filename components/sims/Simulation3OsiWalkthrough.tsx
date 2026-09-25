'use client';

import React, { useState, useEffect } from 'react';
import {
  createDefaultTopology,
  TopologyModel,
} from '../../lib/net/topology';
import { FAULT_SCENARIOS, FaultScenario } from '../../lib/net/faults';
import { resolveName, portOpen } from '../../lib/net/engine';
import { DiagnosticConsole, DiagnosticLog } from './DiagnosticConsole';
import {
  Layers,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface OsiLayerCheck {
  layerNumber: number;
  layerName: string;
  checkTitle: string;
  commandTested: string;
  description: string;
  runCheck: (topo: TopologyModel) => {
    passed: boolean;
    outputLine: string;
    rulesIn: string;
    rulesOut: string;
  };
}

export function Simulation3OsiWalkthrough() {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(0);
  const currentScenario: FaultScenario = FAULT_SCENARIOS[selectedScenarioIdx];

  // Topology for active scenario
  const [topology, setTopology] = useState<TopologyModel>(() =>
    currentScenario.apply(createDefaultTopology())
  );

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1 = not started
  const [stepResults, setStepResults] = useState<{
    [stepIndex: number]: {
      passed: boolean;
      outputLine: string;
      rulesIn: string;
      rulesOut: string;
    };
  }>({});

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(1500); // 1.5 seconds per step
  const [haltedAtFailure, setHaltedAtFailure] = useState<boolean>(false);

  // Diagnostic console logs
  const [logs, setLogs] = useState<DiagnosticLog[]>([
    {
      id: 'osi-init',
      timestamp: new Date().toLocaleTimeString(),
      type: 'osi',
      message: 'OSI Bottom-Up Walkthrough initialized. Select a scenario and click Step or Play.',
    },
  ]);

  const addLog = (type: DiagnosticLog['type'], message: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
    ]);
  };

  // Define the 5 bottom-up OSI diagnostic checks
  const osiChecks: OsiLayerCheck[] = [
    {
      layerNumber: 1,
      layerName: 'Physical Layer',
      checkTitle: 'Carrier Signal & Cable Continuity',
      commandTested: 'Hardware link status check',
      description: 'Verifies physical copper patch cords, RJ-45 jacks, and switch transceiver link lights.',
      runCheck: (topo) => {
        const linkPC1 = topo.links.find((l) => l.id === 'PC1-SW1')?.up ?? false;
        const linkR1 = topo.links.find((l) => l.id === 'SW1-R1')?.up ?? false;
        const passed = linkPC1 && linkR1;

        if (passed) {
          return {
            passed: true,
            outputLine: 'Physical link carrier UP: PC1-SW1 [1000BASE-T Full-Duplex], SW1-R1 [UP].',
            rulesIn: 'Layer 1 copper continuity confirmed.',
            rulesOut: 'Rules OUT severed cables, loose connectors, and blown switch ports.',
          };
        } else {
          return {
            passed: false,
            outputLine: 'Physical carrier DOWN: Interface Ethernet0 link detected = NO CARRIER (Cable unplugged).',
            rulesIn: 'Direct Physical Layer failure detected on local cable run.',
            rulesOut: 'Higher layers (IP, DNS, HTTP) cannot be blamed until physical link is restored.',
          };
        }
      },
    },
    {
      layerNumber: 2,
      layerName: 'Data Link Layer',
      checkTitle: 'MAC Address Resolution & Switch Forwarding',
      commandTested: 'arp -a',
      description: 'Checks Address Resolution Protocol (ARP) table for IP-to-MAC mapping and duplicate hardware address conflicts.',
      runCheck: (topo) => {
        const devPC1 = topo.devices['PC1'];
        const devPC2 = topo.devices['PC2'];
        const isDuplicate = devPC1?.interfaces[0]?.ip === devPC2?.interfaces[0]?.ip;

        if (isDuplicate) {
          return {
            passed: false,
            outputLine: 'ARP Collision Detected: IP 192.168.1.10 claimed by conflicting MAC addresses 00:1A:2B:3C:4D:5E and 00:1A:2B:3C:4D:6F.',
            rulesIn: 'Layer 2 ARP poisoning / Duplicate IP hardware address conflict.',
            rulesOut: 'Routing tables and cables are fine; Layer 2 address binding is corrupted.',
          };
        }

        return {
          passed: true,
          outputLine: 'ARP Table Valid: 192.168.1.1 mapped to 00:1A:2B:3C:4D:01 (Dynamic), no collisions.',
          rulesIn: 'Layer 2 MAC framing and local broadcast domain operational.',
          rulesOut: 'Rules OUT switch port security shutdowns and broadcast storms.',
        };
      },
    },
    {
      layerNumber: 3,
      layerName: 'Network Layer',
      checkTitle: 'Subnet Masking, Gateway & IP Routing',
      commandTested: 'ping 172.16.0.80',
      description: 'Tests end-to-end ICMP Echo reachability, default gateway forwarding, and IP routing tables.',
      runCheck: (topo) => {
        const devPC1 = topo.devices['PC1'];
        const iface = devPC1?.interfaces[0];

        if (iface?.ip?.startsWith('169.254')) {
          return {
            passed: false,
            outputLine: 'ICMP Failed: Host assigned APIPA address 169.254.11.4 (DHCP exhaustion / lease failure).',
            rulesIn: 'DHCP unreachability forced host into self-assigned APIPA state.',
            rulesOut: 'Default gateway and WAN routing cannot function without a valid LAN IP.',
          };
        }

        if (iface?.mask === '255.255.0.0') {
          return {
            passed: false,
            outputLine: 'ICMP Routing Failed: Host subnet mask /16 (255.255.0.0) causes off-subnet traffic to skip gateway.',
            rulesIn: 'Misconfigured subnet mask causes ARP broadcasts for remote IP subnets.',
            rulesOut: 'Default gateway router is healthy; PC1 configuration is flawed.',
          };
        }

        if (devPC1?.defaultGateway !== '192.168.1.1') {
          return {
            passed: false,
            outputLine: `ICMP Failed: Host default gateway set to invalid IP ${devPC1?.defaultGateway || 'NONE'}.`,
            rulesIn: 'Host lacks valid route to forward packets beyond local subnet.',
            rulesOut: 'Local LAN is operational; transit routing is halted at first hop.',
          };
        }

        const devR2 = topo.devices['R2'];
        const hasReturnRoute = devR2?.routes.some((r) => r.destination === '192.168.1.0/24');
        if (!hasReturnRoute) {
          return {
            passed: false,
            outputLine: 'ICMP Timeout: Forward packet reached target, but R2 missing return route for 192.168.1.0/24.',
            rulesIn: 'Asymmetric routing failure: return route blackholed at core router.',
            rulesOut: 'Forward path from PC1 to WEB is completely functional.',
          };
        }

        return {
          passed: true,
          outputLine: 'ICMP Echo Reply: 4/4 packets received from 172.16.0.80, time=12ms, TTL=62.',
          rulesIn: 'End-to-end bidirectional Layer 3 routing verified.',
          rulesOut: 'Rules OUT bad gateways, IP conflicts, and routing table loops.',
        };
      },
    },
    {
      layerNumber: 4,
      layerName: 'Transport Layer',
      checkTitle: 'TCP Port Handshake & Firewall Filtering',
      commandTested: 'telnet 172.16.0.80 80',
      description: 'Attempts a full TCP 3-way handshake (SYN, SYN-ACK, ACK) to destination service ports.',
      runCheck: (topo) => {
        const portCheck = portOpen(topo, 'PC1', '172.16.0.80', 80);
        if (portCheck.open) {
          return {
            passed: true,
            outputLine: 'TCP Port 80 Open: 3-way handshake completed with Nginx Web Server.',
            rulesIn: 'Transport layer sockets and host firewall rules permit traffic.',
            rulesOut: 'Rules OUT firewall port blocks and crashed service daemons.',
          };
        } else {
          return {
            passed: false,
            outputLine: `TCP Port 80 Connection Failed: ${portCheck.failureDetail}`,
            rulesIn: 'Host firewall filtering (drop SYN) or web service not listening.',
            rulesOut: 'Network Layer is operational; issue is strictly Transport Layer security or service state.',
          };
        }
      },
    },
    {
      layerNumber: 7,
      layerName: 'Application Layer',
      checkTitle: 'DNS Name Resolution & Application Response',
      commandTested: 'nslookup www.lab.local',
      description: 'Resolves fully qualified domain names into IP addresses through the configured DNS server.',
      runCheck: (topo) => {
        const dnsRes = resolveName(topo, 'PC1', 'www.lab.local');
        if (dnsRes.success) {
          return {
            passed: true,
            outputLine: `DNS Resolution Succeeded: www.lab.local resolved to ${dnsRes.ip} via 172.16.0.53.`,
            rulesIn: 'Application Layer DNS daemon operational.',
            rulesOut: 'Entire protocol stack from Layer 1 to Layer 7 is verified healthy!',
          };
        } else {
          return {
            passed: false,
            outputLine: `DNS Resolution Failed: ${dnsRes.detail || 'DNS server refused query.'}`,
            rulesIn: 'Application Layer failure: DNS service (port 53) down or unresponsive.',
            rulesOut: 'IP connectivity is healthy; problem is restricted to Name Resolution.',
          };
        }
      },
    },
  ];

  // Reset walkthrough state
  const resetWalkthrough = () => {
    setCurrentStepIndex(-1);
    setStepResults({});
    setIsPlaying(false);
    setHaltedAtFailure(false);
    addLog('info', 'OSI walkthrough reset. Ready to step.');
  };

  // Change scenario
  const handleScenarioChange = (idx: number) => {
    setSelectedScenarioIdx(idx);
    const scen = FAULT_SCENARIOS[idx];
    setTopology(scen.apply(createDefaultTopology()));
    resetWalkthrough();
    addLog('osi', `Walkthrough loaded Scenario 0${scen.number}: "${scen.title}".`);
  };

  // Step forward one layer
  const stepForward = () => {
    if (haltedAtFailure) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= osiChecks.length) {
      setIsPlaying(false);
      return;
    }

    const check = osiChecks[nextIndex];
    const res = check.runCheck(topology);

    setStepResults((prev) => ({
      ...prev,
      [nextIndex]: res,
    }));
    setCurrentStepIndex(nextIndex);

    addLog(
      res.passed ? 'success' : 'fault',
      `[OSI L${check.layerNumber}] ${check.layerName} Check: ${res.passed ? 'PASSED' : 'FAILED'} -> ${res.outputLine}`
    );

    // Halt at first failure
    if (!res.passed) {
      setHaltedAtFailure(true);
      setIsPlaying(false);
      addLog('error', `Walkthrough halted at Layer ${check.layerNumber} (${check.layerName})! Root cause located.`);
    }
  };

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && !haltedAtFailure) {
      timer = setTimeout(() => {
        if (currentStepIndex < osiChecks.length - 1) {
          stepForward();
        } else {
          setIsPlaying(false);
        }
      }, speedMs);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStepIndex, haltedAtFailure, speedMs]);

  const activeCheck = currentStepIndex >= 0 ? osiChecks[currentStepIndex] : null;
  const activeResult = currentStepIndex >= 0 ? stepResults[currentStepIndex] : null;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-[2rem] bg-[#0a0f0d] border border-[#78b496]/20 shadow-2xl">
        <div>
          <span className="text-[11px] font-display uppercase tracking-widest text-[#34d399] font-bold">
            SIMULATION 03 // SYSTEMATIC TESTING
          </span>
          <h3 className="text-xl sm:text-2xl font-sans font-semibold tracking-tight text-[#e8f2ec] mt-1">
            OSI Layer-by-Layer Bottom-Up Walkthrough
          </h3>
          <p className="text-xs sm:text-sm text-[#78b496]/80 mt-1 max-w-2xl font-sans">
            Step upward through the OSI stack from Physical Layer 1 to Application Layer 7. Observe how each layer check executes against the live network model and isolates the root cause.
          </p>
        </div>

        {/* Scenario Selector Dropdown */}
        <div className="flex items-center gap-2 bg-[#101713] border border-[#78b496]/20 px-3 py-2 rounded-2xl shrink-0 self-start sm:self-auto">
          <span className="text-[10px] uppercase font-display text-[#78b496]/70">Scenario:</span>
          <select
            value={selectedScenarioIdx}
            onChange={(e) => handleScenarioChange(Number(e.target.value))}
            className="bg-transparent text-[#e8f2ec] font-mono text-xs focus:outline-none cursor-pointer"
          >
            {FAULT_SCENARIOS.map((s, i) => (
              <option key={s.id} value={i} className="bg-[#0a0f0d] text-[#e8f2ec]">
                Fault 0{s.number}: {s.title.split(': ')[1] || s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Walkthrough Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Vertical OSI Stack Visualizer (rendered bottom-up!) */}
        <div className="lg:col-span-5 bg-[#0a0f0d] border border-[#78b496]/20 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#78b496]/20">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#34d399]" />
              <span className="text-xs font-display tracking-wider text-white uppercase">
                OSI Stack (Bottom-Up)
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#78b496]/70">
              Rule: Lower layer must pass first
            </span>
          </div>

          {/* Reverse array to render Layer 7 on top and Layer 1 on bottom! */}
          <div className="flex flex-col-reverse gap-3">
            {osiChecks.map((check, idx) => {
              const isCurrent = currentStepIndex === idx;
              const res = stepResults[idx];
              const isEvaluated = res !== undefined;

              return (
                <div
                  key={check.layerNumber}
                  className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    isCurrent
                      ? 'border-[#34d399] bg-[#14231b] shadow-[0_0_20px_rgba(52,211,153,0.25)] scale-[1.01]'
                      : isEvaluated
                      ? res.passed
                        ? 'border-[#34d399]/40 bg-[#1f7a4d]/10'
                        : 'border-[#f87171]/40 bg-[#f87171]/10'
                      : 'border-[#78b496]/15 bg-[#101713]/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-display text-xs font-bold ${
                          isEvaluated
                            ? res.passed
                              ? 'bg-[#1f7a4d] text-white border border-[#34d399]/40'
                              : 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/40'
                            : isCurrent
                            ? 'bg-[#34d399] text-[#050807]'
                            : 'bg-[#101713] text-[#78b496]'
                        }`}
                      >
                        L{check.layerNumber}
                      </div>
                      <div>
                        <span className="text-xs font-sans font-semibold text-white tracking-tight block">
                          {check.layerName}
                        </span>
                        <span className="text-[10px] font-mono text-[#78b496]/70">
                          {check.commandTested}
                        </span>
                      </div>
                    </div>

                    {/* Result Badge */}
                    <div>
                      {isEvaluated ? (
                        res.passed ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1f7a4d]/30 text-[#34d399] border border-[#34d399]/30 font-display text-[10px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PASS</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30 font-display text-[10px] font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>FAIL</span>
                          </div>
                        )
                      ) : isCurrent ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1f7a4d]/20 text-[#34d399] font-display text-[10px] font-bold animate-pulse border border-[#34d399]/30">
                          <span>CHECKING</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-[#78b496]/40">PENDING</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stepper Controls Bar */}
          <div className="pt-3 border-t border-[#78b496]/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={resetWalkthrough}
                className="px-3.5 py-2 rounded-xl bg-[#101713] border border-[#78b496]/20 text-[#78b496] hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                title="Reset walkthrough"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={haltedAtFailure || currentStepIndex >= osiChecks.length - 1}
                className="px-4 py-2 rounded-xl bg-[#101713] border border-[#78b496]/20 text-white text-xs font-mono hover:bg-[#13231a] transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
            </div>

            <button
              onClick={stepForward}
              disabled={haltedAtFailure || currentStepIndex >= osiChecks.length - 1}
              className="px-5 py-2 rounded-xl bg-[#1f7a4d] hover:bg-[#34d399] text-white hover:text-[#050807] text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.25)]"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Speed slider */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#78b496]/70 px-1">
            <span>Playback Speed:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSpeedMs(2500)}
                className={`px-2 py-0.5 rounded ${speedMs === 2500 ? 'bg-[#1f7a4d] text-white' : 'hover:text-white'}`}
              >
                0.5x
              </button>
              <button
                onClick={() => setSpeedMs(1500)}
                className={`px-2 py-0.5 rounded ${speedMs === 1500 ? 'bg-[#1f7a4d] text-white' : 'hover:text-white'}`}
              >
                1.0x
              </button>
              <button
                onClick={() => setSpeedMs(800)}
                className={`px-2 py-0.5 rounded ${speedMs === 800 ? 'bg-[#1f7a4d] text-white' : 'hover:text-white'}`}
              >
                2.0x
              </button>
            </div>
          </div>
        </div>

        {/* Right: Active Layer Telemetry & Verdict */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Active Layer Details Card */}
          <div className="bg-[#0a0f0d] border border-[#78b496]/20 rounded-[2rem] p-6 shadow-2xl flex-1 flex flex-col justify-between">
            {activeCheck && activeResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#78b496]/20">
                  <div>
                    <span className="text-[10px] font-display uppercase tracking-widest text-[#34d399] font-bold block">
                      Active Evaluation // Layer 0{activeCheck.layerNumber}
                    </span>
                    <h4 className="text-lg font-sans font-semibold text-white tracking-tight">
                      {activeCheck.checkTitle}
                    </h4>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full font-display text-xs font-bold ${
                      activeResult.passed
                        ? 'bg-[#1f7a4d]/20 text-[#34d399] border border-[#34d399]/40'
                        : 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/40'
                    }`}
                  >
                    {activeResult.passed ? 'CHECK PASSED' : 'CHECK FAILED'}
                  </span>
                </div>

                {/* Simulated Diagnostic Output */}
                <div className="p-4 rounded-2xl bg-[#070c09] border border-[#78b496]/20 font-mono text-xs space-y-1">
                  <div className="text-[10px] text-[#78b496]/70 uppercase tracking-wider font-display">
                    Diagnostic Command Telemetry
                  </div>
                  <div
                    className={
                      activeResult.passed ? 'text-[#34d399]' : 'text-[#f87171]'
                    }
                  >
                    {activeResult.outputLine}
                  </div>
                </div>

                {/* Deductions: Rules In vs Rules Out */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-[#101713] border border-[#78b496]/20 space-y-1">
                    <span className="text-[10px] font-display uppercase tracking-wider text-[#34d399] font-bold block">
                      Rules In (Confirmed):
                    </span>
                    <p className="text-xs text-[#c9dccf] leading-relaxed font-sans">
                      {activeResult.rulesIn}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#101713] border border-[#78b496]/20 space-y-1">
                    <span className="text-[10px] font-display uppercase tracking-wider text-[#c8b27a] font-bold block">
                      Rules Out (Eliminated):
                    </span>
                    <p className="text-xs text-[#c9dccf] leading-relaxed font-sans">
                      {activeResult.rulesOut}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500 space-y-3">
                <Layers className="w-12 h-12 text-[#78b496]/40 stroke-[1.5]" />
                <div className="space-y-1">
                  <h4 className="text-base font-sans font-semibold text-white">
                    Walkthrough Ready
                  </h4>
                  <p className="text-xs text-[#78b496]/80 max-w-sm font-sans">
                    Click <span className="text-white font-bold">&quot;Next Step&quot;</span> or <span className="text-white font-bold">&quot;Play&quot;</span> to begin testing the OSI stack bottom-up starting at Physical Layer 1.
                  </p>
                </div>
              </div>
            )}

            {/* Final Diagnostic Verdict Card (Shows when halted at failure or complete) */}
            {haltedAtFailure && (
              <div className="mt-6 p-5 rounded-2xl border border-[#f87171]/40 bg-[#f87171]/10 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#f87171]" />
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-[#f87171]">
                    Root Cause Verdict Identified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#78b496]/80 uppercase font-display block">Faulty Layer</span>
                    <span className="font-bold text-white">{currentScenario.faultyLayer}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78b496]/80 uppercase font-display block">Faulty Node</span>
                    <span className="font-bold text-white">{currentScenario.faultyDevice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#78b496]/80 uppercase font-display block">Recommended Fix</span>
                    <span className="font-bold text-[#34d399]">{currentScenario.title.split(': ')[1] || 'Apply patch'}</span>
                  </div>
                </div>

                <p className="text-xs text-[#c9dccf] pt-1 border-t border-[#f87171]/20 font-sans">
                  {currentScenario.causeDescription}
                </p>
              </div>
            )}

            {currentStepIndex === osiChecks.length - 1 && !haltedAtFailure && (
              <div className="mt-6 p-5 rounded-2xl border border-[#34d399]/40 bg-[#1f7a4d]/20 space-y-2 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-[#34d399] font-bold text-xs font-display">
                  <ShieldCheck className="w-5 h-5" />
                  <span>All Layers Operational (100% Stack Verified)</span>
                </div>
                <p className="text-xs text-[#c9dccf] font-sans">
                  All layers from Physical (Layer 1) to Application (Layer 7) have returned valid responses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostic Console at Bottom */}
      <DiagnosticConsole
        logs={logs}
        onClear={() => setLogs([])}
        title="OSI Verification & Event Telemetry Bus"
      />
    </div>
  );
}
