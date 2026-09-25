import { TopologyModel, cloneTopology } from './topology';

export interface FaultScenario {
  id: string;
  number: number;
  title: string;
  userComplaint: string;
  faultyLayer:
    | 'Physical Layer'
    | 'Data Link Layer'
    | 'Network Layer'
    | 'Transport Layer'
    | 'Application Layer';
  faultyDevice: 'PC1' | 'PC2' | 'SW1' | 'R1' | 'R2' | 'DNS' | 'WEB';
  causeDescription: string;
  reasoningChain: string[];
  diagnosticHint: string;
  recommendedCommand: string;
  apply: (base: TopologyModel) => TopologyModel;
  verifyFix: (current: TopologyModel) => boolean;
  fix: (current: TopologyModel) => TopologyModel;
}

export const FAULT_SCENARIOS: FaultScenario[] = [
  {
    id: 'fault-01-physical-cable',
    number: 1,
    title: 'Fault 01: Physical Link Disconnection',
    userComplaint: 'I cannot connect to any internet server or even reach the default gateway router.',
    faultyLayer: 'Physical Layer',
    faultyDevice: 'SW1',
    causeDescription: 'Cable between switch SW1 and router R1 is unplugged (Physical layer link failure).',
    reasoningChain: [
      'PC1 can ping other local machines (e.g. PC2 192.168.1.11) through SW1 successfully.',
      'Ping to default gateway 192.168.1.1 fails with "Destination host unreachable" or "Transmit failed".',
      'Physical link LED / link status between SW1 and R1 shows disconnected (link down).',
      'Diagnosis: Physical Layer fault at link SW1-R1.',
    ],
    diagnosticHint: 'Try pinging the default gateway 192.168.1.1 vs local workstation PC2 192.168.1.11.',
    recommendedCommand: 'ping 192.168.1.1',
    apply: (topo) => {
      const t = cloneTopology(topo);
      const link = t.links.find((l) => l.id === 'SW1-R1');
      if (link) link.up = false;
      return t;
    },
    verifyFix: (topo) => {
      const link = topo.links.find((l) => l.id === 'SW1-R1');
      return !!link && link.up;
    },
    fix: (topo) => {
      const t = cloneTopology(topo);
      const link = t.links.find((l) => l.id === 'SW1-R1');
      if (link) link.up = true;
      return t;
    },
  },
  {
    id: 'fault-02-wrong-gateway',
    number: 2,
    title: 'Fault 02: Incorrect Default Gateway',
    userComplaint: 'I can ping other workstations on my local floor, but I cannot reach the web server or DNS.',
    faultyLayer: 'Network Layer',
    faultyDevice: 'PC1',
    causeDescription: 'PC1 has the wrong default gateway configured (192.168.1.254 instead of 192.168.1.1).',
    reasoningChain: [
      'Pinging PC2 192.168.1.11 works because it is on the local /24 subnet.',
      'Pinging remote IP 172.16.0.80 fails because packets are sent to 192.168.1.254.',
      'Running ipconfig /all reveals Default Gateway is set to 192.168.1.254, which does not exist.',
      'Diagnosis: Network Layer (IP routing configuration) fault on PC1.',
    ],
    diagnosticHint: 'Inspect IP configuration on PC1 using ipconfig /all, then verify gateway reachability.',
    recommendedCommand: 'ipconfig /all',
    apply: (topo) => {
      const t = cloneTopology(topo);
      const pc1 = t.devices['PC1'];
      if (pc1) {
        pc1.defaultGateway = '192.168.1.254';
        pc1.status = 'misconfigured';
      }
      return t;
    },
    verifyFix: (topo) => {
      const pc1 = topo.devices['PC1'];
      return !!pc1 && pc1.defaultGateway === '192.168.1.1';
    },
    fix: (topo) => {
      const t = cloneTopology(topo);
      const pc1 = t.devices['PC1'];
      if (pc1) {
        pc1.defaultGateway = '192.168.1.1';
        pc1.status = 'up';
      }
      return t;
    },
  },
  {
    id: 'fault-03-wrong-subnet-mask',
    number: 3,
    title: 'Fault 03: Misconfigured Subnet Mask',
    userComplaint: 'Network connectivity is failing for remote servers, and PC1 cannot reach 172.16.0.80.',
    faultyLayer: 'Network Layer',
    faultyDevice: 'PC1',
    causeDescription: 'PC1 has the wrong subnet mask (/16 or 255.0.0.0) making remote hosts appear local, bypassing the router.',
    reasoningChain: [
      'PC1 is configured with subnet mask 255.255.0.0 (/16).',
      'When PC1 tries to reach remote IP 192.168.x or external addresses covered by wide mask, it treats them as on-link.',
      'PC1 issues broadcast ARP requests on the local switch rather than sending packets to gateway 192.168.1.1.',
      'ARP times out with "Destination host unreachable".',
      'Diagnosis: Subnet mask mismatch on Network Layer.',
    ],
    diagnosticHint: 'Run ipconfig /all on PC1 and compare its subnet mask with the /24 network design.',
    recommendedCommand: 'ipconfig',
    apply: (topo) => {
      const t = cloneTopology(topo);
      const pc1 = t.devices['PC1'];
      if (pc1 && pc1.interfaces[0]) {
        pc1.interfaces[0].mask = '255.255.0.0';
        pc1.interfaces[0].cidr = 16;
        pc1.status = 'misconfigured';
      }
      return t;
    },
    verifyFix: (topo) => {
      const pc1 = topo.devices['PC1'];
      return !!pc1 && pc1.interfaces[0]?.mask === '255.255.255.0';
    },
    fix: (topo) => {
      const t = cloneTopology(topo);
      const pc1 = t.devices['PC1'];
      if (pc1 && pc1.interfaces[0]) {
        pc1.interfaces[0].mask = '255.255.255.0';
        pc1.interfaces[0].cidr = 24;
        pc1.status = 'up';
      }
      return t;
    },
  },
  {
    id: 'fault-04-apipa-dhcp',
    number: 4,
    title: 'Fault 04: DHCP Failure (APIPA Address)',
    userComplaint: "Windows says 'Limited or No Connectivity'. I have an unfamiliar IP address.",
    faultyLayer: 'Network Layer',
    faultyDevice: 'PC1',
    causeDescription: 'DHCP lease acquisition failed; host fell back to APIPA 169.254.11.4 with no default gateway.',
    reasoningChain: [
      'Running ipconfig shows an address in 169.254.0.0/16 (RFC 3927 link-local).',
      'Default gateway is empty because APIPA assigns no default route.',
      'The host cannot route packets outside its local link-local domain.',
      'Diagnosis: DHCP service failure / missing IP lease.',
    ],
    diagnosticHint: 'Run ipconfig /all to inspect if the IP address begins with 169.254.',
    recommendedCommand: 'ipconfig /all',
    apply: (topo) => {
      const t = cloneTopology(topo);
      const pc1 = t.devices['PC1'];
      if (pc1 && pc1.interfaces[0]) {
        pc1.interfaces[0].ip = '169.254.11.4';
        pc1.interfaces[0].mask = '255.255.0.0';
        pc1.interfaces[0].cidr = 16;
        pc1.defaultGateway = '';
        pc1.dhcpEnabled = true;
        pc1.status = 'misconfigured';
      }
      return t;
    },
    verifyFix: (topo) => {
      const pc1 = topo.devices['PC1'];
      return !!pc1 && pc1.interfaces[0]?.ip === '192.168.1.10' && pc1.defaultGateway === '192.168.1.1';
    },
    fix: (topo) => {
      const t = cloneTopology(topo);
      const pc1 = t.devices['PC1'];
      if (pc1 && pc1.interfaces[0]) {
        pc1.interfaces[0].ip = '192.168.1.10';
        pc1.interfaces[0].mask = '255.255.255.0';
        pc1.interfaces[0].cidr = 24;
        pc1.defaultGateway = '192.168.1.1';
        pc1.dhcpEnabled = false;
        pc1.status = 'up';
      }
      return t;
    },
  },
  {
    id: 'fault-05-duplicate-ip',
    number: 5,
    title: 'Fault 05: Duplicate IP Address Conflict',
    userComplaint: 'My network connection keeps dropping intermittently and an IP address conflict was detected.',
    faultyLayer: 'Network Layer',
    faultyDevice: 'PC2',
    causeDescription: 'PC2 has been inadvertently configured with the same IP (192.168.1.10) as PC1.',
    reasoningChain: [
      'Two active hosts on the same L2 broadcast segment claim 192.168.1.10.',
      'The switch port MAC table flaps and ARP requests receive conflicting hardware MAC replies.',
      'Checking arp -a or comparing PC1 and PC2 shows duplicate IP assignment.',
      'Diagnosis: IP address conflict on the subnet.',
    ],
    diagnosticHint: 'Check arp -a and examine device configurations across workstations.',
    recommendedCommand: 'arp -a',
    apply: (topo) => {
      const t = cloneTopology(topo);
      const pc2 = t.devices['PC2'];
      if (pc2 && pc2.interfaces[0]) {
        pc2.interfaces[0].ip = '192.168.1.10';
        pc2.status = 'misconfigured';
      }
      return t;
    },
    verifyFix: (topo) => {
      const pc2 = topo.devices['PC2'];
      return !!pc2 && pc2.interfaces[0]?.ip === '192.168.1.11';
    },
    fix: (topo) => {
      const t = cloneTopology(topo);
      const pc2 = t.devices['PC2'];
      if (pc2 && pc2.interfaces[0]) {
        pc2.interfaces[0].ip = '192.168.1.11';
        pc2.status = 'up';
      }
      return t;
    },
  },
  {
    id: 'fault-06-dns-down',
    number: 6,
    title: 'Fault 06: DNS Server Service Failure',
    userComplaint: 'I can open the web server using http://172.16.0.80 directly, but typing www.lab.local fails to open.',
    faultyLayer: 'Application Layer',
    faultyDevice: 'DNS',
    causeDescription: 'The DNS daemon on 172.16.0.53 is stopped or failing to answer queries on port 53.',
    reasoningChain: [
      'Ping 172.16.0.80 succeeds with 0% loss (Network Layer / L3 is fully intact).',
      'Ping www.lab.local fails with "Ping request could not find host".',
      'Running nslookup www.lab.local times out with "No response from server".',
      'Diagnosis: Application Layer DNS service fault on DNS server (172.16.0.53).',
    ],
    diagnosticHint: 'Compare ping by raw IP vs ping by hostname, then test with nslookup.',
    recommendedCommand: 'nslookup www.lab.local',
    apply: (topo) => {
      const t = cloneTopology(topo);
      const dns = t.devices['DNS'];
      if (dns) {
        dns.services = dns.services.filter((s) => s.port !== 53);
        dns.status = 'misconfigured';
      }
      return t;
    },
    verifyFix: (topo) => {
      const dns = topo.devices['DNS'];
      return !!dns && dns.services.some((s) => s.port === 53 && s.state === 'LISTENING');
    },
    fix: (topo) => {
      const t = cloneTopology(topo);
      const dns = t.devices['DNS'];
      if (dns) {
        if (!dns.services.some((s) => s.port === 53)) {
          dns.services.push({
            protocol: 'UDP',
            address: '0.0.0.0',
            port: 53,
            state: 'LISTENING',
            serviceName: 'named / DNS',
          });
        }
        dns.status = 'up';
      }
      return t;
    },
  },
  {
    id: 'fault-07-missing-return-route',
    number: 7,
    title: 'Fault 07: Missing Return Route (Asymmetric Routing)',
    userComplaint: 'Pings to 172.16.0.80 time out, yet traceroute shows packets passing the first router R1.',
    faultyLayer: 'Network Layer',
    faultyDevice: 'R2',
    causeDescription: 'Router R2 is missing the return route for 192.168.1.0/24 via 10.0.0.1.',
    reasoningChain: [
      'Forward packets reach R1 and travel to R2.',
      'Target server generates Echo Reply addressed to 192.168.1.10.',
      'Router R2 checks its routing table and has no route back to 192.168.1.0/24, dropping the reply.',
      'Traceroute halts after hop 2 (10.0.0.2).',
      'Diagnosis: Missing return route on Router R2.',
    ],
    diagnosticHint: 'Run tracert www.lab.local from PC1 and check route print on R2.',
    recommendedCommand: 'tracert 172.16.0.80',
    apply: (topo) => {
      const t = cloneTopology(topo);
      const r2 = t.devices['R2'];
      if (r2) {
        r2.routes = r2.routes.filter((r) => r.destination !== '192.168.1.0');
        r2.status = 'misconfigured';
      }
      return t;
    },
    verifyFix: (topo) => {
      const r2 = topo.devices['R2'];
      return !!r2 && r2.routes.some((r) => r.destination === '192.168.1.0');
    },
    fix: (topo) => {
      const t = cloneTopology(topo);
      const r2 = t.devices['R2'];
      if (r2) {
        if (!r2.routes.some((r) => r.destination === '192.168.1.0')) {
          r2.routes.push({
            destination: '192.168.1.0',
            mask: '255.255.255.0',
            gateway: '10.0.0.1',
            interfaceName: 'GigabitEthernet0/0',
            metric: 1,
          });
        }
        r2.status = 'up';
      }
      return t;
    },
  },
  {
    id: 'fault-08-firewall-port',
    number: 8,
    title: 'Fault 08: Host Firewall Blocking TCP Port',
    userComplaint: 'Ping to 172.16.0.80 replies normally with low latency, but the website won\'t load in any browser.',
    faultyLayer: 'Transport Layer',
    faultyDevice: 'WEB',
    causeDescription: 'A firewall rule on the WEB server is actively filtering/blocking inbound TCP port 80.',
    reasoningChain: [
      'Ping 172.16.0.80 succeeds with 4/4 replies (ICMP echo allowed).',
      'Traceroute reaches 172.16.0.80 cleanly in 3 hops.',
      'Testing port connectivity via telnet 172.16.0.80 80 fails with Connect failed / Filtered.',
      'Checking netstat on WEB shows port 80 is listening, indicating the local service is healthy but blocked at firewall.',
      'Diagnosis: Transport Layer port filtering by host firewall.',
    ],
    diagnosticHint: 'Verify ICMP ping reachability first, then test TCP port 80 with telnet 172.16.0.80 80.',
    recommendedCommand: 'telnet 172.16.0.80 80',
    apply: (topo) => {
      const t = cloneTopology(topo);
      const web = t.devices['WEB'];
      if (web) {
        web.firewall.blockedPorts = [80];
        web.status = 'misconfigured';
      }
      return t;
    },
    verifyFix: (topo) => {
      const web = topo.devices['WEB'];
      return !!web && !web.firewall.blockedPorts.includes(80);
    },
    fix: (topo) => {
      const t = cloneTopology(topo);
      const web = t.devices['WEB'];
      if (web) {
        web.firewall.blockedPorts = [];
        web.status = 'up';
      }
      return t;
    },
  },
];
