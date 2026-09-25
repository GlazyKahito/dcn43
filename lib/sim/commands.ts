import { releaseLease, renewLease } from './actions';
import { broadcastDomain, primaryIface, probe, resolveName, routeLookup, traceroute, type ProbeResult } from './engine';
import { inSubnet, isApipa, isIPv4, networkAddress, prefixToMask } from './ip';
import type { DeviceId, NetState, OutLine, Proto, Tone } from './types';

export interface Flight {
  proto: Proto;
  forward: DeviceId[];
  back: DeviceId[];
  delivered: boolean;
  label: string;
  /** Why the packet failed, in operator terms. */
  reason?: string;
}

export interface CommandResult {
  lines: OutLine[];
  next?: NetState;
  flight?: Flight;
  clear?: boolean;
  packets?: { sent: number; received: number };
}

export interface CommandContext {
  state: NetState;
  host: DeviceId;
  rng: () => number;
}

const L = (text: string, tone: Tone = 'out'): OutLine => ({ text, tone });
const ms = (rng: () => number, base: number) => Math.max(0.05, base * (0.85 + rng() * 0.3) + rng() * 0.25);
const fmtWin = (v: number) => (v < 1 ? '<1ms' : `=${Math.round(v)}ms`);

export const COMMAND_HELP: [string, string][] = [
  ['ping <host> [-n count]', 'ICMP echo; tests reachability and round-trip time'],
  ['tracert <host>', 'Windows trace, one line per router hop'],
  ['traceroute <host>', 'Unix-style trace of the same path'],
  ['ipconfig [/all|/release|/renew]', 'Adapter addressing and DHCP lease'],
  ['ifconfig', 'Interface view in Unix format'],
  ['nslookup <name>', 'Query the configured DNS server'],
  ['arp -a', 'IP-to-MAC cache for the local segment'],
  ['netstat [-an|-r]', 'Sockets, connection state and routing table'],
  ['curl <url>', 'HTTP GET, tests TCP/80 end to end'],
  ['hostname · cls · help', 'Utilities'],
];

/** Short operator-facing explanation of where and why a probe failed. */
export function describeFailure(p: ProbeResult): string | undefined {
  if (p.ok) return p.service === 'refused' || p.service === 'closed' ? `port closed on ${p.dst}` : undefined;
  const at = p.forward.at;
  switch (p.reason) {
    case 'src-down':
      return 'source powered off';
    case 'no-carrier':
      return `no carrier on ${at}`;
    case 'no-address':
      return `${at} has no IP address`;
    case 'no-gateway':
      return `${at} has no default gateway`;
    case 'gateway-off-subnet':
      return 'gateway not on local subnet';
    case 'arp-fail':
      return p.forward.path.length === 1 ? 'ARP for next hop failed' : `ARP failed at ${at}`;
    case 'no-route':
      return `no route at ${at}`;
    case 'fw-deny':
      return `filtered by ${at}`;
    case 'reply-lost':
      return 'reply lost on return path';
    default:
      return `dropped at ${at}`;
  }
}

export function flightFrom(p: ProbeResult, proto: Proto, label: string): Flight {
  return {
    proto,
    forward: p.forward.path,
    back: p.ok && p.reverse ? p.reverse.path : [],
    delivered: p.ok,
    label,
    reason: describeFailure(p),
  };
}

function hostHeader(state: NetState, host: DeviceId): string | null {
  const dev = state.devices[host];
  if (!dev.powered) return `${host} is powered off. Power it on from the device inspector.`;
  return null;
}

function duplicateOf(state: NetState, host: DeviceId): DeviceId | null {
  const iface = primaryIface(state.devices[host]);
  if (!iface) return null;
  const other = broadcastDomain(state, host, iface).find((m) => m.iface.ip === iface.ip);
  return other ? other.device : null;
}

function ping(ctx: CommandContext, args: string[]): CommandResult {
  const { state, host, rng } = ctx;
  let count = 4;
  const targets: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i].toLowerCase();
    if (a === '-n' || a === '-c') {
      count = Math.min(10, Math.max(1, Number(args[++i]) || 4));
    } else if (a === '-t') {
      count = 10;
    } else targets.push(args[i]);
  }
  const target = targets[0];
  if (!target) return { lines: [L('Usage: ping [-n count] target_name', 'warn')] };

  const res = resolveName(state, host, target);
  if (!res.ok || !res.ip) {
    return { lines: [L(`Ping request could not find host ${target}. Please check the name and try again.`, 'err')] };
  }
  const ip = res.ip;
  const p = probe(state, host, ip, 'icmp');
  const shown = isIPv4(target) ? ip : `${target} [${ip}]`;
  const lines: OutLine[] = [L(''), L(`Pinging ${shown} with 32 bytes of data:`)];
  let received = 0;
  const times: number[] = [];

  for (let i = 0; i < count; i++) {
    if (p.ok) {
      if (rng() < p.loss) {
        lines.push(L('Request timed out.', 'err'));
        continue;
      }
      const t = ms(rng, p.rtt);
      times.push(t);
      received++;
      lines.push(L(`Reply from ${ip}: bytes=32 time${fmtWin(t)} TTL=${p.replyTtl}`, t > 100 ? 'warn' : 'ok'));
    } else if (p.icmpError) {
      received++;
      lines.push(L(`Reply from ${p.icmpError.from}: ${p.icmpError.text}`, 'err'));
    } else if (p.reason === 'no-carrier' || p.reason === 'no-address' || p.reason === 'gateway-off-subnet' || p.reason === 'no-gateway') {
      lines.push(L('PING: transmit failed. General failure.', 'err'));
    } else {
      lines.push(L('Request timed out.', 'err'));
    }
  }

  const lost = count - received;
  lines.push(L(''), L(`Ping statistics for ${ip}:`));
  lines.push(L(`    Packets: Sent = ${count}, Received = ${received}, Lost = ${lost} (${Math.round((lost / count) * 100)}% loss),`, lost ? 'warn' : 'out'));
  if (times.length) {
    const min = Math.min(...times), max = Math.max(...times), avg = times.reduce((a, b) => a + b, 0) / times.length;
    lines.push(L('Approximate round trip times in milli-seconds:'));
    lines.push(L(`    Minimum = ${Math.round(min)}ms, Maximum = ${Math.round(max)}ms, Average = ${Math.round(avg)}ms`));
  }
  if (p.forward.conflict || p.reverse?.conflict) {
    const dup = duplicateOf(state, host);
    lines.push(L(''), L(`Warning: ARP replies for ${p.forward.conflict ? ip : primaryIface(state.devices[host])?.ip} arrive from two MAC addresses${dup ? ` (${dup})` : ''}.`, 'warn'));
  }
  return { lines, flight: flightFrom(p, 'icmp', `ICMP → ${target}`), packets: { sent: count, received: times.length } };
}

function reverseName(state: NetState, ip: string): string | undefined {
  return Object.entries(state.dns).find(([name, addr]) => addr === ip && !name.startsWith('ns.'))?.[0];
}

function trace(ctx: CommandContext, args: string[], unix: boolean): CommandResult {
  const { state, host, rng } = ctx;
  const target = args.find((a) => !a.startsWith('-'));
  if (!target) return { lines: [L(`Usage: ${unix ? 'traceroute' : 'tracert'} target_name`, 'warn')] };
  const res = resolveName(state, host, target);
  if (!res.ok || !res.ip) {
    return { lines: [L(unix ? `${target}: Name or service not known` : `Unable to resolve target system name ${target}.`, 'err')] };
  }
  const ip = res.ip;
  const { hops, complete } = traceroute(state, host, ip);
  const p = probe(state, host, ip);
  const lines: OutLine[] = [];
  if (unix) {
    lines.push(L(`traceroute to ${target} (${ip}), 8 hops max, 60 byte packets`));
  } else {
    lines.push(L(''), L(`Tracing route to ${isIPv4(target) ? ip : `${target} [${ip}]`}`), L('over a maximum of 8 hops:'), L(''));
  }
  const loss = p.ok ? p.loss : 0;

  for (const hop of hops) {
    const n = String(hop.ttl).padStart(unix ? 2 : 3);
    if (hop.kind === 'timeout') {
      lines.push(L(unix ? `${n}  * * *` : `${n}     *        *        *     Request timed out.`, 'err'));
      continue;
    }
    if (hop.kind === 'unreachable') {
      lines.push(L(unix ? `${n}  ${hop.ip} (${hop.ip})  !H` : `${n}  ${hop.ip}  ${hop.note}`, 'err'));
      continue;
    }
    const samples = [0, 1, 2].map(() => (rng() < loss ? null : ms(rng, hop.rtt)));
    const name = reverseName(state, hop.ip!);
    if (unix) {
      const cols = samples.map((s) => (s === null ? '*' : `${s.toFixed(3)} ms`)).join('  ');
      lines.push(L(`${n}  ${name ?? hop.ip} (${hop.ip})  ${cols}`, hop.kind === 'dest' ? 'ok' : 'out'));
    } else {
      const cols = samples.map((s) => (s === null ? '    *   ' : `${(s < 1 ? '<1' : String(Math.round(s))).padStart(5)} ms `)).join('');
      lines.push(L(`${n}  ${cols} ${name ? `${name} [${hop.ip}]` : hop.ip}`, hop.kind === 'dest' ? 'ok' : 'out'));
    }
  }
  if (!unix) lines.push(L(''), L(complete ? 'Trace complete.' : 'Trace stopped after three silent hops.', complete ? 'out' : 'warn'));
  else if (!complete) lines.push(L('(stopped after three silent hops)', 'dim'));
  return { lines, flight: flightFrom(p, 'icmp', `TRACE → ${target}`) };
}

function ipconfig(ctx: CommandContext, args: string[]): CommandResult {
  const { state, host } = ctx;
  const flag = (args[0] ?? '').toLowerCase();
  if (flag === '/release') {
    const next = releaseLease(state, host);
    const changed = next.devices[host].interfaces[0].ip !== state.devices[host].interfaces[0].ip;
    return {
      lines: changed
        ? [L(''), L('Windows IP Configuration'), L(''), L('Ethernet adapter Ethernet0: lease released.', 'warn')]
        : [L('The operation failed as no adapter is in the state permissible for this operation.', 'err')],
      next,
    };
  }
  if (flag === '/renew') {
    const out = renewLease(state, host);
    const lines = [L(''), L('Windows IP Configuration'), L('')];
    lines.push(L(out.message, out.ok ? 'ok' : 'err'));
    const view = ipconfig({ ...ctx, state: out.state }, []);
    return { lines: [...lines, ...view.lines.slice(3)], next: out.state };
  }
  if (flag === '/flushdns') {
    return { lines: [L(''), L('Windows IP Configuration'), L(''), L('Successfully flushed the DNS Resolver Cache.', 'ok')] };
  }

  const all = flag === '/all';
  const dev = state.devices[host];
  const iface = dev.interfaces[0];
  const h = dev.host!;
  const lines: OutLine[] = [L(''), L('Windows IP Configuration'), L('')];
  if (all) {
    lines.push(L(`   Host Name . . . . . . . . . . . . : ${host}`));
    lines.push(L('   Primary Dns Suffix  . . . . . . . : lab.local'), L(''));
  }
  lines.push(L(`Ethernet adapter ${iface.name}:`), L(''));
  if (!state.links[iface.link].up) {
    lines.push(L('   Media State . . . . . . . . . . . : Media disconnected', 'err'));
    if (all) lines.push(L(`   Physical Address. . . . . . . . . : ${iface.mac}`));
    return { lines };
  }
  const dup = duplicateOf(state, host);
  lines.push(L('   Connection-specific DNS Suffix  . : lab.local'));
  if (all) {
    lines.push(L(`   Physical Address. . . . . . . . . : ${iface.mac}`));
    lines.push(L(`   DHCP Enabled. . . . . . . . . . . : ${h.mode === 'dhcp' ? 'Yes' : 'No'}`));
  }
  if (isApipa(iface.ip)) {
    lines.push(L(`   Autoconfiguration IPv4 Address. . : ${iface.ip}(Preferred)`, 'err'));
  } else if (iface.ip === '0.0.0.0') {
    lines.push(L('   IPv4 Address. . . . . . . . . . . : 0.0.0.0', 'err'));
  } else {
    lines.push(L(`   IPv4 Address. . . . . . . . . . . : ${iface.ip}${dup ? '(Duplicate)' : all ? '(Preferred)' : ''}`, dup ? 'err' : 'out'));
  }
  lines.push(L(`   Subnet Mask . . . . . . . . . . . : ${prefixToMask(iface.prefix)}`));
  if (all && h.mode === 'dhcp' && !isApipa(iface.ip) && iface.ip !== '0.0.0.0') {
    lines.push(L('   Lease Obtained. . . . . . . . . . : 8 hours ago'));
    lines.push(L(`   DHCP Server . . . . . . . . . . . : 192.168.1.1`));
  }
  lines.push(L(`   Default Gateway . . . . . . . . . : ${h.gateway}`, h.gateway ? 'out' : 'warn'));
  if (all) lines.push(L(`   DNS Servers . . . . . . . . . . . : ${h.dns}`, h.dns ? 'out' : 'warn'));
  if (dup) lines.push(L(''), L(`   An address conflict was detected: ${dup} also answers for ${iface.ip}.`, 'err'));
  return { lines };
}

function ifconfig(ctx: CommandContext): CommandResult {
  const dev = ctx.state.devices[ctx.host];
  const iface = dev.interfaces[0];
  const up = ctx.state.links[iface.link].up;
  const bcast = iface.prefix ? networkAddress(iface.ip, iface.prefix).split('.').map((o, i) => {
    const maskOct = Number(prefixToMask(iface.prefix).split('.')[i]);
    return String(Number(o) | (~maskOct & 255));
  }).join('.') : '0.0.0.0';
  return {
    lines: [
      L(`eth0: flags=${up ? '4163<UP,BROADCAST,RUNNING,MULTICAST>' : '4099<UP,BROADCAST,MULTICAST>'}  mtu 1500`, up ? 'out' : 'err'),
      L(`        inet ${iface.ip}  netmask ${prefixToMask(iface.prefix)}  broadcast ${bcast}`),
      L(`        ether ${iface.mac.replace(/-/g, ':').toLowerCase()}  txqueuelen 1000  (Ethernet)`),
      L(up ? '        carrier: link detected' : '        carrier: NO-CARRIER', up ? 'dim' : 'err'),
    ],
  };
}

function nslookup(ctx: CommandContext, args: string[]): CommandResult {
  const { state, host } = ctx;
  const name = args[0];
  const server = state.devices[host].host?.dns ?? '';
  const serverName = Object.entries(state.dns).find(([n, ip]) => ip === server && n.startsWith('ns.'))?.[0] ?? 'UnKnown';
  if (!name) return { lines: [L('Usage: nslookup <name>', 'warn')] };
  if (!server) {
    return { lines: [L('*** Default servers are not available', 'err'), L('Server:  UnKnown'), L('Address:  127.0.0.1'), L(''), L(`*** UnKnown can't find ${name}: No response from server`, 'err')] };
  }
  const res = resolveName(state, host, name);
  const p = probe(state, host, server, 'udp', 53);
  const flight = flightFrom(p, 'udp', `DNS → ${name}`);
  if (res.failure === 'timeout') {
    return {
      lines: [L('DNS request timed out.', 'err'), L('    timeout was 2 seconds.', 'err'), L('Server:  UnKnown'), L(`Address:  ${server}`), L(''), L('DNS request timed out.', 'err'), L('    timeout was 2 seconds.', 'err'), L(`*** Request to UnKnown timed-out`, 'err')],
      flight,
    };
  }
  const head = [L(`Server:  ${serverName}`), L(`Address:  ${server}`), L('')];
  if (res.failure === 'nxdomain') return { lines: [...head, L(`*** ${serverName} can't find ${name}: Non-existent domain`, 'err')], flight };
  return { lines: [...head, L(`Name:    ${res.name.includes('.') ? res.name : `${res.name}.lab.local`}`, 'ok'), L(`Address:  ${res.ip}`, 'ok')], flight };
}

function arp(ctx: CommandContext, args: string[]): CommandResult {
  const { state, host } = ctx;
  if ((args[0] ?? '').toLowerCase() !== '-a') return { lines: [L('Usage: arp -a', 'warn')] };
  const iface = state.devices[host].interfaces[0];
  const peers = broadcastDomain(state, host, iface).filter((m) => m.iface.ip !== iface.ip && inSubnet(m.iface.ip, iface.ip, iface.prefix));
  const lines: OutLine[] = [L(''), L(`Interface: ${iface.ip} --- 0x4`), L('  Internet Address      Physical Address      Type')];
  for (const p of peers) {
    lines.push(L(`  ${p.iface.ip.padEnd(22)}${p.iface.mac.toLowerCase().padEnd(22)}dynamic`));
  }
  const gw = state.devices[host].host?.gateway;
  if (gw && inSubnet(gw, iface.ip, iface.prefix) && !peers.some((p) => p.iface.ip === gw)) {
    lines.push(L(`  ${gw.padEnd(22)}${'(incomplete)'.padEnd(22)}invalid`, 'err'));
  }
  lines.push(L(`  ${'192.168.1.255'.padEnd(22)}${'ff-ff-ff-ff-ff-ff'.padEnd(22)}static`, 'dim'));
  if (!peers.length && !state.links[iface.link].up) lines.push(L('  No ARP entries: media disconnected.', 'err'));
  return { lines };
}

function netstat(ctx: CommandContext, args: string[]): CommandResult {
  const { state, host } = ctx;
  const flag = (args[0] ?? '-an').toLowerCase();
  const dev = state.devices[host];
  const iface = dev.interfaces[0];
  if (flag === '-r') {
    const gw = dev.host?.gateway;
    const lines: OutLine[] = [
      L('IPv4 Route Table'),
      L('==========================================================================='),
      L('Active Routes:'),
      L('Network Destination        Netmask          Gateway       Interface  Metric'),
    ];
    if (gw) lines.push(L(`          0.0.0.0          0.0.0.0  ${gw.padStart(15)}  ${iface.ip.padStart(13)}     25`));
    if (iface.prefix) {
      lines.push(L(`  ${networkAddress(iface.ip, iface.prefix).padStart(15)}  ${prefixToMask(iface.prefix).padStart(15)}         On-link  ${iface.ip.padStart(13)}    281`));
    }
    lines.push(L('        127.0.0.0        255.0.0.0         On-link        127.0.0.1    331'));
    lines.push(L('==========================================================================='));
    if (!gw) lines.push(L('No default route: off-subnet traffic has nowhere to go.', 'warn'));
    return { lines };
  }
  const http = probe(state, host, '172.16.0.10', 'tcp', 80);
  const httpState = http.ok && http.service === 'open' ? 'TIME_WAIT' : http.forward.status === 'delivered' && http.service === 'refused' ? null : 'SYN_SENT';
  const lines: OutLine[] = [
    L(''),
    L('Active Connections'),
    L(''),
    L('  Proto  Local Address          Foreign Address        State'),
    L('  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING', 'dim'),
    L('  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING', 'dim'),
  ];
  if (httpState) {
    lines.push(L(`  TCP    ${`${iface.ip}:50412`.padEnd(23)}172.16.0.10:80         ${httpState}`, httpState === 'SYN_SENT' ? 'err' : 'out'));
  }
  lines.push(L(`  UDP    ${`${iface.ip}:137`.padEnd(23)}*:*`, 'dim'));
  return { lines };
}

function curl(ctx: CommandContext, args: string[]): CommandResult {
  const { state, host } = ctx;
  const raw = args.find((a) => !a.startsWith('-'));
  if (!raw) return { lines: [L('curl: try \'curl http://www.lab.local\'', 'warn')] };
  const target = raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const res = resolveName(state, host, target);
  if (!res.ok || !res.ip) return { lines: [L(`curl: (6) Could not resolve host: ${target}`, 'err')] };
  const p = probe(state, host, res.ip, 'tcp', 80);
  const flight = flightFrom(p, 'tcp', `HTTP → ${target}`);
  if (p.ok && p.service === 'open') {
    return {
      lines: [
        L('HTTP/1.1 200 OK', 'ok'),
        L('Server: nginx/1.24.0'),
        L('Content-Type: text/html'),
        L(''),
        L('<title>lab.local intranet</title>', 'dim'),
        L(`(${Math.round(p.rtt * 3)} ms, 612 bytes)`, 'dim'),
      ],
      flight,
    };
  }
  if (p.forward.status === 'delivered' && p.service === 'refused' && p.reverse) {
    return { lines: [L(`curl: (7) Failed to connect to ${target} port 80: Connection refused`, 'err')], flight };
  }
  if (p.icmpError) return { lines: [L(`curl: (7) Failed to connect to ${target} port 80: No route to host`, 'err')], flight };
  return { lines: [L(`curl: (28) Failed to connect to ${target} port 80 after 21000 ms: Timed out`, 'err')], flight };
}

export function runCommand(ctx: CommandContext, input: string): CommandResult {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { lines: [] };
  const [cmdRaw, ...args] = parts;
  const cmd = cmdRaw.toLowerCase();

  if (cmd === 'cls' || cmd === 'clear') return { lines: [], clear: true };
  if (cmd === 'help' || cmd === '?') {
    return { lines: [L('Available commands', 'dim'), ...COMMAND_HELP.map(([c, d]) => L(`  ${c.padEnd(34)}${d}`))] };
  }
  if (cmd === 'hostname') return { lines: [L(ctx.host)] };

  const down = hostHeader(ctx.state, ctx.host);
  if (down) return { lines: [L(down, 'err')] };

  switch (cmd) {
    case 'ping':
      return ping(ctx, args);
    case 'tracert':
      return trace(ctx, args, false);
    case 'traceroute':
      return trace(ctx, args, true);
    case 'ipconfig':
      return ipconfig(ctx, args);
    case 'ifconfig':
      return ifconfig(ctx);
    case 'nslookup':
      return nslookup(ctx, args);
    case 'arp':
      return arp(ctx, args);
    case 'netstat':
      return netstat(ctx, args);
    case 'route':
      return netstat(ctx, ['-r']);
    case 'curl':
      return curl(ctx, args);
    default:
      return { lines: [L(`'${cmdRaw}' is not recognized as a lab command. Type help for the list.`, 'err')] };
  }
}

export { routeLookup };
