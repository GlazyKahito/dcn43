import { TopologyModel } from '../topology';
import { pathTo } from '../engine';
import { CommandResult, CommandOutputLine } from './types';

export function executeTracert(
  topology: TopologyModel,
  srcDeviceId: string,
  args: string[]
): CommandResult {
  const lines: CommandOutputLine[] = [];

  if (args.length === 0) {
    return {
      command: 'tracert',
      args,
      lines: [
        { text: 'Usage: tracert [-d] [-h maximum_hops] target_name', type: 'error', delayMs: 20 },
      ],
    };
  }

  const target = args[args.length - 1];
  const trace = pathTo(topology, srcDeviceId, target);

  if (!trace.targetIp && trace.failureReason) {
    return {
      command: 'tracert',
      args,
      lines: [
        {
          text: `Unable to resolve target system name ${target}.`,
          type: 'error',
          delayMs: 250,
        },
      ],
    };
  }

  const targetHeader = trace.resolvedHostname
    ? `${trace.resolvedHostname} [${trace.targetIp}]`
    : trace.targetIp;

  lines.push({
    text: `Tracing route to ${targetHeader}`,
    type: 'header',
    delayMs: 150,
  });
  lines.push({
    text: 'over a maximum of 30 hops:',
    type: 'default',
    delayMs: 100,
  });
  lines.push({ text: '', type: 'default', delayMs: 50 });

  const pathDevices: string[] = [srcDeviceId];

  if (trace.hops.length === 0 && trace.failureReason) {
    lines.push({
      text: `  1     *        *        *     ${trace.failureReason}`,
      type: 'error',
      delayMs: 300,
    });
  } else {
    for (const hop of trace.hops) {
      pathDevices.push(hop.deviceId);
      if (hop.success) {
        const ms1 = Math.max(1, Math.round(hop.latencyMs - 0.5));
        const ms2 = Math.max(1, Math.round(hop.latencyMs));
        const ms3 = Math.max(1, Math.round(hop.latencyMs + 0.5));
        const hostStr = hop.hostname ? ` [${hop.ip}]` : ` ${hop.ip}`;

        lines.push({
          text: `  ${hop.hopIndex}    ${ms1} ms    ${ms2} ms    ${ms3} ms  ${hop.ip}`,
          type: 'success',
          delayMs: 350,
          highlightDeviceId: hop.deviceId,
        });
      } else {
        lines.push({
          text: `  ${hop.hopIndex}     *        *        *     Request timed out.`,
          type: 'error',
          delayMs: 400,
          highlightDeviceId: hop.deviceId,
        });
      }
    }
  }

  lines.push({ text: '', type: 'default', delayMs: 80 });
  lines.push({
    text: trace.completed ? 'Trace complete.' : 'Trace halted.',
    type: trace.completed ? 'info' : 'warning',
    delayMs: 100,
  });

  return {
    command: 'tracert',
    args,
    lines,
    pathDevices,
  };
}
