import {
  TopologyModel,
  Device,
  NetworkLink,
  isIpInSubnet,
  isValidIpv4,
  ipToLong,
} from './topology';

export interface ReachabilityResult {
  reachable: boolean;
  targetIp: string;
  resolvedHostname?: string;
  ttl: number;
  baseLatencyMs: number;
  failureReason?:
    | 'link_down'
    | 'no_carrier'
    | 'apipa_no_gateway'
    | 'ip_conflict'
    | 'wrong_gateway'
    | 'gateway_unreachable'
    | 'no_route'
    | 'return_route_missing'
    | 'dns_unresolved'
    | 'arp_timeout'
    | 'icmp_blocked'
    | 'host_down';
  failureDetail?: string;
  pathHopDevices: string[];
}

export interface PathHop {
  hopIndex: number;
  deviceId: string;
  ip: string;
  hostname?: string;
  latencyMs: number;
  success: boolean;
  statusText?: string;
}

export interface TracePathResult {
  success: boolean;
  targetIp: string;
  resolvedHostname?: string;
  hops: PathHop[];
  completed: boolean;
  failureReason?: string;
}

export interface PortCheckResult {
  open: boolean;
  port: number;
  targetIp: string;
  state: 'LISTENING' | 'REFUSED' | 'FILTERED' | 'TIMEOUT';
  serviceName?: string;
  failureDetail?: string;
}

export interface DnsResolveResult {
  success: boolean;
  hostname: string;
  ip?: string;
  serverUsed?: string;
  serverName?: string;
  failureReason?: 'server_unreachable' | 'server_down' | 'nxdomain' | 'no_dns_configured';
  detail?: string;
}

/**
 * Checks if a physical link is active between two directly connected nodes.
 */
export function isPhysicalLinkUp(topology: TopologyModel, nodeAId: string, nodeBId: string): boolean {
  const link = topology.links.find(
    (l) =>
      (l.nodeA === nodeAId && l.nodeB === nodeBId) ||
      (l.nodeA === nodeBId && l.nodeB === nodeAId)
  );
  return !!link && link.up;
}

/**
 * Checks if a device's primary interface has physical carrier (its link to adjacent node is up).
 */
export function isDeviceConnected(topology: TopologyModel, deviceId: string): boolean {
  const device = topology.devices[deviceId];
  if (!device || device.status === 'down') return false;

  const connectedLinks = topology.links.filter(
    (l) => (l.nodeA === deviceId || l.nodeB === deviceId) && l.up
  );
  return connectedLinks.length > 0;
}

/**
 * Resolves a hostname or IP to an IP using the device's configured DNS server.
 */
export function resolveName(
  topology: TopologyModel,
  srcDeviceId: string,
  hostnameOrIp: string
): DnsResolveResult {
  if (isValidIpv4(hostnameOrIp)) {
    return {
      success: true,
      hostname: hostnameOrIp,
      ip: hostnameOrIp,
      serverUsed: 'Local resolver',
    };
  }

  const srcDevice = topology.devices[srcDeviceId];
  if (!srcDevice || !srcDevice.dnsServer) {
    return {
      success: false,
      hostname: hostnameOrIp,
      failureReason: 'no_dns_configured',
      detail: '*** No DNS servers configured for this interface.',
    };
  }

  // Check if src can reach the DNS server IP
  const reachDns = canReach(topology, srcDeviceId, srcDevice.dnsServer);
  if (!reachDns.reachable) {
    return {
      success: false,
      hostname: hostnameOrIp,
      serverUsed: srcDevice.dnsServer,
      failureReason: 'server_unreachable',
      detail: `DNS request timed out.\n    timeout was 2 seconds.`,
    };
  }

  // Check if DNS server is running DNS service on port 53
  const dnsDevice = findDeviceByIp(topology, srcDevice.dnsServer);
  if (!dnsDevice || dnsDevice.status === 'down') {
    return {
      success: false,
      hostname: hostnameOrIp,
      serverUsed: srcDevice.dnsServer,
      failureReason: 'server_down',
      detail: `*** DNS server at ${srcDevice.dnsServer} refused query (service inactive).`,
    };
  }

  const dnsService = dnsDevice.services.find(
    (s) => s.port === 53 && s.state === 'LISTENING'
  );
  if (!dnsService) {
    return {
      success: false,
      hostname: hostnameOrIp,
      serverUsed: srcDevice.dnsServer,
      failureReason: 'server_down',
      detail: `*** DNS server at ${srcDevice.dnsServer} can't find ${hostnameOrIp}: Server failed`,
    };
  }

  // Look up in topology.dnsRecords
  const cleanName = hostnameOrIp.toLowerCase().trim();
  const matchedIp = topology.dnsRecords[cleanName];

  if (!matchedIp) {
    return {
      success: false,
      hostname: hostnameOrIp,
      serverUsed: srcDevice.dnsServer,
      serverName: dnsDevice.hostname || 'dns.lab.local',
      failureReason: 'nxdomain',
      detail: `*** ${dnsDevice.hostname || 'dns.lab.local'} can't find ${hostnameOrIp}: Non-existent domain`,
    };
  }

  return {
    success: true,
    hostname: hostnameOrIp,
    ip: matchedIp,
    serverUsed: srcDevice.dnsServer,
    serverName: dnsDevice.hostname || 'dns.lab.local',
  };
}

/**
 * Finds the device that owns the given IP address.
 */
export function findDeviceByIp(topology: TopologyModel, ip: string): Device | undefined {
  return Object.values(topology.devices).find((device) =>
    device.interfaces.some((iface) => iface.enabled && iface.ip === ip)
  );
}

/**
 * Finds the specific interface on a device that matches the IP.
 */
export function findInterfaceByIp(topology: TopologyModel, ip: string) {
  for (const device of Object.values(topology.devices)) {
    for (const iface of device.interfaces) {
      if (iface.enabled && iface.ip === ip) {
        return { device, iface };
      }
    }
  }
  return undefined;
}

/**
 * Checks for duplicate IP collision on the same broadcast domain (L2 switch or link).
 */
export function hasDuplicateIpCollision(topology: TopologyModel, deviceId: string): boolean {
  const device = topology.devices[deviceId];
  if (!device || device.interfaces.length === 0) return false;
  const devIp = device.interfaces[0].ip;

  for (const [otherId, other] of Object.entries(topology.devices)) {
    if (otherId === deviceId) continue;
    for (const otherIface of other.interfaces) {
      if (otherIface.enabled && otherIface.ip === devIp) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Core reachability function: determines if an ICMP Echo Request can traverse
 * from source device to destination and receive an Echo Reply back.
 */
export function canReach(
  topology: TopologyModel,
  srcDeviceId: string,
  dstIpOrName: string
): ReachabilityResult {
  const srcDevice = topology.devices[srcDeviceId];
  if (!srcDevice) {
    return {
      reachable: false,
      targetIp: dstIpOrName,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'host_down',
      failureDetail: `Device ${srcDeviceId} does not exist.`,
      pathHopDevices: [],
    };
  }

  // 1. Resolve destination IP
  let targetIp = dstIpOrName;
  let resolvedHostname: string | undefined = undefined;

  if (!isValidIpv4(dstIpOrName)) {
    const dnsRes = resolveName(topology, srcDeviceId, dstIpOrName);
    if (!dnsRes.success || !dnsRes.ip) {
      return {
        reachable: false,
        targetIp: dstIpOrName,
        ttl: 0,
        baseLatencyMs: 0,
        failureReason: 'dns_unresolved',
        failureDetail: dnsRes.detail || `Ping request could not find host ${dstIpOrName}. Please check the name and try again.`,
        pathHopDevices: [srcDeviceId],
      };
    }
    targetIp = dnsRes.ip;
    resolvedHostname = dstIpOrName;
  }

  const srcIface = srcDevice.interfaces[0];
  if (!srcIface || !srcIface.enabled || !srcIface.ip) {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'no_carrier',
      failureDetail: 'PING: transmit failed. General failure.',
      pathHopDevices: [srcDeviceId],
    };
  }

  // Check physical connection of source
  if (!isDeviceConnected(topology, srcDeviceId)) {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'link_down',
      failureDetail: 'PING: transmit failed. General failure (cable disconnected).',
      pathHopDevices: [srcDeviceId],
    };
  }

  // Check APIPA address (169.254.x.x)
  if (srcIface.ip.startsWith('169.254.')) {
    // APIPA can only communicate with other 169.254.x.x on the same physical broadcast segment
    if (!targetIp.startsWith('169.254.')) {
      return {
        reachable: false,
        targetIp,
        resolvedHostname,
        ttl: 0,
        baseLatencyMs: 0,
        failureReason: 'apipa_no_gateway',
        failureDetail: `Destination host unreachable. (Host has an APIPA address ${srcIface.ip} and no default gateway).`,
        pathHopDevices: [srcDeviceId],
      };
    }
  }

  // Check duplicate IP conflict on source
  if (hasDuplicateIpCollision(topology, srcDeviceId)) {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'ip_conflict',
      failureDetail: `Destination host unreachable (IP address collision detected for ${srcIface.ip}).`,
      pathHopDevices: [srcDeviceId],
    };
  }

  // Local loopback check (pinging self)
  if (srcDevice.interfaces.some((iface) => iface.ip === targetIp)) {
    return {
      reachable: true,
      targetIp,
      resolvedHostname,
      ttl: 128,
      baseLatencyMs: 0.2,
      pathHopDevices: [srcDeviceId],
    };
  }

  const dstDevice = findDeviceByIp(topology, targetIp);
  if (!dstDevice || dstDevice.status === 'down') {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'host_down',
      failureDetail: 'Request timed out.',
      pathHopDevices: [srcDeviceId],
    };
  }

  // Determine if target is considered on the local subnet by src
  const isDirectlyOnLocalSubnet = isIpInSubnet(targetIp, srcIface.ip, srcIface.mask);

  // Check scenario where subnet mask is wrong (e.g. /16 or /8), causing src to treat remote IP as local
  if (isDirectlyOnLocalSubnet) {
    // If target is physically on the same L2 broadcast domain (e.g. PC1 to PC2 or PC1 to R1 LAN)
    // Check if target is indeed on the LAN switch
    const isActuallyOnLocalLan =
      targetIp === '192.168.1.1' ||
      targetIp === '192.168.1.10' ||
      targetIp === '192.168.1.11';

    if (!isActuallyOnLocalLan) {
      // Source thinks target is local because of a faulty wide subnet mask (e.g. /16 on 192.168.x.x)
      // It broadcasts ARP for targetIp on local switch instead of sending to gateway!
      // ARP times out!
      return {
        reachable: false,
        targetIp,
        resolvedHostname,
        ttl: 0,
        baseLatencyMs: 0,
        failureReason: 'arp_timeout',
        failureDetail: `Destination host unreachable. (ARP request for ${targetIp} timed out on local subnet).`,
        pathHopDevices: [srcDeviceId, 'SW1'],
      };
    }

    // Local LAN reachability
    // Check switch link
    if (!isPhysicalLinkUp(topology, srcDeviceId, 'SW1')) {
      return {
        reachable: false,
        targetIp,
        resolvedHostname,
        ttl: 0,
        baseLatencyMs: 0,
        failureReason: 'link_down',
        failureDetail: 'PING: transmit failed. General failure.',
        pathHopDevices: [srcDeviceId],
      };
    }

    // Destination physical link to SW1 or direct
    const dstTargetId = dstDevice.id;
    if (dstTargetId !== 'SW1') {
      const linkToSw1 = topology.links.find(
        (l) =>
          ((l.nodeA === dstTargetId && l.nodeB === 'SW1') ||
            (l.nodeA === 'SW1' && l.nodeB === dstTargetId)) &&
          l.up
      );
      if (!linkToSw1) {
        return {
          reachable: false,
          targetIp,
          resolvedHostname,
          ttl: 0,
          baseLatencyMs: 0,
          failureReason: 'link_down',
          failureDetail: 'Destination host unreachable.',
          pathHopDevices: [srcDeviceId, 'SW1'],
        };
      }
    }

    // Healthy local reply
    const ttl = dstDevice.type === 'router' ? 64 : dstDevice.type === 'host' ? 128 : 64;
    return {
      reachable: true,
      targetIp,
      resolvedHostname,
      ttl,
      baseLatencyMs: 1.0,
      pathHopDevices: [srcDeviceId, 'SW1', dstDevice.id],
    };
  }

  // Target is remote: Must route through default gateway
  const gatewayIp = srcDevice.defaultGateway;
  if (!gatewayIp) {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'wrong_gateway',
      failureDetail: 'Destination host unreachable. (No default gateway configured).',
      pathHopDevices: [srcDeviceId],
    };
  }

  // Check if gateway is on source's subnet
  if (!isIpInSubnet(gatewayIp, srcIface.ip, srcIface.mask)) {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'wrong_gateway',
      failureDetail: `Destination host unreachable. (Default gateway ${gatewayIp} is not on subnet ${srcIface.ip}/${srcIface.cidr}).`,
      pathHopDevices: [srcDeviceId],
    };
  }

  // Check if default gateway is 192.168.1.1 (the actual router)
  if (gatewayIp !== '192.168.1.1') {
    // Wrong gateway IP configured (Scenario 2: 192.168.1.254)
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'gateway_unreachable',
      failureDetail: `Destination host unreachable. (Gateway ${gatewayIp} did not respond to ARP).`,
      pathHopDevices: [srcDeviceId, 'SW1'],
    };
  }

  // Check SW1 to R1 link (Scenario 1: Cable between SW1 and R1 unplugged)
  if (!isPhysicalLinkUp(topology, 'SW1', 'R1')) {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'link_down',
      failureDetail: 'Destination host unreachable. (Physical link between SW1 and R1 is down).',
      pathHopDevices: [srcDeviceId, 'SW1'],
    };
  }

  // Traffic reaches R1. Check R1 to R2 link.
  if (!isPhysicalLinkUp(topology, 'R1', 'R2')) {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'link_down',
      failureDetail: 'Request timed out. (Link R1-R2 is down).',
      pathHopDevices: [srcDeviceId, 'SW1', 'R1'],
    };
  }

  // Check if R1 has route to targetIp
  const r1Route = findBestRoute(topology.devices['R1'], targetIp);
  if (!r1Route) {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'no_route',
      failureDetail: 'Destination net unreachable. (R1 has no route to destination).',
      pathHopDevices: [srcDeviceId, 'SW1', 'R1'],
    };
  }

  // Check R2 routing
  const r2 = topology.devices['R2'];
  if (!r2 || r2.status === 'down') {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'host_down',
      failureDetail: 'Request timed out.',
      pathHopDevices: [srcDeviceId, 'SW1', 'R1'],
    };
  }

  const r2Route = findBestRoute(r2, targetIp);
  if (!r2Route) {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'no_route',
      failureDetail: 'Destination net unreachable. (R2 has no route to destination).',
      pathHopDevices: [srcDeviceId, 'SW1', 'R1', 'R2'],
    };
  }

  // Check link from R2 to final server (R2-DNS or R2-WEB)
  const serverLinkId = dstDevice.id === 'DNS' ? 'R2-DNS' : dstDevice.id === 'WEB' ? 'R2-WEB' : '';
  if (serverLinkId) {
    const linkObj = topology.links.find((l) => l.id === serverLinkId);
    if (!linkObj || !linkObj.up) {
      return {
        reachable: false,
        targetIp,
        resolvedHostname,
        ttl: 0,
        baseLatencyMs: 0,
        failureReason: 'link_down',
        failureDetail: 'Destination host unreachable.',
        pathHopDevices: [srcDeviceId, 'SW1', 'R1', 'R2'],
      };
    }
  }

  // CRITICAL: Check RETURN PATH! (Scenario 7: R2 is missing route back to 192.168.1.0/24)
  const returnRouteOnR2 = findBestRoute(r2, srcIface.ip);
  if (!returnRouteOnR2) {
    // The packet reached the destination host, but the reply cannot return through R2!
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'return_route_missing',
      failureDetail: 'Request timed out. (Asymmetric routing: R2 is missing return route to source subnet).',
      pathHopDevices: [srcDeviceId, 'SW1', 'R1', 'R2', dstDevice.id],
    };
  }

  // Check firewall on destination device for ICMP
  if (dstDevice.firewall.dropIcmp) {
    return {
      reachable: false,
      targetIp,
      resolvedHostname,
      ttl: 0,
      baseLatencyMs: 0,
      failureReason: 'icmp_blocked',
      failureDetail: 'Request timed out.',
      pathHopDevices: [srcDeviceId, 'SW1', 'R1', 'R2', dstDevice.id],
    };
  }

  // Destination reached successfully!
  // Latency calculation: PC1-SW1 (1ms) + SW1-R1 (0ms) + R1-R2 (5ms) + R2-WEB (2ms) * 2 = ~14ms
  // TTL: 64 at start, decremented by R1 (63), decremented by R2 (62) = TTL 62
  const pathDevices = [srcDeviceId, 'SW1', 'R1', 'R2', dstDevice.id];
  return {
    reachable: true,
    targetIp,
    resolvedHostname,
    ttl: 62,
    baseLatencyMs: 14.0,
    pathHopDevices: pathDevices,
  };
}

/**
 * Finds the most specific route in a device's routing table matching the destination IP.
 */
export function findBestRoute(device: Device, destIp: string) {
  const destLong = ipToLong(destIp);
  let bestRoute: typeof device.routes[0] | undefined = undefined;
  let bestPrefixLen = -1;

  for (const route of device.routes) {
    const routeDestLong = ipToLong(route.destination);
    const routeMaskLong = ipToLong(route.mask);

    if ((destLong & routeMaskLong) === (routeDestLong & routeMaskLong)) {
      // Calculate prefix length (number of set bits in mask)
      let prefixLen = 0;
      for (let i = 31; i >= 0; i--) {
        if ((routeMaskLong & (1 << i)) !== 0) prefixLen++;
        else break;
      }

      if (prefixLen > bestPrefixLen) {
        bestPrefixLen = prefixLen;
        bestRoute = route;
      }
    }
  }

  return bestRoute;
}

/**
 * Traces the path from src to dst hop by hop, simulating TTL incrementing probes.
 */
export function pathTo(
  topology: TopologyModel,
  srcDeviceId: string,
  dstIpOrName: string
): TracePathResult {
  // First resolve target
  let targetIp = dstIpOrName;
  let resolvedHostname: string | undefined = undefined;

  if (!isValidIpv4(dstIpOrName)) {
    const dns = resolveName(topology, srcDeviceId, dstIpOrName);
    if (!dns.success || !dns.ip) {
      return {
        success: false,
        targetIp: dstIpOrName,
        completed: false,
        hops: [],
        failureReason: `Unable to resolve target system name ${dstIpOrName}.`,
      };
    }
    targetIp = dns.ip;
    resolvedHostname = dstIpOrName;
  }

  const reach = canReach(topology, srcDeviceId, targetIp);
  const hops: PathHop[] = [];

  const srcDevice = topology.devices[srcDeviceId];
  if (!srcDevice || !isDeviceConnected(topology, srcDeviceId)) {
    return {
      success: false,
      targetIp,
      resolvedHostname,
      hops: [],
      completed: false,
      failureReason: 'Transmit error: code 1231 (network interface down).',
    };
  }

  // Hop 1: Gateway R1 (192.168.1.1)
  const gwIp = srcDevice.defaultGateway;
  if (!gwIp || gwIp !== '192.168.1.1' || !isPhysicalLinkUp(topology, 'SW1', 'R1')) {
    if (gwIp && gwIp === '192.168.1.254') {
      hops.push({
        hopIndex: 1,
        deviceId: 'SW1',
        ip: gwIp,
        latencyMs: 1.0,
        success: false,
        statusText: '* * * Request timed out.',
      });
      return {
        success: false,
        targetIp,
        resolvedHostname,
        hops,
        completed: false,
        failureReason: 'Destination host unreachable.',
      };
    }

    hops.push({
      hopIndex: 1,
      deviceId: 'PC1',
      ip: srcDevice.interfaces[0]?.ip || '192.168.1.10',
      latencyMs: 1.0,
      success: false,
      statusText: `${srcDevice.interfaces[0]?.ip} reports: Destination host unreachable.`,
    });
    return {
      success: false,
      targetIp,
      resolvedHostname,
      hops,
      completed: false,
      failureReason: 'Destination host unreachable.',
    };
  }

  // Hop 1 passes: R1 LAN interface
  hops.push({
    hopIndex: 1,
    deviceId: 'R1',
    ip: '192.168.1.1',
    hostname: 'R1.lab.local',
    latencyMs: 1.2,
    success: true,
  });

  // If target was R1, we are done
  if (targetIp === '192.168.1.1') {
    return {
      success: true,
      targetIp,
      resolvedHostname,
      hops,
      completed: true,
    };
  }

  // Hop 2: R2 WAN interface (10.0.0.2)
  if (!isPhysicalLinkUp(topology, 'R1', 'R2')) {
    hops.push({
      hopIndex: 2,
      deviceId: 'R1',
      ip: '10.0.0.1',
      latencyMs: 5.0,
      success: false,
      statusText: '* * * Request timed out.',
    });
    return {
      success: false,
      targetIp,
      resolvedHostname,
      hops,
      completed: false,
      failureReason: 'Request timed out.',
    };
  }

  hops.push({
    hopIndex: 2,
    deviceId: 'R2',
    ip: '10.0.0.2',
    hostname: 'R2.lab.local',
    latencyMs: 6.4,
    success: true,
  });

  if (targetIp === '10.0.0.2') {
    return {
      success: true,
      targetIp,
      resolvedHostname,
      hops,
      completed: true,
    };
  }

  // Check Scenario 7: R2 is missing return route to 192.168.1.0/24!
  // In traceroute, Hop 2 replies because R1 and R2 are directly connected on 10.0.0.0/30.
  // But Hop 3 (WEB 172.16.0.80): WEB sends reply to PC1, R2 has no route back to PC1!
  // So Hop 3 times out with * * * !
  const r2 = topology.devices['R2'];
  const hasReturnRoute = r2 && findBestRoute(r2, srcDevice.interfaces[0].ip);

  // Check link to server
  const dstDevice = findDeviceByIp(topology, targetIp);
  const serverLink = dstDevice?.id === 'DNS' ? 'R2-DNS' : 'R2-WEB';
  const isServerLinkUp = topology.links.find((l) => l.id === serverLink)?.up ?? true;

  if (!hasReturnRoute || !isServerLinkUp || reach.failureReason === 'return_route_missing') {
    hops.push({
      hopIndex: 3,
      deviceId: dstDevice?.id || 'WEB',
      ip: targetIp,
      latencyMs: 14.2,
      success: false,
      statusText: '* * * Request timed out.',
    });
    return {
      success: false,
      targetIp,
      resolvedHostname,
      hops,
      completed: false,
      failureReason: 'Trace timed out at final hop (no return path).',
    };
  }

  // Hop 3 passes: Final Destination (172.16.0.80 or 172.16.0.53)
  hops.push({
    hopIndex: 3,
    deviceId: dstDevice?.id || 'WEB',
    ip: targetIp,
    hostname: resolvedHostname || dstDevice?.hostname,
    latencyMs: 13.8,
    success: true,
  });

  return {
    success: true,
    targetIp,
    resolvedHostname,
    hops,
    completed: true,
  };
}

/**
 * Checks if a specific TCP/UDP port is open on the target host.
 */
export function portOpen(
  topology: TopologyModel,
  srcDeviceId: string,
  targetHost: string,
  port: number
): PortCheckResult {
  // First resolve IP
  let targetIp = targetHost;
  if (!isValidIpv4(targetHost)) {
    const dns = resolveName(topology, srcDeviceId, targetHost);
    if (!dns.success || !dns.ip) {
      return {
        open: false,
        port,
        targetIp: targetHost,
        state: 'TIMEOUT',
        failureDetail: dns.detail || `Could not resolve host ${targetHost}`,
      };
    }
    targetIp = dns.ip;
  }

  // Check IP reachability to the host
  const reach = canReach(topology, srcDeviceId, targetIp);
  if (!reach.reachable) {
    return {
      open: false,
      port,
      targetIp,
      state: 'TIMEOUT',
      failureDetail: `Could not open connection to the host, on port ${port}: Connect failed (Host unreachable)`,
    };
  }

  const dstDevice = findDeviceByIp(topology, targetIp);
  if (!dstDevice) {
    return {
      open: false,
      port,
      targetIp,
      state: 'REFUSED',
      failureDetail: `Could not open connection to the host, on port ${port}: Connect failed`,
    };
  }

  // Check destination firewall
  if (dstDevice.firewall.blockedPorts.includes(port)) {
    return {
      open: false,
      port,
      targetIp,
      state: 'FILTERED',
      failureDetail: `Connecting to ${targetHost}... Could not open connection to the host, on port ${port}: Connect failed (Connection filtered by firewall)`,
    };
  }

  // Check listening services on destination
  const service = dstDevice.services.find(
    (s) => s.port === port && s.state === 'LISTENING'
  );

  if (!service) {
    return {
      open: false,
      port,
      targetIp,
      state: 'REFUSED',
      failureDetail: `Connecting to ${targetHost}... Could not open connection to the host, on port ${port}: Connect failed (Connection refused - service not listening)`,
    };
  }

  return {
    open: true,
    port,
    targetIp,
    state: 'LISTENING',
    serviceName: service.serviceName,
  };
}

/**
 * Gets ARP cache for a device.
 */
export function arpTable(topology: TopologyModel, deviceId: string) {
  const device = topology.devices[deviceId];
  if (!device) return [];
  return device.arpCache;
}
