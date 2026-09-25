import { TopologyModel } from '../topology';
import { CommandResult, CommandOutputLine } from './types';

export function executeIpconfig(
  topology: TopologyModel,
  srcDeviceId: string,
  args: string[]
): CommandResult {
  const lines: CommandOutputLine[] = [];
  const device = topology.devices[srcDeviceId];

  if (!device) {
    return {
      command: 'ipconfig',
      args,
      lines: [{ text: 'Device not found.', type: 'error', delayMs: 20 }],
    };
  }

  const argStr = args.join(' ').toLowerCase();

  if (argStr.includes('/release')) {
    const iface = device.interfaces[0];
    if (iface) {
      iface.ip = '0.0.0.0';
      iface.mask = '0.0.0.0';
      iface.cidr = 0;
    }
    device.defaultGateway = '';
    return {
      command: 'ipconfig',
      args,
      lines: [
        { text: 'Windows IP Configuration', type: 'header', delayMs: 50 },
        { text: '', type: 'default', delayMs: 20 },
        { text: 'No operation can be performed on Ethernet0 while its media is disconnected or lease released.', type: 'warning', delayMs: 100 },
        { text: 'Ethernet adapter Ethernet0:', type: 'default', delayMs: 50 },
        { text: '   IPv4 Address. . . . . . . . . . . : 0.0.0.0', type: 'default', delayMs: 50 },
        { text: '   Subnet Mask . . . . . . . . . . . : 0.0.0.0', type: 'default', delayMs: 50 },
        { text: '   Default Gateway . . . . . . . . . : ', type: 'default', delayMs: 50 },
      ],
    };
  }

  if (argStr.includes('/renew')) {
    // If DHCP is enabled or renewed
    const iface = device.interfaces[0];
    if (iface) {
      // Check if DHCP server is working or if DHCP failed scenario is active
      if (iface.ip.startsWith('169.254.') || device.dhcpEnabled) {
        iface.ip = '169.254.11.4';
        iface.mask = '255.255.0.0';
        iface.cidr = 16;
        device.defaultGateway = '';
        return {
          command: 'ipconfig',
          args,
          lines: [
            { text: 'Windows IP Configuration', type: 'header', delayMs: 50 },
            { text: '', type: 'default', delayMs: 20 },
            { text: 'An error occurred while renewing interface Ethernet0 : unable to contact your DHCP server.', type: 'error', delayMs: 300 },
            { text: 'Request has timed out. Autoconfiguration has assigned an APIPA address.', type: 'warning', delayMs: 150 },
            { text: '', type: 'default', delayMs: 20 },
            { text: 'Ethernet adapter Ethernet0:', type: 'default', delayMs: 50 },
            { text: '   Autoconfiguration IPv4 Address. . : 169.254.11.4', type: 'error', delayMs: 50 },
            { text: '   Subnet Mask . . . . . . . . . . . : 255.255.0.0', type: 'default', delayMs: 50 },
            { text: '   Default Gateway . . . . . . . . . : ', type: 'default', delayMs: 50 },
          ],
        };
      }
    }
  }

  const isAll = argStr.includes('/all') || argStr.includes('-a');

  lines.push({ text: 'Windows IP Configuration', type: 'header', delayMs: 50 });
  lines.push({ text: '', type: 'default', delayMs: 20 });

  if (isAll) {
    const isRouter = device.type === 'router';
    lines.push({ text: `   Host Name . . . . . . . . . . . . : ${device.id}`, type: 'default', delayMs: 30 });
    lines.push({ text: '   Primary Dns Suffix  . . . . . . . : lab.local', type: 'default', delayMs: 30 });
    lines.push({ text: '   Node Type . . . . . . . . . . . . : Hybrid', type: 'default', delayMs: 30 });
    lines.push({ text: `   IP Routing Enabled. . . . . . . . : ${isRouter ? 'Yes' : 'No'}`, type: 'default', delayMs: 30 });
    lines.push({ text: '   WINS Proxy Enabled. . . . . . . . : No', type: 'default', delayMs: 30 });
    lines.push({ text: '   DNS Suffix Search List. . . . . . : lab.local', type: 'default', delayMs: 30 });
    lines.push({ text: '', type: 'default', delayMs: 20 });
  }

  for (const iface of device.interfaces) {
    lines.push({ text: `Ethernet adapter ${iface.name}:`, type: 'default', delayMs: 40 });
    lines.push({ text: '', type: 'default', delayMs: 20 });

    if (isAll) {
      lines.push({ text: '   Connection-specific DNS Suffix  . : lab.local', type: 'default', delayMs: 30 });
      lines.push({ text: '   Description . . . . . . . . . . . : Realtek PCIe GbE Family Controller', type: 'default', delayMs: 30 });
      lines.push({ text: `   Physical Address. . . . . . . . . : ${iface.mac.replace(/:/g, '-')}`, type: 'default', delayMs: 30 });
      lines.push({ text: `   DHCP Enabled. . . . . . . . . . . : ${iface.ip.startsWith('169.254.') ? 'Yes' : 'No'}`, type: 'default', delayMs: 30 });
      lines.push({ text: '   Autoconfiguration Enabled . . . . : Yes', type: 'default', delayMs: 30 });
    }

    const isApipa = iface.ip.startsWith('169.254.');
    const ipLabel = isApipa
      ? '   Autoconfiguration IPv4 Address. . : '
      : '   IPv4 Address. . . . . . . . . . . : ';

    lines.push({
      text: `${ipLabel}${iface.ip}${isAll ? '(Preferred)' : ''}`,
      type: isApipa ? 'warning' : 'info',
      delayMs: 40,
    });
    lines.push({
      text: `   Subnet Mask . . . . . . . . . . . : ${iface.mask}`,
      type: iface.mask === '255.255.0.0' && !isApipa ? 'warning' : 'default',
      delayMs: 40,
    });
    lines.push({
      text: `   Default Gateway . . . . . . . . . : ${device.defaultGateway || ''}`,
      type: device.defaultGateway === '192.168.1.254' ? 'warning' : 'default',
      delayMs: 40,
    });

    if (isAll) {
      lines.push({
        text: `   DNS Servers . . . . . . . . . . . : ${device.dnsServer || ''}`,
        type: 'default',
        delayMs: 30,
      });
      lines.push({ text: '   NetBIOS over Tcpip. . . . . . . . : Enabled', type: 'default', delayMs: 30 });
    }

    lines.push({ text: '', type: 'default', delayMs: 20 });
  }

  return {
    command: 'ipconfig',
    args,
    lines,
    pathDevices: [srcDeviceId],
  };
}
