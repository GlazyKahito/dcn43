# Network Troubleshooting & Simulator

Somaiya Virtual Labs · Experiment 8 · K J Somaiya School of Engineering

An interactive network laboratory. Students inject faults into a five-node topology, diagnose them with standard utilities, repair the network and verify recovery end to end.

```
PC1 ─┐
     SW1 ── R1 ── FW1 ── SRV1 (DNS + HTTP)
PC2 ─┘
192.168.1.0/24   10.0.0.0/30   172.16.0.0/24
```

## Modules

The landing page runs the lab network live and lists the modules on a progress panel. Progress is tracked from real activity; nothing is locked.

| # | Module | What it does |
|---|---|---|
| 01 | Theory | Aim and learning outcomes, then five cards: layers, addressing, services, routing, method |
| 02 | Simulation | Live topology, fault injection, terminal, telemetry, and ten ticketed troubleshooting scenarios |
| 03 | Mini-game | Network Incident: a walkable lab where you investigate, diagnose, repair and verify a hidden fault |
| 04 | Test | 24 concept, scenario and diagnostic questions with feedback and retry |
| 05 | Conclusion | Findings and the Experiment 8 summary |

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
