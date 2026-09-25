export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  codeSnippet?: string;
}

export const PRE_TEST_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Which utility displays the local IPv4 address, subnet mask, and configured default gateway on Windows?',
    options: ['ping -a', 'ipconfig /all', 'traceroute -v', 'netstat -r'],
    correctIndex: 1,
    explanation:
      '`ipconfig` (and `ipconfig /all`) queries the local TCP/IP stack to display IP address parameters, subnet mask, default gateway, and DNS servers.',
  },
  {
    id: 2,
    question: 'When a Windows host displays an IP address starting with 169.254.x.x, what condition does this represent?',
    options: [
      'Successful static configuration for a high-performance DMZ',
      'An Automatic Private IP Addressing (APIPA) lease fallback due to DHCP failure',
      'A loopback virtual adapter assigned by Hyper-V',
      'A public IP assigned by the ISP upstream carrier',
    ],
    correctIndex: 1,
    explanation:
      'Addresses in the 169.254.0.0/16 range are RFC 3927 APIPA (link-local) addresses assigned automatically by the operating system when a DHCP client fails to receive an answer from a DHCP server.',
  },
  {
    id: 3,
    question: 'At which OSI layer does an incorrectly configured subnet mask primarily cause routing failure?',
    options: ['Physical Layer (Layer 1)', 'Data Link Layer (Layer 2)', 'Network Layer (Layer 3)', 'Session Layer (Layer 5)'],
    correctIndex: 2,
    explanation:
      'Subnet masks are part of Layer 3 (Network Layer) logical addressing. An incorrect mask corrupts the host\'s calculation of whether a destination is on the local network or requires routing via the default gateway.',
  },
  {
    id: 4,
    question: 'Which network protocol and message types do standard ping implementations utilize to test reachability?',
    options: [
      'TCP SYN and ACK packets',
      'ICMP Echo Request (Type 8) and Echo Reply (Type 0)',
      'UDP Datagrams on port 53',
      'ARP Request and ARP Response packets',
    ],
    correctIndex: 1,
    explanation:
      'The `ping` utility sends ICMP Echo Request messages (Type 8, Code 0) and expects receiving nodes to return ICMP Echo Reply messages (Type 0, Code 0).',
  },
  {
    id: 5,
    question: 'What header field does the traceroute (or tracert) diagnostic utility increment sequentially to discover hops?',
    options: ['Window Size', 'Time to Live (TTL) / Hop Limit', 'Checksum Field', 'Sequence Number'],
    correctIndex: 1,
    explanation:
      'Traceroute sends packets starting with TTL=1. Each intermediate router decrements TTL by 1. When TTL hits 0, the router discards the packet and sends back an ICMP Time Exceeded (Type 11), identifying that intermediate hop.',
  },
  {
    id: 6,
    question: 'If you can successfully ping a web server by its IP address (e.g., 172.16.0.80) but pinging "www.lab.local" fails, what is the most likely culprit?',
    options: [
      'The Ethernet cable is unplugged',
      'DNS resolution is failing or the DNS server is unreachable',
      'The default gateway router has crashed',
      'The destination web server has crashed',
    ],
    correctIndex: 1,
    explanation:
      'Successful IP ping proves Layer 1 through Layer 3 connectivity is intact. Failure when using a domain name specifically isolates the issue to Layer 7 Domain Name System (DNS) resolution.',
  },
  {
    id: 7,
    question: 'Which command allows an administrator to view the IP-to-Physical (MAC) address translation table cached on a host?',
    options: ['netstat -r', 'arp -a', 'nslookup -type=mac', 'route print'],
    correctIndex: 1,
    explanation:
      '`arp -a` prints the Address Resolution Protocol (ARP) cache table, which maps Layer 3 IPv4 addresses to Layer 2 physical hardware (MAC) addresses.',
  },
  {
    id: 8,
    question: 'What information does the `netstat -an` command provide to a network engineer?',
    options: [
      'Displays all active TCP connections, listening ports, and UDP sockets in numerical format without DNS reverse lookups',
      'Calculates the optical attenuation of fiber optic transceivers',
      'Flushes the Windows DNS client resolver cache',
      'Re-requests a DHCP address from the local router',
    ],
    correctIndex: 0,
    explanation:
      '`netstat -an` lists all active TCP connections and listening UDP/TCP ports with numerical addresses and ports (-n) rather than resolving hostnames.',
  },
  {
    id: 9,
    question: 'What is the foundational principle of the bottom-up OSI troubleshooting methodology?',
    options: [
      'Always blame the application software first to save engineering time',
      'A given OSI layer can only function properly if all underlying physical and logical layers below it are operating correctly',
      'Network diagnostics must always start with DNS testing before checking link lights',
      'Physical cables cannot fail once certified, so start at Layer 4',
    ],
    correctIndex: 1,
    explanation:
      'In bottom-up troubleshooting, you verify the Physical Layer (cables, link lights), then Data Link (MAC, ARP), then Network (IP, routing), because higher layers depend entirely on the operational health of lower layers.',
  },
  {
    id: 10,
    question: 'Which utility is best suited to test whether a specific TCP port (e.g. 80 or 443) is accepting three-way handshakes on a remote host?',
    options: ['ping', 'arp -d', 'telnet <host> <port> (or nc -zv)', 'ipconfig /flushdns'],
    correctIndex: 2,
    explanation:
      '`telnet host port` or `nc -zv host port` attempts a TCP 3-way handshake to the specified port, quickly testing if a port is open, closed, or blocked by a firewall.',
  },
];

export const POST_TEST_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Analyze the following Windows tracert output. At which hop did packet forwarding break?',
    codeSnippet: `Tracing route to 172.16.0.80 over a maximum of 30 hops:
  1    <1 ms    1 ms    1 ms  192.168.1.1
  2     5 ms    5 ms    6 ms  10.0.0.2
  3     *        *        *     Request timed out.
Trace complete.`,
    options: [
      'Between PC1 and the local switch',
      'At Hop 1 (192.168.1.1)',
      'Hop 2 (10.0.0.2) or the link/destination beyond it (172.16.0.80)',
      'The client NIC driver crashed',
    ],
    correctIndex: 2,
    explanation:
      'Hops 1 and 2 responded with valid ICMP Time Exceeded packets. Hop 3 timed out, indicating either the link between 10.0.0.2 and 172.16.0.80 is down, 172.16.0.80 is offline/blocking ICMP, or the return path to PC1 is missing.',
  },
  {
    id: 2,
    question: 'Examine the following `ipconfig /all` output from Workstation PC1 on subnet 192.168.1.0/24. What is the fatal misconfiguration?',
    codeSnippet: `Ethernet adapter Ethernet0:
   IPv4 Address. . . . . . . . . . . : 192.168.1.10
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.254`,
    options: [
      'The subnet mask is using a classful /8 boundary',
      'The Default Gateway is configured to 192.168.1.254, whereas the actual lab router interface is 192.168.1.1',
      'The IPv4 address is an APIPA link-local reserved address',
      'The adapter description is missing a valid PCI vendor ID',
    ],
    correctIndex: 1,
    explanation:
      'The default gateway must match the IP address of the local router interface on that subnet (192.168.1.1). Pointers to an unassigned IP (192.168.1.254) cause all non-local traffic to fail with ARP timeouts.',
  },
  {
    id: 3,
    question: 'How do you interpret the diagnostic difference between "Destination host unreachable" vs "Request timed out" in ping outputs?',
    options: [
      '"Request timed out" means a cable is unplugged; "Host unreachable" means DNS is down',
      '"Destination host unreachable" is typically generated by a router or local stack that has no route or failed ARP; "Request timed out" means the packet was forwarded but no reply came back before timer expiry',
      'They are exact synonyms in modern operating systems',
      '"Request timed out" indicates a duplicate MAC address collision on a Layer-2 switch',
    ],
    correctIndex: 1,
    explanation:
      'An ICMP Type 3 ("Destination Unreachable") message is an active notification sent back by a router or local host stating it cannot locate the destination. "Request timed out" is an expiry of the local client timer with no ICMP response received whatsoever (often due to packet drops, firewall filtering, or missing return routes).',
  },
  {
    id: 4,
    question: 'A workstation can successfully ping its default gateway 192.168.1.1, but pinging public IP 8.8.8.8 fails with "Request timed out". What does this rule OUT?',
    options: [
      'Rules out an ISP WAN uplink fiber cut',
      'Rules out a missing static route on the ISP edge router',
      'Rules out a Physical Layer (cable) failure between the workstation and the local switch/gateway',
      'Rules out a remote firewall dropping ICMP packets at 8.8.8.8',
    ],
    correctIndex: 2,
    explanation:
      'Because the workstation can ping 192.168.1.1, the local NIC, the patch cable, the switch, and the router\'s LAN port are all operational. Layer 1 and Layer 2 on the local subnet are completely ruled out as causes.',
  },
  {
    id: 5,
    question: 'In `arp -a`, an entry for an IP address displays the physical address as "incomplete" (or 00-00-00-00-00-00). What does this signify?',
    options: [
      'The remote host has IPv6 enabled with SLAAC',
      'The local host sent an ARP Request broadcast, but no device on the local network responded with an ARP Reply',
      'The switch has port security configured for 802.1X',
      'The network interface is running in promiscuous mode',
    ],
    correctIndex: 1,
    explanation:
      'An "incomplete" ARP entry indicates that an ARP request was broadcasted on the local subnet for that target IP, but no device replied within the timeout period (the target IP is unused, offline, or not on that L2 segment).',
  },
  {
    id: 6,
    question: '`netstat -an` on a server confirms TCP port 80 is in state "LISTENING". However, external clients running `telnet server_ip 80` receive "Connect failed (Connection timed out)". What is the most probable cause?',
    options: [
      'The web server daemon (Nginx/Apache) is not running',
      'A host or network firewall (e.g. iptables/Windows Firewall/ACL) is dropping incoming SYN packets to port 80',
      'The server has run out of file descriptors',
      'The client has an invalid default gateway',
    ],
    correctIndex: 1,
    explanation:
      'Since netstat shows the socket bound and LISTENING, the application is healthy. External connection timeouts indicate an intermediate firewall or host firewall is silently dropping incoming TCP SYN packets.',
  },
  {
    id: 7,
    question: 'A router R2 receives an ICMP Echo Request forwarded from PC1 (192.168.1.10) to Web Server (172.16.0.80). R2 forwards it to the server, and the server generates an Echo Reply. But PC1 never receives the reply. Which routing issue causes this?',
    options: [
      'The Web server has a corrupt ARP cache',
      'Asymmetric routing failure: Router R2 lacks a routing table entry for return subnet 192.168.1.0/24',
      'PC1 has an MTU black hole error',
      'The switch SW1 cannot learn unicast MAC addresses',
    ],
    correctIndex: 1,
    explanation:
      'Routing is asymmetric. Forward routing can succeed while return routing fails. If R2 lacks a route to 192.168.1.0/24, it has no way to forward return packets back to PC1, dropping them at the router.',
  },
  {
    id: 8,
    question: 'When two devices on the same Ethernet broadcast domain are statically assigned identical IPv4 addresses (192.168.1.10), what specific network phenomenon occurs?',
    options: [
      'The router automatically merges their bandwidth into a bonded trunk',
      'Both devices send gratuitous ARP announcements, causing the switch to flap its MAC address table and leading to erratic, intermittent packet delivery',
      'The subnet mask is dynamically halved by DHCP snooping',
      'All TCP sessions automatically convert to UDP broadcast streams',
    ],
    correctIndex: 1,
    explanation:
      'IP address conflicts cause ARP and MAC address table flapping on switches. Whichever device responds to an ARP request last receives subsequent frames until the other host transmits, causing severe packet loss and broken sessions.',
  },
  {
    id: 9,
    question: 'Why does pinging loopback `127.0.0.1` or `::1` serve as a critical diagnostic test in the bottom-up procedure?',
    options: [
      'It tests the physical RJ-45 copper pins of the patch cord',
      'It verifies that the local TCP/IP protocol stack, driver, and internal network software subsystem are functioning correctly',
      'It verifies that the ISP gateway has assigned an external DNS resolver',
      'It tests the throughput of the wireless access point antenna',
    ],
    correctIndex: 1,
    explanation:
      'Pinging 127.0.0.1 never transmits packets onto a physical medium; it loops back within the local OS kernel to verify that the local TCP/IP protocol stack is installed and operational.',
  },
  {
    id: 10,
    question: 'During diagnostic triage, what is the key difference between top-down and divide-and-conquer troubleshooting?',
    options: [
      'Top-down starts at Application Layer (Layer 7) and works down; divide-and-conquer starts at the middle (Network Layer 3, e.g. ping) to quickly bisect the stack into upper or lower issues',
      'Divide-and-conquer requires replacing all hardware before testing software',
      'Top-down is only used for wireless 802.11 networks',
      'Divide-and-conquer only applies to DNS troubleshooting',
    ],
    correctIndex: 0,
    explanation:
      'Top-down starts at Layer 7 (e.g. checking browser / HTTP) and descends. Divide-and-conquer tests Layer 3 first (using ping). If ping works, Layers 1-3 are verified, instantly narrowing the problem to Layers 4-7; if ping fails, the problem lies in Layers 1-3.',
  },
];
