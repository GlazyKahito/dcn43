export function isIPv4(value: string): boolean {
  const parts = value.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255 && String(Number(p)) === p);
}

export function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + Number(octet)) >>> 0, 0) >>> 0;
}

export function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export function prefixToMask(prefix: number): string {
  return intToIp(prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0);
}

export function maskToPrefix(mask: string): number | null {
  if (!isIPv4(mask)) return null;
  const n = ipToInt(mask);
  let prefix = 0;
  while (prefix < 32 && (n & (1 << (31 - prefix))) !== 0) prefix++;
  // reject non-contiguous masks such as 255.0.255.0
  return prefixToMask(prefix) === mask ? prefix : null;
}

export function inSubnet(ip: string, network: string, prefix: number): boolean {
  if (!isIPv4(ip) || !isIPv4(network)) return false;
  if (prefix === 0) return true;
  const mask = (~0 << (32 - prefix)) >>> 0;
  return ((ipToInt(ip) & mask) >>> 0) === ((ipToInt(network) & mask) >>> 0);
}

export function networkAddress(ip: string, prefix: number): string {
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return intToIp((ipToInt(ip) & mask) >>> 0);
}

/** Matches "any", "a.b.c.d" or "a.b.c.d/nn". */
export function matchesCidr(ip: string, cidr: string): boolean {
  if (cidr === 'any') return true;
  const [net, len] = cidr.split('/');
  return inSubnet(ip, net, len === undefined ? 32 : Number(len));
}

export const isApipa = (ip: string) => ip.startsWith('169.254.');
