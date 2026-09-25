'use client';

import { useEffect, useState } from 'react';
import {
  enableDhcp,
  removeFirewallRule,
  renewLease,
  restoreFirewall,
  restoreLinkQuality,
  setLinkQuality,
  setLinkUp,
  setPower,
  setService,
  setStatic,
  validateStatic,
} from '@/lib/sim/actions';
import { prefixToMask } from '@/lib/sim/ip';
import { useLab } from '@/lib/sim/store';
import { createBaseline } from '@/lib/sim/topology';
import type { Device, DeviceId, LinkId, ServiceId } from '@/lib/sim/types';
import { Led } from '@/components/chrome/Led';
import type { Selection } from './TopologyView';

const BASE_RULES = new Set(createBaseline().firewall.map((r) => r.id));
const SERVICE_LABEL: Record<ServiceId, string> = { dns: 'DNS · named · udp/53', http: 'HTTP · nginx · tcp/80', dhcp: 'DHCP server · udp/67' };

export function Inspector({ selection }: { selection: Selection }) {
  if (!selection) {
    return <p className="text-[13px] leading-relaxed text-muted">Select a device or a cable in the topology to inspect it, change its configuration or cut it.</p>;
  }
  return selection.type === 'device' ? <DeviceInspector id={selection.id} /> : <LinkInspector id={selection.id} />;
}

function Row({ k, v, tone }: { k: string; v: React.ReactNode; tone?: 'err' | 'warn' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hair py-1.5 font-mono text-[11.5px] last:border-0">
      <span className="text-dim">{k}</span>
      <span className={tone === 'err' ? 'text-alarm' : tone === 'warn' ? 'text-amber' : 'text-paper'}>{v}</span>
    </div>
  );
}

function DeviceInspector({ id }: { id: DeviceId }) {
  const { state, apply } = useLab();
  const d = state.net.devices[id];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-medium uppercase tracking-wide text-paper">{d.label}</p>
          <p className="label mt-0.5">{d.model}</p>
        </div>
        <button
          type="button"
          className={d.powered ? 'btn' : 'btn-primary'}
          onClick={() => apply(setPower(state.net, id, !d.powered), `${id} powered ${d.powered ? 'off' : 'on'}`, d.powered ? 'fault' : 'fix')}
        >
          <Led tone={d.powered ? 'ok' : 'err'} />
          {d.powered ? 'Power off' : 'Power on'}
        </button>
      </div>

      {d.interfaces.length > 0 && (
        <div>
          <p className="label mb-1.5">Interfaces</p>
          {d.interfaces.map((i) => (
            <Row
              key={i.name}
              k={i.name}
              v={
                <>
                  {i.ip}/{i.prefix} <span className="text-dim">· {state.net.links[i.link].up ? 'up' : 'down'}</span>
                </>
              }
              tone={state.net.links[i.link].up ? undefined : 'err'}
            />
          ))}
        </div>
      )}

      {d.host && d.kind === 'host' && <HostConfig device={d} />}

      {d.routes.length > 0 && (
        <div>
          <p className="label mb-1.5">Static routes</p>
          {d.routes.map((r) => (
            <Row key={`${r.network}/${r.prefix}`} k={`${r.network}/${r.prefix}`} v={`via ${r.via}`} />
          ))}
        </div>
      )}

      {Object.keys(createBaseline().devices[id].services).length > 0 && (
        <div>
          <p className="label mb-1.5">Services</p>
          <div className="space-y-1.5">
            {(Object.keys(createBaseline().devices[id].services) as ServiceId[]).map((svc) => {
              const on = !!d.services[svc];
              return (
                <div key={svc} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-mono text-[11.5px] text-paper">
                    <Led tone={on ? 'ok' : 'err'} />
                    {SERVICE_LABEL[svc]}
                  </span>
                  <button
                    type="button"
                    className="btn py-1"
                    onClick={() => apply(setService(state.net, id, svc, !on), `${id}: ${svc} service ${on ? 'stopped' : 'started'}`, on ? 'fault' : 'fix')}
                  >
                    {on ? 'Stop' : 'Start'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {d.kind === 'firewall' && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="label">Access list · first match wins</p>
            <button type="button" className="btn-ghost" onClick={() => apply(restoreFirewall(state.net), 'FW1 policy restored', 'fix')}>
              Restore policy
            </button>
          </div>
          <div className="space-y-1">
            {state.net.firewall.map((r) => (
              <div key={r.id} className={`flex items-center gap-2 font-mono text-[11px] ${BASE_RULES.has(r.id) ? 'text-muted' : 'text-alarm'}`}>
                <span className="w-5 text-dim">{r.id}</span>
                <span className="flex-1">
                  {r.action} {r.proto} {r.src} → {r.dst}
                  {r.port ? ` eq ${r.port}` : ''}
                </span>
                {!BASE_RULES.has(r.id) && (
                  <button type="button" className="btn py-0.5" onClick={() => apply(removeFirewallRule(state.net, r.id), `FW1: rule ${r.id} removed`, 'fix')}>
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HostConfig({ device: d }: { device: Device }) {
  const { state, apply } = useLab();
  const iface = d.interfaces[0];
  const current = { ip: iface.ip, mask: prefixToMask(iface.prefix), gateway: d.host!.gateway, dns: d.host!.dns };
  const [form, setForm] = useState(current);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const key = `${iface.ip}|${iface.prefix}|${d.host!.gateway}|${d.host!.dns}|${d.host!.mode}`;

  useEffect(() => {
    setForm({ ip: iface.ip, mask: prefixToMask(iface.prefix), gateway: d.host!.gateway, dns: d.host!.dns });
    // re-sync the form whenever the live configuration changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStatic(form);
    if (err) return setMsg({ text: err, ok: false });
    apply(setStatic(state.net, d.id, form), `${d.id}: static ${form.ip} ${form.mask} gw ${form.gateway || '—'}`, 'fix');
    setMsg({ text: 'Static configuration applied.', ok: true });
  };

  const dhcp = (renewOnly: boolean) => {
    const out = renewOnly ? renewLease(state.net, d.id) : enableDhcp(state.net, d.id);
    apply(out.state, `${d.id}: ${out.message}`, out.ok ? 'fix' : 'fault');
    setMsg({ text: out.message, ok: out.ok });
  };

  const field = (k: keyof typeof form, label: string) => (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      <input className="field" value={form[k]} spellCheck={false} inputMode="decimal" onChange={(e) => setForm({ ...form, [k]: e.target.value.trim() })} />
    </label>
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="label">IPv4 configuration</p>
        <span className="chip">{d.host!.mode === 'dhcp' ? 'DHCP' : 'Static'}</span>
      </div>
      <form onSubmit={submit} className="grid grid-cols-2 gap-2">
        {field('ip', 'Address')}
        {field('mask', 'Mask')}
        {field('gateway', 'Gateway')}
        {field('dns', 'DNS')}
        <div className="col-span-2 mt-1 flex flex-wrap gap-2">
          <button type="submit" className="btn-primary py-1.5">Apply static</button>
          {d.host!.mode === 'dhcp' ? (
            <button type="button" className="btn py-1.5" onClick={() => dhcp(true)}>
              Renew lease
            </button>
          ) : (
            <button type="button" className="btn py-1.5" onClick={() => dhcp(false)}>
              Use DHCP
            </button>
          )}
        </div>
      </form>
      {msg && <p className={`mt-2 font-mono text-[11px] ${msg.ok ? 'text-signal' : 'text-alarm'}`}>{msg.text}</p>}
    </div>
  );
}

function LinkInspector({ id }: { id: LinkId }) {
  const { state, apply } = useLab();
  const link = state.net.links[id];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-medium uppercase tracking-wide text-paper">Link {id}</p>
          <p className="label mt-0.5">{link.medium}</p>
        </div>
        <button
          type="button"
          className={link.up ? 'btn' : 'btn-primary'}
          onClick={() => apply(setLinkUp(state.net, id, !link.up), `Link ${id} ${link.up ? 'disconnected' : 'reconnected'}`, link.up ? 'fault' : 'fix')}
        >
          <Led tone={link.up ? 'ok' : 'err'} />
          {link.up ? 'Disconnect' : 'Reconnect'}
        </button>
      </div>
      <Row k="Carrier" v={link.up ? 'Link active' : 'Link dropped'} tone={link.up ? undefined : 'err'} />
      <label className="block">
        <span className="label flex justify-between">
          <span>One-way latency</span>
          <span className="text-paper">{link.latencyMs.toFixed(1)} ms</span>
        </span>
        <input
          type="range"
          min={0.1}
          max={200}
          step={0.1}
          value={link.latencyMs}
          onChange={(e) => apply(setLinkQuality(state.net, id, Number(e.target.value), link.lossPct))}
          className="mt-2 w-full accent-[#5fae8a]"
        />
      </label>
      <label className="block">
        <span className="label flex justify-between">
          <span>Frame loss</span>
          <span className="text-paper">{link.lossPct}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={80}
          step={1}
          value={link.lossPct}
          onChange={(e) => apply(setLinkQuality(state.net, id, link.latencyMs, Number(e.target.value)))}
          className="mt-2 w-full accent-[#5fae8a]"
        />
      </label>
      <button type="button" className="btn w-full" onClick={() => apply(restoreLinkQuality(state.net, id), `Link ${id} quality restored`, 'fix')}>
        Restore nominal latency and loss
      </button>
    </div>
  );
}
