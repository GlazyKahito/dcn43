'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Led, type LedTone } from '@/components/chrome/Led';
import { OutputLines } from '@/components/network/Terminal';
import type { Repair, World } from '@/lib/game/actions';
import { CABLES, RUN_LABEL, type StationId } from '@/lib/game/world';
import { CAUSE_LABEL, type CauseId, type Difficulty, type VerifyKey } from '@/lib/game/incidents';
import { VERIFY_LABEL } from '@/lib/game/actions';
import { validateStatic } from '@/lib/sim/actions';
import { runCommand } from '@/lib/sim/commands';
import { createRng, probe, routeLookup } from '@/lib/sim/engine';
import { assessHealth } from '@/lib/sim/health';
import { isApipa, prefixToMask } from '@/lib/sim/ip';
import { createBaseline } from '@/lib/sim/topology';
import type { DeviceId, LinkId, OutLine } from '@/lib/sim/types';

export interface Evidence {
  id: number;
  source: string;
  text: string;
  tone: 'ok' | 'warn' | 'err';
}

export interface PanelApi {
  world: World;
  difficulty: Difficulty;
  /** Runs a terminal command on a host; logs evidence and counts it as a diagnostic action. */
  run: (cmd: string, host?: DeviceId) => OutLine[];
  /** Counts a diagnostic action and records its finding. */
  observe: (source: string, text: string, tone: Evidence['tone']) => void;
  repair: (r: Repair, label: string) => void;
  renew: (pc: DeviceId) => string;
  evidence: Evidence[];
  suspects: CauseId[];
  faultsToFind: number;
  diagnosis: { correct: boolean; wrong: CauseId[] };
  fileDiagnosis: (picked: CauseId[]) => void;
  verify: { required: VerifyKey[]; done: VerifyKey[]; repaired: boolean };
  httpAttempts: number;
  termLines: OutLine[];
  setTermLines: (fn: (l: OutLine[]) => OutLine[]) => void;
}

const BASE_RULES = new Set(createBaseline().firewall.map((r) => r.id));

function Row({ k, v, tone }: { k: string; v: ReactNode; tone?: 'err' | 'warn' | 'ok' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hair py-1.5 font-mono text-[11.5px] last:border-0">
      <span className="text-dim">{k}</span>
      <span className={tone === 'err' ? 'text-alarm' : tone === 'warn' ? 'text-amber' : tone === 'ok' ? 'text-signal' : 'text-paper'}>{v}</span>
    </div>
  );
}

function Out({ lines }: { lines: OutLine[] }) {
  if (!lines.length) return null;
  return (
    <div data-lenis-prevent className="scanlines thin-scroll mt-3 max-h-[240px] overflow-y-auto rounded-[2px] border border-hair bg-[#07090a] px-3 py-2 font-mono text-[11px] leading-[1.45]">
      <OutputLines lines={lines} />
    </div>
  );
}

function Btn({ children, onClick, danger, primary, disabled }: { children: ReactNode; onClick: () => void; danger?: boolean; primary?: boolean; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${primary ? 'btn-primary' : 'btn'} py-1.5 ${danger ? 'hover:border-alarm/60 hover:text-alarm' : ''}`}>
      {children}
    </button>
  );
}

export function StationPanel({ id, api }: { id: StationId; api: PanelApi }) {
  switch (id) {
    case 'pc1':
      return <PcPanel pc="PC1" api={api} />;
    case 'pc2':
      return <PcPanel pc="PC2" api={api} />;
    case 'switch':
      return <SwitchPanel api={api} />;
    case 'router':
      return <RouterPanel api={api} />;
    case 'firewall':
      return <FirewallPanel api={api} />;
    case 'server':
      return <ServerPanel api={api} />;
    case 'patch':
      return <PatchPanelStation api={api} />;
    case 'monitor':
      return <MonitorPanel api={api} />;
    case 'terminal':
      return <TerminalPanel api={api} />;
    case 'console':
      return <ConsolePanel api={api} />;
  }
}

export const PANEL_TITLE: Record<StationId, [string, string]> = {
  pc1: ['PC-01', 'Workstation'],
  pc2: ['PC-02', 'Workstation'],
  switch: ['Switch SW-01', 'Layer 2 access'],
  router: ['Router R1', 'Gateway · DHCP server'],
  firewall: ['Firewall FW1', 'Stateful packet filter'],
  server: ['SERVER-01', 'DNS · HTTP'],
  patch: ['Patch panel', 'Cable runs 01–05'],
  monitor: ['Network monitor', 'Telemetry from PC-01'],
  terminal: ['Virtual terminal', 'Channel 01'],
  console: ['Control console', 'Case file · diagnosis'],
};

function PcPanel({ pc, api }: { pc: DeviceId; api: PanelApi }) {
  const net = api.world.net;
  const d = net.devices[pc];
  const iface = d.interfaces[0];
  const [out, setOut] = useState<OutLine[]>([]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ ip: iface.ip, mask: prefixToMask(iface.prefix), gateway: d.host!.gateway, dns: d.host!.dns });
  const [err, setErr] = useState('');

  const gw = probe(net, pc, d.host?.gateway || '192.168.1.1');
  const carrier = net.links[iface.link].up;
  let status: [string, LedTone] = ['Connected', 'ok'];
  if (!carrier) status = ['⚠ Network cable unplugged', 'err'];
  else if (isApipa(iface.ip)) status = ['⚠ Limited connectivity', 'warn'];
  else if (!gw.ok) status = ['⚠ Connection lost', 'err'];
  else if (gw.loss > 0) status = ['⚠ Connection unstable', 'warn'];

  return (
    <div>
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-paper">
        <Led tone={status[1]} /> {status[0]}
      </p>
      <div className="mt-3">
        <Row k="IP address" v={iface.ip} />
        <Row k="Subnet mask" v={prefixToMask(iface.prefix)} />
        <Row k="Default gateway" v={d.host!.gateway || '—'} />
        <Row k="DNS server" v={d.host!.dns || '—'} />
        <Row k="Addressing" v={d.host!.mode === 'dhcp' ? 'DHCP' : 'Static'} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn onClick={() => setOut(api.run(`ping ${d.host?.gateway || '192.168.1.1'}`, pc))}>Ping gateway</Btn>
        <Btn onClick={() => setOut(api.run('ipconfig /all', pc))}>View configuration</Btn>
        {d.host!.mode === 'dhcp' && (
          <Btn
            onClick={() => {
              const msg = api.renew(pc);
              setOut([{ text: `${pc}> ipconfig /renew`, tone: 'cmd' }, { text: msg, tone: msg.startsWith('Lease') ? 'ok' : 'err' }]);
            }}
          >
            Renew lease
          </Btn>
        )}
        <Btn onClick={() => setEdit((e) => !e)}>{edit ? 'Cancel edit' : 'Edit configuration'}</Btn>
      </div>
      {edit && (
        <form
          className="mt-3 grid grid-cols-2 gap-2 rounded-[2px] border border-hair p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const v = validateStatic(form);
            if (v) return setErr(v);
            setErr('');
            api.repair({ kind: 'pc-static', pc, cfg: form }, `${pc}: static ${form.ip} ${form.mask} gw ${form.gateway}`);
            setEdit(false);
          }}
        >
          {(['ip', 'mask', 'gateway', 'dns'] as const).map((k) => (
            <label key={k} className="block">
              <span className="label mb-1 block">{k === 'ip' ? 'Address' : k}</span>
              <input className="field" value={form[k]} spellCheck={false} onChange={(e) => setForm({ ...form, [k]: e.target.value.trim() })} />
            </label>
          ))}
          <div className="col-span-2 flex flex-wrap gap-2">
            <button type="submit" className="btn-primary py-1.5">
              Apply static
            </button>
            <Btn
              onClick={() => {
                api.repair({ kind: 'pc-dhcp', pc }, `${pc}: switched to DHCP`);
                setEdit(false);
              }}
            >
              Use DHCP
            </Btn>
          </div>
          {err && <p className="col-span-2 font-mono text-[11px] text-alarm">{err}</p>}
        </form>
      )}
      <Out lines={out} />
    </div>
  );
}

function SwitchPanel({ api }: { api: PanelApi }) {
  const net = api.world.net;
  const [out, setOut] = useState<OutLine[]>([]);
  const ports: { port: string; link: LinkId; to: string }[] = [
    { port: 'Fa0/1', link: 'PC1-SW1', to: 'PC-01' },
    { port: 'Fa0/2', link: 'PC2-SW1', to: 'PC-02' },
    { port: 'Gi0/24', link: 'SW1-R1', to: 'R1 uplink' },
  ];
  const state = (link: LinkId) => {
    const l = net.links[link];
    const far = net.devices[l.a === 'SW1' ? l.b : l.a];
    return l.up && far.powered;
  };
  return (
    <div>
      <p className="label mb-1.5">Port status</p>
      {ports.map((p) => (
        <Row key={p.port} k={`${p.port} · ${p.to}`} v={state(p.link) ? 'Active' : 'Down'} tone={state(p.link) ? undefined : 'err'} />
      ))}
      <Row k="Fa0/3–23" v="Not connected" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn
          onClick={() => {
            const lines: OutLine[] = [{ text: 'SW-01# show interfaces counters errors', tone: 'cmd' }, { text: 'Port      Align-Err   FCS-Err   Rcv-Err', tone: 'dim' }];
            ports.forEach((p) => {
              const loss = net.links[p.link].lossPct;
              const fcs = loss ? 1800 + Math.round(loss * 41) : 0;
              lines.push({ text: `${p.port.padEnd(10)}${String(loss ? 12 : 0).padStart(9)}${String(fcs).padStart(10)}${String(fcs ? fcs + 12 : 0).padStart(10)}`, tone: fcs ? 'warn' : 'out' });
            });
            setOut(lines);
            const bad = ports.find((p) => net.links[p.link].lossPct > 0);
            api.observe('SW-01', bad ? `${bad.port} FCS errors climbing` : 'No interface errors', bad ? 'warn' : 'ok');
          }}
        >
          Error counters
        </Btn>
        <Btn
          onClick={() => {
            const lines: OutLine[] = [{ text: 'SW-01# show mac address-table', tone: 'cmd' }, { text: 'Vlan  Mac Address       Type      Port', tone: 'dim' }];
            ports.forEach((p) => {
              if (!state(p.link)) return;
              const dev = net.devices[net.links[p.link].a === 'SW1' ? net.links[p.link].b : net.links[p.link].a];
              lines.push({ text: `  1   ${dev.interfaces[0].mac.toLowerCase().padEnd(18)}DYNAMIC   ${p.port}`, tone: 'out' });
            });
            setOut(lines);
            api.observe('SW-01', `${lines.length - 2} MAC addresses learned`, 'ok');
          }}
        >
          MAC table
        </Btn>
      </div>
      <Out lines={out} />
    </div>
  );
}

function RouterPanel({ api }: { api: PanelApi }) {
  const { net, meta } = api.world;
  const r1 = net.devices.R1;
  const [out, setOut] = useState<OutLine[]>([]);
  const ifs = r1.interfaces.map((i) => {
    const admin = meta.adminDown.includes(i.link);
    const up = net.links[i.link].up;
    return { name: i.name === 'Gi0/0' ? 'G0/0' : 'G0/1', ip: i.ip, link: i.link, status: admin ? 'Administratively down' : up ? 'Up / up' : 'Down / down', ok: up };
  });
  const degraded = ifs.some((i) => !i.ok) || !r1.services.dhcp;
  return (
    <div>
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-paper">
        <Led tone={degraded ? 'warn' : 'ok'} /> {r1.powered ? (degraded ? 'Online · degraded' : 'Online') : 'Offline'}
      </p>
      <p className="label mb-1.5 mt-3">Interfaces</p>
      {ifs.map((i) => (
        <Row key={i.name} k={`${i.name}  ${i.ip}`} v={i.status} tone={i.ok ? undefined : 'err'} />
      ))}
      <Row k="DHCP service" v={r1.services.dhcp ? 'Running' : 'Stopped'} tone={r1.services.dhcp ? undefined : 'err'} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn
          onClick={() => {
            const lines: OutLine[] = [{ text: 'R1# show ip route', tone: 'cmd' }, { text: 'Codes: C - connected, S - static', tone: 'dim' }, { text: '', tone: 'out' }];
            for (const i of r1.interfaces) if (net.links[i.link].up) lines.push({ text: `C    ${i.ip.replace(/\d+$/, '0')}/${i.prefix} is directly connected, ${i.name}`, tone: 'out' });
            for (const r of r1.routes) {
              const reachable = !!routeLookup(net, r1, r.via);
              if (reachable) lines.push({ text: `S${r.prefix === 0 ? '*' : ' '}   ${r.network}/${r.prefix} [1/0] via ${r.via}`, tone: 'out' });
            }
            if (lines.length === 3) lines.push({ text: '(no routes)', tone: 'err' });
            setOut(lines);
            const missing = r1.routes.filter((r) => !routeLookup(net, r1, r.via)).length;
            api.observe('R1', missing ? 'Routes via 10.0.0.2 absent from the table' : 'Routing table complete', missing ? 'err' : 'ok');
          }}
        >
          View routing table
        </Btn>
        {ifs
          .filter((i) => !i.ok)
          .map((i) => (
            <Btn key={i.name} onClick={() => api.repair({ kind: 'enable-interface', link: i.link }, `R1: no shutdown ${i.name}`)}>
              Enable interface {i.name}
            </Btn>
          ))}
        {!r1.services.dhcp && (
          <Btn onClick={() => api.repair({ kind: 'start-dhcp' }, 'R1: service dhcp')}>Start DHCP service</Btn>
        )}
        <Btn danger onClick={() => api.repair({ kind: 'restart-router' }, 'R1: reload')}>
          Restart router
        </Btn>
      </div>
      <Out lines={out} />
    </div>
  );
}

function FirewallPanel({ api }: { api: PanelApi }) {
  const net = api.world.net;
  const hits = (id: number) => (id === 5 ? 38 + api.httpAttempts * 3 : id === 10 ? 4120 : id === 20 ? 2210 : id === 30 ? (net.firewall.some((r) => r.id === 5) ? 1403 : 1403 + api.httpAttempts) : 88);
  return (
    <div>
      <p className="label mb-1.5">Access list OUTSIDE → DMZ · first match wins</p>
      <div className="space-y-1">
        {net.firewall.map((r) => (
          <div key={r.id} className="flex items-center gap-2 border-b border-hair py-1.5 font-mono text-[11px] text-paper last:border-0">
            <span className="w-5 text-dim">{r.id}</span>
            <span className="flex-1">
              {r.action} {r.proto} {r.src} → {r.dst}
              {r.port ? ` eq ${r.port}` : ''}
              <span className="block text-[10px] text-dim">
                {r.remark} · hits {hits(r.id)}
              </span>
            </span>
            <Btn danger onClick={() => api.repair({ kind: 'fw-delete', rule: r.id }, `FW1: no access-list rule ${r.id}`)}>
              Delete
            </Btn>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn onClick={() => api.repair({ kind: 'fw-restore' }, 'FW1: restore approved policy')}>Restore approved policy</Btn>
        <Btn onClick={() => api.observe('FW1', `${net.firewall.length} rules; ${net.firewall.filter((r) => !BASE_RULES.has(r.id)).length} not in the approved policy`, net.firewall.some((r) => !BASE_RULES.has(r.id)) ? 'warn' : 'ok')}>
          Compare with approved policy
        </Btn>
      </div>
    </div>
  );
}

function ServerPanel({ api }: { api: PanelApi }) {
  const net = api.world.net;
  const s = net.devices.SRV1;
  const [out, setOut] = useState<OutLine[]>([]);
  const nic = net.links['FW1-SRV1'].up;
  return (
    <div>
      <p className="label mb-1.5">Services</p>
      <Row k="HTTP · nginx · tcp/80" v={s.services.http ? 'Online' : 'Offline'} tone={s.services.http ? undefined : 'err'} />
      <Row k="DNS · named · udp/53" v={s.services.dns ? 'Online' : 'Offline'} tone={s.services.dns ? undefined : 'err'} />
      <Row k="eth0 · 172.16.0.10/24" v={nic ? 'Link up' : 'No carrier'} tone={nic ? undefined : 'err'} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn
          onClick={() => {
            const lines: OutLine[] = [{ text: 'srv01$ journalctl -n 4 --no-pager', tone: 'cmd' }];
            if (!s.services.dns) lines.push({ text: 'named.service: Main process exited, code=killed, status=9/KILL', tone: 'err' }, { text: 'named.service: Failed with result \'signal\'.', tone: 'err' });
            else lines.push({ text: 'named[812]: running', tone: 'out' });
            if (!nic) lines.push({ text: 'kernel: e1000e: eth0 NIC Link is Down', tone: 'err' });
            lines.push({ text: `nginx[640]: ${s.services.http ? 'worker processes started' : 'stopped'}`, tone: 'out' });
            setOut(lines);
            api.observe('SERVER-01', !s.services.dns ? 'named was killed and is not running' : !nic ? 'eth0 reports link down' : 'Service log clean', !s.services.dns || !nic ? 'err' : 'ok');
          }}
        >
          View service log
        </Btn>
        <Btn onClick={() => api.repair({ kind: 'restart-dns' }, 'SERVER-01: systemctl restart named')}>Restart DNS service</Btn>
        <Btn onClick={() => api.repair({ kind: 'restart-http' }, 'SERVER-01: systemctl restart nginx')}>Restart HTTP service</Btn>
      </div>
      <Out lines={out} />
    </div>
  );
}

function PatchPanelStation({ api }: { api: PanelApi }) {
  const { net, meta } = api.world;
  const [tests, setTests] = useState<Partial<Record<LinkId, string>>>({});
  const test = (link: LinkId) => {
    const l = net.links[link];
    let r = 'OK · 3.1 m · pairs 1–4 good';
    if (l.lossPct > 0) r = 'HIGH ERROR RATE · pair 2 damaged';
    else if (!l.up && !meta.adminDown.includes(link)) r = 'OPEN · fault at 2.4 m';
    setTests((t) => ({ ...t, [link]: r }));
    api.observe('Patch panel', `Run ${CABLES.find((c) => c.link === link)!.run} cable test: ${r}`, r.startsWith('OK') ? 'ok' : 'err');
  };
  return (
    <div className="space-y-2">
      {CABLES.map((c) => {
        const l = net.links[c.link];
        return (
          <div key={c.link} className="rounded-[2px] border border-hair p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-paper">
                <span className="text-dim">RUN {c.run}</span> · {RUN_LABEL[c.link]}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted">
                <Led tone={l.up ? 'ok' : 'off'} /> Link
              </span>
            </div>
            {tests[c.link] && <p className={`mt-1 font-mono text-[10.5px] ${tests[c.link]!.startsWith('OK') ? 'text-signal' : 'text-alarm'}`}>{tests[c.link]}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Btn onClick={() => test(c.link)}>Cable test</Btn>
              <Btn onClick={() => api.repair({ kind: 'reseat', link: c.link }, `Reseat run ${c.run}`)}>Reseat</Btn>
              <Btn onClick={() => api.repair({ kind: 'replace', link: c.link }, `Replace cable on run ${c.run}`)}>Replace cable</Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonitorPanel({ api }: { api: PanelApi }) {
  const h = useMemo(() => assessHealth(api.world.net), [api.world.net]);
  const httpOk = h.http.ok && h.http.service === 'open';
  return (
    <div>
      <p className="label mb-1.5">Network telemetry</p>
      <Row k="Packet loss" v={`${h.lossPct}%`} tone={h.lossPct ? (h.lossPct === 100 ? 'err' : 'warn') : undefined} />
      <Row k="Latency" v={h.latencyMs === null ? '---' : `${h.latencyMs < 1 ? '<1' : Math.round(h.latencyMs)} ms`} tone={h.latencyMs === null ? 'err' : undefined} />
      <Row k="Gateway" v={h.gateway.ok ? (h.gateway.loss ? 'Unstable' : 'Reachable') : 'Unreachable'} tone={h.gateway.ok ? (h.gateway.loss ? 'warn' : undefined) : 'err'} />
      <Row k="DNS" v={h.dns.ok ? 'Resolving' : h.gateway.ok ? 'Failure' : 'Unknown'} tone={h.dns.ok ? undefined : 'err'} />
      <Row k="DHCP" v={{ bound: 'Lease bound', static: 'Static host', apipa: 'No lease (APIPA)', released: 'Released', 'service-down': 'Server not answering' }[h.dhcp]} tone={h.dhcp === 'bound' || h.dhcp === 'static' ? undefined : 'err'} />
      <Row k="Web service" v={httpOk ? 'Responding' : 'Not responding'} tone={httpOk ? undefined : 'err'} />
      <div className="mt-3">
        <Btn onClick={() => api.observe('Monitor', `Loss ${h.lossPct}%, gateway ${h.gateway.ok ? 'reachable' : 'unreachable'}, DNS ${h.dns.ok ? 'ok' : 'failing'}, web ${httpOk ? 'ok' : 'failing'}`, h.status === 'operational' ? 'ok' : 'warn')}>
          Log snapshot to case file
        </Btn>
      </div>
    </div>
  );
}

const QUICK = ['ping 192.168.1.1', 'ping 172.16.0.10', 'ping www.lab.local', 'tracert 172.16.0.10', 'nslookup www.lab.local', 'ipconfig /all', 'arp -a', 'netstat -an', 'curl http://www.lab.local'];

function TerminalPanel({ api }: { api: PanelApi }) {
  const [input, setInput] = useState('');
  const [host, setHost] = useState<DeviceId>('PC1');
  const submit = (cmd: string) => {
    const c = cmd.trim();
    if (!c) return;
    if (c === 'cls' || c === 'clear') {
      api.setTermLines(() => []);
      setInput('');
      return;
    }
    const lines = api.run(c, host);
    api.setTermLines((l) => [...l, { text: `${host}> ${c}`, tone: 'cmd' as const }, ...lines].slice(-300));
    setInput('');
  };
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="label">Host</span>
        {(['PC1', 'PC2'] as const).map((h) => (
          <button key={h} type="button" onClick={() => setHost(h)} className={`border border-hair px-2 py-0.5 font-mono text-[10.5px] ${host === h ? 'bg-steel text-paper' : 'text-dim'}`}>
            {h === 'PC1' ? 'PC-01' : 'PC-02'}
          </button>
        ))}
      </div>
      <div data-lenis-prevent className="scanlines thin-scroll h-[300px] overflow-y-auto rounded-[2px] border border-hair bg-[#07090a] px-3 py-2 font-mono text-[11.5px] leading-[1.45]">
        {api.termLines.length === 0 && <p className="text-dim">Commands run against the incident network. ping · tracert · traceroute · ipconfig · arp · nslookup · netstat · curl</p>}
        <OutputLines lines={api.termLines} />
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <span className="text-signal">{host}&gt;</span>
          <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} autoComplete="off" aria-label="Command" className="min-w-0 flex-1 bg-transparent text-paper caret-signal outline-none focus-visible:outline-none" />
        </form>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button key={q} type="button" className="chip hover:border-silver/40 hover:text-paper" onClick={() => submit(q)}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConsolePanel({ api }: { api: PanelApi }) {
  const [picked, setPicked] = useState<CauseId[]>([]);
  const need = api.faultsToFind;
  const toggle = (c: CauseId) =>
    setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : p.length >= need ? [...p.slice(1), c] : [...p, c]));
  return (
    <div className="space-y-5">
      <section>
        <p className="label mb-1.5">Evidence · {api.evidence.length}</p>
        {api.evidence.length === 0 ? (
          <p className="text-[12.5px] text-dim">Nothing logged yet. Inspect equipment and run diagnostics; findings are filed here automatically.</p>
        ) : (
          <ol data-lenis-prevent className="thin-scroll max-h-[180px] space-y-1 overflow-y-auto">
            {api.evidence.map((e) => (
              <li key={e.id} className="flex gap-2 font-mono text-[11px]">
                <Led tone={e.tone} className="mt-1" />
                <span className="w-20 shrink-0 text-dim">{e.source}</span>
                <span className="text-paper">{e.text}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <p className="label mb-1.5">Diagnosis {need > 1 ? `· select ${need} root causes` : '· select the root cause'}</p>
        {api.diagnosis.correct ? (
          <p className="font-mono text-[12px] text-signal">✓ Diagnosis accepted. Repair the fault, then verify connectivity.</p>
        ) : (
          <>
            <div className="space-y-1">
              {api.suspects.map((c) => {
                const wrong = api.diagnosis.wrong.includes(c);
                const on = picked.includes(c);
                return (
                  <label key={c} className={`flex cursor-pointer items-center gap-2.5 rounded-[2px] border px-2.5 py-1.5 text-[12.5px] ${on ? 'border-silver/50 text-paper' : 'border-hair text-muted'} ${wrong ? 'opacity-50' : ''}`}>
                    <input type={need > 1 ? 'checkbox' : 'radio'} name="cause" checked={on} onChange={() => toggle(c)} className="accent-[#5fae8a]" />
                    {CAUSE_LABEL[c]}
                  </label>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                className="btn-primary py-1.5"
                disabled={picked.length !== need}
                onClick={() => {
                  api.fileDiagnosis(picked);
                  setPicked([]);
                }}
              >
                File diagnosis
              </button>
              {api.diagnosis.wrong.length > 0 && <span className="font-mono text-[11px] text-alarm">Rejected: the evidence does not support that.</span>}
            </div>
          </>
        )}
      </section>

      <section>
        <p className="label mb-1.5">Verification</p>
        {!api.verify.repaired ? (
          <p className="text-[12.5px] text-dim">Checks count only once the network has been repaired.</p>
        ) : (
          <ul className="space-y-1">
            {api.verify.required.map((k) => (
              <li key={k} className={`flex items-center gap-2 font-mono text-[11.5px] ${api.verify.done.includes(k) ? 'text-signal' : 'text-muted'}`}>
                <Led tone={api.verify.done.includes(k) ? 'ok' : 'off'} /> {VERIFY_LABEL[k]}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Deterministic command runner for the game world (seeded, so repeated probes agree). */
export function runIn(world: World, cmd: string, host: DeviceId, seed: number) {
  return runCommand({ state: world.net, host, rng: createRng(seed) }, cmd);
}
