'use client';

import React, { useState } from 'react';
import { TopologyModel, Device, NetworkLink } from '../../lib/net/topology';
import {
  Laptop,
  Server,
  Network,
  Router,
  Globe,
  Radio,
} from 'lucide-react';

interface TopologyCanvasProps {
  topology: TopologyModel;
  selectedDeviceId?: string;
  onSelectDevice?: (deviceId: string) => void;
  onToggleLink?: (linkId: string) => void;
  highlightedPath?: string[]; // device IDs in currently active transmission
  activeHopId?: string; // single device highlighted right now (for traceroute hop)
  isEditable?: boolean;
  className?: string;
}

export function TopologyCanvas({
  topology,
  selectedDeviceId,
  onSelectDevice,
  onToggleLink,
  highlightedPath = [],
  activeHopId,
  isEditable = false,
  className = '',
}: TopologyCanvasProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // Layout node positions in canvas coordinate space (viewBox 0 0 820 400)
  const nodePositions: Record<string, { x: number; y: number }> = {
    PC1: { x: 100, y: 110 },
    PC2: { x: 100, y: 290 },
    SW1: { x: 250, y: 200 },
    R1: { x: 410, y: 200 },
    R2: { x: 570, y: 200 },
    DNS: { x: 720, y: 110 },
    WEB: { x: 720, y: 290 },
  };

  const getDeviceIcon = (type: Device['type'], id: string) => {
    switch (type) {
      case 'host':
        return <Laptop className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'switch':
        return <Network className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'router':
        return <Router className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'server':
        return id === 'DNS' ? <Globe className="w-5 h-5 sm:w-6 sm:h-6" /> : <Server className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const getDeviceStatusColor = (dev: Device) => {
    if (dev.status === 'down') return { ring: 'border-[#f87171] shadow-[0_0_15px_rgba(248,113,113,0.4)]', text: 'text-[#f87171]' };
    if (dev.status === 'misconfigured') return { ring: 'border-[#c8b27a] shadow-[0_0_15px_rgba(200,178,122,0.4)]', text: 'text-[#c8b27a]' };
    return { ring: 'border-[#34d399]/50 group-hover:border-[#34d399] shadow-[0_0_15px_rgba(52,211,153,0.2)]', text: 'text-[#34d399]' };
  };

  return (
    <div className={`relative w-full bg-[#0a0f0d] border border-[#78b496]/20 rounded-[2rem] p-4 sm:p-6 shadow-2xl overflow-hidden select-none ${className}`}>
      {/* Subtle emerald grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#34d399 1px, transparent 1px), linear-gradient(90deg, #34d399 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Header bar of topology canvas */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-2 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#1f7a4d]/20 border border-[#34d399]/30 flex items-center justify-center text-[#34d399]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-sans font-semibold text-[#e8f2ec] tracking-tight">
              Interactive Topology Map
            </h3>
            <p className="text-[10px] font-mono text-[#78b496]/80">
              LAN 192.168.1.0/24 &bull; WAN 10.0.0.0/30 &bull; Server DMZ 172.16.0.0/24
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-[#78b496]/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#34d399] shadow-[0_0_6px_#34d399]"></span>
            <span>Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#c8b27a] shadow-[0_0_6px_#c8b27a]"></span>
            <span>Misconfigured</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f87171] shadow-[0_0_6px_#f87171]"></span>
            <span>Down / Cut</span>
          </div>
        </div>
      </div>

      {/* SVG Container for links & nodes */}
      <div className="relative w-full aspect-[820/410] max-h-[440px]">
        <svg
          viewBox="0 0 820 400"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Packet Glow Filter */}
            <filter id="packet-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Linear Gradients */}
            <linearGradient id="link-grad-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1f7a4d" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="link-grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Links */}
          {topology.links.map((link) => {
            const posA = nodePositions[link.nodeA];
            const posB = nodePositions[link.nodeB];
            if (!posA || !posB) return null;

            const isLinkHighlighted =
              highlightedPath.includes(link.nodeA) &&
              highlightedPath.includes(link.nodeB);

            const isLinkDown = !link.up;
            const isHovered = hoveredLink === link.id;

            return (
              <g
                key={link.id}
                className={isEditable ? 'cursor-pointer' : ''}
                onClick={() => isEditable && onToggleLink?.(link.id)}
                onMouseEnter={() => setHoveredLink(link.id)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {/* Invisible wide hit area for easy clicking */}
                <line
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  stroke="transparent"
                  strokeWidth="20"
                />

                {/* Base Link Cable Line */}
                <line
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={
                    isLinkDown
                      ? '#f87171'
                      : isLinkHighlighted
                      ? '#34d399'
                      : isHovered
                      ? '#78b496'
                      : '#1a2e22'
                  }
                  strokeWidth={isLinkHighlighted || isHovered ? '3.5' : '2'}
                  strokeDasharray={isLinkDown ? '6 6' : undefined}
                  className="transition-colors duration-300"
                />

                {/* Animated Packet Stream on healthy links */}
                {!isLinkDown && (
                  <circle
                    r="3.5"
                    fill={isLinkHighlighted ? '#34d399' : '#10b981'}
                    filter="url(#packet-glow)"
                  >
                    <animateMotion
                      path={`M ${posA.x} ${posA.y} L ${posB.x} ${posB.y}`}
                      dur={isLinkHighlighted ? '1.2s' : '2.5s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Second reverse packet for full duplex feel */}
                {!isLinkDown && (
                  <circle
                    r="2.5"
                    fill={isLinkHighlighted ? '#34d399' : '#10b981'}
                    opacity="0.8"
                  >
                    <animateMotion
                      path={`M ${posB.x} ${posB.y} L ${posA.x} ${posA.y}`}
                      dur={isLinkHighlighted ? '1.4s' : '3.0s'}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Link Disconnect / Warning Badge */}
                {isLinkDown && (
                  <g
                    transform={`translate(${(posA.x + posB.x) / 2}, ${
                      (posA.y + posB.y) / 2
                    })`}
                  >
                    <circle r="12" fill="#f87171" opacity="0.2" className="animate-ping" />
                    <circle r="10" fill="#101713" stroke="#f87171" strokeWidth="1.5" />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill="#f87171"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      X
                    </text>
                  </g>
                )}

                {/* Link Tooltip / Click hint */}
                {isEditable && isHovered && (
                  <text
                    x={(posA.x + posB.x) / 2}
                    y={(posA.y + posB.y) / 2 - 12}
                    textAnchor="middle"
                    fill="#e8f2ec"
                    fontSize="9"
                    fontFamily="monospace"
                    className="bg-[#050807] px-1"
                  >
                    {isLinkDown ? 'Click to Re-connect' : 'Click to Unplug Cable'}
                  </text>
                )}
              </g>
            );
          })}

          {/* Subnet Region Labels */}
          <text
            x="175"
            y="370"
            textAnchor="middle"
            fill="#78b496"
            opacity="0.5"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="0.15em"
          >
            LAN: 192.168.1.0/24
          </text>
          <text
            x="490"
            y="245"
            textAnchor="middle"
            fill="#78b496"
            opacity="0.5"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="0.15em"
          >
            WAN: 10.0.0.0/30
          </text>
          <text
            x="720"
            y="370"
            textAnchor="middle"
            fill="#78b496"
            opacity="0.5"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="0.15em"
          >
            DMZ: 172.16.0.0/24
          </text>
        </svg>

        {/* HTML Rendered Device Nodes overlaying SVG coordinates */}
        {Object.entries(topology.devices).map(([id, dev]) => {
          const pos = nodePositions[id];
          if (!pos) return null;

          const isSelected = selectedDeviceId === id;
          const isHighlighted = highlightedPath.includes(id);
          const isActiveHop = activeHopId === id;
          const statusStyle = getDeviceStatusColor(dev);

          // Coordinates in percent: x / 820 * 100%, y / 400 * 100%
          const leftPercent = (pos.x / 820) * 100;
          const topPercent = (pos.y / 400) * 100;

          const ipDisplay = dev.interfaces[0]?.ip || (id === 'SW1' ? 'Layer 2' : '');

          return (
            <div
              key={id}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => onSelectDevice?.(id)}
              onMouseEnter={() => setHoveredNode(id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="absolute z-20 flex flex-col items-center cursor-pointer group"
            >
              {/* Outer pulsing ring for active hop */}
              {isActiveHop && (
                <div className="absolute -inset-2.5 rounded-2xl sm:rounded-3xl border-2 border-[#34d399] animate-ping opacity-60 pointer-events-none" />
              )}

              {/* Node Card Box */}
              <div
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl border transition-all duration-300 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden shadow-xl ${
                  isSelected
                    ? 'border-[#34d399] bg-[#14231b] ring-2 ring-[#34d399]/40 scale-105 shadow-[0_0_20px_rgba(52,211,153,0.25)]'
                    : isHighlighted
                    ? 'border-[#34d399] bg-[#101713]/90 ring-2 ring-[#34d399]/40'
                    : 'border-[#78b496]/20 bg-[#101713]/80 hover:border-[#34d399]/50 hover:scale-105'
                }`}
              >
                {/* Subtle highlight sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent pointer-events-none" />

                <div className={`${statusStyle.text} transition-colors group-hover:scale-110 duration-200`}>
                  {getDeviceIcon(dev.type, id)}
                </div>

                {/* Status indicator dot */}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                  {dev.status === 'down' ? (
                    <span className="w-2 h-2 rounded-full bg-[#f87171] block shadow-[0_0_8px_#f87171]" />
                  ) : dev.status === 'misconfigured' ? (
                    <span className="w-2 h-2 rounded-full bg-[#c8b27a] block shadow-[0_0_8px_#c8b27a]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#34d399] block shadow-[0_0_8px_#34d399]" />
                  )}
                </div>
              </div>

              {/* Node Label & IP with Home Video font */}
              <div className="mt-1.5 flex flex-col items-center text-center pointer-events-none">
                <span className="text-[11px] sm:text-xs font-display text-[#e8f2ec] tracking-wider uppercase">
                  {id}
                </span>
                {ipDisplay && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono leading-tight ${
                      dev.status === 'misconfigured'
                        ? 'text-[#c8b27a] font-semibold'
                        : dev.status === 'down'
                        ? 'text-[#f87171]'
                        : 'text-[#78b496]/80'
                    }`}
                  >
                    {ipDisplay}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
