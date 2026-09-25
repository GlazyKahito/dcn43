import { Reveal, Section } from '@/components/chrome/Section';

const ITEMS = [
  {
    k: 'Project objective',
    v: 'To study how faults at each layer of a small routed network present to the end user, and to locate and correct them using standard host-based diagnostic utilities.',
  },
  {
    k: 'Troubleshooting methodology',
    v: 'A structured, layered approach: define the problem, gather symptoms, form hypotheses by layer, test with one tool at a time, isolate the root cause, repair, verify and record.',
  },
  {
    k: 'Simulation purpose',
    v: 'The simulator reproduces forwarding, ARP, routing, DHCP, DNS and firewall behaviour closely enough that tool output changes with the fault, without the cost or risk of breaking a physical network.',
  },
  {
    k: 'Fault diagnosis',
    v: 'Faults are diagnosed from evidence only: carrier state, addressing, gateway reachability, path tracing, name resolution and transport-layer state.',
  },
  {
    k: 'Connectivity verification',
    v: 'A repair is accepted only when end-to-end tests from the client succeed: gateway echo, server echo, DNS resolution and an HTTP response on TCP/80.',
  },
];

const OUTCOMES = [
  'Relate a reported symptom to the OSI layer most likely at fault.',
  'Interpret the output of ping, tracert, ipconfig, nslookup, arp and netstat.',
  'Distinguish link, addressing, routing, service and filtering faults from their evidence.',
  'Apply a corrective action and verify recovery with objective tests.',
  'Explain the packet path from PC1 to SRV1, including ARP resolution and TTL decrement at each router.',
];

export function AimSection() {
  return (
    <Section
      id="aim"
      no="02"
      kicker="Aim · Laboratory objective"
      title={
        <>
          Laboratory
          <br />
          objective
        </>
      }
      lede="To understand systematic network troubleshooting, use standard diagnostic utilities to isolate faults in a simulated topology, and verify connectivity after each repair."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <dl className="divide-y divide-hair border-y border-hair">
          {ITEMS.map((it, i) => (
            <Reveal key={it.k} delay={i * 0.04}>
              <div className="grid gap-2 py-5 sm:grid-cols-[48px_220px_1fr] sm:gap-6">
                <span className="font-mono text-[11px] text-dim">A.{i + 1}</span>
                <dt className="font-display text-[17px] uppercase tracking-wide text-paper">{it.k}</dt>
                <dd className="text-[14.5px] leading-relaxed text-muted">{it.v}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
        <Reveal delay={0.1}>
          <div className="panel p-6">
            <p className="label">Learning outcomes</p>
            <p className="mt-1 text-[13px] text-dim">On completing the experiment the student will be able to:</p>
            <ol className="mt-4 space-y-3">
              {OUTCOMES.map((o, i) => (
                <li key={o} className="grid grid-cols-[30px_1fr] text-[14px] leading-snug text-paper">
                  <span className="font-mono text-[11px] text-signal">LO{i + 1}</span>
                  {o}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
