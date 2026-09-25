import { faultDef } from '@/lib/sim/faults';
import { cloneNet, createBaseline } from '@/lib/sim/topology';
import type { LinkId, NetState } from '@/lib/sim/types';

export type CauseId =
  | 'sw-r1-link'
  | 'r1-interface'
  | 'wrong-ip'
  | 'wrong-gateway'
  | 'dns'
  | 'dhcp'
  | 'firewall'
  | 'loss'
  | 'dup-ip'
  | 'server-link';

export const CAUSE_LABEL: Record<CauseId, string> = {
  'sw-r1-link': 'Broken cable between SW-01 and R1',
  'r1-interface': 'R1 interface G0/1 shut down',
  'wrong-ip': 'PC-01 configured with a wrong IP address',
  'wrong-gateway': 'PC-01 default gateway incorrect',
  dns: 'DNS service down on SERVER-01',
  dhcp: 'DHCP service stopped on R1',
  firewall: 'Firewall rule blocking web traffic',
  loss: 'Damaged cable corrupting frames (SW-01 – R1)',
  'dup-ip': 'Duplicate IP address on the LAN',
  'server-link': 'SERVER-01 disconnected from the network',
};

/** Extra physical detail the pure network model does not carry. */
export interface IncidentMeta {
  /** Links that are down because an interface was administratively shut, not because of a cable. */
  adminDown: LinkId[];
}

export type VerifyKey = 'gateway' | 'server' | 'dns' | 'http';

export interface Incident {
  id: CauseId;
  /** What the operator is told. Deliberately vague. */
  report: string;
  affected: string;
  /** Observable symptoms, for the debrief. */
  symptoms: string[];
  /** Where the decisive evidence is, for the debrief. */
  clues: string[];
  /** Key terminal readings in this state, for the debrief. */
  terminal: string[];
  repair: string;
  /** Checks that must pass after the repair before the case can close. */
  verify: VerifyKey[];
  scoreModifier: number;
  apply: (net: NetState, meta: IncidentMeta) => void;
}

const inject = (net: NetState, kind: Parameters<typeof faultDef>[0], link?: LinkId) => {
  const next = faultDef(kind).inject(net, link);
  Object.assign(net, next);
};

export const INCIDENTS: Incident[] = [
  {
    id: 'sw-r1-link',
    report: 'Users on the LAN lost every service at once. The two workstations can still see each other.',
    affected: 'SW-01 Gi0/24 ↔ R1 G0/0',
    symptoms: ['PC-01 reports connection lost', 'Gateway 192.168.1.1 does not answer ARP'],
    clues: ['SW-01 port Gi0/24 DOWN', 'Patch panel: cable test on run 03 shows OPEN', 'R1 G0/0 down / down'],
    terminal: ['ping 192.168.1.1 → Destination host unreachable (from 192.168.1.10)', 'ping 192.168.1.11 → replies'],
    repair: 'Replace or reseat the SW-01 – R1 patch cable',
    verify: ['gateway', 'server'],
    scoreModifier: 0,
    apply: (net) => inject(net, 'link-down', 'SW1-R1'),
  },
  {
    id: 'r1-interface',
    report: 'The gateway answers, but nothing beyond it is reachable.',
    affected: 'R1 G0/1',
    symptoms: ['Gateway reachable', 'Server unreachable'],
    clues: ['R1 G0/1 administratively down', 'Routing table lacks 10.0.0.0/30', 'Cable test on run 04 is OK'],
    terminal: ['ping 172.16.0.10 → Reply from 192.168.1.1: Destination net unreachable', 'tracert stops at hop 1'],
    repair: 'Enable interface G0/1 on R1',
    verify: ['gateway', 'server'],
    scoreModifier: 50,
    apply: (net, meta) => {
      inject(net, 'link-down', 'R1-FW1');
      meta.adminDown.push('R1-FW1');
    },
  },
  {
    id: 'wrong-ip',
    report: 'PC-01 was re-addressed by hand this morning and has been offline since.',
    affected: 'PC-01',
    symptoms: ['PC-01 cannot reach anything, even PC-02'],
    clues: ['PC-01 address 192.168.10.10/24 is outside 192.168.1.0/24'],
    terminal: ['ping 192.168.1.1 → transmit failed', 'ipconfig → 192.168.10.10'],
    repair: 'Correct PC-01 addressing (192.168.1.10/24) or return it to DHCP',
    verify: ['gateway', 'server'],
    scoreModifier: 0,
    apply: (net) => inject(net, 'wrong-ip'),
  },
  {
    id: 'wrong-gateway',
    report: 'PC-01 reaches the printer on PC-02 but no server.',
    affected: 'PC-01',
    symptoms: ['LAN works', 'Nothing off-subnet works'],
    clues: ['PC-01 gateway 192.168.1.254', 'arp -a: 192.168.1.254 incomplete'],
    terminal: ['ping 192.168.1.11 → replies', 'ping 172.16.0.10 → Destination host unreachable'],
    repair: 'Set PC-01 default gateway to 192.168.1.1',
    verify: ['gateway', 'server'],
    scoreModifier: 0,
    apply: (net) => inject(net, 'wrong-gateway'),
  },
  {
    id: 'dns',
    report: 'The intranet will not load by name. Someone reached it by typing its address.',
    affected: 'SERVER-01 named',
    symptoms: ['Ping by address works', 'Names do not resolve'],
    clues: ['SERVER-01 DNS service OFFLINE', 'nslookup times out'],
    terminal: ['ping 172.16.0.10 → replies', 'nslookup www.lab.local → DNS request timed out'],
    repair: 'Restart the DNS service on SERVER-01',
    verify: ['gateway', 'server', 'dns'],
    scoreModifier: 0,
    apply: (net) => inject(net, 'dns-failure'),
  },
  {
    id: 'dhcp',
    report: 'PC-01 was rebooted and now shows limited connectivity.',
    affected: 'R1 DHCP service',
    symptoms: ['PC-01 has a 169.254.x.x address', 'No gateway on PC-01'],
    clues: ['R1 DHCP service STOPPED', 'ipconfig /renew: unable to contact DHCP server'],
    terminal: ['ipconfig → Autoconfiguration IPv4 169.254.37.112', 'ping 192.168.1.1 → transmit failed'],
    repair: 'Start DHCP on R1, then renew the lease on PC-01',
    verify: ['gateway', 'server'],
    scoreModifier: 50,
    apply: (net) => inject(net, 'dhcp-failure'),
  },
  {
    id: 'firewall',
    report: 'After last night’s change window the intranet site times out. Ping still works.',
    affected: 'FW1 rule 5',
    symptoms: ['ICMP fine', 'Web requests time out'],
    clues: ['FW1 rule 5 deny tcp → 172.16.0.10 eq 80 with rising hit count', 'netstat: SYN_SENT to :80'],
    terminal: ['ping 172.16.0.10 → replies', 'curl http://www.lab.local → timed out'],
    repair: 'Remove FW1 rule 5',
    verify: ['gateway', 'server', 'http'],
    scoreModifier: 50,
    apply: (net) => inject(net, 'firewall-block'),
  },
  {
    id: 'loss',
    report: 'Connections drop intermittently. Some pings fail, others succeed.',
    affected: 'SW-01 – R1 cable',
    symptoms: ['Loss even to the gateway'],
    clues: ['SW-01 Gi0/24 CRC errors climbing', 'Cable test on run 03: HIGH ERROR RATE'],
    terminal: ['ping 192.168.1.1 → roughly a third lost'],
    repair: 'Replace the SW-01 – R1 patch cable',
    verify: ['gateway', 'server'],
    scoreModifier: 0,
    apply: (net) => inject(net, 'packet-loss', 'SW1-R1'),
  },
  {
    id: 'dup-ip',
    report: 'PC-01 keeps dropping off the network. A technician set up PC-02 by hand earlier.',
    affected: 'PC-02',
    symptoms: ['About half of PC-01’s replies go missing'],
    clues: ['PC-02 address 192.168.1.10 equals PC-01', 'ipconfig on PC-01: (Duplicate)'],
    terminal: ['ping 192.168.1.1 → about 50% loss', 'ipconfig → 192.168.1.10(Duplicate)'],
    repair: 'Re-address PC-02 to 192.168.1.11',
    verify: ['gateway', 'server'],
    scoreModifier: 50,
    apply: (net) => inject(net, 'duplicate-ip'),
  },
  {
    id: 'server-link',
    report: 'Nobody can reach the intranet server. The gateway and firewall answer.',
    affected: 'FW1 inside ↔ SERVER-01',
    symptoms: ['Gateway and firewall reachable', 'Server does not answer'],
    clues: ['SERVER-01 eth0 NO CARRIER', 'Cable test on run 05 shows OPEN'],
    terminal: ['tracert 172.16.0.10 → 192.168.1.1, 10.0.0.2, then silence'],
    repair: 'Reseat the FW1 – SERVER-01 cable',
    verify: ['gateway', 'server'],
    scoreModifier: 0,
    apply: (net) => inject(net, 'link-down', 'FW1-SRV1'),
  },
];

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY: Record<Difficulty, { label: string; seconds: number; suspects: number; faults: number; freeActions: number; note: string }> = {
  easy: { label: 'Easy', seconds: 300, suspects: 4, faults: 1, freeActions: 14, note: 'One fault · clear symptoms · objective hints' },
  medium: { label: 'Medium', seconds: 300, suspects: 6, faults: 1, freeActions: 12, note: 'One hidden fault · several plausible causes' },
  hard: { label: 'Hard', seconds: 360, suspects: 10, faults: 2, freeActions: 18, note: 'Two faults · misleading symptoms' },
};

/** Pairs that touch the same element cannot be combined on hard. */
const CONFLICTS: [CauseId, CauseId][] = [
  ['sw-r1-link', 'loss'],
  ['wrong-ip', 'wrong-gateway'],
  ['wrong-ip', 'dhcp'],
  ['wrong-gateway', 'dhcp'],
  ['wrong-ip', 'dup-ip'],
  ['dhcp', 'dup-ip'],
];
const conflict = (a: CauseId, b: CauseId) => a === b || CONFLICTS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export interface CaseFile {
  incidents: Incident[];
  net: NetState;
  meta: IncidentMeta;
  suspects: CauseId[];
}

function shuffle<T>(a: T[], rand: () => number): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Builds a case from the controlled dataset. `avoid` keeps back-to-back cases different. */
export function createCase(difficulty: Difficulty, rand: () => number = Math.random, avoid?: CauseId): CaseFile {
  const d = DIFFICULTY[difficulty];
  const pool = INCIDENTS.filter((i) => i.id !== avoid);
  const first = pool[Math.floor(rand() * pool.length)];
  const chosen = [first];
  if (d.faults > 1) {
    const second = shuffle(INCIDENTS, rand).find((i) => !conflict(i.id, first.id));
    if (second) chosen.push(second);
  }
  const net = cloneNet(createBaseline());
  const meta: IncidentMeta = { adminDown: [] };
  for (const inc of chosen) inc.apply(net, meta);

  const others = shuffle(
    INCIDENTS.map((i) => i.id).filter((id) => !chosen.some((c) => c.id === id)),
    rand,
  ).slice(0, d.suspects - chosen.length);
  const suspects = shuffle([...chosen.map((c) => c.id), ...others], rand);
  return { incidents: chosen, net, meta, suspects };
}

export function scoreCase(p: {
  diagnosisCorrect: boolean;
  wrongDiagnoses: number;
  wrongRepairs: number;
  verified: boolean;
  elapsed: number;
  limit: number;
  actions: number;
  freeActions: number;
  modifier: number;
}) {
  const rows: { label: string; value: number }[] = [{ label: 'Base score', value: 500 }];
  if (p.diagnosisCorrect) rows.push({ label: 'Correct diagnosis', value: 300 });
  if (p.wrongDiagnoses) rows.push({ label: `Wrong diagnosis ×${p.wrongDiagnoses}`, value: -100 * p.wrongDiagnoses });
  rows.push({ label: 'Correct repair', value: 300 });
  if (p.wrongRepairs) rows.push({ label: `Wrong repair ×${p.wrongRepairs}`, value: -150 * p.wrongRepairs });
  if (p.verified) rows.push({ label: 'Verification', value: 200 });
  if (p.elapsed < p.limit * 0.4) rows.push({ label: 'Fast completion', value: 100 });
  const extra = Math.max(0, p.actions - p.freeActions);
  if (extra) rows.push({ label: `Unnecessary actions ×${extra}`, value: -25 * extra });
  if (p.modifier) rows.push({ label: 'Incident difficulty', value: p.modifier });
  const total = Math.max(0, rows.reduce((a, r) => a + r.value, 0));
  const decisions = 1 + p.wrongDiagnoses + 1 + p.wrongRepairs;
  const accuracy = Math.round((2 / decisions) * 100);
  return { rows, total, accuracy };
}
