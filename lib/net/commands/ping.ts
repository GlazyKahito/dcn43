import { TopologyModel } from '../topology';
import { canReach } from '../engine';
import { CommandResult, CommandOutputLine } from './types';

export function executePing(
  topology: TopologyModel,
  srcDeviceId: string,
  args: string[]
): CommandResult {
  const lines: CommandOutputLine[] = [];

  if (args.length === 0) {
    return {
      command: 'ping',
      args,
      lines: [
        { text: 'Usage: ping [-t] [-n count] target_name', type: 'error', delayMs: 20 },
        { text: 'Options:', type: 'default', delayMs: 20 },
        { text: '    -t             Ping the specified host until stopped.', type: 'default', delayMs: 20 },
        { text: '    -n count       Number of echo requests to send (default 4).', type: 'default', delayMs: 20 },
      ],
    };
  }

  let count = 4;
  let continuous = false;
  let target = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-t') {
      continuous = true;
    } else if (arg === '-n' && i + 1 < args.length) {
      const parsed = parseInt(args[i + 1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        count = Math.min(parsed, 20); // Cap at 20 in sim unless -t
      }
      i++;
    } else if (!target && !arg.startsWith('-')) {
      target = arg;
    }
  }

  if (!target) {
    return {
      command: 'ping',
      args,
      lines: [{ text: 'Ping: target address must be specified.', type: 'error', delayMs: 20 }],
    };
  }

  const reach = canReach(topology, srcDeviceId, target);
  const targetDisplay = reach.resolvedHostname
    ? `${reach.resolvedHostname} [${reach.targetIp}]`
    : reach.targetIp;

  if (reach.failureReason === 'dns_unresolved') {
    return {
      command: 'ping',
      args,
      pathDevices: reach.pathHopDevices,
      lines: [
        {
          text: `Ping request could not find host ${target}. Please check the name and try again.`,
          type: 'error',
          delayMs: 250,
        },
      ],
    };
  }

  lines.push({
    text: `Pinging ${targetDisplay} with 32 bytes of data:`,
    type: 'header',
    delayMs: 150,
  });

  const actualCount = continuous ? 4 : count;
  let received = 0;
  const latencies: number[] = [];

  for (let i = 0; i < actualCount; i++) {
    // Add realistic small jitter around base latency
    const jitter = Number(((Math.random() - 0.5) * 1.5).toFixed(0));
    const rtt = Math.max(1, Math.round(reach.baseLatencyMs + jitter));

    if (reach.reachable) {
      received++;
      latencies.push(rtt);
      lines.push({
        text: `Reply from ${reach.targetIp}: bytes=32 time=${rtt}ms TTL=${reach.ttl}`,
        type: 'success',
        delayMs: 250,
        highlightDeviceId: reach.pathHopDevices[reach.pathHopDevices.length - 1],
      });
    } else {
      let failMsg = 'Request timed out.';
      if (reach.failureReason === 'gateway_unreachable' || reach.failureReason === 'apipa_no_gateway') {
        failMsg = `Reply from ${topology.devices[srcDeviceId]?.interfaces[0]?.ip || '192.168.1.10'}: Destination host unreachable.`;
      } else if (reach.failureReason === 'arp_timeout') {
        failMsg = `Reply from ${topology.devices[srcDeviceId]?.interfaces[0]?.ip || '192.168.1.10'}: Destination host unreachable.`;
      } else if (reach.failureReason === 'no_route') {
        failMsg = `Reply from 192.168.1.1: Destination net unreachable.`;
      } else if (reach.failureReason === 'link_down') {
        failMsg = 'PING: transmit failed. General failure.';
      } else if (reach.failureReason === 'ip_conflict') {
        failMsg = `Reply from ${reach.targetIp}: Destination host unreachable (Hardware Error).`;
      }
      lines.push({
        text: failMsg,
        type: 'error',
        delayMs: 350,
      });
    }
  }

  // Ping statistics summary
  const lost = actualCount - received;
  const lossPercent = Math.round((lost / actualCount) * 100);

  lines.push({ text: '', type: 'default', delayMs: 100 });
  lines.push({
    text: `Ping statistics for ${reach.targetIp}:`,
    type: 'default',
    delayMs: 80,
  });
  lines.push({
    text: `    Packets: Sent = ${actualCount}, Received = ${received}, Lost = ${lost} (${lossPercent}% loss),`,
    type: 'default',
    delayMs: 80,
  });

  if (received > 0) {
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

    lines.push({
      text: 'Approximate round trip times in milli-seconds:',
      type: 'default',
      delayMs: 60,
    });
    lines.push({
      text: `    Minimum = ${min}ms, Maximum = ${max}ms, Average = ${avg}ms`,
      type: 'default',
      delayMs: 60,
    });
  }

  return {
    command: 'ping',
    args,
    lines,
    pathDevices: reach.pathHopDevices,
    isContinuous: continuous,
  };
}
