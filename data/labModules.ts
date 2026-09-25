export interface LabModule {
  id: string;
  navLabel: string;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  description: string;
  image: string;
  sectionId: string;
}

export const LAB_MODULES: LabModule[] = [
  {
    id: 'diagnostics',
    navLabel: 'NETWORK DIAGNOSTICS',
    title: 'Intelligent Network Diagnostics',
    subtitle: 'Systematic Fault Isolation & Triage Engine',
    category: 'Diagnostic Suite',
    badge: 'DIAG-01',
    description: 'Interactive diagnostic console: select real-world failure symptoms, execute simulated ICMP/DNS/ARP probes, isolate root causes, and apply engineering fixes.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    sectionId: 'diagnostics',
  },
  {
    id: 'aim',
    navLabel: 'AIM',
    title: 'Laboratory Objective & Scope',
    subtitle: 'Academic Problem Statement & Outcomes',
    category: 'Curriculum',
    badge: 'OBJ-01',
    description: 'Understand systematic network troubleshooting methodology, utilize Layer 1–7 diagnostic utilities, and resolve complex routing, subnet, and link faults.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    sectionId: 'aim',
  },
  {
    id: 'theory',
    navLabel: 'THEORY',
    title: 'Theoretical Methodology & Reference',
    subtitle: 'OSI Reference Model & Protocol Internals',
    category: 'OSI Reference',
    badge: 'MOD-01',
    description: 'Four comprehensive modules: bottom-up layered diagnosis, diagnostic utility packet formats, common fault matrix, and socket-level code implementations.',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    sectionId: 'theory',
  },
  {
    id: 'simulations',
    navLabel: 'SIMULATIONS',
    title: 'Interactive Topology & Fault Lab',
    subtitle: 'Visual Network Simulator & Scenarios',
    category: 'Virtual Lab',
    badge: 'SIM-01',
    description: 'Design network topologies with routers, switches, servers, and firewalls; simulate packet flow dynamics and inject 8 realistic network fault conditions.',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    sectionId: 'simulations',
  },
  {
    id: 'assessments',
    navLabel: 'ASSESSMENTS',
    title: 'Diagnostic Readiness & Verification',
    subtitle: 'Pre-Test & Post-Test Evaluations',
    category: 'Evaluation',
    badge: 'TEST-01',
    description: 'Assess foundational network troubleshooting principles in Phase 1 (10 MCQs) and test advanced multi-hop triage mastery in Phase 2 with instant score analytics.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    sectionId: 'assessments',
  },
  {
    id: 'minigame',
    navLabel: 'MINI-GAME',
    title: 'Fix The Network: Packet X-Flow',
    subtitle: 'Real-Time Rapid Diagnostic Exercise',
    category: 'Reflex Lab',
    badge: 'GAME-01',
    description: 'Put your diagnostic reflexes to the test: repair severed physical copper trunks, restore broken default gateways, and filter malicious SYN floods under timed pressure.',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    sectionId: 'minigame',
  },
  {
    id: 'conclusion',
    navLabel: 'CONCLUSION',
    title: 'Laboratory Findings & Synthesis',
    subtitle: 'Standards, RFCs & Engineering Summary',
    category: 'Synthesis',
    badge: 'RFC-01',
    description: 'Synthesis of troubleshooting findings cross-referenced with IETF standards including RFC 792 (ICMP), RFC 826 (ARP), RFC 1035 (DNS), and RFC 1122.',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    sectionId: 'conclusion',
  },
  {
    id: 'launch-lab',
    navLabel: 'LAUNCH LAB',
    title: 'Direct Virtual Terminal & Lab',
    subtitle: 'Live In-Memory Diagnostic Simulator',
    category: 'Direct Terminal',
    badge: 'RUN-01',
    description: 'Launch directly into the full-screen in-memory virtual terminal with live ICMP echo requests, TTL traceroute hops, and interactive link manipulation.',
    image: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80',
    sectionId: 'simulations',
  },
  {
    id: 'exp10',
    navLabel: 'EXP 10',
    title: 'Experiment 10 Specification',
    subtitle: 'ET301 Computer Networks & Diagnostics',
    category: 'Specification',
    badge: 'EXP-10',
    description: 'Comprehensive curriculum overview for K J Somaiya School of Engineering ET301 Computer Networks & Diagnostics, Experiment 10.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    sectionId: 'exp10',
  },
  {
    id: 'works',
    navLabel: 'WORKS',
    title: 'Works Wheel System Launcher',
    subtitle: 'Intelligent Network Lab Entry Point',
    category: 'System Launcher',
    badge: 'ROOT',
    description: 'Interactive 3D drum portfolio launcher providing circular navigation across all virtual laboratory diagnostic modules.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    sectionId: 'works',
  },
];
