# Network Troubleshooting & Simulator

Somaiya Virtual Labs · Experiment 10 · K J Somaiya School of Engineering

An interactive network laboratory. Students inject faults into a five-node topology, diagnose them with standard utilities, repair the network and verify recovery end to end.

```
PC1 ─┐
     SW1 ── R1 ── FW1 ── SRV1 (DNS + HTTP)
PC2 ─┘
192.168.1.0/24   10.0.0.0/30   172.16.0.0/24
```

## Modules

The Works Wheel on the landing page launches each module:

| # | Module | What it does |
|---|---|---|
| 01 | Network Troubleshooting | The lab loop, shown against the live network |
| 02 | Aim | Laboratory objective and learning outcomes |
| 03 | Theory | 16 reference cards with diagrams (OSI, ARP, DNS, DHCP, routing, ICMP, firewall…) |
| 04 | Simulator | Topology, packet animation, device/link inspector, fault injection, terminal, telemetry |
| 05 | Diagnostics | 10 ticketed scenarios: symptoms → hypotheses → probes → evidence → root cause → fix → verification |
| 06 | Assessments | 24 concept, scenario and diagnostic questions with feedback and retry |
| 07 | Mini-game | Network Fault Repair: timed, scored, three difficulty levels |
| 08 | Experiment 10 | Objective, scope, tools, modules, outcomes |
| 09 | Conclusion | Laboratory findings and synthesis |
| 10 | Launch Lab | Goes straight to the simulator |

## Simulation engine (`lib/sim`)

Everything reads one shared network state (`store.tsx`), so the simulator, terminal, console and telemetry always agree.

- `engine.ts` handles hop-by-hop forwarding: ARP across the switched segment, longest-prefix routing, TTL, the stateful firewall, return-path checks, loss and latency.
- `commands.ts` implements `ping`, `tracert`, `traceroute`, `ipconfig` (`/all /release /renew`), `ifconfig`, `nslookup`, `arp -a`, `netstat -an|-r` and `curl`, all computed from the engine.
- `faults.ts` holds the ten fault injectors, plus a detector that compares the live network against the reference build.
- `scenarios.ts` holds the troubleshooting tickets, root causes and repair actions.
- `health.ts` holds the telemetry and the verification suite used to confirm recovery.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # engine and scenario tests (vitest)
npm run build
```

Stack: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Lenis, and a WebGL steel-field background.
