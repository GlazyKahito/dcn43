'use client';

import React, { useState } from 'react';
import { createDefaultTopology, TopologyModel, Device } from '../../lib/net/topology';
import { TopologyCanvas } from './TopologyCanvas';
import { Terminal } from './Terminal';
import { DiagnosticConsole, DiagnosticLog } from './DiagnosticConsole';
import {
  Sparkles,
  Server,
  Network,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Info,
} from 'lucide-react';

export function Simulation1Terminal() {
  const [topology, setTopology] = useState<TopologyModel>(createDefaultTopology);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('PC1');
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [activeHopId, setActiveHopId] = useState<string | undefined>(undefined);
  const [inspectedDevice, setInspectedDevice] = useState<Device | null>(null);
  const [logs, setLogs] = useState<DiagnosticLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Simulation 1: Virtual Diagnostic Terminal initialized on default topology.',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      type: 'check',
      message: 'All interfaces operational. LAN 192.168.1.0/24, WAN 10.0.0.0/30, DMZ 172.16.0.0/24.',
    },
  ]);

  const addLog = (type: DiagnosticLog['type'], message: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
    ]);
  };

  const handleCommandExecuted = (cmd: string, pathDevices?: string[]) => {
    if (pathDevices && pathDevices.length > 0) {
      setHighlightedPath(pathDevices);
      // Auto reset highlight after 4 seconds
      setTimeout(() => {
        setHighlightedPath([]);
      }, 4000);
    }

    addLog('check', `${activeDeviceId} > ${cmd}`);
  };

  const handleHopActive = (hopId?: string) => {
    setActiveHopId(hopId);
  };

  const handleSelectDevice = (devId: string) => {
    const dev = topology.devices[devId];
    if (dev) {
      setInspectedDevice(dev);
    }
  };

  const resetTopology = () => {
    setTopology(createDefaultTopology());
    setHighlightedPath([]);
    setActiveHopId(undefined);
    addLog('info', 'Topology reset to initial healthy baseline.');
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Simulation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[1.75rem] bg-[#161617] border border-neutral-800">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#2997ff] font-semibold">
            Simulation 01 • Interactive Shell
          </span>
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mt-0.5">
            Virtual Network Diagnostic Terminal
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Execute diagnostic commands from any node in the topology. Real-time path tracing and packet flow visualization.
          </p>
        </div>

        <button
          onClick={resetTopology}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700/80 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Lab</span>
        </button>
      </div>

      {/* Main Grid: Topology Canvas + Virtual Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Topology Canvas */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <TopologyCanvas
            topology={topology}
            selectedDeviceId={activeDeviceId}
            onSelectDevice={(id) => {
              setActiveDeviceId(id);
              handleSelectDevice(id);
            }}
            highlightedPath={highlightedPath}
            activeHopId={activeHopId}
            className="flex-1"
          />

          {/* Quick Command Bar */}
          <div className="p-4 rounded-[1.5rem] bg-[#161617] border border-neutral-800 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mr-1">
              Quick Test:
            </span>
            {[
              'ping 192.168.1.1',
              'ping 172.16.0.80',
              'tracert www.lab.local',
              'nslookup www.lab.local',
              'arp -a',
              'netstat -an',
              'ipconfig /all',
            ].map((quickCmd, idx) => (
              <button
                key={idx}
                onClick={() => handleCommandExecuted(quickCmd, ['PC1', 'SW1', 'R1', 'R2', 'WEB'])}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700/60 text-[11px] font-mono text-zinc-300 hover:text-white hover:border-[#2997ff]/60 hover:bg-neutral-800 transition-all cursor-pointer"
              >
                {quickCmd}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Terminal Console */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <Terminal
            topology={topology}
            activeDeviceId={activeDeviceId}
            onDeviceChange={setActiveDeviceId}
            onCommandExecuted={handleCommandExecuted}
            onHopActive={handleHopActive}
            className="flex-1 min-h-[420px]"
          />
        </div>
      </div>

      {/* Bottom: Diagnostic Console */}
      <DiagnosticConsole
        logs={logs}
        onClear={() => setLogs([])}
        title="Live Diagnostic Bus & Kernel Log"
      />

      {/* Device Inspector Modal */}
      {inspectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#161617] border border-neutral-800 rounded-[2rem] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#2997ff]/10 text-[#2997ff]">
                  <Server className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-white font-mono">{inspectedDevice.id}</h4>
                  <p className="text-xs text-neutral-400">{inspectedDevice.name}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedDevice(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Interfaces</div>
                {inspectedDevice.interfaces.map((iface, i) => (
                  <div key={i} className="flex justify-between text-zinc-300">
                    <span>{iface.name}:</span>
                    <span className="text-[#2997ff]">{iface.ip || 'Unnumbered'} / {iface.cidr}</span>
                  </div>
                ))}
              </div>

              {inspectedDevice.defaultGateway && (
                <div className="flex justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-400">Default Gateway:</span>
                  <span className="text-white">{inspectedDevice.defaultGateway}</span>
                </div>
              )}

              {inspectedDevice.dnsServer && (
                <div className="flex justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                  <span className="text-neutral-400">DNS Server:</span>
                  <span className="text-white">{inspectedDevice.dnsServer}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Active Services</div>
                {inspectedDevice.services.length === 0 ? (
                  <div className="text-neutral-500">None (Client workstation)</div>
                ) : (
                  inspectedDevice.services.map((svc, i) => (
                    <div key={i} className="flex justify-between text-zinc-300">
                      <span>{svc.serviceName} ({svc.protocol}/{svc.port}):</span>
                      <span className="text-[#30d158]">{svc.state}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectedDevice(null)}
                className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
