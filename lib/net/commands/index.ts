import { TopologyModel } from '../topology';
import { CommandResult } from './types';
import { executePing } from './ping';
import { executeTracert } from './tracert';
import { executeIpconfig } from './ipconfig';
import { executeIfconfig } from './ifconfig';
import { executeNslookup } from './nslookup';
import { executeArp } from './arp';
import { executeNetstat } from './netstat';
import { executeRoute } from './route';
import { executeTelnet } from './telnet';

export * from './types';

export const SUPPORTED_COMMANDS = [
  'ping',
  'tracert',
  'traceroute',
  'ipconfig',
  'ifconfig',
  'nslookup',
  'dig',
  'arp',
  'netstat',
  'route',
  'telnet',
  'nc',
  'help',
  'clear',
  'cls',
];

export const COMMAND_CHEAT_SHEET: { cmd: string; question: string; example: string }[] = [
  { cmd: 'ping <target>', question: 'Is the remote host reachable and responding to ICMP?', example: 'ping 172.16.0.80' },
  { cmd: 'tracert <target>', question: 'Where along the multi-hop path is packet forwarding failing?', example: 'tracert www.lab.local' },
  { cmd: 'ipconfig /all', question: 'What is my local IP, subnet mask, default gateway and DNS server?', example: 'ipconfig /all' },
  { cmd: 'nslookup <name>', question: 'Is DNS resolving domain names to correct IP addresses?', example: 'nslookup www.lab.local' },
  { cmd: 'arp -a', question: 'What are the IP-to-MAC mappings in my local layer-2 ARP cache?', example: 'arp -a' },
  { cmd: 'netstat -an', question: 'What ports and network sockets are open and listening on this host?', example: 'netstat -an' },
  { cmd: 'telnet <host> <port>', question: 'Can a TCP handshake complete to a specific application port?', example: 'telnet 172.16.0.80 80' },
  { cmd: 'route print', question: 'What network routes and default gateway exist in the routing table?', example: 'route print' },
  { cmd: 'ipconfig /renew', question: 'Can this machine request a fresh IP lease from the DHCP server?', example: 'ipconfig /renew' },
];

export function runCommand(
  rawInput: string,
  topology: TopologyModel,
  currentDeviceId: string
): CommandResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      command: '',
      args: [],
      lines: [],
    };
  }

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case 'ping':
      return executePing(topology, currentDeviceId, args);
    case 'tracert':
    case 'traceroute':
      return executeTracert(topology, currentDeviceId, args);
    case 'ipconfig':
      return executeIpconfig(topology, currentDeviceId, args);
    case 'ifconfig':
      return executeIfconfig(topology, currentDeviceId, args);
    case 'nslookup':
    case 'dig':
      return executeNslookup(topology, currentDeviceId, args);
    case 'arp':
      return executeArp(topology, currentDeviceId, args);
    case 'netstat':
      return executeNetstat(topology, currentDeviceId, args);
    case 'route':
      return executeRoute(topology, currentDeviceId, args);
    case 'telnet':
    case 'nc':
      return executeTelnet(topology, currentDeviceId, args);
    case 'clear':
    case 'cls':
      return {
        command: 'clear',
        args,
        lines: [],
      };
    case 'help':
      return {
        command: 'help',
        args,
        lines: [
          { text: 'Virtual Lab Diagnostic Terminal - Available Commands:', type: 'header', delayMs: 40 },
          { text: '  ping [-t] [-n count] <target>  - Test ICMP reachability and RTT', type: 'info', delayMs: 25 },
          { text: '  tracert <target>               - Trace path hop-by-hop with TTL increments', type: 'info', delayMs: 25 },
          { text: '  ipconfig [/all | /release | /renew] - Display or manage IP configuration', type: 'info', delayMs: 25 },
          { text: '  ifconfig                       - Unix-style interface configuration display', type: 'default', delayMs: 25 },
          { text: '  nslookup <hostname>            - Query DNS server for A records', type: 'info', delayMs: 25 },
          { text: '  arp -a                         - View Address Resolution Protocol table', type: 'info', delayMs: 25 },
          { text: '  netstat -an                    - List active TCP/UDP ports and states', type: 'info', delayMs: 25 },
          { text: '  telnet <host> <port>           - Test TCP port socket connectivity', type: 'info', delayMs: 25 },
          { text: '  route print                    - Display local IPv4 routing table', type: 'default', delayMs: 25 },
          { text: '  clear                          - Clear terminal screen', type: 'default', delayMs: 20 },
        ],
      };
    default:
      return {
        command: cmd,
        args,
        lines: [
          {
            text: `'${cmd}' is not recognized as an internal or external command, operable program or batch file.`,
            type: 'error',
            delayMs: 40,
          },
          {
            text: `Type 'help' to see the list of supported network diagnostic commands.`,
            type: 'default',
            delayMs: 30,
          },
        ],
      };
  }
}
