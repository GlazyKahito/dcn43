'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Shield,
  ShieldAlert,
  Terminal,
  Activity,
  Award,
  Flame,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { LiquidButton, MetalButton } from '../ui/liquid-glass-button';

interface FlowNode {
  id: string;
  name: string;
  label: string;
  x: number;
  y: number;
  type: 'host' | 'switch' | 'router' | 'firewall' | 'server';
  status: 'normal' | 'alert' | 'fault';
}

interface Packet {
  id: number;
  type: 'legit' | 'malicious';
  proto: 'ICMP' | 'TCP' | 'DNS';
  progress: number; // 0 to 1 along the path
  pathIndex: number; // which segment of the path
  speed: number;
  ttl: number;
}

export function PacketXFlowGame() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [deliveredCount, setDeliveredCount] = useState<number>(0);
  const [droppedCount, setDroppedCount] = useState<number>(0);
  const [integrity, setIntegrity] = useState<number>(100);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<string>('SYSTEM READY // PRESS START');

  // Game Interactive Controls State
  const [cable1Up, setCable1Up] = useState<boolean>(true);
  const [cable2Up, setCable2Up] = useState<boolean>(true);
  const [routerRoute, setRouterRoute] = useState<'normal' | 'alt'>('normal'); // R1 route
  const [firewallOpen, setFirewallOpen] = useState<boolean>(true); // Firewall gate

  const packetsRef = useRef<Packet[]>([]);
  const [, setRenderTick] = useState<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vlab_netflow_highscore');
      if (saved) setHighScore(parseInt(saved, 10));
    } catch {}
  }, []);

  // Web Audio 8-bit sound generator
  const playRetroSound = (type: 'beep' | 'success' | 'drop' | 'repair' | 'alert') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'beep') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.07);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'repair') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'drop') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'alert') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.setValueAtTime(550, now + 0.06);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {}
  };

  // Node Positions on SVG canvas (800 x 360)
  const nodes: FlowNode[] = [
    { id: 'PC1', name: 'PC1 Host', label: 'SOURCE', x: 80, y: 180, type: 'host', status: 'normal' },
    { id: 'SW1', name: 'Switch SW1', label: 'L2 MAC', x: 230, y: 180, type: 'switch', status: !cable1Up ? 'fault' : 'normal' },
    { id: 'R1', name: 'Router R1', label: 'L3 GATEWAY', x: 380, y: 180, type: 'router', status: routerRoute === 'alt' ? 'alert' : 'normal' },
    { id: 'R2', name: 'Core R2', label: routerRoute === 'alt' ? 'ALT ROUTE' : 'PRIMARY', x: 520, y: routerRoute === 'alt' ? 100 : 180, type: 'router', status: !cable2Up ? 'fault' : 'normal' },
    { id: 'FW', name: 'Firewall', label: firewallOpen ? 'PASS' : 'SHIELD', x: 650, y: 180, type: 'firewall', status: firewallOpen ? 'normal' : 'alert' },
    { id: 'SRV', name: 'Somaiya Server', label: 'TARGET', x: 740, y: 180, type: 'server', status: 'normal' },
  ];

  // Start game
  const startGame = () => {
    setScore(0);
    setStreak(0);
    setDeliveredCount(0);
    setDroppedCount(0);
    setIntegrity(100);
    setGameOver(false);
    setCable1Up(true);
    setCable2Up(true);
    setRouterRoute('normal');
    setFirewallOpen(true);
    packetsRef.current = [];
    setIsPlaying(true);
    setActiveAlert('FLOW ACTIVE // DEFEND THE PACKETS');
    playRetroSound('success');
  };

  // Main game tick loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    let packetIdCounter = 0;
    let frameCount = 0;

    const gameLoop = setInterval(() => {
      frameCount++;

      // 1. Randomly spawn packets from PC1
      if (frameCount % 45 === 0) {
        const isMalicious = Math.random() < 0.22;
        packetsRef.current.push({
          id: packetIdCounter++,
          type: isMalicious ? 'malicious' : 'legit',
          proto: isMalicious ? 'TCP' : Math.random() > 0.4 ? 'ICMP' : 'DNS',
          progress: 0,
          pathIndex: 0,
          speed: 0.012 + Math.random() * 0.008,
          ttl: 64,
        });
      }

      // 2. Random network hazard event every ~6 seconds
      if (frameCount % 180 === 0) {
        const eventType = Math.floor(Math.random() * 3);
        if (eventType === 0 && cable1Up) {
          setCable1Up(false);
          setActiveAlert('HAZARD: PC1-SW1 CABLE DISCONNECTED! CLICK TO REPAIR');
          playRetroSound('alert');
        } else if (eventType === 1 && cable2Up) {
          setCable2Up(false);
          setActiveAlert('HAZARD: R1-R2 TRANSIT TRUNK CUT! CLICK TO REPAIR');
          playRetroSound('alert');
        } else if (eventType === 2 && routerRoute === 'normal') {
          setRouterRoute('alt');
          setActiveAlert('HAZARD: ROUTE MISCONFIGURED! FLIP R1 BACK');
          playRetroSound('alert');
        }
      }

      // 3. Update packet positions
      const currentPackets = packetsRef.current;
      const survivingPackets: Packet[] = [];

      for (let i = 0; i < currentPackets.length; i++) {
        const p = currentPackets[i];
        p.progress += p.speed;

        // Check cable 1 break (segment 0-0.2)
        if (p.progress >= 0.18 && p.progress <= 0.22 && !cable1Up) {
          playRetroSound('drop');
          setDroppedCount((d) => d + 1);
          setStreak(0);
          setIntegrity((prev) => Math.max(0, prev - 12));
          continue;
        }

        // Check cable 2 break (segment 0.48-0.52)
        if (p.progress >= 0.48 && p.progress <= 0.52 && !cable2Up) {
          playRetroSound('drop');
          setDroppedCount((d) => d + 1);
          setStreak(0);
          setIntegrity((prev) => Math.max(0, prev - 12));
          continue;
        }

        // Check Firewall Gate (segment 0.8-0.85)
        if (p.progress >= 0.82 && p.progress <= 0.86) {
          if (p.type === 'malicious') {
            if (firewallOpen) {
              // Rogue packet penetrated firewall!
              playRetroSound('drop');
              setDroppedCount((d) => d + 1);
              setStreak(0);
              setIntegrity((prev) => Math.max(0, prev - 20));
              setActiveAlert('BREACH: MALICIOUS SYN FLOOD PENETRATED FIREWALL!');
              continue;
            } else {
              // Firewall successfully blocked rogue packet!
              playRetroSound('success');
              setScore((s) => s + 75);
              setStreak((st) => st + 1);
              continue;
            }
          } else {
            // Legit packet
            if (!firewallOpen) {
              // Firewall blocked legit packet!
              playRetroSound('drop');
              setDroppedCount((d) => d + 1);
              setStreak(0);
              setIntegrity((prev) => Math.max(0, prev - 10));
              setActiveAlert('MISFIRE: FIREWALL DROPPED LEGITIMATE STUDENT PACKET!');
              continue;
            }
          }
        }

        // Check Delivery at Server (progress >= 1)
        if (p.progress >= 1.0) {
          if (p.type === 'legit') {
            playRetroSound('success');
            setScore((s) => s + 50 + streak * 10);
            setStreak((st) => st + 1);
            setDeliveredCount((d) => d + 1);
            setActiveAlert('PACKET DELIVERED // +50 PTS');
          }
          continue;
        }

        survivingPackets.push(p);
      }

      packetsRef.current = survivingPackets;
      setRenderTick(frameCount);

      // Check integrity game over
      setIntegrity((currentInt) => {
        if (currentInt <= 0) {
          setGameOver(true);
          setIsPlaying(false);
          setActiveAlert('NETWORK COLLAPSE // ZERO INTEGRITY');
          playRetroSound('drop');
        }
        return currentInt;
      });
    }, 40);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, cable1Up, cable2Up, routerRoute, firewallOpen, streak]);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('vlab_netflow_highscore', score.toString());
      } catch {}
    }
  }, [score, highScore]);

  // Repair handlers
  const handleRepairCable1 = () => {
    setCable1Up(true);
    playRetroSound('repair');
    setScore((s) => s + 25);
    setActiveAlert('CABLE 1 RESTORED // +25 PTS');
  };

  const handleRepairCable2 = () => {
    setCable2Up(true);
    playRetroSound('repair');
    setScore((s) => s + 25);
    setActiveAlert('CABLE 2 RESTORED // +25 PTS');
  };

  const handleToggleRoute = () => {
    setRouterRoute((r) => (r === 'normal' ? 'alt' : 'normal'));
    playRetroSound('beep');
    setActiveAlert(routerRoute === 'normal' ? 'ROUTING DIVERTED TO ALT' : 'ROUTING RESTORED TO PRIMARY');
  };

  const handleToggleFirewall = () => {
    setFirewallOpen((f) => !f);
    playRetroSound('beep');
    setActiveAlert(!firewallOpen ? 'FIREWALL OPEN // PASS TRAFFIC' : 'FIREWALL CLOSED // BLOCK TRAFFIC');
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Vintage Game Cabinet Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[2rem] bg-[#0a0f0d] border border-[#78b496]/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-display uppercase tracking-widest text-[#34d399] font-bold">
              ARCADE MODULE // GOOGLE X-FLOW INSPIRED
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-display bg-[#c8b27a]/20 border border-[#c8b27a]/40 text-[#c8b27a]">
              RETRO 1986
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-sans font-bold text-white tracking-tight mt-0.5">
            Packet X-Flow: Vintage Net Defender
          </h3>
          <p className="text-xs sm:text-sm text-[#78b496]/80 font-sans mt-1">
            Guide live data packets through the network topology! Click severed cables to solder connections, toggle routing gateways, and drop malicious SYN floods at the firewall gate.
          </p>
        </div>

        {/* Top Controls: Sound & Restart */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-[#101713] border border-[#78b496]/20 text-[#78b496] hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute 8-bit sound' : 'Unmute 8-bit sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#34d399]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {!isPlaying ? (
            <LiquidButton
              onClick={startGame}
              size="default"
              className="text-white hover:text-[#34d399] font-display text-xs"
            >
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-current text-[#34d399]" />
                <span>{gameOver ? 'RETRY DEFENSE' : 'START SIMULATION'}</span>
              </span>
            </LiquidButton>
          ) : (
            <MetalButton
              variant="error"
              onClick={() => {
                setIsPlaying(false);
                setGameOver(true);
              }}
              className="font-display text-xs font-bold h-9 px-4"
            >
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ABORT</span>
              </span>
            </MetalButton>
          )}
        </div>
      </div>

      {/* CRT Retro Terminal Bezel Shell */}
      <div className="relative rounded-[2.5rem] bg-[#050807] border-2 border-[#78b496]/30 p-4 sm:p-7 shadow-2xl overflow-hidden vintage-bezel">
        {/* CRT Scanline Filter Overlay */}
        <div className="crt-scanlines absolute inset-0 z-20 pointer-events-none rounded-[2.5rem]" />

        {/* Vintage Monitor HUD Top Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#78b496]/20 font-display text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[#34d399] tracking-wider crt-phosphor">
              DEC VT-220 // SOMAIYA NETFLOW DISPATCHER
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 text-[11px] font-mono">
            <div>
              <span className="text-[#78b496]/70 uppercase">Score: </span>
              <span className="text-white font-bold text-sm crt-phosphor">{score}</span>
            </div>
            <div>
              <span className="text-[#78b496]/70 uppercase">Streak: </span>
              <span className="text-[#34d399] font-bold">{streak}x</span>
            </div>
            <div>
              <span className="text-[#78b496]/70 uppercase">High: </span>
              <span className="text-[#c8b27a] font-bold crt-amber">{highScore}</span>
            </div>

            {/* In-Monitor Direct Start / Abort Action */}
            {!isPlaying ? (
              <button
                onClick={startGame}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#34d399] hover:bg-white text-[#050807] font-display font-bold text-xs shadow-[0_0_15px_rgba(52,211,153,0.45)] transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>START</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setGameOver(true);
                  setActiveAlert('MISSION ABORTED // STANDBY');
                  playRetroSound('alert');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f87171]/20 hover:bg-[#f87171]/30 border border-[#f87171]/40 text-[#f87171] font-display font-bold text-xs transition-colors cursor-pointer uppercase tracking-wider"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ABORT</span>
              </button>
            )}
          </div>
        </div>

        {/* System Integrity & Telemetry Bar */}
        <div className="relative z-10 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex-1 max-w-xs space-y-1">
            <div className="flex justify-between text-[10px] text-[#78b496]/80 font-display">
              <span>SYSTEM INTEGRITY:</span>
              <span className={integrity < 35 ? 'text-[#f87171] font-bold' : 'text-[#34d399]'}>
                {integrity}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#101713] rounded-full overflow-hidden border border-[#78b496]/20">
              <div
                className={`h-full transition-all duration-300 ${
                  integrity < 35
                    ? 'bg-[#f87171] shadow-[0_0_10px_#f87171]'
                    : 'bg-[#34d399] shadow-[0_0_10px_#34d399]'
                }`}
                style={{ width: `${integrity}%` }}
              />
            </div>
          </div>

          {/* Active Terminal Alert Notice */}
          <div className="px-3 py-1.5 rounded-xl bg-[#101713] border border-[#78b496]/20 text-[11px] font-display tracking-wider text-[#34d399] flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span className="crt-phosphor">{activeAlert}</span>
          </div>
        </div>

        {/* Main X-Flow Visual SVG Canvas */}
        <div className="relative z-10 w-full aspect-[800/360] min-h-[290px] max-h-[390px] my-4 select-none overflow-hidden rounded-2xl border border-[#78b496]/20 bg-[#070c09]">
          <svg viewBox="0 0 800 360" className="w-full h-full overflow-visible">
            <defs>
              <filter id="glow-phosphor" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid Pattern */}
            <pattern id="arcade-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(52,211,153,0.06)" strokeWidth="1" />
            </pattern>
            <rect width="800" height="360" fill="url(#arcade-grid)" />

            {/* Wire Segments */}
            {/* Segment 1: PC1 -> SW1 */}
            <line
              x1={nodes[0].x}
              y1={nodes[0].y}
              x2={nodes[1].x}
              y2={nodes[1].y}
              stroke={cable1Up ? '#34d399' : '#f87171'}
              strokeWidth={cable1Up ? '3' : '2'}
              strokeDasharray={cable1Up ? undefined : '6 6'}
              className="transition-colors"
            />

            {/* Segment 2: SW1 -> R1 */}
            <line
              x1={nodes[1].x}
              y1={nodes[1].y}
              x2={nodes[2].x}
              y2={nodes[2].y}
              stroke="#34d399"
              strokeWidth="3"
            />

            {/* Segment 3: R1 -> R2 (Route dependent) */}
            <line
              x1={nodes[2].x}
              y1={nodes[2].y}
              x2={nodes[3].x}
              y2={nodes[3].y}
              stroke={cable2Up ? '#34d399' : '#f87171'}
              strokeWidth={cable2Up ? '3' : '2'}
              strokeDasharray={cable2Up ? undefined : '6 6'}
              className="transition-colors"
            />

            {/* Segment 4: R2 -> Firewall */}
            <line
              x1={nodes[3].x}
              y1={nodes[3].y}
              x2={nodes[4].x}
              y2={nodes[4].y}
              stroke="#34d399"
              strokeWidth="3"
            />

            {/* Segment 5: Firewall -> Server */}
            <line
              x1={nodes[4].x}
              y1={nodes[4].y}
              x2={nodes[5].x}
              y2={nodes[5].y}
              stroke={firewallOpen ? '#34d399' : '#c8b27a'}
              strokeWidth="3"
            />

            {/* Broken Cable Click Targets & Repair Sparks */}
            {!cable1Up && (
              <g
                className="cursor-pointer group"
                onClick={handleRepairCable1}
                transform={`translate(${(nodes[0].x + nodes[1].x) / 2}, 180)`}
              >
                <circle r="16" fill="#f87171" opacity="0.25" className="animate-ping" />
                <circle r="12" fill="#101713" stroke="#f87171" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#f87171" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  FIX
                </text>
              </g>
            )}

            {!cable2Up && (
              <g
                className="cursor-pointer group"
                onClick={handleRepairCable2}
                transform={`translate(${(nodes[2].x + nodes[3].x) / 2}, ${(nodes[2].y + nodes[3].y) / 2})`}
              >
                <circle r="16" fill="#f87171" opacity="0.25" className="animate-ping" />
                <circle r="12" fill="#101713" stroke="#f87171" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#f87171" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  FIX
                </text>
              </g>
            )}

            {/* Live Traveling Packets */}
            {packetsRef.current.map((p) => {
              // Interpolate coordinates along the 5 segments
              let curX = 80;
              let curY = 180;

              if (p.progress < 0.2) {
                // PC1 to SW1
                const t = p.progress / 0.2;
                curX = nodes[0].x + (nodes[1].x - nodes[0].x) * t;
                curY = nodes[0].y;
              } else if (p.progress < 0.4) {
                // SW1 to R1
                const t = (p.progress - 0.2) / 0.2;
                curX = nodes[1].x + (nodes[2].x - nodes[1].x) * t;
                curY = nodes[1].y;
              } else if (p.progress < 0.65) {
                // R1 to R2
                const t = (p.progress - 0.4) / 0.25;
                curX = nodes[2].x + (nodes[3].x - nodes[2].x) * t;
                curY = nodes[2].y + (nodes[3].y - nodes[2].y) * t;
              } else if (p.progress < 0.85) {
                // R2 to FW
                const t = (p.progress - 0.65) / 0.2;
                curX = nodes[3].x + (nodes[4].x - nodes[3].x) * t;
                curY = nodes[3].y + (nodes[4].y - nodes[3].y) * t;
              } else {
                // FW to Server
                const t = (p.progress - 0.85) / 0.15;
                curX = nodes[4].x + (nodes[5].x - nodes[4].x) * t;
                curY = nodes[5].y;
              }

              const isRogue = p.type === 'malicious';

              return (
                <g key={p.id} transform={`translate(${curX}, ${curY})`}>
                  <circle
                    r={isRogue ? 6 : 5}
                    fill={isRogue ? '#f87171' : '#34d399'}
                    filter="url(#glow-phosphor)"
                  />
                  <text
                    textAnchor="middle"
                    dy="-8"
                    fill={isRogue ? '#f87171' : '#34d399'}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {isRogue ? 'MALWARE' : p.proto}
                  </text>
                </g>
              );
            })}

            {/* Visual Flow Nodes */}
            {nodes.map((node) => {
              const isAlert = node.status === 'alert';
              const isFault = node.status === 'fault';

              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  {/* Outer circle frame */}
                  <circle
                    r="24"
                    fill="#0a0f0d"
                    stroke={isFault ? '#f87171' : isAlert ? '#c8b27a' : '#34d399'}
                    strokeWidth="2"
                    className="transition-colors duration-200"
                  />

                  {/* Inner node identifier */}
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill={isFault ? '#f87171' : isAlert ? '#c8b27a' : '#34d399'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="HomeVideo, monospace"
                  >
                    {node.id}
                  </text>

                  {/* Node label */}
                  <text
                    textAnchor="middle"
                    dy="36"
                    fill="#78b496"
                    fontSize="8"
                    fontFamily="monospace"
                    letterSpacing="0.05em"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* In-Screen Retro Arcade Mission Start Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-[#050807]/88 backdrop-blur-[3px] rounded-2xl flex flex-col items-center justify-center p-6 text-center z-30 space-y-4 animate-in fade-in duration-200">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34d399]/15 border border-[#34d399]/40 text-[#34d399] text-[11px] font-display uppercase tracking-widest animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                <span>DEC VT-220 // SOMAIYA DISPATCHER</span>
              </div>

              <div className="space-y-1.5 max-w-lg">
                <h4 className="text-2xl sm:text-4xl font-display font-bold text-white crt-phosphor tracking-wider">
                  {gameOver ? 'DEFENSE COLLAPSED' : 'SOMAIYA NETFLOW DISPATCHER'}
                </h4>
                <p className="text-xs sm:text-sm text-[#c9dccf]/85 font-mono leading-relaxed">
                  {gameOver
                    ? `Final Score: ${score} pts • Highest Streak: ${streak}x. System integrity was exhausted.`
                    : 'Prevent campus outage! Solder severed copper cables, redirect overloaded gateway routes, and activate the Firewall ACL to block rogue SYN floods.'}
                </p>
              </div>

              {/* Big Glowing Arcade Start Button with Liquid Glass */}
              <LiquidButton
                type="button"
                size="xl"
                onClick={startGame}
                className="text-white hover:text-[#34d399] font-display text-sm sm:text-base font-bold uppercase tracking-widest cursor-pointer crt-phosphor"
              >
                <span className="flex items-center gap-3">
                  <Play className="w-5 h-5 fill-current text-[#34d399]" />
                  <span>{gameOver ? 'INSERT COIN / RETRY MISSION' : 'START NETFLOW MISSION'}</span>
                </span>
              </LiquidButton>

              <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-[#78b496]/70 pt-2">
                <span className="px-2.5 py-1 rounded bg-[#101713] border border-[#78b496]/20">
                  ⚡ SOLDER CUT WIRES
                </span>
                <span className="px-2.5 py-1 rounded bg-[#101713] border border-[#78b496]/20">
                  🛡️ BLOCK RED ROGUES
                </span>
                <span className="px-2.5 py-1 rounded bg-[#101713] border border-[#78b496]/20">
                  🔄 DIVERGE GATEWAY
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Vintage Interactive Command Switches Panel */}
        <div className="relative z-10 pt-3 border-t border-[#78b496]/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Action 1: Solder Cable 1 */}
          <button
            onClick={handleRepairCable1}
            disabled={cable1Up || !isPlaying}
            className={`p-3 rounded-xl border text-left font-display text-xs transition-all flex flex-col justify-between cursor-pointer ${
              !cable1Up && isPlaying
                ? 'bg-[#f87171]/20 border-[#f87171] text-[#f87171] animate-bounce shadow-[0_0_15px_rgba(248,113,113,0.3)]'
                : 'bg-[#101713] border-[#78b496]/20 text-[#78b496]/50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>SOLDER CABLE 1</span>
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-mono mt-1">
              {cable1Up ? 'STATUS: OK' : 'STATUS: DISCONNECTED'}
            </span>
          </button>

          {/* Action 2: Solder Cable 2 */}
          <button
            onClick={handleRepairCable2}
            disabled={cable2Up || !isPlaying}
            className={`p-3 rounded-xl border text-left font-display text-xs transition-all flex flex-col justify-between cursor-pointer ${
              !cable2Up && isPlaying
                ? 'bg-[#f87171]/20 border-[#f87171] text-[#f87171] animate-bounce shadow-[0_0_15px_rgba(248,113,113,0.3)]'
                : 'bg-[#101713] border-[#78b496]/20 text-[#78b496]/50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>SOLDER CABLE 2</span>
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-mono mt-1">
              {cable2Up ? 'STATUS: OK' : 'STATUS: DISCONNECTED'}
            </span>
          </button>

          {/* Action 3: Router Route Diverter Switch */}
          <button
            onClick={handleToggleRoute}
            disabled={!isPlaying}
            className={`p-3 rounded-xl border text-left font-display text-xs transition-all flex flex-col justify-between cursor-pointer ${
              routerRoute === 'alt'
                ? 'bg-[#c8b27a]/20 border-[#c8b27a] text-[#c8b27a]'
                : 'bg-[#101713] border-[#78b496]/20 text-[#34d399] hover:border-[#34d399]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>ROUTE GATEWAY</span>
              <Radio className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-mono mt-1">
              {routerRoute === 'normal' ? 'GATEWAY: PRIMARY (L3)' : 'GATEWAY: BYPASS (ALT)'}
            </span>
          </button>

          {/* Action 4: Firewall ACL Gate Toggle */}
          <button
            onClick={handleToggleFirewall}
            disabled={!isPlaying}
            className={`p-3 rounded-xl border text-left font-display text-xs transition-all flex flex-col justify-between cursor-pointer ${
              !firewallOpen
                ? 'bg-[#1f7a4d] border-[#34d399] text-white shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                : 'bg-[#101713] border-[#78b496]/20 text-[#78b496] hover:border-[#34d399]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>FIREWALL ACL GATE</span>
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-mono mt-1">
              {firewallOpen ? 'FILTER: PERMIT ALL' : 'FILTER: BLOCK ROGUE (ACTIVE)'}
            </span>
          </button>
        </div>

        {/* Vintage Footer Telemetry Strip */}
        <div className="relative z-10 pt-3 mt-3 border-t border-[#78b496]/10 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-[#78b496]/60">
          <div>
            DELIVERED: <span className="text-white font-bold">{deliveredCount}</span> &bull; DROPPED:{' '}
            <span className="text-[#f87171] font-bold">{droppedCount}</span>
          </div>
          <div>RULES: BLOCK RED ROGUES AT FIREWALL &bull; REPAIR CUT WIRES FAST</div>
        </div>
      </div>
    </div>
  );
}
