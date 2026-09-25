'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  createDefaultTopology,
  TopologyModel,
  cloneTopology,
  Device,
} from '../../lib/net/topology';
import { FAULT_SCENARIOS, FaultScenario } from '../../lib/net/faults';
import { TopologyCanvas } from './TopologyCanvas';
import { Terminal } from './Terminal';
import { DiagnosticConsole, DiagnosticLog } from './DiagnosticConsole';
import { formatTime } from '../../lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Wrench,
  Stethoscope,
  RotateCcw,
  Sparkles,
  Award,
  Clock,
  Terminal as TerminalIcon,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export function Simulation2FaultLab() {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState<number>(0);
  const currentScenario: FaultScenario = FAULT_SCENARIOS[activeScenarioIndex];

  // Active topology for the current fault scenario
  const [topology, setTopology] = useState<TopologyModel>(() =>
    currentScenario.apply(createDefaultTopology())
  );

  const [activeDeviceId, setActiveDeviceId] = useState<string>('PC1');
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [activeHopId, setActiveHopId] = useState<string | undefined>(undefined);

  // Stats & Progress tracking
  const [solvedScenarios, setSolvedScenarios] = useState<Record<string, boolean>>({});
  const [commandsRunPerScenario, setCommandsRunPerScenario] = useState<Record<string, string[]>>({});
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Diagnosis Panel Form State
  const [selectedLayer, setSelectedLayer] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedCause, setSelectedCause] = useState<string>('');
  const [diagnosisFeedback, setDiagnosisFeedback] = useState<{
    submitted: boolean;
    isCorrect: boolean;
    message: string;
    diagnosticCommandsUsed: string[];
  } | null>(null);

  // Fix Mode State
  const [fixModalDevice, setFixModalDevice] = useState<Device | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'fail'>('idle');

  // Logs
  const [logs, setLogs] = useState<DiagnosticLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'fault',
      message: `Scenario 01 injected: ${FAULT_SCENARIOS[0].userComplaint}`,
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

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // When student switches scenario
  const selectScenario = (index: number) => {
    setActiveScenarioIndex(index);
    const scen = FAULT_SCENARIOS[index];
    const newTopo = scen.apply(createDefaultTopology());
    setTopology(newTopo);
    setHighlightedPath([]);
    setActiveHopId(undefined);
    setSelectedLayer('');
    setSelectedDevice('');
    setSelectedCause('');
    setDiagnosisFeedback(null);
    setVerifyStatus('idle');

    addLog('fault', `Scenario ${scen.number.toString().padStart(2, '0')} loaded: "${scen.userComplaint}"`);
  };

  const handleCommandExecuted = (cmd: string, pathDevices?: string[]) => {
    if (pathDevices) {
      setHighlightedPath(pathDevices);
      setTimeout(() => setHighlightedPath([]), 4000);
    }

    setCommandsRunPerScenario((prev) => {
      const existing = prev[currentScenario.id] || [];
      return {
        ...prev,
        [currentScenario.id]: [...existing, cmd],
      };
    });

    addLog('check', `${activeDeviceId} > ${cmd}`);
  };

  // Handle student diagnosis submission
  const handleSubmitDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLayer || !selectedDevice || !selectedCause) return;

    const layerCorrect = selectedLayer === currentScenario.faultyLayer;
    const deviceCorrect = selectedDevice === currentScenario.faultyDevice;
    const causeCorrect = selectedCause === currentScenario.causeDescription;

    const isAllCorrect = layerCorrect && deviceCorrect && causeCorrect;
    const usedCmds = commandsRunPerScenario[currentScenario.id] || [];

    // Filter diagnostic commands relevant to this scenario
    const diagnosticKeywords = ['ping', 'tracert', 'ipconfig', 'nslookup', 'arp', 'netstat', 'telnet'];
    const diagnosticCommandsUsed = usedCmds.filter((c) =>
      diagnosticKeywords.some((k) => c.toLowerCase().includes(k))
    );

    setDiagnosisFeedback({
      submitted: true,
      isCorrect: isAllCorrect,
      message: isAllCorrect
        ? 'Outstanding diagnosis! You accurately pinpointed the faulty layer, device, and root cause.'
        : `Partially incorrect. ${!layerCorrect ? 'Review the OSI layer.' : ''} ${!deviceCorrect ? 'Check which device hosts the fault.' : ''} Run more commands to verify.`,
      diagnosticCommandsUsed,
    });

    if (isAllCorrect) {
      addLog('success', `Diagnosis APPROVED for Scenario ${currentScenario.number}! Root cause identified.`);
    } else {
      addLog('error', `Diagnosis rejected for Scenario ${currentScenario.number}. Retrying diagnostic cycle...`);
    }
  };

  // Toggle link (e.g. plugging/unplugging cable)
  const handleToggleLink = (linkId: string) => {
    setTopology((prev) => {
      const next = cloneTopology(prev);
      const link = next.links.find((l) => l.id === linkId);
      if (link) {
        link.up = !link.up;
        addLog('check', `Physical link ${linkId} set to ${link.up ? 'CONNECTED' : 'DISCONNECTED'}.`);
      }
      return next;
    });
  };

  // Quick auto-fix helper
  const handleQuickFix = () => {
    const fixedTopo = currentScenario.fix(topology);
    setTopology(fixedTopo);
    addLog('info', `Applied corrective patch for Scenario ${currentScenario.number}.`);
  };

  // Verify fix
  const handleVerifyFix = () => {
    const isFixed = currentScenario.verifyFix(topology);
    if (isFixed) {
      setVerifyStatus('success');
      setSolvedScenarios((prev) => ({
        ...prev,
        [currentScenario.id]: true,
      }));
      addLog('success', `[VERIFICATION PASSED] Scenario ${currentScenario.number} resolved successfully!`);
    } else {
      setVerifyStatus('fail');
      addLog('error', `[VERIFICATION FAILED] Fault still present in current topology model.`);
    }
  };

  // Save manual device configuration edits
  const handleSaveDeviceEdit = (updatedDev: Device) => {
    setTopology((prev) => {
      const next = cloneTopology(prev);
      next.devices[updatedDev.id] = updatedDev;
      return next;
    });
    setFixModalDevice(null);
    addLog('info', `Updated network configuration for ${updatedDev.id}.`);
  };

  const totalSolved = Object.keys(solvedScenarios).filter((k) => solvedScenarios[k]).length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Simulation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-[2rem] bg-[#161617] border border-neutral-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#ff9f0a] font-semibold">
              Simulation 02 • Core Lab Exercise
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ff9f0a]/10 text-[#ff9f0a] border border-[#ff9f0a]/30">
              Interactive Triage
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mt-1">
            Fault Injection & Root Cause Analysis
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            A network fault has silently disrupted communication. Review the user complaint, run diagnostic utilities from the terminal, formulate your theory, and deploy a fix.
          </p>
        </div>

        {/* Scorecard pill */}
        <div className="flex items-center gap-4 bg-neutral-900/90 border border-neutral-800 p-3 sm:p-4 rounded-2xl shrink-0 self-start md:self-auto">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#30d158]" />
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Solved</span>
              <span className="text-base sm:text-lg font-bold text-white font-mono">
                {totalSolved} / {FAULT_SCENARIOS.length}
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2997ff]" />
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Time</span>
              <span className="text-base sm:text-lg font-bold text-white font-mono">
                {formatTime(secondsElapsed)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Selector Carousel Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {FAULT_SCENARIOS.map((scen, idx) => {
          const isActive = idx === activeScenarioIndex;
          const isSolved = solvedScenarios[scen.id];

          return (
            <button
              key={scen.id}
              onClick={() => selectScenario(idx)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-white text-black border-white shadow-lg scale-[1.02]'
                  : isSolved
                  ? 'bg-[#30d158]/10 border-[#30d158]/40 text-[#30d158] hover:bg-[#30d158]/20'
                  : 'bg-[#161617] border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              {isSolved ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="font-mono text-[10px] font-bold">0{scen.number}</span>
              )}
              <span>Fault 0{scen.number}</span>
            </button>
          );
        })}
      </div>

      {/* User Complaint Alert Card (NEVER reveals the cause!) */}
      <div className="p-5 rounded-[1.75rem] border border-[#ff9f0a]/30 bg-[#ff9f0a]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-[#ff9f0a]/10 border border-[#ff9f0a]/30 flex items-center justify-center text-[#ff9f0a] shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#ff9f0a] font-bold">
              User Trouble Ticket • Complaint #{currentScenario.number}
            </div>
            <p className="text-sm sm:text-base text-zinc-100 font-medium mt-1 italic">
              &ldquo;{currentScenario.userComplaint}&rdquo;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => handleCommandExecuted(currentScenario.recommendedCommand)}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
            title="Hint: Recommended first diagnostic command"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#2997ff]" />
            <span>Hint: Run {currentScenario.recommendedCommand}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Topology Map + Virtual Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Editable Topology Canvas */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <TopologyCanvas
            topology={topology}
            selectedDeviceId={activeDeviceId}
            onSelectDevice={(id) => {
              setActiveDeviceId(id);
              const dev = topology.devices[id];
              if (dev) setFixModalDevice(cloneTopology({ ...topology }).devices[id]);
            }}
            onToggleLink={handleToggleLink}
            highlightedPath={highlightedPath}
            activeHopId={activeHopId}
            isEditable={true}
            className="flex-1"
          />

          <div className="text-[11px] font-mono text-neutral-400 bg-[#161617] border border-neutral-800 p-3.5 rounded-2xl flex items-center justify-between">
            <span>Click any node to inspect/reconfigure. Click cables to disconnect/reconnect.</span>
            <span className="text-[#2997ff] font-semibold">Editable Canvas</span>
          </div>
        </div>

        {/* Right: Terminal Console */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <Terminal
            topology={topology}
            activeDeviceId={activeDeviceId}
            onDeviceChange={setActiveDeviceId}
            onCommandExecuted={handleCommandExecuted}
            className="flex-1 min-h-[400px]"
          />
        </div>
      </div>

      {/* Triage & Resolution Split: Step A: Diagnose | Step B: Fix it */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step A: Formulate Theory & Diagnose */}
        <div className="lg:col-span-7 bg-[#161617] border border-neutral-800 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-800">
            <span className="p-2 rounded-xl bg-[#2997ff]/10 text-[#2997ff]">
              <Stethoscope className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Step 1: Submit Your Formal Diagnosis
              </h4>
              <p className="text-xs text-neutral-400">
                Identify the layer, faulty device, and root cause based on command telemetry.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitDiagnosis} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Faulty Layer Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                  Faulty Layer
                </label>
                <select
                  value={selectedLayer}
                  onChange={(e) => setSelectedLayer(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-[#2997ff] focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Select OSI Layer...</option>
                  <option value="Physical Layer">Layer 1: Physical Layer (Cables/Carrier)</option>
                  <option value="Data Link Layer">Layer 2: Data Link Layer (MAC/ARP/Switch)</option>
                  <option value="Network Layer">Layer 3: Network Layer (IP/Subnet/Gateway/Routing)</option>
                  <option value="Transport Layer">Layer 4: Transport Layer (TCP/UDP Ports/Firewall)</option>
                  <option value="Application Layer">Layer 7: Application Layer (DNS/HTTP/Services)</option>
                </select>
              </div>

              {/* Faulty Device Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                  Faulty Device / Link
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-[#2997ff] focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Select Device...</option>
                  <option value="PC1">PC1 (Workstation 1)</option>
                  <option value="PC2">PC2 (Workstation 2)</option>
                  <option value="SW1">SW1 (LAN Switch)</option>
                  <option value="R1">R1 (Gateway Router)</option>
                  <option value="R2">R2 (Core Router)</option>
                  <option value="DNS">DNS Server (172.16.0.53)</option>
                  <option value="WEB">WEB Server (172.16.0.80)</option>
                </select>
              </div>
            </div>

            {/* Root Cause Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                Probable Root Cause
              </label>
              <select
                value={selectedCause}
                onChange={(e) => setSelectedCause(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-[#2997ff] focus:outline-none cursor-pointer"
                required
              >
                <option value="">Select Root Cause...</option>
                {FAULT_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.causeDescription}>
                    {s.causeDescription}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Submit Diagnostic Verdict</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Feedback & Reasoning Chain */}
          {diagnosisFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-3 animate-in fade-in duration-200 ${
                diagnosisFeedback.isCorrect
                  ? 'bg-[#30d158]/10 border-[#30d158]/30 text-zinc-200'
                  : 'bg-[#ff453a]/10 border-[#ff453a]/30 text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {diagnosisFeedback.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#30d158]" />
                    <span className="text-[#30d158]">Diagnosis Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-[#ff453a]" />
                    <span className="text-[#ff453a]">Diagnosis Needs Revision</span>
                  </>
                )}
              </div>
              <p className="text-zinc-300">{diagnosisFeedback.message}</p>

              {/* Diagnostic Commands Evaluated */}
              {diagnosisFeedback.diagnosticCommandsUsed.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                    Diagnostic Telemetry Run by You:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {diagnosisFeedback.diagnosticCommandsUsed.map((cmd, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-black/40 border border-neutral-700 font-mono text-[10px] text-[#2997ff]"
                      >
                        {cmd}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reveal Reasoning Chain */}
              {diagnosisFeedback.isCorrect && (
                <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                  <span className="text-[10px] font-mono text-[#30d158] font-bold uppercase tracking-wider block">
                    Diagnostic Reasoning Chain:
                  </span>
                  <ul className="space-y-1 pl-4 list-disc text-zinc-300">
                    {currentScenario.reasoningChain.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step B: Implement Fix & Verify */}
        <div className="lg:col-span-5 bg-[#161617] border border-neutral-800 rounded-[2rem] p-6 shadow-2xl flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-800">
              <span className="p-2 rounded-xl bg-[#30d158]/10 text-[#30d158]">
                <Wrench className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Step 2: Deploy Fix & Verify
                </h4>
                <p className="text-xs text-neutral-400">
                  Adjust configuration or cabling, then re-test against the live model.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
                Available Fix Actions:
              </span>
              <ul className="space-y-1.5 text-neutral-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]"></span>
                  <span>Click nodes on canvas to edit IP, mask, or gateway</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]"></span>
                  <span>Click cables on canvas to re-plug severed links</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleQuickFix}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Apply Standard Patch
              </button>
              <button
                type="button"
                onClick={() => setTopology(currentScenario.apply(createDefaultTopology()))}
                className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                title="Reset scenario state"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {verifyStatus === 'success' && (
              <div className="p-3.5 rounded-xl bg-[#30d158]/10 border border-[#30d158]/30 text-[#30d158] flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verification Succeeded! Scenario {currentScenario.number} Solved.</span>
              </div>
            )}

            {verifyStatus === 'fail' && (
              <div className="p-3.5 rounded-xl bg-[#ff453a]/10 border border-[#ff453a]/30 text-[#ff453a] flex items-center gap-2 text-xs font-bold">
                <XCircle className="w-4 h-4" />
                <span>Verification Failed! Fault condition still exists.</span>
              </div>
            )}

            <button
              onClick={handleVerifyFix}
              className="w-full py-3.5 rounded-xl bg-[#30d158] text-black font-bold text-xs tracking-wider uppercase hover:bg-[#30d158]/90 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(48,209,88,0.25)]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Fix & Test Path</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostic Console Log at Bottom */}
      <DiagnosticConsole
        logs={logs}
        onClear={() => setLogs([])}
        title="Live Diagnostic Bus & Event Log"
      />

      {/* Device Config Edit Modal */}
      {fixModalDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#161617] border border-neutral-800 rounded-[2rem] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h4 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#2997ff]" />
                <span>Edit Configuration: {fixModalDevice.id}</span>
              </h4>
              <button
                onClick={() => setFixModalDevice(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-neutral-400">IPv4 Address:</label>
                <input
                  type="text"
                  value={fixModalDevice.interfaces[0]?.ip || ''}
                  onChange={(e) => {
                    const next = { ...fixModalDevice };
                    if (next.interfaces[0]) next.interfaces[0].ip = e.target.value;
                    setFixModalDevice(next);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400">Subnet Mask:</label>
                <input
                  type="text"
                  value={fixModalDevice.interfaces[0]?.mask || ''}
                  onChange={(e) => {
                    const next = { ...fixModalDevice };
                    if (next.interfaces[0]) next.interfaces[0].mask = e.target.value;
                    setFixModalDevice(next);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400">Default Gateway:</label>
                <input
                  type="text"
                  value={fixModalDevice.defaultGateway || ''}
                  onChange={(e) => {
                    setFixModalDevice({
                      ...fixModalDevice,
                      defaultGateway: e.target.value,
                    });
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400">DNS Server:</label>
                <input
                  type="text"
                  value={fixModalDevice.dnsServer || ''}
                  onChange={(e) => {
                    setFixModalDevice({
                      ...fixModalDevice,
                      dnsServer: e.target.value,
                    });
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setFixModalDevice(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveDeviceEdit(fixModalDevice)}
                className="px-5 py-2 rounded-xl bg-[#2997ff] text-white text-xs font-bold hover:bg-[#2997ff]/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
