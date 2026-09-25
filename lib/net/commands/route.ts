import { TopologyModel } from '../topology';
import { CommandResult, CommandOutputLine } from './types';

export function executeRoute(
  topology: TopologyModel,
  srcDeviceId: string,
  args: string[]
): CommandResult {
  const lines: CommandOutputLine[] = [];
  const device = topology.devices[srcDeviceId];

  if (!device) {
    return {
      command: 'route',
      args,
      lines: [{ text: 'Device not found.', type: 'error', delayMs: 20 }],
    };
  }

  const primaryIp = device.interfaces[0]?.ip || '192.168.1.10';

  lines.push({ text: '===========================================================================', type: 'default', delayMs: 20 });
  lines.push({ text: 'Interface List', type: 'header', delayMs: 20 });
  for (const iface of device.interfaces) {
    const macFmt = iface.mac.toLowerCase().replace(/:/g, ' ');
    lines.push({ text: ` 11...${macFmt} ......${iface.name}`, type: 'default', delayMs: 20 });
  }
  lines.push({ text: '===========================================================================', type: 'default', delayMs: 20 });
  lines.push({ text: 'IPv4 Route Table', type: 'header', delayMs: 20 });
  lines.push({ text: '===========================================================================', type: 'default', delayMs: 20 });
  lines.push({ text: 'Active Routes:', type: 'default', delayMs: 20 });
  lines.push({
    text: 'Network Destination        Netmask          Gateway       Interface  Metric',
    type: 'default',
    delayMs: 30,
  });

  for (const r of device.routes) {
    const dest = r.destination.padEnd(23, ' ');
    const mask = r.mask.padEnd(16, ' ');
    const gw = r.gateway.padEnd(16, ' ');
    const iface = primaryIp.padEnd(14, ' ');
    const metric = String(r.metric);
    lines.push({
      text: `${dest}${mask}${gw}${iface}${metric}`,
      type: 'default',
      delayMs: 25,
    });
  }

  lines.push({ text: '===========================================================================', type: 'default', delayMs: 20 });

  return {
    command: 'route',
    args,
    lines,
    pathDevices: [srcDeviceId],
  };
}
