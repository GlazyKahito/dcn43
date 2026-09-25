import { enableDhcp, removeFirewallRule, restoreLinkQuality, setLinkUp, setPower, setService, setStatic } from './actions';
import { FAULTS, INJECTED_RULE_ID, type FaultKind } from './faults';
import { ADDR, createBaseline } from './topology';
import type { NetState } from './types';

export type CauseId =
  | 'access-cable'
  | 'wan-link'
  | 'router-down'
  | 'gateway-config'
  | 'ip-config'
  | 'dhcp-service'
  | 'duplicate-ip'
  | 'dns-service'
  | 'firewall-rule'
  | 'congestion'
  | 'damaged-cable';

export const CAUSES: Record<CauseId, { label: string; layer: string }> = {
  'access-cable': { label: 'PC1 access cable disconnected (PC1–SW1)', layer: 'L1' },
  'wan-link': { label: 'Uplink between R1 and FW1 is down', layer: 'L1' },
  'router-down': { label: 'Gateway router R1 has failed', layer: 'L3' },
  'gateway-config': { label: 'PC1 default gateway misconfigured', layer: 'L3' },
  'ip-config': { label: 'PC1 addressed outside the LAN subnet', layer: 'L3' },
  'dhcp-service': { label: 'DHCP server not answering; PC1 on APIPA', layer: 'L7' },
  'duplicate-ip': { label: 'Another host is using PC1’s IP address', layer: 'L2/L3' },
  'dns-service': { label: 'DNS service on SRV1 not responding', layer: 'L7' },
  'firewall-rule': { label: 'Firewall rule denying HTTP to SRV1', layer: 'L4' },
  congestion: { label: 'Congestion delaying traffic on R1–FW1', layer: 'L3' },
  'damaged-cable': { label: 'Damaged cable corrupting frames on SW1–R1', layer: 'L1' },
};

export type RepairId =
  | 'reconnect-access'
  | 'restore-wan'
  | 'power-r1'
  | 'set-gateway'
  | 'dhcp-mode'
  | 'restart-dhcp'
  | 'readdress-pc2'
  | 'restart-dns'
  | 'delete-rule'
  | 'clear-shaping'
  | 'replace-cable'
  | 'flush-dns';

export interface Repair {
  id: RepairId;
  label: string;
  command: string;
  apply: (s: NetState) => NetState;
}

export const REPAIRS: Record<RepairId, Repair> = {
  'reconnect-access': { id: 'reconnect-access', label: 'Reseat PC1 patch cable', command: 'SW1 Fa0/1: link up', apply: (s) => setLinkUp(s, 'PC1-SW1', true) },
  'restore-wan': { id: 'restore-wan', label: 'Restore R1–FW1 uplink', command: 'R1(config-if)# no shutdown', apply: (s) => setLinkUp(s, 'R1-FW1', true) },
  'power-r1': {
    id: 'power-r1',
    label: 'Power-cycle R1 and renew PC1 lease',
    command: 'R1 power on · ipconfig /renew',
    apply: (s) => {
      const on = setPower(s, 'R1', true);
      return on.devices.PC1.host?.mode === 'dhcp' ? enableDhcp(on, 'PC1').state : on;
    },
  },
  'set-gateway': {
    id: 'set-gateway',
    label: 'Set PC1 gateway to 192.168.1.1',
    command: 'netsh interface ip set address … gateway=192.168.1.1',
    apply: (s) => {
      const pc = s.devices.PC1;
      return setStatic(s, 'PC1', { ip: pc.interfaces[0].ip, mask: '255.255.255.0', gateway: ADDR.gateway, dns: pc.host?.dns || ADDR.server });
    },
  },
  'dhcp-mode': { id: 'dhcp-mode', label: 'Return PC1 to DHCP and renew', command: 'netsh … source=dhcp · ipconfig /renew', apply: (s) => enableDhcp(s, 'PC1').state },
  'restart-dhcp': {
    id: 'restart-dhcp',
    label: 'Restart DHCP service on R1, renew PC1',
    command: 'R1(config)# service dhcp · ipconfig /renew',
    apply: (s) => enableDhcp(setService(s, 'R1', 'dhcp', true), 'PC1').state,
  },
  'readdress-pc2': {
    id: 'readdress-pc2',
    label: 'Re-address PC2 to 192.168.1.11',
    command: 'PC2: netsh … static 192.168.1.11',
    apply: (s) => setStatic(s, 'PC2', { ip: ADDR.pc2, mask: '255.255.255.0', gateway: ADDR.gateway, dns: ADDR.server }),
  },
  'restart-dns': { id: 'restart-dns', label: 'Restart named on SRV1', command: 'sudo systemctl restart named', apply: (s) => setService(s, 'SRV1', 'dns', true) },
  'delete-rule': { id: 'delete-rule', label: 'Remove FW1 rule 5', command: 'FW1(config)# no access-list 5', apply: (s) => removeFirewallRule(s, INJECTED_RULE_ID) },
  'clear-shaping': { id: 'clear-shaping', label: 'Clear queueing on R1–FW1', command: 'R1(config-if)# no service-policy output SHAPE', apply: (s) => restoreLinkQuality(s, 'R1-FW1') },
  'replace-cable': { id: 'replace-cable', label: 'Replace SW1–R1 patch cable', command: 'Swap cable on SW1 Gi0/24', apply: (s) => restoreLinkQuality(s, 'SW1-R1') },
  'flush-dns': { id: 'flush-dns', label: 'Flush PC1 DNS cache', command: 'ipconfig /flushdns', apply: (s) => s },
};

export interface Scenario {
  id: string;
  no: string;
  title: string;
  ticket: string;
  fault: FaultKind;
  link?: Parameters<(typeof FAULTS)[number]['inject']>[1];
  cause: CauseId;
  causeOptions: CauseId[];
  repairs: RepairId[];
  fix: RepairId;
  hint: string;
  lesson: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'no-internet',
    no: '01',
    title: 'No Internet',
    ticket: 'PC1 cannot open any server-side resource. Local file shares on PC2 still work.',
    fault: 'link-down',
    link: 'R1-FW1',
    cause: 'wan-link',
    causeOptions: ['wan-link', 'router-down', 'dns-service', 'gateway-config', 'firewall-rule'],
    repairs: ['restore-wan', 'power-r1', 'restart-dns', 'set-gateway', 'flush-dns'],
    fix: 'restore-wan',
    hint: 'If the gateway answers but the server does not, trace the path to find where it stops.',
    lesson: 'R1 answers with “Destination net unreachable” because its route to 172.16.0.0/24 depends on the uplink that lost carrier.',
  },
  {
    id: 'dns-failure',
    no: '02',
    title: 'DNS Resolution Failure',
    ticket: 'Browsing to www.lab.local fails, yet a colleague reached the server by typing its IP address.',
    fault: 'dns-failure',
    cause: 'dns-service',
    causeOptions: ['dns-service', 'firewall-rule', 'wan-link', 'gateway-config', 'ip-config'],
    repairs: ['restart-dns', 'flush-dns', 'delete-rule', 'restore-wan', 'set-gateway'],
    fix: 'restart-dns',
    hint: 'Compare ping by address with ping by name, then ask the DNS server directly.',
    lesson: 'Layer 3 is healthy (ping 172.16.0.10 succeeds); only UDP/53 goes unanswered, so the fault sits in the application layer on SRV1.',
  },
  {
    id: 'gateway-unreachable',
    no: '03',
    title: 'Default Gateway Unreachable',
    ticket: 'After a manual IP change, PC1 reaches PC2 but nothing beyond the LAN.',
    fault: 'wrong-gateway',
    cause: 'gateway-config',
    causeOptions: ['gateway-config', 'router-down', 'access-cable', 'ip-config', 'dhcp-service'],
    repairs: ['set-gateway', 'power-r1', 'reconnect-access', 'restore-wan', 'flush-dns'],
    fix: 'set-gateway',
    hint: 'Read the configured gateway with ipconfig and check whether anything answers ARP for it.',
    lesson: 'PC1 forwards off-subnet packets to 192.168.1.254; nothing owns that address, so ARP stays incomplete.',
  },
  {
    id: 'high-latency',
    no: '04',
    title: 'High Latency',
    ticket: 'The intranet loads, but every page takes seconds. Users on the LAN notice nothing locally.',
    fault: 'high-latency',
    link: 'R1-FW1',
    cause: 'congestion',
    causeOptions: ['congestion', 'damaged-cable', 'dns-service', 'duplicate-ip', 'router-down'],
    repairs: ['clear-shaping', 'replace-cable', 'restart-dns', 'readdress-pc2', 'power-r1'],
    fix: 'clear-shaping',
    hint: 'Measure round-trip time to each hop; the segment where delay jumps is the one to inspect.',
    lesson: 'The gateway answers in about 1 ms while hop 2 jumps to roughly 240 ms, isolating the delay to R1–FW1.',
  },
  {
    id: 'packet-loss',
    no: '05',
    title: 'Packet Loss',
    ticket: 'Connections to the server drop intermittently; some pings fail, others succeed.',
    fault: 'packet-loss',
    link: 'SW1-R1',
    cause: 'damaged-cable',
    causeOptions: ['damaged-cable', 'congestion', 'duplicate-ip', 'wan-link', 'firewall-rule'],
    repairs: ['replace-cable', 'clear-shaping', 'readdress-pc2', 'restore-wan', 'flush-dns'],
    fix: 'replace-cable',
    hint: 'Check whether loss already appears on the first hop, before any routing is involved.',
    lesson: 'Loss is present even to the gateway, so the corruption is on the LAN side between SW1 and R1.',
  },
  {
    id: 'dhcp-failure',
    no: '06',
    title: 'DHCP Failure',
    ticket: 'PC1 was restarted this morning. Windows now reports “No Internet access”.',
    fault: 'dhcp-failure',
    cause: 'dhcp-service',
    causeOptions: ['dhcp-service', 'ip-config', 'access-cable', 'gateway-config', 'router-down'],
    repairs: ['restart-dhcp', 'dhcp-mode', 'reconnect-access', 'set-gateway', 'flush-dns'],
    fix: 'restart-dhcp',
    hint: 'An address beginning 169.254 means the client asked for a lease and nobody answered.',
    lesson: 'Renewing alone fails while R1’s DHCP service is stopped; the service must be restored before the lease can bind.',
  },
  {
    id: 'duplicate-ip',
    no: '07',
    title: 'Duplicate IP',
    ticket: 'PC1’s connection keeps dropping. A technician configured PC2 by hand earlier today.',
    fault: 'duplicate-ip',
    cause: 'duplicate-ip',
    causeOptions: ['duplicate-ip', 'damaged-cable', 'congestion', 'dhcp-service', 'gateway-config'],
    repairs: ['readdress-pc2', 'replace-cable', 'dhcp-mode', 'clear-shaping', 'flush-dns'],
    fix: 'readdress-pc2',
    hint: 'ipconfig flags conflicts; also look at who answers ARP for PC1’s address.',
    lesson: 'Two stations answer ARP for 192.168.1.10, so return traffic is split between them and roughly half is lost.',
  },
  {
    id: 'firewall-block',
    no: '08',
    title: 'Firewall Blocking Traffic',
    ticket: 'Since last night’s change window the intranet site times out. Ping to the server still works.',
    fault: 'firewall-block',
    cause: 'firewall-rule',
    causeOptions: ['firewall-rule', 'dns-service', 'wan-link', 'congestion', 'router-down'],
    repairs: ['delete-rule', 'restart-dns', 'restore-wan', 'clear-shaping', 'flush-dns'],
    fix: 'delete-rule',
    hint: 'ICMP and DNS succeed; test the application port itself and look at the TCP state.',
    lesson: 'SYN_SENT with no answer and a clean ping point to a silent drop on TCP/80 — FW1 rule 5 matches before the HTTP permit.',
  },
  {
    id: 'router-failure',
    no: '09',
    title: 'Router Failure',
    ticket: 'Every workstation lost access to the server at the same moment. PC1 and PC2 can still reach each other.',
    fault: 'router-failure',
    cause: 'router-down',
    causeOptions: ['router-down', 'wan-link', 'gateway-config', 'access-cable', 'dns-service'],
    repairs: ['power-r1', 'restore-wan', 'set-gateway', 'reconnect-access', 'restart-dns'],
    fix: 'power-r1',
    hint: 'Try the gateway first. If ARP for it fails on a correct configuration, the device itself is suspect.',
    lesson: 'With R1 down nobody answers ARP for 192.168.1.1, so PC1 reports “Destination host unreachable” from its own address.',
  },
  {
    id: 'broken-link',
    no: '10',
    title: 'Broken Network Link',
    ticket: 'PC1 shows a crossed-out network icon after desks were moved.',
    fault: 'link-down',
    link: 'PC1-SW1',
    cause: 'access-cable',
    causeOptions: ['access-cable', 'router-down', 'dhcp-service', 'ip-config', 'wan-link'],
    repairs: ['reconnect-access', 'power-r1', 'restart-dhcp', 'dhcp-mode', 'restore-wan'],
    fix: 'reconnect-access',
    hint: 'Start at layer 1: does the adapter report carrier at all?',
    lesson: '“Media disconnected” and “transmit failed” come from PC1 itself — nothing leaves the NIC, so the fault is the access cable.',
  },
];

export function loadScenario(s: Scenario): NetState {
  const def = FAULTS.find((f) => f.kind === s.fault)!;
  return def.inject(createBaseline(), s.link);
}
