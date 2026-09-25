import { TopologyModel } from '../topology';
import { portOpen } from '../engine';
import { CommandResult, CommandOutputLine } from './types';

export function executeTelnet(
  topology: TopologyModel,
  srcDeviceId: string,
  args: string[]
): CommandResult {
  const lines: CommandOutputLine[] = [];

  if (args.length < 2) {
    return {
      command: 'telnet',
      args,
      lines: [
        { text: 'Usage: telnet <host> <port>', type: 'error', delayMs: 20 },
        { text: 'Example: telnet 172.16.0.80 80', type: 'default', delayMs: 20 },
      ],
    };
  }

  const host = args[0];
  const port = parseInt(args[1], 10);

  if (isNaN(port) || port < 1 || port > 65535) {
    return {
      command: 'telnet',
      args,
      lines: [{ text: `Invalid port number: ${args[1]}`, type: 'error', delayMs: 20 }],
    };
  }

  lines.push({
    text: `Connecting to ${host} on port ${port}...`,
    type: 'default',
    delayMs: 150,
  });

  const check = portOpen(topology, srcDeviceId, host, port);

  if (check.open) {
    lines.push({
      text: `Connected to ${host}.`,
      type: 'success',
      delayMs: 200,
    });
    lines.push({
      text: `Escape character is '^]'. [Service: ${check.serviceName || 'Active'}]`,
      type: 'info',
      delayMs: 100,
    });
    lines.push({
      text: 'Connection closed by foreign host.',
      type: 'default',
      delayMs: 200,
    });
  } else {
    lines.push({
      text: check.failureDetail || `Could not open connection to the host, on port ${port}: Connect failed`,
      type: 'error',
      delayMs: 300,
    });
  }

  return {
    command: 'telnet',
    args,
    lines,
    pathDevices: [srcDeviceId, 'WEB'],
  };
}
