export type QuestionKind = 'mcq' | 'scenario' | 'diagnostic';

export interface Question {
  id: string;
  kind: QuestionKind;
  topic: string;
  prompt: string;
  exhibit?: string[];
  options: string[];
  answer: number;
  explanation: string;
}

export const QUESTIONS: Question[] = [
  // ---------------------------------------------------------------------------
  // Concept checks (mcq)
  // ---------------------------------------------------------------------------
  {
    id: "q01",
    kind: "mcq",
    topic: "OSI Model",
    prompt:
      "SW1 joins PC1, PC2 and R1 and forwards traffic using its MAC address table. At which OSI layer does SW1 make its forwarding decisions?",
    options: [
      "Layer 1 (Physical), because it repeats electrical signals to every port",
      "Layer 2 (Data Link), because it forwards frames by destination MAC address",
      "Layer 3 (Network), because it forwards packets by destination IP address",
      "Layer 4 (Transport), because it tracks TCP and UDP port numbers",
    ],
    answer: 1,
    explanation:
      "A layer-2 switch learns source MAC addresses and forwards frames by destination MAC; it does not inspect IP headers. Routing by IP address is a Layer 3 function performed by R1.",
  },
  {
    id: "q02",
    kind: "mcq",
    topic: "Subnetting",
    prompt:
      "The point-to-point link between R1 (10.0.0.1) and FW1 (10.0.0.2) uses the prefix 10.0.0.0/30. How many usable host addresses does this subnet provide?",
    options: ["4", "1", "2", "6"],
    answer: 2,
    explanation:
      "A /30 leaves 2 host bits, giving 2^2 = 4 addresses, of which the network (10.0.0.0) and broadcast (10.0.0.3) addresses are reserved, leaving 2 usable hosts. This is why /30 is the conventional choice for router-to-router links.",
  },
  {
    id: "q03",
    kind: "mcq",
    topic: "Subnetting",
    prompt:
      "PC1 is configured as 192.168.1.10/24. What are the network address and the directed broadcast address of its subnet?",
    options: [
      "192.168.1.1 and 192.168.1.254",
      "192.168.0.0 and 192.168.255.255",
      "192.168.1.0 and 192.168.1.254",
      "192.168.1.0 and 192.168.1.255",
    ],
    answer: 3,
    explanation:
      "With a 255.255.255.0 mask the first three octets form the network portion, so the host bits all-zero give 192.168.1.0 and all-one give 192.168.1.255. The usable range is therefore 192.168.1.1 to 192.168.1.254 (254 hosts).",
  },
  {
    id: "q04",
    kind: "mcq",
    topic: "Routing & TTL",
    prompt:
      "In the healthy network, \"ping 172.16.0.10\" from PC1 returns replies with TTL=62. Which explanation is correct?",
    options: [
      "SRV1 sends replies with an initial TTL of 64, and the two Layer 3 devices on the return path (FW1 and R1) each decrement it by one",
      "Windows reduces the displayed TTL by two to account for the echo request and the echo reply",
      "SW1 and R1 each decrement the TTL by one as the reply crosses them",
      "SRV1 sends replies with an initial TTL of 128, and the value is reduced in proportion to the round-trip time",
    ],
    answer: 0,
    explanation:
      "TTL is decremented once per Layer 3 hop, so a reply starting at 64 that crosses FW1 and R1 arrives with 62. SW1 is a Layer 2 device and does not modify the IP header.",
  },
  {
    id: "q05",
    kind: "mcq",
    topic: "ARP",
    prompt:
      "Before PC1 can send its first packet to an off-subnet destination such as 172.16.0.10, it must use ARP. What does ARP resolve in this case?",
    options: [
      "The hostname www.lab.local to the IPv4 address 172.16.0.10",
      "The IPv4 address of the default gateway (192.168.1.1) to R1's Gi0/0 MAC address",
      "The IPv4 address 172.16.0.10 to SRV1's MAC address across the routed path",
      "The MAC address of SW1 to the switch port connected to PC1",
    ],
    answer: 1,
    explanation:
      "ARP operates only within the local broadcast domain, so for an off-subnet destination PC1 resolves the gateway's IP to R1's MAC and places that MAC in the frame. Name-to-address resolution is performed by DNS, not ARP.",
  },
  {
    id: "q06",
    kind: "mcq",
    topic: "TCP vs UDP",
    prompt:
      "PC1 queries SRV1 for www.lab.local. Which transport protocol and destination port does a standard DNS query use, and which FW1 rule permits it?",
    options: [
      "TCP port 53, permitted by rule 30",
      "UDP port 80, permitted by rule 20",
      "TCP port 80, permitted by rule 30",
      "UDP port 53, permitted by rule 20",
    ],
    answer: 3,
    explanation:
      "Standard DNS queries are carried over UDP port 53, which FW1 rule 20 permits to 172.16.0.10. HTTP uses TCP port 80, which is matched separately by rule 30.",
  },
  {
    id: "q07",
    kind: "mcq",
    topic: "DHCP / APIPA",
    prompt:
      "A Windows host configured for DHCP reports an IPv4 address in the range 169.254.0.0/16. What does this indicate?",
    options: [
      "The DHCP server deliberately assigned a link-local address from a reserved pool",
      "The host has detected a duplicate IP address and moved to a backup range",
      "The host failed to obtain a DHCP lease and self-assigned an Automatic Private IP Addressing (APIPA) address",
      "The host is configured with a static address outside the 192.168.1.0/24 subnet",
    ],
    answer: 2,
    explanation:
      "When no DHCPOFFER is received, Windows assigns itself an APIPA link-local address in 169.254.0.0/16 with no default gateway. Such an address can reach only other link-local hosts, so off-subnet communication fails.",
  },
  {
    id: "q08",
    kind: "mcq",
    topic: "DHCP",
    prompt:
      "When PC1 obtains its lease from the DHCP server on R1, in which order are the four DHCP messages exchanged?",
    options: [
      "Discover, Offer, Request, Acknowledge",
      "Request, Offer, Discover, Acknowledge",
      "Discover, Request, Offer, Acknowledge",
      "Offer, Discover, Acknowledge, Request",
    ],
    answer: 0,
    explanation:
      "The client broadcasts DHCPDISCOVER, the server replies with DHCPOFFER, the client broadcasts DHCPREQUEST for the chosen offer, and the server confirms with DHCPACK (the DORA sequence). DHCP runs over UDP ports 67 and 68 at the application layer.",
  },
  {
    id: "q09",
    kind: "mcq",
    topic: "Firewall",
    prompt:
      "FW1 evaluates its access rules in ascending sequence order. An administrator inserts rule 5: deny tcp any host 172.16.0.10 eq 80. How is an HTTP request from PC1 to SRV1 now handled?",
    options: [
      "It is permitted by rule 30, because permit rules take precedence over deny rules",
      "It is denied by rule 5, because the first matching rule is applied and evaluation stops",
      "It is permitted, because deny rules are consulted only for traffic that no permit rule matches",
      "It is denied only after all rules up to rule 90 have been evaluated",
    ],
    answer: 1,
    explanation:
      "Access rules use first-match semantics: the packet is compared in sequence order and the first matching rule decides its fate. Rule 5 matches TCP/80 to SRV1 before rule 30 is reached, so the traffic is dropped.",
  },
  {
    id: "q10",
    kind: "mcq",
    topic: "Methodology",
    prompt:
      "A technician applies the divide-and-conquer method and begins by pinging the default gateway. What is the rationale for starting at Layer 3?",
    options: [
      "Layer 3 is the only layer at which faults can be observed from an end host",
      "Ping tests every layer of the OSI model, including the application layer",
      "Starting at Layer 3 avoids the need to verify any configuration afterwards",
      "A successful ping implies Layers 1 to 3 are functional, so the search can move up; a failure directs the search down to lower layers",
    ],
    answer: 3,
    explanation:
      "Divide-and-conquer starts in the middle of the stack: a successful ICMP echo confirms physical, data link and network connectivity, halving the search space. It does not test Layer 4 services such as TCP/80 or UDP/53.",
  },

  // ---------------------------------------------------------------------------
  // Scenario questions: evidence given, identify the root cause
  // ---------------------------------------------------------------------------
  {
    id: "q11",
    kind: "scenario",
    topic: "DNS",
    prompt:
      "A user on PC1 reports that www.lab.local cannot be reached. The technician collects the output below. What is the most likely root cause?",
    exhibit: [
      "C:\\> ping 172.16.0.10",
      "Pinging 172.16.0.10 with 32 bytes of data:",
      "Reply from 172.16.0.10: bytes=32 time=3ms TTL=62",
      "Reply from 172.16.0.10: bytes=32 time=3ms TTL=62",
      "",
      "C:\\> nslookup www.lab.local",
      "DNS request timed out.",
      "    timeout was 2 seconds.",
      "Server:  UnKnown",
      "Address:  172.16.0.10",
      "",
      "*** Request to UnKnown timed-out",
      "",
      "C:\\> ping www.lab.local",
      "Ping request could not find host www.lab.local. Please check the name and try again.",
    ],
    options: [
      "FW1 is blocking ICMP traffic to SRV1",
      "R1 has lost its static route to 172.16.0.0/24",
      "The DNS service on SRV1 is not responding to queries",
      "PC1 has an incorrect default gateway configured",
    ],
    answer: 2,
    explanation:
      "Successful pings by IP prove Layers 1 to 3 are healthy end to end, so the fault lies with the application-layer name service. The nslookup timeout against 172.16.0.10 indicates the DNS daemon on SRV1 is not answering UDP/53 queries.",
  },
  {
    id: "q12",
    kind: "scenario",
    topic: "Default Gateway",
    prompt:
      "PC1 can reach PC2 and R1 but nothing beyond the local subnet. Based on the output below, what is the root cause?",
    exhibit: [
      "C:\\> ipconfig",
      "Ethernet adapter Ethernet0:",
      "   IPv4 Address. . . . . . . . . . . : 192.168.1.10",
      "   Subnet Mask . . . . . . . . . . . : 255.255.255.0",
      "   Default Gateway . . . . . . . . . : 192.168.1.254",
      "",
      "C:\\> ping 192.168.1.1",
      "Reply from 192.168.1.1: bytes=32 time<1ms TTL=255",
      "",
      "C:\\> ping 172.16.0.10",
      "Request timed out.",
      "Request timed out.",
      "",
      "C:\\> arp -a",
      "Interface: 192.168.1.10 --- 0xb",
      "  Internet Address      Physical Address      Type",
      "  192.168.1.1           00-1a-2b-3c-4d-01     dynamic",
      "  192.168.1.11          00-1a-2b-3c-4d-0b     dynamic",
      "  192.168.1.254         (incomplete)",
    ],
    options: [
      "PC1's default gateway points to 192.168.1.254, an address with no device, so off-subnet packets cannot be delivered",
      "R1's Gi0/0 interface is administratively down",
      "The subnet mask on PC1 is too narrow to include the gateway",
      "SW1 has learned R1's MAC address on the wrong port",
    ],
    answer: 0,
    explanation:
      "R1 answers at 192.168.1.1, but PC1 sends off-subnet traffic to 192.168.1.254, whose ARP entry is incomplete because no host owns that address. The fault is a Layer 3 host configuration error, not a link or router failure.",
  },
  {
    id: "q13",
    kind: "scenario",
    topic: "Firewall",
    prompt:
      "Name resolution and ping to SRV1 succeed, yet the web page does not load. Given the evidence below, what is the most likely root cause?",
    exhibit: [
      "C:\\> ping 172.16.0.10",
      "Reply from 172.16.0.10: bytes=32 time=3ms TTL=62",
      "",
      "C:\\> nslookup www.lab.local",
      "Server:  srv1.lab.local",
      "Address:  172.16.0.10",
      "Name:    www.lab.local",
      "Address:  172.16.0.10",
      "",
      "C:\\> curl http://www.lab.local",
      "curl: (28) Failed to connect to www.lab.local port 80 after 21045 ms: Timed out",
      "",
      "C:\\> netstat -an",
      "  Proto  Local Address          Foreign Address        State",
      "  TCP    192.168.1.10:50122     172.16.0.10:80         SYN_SENT",
    ],
    options: [
      "The DNS record for www.lab.local points to the wrong address",
      "A firewall rule on FW1 is silently dropping TCP traffic to port 80 on SRV1",
      "The HTTP service on SRV1 is stopped, so SRV1 is replying with TCP RST",
      "The R1 to FW1 link is experiencing heavy packet loss",
    ],
    answer: 1,
    explanation:
      "The connection remains in SYN_SENT and curl times out, meaning no SYN-ACK or RST ever returns, which is characteristic of a silent drop by a firewall. A stopped service would normally answer with RST and produce an immediate \"connection refused\", while ICMP and UDP/53 are unaffected.",
  },
  {
    id: "q14",
    kind: "scenario",
    topic: "DHCP / APIPA",
    prompt:
      "PC1, a DHCP client, cannot reach any other host after a reboot. The technician captures the following. What is the root cause?",
    exhibit: [
      "C:\\> ipconfig",
      "Ethernet adapter Ethernet0:",
      "   Autoconfiguration IPv4 Address. . : 169.254.37.112",
      "   Subnet Mask . . . . . . . . . . . : 255.255.0.0",
      "   Default Gateway . . . . . . . . . :",
      "",
      "C:\\> ipconfig /renew",
      "An error occurred while renewing interface Ethernet0 : unable to contact your DHCP server. Request has timed out.",
    ],
    options: [
      "PC1 has a duplicate address conflict with PC2",
      "The DNS server at 172.16.0.10 is unavailable",
      "PC1 has been configured with a static address in the wrong subnet",
      "PC1 cannot obtain a lease because the DHCP service on R1 is not responding",
    ],
    answer: 3,
    explanation:
      "The 169.254.x.x Autoconfiguration address and empty gateway show that APIPA was used after DHCP discovery failed, and /renew confirms that no server answered. The DHCP service on R1 must be restored before PC1 can obtain 192.168.1.10/24 and its gateway.",
  },
  {
    id: "q15",
    kind: "scenario",
    topic: "ICMP",
    prompt:
      "PC1 has a correct configuration (192.168.1.10/24, gateway 192.168.1.1). Given the output below, which device is the most likely point of failure?",
    exhibit: [
      "C:\\> ping 192.168.1.11",
      "Reply from 192.168.1.11: bytes=32 time<1ms TTL=128",
      "",
      "C:\\> ping 172.16.0.10",
      "Pinging 172.16.0.10 with 32 bytes of data:",
      "Reply from 192.168.1.10: Destination host unreachable.",
      "Reply from 192.168.1.10: Destination host unreachable.",
      "Reply from 192.168.1.10: Destination host unreachable.",
      "Reply from 192.168.1.10: Destination host unreachable.",
    ],
    options: [
      "Router R1 is powered off, so PC1 cannot resolve the gateway's MAC address",
      "FW1 rule 90 is denying ICMP from the 192.168.1.0/24 subnet",
      "SRV1 is powered off and FW1 is reporting that it cannot be reached",
      "The PC1 to SW1 cable is disconnected",
    ],
    answer: 0,
    explanation:
      "The unreachable message is generated by PC1 itself (192.168.1.10), meaning ARP for the gateway 192.168.1.1 failed locally. Since PC2 on the same switch replies, Layers 1 and 2 to SW1 are healthy and the gateway router is the failed component.",
  },
  {
    id: "q16",
    kind: "scenario",
    topic: "Routing",
    prompt:
      "PC1 receives the replies shown below when pinging SRV1. What is the most likely root cause?",
    exhibit: [
      "C:\\> ping 172.16.0.10",
      "Pinging 172.16.0.10 with 32 bytes of data:",
      "Reply from 192.168.1.1: Destination net unreachable.",
      "Reply from 192.168.1.1: Destination net unreachable.",
      "Reply from 192.168.1.1: Destination net unreachable.",
      "Reply from 192.168.1.1: Destination net unreachable.",
      "",
      "Ping statistics for 172.16.0.10:",
      "    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),",
    ],
    options: [
      "PC1 has an incorrect subnet mask",
      "SRV1 is powered off",
      "The R1 to FW1 link is down, so R1 no longer has a usable route to 172.16.0.0/24",
      "FW1 is dropping ICMP echo requests with a deny rule",
    ],
    answer: 2,
    explanation:
      "An ICMP Destination Net Unreachable from 192.168.1.1 means R1 received the packet but has no valid route for the destination network. The static route via 10.0.0.2 is withdrawn when Gi0/1 goes down, pointing to a failed R1 to FW1 link; the \"0% loss\" counts ICMP error replies, not successful echoes.",
  },
  {
    id: "q17",
    kind: "scenario",
    topic: "ARP",
    prompt:
      "PC1 experiences intermittent connectivity. The following output is collected on PC1. What is the root cause?",
    exhibit: [
      "C:\\> ipconfig /all",
      "   DHCP Enabled. . . . . . . . . . . : Yes",
      "   IPv4 Address. . . . . . . . . . . : 192.168.1.10(Duplicate)",
      "   Subnet Mask . . . . . . . . . . . : 255.255.255.0",
      "",
      "C:\\> ping 192.168.1.1",
      "Reply from 192.168.1.1: bytes=32 time=1ms TTL=255",
      "Request timed out.",
      "Reply from 192.168.1.1: bytes=32 time=1ms TTL=255",
      "Request timed out.",
      "    Packets: Sent = 4, Received = 2, Lost = 2 (50% loss),",
    ],
    options: [
      "The SW1 to R1 link is dropping frames due to a faulty cable",
      "Another host (PC2) has been statically configured with 192.168.1.10, so ARP replies alternate between two MAC addresses",
      "The DHCP lease on PC1 has expired",
      "R1 is rate-limiting ICMP echo replies",
    ],
    answer: 1,
    explanation:
      "The \"(Duplicate)\" flag shows that Windows gratuitous ARP detected another host claiming 192.168.1.10. R1's ARP cache flips between the two MACs, so roughly half the replies are delivered to the wrong host.",
  },
  {
    id: "q18",
    kind: "scenario",
    topic: "Performance",
    prompt:
      "Users report that www.lab.local is very slow but functional. Based on the measurements below, where is the fault located?",
    exhibit: [
      "C:\\> ping 192.168.1.1",
      "Reply from 192.168.1.1: bytes=32 time=1ms TTL=255",
      "",
      "C:\\> ping 172.16.0.10",
      "Reply from 172.16.0.10: bytes=32 time=241ms TTL=62",
      "Reply from 172.16.0.10: bytes=32 time=240ms TTL=62",
      "",
      "C:\\> tracert 172.16.0.10",
      "  1    <1 ms    <1 ms     1 ms  192.168.1.1",
      "  2   241 ms   240 ms   240 ms  10.0.0.2",
      "  3   241 ms   242 ms   241 ms  172.16.0.10",
    ],
    options: [
      "On the PC1 to SW1 access link",
      "Within SRV1, which is responding slowly to ICMP",
      "On the FW1 to SRV1 segment",
      "On the R1 to FW1 link, where round-trip time rises by about 240 ms",
    ],
    answer: 3,
    explanation:
      "Latency is under 1 ms to hop 1 and jumps to about 240 ms at hop 2 (10.0.0.2), then stays flat, so the delay is introduced between R1 and FW1. Tracert localises the fault by comparing per-hop round-trip times.",
  },

  // ---------------------------------------------------------------------------
  // Diagnostic questions: next step or output interpretation
  // ---------------------------------------------------------------------------
  {
    id: "q19",
    kind: "diagnostic",
    topic: "Methodology",
    prompt:
      "A user on PC1 reports \"the website does not work\". Following a bottom-up approach, which action should the technician perform first?",
    options: [
      "Run \"ipconfig /all\" to confirm the link state, IP address, mask, gateway and DNS server on PC1",
      "Run \"curl http://www.lab.local\" to test the web service directly",
      "Review the FW1 rule base for rules affecting TCP/80",
      "Restart the HTTP service on SRV1",
    ],
    answer: 0,
    explanation:
      "Bottom-up troubleshooting begins at the physical and data link layers and the host's own IP configuration before testing higher-layer services. \"ipconfig /all\" verifies media state and Layer 3 parameters in a single step.",
  },
  {
    id: "q20",
    kind: "diagnostic",
    topic: "Physical Layer",
    prompt:
      "PC1 shows the output below. What does it indicate, and what is the appropriate next step?",
    exhibit: [
      "C:\\> ipconfig",
      "Windows IP Configuration",
      "",
      "Ethernet adapter Ethernet0:",
      "",
      "   Media State . . . . . . . . . . . : Media disconnected",
      "   Connection-specific DNS Suffix  . :",
    ],
    options: [
      "A DHCP failure; run \"ipconfig /renew\"",
      "A DNS failure; run \"nslookup www.lab.local\"",
      "A Layer 1 fault on the PC1 to SW1 link; check the cable, the switch port and link lights",
      "A routing fault on R1; run \"tracert 172.16.0.10\"",
    ],
    answer: 2,
    explanation:
      "\"Media disconnected\" means the NIC detects no link signal, which is a Physical layer fault. No higher-layer command can succeed until the cable or the SW1 port is restored.",
  },
  {
    id: "q21",
    kind: "diagnostic",
    topic: "Divide and Conquer",
    prompt:
      "PC1 obtains the result below when pinging its default gateway. What does this result establish?",
    exhibit: [
      "C:\\> ping -n 20 192.168.1.1",
      "Reply from 192.168.1.1: bytes=32 time=1ms TTL=255",
      "Request timed out.",
      "Reply from 192.168.1.1: bytes=32 time=1ms TTL=255",
      "...",
      "Ping statistics for 192.168.1.1:",
      "    Packets: Sent = 20, Received = 13, Lost = 7 (35% loss),",
    ],
    options: [
      "The fault lies beyond R1, between FW1 and SRV1",
      "The fault lies within the local segment (PC1, SW1 or the SW1 to R1 link), because loss occurs before traffic leaves the subnet",
      "R1 has no route to 172.16.0.0/24",
      "The loss is expected behaviour, because routers deprioritise ICMP echo",
    ],
    answer: 1,
    explanation:
      "Loss to the first-hop gateway confines the fault to the local Layer 1 or Layer 2 path, so upstream devices can be excluded. The next step is to compare loss to PC2 (same switch) to separate the PC1 to SW1 link from the SW1 to R1 link.",
  },
  {
    id: "q22",
    kind: "diagnostic",
    topic: "IP Addressing",
    prompt:
      "PC1 cannot reach its gateway or PC2. Given the configuration below, what is the correct interpretation and corrective action?",
    exhibit: [
      "C:\\> ipconfig",
      "Ethernet adapter Ethernet0:",
      "   IPv4 Address. . . . . . . . . . . : 192.168.10.10",
      "   Subnet Mask . . . . . . . . . . . : 255.255.255.0",
      "   Default Gateway . . . . . . . . . : 192.168.1.1",
    ],
    options: [
      "The mask is incorrect; change it to 255.255.0.0 so the gateway becomes local",
      "The gateway is incorrect; change it to 192.168.10.1",
      "The configuration is valid; the fault must be on SW1",
      "PC1 is on 192.168.10.0/24 while the gateway is on 192.168.1.0/24; restore DHCP or set 192.168.1.10/24",
    ],
    answer: 3,
    explanation:
      "ANDing 192.168.10.10 with a /24 mask yields network 192.168.10.0, which does not contain 192.168.1.1, so PC1 treats all lab hosts as off-subnet and cannot ARP for an on-link gateway. The address must be corrected to lie in 192.168.1.0/24.",
  },
  {
    id: "q23",
    kind: "diagnostic",
    topic: "Methodology",
    prompt:
      "After restarting the stopped DNS service on SRV1, what should the technician do next to complete the troubleshooting process?",
    options: [
      "Verify from PC1 with \"nslookup www.lab.local\", \"ping www.lab.local\" and \"curl http://www.lab.local\", then document the cause and the fix",
      "Close the ticket, since restarting the service is known to resolve DNS faults",
      "Reboot PC1, R1 and FW1 to clear any cached state",
      "Add a permit rule for UDP/53 on FW1 as a precaution",
    ],
    answer: 0,
    explanation:
      "A fix is complete only when full end-to-end function is verified from the affected host and the change is documented. Making unrelated changes, such as additional firewall rules, introduces new variables without evidence.",
  },
  {
    id: "q24",
    kind: "diagnostic",
    topic: "ICMP",
    prompt:
      "When pinging from PC1, what is the essential difference between receiving \"Request timed out.\" and receiving \"Reply from 192.168.1.1: Destination net unreachable.\"?",
    options: [
      "Both messages mean the destination host is powered off",
      "\"Request timed out.\" is an ICMP error sent by R1; \"Destination net unreachable\" is generated locally by PC1",
      "\"Request timed out.\" means no reply of any kind arrived; \"Destination net unreachable\" is an explicit ICMP error from R1 stating it has no route",
      "\"Destination net unreachable\" indicates packet loss on the local switch",
    ],
    answer: 2,
    explanation:
      "A timeout is the absence of any ICMP response, which may be caused by a silent drop, a failed link or a lost reply. Destination Net Unreachable (ICMP type 3, code 0) is an active message from a router identifying the device where forwarding failed.",
  },
];
