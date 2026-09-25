// Theory content for Experiment 8: Network Troubleshooting & Simulator.
// Five cards, each tied to this lab's addressing plan:
// PC1 192.168.1.10 (DHCP), PC2 192.168.1.11 (static), R1 192.168.1.1 / 10.0.0.1,
// FW1 10.0.0.2 / 172.16.0.1, SRV1 172.16.0.10 (www.lab.local, ns.lab.local).

export type Diagram =
  | { type: 'stack'; layers: { label: string; detail: string; pdu?: string; tools?: string }[] } // top of array = top layer
  | { type: 'sequence'; actors: string[]; messages: { from: number; to: number; label: string; note?: string }[] }
  | { type: 'bits'; ip: string; prefix: number }
  | { type: 'flow'; steps: { label: string; detail: string }[] }
  | { type: 'compare'; columns: [string, string]; rows: { label: string; a: string; b: string }[] }
  | { type: 'table'; head: string[]; rows: string[][] };

export interface TheoryTopic {
  id: string;
  code: string;
  title: string;
  layer: string;
  /** One line. */
  summary: string;
  /** Short label / value tiles. */
  facts: { k: string; v: string }[];
  example?: { caption: string; lines: string[] };
  diagram: Diagram;
}

export const THEORY: TheoryTopic[] = [
  {
    id: 'models',
    code: 'T-01',
    title: 'Network layers',
    layer: 'OSI · TCP/IP',
    summary: 'Troubleshooting is finding the lowest layer that is not working.',
    facts: [
      { k: 'OSI', v: '7 layers' },
      { k: 'TCP/IP', v: '4 layers' },
      { k: 'Going down', v: 'Each layer adds a header' },
      { k: 'Rule', v: 'Lower layers first' },
    ],
    diagram: {
      type: 'stack',
      layers: [
        { label: 'L7 Application', detail: 'HTTP, DNS, DHCP', pdu: 'Data', tools: 'nslookup, curl' },
        { label: 'L4 Transport', detail: 'TCP / UDP ports', pdu: 'Segment', tools: 'netstat' },
        { label: 'L3 Network', detail: 'IP and routing', pdu: 'Packet', tools: 'ping, tracert' },
        { label: 'L2 Data link', detail: 'MAC, switching, ARP', pdu: 'Frame', tools: 'arp -a' },
        { label: 'L1 Physical', detail: 'Cables and carrier', pdu: 'Bits', tools: 'ipconfig' },
      ],
    },
  },
  {
    id: 'addressing',
    code: 'T-02',
    title: 'Addressing and ARP',
    layer: 'L2 · L3',
    summary: 'The mask decides what is local; everything else goes to the gateway.',
    facts: [
      { k: '/24', v: '254 hosts' },
      { k: '/30', v: '2 hosts (router links)' },
      { k: 'ARP', v: 'IP → MAC on the LAN' },
      { k: 'Duplicate IP', v: 'Replies split, ~50% loss' },
    ],
    example: {
      caption: 'PC1 · arp -a',
      lines: ['  192.168.1.1           00-1a-2b-01-00-01     dynamic', '  192.168.1.11          00-1a-2b-3c-00-11     dynamic'],
    },
    diagram: { type: 'bits', ip: '192.168.1.10', prefix: 24 },
  },
  {
    id: 'services',
    code: 'T-03',
    title: 'DHCP and DNS',
    layer: 'L7',
    summary: 'DHCP gives a host its settings; DNS turns names into addresses.',
    facts: [
      { k: 'DHCP', v: 'DORA · UDP 67/68' },
      { k: 'No DHCP', v: '169.254.x.x (APIPA)' },
      { k: 'DNS', v: 'UDP 53' },
      { k: 'Tell-tale', v: 'IP works, name fails' },
    ],
    diagram: {
      type: 'sequence',
      actors: ['PC1', 'R1 (DHCP)', 'SRV1 (DNS)'],
      messages: [
        { from: 0, to: 1, label: 'DISCOVER', note: 'broadcast' },
        { from: 1, to: 0, label: 'OFFER 192.168.1.10' },
        { from: 0, to: 1, label: 'REQUEST' },
        { from: 1, to: 0, label: 'ACK' },
        { from: 0, to: 2, label: 'A? www.lab.local' },
        { from: 2, to: 0, label: '172.16.0.10' },
      ],
    },
  },
  {
    id: 'routing',
    code: 'T-04',
    title: 'Routing and ICMP',
    layer: 'L3',
    summary: 'Routers pick the most specific route and lower the TTL by one.',
    facts: [
      { k: 'Match', v: 'Longest prefix wins' },
      { k: 'TTL', v: '64 → 62 across R1, FW1' },
      { k: 'tracert', v: 'TTL 1, 2, 3… maps hops' },
      { k: 'Error source', v: 'Shows where it broke' },
    ],
    example: {
      caption: 'PC1 · tracert www.lab.local',
      lines: ['  1    <1 ms  192.168.1.1', '  2     1 ms  10.0.0.2', '  3     2 ms  172.16.0.10', 'Trace complete.'],
    },
    diagram: {
      type: 'flow',
      steps: [
        { label: 'PC1', detail: 'Frame to gateway' },
        { label: 'SW1', detail: 'Forward by MAC' },
        { label: 'R1', detail: 'Route, TTL −1' },
        { label: 'FW1 → SRV1', detail: 'Filter, deliver' },
      ],
    },
  },
  {
    id: 'method',
    code: 'T-05',
    title: 'Firewalls and method',
    layer: 'L4 · Method',
    summary: 'First matching rule wins; a silent drop looks like a timeout.',
    facts: [
      { k: 'FW1 allows', v: 'ICMP · DNS 53 · HTTP 80' },
      { k: 'Blocked web', v: 'Ping OK, SYN_SENT' },
      { k: 'Order', v: 'Carrier → IP → gateway → path → service' },
      { k: 'Done when', v: 'The failing test passes' },
    ],
    diagram: {
      type: 'flow',
      steps: [
        { label: 'Symptoms', detail: 'What fails?' },
        { label: 'Hypotheses', detail: 'Which layer?' },
        { label: 'Probes', detail: 'One tool at a time' },
        { label: 'Root cause', detail: 'Fits the evidence' },
        { label: 'Fix', detail: 'Change one thing' },
        { label: 'Verify', detail: 'Re-test' },
      ],
    },
  },
];
