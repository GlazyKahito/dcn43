// Theory content for Experiment 10: Network Troubleshooting & Simulator.
// Pure data module. All examples use the lab addressing plan:
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
    id: 'osi-model',
    code: 'T-01',
    title: 'OSI Reference Model',
    layer: 'Model',
    summary:
      'The OSI model divides network communication into seven layers, each providing services to the layer above. It is primarily a diagnostic vocabulary: faults are localised by identifying the lowest layer that is not working.',
    points: [
      'Each layer adds its own header during encapsulation; the receiver removes headers in reverse order (decapsulation).',
      'PDU names differ by layer: data, segment, packet, frame, bits. Using the correct term clarifies where a fault sits.',
      'Layers 1-2 are local to a link; Layer 3 is end-to-end across routers; Layers 4-7 exist only on end hosts.',
      'A working lower layer is a precondition for every layer above it, which is the basis of bottom-up troubleshooting.',
    ],
    diagram: {
      type: 'stack',
      layers: [
        { label: 'L7 Application', detail: 'HTTP, DNS, DHCP messages', pdu: 'Data', tools: 'nslookup, curl, browser; fault: wrong URL, service down' },
        { label: 'L6 Presentation', detail: 'Encoding, compression, TLS', pdu: 'Data', tools: 'Certificate and charset errors' },
        { label: 'L5 Session', detail: 'Dialogue control, session setup', pdu: 'Data', tools: 'Session timeouts, authentication resets' },
        { label: 'L4 Transport', detail: 'TCP/UDP ports, reliability', pdu: 'Segment / Datagram', tools: 'netstat, Test-NetConnection; fault: port blocked' },
        { label: 'L3 Network', detail: 'IP addressing, routing', pdu: 'Packet', tools: 'ping, tracert, route print; fault: wrong gateway, missing route' },
        { label: 'L2 Data Link', detail: 'MAC addressing, switching, ARP', pdu: 'Frame', tools: 'arp -a, show mac address-table; fault: VLAN mismatch' },
        { label: 'L1 Physical', detail: 'Cable, signal, link state', pdu: 'Bits', tools: 'Link LEDs, show interfaces; fault: unplugged cable' },
      ],
    },
    inLab: 'Every fault in the injection panel is tagged with the layer it affects; use the tag to decide which tool to run first.',
  },
  {
    id: 'tcp-ip-model',
    code: 'T-02',
    title: 'TCP/IP Model',
    layer: 'Model',
    summary:
      'The TCP/IP model is the four-layer architecture that the Internet protocols actually implement. It merges OSI Layers 5-7 into one Application layer and Layers 1-2 into a Link layer.',
    points: [
      'Application layer: HTTP, DNS, DHCP; these protocols handle their own presentation and session concerns.',
      'Transport layer: TCP provides reliable byte streams, UDP provides unreliable datagrams; both use port numbers.',
      'Internet layer: IP delivers packets hop by hop; ICMP carries error and diagnostic messages for IP.',
      'Link layer: Ethernet framing, MAC addressing and ARP, bound to one physical segment.',
    ],
    diagram: {
      type: 'compare',
      columns: ['OSI (7 layers)', 'TCP/IP (4 layers)'],
      rows: [
        { label: 'Top', a: 'Application, Presentation, Session', b: 'Application (HTTP, DNS, DHCP)' },
        { label: 'Transport', a: 'Transport', b: 'Transport (TCP, UDP)' },
        { label: 'Network', a: 'Network', b: 'Internet (IP, ICMP)' },
        { label: 'Bottom', a: 'Data Link, Physical', b: 'Link (Ethernet, ARP)' },
        { label: 'Nature', a: 'Reference model, protocol-independent', b: 'Implementation model of the Internet suite' },
      ],
    },
    inLab: 'Send an HTTP packet from PC1 in the simulator and follow it through SW1, R1 and FW1 to SRV1.',
  },
  {
    id: 'ip-addressing',
    code: 'T-03',
    title: 'IPv4 Addressing',
    layer: 'L3 · Network',
    summary:
      'An IPv4 address is a 32-bit logical identifier written as four decimal octets, paired with a subnet mask that separates network and host portions. A host also needs a default gateway to reach other networks and a DNS server to resolve names.',
    points: [
      'Private ranges (RFC 1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. This lab uses one subnet from each.',
      'A host sends traffic directly if the destination is in its own subnet, otherwise to its default gateway.',
      'Each router interface belongs to a different subnet; R1 and FW1 each have one address per connected network.',
      'Duplicate addresses, wrong masks and wrong gateways are the most common Layer 3 host misconfigurations.',
    ],
    example: {
      caption: 'PC1: ipconfig /all (healthy)',
      lines: [
        'Ethernet adapter Ethernet:',
        '   Physical Address. . . . . . . . . : 00-1A-2B-3C-00-10',
        '   DHCP Enabled. . . . . . . . . . . : Yes',
        '   IPv4 Address. . . . . . . . . . . : 192.168.1.10(Preferred)',
        '   Subnet Mask . . . . . . . . . . . : 255.255.255.0',
        '   Default Gateway . . . . . . . . . : 192.168.1.1',
        '   DHCP Server . . . . . . . . . . . : 192.168.1.1',
        '   DNS Servers . . . . . . . . . . . : 172.16.0.10',
      ],
    },
    diagram: {
      type: 'table',
      head: ['Device', 'Interface', 'Address', 'Gateway', 'Notes'],
      rows: [
        ['PC1', 'Ethernet', '192.168.1.10/24', '192.168.1.1', 'DHCP client, DNS 172.16.0.10'],
        ['PC2', 'Ethernet', '192.168.1.11/24', '192.168.1.1', 'Static configuration'],
        ['R1', 'Gi0/0', '192.168.1.1/24', '-', 'LAN gateway, DHCP server'],
        ['R1', 'Gi0/1', '10.0.0.1/30', '-', 'Transit link to FW1'],
        ['FW1', 'outside', '10.0.0.2/30', '-', 'Transit link to R1'],
        ['FW1', 'inside', '172.16.0.1/24', '-', 'Server network gateway'],
        ['SRV1', 'eth0', '172.16.0.10/24', '172.16.0.1', 'DNS + HTTP (www.lab.local)'],
      ],
    },
    inLab: 'Run ipconfig /all on PC1 and PC2 and check each value against the addressing plan before testing connectivity.',
  },
  {
    id: 'subnetting',
    code: 'T-04',
    title: 'Subnetting and Prefix Length',
    layer: 'L3 · Network',
    summary:
      'The prefix length states how many leading bits identify the network; the remaining bits identify hosts. From it one can derive the network address, broadcast address and usable host range.',
    points: [
      '192.168.1.10/24: network 192.168.1.0, broadcast 192.168.1.255, usable hosts .1 to .254 (2^8 - 2 = 254).',
      '10.0.0.0/30 transit link: 4 addresses, 2 usable (10.0.0.1 R1, 10.0.0.2 FW1), broadcast 10.0.0.3.',
      'A wrong mask changes what a host treats as local; with /16, PC1 would ARP for off-subnet hosts directly.',
      'Two hosts are on the same subnet only if (address AND mask) yields the same network address for both.',
    ],
    example: {
      caption: 'Worked calculation for PC1',
      lines: [
        'Address   192.168.1.10   11000000.10101000.00000001.00001010',
        'Mask /24  255.255.255.0  11111111.11111111.11111111.00000000',
        'Network   192.168.1.0    (address AND mask)',
        'Broadcast 192.168.1.255  (host bits all 1)',
        'Hosts     192.168.1.1 - 192.168.1.254 (254 usable)',
      ],
    },
    diagram: { type: 'bits', ip: '192.168.1.10', prefix: 24 },
    inLab: "Inject 'Wrong IP address' and run ipconfig: 192.168.10.10/24 no longer shares a network with the 192.168.1.1 gateway.",
  },
  {
    id: 'mac-addressing',
    code: 'T-05',
    title: 'MAC Addressing',
    layer: 'L2 · Data Link',
    summary:
      'A MAC address is a 48-bit hardware identifier used to deliver Ethernet frames within one broadcast domain. It is rewritten at every router hop, whereas the IP addresses stay the same end to end.',
    points: [
      'Written as six hex octets, e.g. 00-1A-2B-3C-00-10 (Windows) or 001a.2b3c.0010 (Cisco).',
      'The first 24 bits are the OUI assigned to the vendor; the last 24 bits are vendor-assigned.',
      'FF-FF-FF-FF-FF-FF is the broadcast address, used by ARP requests and DHCP Discover.',
      'A frame from PC1 to SRV1 carries R1 Gi0/0 as destination MAC, not the MAC of SRV1.',
    ],
    example: {
      caption: 'PC1: getmac /v',
      lines: [
        'Connection Name Network Adapter Physical Address    Transport Name',
        '=============== =============== =================== ==========================================',
        'Ethernet        Intel(R) PRO/1000 00-1A-2B-3C-00-10 \\Device\\Tcpip_{4D36E972-E325-11CE-BFC1}',
      ],
    },
    diagram: {
      type: 'table',
      head: ['Hop', 'Src MAC', 'Dst MAC', 'Src IP', 'Dst IP'],
      rows: [
        ['PC1 to R1', 'PC1', 'R1 Gi0/0', '192.168.1.10', '172.16.0.10'],
        ['R1 to FW1', 'R1 Gi0/1', 'FW1 outside', '192.168.1.10', '172.16.0.10'],
        ['FW1 to SRV1', 'FW1 inside', 'SRV1', '192.168.1.10', '172.16.0.10'],
      ],
    },
    inLab: 'Run arp -a on PC1: the gateway entry shows the only MAC address PC1 ever needs for off-subnet traffic.',
  },
  {
    id: 'arp',
    code: 'T-06',
    title: 'Address Resolution Protocol (ARP)',
    layer: 'L2 · Data Link',
    summary:
      'ARP maps a known IPv4 address to the MAC address needed to build an Ethernet frame on the local segment. Hosts resolve either the destination itself (same subnet) or the default gateway (remote subnet).',
    points: [
      'The request is broadcast (who-has 192.168.1.1 tell 192.168.1.10); the reply is unicast back to the requester.',
      'Results are cached; Windows ages dynamic entries after tens of seconds, Cisco routers after 4 hours by default.',
      'If ARP for the gateway fails, ping reports "Destination host unreachable" from the local host itself.',
      'arp -d * clears the Windows cache, forcing fresh resolution when testing.',
    ],
    example: {
      caption: 'PC1: arp -a after pinging the gateway',
      lines: [
        'Interface: 192.168.1.10 --- 0xb',
        '  Internet Address      Physical Address      Type',
        '  192.168.1.1           00-1a-2b-01-00-01     dynamic',
        '  192.168.1.11          00-1a-2b-3c-00-11     dynamic',
        '  192.168.1.255         ff-ff-ff-ff-ff-ff     static',
      ],
    },
    diagram: {
      type: 'sequence',
      actors: ['PC1', 'SW1', 'R1'],
      messages: [
        { from: 0, to: 1, label: 'ARP Request: who-has 192.168.1.1 tell 192.168.1.10', note: 'dst FF-FF-FF-FF-FF-FF' },
        { from: 1, to: 2, label: 'Flooded out all ports in the VLAN', note: 'SW1 learns PC1 MAC on its port' },
        { from: 2, to: 1, label: 'ARP Reply: 192.168.1.1 is-at 00-1a-2b-01-00-01', note: 'unicast' },
        { from: 1, to: 0, label: 'Forwarded to PC1 port only', note: 'PC1 caches the entry' },
      ],
    },
    inLab: "Inject 'Wrong gateway' and run arp -a: the entry for 192.168.1.254 stays (incomplete).",
  },
  {
    id: 'dns',
    code: 'T-07',
    title: 'Domain Name System (DNS)',
    layer: 'L7 · Application',
    summary:
      'DNS resolves hostnames such as www.lab.local to IP addresses. Queries normally use UDP port 53, falling back to TCP 53 for large responses and zone transfers.',
    points: [
      'An A record maps a name to an IPv4 address; here www.lab.local and ns.lab.local both resolve to 172.16.0.10.',
      'If ping by IP succeeds but ping by name fails, the fault is in name resolution, not in routing.',
      'nslookup queries the configured DNS server directly; ipconfig /flushdns clears the Windows resolver cache.',
      'A firewall blocking UDP 53 produces "DNS request timed out", not "Non-existent domain".',
    ],
    example: {
      caption: 'PC1: nslookup www.lab.local',
      lines: [
        'Server:  ns.lab.local',
        'Address:  172.16.0.10',
        '',
        'Name:    www.lab.local',
        'Address:  172.16.0.10',
      ],
    },
    diagram: {
      type: 'sequence',
      actors: ['PC1 (192.168.1.10)', 'SRV1 (172.16.0.10)'],
      messages: [
        { from: 0, to: 1, label: 'Standard query A www.lab.local', note: 'UDP src port 53124 -> dst 53' },
        { from: 1, to: 0, label: 'Standard query response A 172.16.0.10', note: 'UDP 53 -> 53124, same transaction ID' },
      ],
    },
    inLab: "Inject 'DNS failure' and compare ping 172.16.0.10 with nslookup www.lab.local.",
  },
  {
    id: 'dhcp',
    code: 'T-08',
    title: 'Dynamic Host Configuration Protocol (DHCP)',
    layer: 'L7 · Application',
    summary:
      'DHCP leases an IP address, mask, gateway and DNS server to a client through a four-message exchange (DORA). It runs over UDP, client port 68 and server port 67.',
    points: [
      'Discover and Request are broadcast because the client has no address yet (source 0.0.0.0).',
      'R1 acts as DHCP server for 192.168.1.0/24, handing out gateway 192.168.1.1 and DNS 172.16.0.10.',
      'If no server answers, Windows self-assigns an APIPA address in 169.254.0.0/16 with no gateway.',
      'An address of 169.254.x.x therefore points to a DHCP or Layer 1/2 problem, not a routing problem.',
      'ipconfig /release and ipconfig /renew repeat the exchange on demand.',
    ],
    example: {
      caption: 'R1: DHCP pool configuration',
      lines: [
        'ip dhcp excluded-address 192.168.1.1 192.168.1.9',
        'ip dhcp excluded-address 192.168.1.11',
        'ip dhcp pool LAN',
        ' network 192.168.1.0 255.255.255.0',
        ' default-router 192.168.1.1',
        ' dns-server 172.16.0.10',
        ' domain-name lab.local',
      ],
    },
    diagram: {
      type: 'sequence',
      actors: ['PC1 (client)', 'R1 (server)'],
      messages: [
        { from: 0, to: 1, label: 'DHCPDISCOVER', note: '0.0.0.0:68 -> 255.255.255.255:67' },
        { from: 1, to: 0, label: 'DHCPOFFER 192.168.1.10', note: 'mask, gateway, DNS, lease time' },
        { from: 0, to: 1, label: 'DHCPREQUEST 192.168.1.10', note: 'broadcast, names chosen server' },
        { from: 1, to: 0, label: 'DHCPACK', note: 'lease confirmed; PC1 configures interface' },
      ],
    },
    inLab: "Inject 'DHCP failure', run ipconfig /renew on PC1 and observe the 169.254.x.x APIPA address.",
  },
  {
    id: 'routing',
    code: 'T-09',
    title: 'IP Routing',
    layer: 'L3 · Network',
    summary:
      'A router forwards each packet by looking up the destination address in its routing table and selecting the most specific matching route. Each forwarding decision decrements the IP TTL by one.',
    points: [
      'Longest-prefix match: a /30 route wins over a /24, which wins over a /0 default route.',
      'Connected routes appear automatically for each up/up interface; remote networks need static or dynamic routes.',
      'Without 172.16.0.0/24 via 10.0.0.2, R1 drops traffic to SRV1 and returns ICMP net unreachable.',
      'Return routes matter: FW1 must also know how to reach 192.168.1.0/24 via 10.0.0.1.',
      'TTL=62 at PC1 means SRV1 sent TTL 64 and two devices (FW1, R1) each decremented it.',
    ],
    example: {
      caption: 'R1: show ip route',
      lines: [
        'Codes: C - connected, S - static, L - local',
        '',
        'Gateway of last resort is not set',
        '',
        '      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks',
        'C        10.0.0.0/30 is directly connected, GigabitEthernet0/1',
        'L        10.0.0.1/32 is directly connected, GigabitEthernet0/1',
        '      172.16.0.0/24 is subnetted, 1 subnets',
        'S        172.16.0.0 [1/0] via 10.0.0.2',
        '      192.168.1.0/24 is variably subnetted, 2 subnets, 2 masks',
        'C        192.168.1.0/24 is directly connected, GigabitEthernet0/0',
        'L        192.168.1.1/32 is directly connected, GigabitEthernet0/0',
      ],
    },
    diagram: {
      type: 'table',
      head: ['Code', 'Prefix', 'Next hop / Interface', 'AD/Metric'],
      rows: [
        ['C', '192.168.1.0/24', 'Gi0/0 (connected)', '0/0'],
        ['L', '192.168.1.1/32', 'Gi0/0 (local)', '0/0'],
        ['C', '10.0.0.0/30', 'Gi0/1 (connected)', '0/0'],
        ['L', '10.0.0.1/32', 'Gi0/1 (local)', '0/0'],
        ['S', '172.16.0.0/24', 'via 10.0.0.2', '1/0'],
      ],
    },
    inLab: 'Cut the R1–FW1 link: the connected route and the static route through 10.0.0.2 both disappear, and R1 answers Destination net unreachable.',
  },
  {
    id: 'switching',
    code: 'T-10',
    title: 'Layer 2 Switching',
    layer: 'L2 · Data Link',
    summary:
      'A switch forwards Ethernet frames using a MAC address table that it builds by observing source addresses. Unknown unicast, broadcast and multicast frames are flooded within the VLAN.',
    points: [
      'Learning: the source MAC and ingress port of every frame are recorded, with an ageing timer of 300 s by default.',
      'Forwarding: a known destination MAC is sent out only its associated port.',
      'Flooding: unknown or broadcast destinations are sent out every port in the VLAN except the ingress port.',
      'A switch does not change the frame or the TTL; it is invisible to tracert.',
    ],
    example: {
      caption: 'SW1: show mac address-table dynamic',
      lines: [
        '          Mac Address Table',
        '-------------------------------------------',
        'Vlan    Mac Address       Type        Ports',
        '----    -----------       --------    -----',
        '   1    001a.2b3c.0010    DYNAMIC     Fa0/1',
        '   1    001a.2b3c.0011    DYNAMIC     Fa0/2',
        '   1    001a.2b01.0001    DYNAMIC     Gi0/24',
        'Total Mac Addresses for this criterion: 3',
      ],
    },
    diagram: {
      type: 'flow',
      steps: [
        { label: 'Frame arrives', detail: 'SW1 receives a frame from PC1 on Fa0/1.' },
        { label: 'Learn source', detail: 'Record 001a.2b3c.0010 -> Fa0/1 and reset its ageing timer.' },
        { label: 'Look up destination', detail: 'Search the MAC table for the destination MAC.' },
        { label: 'Forward or flood', detail: 'Known: send out one port. Unknown or broadcast: flood all other ports in VLAN 1.' },
        { label: 'Filter', detail: 'If the destination port equals the ingress port, drop the frame.' },
      ],
    },
    inLab: 'Power off SW1 in the inspector: PC1, PC2 and R1 lose each other at once because they share one switched segment.',
  },
  {
    id: 'tcp-vs-udp',
    code: 'T-11',
    title: 'TCP and UDP',
    layer: 'L4 · Transport',
    summary:
      'TCP and UDP both multiplex applications by port number but differ in reliability and overhead. In this lab DNS uses UDP 53 and HTTP uses TCP 80.',
    points: [
      'TCP opens a connection with a SYN, SYN-ACK, ACK handshake before any data is sent.',
      'A closed TCP port returns RST; a filtered port returns nothing, so the client times out.',
      'UDP has no handshake; loss must be handled by the application, e.g. DNS retries the query.',
      'ping uses ICMP, not TCP or UDP, so a successful ping does not prove that port 80 or 53 is reachable.',
    ],
    example: {
      caption: 'PC1: Test-NetConnection 172.16.0.10 -Port 80',
      lines: [
        'ComputerName     : 172.16.0.10',
        'RemoteAddress    : 172.16.0.10',
        'RemotePort       : 80',
        'InterfaceAlias   : Ethernet',
        'SourceAddress    : 192.168.1.10',
        'TcpTestSucceeded : True',
      ],
    },
    diagram: {
      type: 'compare',
      columns: ['TCP', 'UDP'],
      rows: [
        { label: 'Connection', a: 'Connection-oriented, 3-way handshake', b: 'Connectionless' },
        { label: 'Reliability', a: 'Sequence numbers, ACKs, retransmission', b: 'None at transport layer' },
        { label: 'Ordering', a: 'In-order byte stream', b: 'Independent datagrams' },
        { label: 'Header', a: '20 bytes minimum', b: '8 bytes' },
        { label: 'Flow control', a: 'Sliding window, congestion control', b: 'None' },
        { label: 'Lab use', a: 'HTTP to SRV1 on port 80', b: 'DNS to SRV1 on port 53, DHCP 67/68' },
      ],
    },
    inLab: 'Stop nginx on SRV1 from the inspector and compare curl http://www.lab.local (refused) with ping 172.16.0.10 (replies).',
  },
  {
    id: 'icmp',
    code: 'T-12',
    title: 'Internet Control Message Protocol (ICMP)',
    layer: 'L3 · Network',
    summary:
      'ICMP carries diagnostic and error messages for IP and is the basis of ping and tracert. The type and code of a reply indicate which device reported the problem and why.',
    points: [
      'ping sends Echo Request (type 8) and expects Echo Reply (type 0); a timeout means no reply returned.',
      'tracert sends probes with TTL 1, 2, 3...; each router that expires the TTL returns Time Exceeded (type 11).',
      '"Reply from 192.168.1.1: Destination net unreachable" means R1 has no route to the destination.',
      'Windows counts "Destination host unreachable" replies as Received, so 0% loss does not mean success.',
      'Firewalls often drop ICMP silently; a timeout is then not proof that the host is down.',
    ],
    example: {
      caption: 'PC1: ping 172.16.0.10 and tracert (healthy)',
      lines: [
        'Pinging 172.16.0.10 with 32 bytes of data:',
        'Reply from 172.16.0.10: bytes=32 time=3ms TTL=62',
        'Reply from 172.16.0.10: bytes=32 time=3ms TTL=62',
        'Reply from 172.16.0.10: bytes=32 time=2ms TTL=62',
        'Reply from 172.16.0.10: bytes=32 time=3ms TTL=62',
        '',
        'Ping statistics for 172.16.0.10:',
        '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),',
        '',
        'Tracing route to 172.16.0.10 over a maximum of 30 hops',
        '  1    <1 ms    <1 ms    <1 ms  192.168.1.1',
        '  2     1 ms     1 ms     1 ms  10.0.0.2',
        '  3     3 ms     2 ms     3 ms  172.16.0.10',
        'Trace complete.',
      ],
    },
    diagram: {
      type: 'table',
      head: ['Type', 'Code', 'Name', 'Typical meaning'],
      rows: [
        ['8', '0', 'Echo Request', 'Sent by ping'],
        ['0', '0', 'Echo Reply', 'Destination is reachable'],
        ['3', '0', 'Destination Unreachable: net', 'Router has no route to the network'],
        ['3', '1', 'Destination Unreachable: host', 'Last-hop device cannot ARP for the host'],
        ['3', '3', 'Destination Unreachable: port', 'UDP port closed on the target'],
        ['11', '0', 'Time Exceeded: TTL', 'TTL reached 0; used by tracert'],
      ],
    },
    inLab: 'Inject a routing fault and read which address sends the ICMP error; that device is where the path breaks.',
  },
  {
    id: 'firewall',
    code: 'T-13',
    title: 'Stateful Firewall',
    layer: 'L3-L4 · Network/Transport',
    summary:
      'A firewall filters traffic by matching packets against an ordered rule list and applying the first rule that matches. A stateful firewall records permitted sessions and allows their return traffic automatically.',
    points: [
      'Rules are evaluated top-down; the first match decides, so rule order matters more than rule count.',
      'An explicit or implicit deny at the end drops everything not permitted above it.',
      'Return traffic for permitted flows is matched against the state table, not the rule list.',
      'Denied packets are usually dropped silently, so the client sees a timeout rather than an ICMP error.',
      'If ping to SRV1 works but HTTP or DNS fails, suspect a Layer 4 rule on FW1.',
    ],
    example: {
      caption: 'FW1: access rules applied inbound on outside',
      lines: [
        'access-list OUTSIDE_IN line 10 extended permit icmp any 172.16.0.0 255.255.255.0 (hitcnt=12)',
        'access-list OUTSIDE_IN line 20 extended permit udp 192.168.1.0 255.255.255.0 host 172.16.0.10 eq domain (hitcnt=4)',
        'access-list OUTSIDE_IN line 30 extended permit tcp 192.168.1.0 255.255.255.0 host 172.16.0.10 eq www (hitcnt=7)',
        'access-list OUTSIDE_IN line 90 extended deny ip any any (hitcnt=0)',
      ],
    },
    diagram: {
      type: 'table',
      head: ['Seq', 'Action', 'Protocol', 'Source', 'Destination', 'Port'],
      rows: [
        ['10', 'permit', 'icmp', 'any', '172.16.0.0/24', '-'],
        ['20', 'permit', 'udp', '192.168.1.0/24', '172.16.0.10', '53 (DNS)'],
        ['30', 'permit', 'tcp', '192.168.1.0/24', '172.16.0.10', '80 (HTTP)'],
        ['90', 'deny', 'ip', 'any', 'any', '-'],
      ],
    },
    inLab: "Inject 'Firewall block' and confirm that ping succeeds while curl http://www.lab.local times out.",
  },
  {
    id: 'network-topology',
    code: 'T-14',
    title: 'Network Topology',
    layer: 'Model',
    summary:
      'Topology describes how devices are physically or logically interconnected, which determines failure domains and redundancy. This lab is a star LAN around SW1 attached to a routed chain R1, FW1, SRV1.',
    points: [
      'In a star, a single end-host link failure isolates only that host; failure of the central switch isolates all.',
      'The routed chain has no redundant path, so any failure on R1, FW1 or their links breaks access to SRV1.',
      'Physical topology (cables) and logical topology (IP subnets, VLANs) should both be documented.',
      'This lab has three broadcast domains: 192.168.1.0/24, 10.0.0.0/30 and 172.16.0.0/24.',
    ],
    diagram: {
      type: 'table',
      head: ['Topology', 'Structure', 'Strength', 'Weakness'],
      rows: [
        ['Bus', 'All nodes on one shared medium', 'Minimal cabling', 'One cable fault affects all; collisions'],
        ['Ring', 'Each node links to two neighbours', 'Predictable access', 'Single break disrupts ring unless dual'],
        ['Star', 'All nodes to a central switch', 'Easy isolation of faults', 'Central device is a single point of failure'],
        ['Mesh', 'Multiple links between nodes', 'Redundant paths', 'Cost and configuration complexity'],
        ['This lab', 'Star LAN (SW1) + routed chain R1-FW1-SRV1', 'Simple to trace hop by hop', 'No redundancy on the routed path'],
      ],
    },
    inLab: 'Use the topology view to identify which devices lose connectivity when a single link or device is disabled.',
  },
  {
    id: 'packet-flow',
    code: 'T-15',
    title: 'End-to-End Packet Flow',
    layer: 'L2-L3 · Data Link/Network',
    summary:
      'A packet from PC1 to SRV1 keeps its IP source and destination along the whole path, while the Ethernet frame is rebuilt at each routed hop. Following this flow step by step shows which device is responsible at each point.',
    points: [
      'PC1 compares 172.16.0.10 with its own subnet, finds it remote and sends the frame to the gateway MAC.',
      'Routers decrement TTL, recompute the IP header checksum and build a new frame for the next link.',
      'FW1 checks the rule list for new flows and creates a state entry; return traffic matches that entry.',
      'The reply follows the reverse path; a missing return route breaks connectivity just as a forward fault does.',
    ],
    diagram: {
      type: 'flow',
      steps: [
        { label: 'PC1 builds frame', detail: 'Dst IP 172.16.0.10 is off-subnet; ARP for 192.168.1.1; frame dst MAC = R1 Gi0/0, TTL 128.' },
        { label: 'SW1 forwards by MAC', detail: 'Learns PC1 on Fa0/1, looks up R1 MAC, forwards out Gi0/24. Frame unchanged.' },
        { label: 'R1 routes', detail: 'Longest match 172.16.0.0/24 via 10.0.0.2; TTL 128 -> 127; new frame on Gi0/1.' },
        { label: 'FW1 inspects', detail: 'Rule 10 permits ICMP; state entry created; TTL 127 -> 126; new frame on inside.' },
        { label: 'SRV1 replies', detail: 'Echo Reply to 192.168.1.10 with TTL 64 via gateway 172.16.0.1.' },
        { label: 'Return path', detail: 'FW1 matches state, TTL 63; R1 routes to connected LAN, TTL 62; PC1 shows TTL=62.' },
      ],
    },
    inLab: 'Send an ICMP packet in the simulator and watch it hop PC1 → SW1 → R1 → FW1 → SRV1 and back; the reply arrives with TTL 62.',
  },
  {
    id: 'troubleshooting-methodology',
    code: 'T-16',
    title: 'Troubleshooting Methodology',
    layer: 'Method',
    summary:
      'Structured troubleshooting replaces guessing with a repeatable cycle of observation, hypothesis and test. Choosing a layered approach narrows the search space quickly and produces evidence for the final diagnosis.',
    points: [
      'Bottom-up: start at Layer 1 and move upward; thorough, suited to physical or unknown faults.',
      'Top-down: start at the application and move down; efficient when a single service is reported broken.',
      'Divide-and-conquer: start at Layer 3 with ping; success rules out lower layers, failure rules out upper ones.',
      'Change one variable at a time and re-test, so that each result can be attributed to a cause.',
      'Record symptoms, commands, outputs and the fix; the record is part of the lab submission.',
    ],
    example: {
      caption: 'Divide-and-conquer sequence from PC1',
      lines: [
        'C:\\> ipconfig /all              (L3 config: address, mask, gateway, DNS)',
        'C:\\> ping 192.168.1.1           (local subnet and gateway)',
        'C:\\> ping 172.16.0.10           (remote reachability)',
        'C:\\> tracert 172.16.0.10        (where the path stops)',
        'C:\\> nslookup www.lab.local     (name resolution)',
        'PS> Test-NetConnection 172.16.0.10 -Port 80   (service reachability)',
      ],
    },
    diagram: {
      type: 'flow',
      steps: [
        { label: 'Define the problem', detail: 'State who is affected, what fails and since when, e.g. PC1 cannot open www.lab.local.' },
        { label: 'Gather symptoms', detail: 'Collect ipconfig, ping, tracert and nslookup output; note what still works.' },
        { label: 'Hypothesise by layer', detail: 'Map symptoms to the likely OSI layer and list candidate causes.' },
        { label: 'Test', detail: 'Run the tool that confirms or rejects one hypothesis at a time.' },
        { label: 'Isolate root cause', detail: 'Identify the single device and setting responsible.' },
        { label: 'Fix', detail: 'Apply the minimum configuration change that corrects the cause.' },
        { label: 'Verify', detail: 'Repeat the original failing test and check nothing else regressed.' },
        { label: 'Document', detail: 'Record symptom, cause, fix and evidence for the lab report.' },
      ],
    },
    inLab: 'The Diagnostics console walks this exact sequence: symptoms, hypotheses, probes, evidence, root cause, fix and verification.',
  },
];
