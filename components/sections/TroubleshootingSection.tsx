'use client';

import { useMemo } from 'react';
import { Reveal, Section } from '@/components/chrome/Section';
import { Led, type LedTone } from '@/components/chrome/Led';
import { TopologyView } from '@/components/network/TopologyView';
import { useSite } from '@/components/experience/Site';
import { setLinkUp } from '@/lib/sim/actions';
import { detectFaults } from '@/lib/sim/faults';
import { assessHealth } from '@/lib/sim/health';
import { useLab } from '@/lib/sim/store';

const LOOP = [
  { k: 'Simulator', d: 'A five-node network: two workstations, a switch, a router, a firewall and a DNS/HTTP server.' },
  { k: 'Fault', d: 'Cut a cable, stop a service, mistype a gateway. Ten fault types change real simulation state.' },
  { k: 'Symptoms', d: 'Users report what they see: “the site won’t load”, “no internet”, “it keeps dropping”.' },
  { k: 'Diagnostic tools', d: 'ping, tracert, ipconfig, nslookup, arp and netstat run against the live network.' },
  { k: 'Root cause', d: 'Evidence narrows the fault to a layer, a device and a configuration item.' },
  { k: 'Fix', d: 'Reconnect, restart, readdress or remove the rule — the same controls a technician uses.' },
  { k: 'Re-test', d: 'The end-to-end checks are run again from PC1. Nothing is assumed fixed.' },
  { k: 'Network recovered', d: 'Gateway, path, name resolution and web service all pass.' },
];

export function TroubleshootingSection() {
  const { state, apply } = useLab();
  const { goTo } = useSite();
  const faults = useMemo(() => detectFaults(state.net), [state.net]);
  const health = useMemo(() => assessHealth(state.net), [state.net]);
  const broken = faults.length > 0;

  // Where the lab currently sits in the loop.
  const lit: LedTone[] = LOOP.map((_, i) => {
    if (i === 0) return 'ok';
    if (i === 1 || i === 2) return broken ? 'err' : 'off';
    if (i === 7) return !broken && health.status === 'operational' ? 'ok' : 'off';
    return 'off';
  });

  const tryIt = () => {
    apply(setLinkUp(state.net, 'SW1-R1', false), 'Fault injected: SW1–R1 cable disconnected', 'fault');
    goTo('simulator');
  };

  return (
    <Section
      id="troubleshooting"
      no="01"
      kicker="Network Troubleshooting · Overview"
      title={
        <>
          Enter the lab.
          <br />
          <span className="text-silver">Break the network.</span>
          <br />
          Prove the repair.
        </>
      }
      lede="This experiment is built around one loop. You inject a fault into a working network, read the symptoms, isolate the fault with standard diagnostic utilities, repair it and re-test until connectivity is verified end to end."
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <div className="panel p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="label">Live network · shared with every module</p>
              <span className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">
                <Led tone={health.status === 'operational' ? 'ok' : health.status === 'degraded' ? 'warn' : 'err'} />
                {health.status}
              </span>
            </div>
            <div className="grid-paper rounded-[2px] border border-hair bg-ink/40">
              <TopologyView net={state.net} flight={state.flight} label="Live laboratory topology" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={tryIt} disabled={!state.net.links['SW1-R1'].up}>
                Cut SW1–R1 and open the simulator
              </button>
              <button type="button" className="btn" onClick={() => goTo('diagnostics')}>
                Work a ticketed scenario
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5" delay={0.08}>
          <ol className="panel divide-y divide-hair">
            {LOOP.map((s, i) => (
              <li key={s.k} className="grid grid-cols-[28px_1fr_auto] items-start gap-3 px-4 py-2.5">
                <span className="pt-0.5 font-mono text-[10.5px] text-dim">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="block font-display text-[15px] uppercase tracking-wide text-paper">{s.k}</span>
                  <span className="block text-[12.5px] leading-snug text-muted">{s.d}</span>
                </span>
                <Led tone={lit[i]} className="mt-1.5" />
              </li>
            ))}
          </ol>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <dl className="mt-4 grid grid-cols-2 gap-px border border-hair bg-hair sm:grid-cols-5">
          {[
            ['6', 'devices'],
            ['5', 'links'],
            ['10', 'fault types'],
            ['10', 'ticketed scenarios'],
            ['9', 'diagnostic commands'],
          ].map(([n, l]) => (
            <div key={l} className="bg-graphite px-4 py-4">
              <dt className="sr-only">{l}</dt>
              <dd>
                <span className="block font-display text-4xl font-light text-paper">{n}</span>
                <span className="label">{l}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}
