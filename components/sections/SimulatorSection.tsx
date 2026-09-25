'use client';

import { useState } from 'react';
import { Panel, Section } from '@/components/chrome/Section';
import { Inspector } from '@/components/network/Inspector';
import { FaultPanel, PacketControls } from '@/components/network/FaultPanel';
import { Terminal } from '@/components/network/Terminal';
import { EventLog, Telemetry } from '@/components/network/Telemetry';
import { TopologyView, type Selection } from '@/components/network/TopologyView';
import { SCENARIOS } from '@/lib/sim/scenarios';
import { useLab } from '@/lib/sim/store';

export function SimulatorSection() {
  const { state } = useLab();
  const [selection, setSelection] = useState<Selection>({ type: 'device', id: 'PC1' });
  const scenario = SCENARIOS.find((s) => s.id === state.scenarioId);

  return (
    <Section
      id="simulator"
      no="02"
      kicker="Simulation · Launch lab"
      title={
        <>
          Interactive
          <br />
          network environment
        </>
      }
      lede="PC1 → SW1 → R1 → FW1 → SRV1. Every control here changes the same network the terminal, the diagnostics console and the telemetry read from. Cut a cable and the next ping fails exactly where the cable was."
    >
      {scenario && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[3px] border border-alarm/40 bg-alarm-soft px-4 py-2.5">
          <span className="label text-alarm">Scenario {scenario.no} loaded</span>
          <span className="text-[13px] text-paper">{scenario.title}</span>
          <span className="text-[12px] text-muted">— work it from the Diagnostics console or diagnose it here directly.</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel title="Topology" meta={<span className="label">Click a device or cable</span>} className="lg:col-span-8" bodyClass="p-3 sm:p-4">
          <div className="grid-paper rounded-[2px] border border-hair bg-ink/40">
            <TopologyView net={state.net} flight={state.flight} selection={selection} onSelect={setSelection} />
          </div>
          <div className="mt-3">
            <PacketControls />
          </div>
        </Panel>

        <Panel title="Inspector" className="lg:col-span-4">
          <Inspector selection={selection} />
        </Panel>

        <div className="min-w-0 lg:col-span-7">
          <Terminal height="h-[380px]" />
        </div>

        <Panel title="Fault injection" className="lg:col-span-5" bodyClass="p-4 pt-1">
          <div data-lenis-prevent className="thin-scroll max-h-[440px] overflow-y-auto pr-1">
            <FaultPanel />
          </div>
        </Panel>

        <Panel title="Live telemetry" className="lg:col-span-8" bodyClass="p-0">
          <Telemetry />
        </Panel>

        <Panel title="Event log" className="lg:col-span-4">
          <EventLog />
        </Panel>
      </div>
    </Section>
  );
}
