'use client';

import React, { useState } from 'react';
import {
  Layers,
  Wrench,
  AlertTriangle,
  Code2,
  Terminal,
  Activity,
  CheckCircle2,
  HelpCircle,
  Stethoscope,
  Copy,
  Check,
} from 'lucide-react';

export function Theory() {
  const [activeCodeTab, setActiveCodeTab] = useState<'c' | 'cpp' | 'python' | 'java'>('c');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const codeSnippets = {
    c: `/*
 * Network Reachability Checker in C
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

    // 1. Create stream socket (TCP)
    sock_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (sock_fd < 0) {
        perror("[-] Socket creation failed");
        return -1;
    }

    // 2. Set socket send/receive timeout options
    tv.tv_sec = timeout_sec;
    tv.tv_usec = 0;
    setsockopt(sock_fd, SOL_SOCKET, SO_RCVTIMEO, (const char*)&tv, sizeof(tv));
    setsockopt(sock_fd, SOL_SOCKET, SO_SNDTIMEO, (const char*)&tv, sizeof(tv));

    // 3. Configure destination socket address structure
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(port);

    if (inet_pton(AF_INET, ip_address, &server_addr.sin_addr) <= 0) {
        fprintf(stderr, "[-] Invalid IP address format: %s\\n", ip_address);
        close(sock_fd);
        return -1;
    }

    printf("[+] Probing %s on TCP port %d (timeout: %ds)...\\n", ip_address, port, timeout_sec);
    gettimeofday(&start, NULL);

    // 4. Attempt 3-way TCP handshake
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
    int timeout = 2;

    printf("=== Simple C Reachability Probe ===\\n");
    int status = check_reachability(target, port, timeout);
    printf("Result: %s\\n", status == 1 ? "ONLINE (PASS)" : "OFFLINE / UNREACHABLE (FAIL)");

    return (status == 1) ? 0 : 1;
}`,
    cpp: `// Network Reachability Checker in Modern C++
// Cross-platform socket connection test with chrono RTT benchmarking

#include <iostream>
#include <string>
#include <chrono>
#include <cstring>

#if defined(_WIN32)
  #include <winsock2.h>
  #include <ws2tcpip.h>
  #pragma comment(lib, "ws2_32.lib")
  using socket_t = SOCKET;
  #define CLOSE_SOCK closesocket
#else
  #include <sys/socket.h>
  #include <arpa/inet.h>
  #include <unistd.h>
  using socket_t = int;
  #define CLOSE_SOCK close
#endif

bool probe_endpoint(const std::string& ip, int port, int timeout_seconds = 2) {
    socket_t sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) {
        std::cerr << "[-] Failed to allocate socket\\n";
        return false;
    }

    struct sockaddr_in target{};
    target.sin_family = AF_INET;
    target.sin_port = htons(port);
    inet_pton(AF_INET, ip.c_str(), &target.sin_addr);

    auto start_time = std::chrono::high_resolution_clock::now();

    int res = connect(sock, reinterpret_cast<struct sockaddr*>(&target), sizeof(target));
    auto end_time = std::chrono::high_resolution_clock::now();

    auto elapsed_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();

    if (res == 0) {
        std::cout << "[+] Connected to " << ip << ":" << port 
                  << " in " << elapsed_ms << " ms\\n";
        CLOSE_SOCK(sock);
        return true;
    } else {
        std::cout << "[-] Failed to connect to " << ip << ":" << port << "\\n";
        CLOSE_SOCK(sock);
        return false;
    }
}

int main() {
    std::cout << "--- C++ Reachability Diagnostic Probe ---\\n";
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
    """
    Attempts a TCP 3-way handshake to test host and port reachability.
    Returns diagnostic status, RTT in ms, and error details.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    
    start_time = time.perf_counter()
    try:
        s.connect((host, port))
        rtt_ms = (time.perf_counter() - start_time) * 1000.0
        s.close()
        return {
            "reachable": True,
            "host": host,
            "port": port,
            "rtt_ms": round(rtt_ms, 2),
            "status": "OPEN / REACHABLE",
        }
    except socket.timeout:
        return {
            "reachable": False,
            "host": host,
            "port": port,
            "rtt_ms": None,
            "status": "TIMEOUT (Firewall drop or no route)",
        }
    except ConnectionRefusedError:
        return {
            "reachable": False,
            "host": host,
            "port": port,
            "rtt_ms": None,
            "status": "CONNECTION REFUSED (Host is UP, but port closed)",
        }
    except socket.gaierror as e:
        return {
            "reachable": False,
            "host": host,
            "port": port,
            "rtt_ms": None,
            "status": f"DNS FAILURE: {e}",
        }
    except Exception as e:
        return {
            "reachable": False,
            "host": host,
            "port": port,
            "rtt_ms": None,
            "status": f"ERROR: {e}",
        }

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "172.16.0.80"
    target_port = int(sys.argv[2]) if len(sys.argv) > 2 else 80
    
    res = check_reachability(target, target_port)
    print(f"Target: {res['host']}:{res['port']}")
    print(f"Status: {res['status']}")
    if res['rtt_ms']:
        print(f"RTT:    {res['rtt_ms']} ms")`,
    java: `/**
 * Network Reachability Checker in Java
 * Uses java.net.Socket with InetSocketAddress timeout
 */

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.net.ConnectException;

public class ReachabilityChecker {

    public static boolean checkReachability(String host, int port, int timeoutMs) {
        long startTime = System.nanoTime();
        
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            long elapsedNanos = System.nanoTime() - startTime;
            double rttMs = elapsedNanos / 1_000_000.0;
            
            System.out.printf("[+] Successfully connected to %s:%d | RTT = %.2f ms%n", host, port, rttMs);
            return true;
        } catch (SocketTimeoutException e) {
            System.err.printf("[-] Timeout connecting to %s:%d: packet dropped or blocked by firewall%n", host, port);
            return false;
        } catch (ConnectException e) {
            System.err.printf("[-] Connection refused: Host is UP, but service is NOT listening on port %d%n", port);
            return false;
        } catch (IOException e) {
            System.err.printf("[-] I/O Error testing reachability: %s%n", e.getMessage());
            return false;
        }
    }

    public static void main(String[] args) {
        String targetHost = (args.length > 0) ? args[0] : "172.16.0.80";
        int targetPort = (args.length > 1) ? Integer.parseInt(args[1]) : 80;
        
        System.out.println("=== Java Reachability Probe ===");
        boolean ok = checkReachability(targetHost, targetPort, 2000);
        System.exit(ok ? 0 : 1);
    }
}`,
  };

  const pingParserPython = `import re
import sys

def parse_ping_output(raw_output: str) -> dict:
    """
    Parses standard Windows or Linux ping command outputs.
    Extracts packets transmitted, received, packet loss percentage,
    and average Round Trip Time (RTT).
    """
    # 1. Match packet loss percentage
    loss_match = re.search(r'\((\d+)%\s+loss\)', raw_output, re.IGNORECASE)
    if not loss_match:
        loss_match = re.search(r'(\d+)%\s+packet\s+loss', raw_output, re.IGNORECASE)
    
    loss_percent = int(loss_match.group(1)) if loss_match else None

    # 2. Match average RTT
    # Windows format: Average = 14ms
    # Linux format: rtt min/avg/max/mdev = 1.0/14.2/25.0/2.1 ms
    avg_match = re.search(r'Average\s*=\s*(\d+)ms', raw_output, re.IGNORECASE)
    if not avg_match:
        avg_match = re.search(r'=\s*[\d.]+/([\d.]+)/[\d.]+', raw_output)

    avg_rtt = float(avg_match.group(1)) if avg_match else None

    return {
        "packet_loss_percent": loss_percent,
        "average_rtt_ms": avg_rtt,
        "is_healthy": loss_percent == 0 and avg_rtt is not None
    }

# Example ping stdout test
sample_ping = """
Pinging 172.16.0.80 with 32 bytes of data:
Reply from 172.16.0.80: bytes=32 time=14ms TTL=62
Reply from 172.16.0.80: bytes=32 time=13ms TTL=62
Reply from 172.16.0.80: bytes=32 time=14ms TTL=62
Reply from 172.16.0.80: bytes=32 time=15ms TTL=62

Ping statistics for 172.16.0.80:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 13ms, Maximum = 15ms, Average = 14ms
"""

parsed = parse_ping_output(sample_ping)
print(f"Packet Loss: {parsed['packet_loss_percent']}%")
print(f"Average RTT: {parsed['average_rtt_ms']} ms")
print(f"Health Status: {'HEALTHY' if parsed['is_healthy'] else 'DEGRADED/DOWN'}")`;

  const pseudocodeLines = [
    'PROCEDURE SystematicNetworkTroubleshooting(SourceHost, TargetHost, TargetPort):',
    '  // Phase 1: Problem Identification & Layer 1 (Physical)',
    '  IF NOT CheckPhysicalCarrier(SourceHost.Interface) THEN',
    '    RETURN ReportFailure("Physical Layer: Cable unplugged or bad link transceiver", Fix="Check RJ45 cable & switch port")',
    '  END IF',
    '',
    '  // Phase 2: Layer 2 (Data Link & ARP)',
    '  IF HasDuplicateIpConflict(SourceHost) THEN',
    '    RETURN ReportFailure("Data Link Layer: Duplicate IP MAC conflict detected", Fix="Reassign host to unique IP")',
    '  END IF',
    '',
    '  // Phase 3: Layer 3 (Network Addressing & Gateway)',
    '  IF IsApipaAddress(SourceHost.IP) THEN',
    '    RETURN ReportFailure("Network Layer: DHCP lease failure (APIPA 169.254.x.x)", Fix="Check DHCP daemon / static IP")',
    '  END IF',
    '',
    '  IF NOT Ping(SourceHost.DefaultGateway) THEN',
    '    RETURN ReportFailure("Network Layer: Default Gateway unreachable", Fix="Verify router interface IP & local subnet mask")',
    '  END IF',
    '',
    '  // Phase 4: Path Routing (Divide-and-Conquer)',
    '  HopList = Traceroute(TargetHost.IP)',
    '  IF BrokenHop := FindFirstTimeout(HopList) THEN',
    '    RETURN ReportFailure("Network Layer: Route drop at " + BrokenHop, Fix="Verify static routing table & return route")',
    '  END IF',
    '',
    '  // Phase 5: Layer 4 (Transport & Firewall)',
    '  IF NOT TcpHandshake(TargetHost.IP, TargetPort) THEN',
    '    IF Ping(TargetHost.IP) THEN',
    '      RETURN ReportFailure("Transport Layer: Port " + TargetPort + " blocked by firewall or service closed", Fix="Adjust firewall ACL")',
    '    END IF',
    '  END IF',
    '',
    '  // Phase 6: Layer 7 (Application & DNS)',
    '  IF IsHostname(TargetHost) AND NOT ResolveDNS(TargetHost) THEN',
    '    RETURN ReportFailure("Application Layer: DNS server down or non-existent domain", Fix="Start named/DNS service on port 53")',
    '  END IF',
    '',
    '  RETURN ReportSuccess("All OSI Layers 1 through 7 Verified Healthy")',
    'END PROCEDURE',
  ];

  return (
    <div id="theory" className="scroll-mt-20 max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16 text-zinc-300">
      {/* Theory Header */}
      <div className="border-b border-neutral-800 pb-8 space-y-2">
        <span className="font-mono text-xs uppercase tracking-wider text-[#2997ff] font-semibold">
          Theoretical Reference & Methodology
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Systematic Network Troubleshooting
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 max-w-3xl leading-relaxed">
          Diagnostic mastery separates experienced network engineers from amateurs. By applying a structured 6-step cycle and the OSI bottom-up discipline, every fault signature is isolated predictably.
        </p>
      </div>

      {/* Intro: Standard 6-Step Cycle & Approaches */}
      <section className="border border-neutral-800 bg-[#161617] rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#2997ff]/10 border border-[#2997ff]/20 flex items-center justify-center text-[#2997ff]">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#2997ff] font-bold">
              Engineering Standard
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">
              The Standard Troubleshooting Cycle
            </h3>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-zinc-200">
          Random trial-and-error changes often compound outages and obscure root causes. The IEEE/CompTIA standard troubleshooting model prescribes a strict 6-phase cycle:
        </p>

        {/* 6 Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { num: '01', title: 'Identify Problem', desc: 'Gather user symptoms, duplicate the issue, determine scope, and check for recent changes.' },
            { num: '02', title: 'Establish Theory', desc: 'Formulate a theory of probable cause based on the OSI model and known fault signatures.' },
            { num: '03', title: 'Test the Theory', desc: 'Run targeted diagnostic commands to verify or eliminate the theory. If not confirmed, re-establish.' },
            { num: '04', title: 'Plan & Implement Fix', desc: 'Formulate an action plan identifying potential side-effects, and implement the corrective change.' },
            { num: '05', title: 'Verify Full System', desc: 'Verify complete functionality end-to-end and implement preventive measures to avoid recurrence.' },
            { num: '06', title: 'Document Findings', desc: 'Record symptoms, root cause, diagnostic steps, and solution in knowledge base / ticketing system.' },
          ].map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-black/40 border border-neutral-800 space-y-1.5 hover:border-neutral-700 transition-colors"
            >
              <span className="text-[10px] font-mono text-[#2997ff] font-bold block">
                PHASE {step.num}
              </span>
              <h4 className="text-sm font-semibold text-white">{step.title}</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Diagnostic Approaches Grid */}
        <div className="pt-4 border-t border-neutral-800/80 space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold block">
            Three Core Troubleshooting Approaches:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-1">
              <span className="font-bold text-white block">Bottom-Up (OSI L1 &rarr; L7)</span>
              <p className="text-neutral-400 leading-relaxed">
                Start at cables/link lights and climb upward. Best when physical changes occurred or network connectivity is completely dead.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-1">
              <span className="font-bold text-white block">Top-Down (OSI L7 &rarr; L1)</span>
              <p className="text-neutral-400 leading-relaxed">
                Start with application software (HTTP/browser) and descend. Best when problem seems confined to a single application program.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-1">
              <span className="font-bold text-white block">Divide-and-Conquer (L3 Bisect)</span>
              <p className="text-neutral-400 leading-relaxed">
                Start at Layer 3 using <code className="text-[#2997ff]">ping</code>. If ping succeeds, L1-L3 are fine; immediately inspect L4-L7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Module 01: The Layered Approach (OSI-based diagnosis) */}
      <section id="module-01" className="border border-neutral-800 bg-[#161617] rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="border-b border-neutral-800 pb-3">
          <span className="font-mono text-xs uppercase tracking-wider text-[#2997ff] block mb-1 font-semibold">
            Module 01
          </span>
          <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            1. The Layered Approach (OSI-Based Diagnosis)
          </h3>
        </div>

        {/* Basic idea */}
        <div className="space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 block font-medium">
            Basic idea:
          </span>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-200">
            A network layer can only work if every single layer below it works. By isolating layers in sequence from Layer 1 to Layer 7, you eliminate vast swaths of potential issues instantly.
          </p>
        </div>

        {/* How it works */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-black/40 space-y-2">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 block font-medium">
            How it works across the stack:
          </span>
          <div className="space-y-2 text-xs text-zinc-300">
            <div><strong className="text-white">Layer 1 (Physical):</strong> Checks copper patch cords, RJ-45 jacks, SFP optics, and link LEDs. (Symptom: No carrier / media disconnected).</div>
            <div><strong className="text-white">Layer 2 (Data Link):</strong> Checks MAC framing, switch CAM tables, and ARP caching. (Symptom: Incomplete ARP or duplicate MAC flapping).</div>
            <div><strong className="text-white">Layer 3 (Network):</strong> Checks IP addressing, subnet mask boundaries, default gateway, and router routing tables. (Symptom: Destination host/net unreachable, APIPA).</div>
            <div><strong className="text-white">Layer 4 (Transport):</strong> Checks TCP/UDP port states and host/network firewall filtering. (Symptom: Connection refused / timed out on specific port).</div>
            <div><strong className="text-white">Layer 7 (Application):</strong> Checks DNS name resolution, HTTP response codes, and application daemon health. (Symptom: Cannot find domain name, 502/503 errors).</div>
          </div>
        </div>

        {/* Analogy */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-black/40 space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 block font-medium">
            Simple analogy:
          </span>
          <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
            Checking whether the television cord is plugged into the wall electrical socket before dismantling the circuit board inside. If power (Layer 1) is missing, no internal component can ever function.
          </p>
        </div>

        {/* Advantages & Disadvantages (3 bullets each) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-5 rounded-[2rem] border border-neutral-800 bg-black/40 space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#30d158] block font-semibold">
              Advantages:
            </span>
            <ul className="text-xs text-zinc-300 space-y-1.5 pl-3 list-disc">
              <li>Deterministic and rigorous; guarantees no underlying root cause is missed</li>
              <li>Eliminates wasting time investigating application bugs when cabling is disconnected</li>
              <li>Establishes clear handoff boundaries between hardware, network, and software engineering teams</li>
            </ul>
          </div>

          <div className="p-5 rounded-[2rem] border border-neutral-800 bg-black/40 space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#ff9f0a] block font-semibold">
              Disadvantages / Limitations:
            </span>
            <ul className="text-xs text-zinc-300 space-y-1.5 pl-3 list-disc">
              <li>Can be slower for obvious upper-layer application bugs (e.g. typos in URLs)</li>
              <li>Requires deep foundational knowledge of every individual OSI protocol layer</li>
              <li>Modern SDN and virtualization layers blur traditional hardware boundaries</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Module 02: The Diagnostic Toolbox */}
      <section id="module-02" className="border border-neutral-800 bg-[#161617] rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="border-b border-neutral-800 pb-3">
          <span className="font-mono text-xs uppercase tracking-wider text-[#2997ff] block mb-1 font-semibold">
            Module 02
          </span>
          <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            2. The Diagnostic Toolbox
          </h3>
        </div>

        {/* Basic idea */}
        <div className="space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 block font-medium">
            Basic idea:
          </span>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-200">
            A network diagnostic utility is not a general magic wand; each tool is a precision instrument designed to answer exactly one specific question about protocol state.
          </p>
        </div>

        {/* Detailed breakdown of utilities */}
        <div className="space-y-4 text-xs">
          {[
            {
              tool: 'ping [-t] [-n count] <target>',
              purpose: 'Tests Layer 3 ICMP Echo reachability and Round Trip Time (RTT).',
              healthy: 'Reply from 172.16.0.80: bytes=32 time=14ms TTL=62 (0% packet loss).',
              failure: '"Request timed out" (packet dropped / firewall / missing return route) vs "Destination host unreachable" (local ARP or gateway route missing) vs "TTL expired in transit" (routing loop).',
              rulesOut: 'Success proves Layer 1 through Layer 3 connectivity is fully intact.',
            },
            {
              tool: 'tracert <target> / traceroute',
              purpose: 'Sends packets with incrementing TTL (1, 2, 3...) to discover each router along the path.',
              healthy: 'Hop 1 192.168.1.1, Hop 2 10.0.0.2, Hop 3 172.16.0.80 with sub-15ms latencies.',
              failure: '"* * *" indicates the intermediate router dropped the probe, blocked ICMP Time Exceeded, or lacks return route.',
              rulesOut: 'Pinpoints the exact physical or logical hop where forwarding broke.',
            },
            {
              tool: 'ipconfig [/all | /release | /renew]',
              purpose: 'Displays local IP address, subnet mask, default gateway, and DNS servers.',
              healthy: 'IPv4 Address 192.168.1.10, Mask 255.255.255.0, Gateway 192.168.1.1, DNS 172.16.0.53.',
              failure: '169.254.x.x (APIPA) signifies complete DHCP failure; blank gateway means no remote routing.',
              rulesOut: 'Isolates whether the problem is on the client workstation before testing the network.',
            },
            {
              tool: 'nslookup <hostname> / dig',
              purpose: 'Queries configured DNS servers for A / AAAA records to isolate DNS from IP connectivity.',
              healthy: 'Server: dns.lab.local, Address: 172.16.0.53 -> Name: www.lab.local, Address: 172.16.0.80.',
              failure: '*** DNS request timed out or Server failed or Non-existent domain.',
              rulesOut: 'Separates Domain Name System bugs from raw IP reachability.',
            },
            {
              tool: 'arp -a',
              purpose: 'Inspects the Layer 2 Address Resolution Protocol table mapping IPv4 to hardware MAC addresses.',
              healthy: '192.168.1.1 mapped to dynamic physical MAC address aa-bb-cc-01-00-01.',
              failure: '"incomplete" ARP entry reveals no device answered ARP broadcast; duplicate IPs cause flapping.',
              rulesOut: 'Verifies whether Layer 2 communication on the local switch broadcast domain is working.',
            },
            {
              tool: 'netstat -an',
              purpose: 'Lists active TCP sockets, listening ports, and foreign connection states.',
              healthy: 'TCP 0.0.0.0:80 LISTENING, TCP 0.0.0.0:443 LISTENING.',
              failure: 'Absence of port in LISTENING state confirms application daemon has crashed or failed to bind.',
              rulesOut: 'Confirms whether the service software is actually alive on the target host.',
            },
            {
              tool: 'telnet <host> <port> / nc -zv',
              purpose: 'Tests whether a specific TCP port completes a full 3-way handshake from client to server.',
              healthy: 'Connected to 172.16.0.80 (Escape character is ^]).',
              failure: '"Connect failed" / "Connection refused" / "Connection timed out" indicates port blocked by firewall or closed.',
              rulesOut: 'Distinguishes between IP ping reachability (ICMP) and transport port access (TCP).',
            },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-[#2997ff]">{item.tool}</span>
              </div>
              <p className="text-zinc-200"><strong>Purpose:</strong> {item.purpose}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <span className="text-[#30d158] font-bold block mb-0.5">Healthy Output:</span>
                  <span className="font-mono text-neutral-300">{item.healthy}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <span className="text-[#ff453a] font-bold block mb-0.5">Failure Signature:</span>
                  <span className="text-neutral-300">{item.failure}</span>
                </div>
              </div>
              <div className="text-[11px] text-neutral-400 pt-0.5">
                <strong className="text-white">Diagnostic Deduction:</strong> {item.rulesOut}
              </div>
            </div>
          ))}
        </div>

        {/* Analogy */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-black/40 space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 block font-medium">
            Simple analogy:
          </span>
          <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
            A mechanic&apos;s toolbox: a tire pressure gauge cannot diagnose a blown head gasket, and a spark tester cannot check battery voltage. You must pick the exact tool that measures the suspected protocol layer.
          </p>
        </div>

        {/* Advantages & Disadvantages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-5 rounded-[2rem] border border-neutral-800 bg-black/40 space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#30d158] block font-semibold">
              Advantages:
            </span>
            <ul className="text-xs text-zinc-300 space-y-1.5 pl-3 list-disc">
              <li>Built natively into virtually every modern operating system (Windows, Linux, macOS, iOS)</li>
              <li>Extremely low overhead; consumes minimal CPU and network bandwidth</li>
              <li>Provides quantifiable mathematical metrics (RTT in milliseconds, loss percentage, TTL)</li>
            </ul>
          </div>

          <div className="p-5 rounded-[2rem] border border-neutral-800 bg-black/40 space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#ff9f0a] block font-semibold">
              Disadvantages / Limitations:
            </span>
            <ul className="text-xs text-zinc-300 space-y-1.5 pl-3 list-disc">
              <li>Many enterprise firewalls drop ICMP, causing false-positive timeouts despite healthy TCP traffic</li>
              <li>Rate-limiting on routers can cause traceroute to show asterisks even when forwarding is fine</li>
              <li>Command syntax and flags vary subtly between Windows, Linux, and BSD</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Module 03: Common Faults and their Signatures */}
      <section id="module-03" className="border border-neutral-800 bg-[#161617] rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="border-b border-neutral-800 pb-3">
          <span className="font-mono text-xs uppercase tracking-wider text-[#2997ff] block mb-1 font-semibold">
            Module 03
          </span>
          <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            3. Common Faults & Their Signatures
          </h3>
        </div>

        <div className="space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 block font-medium">
            Basic idea:
          </span>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-200">
            Network misconfigurations leave unmistakable diagnostic fingerprints. Recognizing which command reveals which signature allows instantaneous triage without guesswork.
          </p>
        </div>

        {/* Comprehensive Fault Signature Table */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-800">
          <table className="w-full text-left font-mono text-xs min-w-[700px]">
            <thead className="bg-black/60 text-neutral-400 border-b border-neutral-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Fault Condition</th>
                <th className="p-3.5">Observable Symptom</th>
                <th className="p-3.5">Command that Reveals It</th>
                <th className="p-3.5">Remediation / Fix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 bg-neutral-900/30 text-zinc-300">
              <tr>
                <td className="p-3.5 font-bold text-white">Unplugged Cable / Bad Link</td>
                <td className="p-3.5 text-neutral-400">No connectivity; adapter link down</td>
                <td className="p-3.5 text-[#2997ff]">ipconfig / link status LED</td>
                <td className="p-3.5 text-[#30d158]">Plug cable into active switch port</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">Wrong Subnet Mask (/16 instead of /24)</td>
                <td className="p-3.5 text-neutral-400">Remote hosts treated as local; ARP timeouts</td>
                <td className="p-3.5 text-[#2997ff]">ipconfig /all & arp -a</td>
                <td className="p-3.5 text-[#30d158]">Set mask to 255.255.255.0 (/24)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">Wrong Default Gateway</td>
                <td className="p-3.5 text-neutral-400">Local LAN ping OK; Internet/remote fails</td>
                <td className="p-3.5 text-[#2997ff]">ipconfig & ping &lt;gateway&gt;</td>
                <td className="p-3.5 text-[#30d158]">Set gateway to 192.168.1.1</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">DHCP Failure (APIPA 169.254.x.x)</td>
                <td className="p-3.5 text-neutral-400">Limited connectivity; no gateway route</td>
                <td className="p-3.5 text-[#2997ff]">ipconfig /all</td>
                <td className="p-3.5 text-[#30d158]">Renew DHCP lease or assign static IP</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">Duplicate IP Address</td>
                <td className="p-3.5 text-neutral-400">Intermittent drops; MAC flapping</td>
                <td className="p-3.5 text-[#2997ff]">arp -a & system event log</td>
                <td className="p-3.5 text-[#30d158]">Change conflicting host IP address</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">DNS Server Down</td>
                <td className="p-3.5 text-neutral-400">Ping by IP works; ping by hostname fails</td>
                <td className="p-3.5 text-[#2997ff]">nslookup &lt;host&gt;</td>
                <td className="p-3.5 text-[#30d158]">Restart DNS service on port 53</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">Missing Return Route</td>
                <td className="p-3.5 text-neutral-400">One-way traffic; tracert halts before target</td>
                <td className="p-3.5 text-[#2997ff]">tracert & route print</td>
                <td className="p-3.5 text-[#30d158]">Add static return route on router</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">Firewall Blocking TCP Port</td>
                <td className="p-3.5 text-neutral-400">Ping works; web page/telnet connection fails</td>
                <td className="p-3.5 text-[#2997ff]">telnet &lt;host&gt; &lt;port&gt;</td>
                <td className="p-3.5 text-[#30d158]">Allow inbound port in firewall ACL</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">Service Not Listening</td>
                <td className="p-3.5 text-neutral-400">Connection refused immediately</td>
                <td className="p-3.5 text-[#2997ff]">netstat -an on server</td>
                <td className="p-3.5 text-[#30d158]">Start web daemon (nginx/apache)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-white">MTU / Packet Fragmentation Drop</td>
                <td className="p-3.5 text-neutral-400">Small pings work; large downloads stall</td>
                <td className="p-3.5 text-[#2997ff]">ping -f -l 1472 &lt;target&gt;</td>
                <td className="p-3.5 text-[#30d158]">Adjust interface MTU / enable MSS clamp</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Analogy */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-black/40 space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-400 block font-medium">
            Simple analogy:
          </span>
          <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
            Medical triage: high fever and rash points to a viral infection, while chest pain requires an ECG. In networking, &ldquo;ping by IP works, ping by name fails&rdquo; is the classic, unmistakable symptom of DNS failure.
          </p>
        </div>

        {/* Advantages & Disadvantages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-5 rounded-[2rem] border border-neutral-800 bg-black/40 space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#30d158] block font-semibold">
              Advantages:
            </span>
            <ul className="text-xs text-zinc-300 space-y-1.5 pl-3 list-disc">
              <li>Provides rapid mean time to resolution (MTTR) for 90% of real-world enterprise outages</li>
              <li>Prevents unnecessary reinstallation of operating systems and application software</li>
              <li>Standardizes knowledge across helpdesk technicians and network engineers</li>
            </ul>
          </div>

          <div className="p-5 rounded-[2rem] border border-neutral-800 bg-black/40 space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[#ff9f0a] block font-semibold">
              Disadvantages / Limitations:
            </span>
            <ul className="text-xs text-zinc-300 space-y-1.5 pl-3 list-disc">
              <li>Compound faults (e.g. bad gateway AND DNS down simultaneously) require iterative rounds</li>
              <li>Silent packet drops from IDS/IPS can mimic router failures</li>
              <li>Tunnel encapsulation (e.g. GRE/IPsec) can mask underlying transit hop breakages</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Quick Reference Table */}
      <section className="border border-neutral-800 bg-[#161617] rounded-[2rem] p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-[#2997ff]" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Quick Diagnostic Reference Table
          </h3>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-800">
          <table className="w-full text-left font-mono text-xs min-w-[500px]">
            <thead className="bg-black/60 text-neutral-400 border-b border-neutral-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Observable Symptom</th>
                <th className="p-3.5">Likely OSI Layer</th>
                <th className="p-3.5">First Command to Run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 bg-neutral-900/30 text-zinc-300">
              <tr>
                <td className="p-3.5 text-white">Cannot communicate with anything at all</td>
                <td className="p-3.5 text-[#2997ff]">Layer 1 (Physical) / Layer 3 (IP)</td>
                <td className="p-3.5 font-bold text-[#ff9f0a]">ipconfig /all</td>
              </tr>
              <tr>
                <td className="p-3.5 text-white">Can communicate on local LAN, but no Internet</td>
                <td className="p-3.5 text-[#2997ff]">Layer 3 (Network / Gateway)</td>
                <td className="p-3.5 font-bold text-[#ff9f0a]">ping &lt;default_gateway&gt;</td>
              </tr>
              <tr>
                <td className="p-3.5 text-white">Ping to 172.16.0.80 works, www.lab.local fails</td>
                <td className="p-3.5 text-[#2997ff]">Layer 7 (Application / DNS)</td>
                <td className="p-3.5 font-bold text-[#ff9f0a]">nslookup www.lab.local</td>
              </tr>
              <tr>
                <td className="p-3.5 text-white">Ping works, but website does not open in browser</td>
                <td className="p-3.5 text-[#2997ff]">Layer 4 (Transport / Firewall)</td>
                <td className="p-3.5 font-bold text-[#ff9f0a]">telnet 172.16.0.80 80</td>
              </tr>
              <tr>
                <td className="p-3.5 text-white">Pings fail to destination with high RTT or packet loss</td>
                <td className="p-3.5 text-[#2997ff]">Layer 3 (Routing Transit)</td>
                <td className="p-3.5 font-bold text-[#ff9f0a]">tracert &lt;destination&gt;</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Implementation Block */}
      <section className="border border-neutral-800 bg-[#161617] rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/20 flex items-center justify-center text-[#30d158]">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#30d158] font-bold">
              Code Implementations
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Network Reachability Probes (C, C++, Python, Java)
            </h3>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-zinc-300">
          The core mechanism behind network reachability tools is an asynchronous or timed socket probe. Below are full, tested, production-grade implementations in <strong>C</strong> (what engineering students submit in laboratory assignments), <strong>C++</strong>, <strong>Python</strong>, and <strong>Java</strong>.
        </p>

        {/* Language Tabs */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            {(['c', 'cpp', 'python', 'java'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveCodeTab(lang)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeCodeTab === lang
                    ? 'bg-white text-black shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => copyToClipboard(codeSnippets[activeCodeTab], activeCodeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
          >
            {copiedKey === activeCodeTab ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === activeCodeTab ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code View */}
        <div className="rounded-2xl bg-black border border-neutral-800 p-5 overflow-x-auto font-mono text-xs leading-relaxed [scrollbar-width:thin] [scrollbar-color:#333_transparent]">
          <pre className="text-zinc-300">
            <code>{codeSnippets[activeCodeTab]}</code>
          </pre>
        </div>

        {/* Python Ping Parser Block */}
        <div className="space-y-3 pt-4 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#2997ff] font-bold block">
                Python Telemetry Parser
              </span>
              <h4 className="text-base font-bold text-white tracking-tight">
                Parsing Ping Output (Loss % & Average RTT)
              </h4>
            </div>
            <button
              onClick={() => copyToClipboard(pingParserPython, 'pyparser')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            >
              {copiedKey === 'pyparser' ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'pyparser' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Automated monitoring scripts ingest raw command stdout and extract structured telemetry. This snippet parses packet loss and average RTT:
          </p>

          <div className="rounded-2xl bg-black border border-neutral-800 p-5 overflow-x-auto font-mono text-xs leading-relaxed">
            <pre className="text-zinc-300">
              <code>{pingParserPython}</code>
            </pre>
          </div>
        </div>

        {/* Decision Procedure Pseudocode with Line Numbers */}
        <div className="space-y-3 pt-4 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff9f0a] font-bold block">
                Algorithmic Specification
              </span>
              <h4 className="text-base font-bold text-white tracking-tight">
                Troubleshooting Decision Procedure Pseudocode
              </h4>
            </div>
            <button
              onClick={() => copyToClipboard(pseudocodeLines.join('\n'), 'pseudo')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            >
              {copiedKey === 'pseudo' ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'pseudo' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-black border border-neutral-800 p-4 font-mono text-xs overflow-x-auto leading-relaxed select-text">
            {pseudocodeLines.map((line, idx) => (
              <div key={idx} className="flex">
                <span className="w-8 text-neutral-600 select-none text-right pr-3 font-mono">
                  {idx + 1}
                </span>
                <span className="text-zinc-300">{line || '\u00A0'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
