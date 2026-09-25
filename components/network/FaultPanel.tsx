'use client';

import { useState } from 'react';
import { detectFaults, FAULTS, type FaultKind } from '@/lib/sim/faults';
import { useLab } from '@/lib/sim/store';
import type { DeviceId, LinkId, Proto } from '@/lib/sim/types';
import { Led } from '@/components/chrome/Led';

export function FaultPanel() {
  const { state, apply, reset } = useLab();
  const [links, setLinks] = useState<Partial<Record<FaultKind, LinkId>>>({});
  const active = detectFaults(state.net);

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-hair">
        {FAULTS.map((f) => (
          <li key={f.kind} className="flex items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[13px] text-paper">
                {f.label}
                <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-dim">{f.layer}</span>
              </p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-dim">{f.effect}</p>
            </div>
            {f.links && (
              <select
                aria-label={`${f.label}: link`}
                className="field w-[92px] py-1 text-[10.5px]"
                value={links[f.kind] ?? f.links[0]}
                onChange={(e) => setLinks({ ...links, [f.kind]: e.target.value as LinkId })}
              >
                {f.links.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="btn shrink-0 py-1 hover:border-alarm/60 hover:text-alarm"
              onClick={() => {
                const link = links[f.kind] ?? f.links?.[0];
                apply(f.inject(state.net, link), `Fault injected: ${f.label}${link ? ` on ${link}` : ''}`, 'fault');
              }}
            >
              Inject
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-hair pt-3">
        <p className="label mb-2">Deviations from reference</p>
        {active.length === 0 ? (
          <p className="flex items-center gap-2 font-mono text-[11.5px] text-signal">
            <Led tone="ok" /> None — configuration matches reference
          </p>
        ) : (
          <ul className="space-y-1">
            {active.map((f, i) => (
              <li key={i} className="flex items-center gap-2 font-mono text-[11.5px] text-alarm">
                <Led tone="err" /> {f.text}
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn mt-3 w-full" onClick={reset}>
          Restore reference network
        </button>
      </div>
    </div>
  );
}

const TARGETS = [
  { label: 'Gateway 192.168.1.1', value: '192.168.1.1' },
  { label: 'Server 172.16.0.10', value: '172.16.0.10' },
  { label: 'www.lab.local', value: 'www.lab.local' },
  { label: 'PC2 192.168.1.11', value: '192.168.1.11' },
  { label: 'PC1 192.168.1.10', value: '192.168.1.10' },
];
const PROTOS: { label: string; value: Proto }[] = [
  { label: 'ICMP echo', value: 'icmp' },
  { label: 'DNS query', value: 'udp' },
  { label: 'HTTP', value: 'tcp' },
];

export function PacketControls() {
  const { send } = useLab();
  const [src, setSrc] = useState<DeviceId>('PC1');
  const [dst, setDst] = useState('172.16.0.10');
  const [proto, setProto] = useState<Proto>('icmp');

  return (
    <form
      className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_1fr_auto_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        send(src, proto === 'udp' ? '172.16.0.10' : dst, proto);
      }}
    >
      <select aria-label="Source" className="field" value={src} onChange={(e) => setSrc(e.target.value as DeviceId)}>
        <option value="PC1">From PC1</option>
        <option value="PC2">From PC2</option>
      </select>
      <select aria-label="Destination" className="field" value={dst} onChange={(e) => setDst(e.target.value)} disabled={proto === 'udp'}>
        {TARGETS.map((t) => (
          <option key={t.value} value={t.value}>
            {proto === 'udp' ? 'DNS server 172.16.0.10' : t.label}
          </option>
        ))}
      </select>
      <select aria-label="Protocol" className="field" value={proto} onChange={(e) => setProto(e.target.value as Proto)}>
        {PROTOS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <button type="submit" className="btn-primary">
        Send packet
      </button>
    </form>
  );
}
