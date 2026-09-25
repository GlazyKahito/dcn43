import { TopologyModel } from '../topology';
import { CommandResult, CommandOutputLine } from './types';

export function executeIfconfig(
  topology: TopologyModel,
  srcDeviceId: string,
  args: string[]
): CommandResult {
  const lines: CommandOutputLine[] = [];
  const device = topology.devices[srcDeviceId];

  if (!device) {
    return {
      command: 'ifconfig',
      args,
      lines: [{ text: 'Device not found.', type: 'error', delayMs: 20 }],
    };
  }

  for (const iface of device.interfaces) {
    const isUp = iface.enabled && !iface.ip.startsWith('0.0.');
    const flags = isUp
      ? 'flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500'
      : 'flags=4098<BROADCAST,MULTICAST>  mtu 1500';

    lines.push({
      text: `${iface.name}: ${flags}`,
      type: 'header',
      delayMs: 30,
    });

    if (iface.ip && iface.ip !== '0.0.0.0') {
      lines.push({
        text: `        inet ${iface.ip}  netmask ${iface.mask}  broadcast 192.168.1.255`,
        type: 'info',
        delayMs: 30,
      });
    }

    lines.push({
      text: `        ether ${iface.mac}  txqueuelen 1000  (Ethernet)`,
      type: 'default',
      delayMs: 30,
    });
    lines.push({
      text: `        RX packets 1824  bytes 162980 (159.1 KB)`,
      type: 'default',
      delayMs: 20,
    });
    lines.push({
      text: `        TX packets 1792  bytes 154200 (150.5 KB)`,
      type: 'default',
      delayMs: 20,
    });
    lines.push({ text: '', type: 'default', delayMs: 10 });
  }

  return {
    command: 'ifconfig',
    args,
    lines,
    pathDevices: [srcDeviceId],
  };
}
