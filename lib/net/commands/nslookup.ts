import { TopologyModel } from '../topology';
import { resolveName } from '../engine';
import { CommandResult, CommandOutputLine } from './types';

export function executeNslookup(
  topology: TopologyModel,
  srcDeviceId: string,
  args: string[]
): CommandResult {
  const lines: CommandOutputLine[] = [];
  const srcDevice = topology.devices[srcDeviceId];

  if (args.length === 0) {
    const dnsServer = srcDevice?.dnsServer || '172.16.0.53';
    return {
      command: 'nslookup',
      args,
      lines: [
        { text: `Default Server:  dns.lab.local`, type: 'header', delayMs: 40 },
        { text: `Address:  ${dnsServer}`, type: 'default', delayMs: 40 },
        { text: '', type: 'default', delayMs: 20 },
        { text: '> Interactive mode not supported in simulator. Run: nslookup <hostname>', type: 'warning', delayMs: 40 },
      ],
    };
  }

  const query = args[0];
  const dnsRes = resolveName(topology, srcDeviceId, query);
  const serverUsed = dnsRes.serverUsed || srcDevice?.dnsServer || '172.16.0.53';
  const serverName = dnsRes.serverName || 'dns.lab.local';

  lines.push({
    text: `Server:  ${serverName}`,
    type: 'header',
    delayMs: 100,
  });
  lines.push({
    text: `Address:  ${serverUsed}`,
    type: 'default',
    delayMs: 60,
  });
  lines.push({ text: '', type: 'default', delayMs: 40 });

  if (dnsRes.success && dnsRes.ip) {
    lines.push({
      text: 'Non-authoritative answer:',
      type: 'default',
      delayMs: 80,
    });
    lines.push({
      text: `Name:    ${query}`,
      type: 'success',
      delayMs: 60,
    });
    lines.push({
      text: `Address:  ${dnsRes.ip}`,
      type: 'success',
      delayMs: 60,
      highlightDeviceId: 'WEB',
    });

    return {
      command: 'nslookup',
      args,
      lines,
      pathDevices: [srcDeviceId, 'DNS'],
    };
  }

  // DNS Failure (e.g. Scenario 6: DNS Server Down)
  if (dnsRes.failureReason === 'server_unreachable' || dnsRes.failureReason === 'server_down') {
    lines.push({
      text: `*** DNS request timed out.`,
      type: 'error',
      delayMs: 250,
    });
    lines.push({
      text: `    timeout was 2 seconds.`,
      type: 'error',
      delayMs: 100,
    });
    lines.push({
      text: `*** Can't find ${query}: No response from server.`,
      type: 'error',
      delayMs: 150,
    });
  } else if (dnsRes.failureReason === 'nxdomain') {
    lines.push({
      text: `*** ${serverName} can't find ${query}: Non-existent domain`,
      type: 'error',
      delayMs: 150,
    });
  } else {
    lines.push({
      text: dnsRes.detail || `*** Request failed for ${query}`,
      type: 'error',
      delayMs: 150,
    });
  }

  return {
    command: 'nslookup',
    args,
    lines,
    pathDevices: [srcDeviceId, 'DNS'],
  };
}
