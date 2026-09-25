'use client';

import React, { useState, useEffect } from 'react';
import {
  Router,
  Monitor,
  Server,
  Shield,
  Activity,
  Plus,
  Play,
  RotateCcw,
  WifiOff,
  CheckCircle2,
  AlertOctagon,
  Layers,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import { Simulation2FaultLab } from '../sims/Simulation2FaultLab';
import { Simulation3OsiWalkthrough } from '../sims/Simulation3OsiWalkthrough';
import { Simulation1Terminal } from '../sims/Simulation1Terminal';

interface NetworkNode {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'pc' | 'server' | 'firewall';
  ip: string;
  status: 'online' | 'fault' | 'congested';
  x: number; // percentage
  y: number; // percentage
}

interface NetworkLink {
  id: string;
  from: string;
  to: string;
  status: 'active' | 'severed' | 'blocked';
  label: string;
}

const INITIAL_NODES: NetworkNode[] = [
  { id: 'pc1', name: 'PC1 (Workstation)', type: 'pc', ip: '192.168.1.10', status: 'online', x: 12, y: 50 },
  { id: 'sw1', name: 'Switch SW1', type: 'switch', ip: 'Layer 2 Bridge', status: 'online', x: 32, y: 50 },
  { id: 'r1', name: 'Gateway Router R1', type: 'router', ip: '192.168.1.1', status: 'online', x: 52, y: 50 },
  { id: 'fw1', name: 'Edge Firewall', type: 'firewall', ip: '10.0.0.1 / ACL', status: 'online', x: 72, y: 50 },
  { id: 'srv1', name: 'App Server (HTTP/DNS)', type: 'server', ip: '172.16.0.80', status: 'online', x: 90, y: 50 },
];

const INITIAL_LINKS: NetworkLink[] = [
  { id: 'l1', from: 'pc1', to: 'sw1', status: 'active', label: 'Cat6 1Gbps' },
  { id: 'l2', from: 'sw1', to: 'r1', status: 'active', label: 'Trunk /24' },
  { id: 'l3', from: 'r1', to: 'fw1', status: 'active', label: 'WAN Transit' },
  { id: 'l4', from: 'fw1', to: 'srv1', status: 'active', label: 'DMZ Port 80' },
];

export function NetworkTopologySimulator() {
  const [nodes, setNodes] = useState<NetworkNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<NetworkLink[]>(INITIAL_LINKS);
  const [activeSubTab, setActiveSubTab] = useState<'designer' | 'faultlab' | 'osi' | 'terminal'>('designer');
  const [packetSimulating, setPacketSimulating] = useState<boolean>(false);
  const [packetProgress, setPacketProgress] = useState<number>(0);
  const [packetResult, setPacketResult] = useState<'success' | 'drop' | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(INITIAL_NODES[0]);

  const toggleLinkStatus = (linkId: string) => {
    setLinks((prev) =>
      prev.map((l) => {
        if (l.id === linkId) {
          const nextStatus = l.status === 'active' ? 'severed' : 'active';
          return { ...l, status: nextStatus };
        }
        return l;
      })
    );
  };

  const toggleNodeFault = (nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const nextStatus = n.status === 'online' ? 'fault' : 'online';
          return { ...n, status: nextStatus };
        }
        return n;
      })
    );
  };

  const handleSimulatePacket = () => {
    if (packetSimulating) return;
    setPacketSimulating(true);
    setPacketProgress(0);
    setPacketResult(null);

    const hasSeveredLink = links.some((l) => l.status === 'severed');
    const hasFaultyNode = nodes.some((n) => n.status === 'fault');
    const willFail = hasSeveredLink || hasFaultyNode;

    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setPacketProgress(p);

      if (p >= 100) {
        clearInterval(interval);
        setPacketSimulating(false);
        setPacketResult(willFail ? 'drop' : 'success');
      }
    }, 45);
  };

  const handleResetTopology = () => {
    setNodes(INITIAL_NODES);
    setLinks(INITIAL_LINKS);
    setPacketProgress(0);
    setPacketResult(null);
  };

  const getNodeIcon = (type: NetworkNode['type']) => {
    switch (type) {
      case 'router':
        return <Router className="w-5 h-5 text-emerald-400" />;
      case 'pc':
        return <Monitor className="w-5 h-5 text-sky-400" />;
      case 'server':
        return <Server className="w-5 h-5 text-amber-400" />;
      case 'firewall':
        return <Shield className="w-5 h-5 text-rose-400" />;
      case 'switch':
      default:
        return <Cpu className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <section id="simulations" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[#34d399] font-mono text-xs uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5" />
            <span>Interactive Simulator &bull; 4 Environments</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white">
            Network Topology &amp; Simulation Suite
          </h2>
          <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed">
            Test packet transit behavior, inject physical and logical network faults, and inspect protocol headers in real time.
          </p>
        </div>

        {/* Simulator Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0a0f0d] border border-white/10 shrink-0 self-start sm:self-auto">
          {[
            { id: 'designer' as const, label: 'Topology Designer' },
            { id: 'faultlab' as const, label: '8 Fault Scenarios' },
            { id: 'osi' as const, label: 'OSI Walkthrough' },
            { id: 'terminal' as const, label: 'Virtual Terminal' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-emerald-500 text-black font-semibold shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Body */}
      {activeSubTab === 'designer' && (
        <div className="rounded-[2.5rem] bg-[#0a0f0d]/85 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.6)] space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulatePacket}
                disabled={packetSimulating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-sans transition-all shadow-[0_0_16px_rgba(52,211,153,0.3)] cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{packetSimulating ? 'Dispatching ICMP Packet...' : 'Simulate Echo Probe'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetTopology}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Links</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active Link
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Severed / Faulty
              </span>
            </div>
          </div>

          {/* Topology Canvas Area */}
          <div className="relative w-full h-[340px] sm:h-[400px] rounded-2xl bg-[#040605] border border-white/10 p-4 overflow-hidden shadow-inner flex flex-col justify-center">
            {/* Grid background lines */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />

            {/* Connecting Links (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {links.map((link) => {
                const source = nodes.find((n) => n.id === link.from);
                const target = nodes.find((n) => n.id === link.to);
                if (!source || !target) return null;

                const isSevered = link.status === 'severed';
                return (
                  <g key={link.id}>
                    <line
                      x1={`${source.x}%`}
                      y1={`${source.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke={isSevered ? '#f87171' : '#34d399'}
                      strokeWidth={isSevered ? '2' : '3'}
                      strokeDasharray={isSevered ? '6 6' : 'none'}
                      opacity={isSevered ? 0.7 : 0.85}
                    />
                  </g>
                );
              })}

              {/* Animated Glowing Packet */}
              {packetSimulating && (
                <circle
                  cx={`${12 + (packetProgress / 100) * (90 - 12)}%`}
                  cy="50%"
                  r="6"
                  fill="#34d399"
                  className="shadow-[0_0_12px_#34d399]"
                />
              )}
            </svg>

            {/* Interactive Network Nodes */}
            <div className="relative w-full h-full">
              {nodes.map((node) => {
                const isFault = node.status === 'fault';
                const isSelected = selectedNode?.id === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 cursor-pointer group z-10"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 backdrop-blur-xl ${
                        isFault
                          ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                          : isSelected
                          ? 'bg-[#121c17] border-emerald-400 ring-2 ring-emerald-400/30 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                          : 'bg-[#090d0b]/80 border-white/15 hover:border-emerald-400/50 hover:bg-[#0f1713]'
                      }`}
                    >
                      {getNodeIcon(node.type)}
                    </div>

                    <div className="text-center space-y-0.5 pointer-events-none">
                      <span className="text-[11px] font-sans font-semibold text-white whitespace-nowrap drop-shadow">
                        {node.name.split(' ')[0]}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400 block">
                        {node.ip}
                      </span>
                    </div>

                    {/* Toggle Fault Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNodeFault(node.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/80 text-neutral-300 hover:text-white border border-white/10"
                    >
                      {isFault ? 'Restore' : 'Inject Fault'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Packet Simulation Result Banner */}
            {packetResult && (
              <div
                className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border shadow-lg animate-in fade-in z-20 ${
                  packetResult === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                }`}
              >
                {packetResult === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ICMP Echo Request: 4/4 Received (14ms RTT) &bull; Path Healthy</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <span>Packet Dropped! Transit Link Severed or Interface Fault Injected.</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Link Cut / Interactivity Controls */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
              Toggle Link Disruptions:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {links.map((link) => {
                const isSevered = link.status === 'severed';
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => toggleLinkStatus(link.id)}
                    className={`p-3 rounded-xl border text-left text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                      isSevered
                        ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                        : 'bg-black/30 border-white/10 text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <span>{link.label}</span>
                    <span className="text-[10px] font-bold">
                      {isSevered ? 'CUT' : 'UP'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'faultlab' && <Simulation2FaultLab />}
      {activeSubTab === 'osi' && <Simulation3OsiWalkthrough />}
      {activeSubTab === 'terminal' && <Simulation1Terminal />}
    </section>
  );
}
