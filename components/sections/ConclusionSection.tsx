'use client';

import { Reveal, Section } from '@/components/chrome/Section';
import { useSite } from '@/components/experience/Site';

const FINDINGS = [
  { k: 'Troubleshooting', v: 'One complaint, many causes. Only tests tell them apart.' },
  { k: 'Simulation', v: 'One change shows up in every tool at once.' },
  { k: 'Diagnosis', v: 'Who sends the error shows where the fault is.' },
  { k: 'Packet flow', v: 'MACs change per hop; IPs stay; TTL drops 64 → 62.' },
  { k: 'Verification', v: 'Some fixes change the network but not the result.' },
  { k: 'Method', v: 'Bottom-up takes the fewest probes.' },
];

export function ConclusionSection() {
  const { goTo } = useSite();
  return (
    <Section
      id="conclusion"
      no="05"
      kicker="Conclusion"
      title={
        <>
          Laboratory findings
          <br />
          <span className="text-silver">&amp; synthesis</span>
        </>
      }
      lede="Faults are found by evidence and proven fixed by re-testing."
    >
      <div className="grid gap-px border border-hair bg-hair md:grid-cols-2 xl:grid-cols-3">
        {FINDINGS.map((f, i) => (
          <Reveal key={f.k} delay={i * 0.04} className="bg-graphite">
            <div className="h-full p-6">
              <p className="font-mono text-[11px] text-signal">F.{i + 1}</p>
              <p className="mt-2 font-display text-xl uppercase tracking-tight text-paper">{f.k}</p>
              <p className="mt-1.5 text-[14px] leading-snug text-muted">{f.v}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.08}>
        <div className="panel mt-10 overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hair px-5 py-3">
            <p className="font-display text-lg font-bold uppercase tracking-tight text-paper">Experiment 8 · Summary</p>
            <p className="label">K J Somaiya School of Engineering · Somaiya Virtual Labs</p>
          </div>
          <dl className="grid gap-px bg-hair sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Objective', 'Find, fix and verify network faults with standard tools.'],
              ['Scope', 'LAN, gateway router, firewall, DNS/HTTP server.'],
              ['Tools', 'ping · tracert · traceroute · ipconfig · ifconfig · nslookup · arp · netstat · curl'],
              ['Modules', 'Theory · Simulation · Mini-game · Test · Conclusion'],
            ].map(([k, v]) => (
              <div key={k} className="bg-graphite px-5 py-4">
                <dt className="label">{k}</dt>
                <dd className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-hair pt-8 sm:flex-row sm:items-center">
          <p className="font-display text-2xl uppercase tracking-tight text-paper sm:text-3xl">Back to the lab</p>
          <button type="button" className="btn-primary px-5 py-3" onClick={() => goTo('simulator')}>
            Launch Lab
          </button>
        </div>
      </Reveal>
    </Section>
  );
}
