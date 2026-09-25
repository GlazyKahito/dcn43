'use client';

import { useMemo } from 'react';
import { assessHealth } from '@/lib/sim/health';
import { useLab, type LogTone } from '@/lib/sim/store';
import { DEVICE_ORDER, LINK_ORDER } from '@/lib/sim/topology';
import { Led, type LedTone } from '@/components/chrome/Led';

function Readout({ label, value, tone, sub }: { label: string; value: string; tone: LedTone; sub?: string }) {
  return (
    <div className="border-b border-r border-hair p-3">
      <p className="label">{label}</p>
      <p className="mt-1.5 flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.08em] text-paper">
        <Led tone={tone} />
        {value}
      </p>
      {sub && <p className="mt-1 font-mono text-[10.5px] text-dim">{sub}</p>}
    </div>
  );
}

/** Live instrument readouts derived from end-to-end checks on the shared network. */
export function Telemetry() {
  const { state } = useLab();
  const net = state.net;
  const h = useMemo(() => assessHealth(net), [net]);
  const devicesUp = DEVICE_ORDER.filter((d) => net.devices[d].powered).length;
  const linksUp = LINK_ORDER.filter((l) => net.links[l].up).length;
  const { sent, delivered, dropped } = state.packets;
  const httpOk = h.http.ok && h.http.service === 'open';

  return (
    <div className="grid grid-cols-2 border-l border-t border-hair sm:grid-cols-3">
      <Readout
        label="Network status"
        value={h.status}
        tone={h.status === 'operational' ? 'ok' : h.status === 'degraded' ? 'warn' : 'err'}
        sub={httpOk ? 'end-to-end service OK' : 'service path impaired'}
      />
      <Readout label="Device status" value={`${devicesUp}/${DEVICE_ORDER.length} up`} tone={devicesUp === DEVICE_ORDER.length ? 'ok' : 'err'} sub={DEVICE_ORDER.filter((d) => !net.devices[d].powered).join(' ') || 'all powered'} />
      <Readout
        label="Link status"
        value={linksUp === LINK_ORDER.length ? 'Carrier active' : 'Carrier dropped'}
        tone={linksUp === LINK_ORDER.length ? 'ok' : 'err'}
        sub={`${linksUp}/${LINK_ORDER.length} links · ${LINK_ORDER.filter((l) => !net.links[l].up).join(' ') || 'no alarms'}`}
      />
      <Readout label="Packet flow" value={`${delivered}/${sent}`} tone={dropped ? 'warn' : 'ok'} sub={`${dropped} dropped this session`} />
      <Readout
        label="Latency"
        value={h.latencyMs === null ? '—' : `${h.latencyMs < 1 ? '<1' : Math.round(h.latencyMs)} ms`}
        tone={h.latencyMs === null ? 'err' : h.latencyMs > 50 ? 'warn' : 'ok'}
        sub="PC1 ↔ SRV1 round trip"
      />
      <Readout label="Packet loss" value={`${h.lossPct}%`} tone={h.lossPct === 0 ? 'ok' : h.lossPct === 100 ? 'err' : 'warn'} sub="PC1 ↔ SRV1 expected" />
      <Readout label="DNS" value={h.dns.ok ? 'Online' : 'Failure'} tone={h.dns.ok ? 'ok' : 'err'} sub={h.dns.ok ? `www → ${h.dns.ip}` : h.dns.failure === 'no-server' ? 'no server configured' : 'query timed out'} />
      <Readout
        label="DHCP"
        value={{ bound: 'Lease bound', static: 'Static', apipa: 'APIPA', released: 'Released', 'service-down': 'Server down' }[h.dhcp]}
        tone={h.dhcp === 'bound' || h.dhcp === 'static' ? 'ok' : 'err'}
        sub={`PC1 ${net.devices.PC1.interfaces[0].ip}`}
      />
      <Readout label="Gateway" value={h.gateway.ok ? 'Reachable' : 'Unreachable'} tone={h.gateway.ok ? (h.gateway.loss ? 'warn' : 'ok') : 'err'} sub={`PC1 → ${net.devices.PC1.host?.gateway || 'none'}`} />
    </div>
  );
}

const LOG_TONE: Record<LogTone, string> = { info: 'text-muted', fault: 'text-alarm', fix: 'text-signal', packet: 'text-[#cfd2cc]' };

export function EventLog() {
  const { state } = useLab();
  return (
    <ol data-lenis-prevent className="thin-scroll h-[180px] space-y-1 overflow-y-auto font-mono text-[11px] leading-snug" aria-label="Event log">
      {state.log.map((e) => (
        <li key={e.id} className="flex gap-2">
          <span className="shrink-0 text-dim">{e.time}</span>
          <span className={LOG_TONE[e.tone]}>{e.text}</span>
        </li>
      ))}
    </ol>
  );
}
