import { TopologyModel } from '../topology';
import { CommandResult, CommandOutputLine } from './types';

export function executeArp(
  topology: TopologyModel,
  srcDeviceId: string,
  args: string[]
): CommandResult {
  const lines: CommandOutputLine[] = [];
  const device = topology.devices[srcDeviceId];

  if (!device) {
    return {
      command: 'arp',
      args,
      lines: [{ text: 'Device not found.', type: 'error', delayMs: 20 }],
    };
  }

  const argStr = args.join(' ').toLowerCase();
  if (args.length > 0 && !argStr.includes('-a') && !argStr.includes('/a') && !argStr.includes('-g')) {
    return {
      command: 'arp',
      args,
      lines: [
        { text: 'Usage: arp -a [inet_addr] [-N if_addr]', type: 'error', delayMs: 20 },
        { text: 'Displays current ARP entries by interrogating current protocol data.', type: 'default', delayMs: 20 },
      ],
    };
  }

  const ifaceIp = device.interfaces[0]?.ip || '192.168.1.10';

  lines.push({ text: `Interface: ${ifaceIp} --- 0x2`, type: 'header', delayMs: 40 });
  lines.push({
    text: '  Internet Address      Physical Address      Type',
    type: 'default',
    delayMs: 30,
  });

  // Check for duplicate IP scenario
  let duplicateConflict = false;
  for (const [otherId, other] of Object.entries(topology.devices)) {
    if (otherId === srcDeviceId) continue;
    if (other.interfaces.some((i) => i.enabled && i.ip === ifaceIp)) {
      duplicateConflict = true;
      break;
    }
  }

  for (const entry of device.arpCache) {
    const paddedIp = entry.ip.padEnd(20, ' ');
    const macFormatted = entry.mac ? entry.mac.toLowerCase().replace(/:/g, '-') : 'incomplete';
    const paddedMac = macFormatted.padEnd(20, ' ');

    lines.push({
      text: `  ${paddedIp}  ${paddedMac}  ${entry.type}`,
      type: entry.incomplete ? 'error' : 'default',
      delayMs: 30,
    });
  }

  // Standard broadcast and multicast entries
  lines.push({
    text: '  192.168.1.255         ff-ff-ff-ff-ff-ff     static',
    type: 'default',
    delayMs: 20,
  });
  lines.push({
    text: '  224.0.0.22            01-00-5e-00-00-16     static',
    type: 'default',
    delayMs: 20,
  });
  lines.push({
    text: '  239.255.255.250       01-00-5e-7f-ff-fa     static',
    type: 'default',
    delayMs: 20,
  });

  if (duplicateConflict) {
    lines.push({ text: '', type: 'default', delayMs: 20 });
    lines.push({
      text: `WARNING: Duplicate IP conflict detected for address ${ifaceIp}!`,
      type: 'error',
      delayMs: 80,
    });
    lines.push({
      text: `Another host on the local segment is responding with conflicting MAC address.`,
      type: 'warning',
      delayMs: 80,
    });
  }

  return {
    command: 'arp',
    args,
    lines,
    pathDevices: [srcDeviceId],
  };
}
