'use client';

import { Reveal, Section } from '@/components/chrome/Section';
import { useSite } from '@/components/experience/Site';

const FINDINGS = [
  {
    k: 'Troubleshooting',
    v: 'Most user complaints are vague; the same “no internet” report was produced by a cut uplink, a failed router and a wrong gateway. Only measurements separate them.',
  },
  {
    k: 'Simulation',
    v: 'Because every tool reads the same network state, a single change — one cable, one service, one firewall rule — produced consistent symptoms across ping, tracert, nslookup and telemetry.',
  },
  {
    k: 'Diagnosis',
    v: 'The source of an error message locates the fault: “Destination host unreachable” from PC1 itself points to the local segment; “Destination net unreachable” from 192.168.1.1 points to R1’s routing.',
  },
  {
    k: 'Packet flow',
    v: 'Frames are rebuilt at every router while IP addresses stay fixed; TTL falls from 64 to 62 across R1 and FW1, which is how tracert discovers each hop.',
  },
  {
    k: 'Connectivity verification',
    v: 'A repair was accepted only after gateway, server, DNS and HTTP checks all passed. Several plausible repairs changed the network yet left it broken.',
  },
  {
    k: 'Systematic troubleshooting',
    v: 'Working bottom-up — carrier, addressing, gateway, path, service — reached the root cause in fewer probes than testing the application first.',
  },
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
      lede="Network faults are located by evidence, not intuition. A layered method, applied with a small set of utilities, isolates the failed segment, and only an end-to-end re-test confirms that it has been repaired."
    >
      <div className="grid gap-px border border-hair bg-hair md:grid-cols-2 xl:grid-cols-3">
        {FINDINGS.map((f, i) => (
          <Reveal key={f.k} delay={i * 0.04} className="bg-graphite">
            <div className="h-full p-6">
              <p className="font-mono text-[11px] text-signal">F.{i + 1}</p>
              <p className="mt-2 font-display text-xl uppercase tracking-wide text-paper">{f.k}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{f.v}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.08}>
        <div className="panel mt-10 overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hair px-5 py-3">
            <p className="font-display text-lg font-medium uppercase tracking-wide text-paper">Experiment 8 · Summary</p>
            <p className="label">K J Somaiya School of Engineering · Somaiya Virtual Labs</p>
          </div>
          <dl className="grid gap-px bg-hair sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Objective', 'Diagnose and resolve faults in a routed network with host-based utilities, and verify end-to-end connectivity after each repair.'],
              ['Scope', 'A /24 LAN with two workstations and a switch, a gateway router with DHCP, a /30 transit link, a stateful firewall and a DNS/HTTP server.'],
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
          <p className="font-display text-2xl uppercase tracking-wide text-paper sm:text-3xl">Launch lab → enter interactive network environment</p>
          <button type="button" className="btn-primary px-5 py-3" onClick={() => goTo('simulator')}>
            Launch Lab
          </button>
        </div>
      </Reveal>
    </Section>
  );
}
