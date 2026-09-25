'use client';

import React, { useState } from 'react';
import {
  Layers,
  Terminal,
  ShieldAlert,
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Wrench,
  CheckCircle2,
  XCircle,
  Activity,
  Zap,
} from 'lucide-react';

export function Theory() {
  const [activeStoryTab, setActiveStoryTab] = useState<number>(0);
  const [activeCodeLang, setActiveCodeLang] = useState<'c' | 'cpp' | 'python' | 'java'>('c');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    'mod1-full': true,
    'mod2-full': false,
    'mod3-full': false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const storySteps = [
    { id: 0, num: '01', title: 'Layered Method', label: 'The Layered Approach' },
    { id: 1, num: '02', title: 'Diagnostic Toolbox', label: 'Diagnostic Tools' },
    { id: 2, num: '03', title: 'Fault Signatures', label: 'Common Fault Matrix' },
    { id: 3, num: '04', title: 'Implementation', label: 'Code & Pseudocode' },
  ];

  const codeSnippets = {
    c: `/*
 * Network Reachability Socket Probe in C
 * Standard socket-based host/port connectivity test with timeout
 * Course: Computer Networks Lab (K J Somaiya School of Engineering)
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/time.h>

int check_reachability(const char *ip_address, int port, int timeout_sec) {
    int sock_fd;
    struct sockaddr_in server_addr;
    struct timeval tv;
    struct timeval start, end;
    double rtt_ms;

    sock_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (sock_fd < 0) {
        perror("[-] Socket creation failed");
        return -1;
    }

    tv.tv_sec = timeout_sec;
    tv.tv_usec = 0;
    setsockopt(sock_fd, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tv, sizeof(tv));
    setsockopt(sock_fd, SOL_SOCKET, SO_SNDTIMEO, (const char*)&tv, sizeof(tv));

    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(port);
    inet_pton(AF_INET, ip_address, &server_addr.sin_addr);

    printf("[+] Probing %s on TCP port %d (timeout: %ds)...\\n", ip_address, port, timeout_sec);
    gettimeofday(&start, NULL);

    if (connect(sock_fd, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        gettimeofday(&end, NULL);
        if (errno == ETIMEDOUT || errno == EINPROGRESS) {
            printf("[-] Connection timed out: Host unreachable or port filtered.\\n");
        } else if (errno == ECONNREFUSED) {
            printf("[-] Connection refused: Host is UP, but port %d is CLOSED.\\n", port);
        } else {
            printf("[-] Connect failed: %s (errno=%d)\\n", strerror(errno), errno);
        }
        close(sock_fd);
        return 0;
    }

    gettimeofday(&end, NULL);
    rtt_ms = (end.tv_sec - start.tv_sec) * 1000.0 + (end.tv_usec - start.tv_usec) / 1000.0;
    printf("[+] SUCCESS: Connected to %s:%d | Handshake RTT = %.2f ms\\n", ip_address, port, rtt_ms);

    close(sock_fd);
    return 1;
}

int main(int argc, char *argv[]) {
    const char *target = (argc > 1) ? argv[1] : "172.16.0.80";
    int port = (argc > 2) ? atoi(argv[2]) : 80;
    int status = check_reachability(target, port, 2);
    printf("Verdict: %s\\n", status == 1 ? "ONLINE (PASS)" : "OFFLINE / UNREACHABLE (FAIL)");
    return (status == 1) ? 0 : 1;
}`,
    cpp: `// Network Reachability Checker in Modern C++
#include <iostream>
#include <string>
#include <chrono>
#include <cstring>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>

bool probe_endpoint(const std::string& ip, int port, int timeout_seconds = 2) {
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) return false;

    struct timeval tv{ .tv_sec = timeout_seconds, .tv_usec = 0 };
    setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
    setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv));

    struct sockaddr_in target{};
    target.sin_family = AF_INET;
    target.sin_port = htons(port);
    inet_pton(AF_INET, ip.c_str(), &target.sin_addr);

    auto start = std::chrono::high_resolution_clock::now();
    int res = connect(sock, reinterpret_cast<struct sockaddr*>(&target), sizeof(target));
    auto end = std::chrono::high_resolution_clock::now();

    auto rtt = std::chrono::duration<double, std::milli>(end - start).count();

    if (res == 0) {
        std::cout << "[+] Connected to " << ip << ":" << port << " in " << rtt << " ms\\n";
        close(sock);
        return true;
    }
    std::cout << "[-] Failed connection to " << ip << ":" << port << "\\n";
    close(sock);
    return false;
}

int main() {
    probe_endpoint("172.16.0.80", 80);
    return 0;
}`,
    python: `"""
Network Reachability Checker in Python 3
Socket-based connectivity test with timeout and summary
"""
import socket
import time
import sys

def check_reachability(host: str, port: int = 80, timeout: float = 2.0) -> dict:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    start = time.perf_counter()
    try:
        s.connect((host, port))
        rtt_ms = (time.perf_counter() - start) * 1000.0
        s.close()
        return {"reachable": True, "host": host, "port": port, "rtt_ms": round(rtt_ms, 2), "status": "OPEN"}
    except socket.timeout:
        return {"reachable": False, "host": host, "port": port, "status": "TIMEOUT (Firewall drop)"}
    except ConnectionRefusedError:
        return {"reachable": False, "host": host, "port": port, "status": "REFUSED (Service not listening)"}
    except Exception as e:
        return {"reachable": False, "host": host, "port": port, "status": f"ERROR: {e}"}

if __name__ == "__main__":
    res = check_reachability("172.16.0.80", 80)
    print(res)`,
    java: `/**
 * Java Reachability Probe
 */
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;

public class ReachabilityChecker {
    public static boolean checkReachability(String host, int port, int timeoutMs) {
        long start = System.nanoTime();
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            double rtt = (System.nanoTime() - start) / 1_000_000.0;
            System.out.printf("[+] Connected to %s:%d (%.2f ms)%n", host, port, rtt);
            return true;
        } catch (IOException e) {
            System.err.printf("[-] Connection failed to %s:%d: %s%n", host, port, e.getMessage());
            return false;
        }
    }
    public static void main(String[] args) {
        checkReachability("172.16.0.80", 80, 2000);
    }
}`,
  };

  const pingParserPython = `import re

def parse_ping_output(raw_output: str) -> dict:
    """Parses standard ping stdout and reports loss % and average RTT."""
    loss_match = re.search(r'\\((\\d+)%\\s+loss\\)', raw_output) or re.search(r'(\\d+)%\\s+packet\\s+loss', raw_output)
    loss = int(loss_match.group(1)) if loss_match else None

    avg_match = re.search(r'Average\\s*=\\s*(\\d+)ms', raw_output) or re.search(r'=\\s*[\\d.]+/([\\d.]+)/', raw_output)
    avg_rtt = float(avg_match.group(1)) if avg_match else None

    return {
        "packet_loss_percent": loss,
        "average_rtt_ms": avg_rtt,
        "is_healthy": loss == 0 and avg_rtt is not None
    }`;

  const pseudocodeLines = [
    'PROCEDURE SystematicNetworkTroubleshooting(SourceHost, TargetHost, TargetPort):',
    '  // Phase 1: Physical Layer (Carrier & Cables)',
    '  IF NOT CheckPhysicalCarrier(SourceHost.Interface) THEN',
    '    RETURN ReportFailure("Physical Layer: Cable unplugged or bad link", Fix="Check RJ-45 cable & switch port")',
    '  END IF',
    '',
    '  // Phase 2: Data Link Layer (ARP & Duplicate MAC)',
    '  IF HasDuplicateIpConflict(SourceHost) THEN',
    '    RETURN ReportFailure("Data Link Layer: Duplicate IP MAC conflict detected", Fix="Reassign host to unique IP")',
    '  END IF',
    '',
    '  // Phase 3: Network Layer (IP, Subnet & Gateway)',
    '  IF IsApipaAddress(SourceHost.IP) THEN',
    '    RETURN ReportFailure("Network Layer: DHCP lease failure (APIPA 169.254.x.x)", Fix="Renew DHCP / assign static IP")',
    '  END IF',
    '',
    '  IF NOT Ping(SourceHost.DefaultGateway) THEN',
    '    RETURN ReportFailure("Network Layer: Gateway unreachable", Fix="Verify router interface IP & local subnet mask")',
    '  END IF',
    '',
    '  // Phase 4: Path Routing (Divide-and-Conquer)',
    '  HopList = Traceroute(TargetHost.IP)',
    '  IF BrokenHop := FindFirstTimeout(HopList) THEN',
    '    RETURN ReportFailure("Network Layer: Route drop at " + BrokenHop, Fix="Verify static routing table & return route")',
    '  END IF',
    '',
    '  // Phase 5: Transport Layer (TCP Port Handshake)',
    '  IF NOT TcpHandshake(TargetHost.IP, TargetPort) THEN',
    '    IF Ping(TargetHost.IP) THEN',
    '      RETURN ReportFailure("Transport Layer: Port " + TargetPort + " blocked by firewall or closed", Fix="Adjust firewall ACL")',
    '    END IF',
    '  END IF',
    '',
    '  // Phase 6: Application Layer (DNS & HTTP)',
    '  IF IsHostname(TargetHost) AND NOT ResolveDNS(TargetHost) THEN',
    '    RETURN ReportFailure("Application Layer: DNS server down or non-existent domain", Fix="Start named/DNS service on port 53")',
    '  END IF',
    '',
    '  RETURN ReportSuccess("All OSI Layers 1 through 7 Verified Healthy")',
    'END PROCEDURE',
  ];

  return (
    <div id="theory" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Pinned Scroll-Story Header (lab0.ai style) */}
      <div className="space-y-4">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#34d399] font-semibold block">
          Theoretical Principles &bull; Diagnostic Methodology
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
          Systematic Network Troubleshooting
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          Four interconnected modules detailing the layered bottom-up approach, diagnostic utility internals, the common fault matrix, and algorithmic implementations.
        </p>
      </div>

      {/* Step Selector Tab Bar (pinned / sticky feel from lab0.ai 04-scroll-story-step3.png) */}
      <div className="flex items-center justify-between border-b border-hairline pb-3 overflow-x-auto [scrollbar-width:none]">
        <div className="flex items-center gap-2 sm:gap-4">
          {storySteps.map((step) => {
            const isActive = activeStoryTab === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStoryTab(step.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer relative ${
                  isActive
                    ? 'text-white bg-[#0e1612] border border-hairline-bright shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <span
                  className={`font-homevideo text-[10px] ${
                    isActive ? 'text-[#34d399]' : 'text-neutral-500'
                  }`}
                >
                  {step.num}
                </span>
                <span>{step.title}</span>
                {isActive && (
                  <span className="absolute bottom-[-13px] left-2 right-2 h-0.5 bg-[#34d399]" />
                )}
              </button>
            );
          })}
        </div>

        <span className="hidden sm:inline-block text-[11px] font-mono text-neutral-500">
          Click tabs or explore sections &darr;
        </span>
      </div>

      {/* Theory Module Views - Stabilized Container */}
      <div className="w-full min-h-[640px] relative">
        {/* Step 01: The Layered Approach (OSI-Based Diagnosis) */}
        {activeStoryTab === 0 && (
          <section id="module-01" className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] font-homevideo text-[#34d399] tracking-wider uppercase block">
                01 THE LAYERED METHOD
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                Check the plug first. <br />
                <span className="text-neutral-400 font-normal">Isolate bottom-up.</span>
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pt-2">
                A layer can only work if every single layer beneath it is fully functional. By climbing the stack from Physical (L1) to Application (L7), you eliminate false theories before checking complex software.
              </p>
            </div>

            {/* Visual Illustration: Source Telemetry Cards -> Flowing Curved Beams -> Pale Sage Paper Card */}
            <div className="lg:col-span-7 bg-[#0c120f]/65 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)] relative overflow-hidden flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <span className="text-[10px] font-homevideo text-neutral-400 tracking-wider">
                  OSI STACK EVALUATOR
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-homevideo text-[9px] bg-emerald-tint border border-emerald-glow/30 text-[#34d399]">
                  L1 &rarr; L7 HIERARCHY
                </span>
              </div>

              {/* Connected Telemetry Layout with SVG Curved Beams */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Left Source Cards */}
                <div className="md:col-span-5 space-y-2">
                  <div className="p-3 rounded-xl bg-[#080d0b] border border-hairline text-xs font-mono space-y-1">
                    <span className="text-[9px] text-[#34d399] font-bold block uppercase">
                      L1 Physical Carrier
                    </span>
                    <span className="text-white text-[11px] block">link_carrier: UP (1Gbps)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#080d0b] border border-hairline text-xs font-mono space-y-1">
                    <span className="text-[9px] text-[#34d399] font-bold block uppercase">
                      L2 Data Link / ARP
                    </span>
                    <span className="text-white text-[11px] block">arp_cache: 192.168.1.1 OK</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#080d0b] border border-hairline text-xs font-mono space-y-1">
                    <span className="text-[9px] text-[#34d399] font-bold block uppercase">
                      L3 Gateway Route
                    </span>
                    <span className="text-white text-[11px] block">ping_gateway: 1ms RTT</span>
                  </div>
                </div>

                {/* Center: Glowing Curved Beams SVG */}
                <div className="hidden md:flex md:col-span-2 items-center justify-center">
                  <svg viewBox="0 0 60 120" className="w-12 h-28 overflow-visible">
                    <path
                      d="M 0 25 C 30 25, 30 60, 60 60"
                      stroke="#34d399"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="4 4"
                      className="animate-beam-flow"
                    />
                    <path
                      d="M 0 60 L 60 60"
                      stroke="#34d399"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="4 4"
                      className="animate-beam-flow"
                    />
                    <path
                      d="M 0 95 C 30 95, 30 60, 60 60"
                      stroke="#34d399"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="4 4"
                      className="animate-beam-flow"
                    />
                  </svg>
                </div>

                {/* Right: Sage "Paper Card" (lab0.ai document card pattern) */}
                <div className="md:col-span-5 p-4 rounded-2xl bg-paper-bg text-paper-fg shadow-xl space-y-2 border border-paper-border">
                  <div className="flex items-center justify-between border-b border-paper-border pb-1.5">
                    <span className="text-[9px] font-homevideo font-bold uppercase tracking-wider text-neutral-800">
                      LAYER EVALUATION RECORD
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-black/10 px-1.5 py-0.5 rounded">
                      PASS 5 / 5
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span>L1 Physical:</span>
                      <strong className="text-emerald-800">CARRIER UP</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>L2 Data Link:</span>
                      <strong className="text-emerald-800">ARP RESOLVED</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>L3 Network:</span>
                      <strong className="text-emerald-800">ROUTING OK</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>L4 Transport:</span>
                      <strong className="text-emerald-800">PORT 80 OPEN</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>L7 Application:</span>
                      <strong className="text-emerald-800">DNS RESOLVED</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Full Theory Accordion for Module 01 */}
          <div className="border border-white/10 rounded-2xl bg-[#0c120f]/60 backdrop-blur-xl overflow-hidden">
            <button
              onClick={() => toggleAccordion('mod1-full')}
              className="w-full p-4 flex items-center justify-between text-xs font-semibold text-white hover:bg-white/[0.02] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#34d399]" />
                <span>Full Reference: Symptoms, Television Analogy, & Advantages/Disadvantages</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform ${
                  openAccordions['mod1-full'] ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openAccordions['mod1-full'] && (
              <div className="p-6 pt-2 border-t border-hairline space-y-4 text-xs text-neutral-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-black/40 border border-hairline space-y-1.5">
                  <span className="font-homevideo text-[10px] text-[#34d399] uppercase tracking-wider block">
                    The Television Plug Analogy:
                  </span>
                  <p>
                    Checking the wall electrical plug before taking apart the television circuit board. If power (Physical Layer 1) is disconnected, no internal microprocessor or display tube (Application Layer 7) can ever function.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-black/40 border border-hairline space-y-2">
                    <span className="font-homevideo text-[10px] text-[#34d399] uppercase tracking-wider block">
                      Advantages (3 Key Principles):
                    </span>
                    <ul className="space-y-1 list-disc pl-4 text-neutral-300">
                      <li>Deterministic triage eliminates premature application debugging when cables are loose</li>
                      <li>Prevents compounding outages by avoiding random service restarts and OS reinstalls</li>
                      <li>Establishes clean handoff boundaries between hardware technicians and network engineers</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-hairline space-y-2">
                    <span className="font-homevideo text-[10px] text-[#ff9f0a] uppercase tracking-wider block">
                      Disadvantages & Limitations:
                    </span>
                    <ul className="space-y-1 list-disc pl-4 text-neutral-300">
                      <li>Can be slower when an obvious high-layer typo exists in an HTTP URL or API payload</li>
                      <li>Requires broad technical mastery across physical transceivers, ARP, IP, and TCP</li>
                      <li>Modern overlay networks (VXLAN/SDN) blur pure physical boundaries</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Step 02: The Diagnostic Toolbox */}
      {activeStoryTab === 1 && (
        <section id="module-02" className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-3">
              <span className="text-[10px] font-homevideo text-[#34d399] tracking-wider uppercase block">
                02 THE DIAGNOSTIC TOOLBOX
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                One tool. <br />
                <span className="text-neutral-400 font-normal">One specific question.</span>
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pt-2">
                A mechanic does not use a tire gauge to measure spark plug gap. Each diagnostic utility interrogates one layer of protocol data with mathematical precision.
              </p>
            </div>

            {/* Visual Gold/Champagne Highlight Card + Tool Windows */}
            <div className="lg:col-span-7 space-y-4">
              {/* Gold / Champagne Result Card (lab0.ai pattern) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-gold-from to-gold-to text-gold-fg shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-homevideo uppercase tracking-widest font-bold opacity-80">
                    DIAGNOSTIC BENCHMARK RESOLVED
                  </span>
                  <span className="text-xs font-mono font-bold">14ms RTT</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-tight">
                  <span className="line-through opacity-50 mr-2">Request timed out</span> &rarr; 4/4 Replies Received
                </div>
                <p className="text-xs font-medium opacity-90">
                  Target: 172.16.0.80 &bull; Gateway Hop: 192.168.1.1 &bull; Port 80 Handshake Verified
                </p>
              </div>

              {/* Compact Tool Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { cmd: 'ping <target>', layer: 'L3 ICMP', question: 'Is host reachable and returning Echo Replies?' },
                  { cmd: 'tracert <target>', layer: 'L3 TTL', question: 'Where along the multi-hop path is routing dropping?' },
                  { cmd: 'ipconfig /all', layer: 'L3 IP Config', question: 'What is my local IP, mask, gateway, and DNS?' },
                  { cmd: 'nslookup <name>', layer: 'L7 DNS', question: 'Does DNS translate the hostname to the target IP?' },
                  { cmd: 'arp -a', layer: 'L2 MAC Map', question: 'Are IP-to-MAC hardware translations valid and dynamic?' },
                  { cmd: 'telnet <host> <port>', layer: 'L4 TCP', question: 'Can a TCP 3-way handshake complete to that port?' },
                ].map((t, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#0c120f]/65 backdrop-blur-xl border border-white/10 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-[#34d399]">{t.cmd}</span>
                      <span className="text-[9px] font-homevideo px-1.5 py-0.5 rounded bg-black/40 text-neutral-400">
                        {t.layer}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-snug">{t.question}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 03: Common Faults and their Signatures */}
      {activeStoryTab === 2 && (
        <section id="module-03" className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-2">
            <span className="text-[10px] font-homevideo text-[#34d399] tracking-wider uppercase block">
              03 COMMON FAULTS & SIGNATURES
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Diagnostic Fault Signature Matrix
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl">
              Recognize the exact output fingerprints of physical, logical, and application faults.
            </p>
          </div>

          {/* Fault Matrix Table with Hairline Borders */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0c120f]/65 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            <table className="w-full text-left font-mono text-xs min-w-[700px]">
              <thead className="bg-[#050807] text-neutral-400 border-b border-hairline uppercase text-[10px] tracking-wider font-homevideo">
                <tr>
                  <th className="p-3.5">Fault Condition</th>
                  <th className="p-3.5">Observable Symptom</th>
                  <th className="p-3.5">Revealing Command</th>
                  <th className="p-3.5">Engineering Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-neutral-300">
                <tr>
                  <td className="p-3.5 font-bold text-white">Unplugged Cable / Bad Transceiver</td>
                  <td className="p-3.5 text-neutral-400">No connectivity; carrier signal down</td>
                  <td className="p-3.5 text-[#34d399]">ipconfig (media disconnected)</td>
                  <td className="p-3.5 text-emerald-bright">Reconnect patch cord to active port</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white">Wrong Subnet Mask (/16 vs /24)</td>
                  <td className="p-3.5 text-neutral-400">Remote hosts treated as local; ARP timeouts</td>
                  <td className="p-3.5 text-[#34d399]">ipconfig /all & arp -a</td>
                  <td className="p-3.5 text-emerald-bright">Set subnet mask to 255.255.255.0</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white">Incorrect Default Gateway</td>
                  <td className="p-3.5 text-neutral-400">LAN works; remote/internet pings fail</td>
                  <td className="p-3.5 text-[#34d399]">ping &lt;gateway&gt;</td>
                  <td className="p-3.5 text-emerald-bright">Set gateway to 192.168.1.1</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white">DHCP Failure (APIPA 169.254.x.x)</td>
                  <td className="p-3.5 text-neutral-400">Limited connectivity; empty default gateway</td>
                  <td className="p-3.5 text-[#34d399]">ipconfig /all</td>
                  <td className="p-3.5 text-emerald-bright">Renew DHCP lease or assign static IP</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white">Duplicate IP Address Conflict</td>
                  <td className="p-3.5 text-neutral-400">Intermittent 50% packet drop; MAC flapping</td>
                  <td className="p-3.5 text-[#34d399]">arp -a</td>
                  <td className="p-3.5 text-emerald-bright">Reassign conflicting host to unique IP</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white">DNS Server Daemon Down</td>
                  <td className="p-3.5 text-neutral-400">Ping by IP succeeds; ping by name fails</td>
                  <td className="p-3.5 text-[#34d399]">nslookup www.lab.local</td>
                  <td className="p-3.5 text-emerald-bright">Start named / DNS service on port 53</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white">Missing Asymmetric Return Route</td>
                  <td className="p-3.5 text-neutral-400">Tracert stops at hop 2; forward OK, reply drops</td>
                  <td className="p-3.5 text-[#34d399]">tracert 172.16.0.80</td>
                  <td className="p-3.5 text-emerald-bright">Add return route 192.168.1.0/24 on R2</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-white">Firewall Dropping TCP Port 80</td>
                  <td className="p-3.5 text-neutral-400">Ping replies normally, but browser connection fails</td>
                  <td className="p-3.5 text-[#34d399]">telnet 172.16.0.80 80</td>
                  <td className="p-3.5 text-emerald-bright">Permit inbound port 80 in firewall ACL</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Step 04: Implementation (Code & Pseudocode) */}
      {activeStoryTab === 3 && (
        <section id="module-04" className="space-y-8 animate-in fade-in duration-300">
          <div className="space-y-2">
            <span className="text-[10px] font-homevideo text-[#34d399] tracking-wider uppercase block">
              04 IMPLEMENTATION & CODE
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Reachability Probes in C, C++, Python, & Java
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl">
              Laboratory-standard implementations of socket-level reachability checkers with timeouts and RTT metrics.
            </p>
          </div>

          {/* Product Window Code Viewer */}
          <div className="rounded-[2rem] bg-[#0c120f]/65 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            {/* Window Top Bar */}
            <div className="px-5 py-3.5 bg-[#050807] border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                <span className="text-[10px] font-homevideo text-neutral-400 ml-2 tracking-wider">
                  SOURCE / REACHABILITY_PROBE.{activeCodeLang}
                </span>
              </div>

              {/* Language Pills */}
              <div className="flex items-center gap-1.5">
                {(['c', 'cpp', 'python', 'java'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveCodeLang(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeCodeLang === lang
                        ? 'bg-emerald-solid text-white border border-emerald-glow/40 shadow-sm'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}

                <button
                  onClick={() => copyToClipboard(codeSnippets[activeCodeLang], activeCodeLang)}
                  className="ml-2 flex items-center gap-1 px-3 py-1 rounded-lg bg-neutral-900 border border-hairline text-neutral-300 hover:text-white text-xs font-mono cursor-pointer"
                >
                  {copiedKey === activeCodeLang ? (
                    <Check className="w-3.5 h-3.5 text-[#34d399]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === activeCodeLang ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-6 overflow-x-auto font-mono text-xs leading-relaxed text-zinc-300 [scrollbar-width:thin]">
              <pre>
                <code>{codeSnippets[activeCodeLang]}</code>
              </pre>
            </div>
          </div>

          {/* Decision Procedure Pseudocode with Line Numbers */}
          <div className="rounded-[2rem] bg-[#0c120f] border border-hairline overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div>
                <span className="text-[10px] font-homevideo text-[#34d399] tracking-wider uppercase block">
                  SYSTEMATIC ALGORITHM
                </span>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Troubleshooting Decision Procedure Pseudocode
                </h4>
              </div>

              <button
                onClick={() => copyToClipboard(pseudocodeLines.join('\n'), 'pseudo')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 border border-hairline text-neutral-300 hover:text-white text-xs font-mono cursor-pointer"
              >
                {copiedKey === 'pseudo' ? <Check className="w-3.5 h-3.5 text-[#34d399]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'pseudo' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#050807] border border-hairline font-mono text-xs overflow-x-auto leading-relaxed select-text">
              {pseudocodeLines.map((line, idx) => (
                <div key={idx} className="flex">
                  <span className="w-8 text-neutral-600 select-none text-right pr-3 font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-neutral-300">{line || '\u00A0'}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
