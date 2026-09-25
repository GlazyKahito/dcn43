import { TopologyModel } from '../topology';
import { CommandResult, CommandOutputLine } from './types';

export function executeNetstat(
  topology: TopologyModel,
  srcDeviceId: string,
  args: string[]
): CommandResult {
  const lines: CommandOutputLine[] = [];
  const device = topology.devices[srcDeviceId];

  if (!device) {
    return {
      command: 'netstat',
      args,
      lines: [{ text: 'Device not found.', type: 'error', delayMs: 20 }],
    };
  }

  lines.push({ text: 'Active Connections', type: 'header', delayMs: 30 });
  lines.push({ text: '', type: 'default', delayMs: 10 });
  lines.push({
    text: '  Proto  Local Address          Foreign Address        State',
    type: 'default',
    delayMs: 30,
  });

  if (device.services.length === 0) {
    // Standard client connections
    const ifaceIp = device.interfaces[0]?.ip || '192.168.1.10';
    lines.push({
      text: `  TCP    ${ifaceIp}:50124       172.16.0.80:80         TIME_WAIT`,
      type: 'default',
      delayMs: 30,
    });
    lines.push({
      text: `  TCP    ${ifaceIp}:50125       172.16.0.53:53         CLOSE_WAIT`,
      type: 'default',
      delayMs: 30,
    });
    lines.push({
      text: `  UDP    ${ifaceIp}:5353        *:*                    `,
      type: 'default',
      delayMs: 30,
    });
  } else {
    for (const s of device.services) {
      const proto = s.protocol.padEnd(7, ' ');
      const local = `${s.address}:${s.port}`.padEnd(23, ' ');
      const foreign = '0.0.0.0:0'.padEnd(23, ' ');
      lines.push({
        text: `  ${proto}${local}${foreign}${s.state}`,
        type: s.state === 'LISTENING' ? 'success' : 'default',
        delayMs: 30,
      });
    }
  }

  return {
    command: 'netstat',
    args,
    lines,
    pathDevices: [srcDeviceId],
  };
}
