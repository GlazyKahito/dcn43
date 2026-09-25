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
  summary: string;
  points: string[];
  example?: { caption: string; lines: string[] };
  diagram: Diagram;
  inLab: string;
}

export const THEORY: TheoryTopic[] = [
  {
    id: 'models',
    code: 'T-01',
    title: 'Network layers',
    layer: 'OSI · TCP/IP',
    summary:
      'Every network function sits at a layer, and each layer depends on the one below it. Troubleshooting is the search for the lowest layer that is not working.',
    points: [
      'OSI has seven layers; TCP/IP groups them into four: link, internet, transport, application.',
      'Each layer adds a header on the way down (encapsulation) and removes it on the way up.',
      'Physical and data-link problems stay on one segment; network-layer problems follow the route; transport and application problems live on the end hosts.',
      'Every diagnostic tool tests a particular layer, so the tool you pick decides which layer you are testing.',
    ],
    diagram: {
      type: 'stack',
      layers: [
        { label: 'L7 Application', detail: 'HTTP, DNS, DHCP', pdu: 'Data', tools: 'nslookup, curl' },
        { label: 'L4 Transport', detail: 'TCP and UDP ports', pdu: 'Segment', tools: 'netstat' },
        { label: 'L3 Network', detail: 'IP addressing and routing', pdu: 'Packet', tools: 'ping, tracert, route' },
        { label: 'L2 Data link', detail: 'MAC addressing, switching, ARP', pdu: 'Frame', tools: 'arp -a' },
        { label: 'L1 Physical', detail: 'Cables, link lights, carrier', pdu: 'Bits', tools: 'ipconfig (media state)' },
      ],
    },
    inLab: 'Every fault in the simulator is tagged with the layer it breaks; start your checks at that layer’s tool.',
  },
  {
    id: 'addressing',
    code: 'T-02',
    title: 'Addressing: IP, subnets, MAC and ARP',
    layer: 'L2 · L3',
    summary:
      'An IP address and mask define which hosts are local. Local hosts are reached directly; everything else goes through the default gateway, and ARP finds the MAC address for whichever of the two is next.',
    points: [
      '/24 = 255.255.255.0: 254 usable hosts. The transit link 10.0.0.0/30 has exactly two.',
      'A host compares destination and own address under the mask: same network → deliver on the LAN, otherwise send to the gateway.',
      'ARP broadcasts "who has 192.168.1.1?" and caches the MAC reply; an entry stuck at "(incomplete)" means nothing answered.',
      'Two hosts with the same IP split replies between them — intermittent loss that ipconfig marks as (Duplicate).',
    ],
    example: {
      caption: 'PC1: arp -a',
      lines: ['Interface: 192.168.1.10 --- 0x4', '  Internet Address      Physical Address      Type', '  192.168.1.1           00-1a-2b-01-00-01     dynamic', '  192.168.1.11          00-1a-2b-3c-00-11     dynamic'],
    },
    diagram: { type: 'bits', ip: '192.168.1.10', prefix: 24 },
    inLab: 'Inject "Wrong gateway" and run arp -a: the entry for 192.168.1.254 never resolves.',
  },
  {
    id: 'services',
    code: 'T-03',
    title: 'Network services: DHCP and DNS',
    layer: 'L7',
    summary:
      'DHCP hands a host its address, mask, gateway and DNS server. DNS turns names into addresses. When either fails, the network itself can be healthy and still look broken to the user.',
    points: [
      'DHCP runs as Discover → Offer → Request → Acknowledge (DORA) over UDP 67/68.',
      'No DHCP answer → Windows self-assigns 169.254.x.x (APIPA) with no gateway: the host is stranded on its segment.',
      'DNS queries go to UDP 53. If ping by address works but ping by name fails, suspect DNS.',
      'nslookup asks the DNS server directly and shows which server answered, or that none did.',
    ],
    diagram: {
      type: 'sequence',
      actors: ['PC1', 'R1 (DHCP)', 'SRV1 (DNS)'],
      messages: [
        { from: 0, to: 1, label: 'DHCPDISCOVER', note: 'broadcast' },
        { from: 1, to: 0, label: 'OFFER 192.168.1.10' },
        { from: 0, to: 1, label: 'REQUEST' },
        { from: 1, to: 0, label: 'ACK · gw 192.168.1.1 · dns 172.16.0.10' },
        { from: 0, to: 2, label: 'A? www.lab.local', note: 'udp/53' },
        { from: 2, to: 0, label: '172.16.0.10' },
      ],
    },
    inLab: 'Inject "DNS failure": ping 172.16.0.10 still replies while nslookup www.lab.local times out.',
  },
  {
    id: 'routing',
    code: 'T-04',
    title: 'Routing, ICMP and packet flow',
    layer: 'L3',
    summary:
      'A router forwards each packet by its most specific matching route and lowers the TTL by one. ICMP carries the replies and error messages that ping and tracert read.',
    points: [
      'Longest-prefix match: R1 uses 172.16.0.0/24 via 10.0.0.2 before its default route.',
      'Each router rebuilds the frame (new MACs) but leaves the IP addresses alone; the server’s reply reaches PC1 with TTL 62 (64 − 2 routers).',
      'tracert sends probes with TTL 1, 2, 3… — each router that drops one reports itself, which maps the path.',
      'Who reports an error tells you where it is: “Destination host unreachable” from PC1’s own address means the local segment; “Destination net unreachable” from 192.168.1.1 means R1 has no route.',
    ],
    example: {
      caption: 'PC1: tracert www.lab.local',
      lines: ['  1    <1 ms    <1 ms    <1 ms  r1.lab.local [192.168.1.1]', '  2     1 ms     1 ms     1 ms  fw1.lab.local [10.0.0.2]', '  3     2 ms     2 ms     2 ms  www.lab.local [172.16.0.10]', '', 'Trace complete.'],
    },
    diagram: {
      type: 'flow',
      steps: [
        { label: 'PC1', detail: 'Off-subnet destination: frame to the gateway MAC.' },
        { label: 'SW1', detail: 'Forwards by MAC address; the frame is unchanged.' },
        { label: 'R1', detail: 'Matches 172.16.0.0/24, TTL −1, new frame to 10.0.0.2.' },
        { label: 'FW1 → SRV1', detail: 'Rule check, TTL −1, delivered; the reply returns the same way.' },
      ],
    },
    inLab: 'Cut the R1–FW1 link: tracert stops after hop 1 and R1 answers “Destination net unreachable”.',
  },
  {
    id: 'method',
    code: 'T-05',
    title: 'Firewalls and the troubleshooting method',
    layer: 'L4 · Method',
    summary:
      'A firewall checks each packet against its rules in order and applies the first match; a silent drop looks exactly like a timeout. The method: test one layer at a time, change one thing, and always re-test.',
    points: [
      'FW1 permits ICMP, DNS (udp/53) and HTTP (tcp/80) to the server and denies everything else.',
      'If ping works but a web page times out and netstat shows SYN_SENT, a rule is dropping TCP/80.',
      'Bottom-up: carrier → addressing → gateway → path → service. Fewest wasted tests.',
      'A fix is proven only when the original symptom is gone: gateway, server, DNS and HTTP all pass.',
    ],
    diagram: {
      type: 'flow',
      steps: [
        { label: 'Symptoms', detail: 'What exactly fails, and what still works?' },
        { label: 'Hypotheses', detail: 'Which layer could produce that?' },
        { label: 'Probes', detail: 'ping, tracert, ipconfig, nslookup, arp, netstat.' },
        { label: 'Root cause', detail: 'The one explanation the evidence supports.' },
        { label: 'Fix', detail: 'Change one thing.' },
        { label: 'Verify', detail: 'Re-run the tests that failed.' },
      ],
    },
    inLab: 'Every ticket in the Simulation module follows these six steps, and the case only closes after verification.',
  },
];
