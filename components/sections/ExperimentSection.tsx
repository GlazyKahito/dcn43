import { Reveal, Section } from '@/components/chrome/Section';

const SPEC: { k: string; v: React.ReactNode }[] = [
  {
    k: 'Objective',
    v: 'Diagnose and resolve faults in a routed network using host-based utilities, and verify end-to-end connectivity after each repair.',
  },
  {
    k: 'Scope',
    v: (
      <>
        One LAN (192.168.1.0/24) with two workstations behind an access switch; a gateway router providing DHCP; a /30 transit link to a stateful firewall; a DMZ server (172.16.0.10) running DNS and HTTP. Faults cover layers 1–7: cabling, device failure, addressing, gateway, DHCP, DNS, filtering, loss, latency and address conflicts.
      </>
    ),
  },
  {
    k: 'Tools',
    v: (
      <span className="flex flex-wrap gap-1.5">
        {['ping', 'tracert', 'traceroute', 'ipconfig', 'ifconfig', 'nslookup', 'arp', 'netstat', 'curl'].map((t) => (
          <span key={t} className="chip text-paper">
            {t}
          </span>
        ))}
      </span>
    ),
  },
  {
    k: 'Modules',
    v: 'Network troubleshooting overview · Aim · Theory (16 reference cards) · Simulator · Diagnostics console (10 scenarios) · Assessments (24 questions) · Mini-game · Conclusion.',
  },
  {
    k: 'Learning outcomes',
    v: 'Map symptoms to layers; read diagnostic output correctly; isolate the faulty device or setting; repair it; prove recovery with objective re-tests.',
  },
];

export function ExperimentSection() {
  return (
    <Section
      id="experiment"
      no="08"
      kicker="Experiment 10 · Specification"
      title={
        <>
          Experiment 10
          <br />
          <span className="text-silver">Network troubleshooting &amp; simulator</span>
        </>
      }
    >
      <Reveal>
        <div className="panel overflow-hidden">
          <div className="grid border-b border-hair sm:grid-cols-3">
            {[
              ['Institution', 'K J Somaiya School of Engineering'],
              ['Platform', 'Somaiya Virtual Labs'],
              ['Experiment', 'No. 10 · Computer Networks'],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-hair px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <p className="label">{k}</p>
                <p className="mt-1 text-[14px] text-paper">{v}</p>
              </div>
            ))}
          </div>
          <dl className="divide-y divide-hair">
            {SPEC.map((s, i) => (
              <div key={s.k} className="grid gap-2 px-5 py-5 sm:grid-cols-[48px_200px_1fr] sm:gap-6">
                <span className="font-mono text-[11px] text-dim">§{i + 1}</span>
                <dt className="font-display text-[17px] uppercase tracking-wide text-paper">{s.k}</dt>
                <dd className="text-[14.5px] leading-relaxed text-muted">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </Section>
  );
}
