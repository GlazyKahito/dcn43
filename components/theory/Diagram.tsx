import type { Diagram as D } from '@/data/theory';
import { intToIp, ipToInt } from '@/lib/sim/ip';

export function Diagram({ d }: { d: D }) {
  switch (d.type) {
    case 'stack':
      return (
        <ol className="border border-hair">
          {d.layers.map((l, i) => (
            <li key={l.label} className="grid grid-cols-[28px_1fr] gap-x-3 border-b border-hair px-3 py-2 last:border-0 sm:grid-cols-[28px_150px_1fr_120px]">
              <span className="font-mono text-[11px] text-dim">{d.layers.length - i}</span>
              <span className="font-display text-[14px] uppercase tracking-wide text-paper">{l.label}</span>
              <span className="col-start-2 text-[12.5px] text-muted sm:col-start-auto">
                {l.detail}
                {l.tools && <span className="block font-mono text-[10.5px] text-dim">{l.tools}</span>}
              </span>
              {l.pdu && <span className="col-start-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-silver sm:col-start-auto sm:text-right">{l.pdu}</span>}
            </li>
          ))}
        </ol>
      );
    case 'sequence': {
      const cols = d.actors.length;
      return (
        <div className="thin-scroll overflow-x-auto" data-lenis-prevent>
          <div className="relative min-w-[420px] border border-hair px-2 py-3" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {d.actors.map((a, i) => (
              <div key={a} className="relative text-center" style={{ gridColumn: i + 1, gridRow: 1 }}>
                <span className="inline-block border border-hair-strong bg-gunmetal px-2 py-1 font-mono text-[11px] text-paper">{a}</span>
              </div>
            ))}
            {d.actors.map((a, i) => (
              <div key={`life-${a}`} aria-hidden className="pointer-events-none flex justify-center" style={{ gridColumn: i + 1, gridRow: `2 / span ${d.messages.length}` }}>
                <span className="w-px bg-hair-strong" />
              </div>
            ))}
            {d.messages.map((m, i) => {
              const lo = Math.min(m.from, m.to);
              const hi = Math.max(m.from, m.to);
              const rtl = m.to < m.from;
              const inset = `${50 / (hi - lo + 1)}%`;
              return (
                <div key={i} className="relative pt-5" style={{ gridColumn: `${lo + 1} / ${hi + 2}`, gridRow: i + 2 }}>
                  <p className="absolute inset-x-0 top-1 truncate px-4 text-center font-mono text-[10.5px] text-muted" title={m.label}>
                    {m.label}
                  </p>
                  <div className="relative h-px bg-silver/70" style={{ marginLeft: inset, marginRight: inset }}>
                    <span
                      className={`absolute top-1/2 h-0 w-0 -translate-y-1/2 border-y-[4px] border-y-transparent ${rtl ? 'left-0 border-r-[7px] border-r-silver' : 'right-0 border-l-[7px] border-l-silver'}`}
                    />
                  </div>
                  {m.note && <p className="mt-1 text-center font-mono text-[9.5px] uppercase tracking-[0.1em] text-dim">{m.note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    case 'bits': {
      const n = ipToInt(d.ip);
      const mask = d.prefix === 0 ? 0 : (~0 << (32 - d.prefix)) >>> 0;
      const network = intToIp((n & mask) >>> 0);
      const broadcast = intToIp((n | (~mask >>> 0)) >>> 0);
      const hosts = d.prefix >= 31 ? 0 : 2 ** (32 - d.prefix) - 2;
      const bits = n.toString(2).padStart(32, '0');
      return (
        <div className="space-y-3 border border-hair p-3">
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((o) => (
              <div key={o} className="flex gap-px">
                {bits
                  .slice(o * 8, o * 8 + 8)
                  .split('')
                  .map((b, i) => {
                    const net = o * 8 + i < d.prefix;
                    return (
                      <span key={i} className={`grid h-7 w-[18px] place-items-center font-mono text-[12px] ${net ? 'bg-signal-soft text-signal' : 'bg-steel/60 text-muted'}`}>
                        {b}
                      </span>
                    );
                  })}
              </div>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11.5px] sm:grid-cols-4">
            {[
              ['Address', `${d.ip}/${d.prefix}`],
              ['Network', network],
              ['Broadcast', broadcast],
              ['Usable hosts', String(hosts)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-dim">{k}</dt>
                <dd className="text-paper">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="font-mono text-[10.5px] text-dim">
            <span className="text-signal">■</span> network bits ({d.prefix}) · <span className="text-muted">■</span> host bits ({32 - d.prefix})
          </p>
        </div>
      );
    }
    case 'flow':
      return (
        <ol className="grid gap-px border border-hair bg-hair sm:grid-cols-2 xl:grid-cols-4">
          {d.steps.map((s, i) => (
            <li key={s.label} className="bg-graphite p-3">
              <p className="font-mono text-[10px] text-signal">{String(i + 1).padStart(2, '0')} →</p>
              <p className="mt-1 font-display text-[14px] uppercase tracking-wide text-paper">{s.label}</p>
              <p className="mt-1 text-[12px] leading-snug text-muted">{s.detail}</p>
            </li>
          ))}
        </ol>
      );
    case 'compare':
      return (
        <Table
          head={['', d.columns[0], d.columns[1]]}
          rows={d.rows.map((r) => [r.label, r.a, r.b])}
        />
      );
    case 'table':
      return <Table head={d.head} rows={d.rows} />;
  }
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="thin-scroll overflow-x-auto border border-hair" data-lenis-prevent>
      <table className="w-full min-w-[420px] border-collapse text-left">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className="border-b border-hair bg-gunmetal px-3 py-2 font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-dim">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-hair last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-1.5 align-top text-[12.5px] ${j === 0 ? 'font-mono text-[11.5px] text-paper' : 'text-muted'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
