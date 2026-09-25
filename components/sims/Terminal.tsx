'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TopologyModel } from '../../lib/net/topology';
import {
  runCommand,
  COMMAND_CHEAT_SHEET,
  SUPPORTED_COMMANDS,
  CommandOutputLine,
} from '../../lib/net/commands';
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  BookOpen,
  X,
} from 'lucide-react';

interface TerminalProps {
  topology: TopologyModel;
  activeDeviceId?: string;
  onDeviceChange?: (deviceId: string) => void;
  onCommandExecuted?: (cmd: string, pathDevices?: string[]) => void;
  onHopActive?: (hopDeviceId?: string) => void;
  className?: string;
  allowDeviceSelect?: boolean;
}

interface TerminalHistoryEntry {
  id: string;
  prompt: string;
  input: string;
  lines: CommandOutputLine[];
}

export function Terminal({
  topology,
  activeDeviceId = 'PC1',
  onDeviceChange,
  onCommandExecuted,
  onHopActive,
  className = '',
  allowDeviceSelect = true,
}: TerminalProps) {
  const [currentDevice, setCurrentDevice] = useState<string>(activeDeviceId);
  const [inputValue, setInputValue] = useState<string>('');
  const [history, setHistory] = useState<TerminalHistoryEntry[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);
  const [activeStreamingLines, setActiveStreamingLines] = useState<CommandOutputLine[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<boolean>(false);

  // Sync internal device state with parent prop if controlled
  useEffect(() => {
    if (activeDeviceId && activeDeviceId !== currentDevice) {
      setCurrentDevice(activeDeviceId);
    }
  }, [activeDeviceId, currentDevice]);

  const handleDeviceChange = (devId: string) => {
    setCurrentDevice(devId);
    onDeviceChange?.(devId);
  };

  const getPrompt = useCallback((devId: string) => {
    const dev = topology.devices[devId];
    if (!dev) return 'PC1> ';
    if (dev.type === 'router') return `${dev.id}# `;
    if (dev.type === 'server') return `root@${dev.id.toLowerCase()}:~# `;
    return `C:\\Users\\Student\\${dev.id}> `;
  }, [topology.devices]);

  const scrollToBottom = useCallback(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, activeStreamingLines, scrollToBottom]);

  // Focus input whenever terminal is clicked
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Execute a command with line-by-line realistic streaming
  const execute = async (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    // Command history
    setCmdHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    setInputValue('');

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    // Check clear
    if (cmd === 'clear' || cmd === 'cls') {
      setHistory([]);
      setActiveStreamingLines([]);
      return;
    }

    setIsRunning(true);
    abortControllerRef.current = false;

    const result = runCommand(trimmed, topology, currentDevice);
    onCommandExecuted?.(trimmed, result.pathDevices);

    const promptText = getPrompt(currentDevice);
    const currentEntryId = `entry-${Date.now()}`;

    setActiveStreamingLines([]);

    const streamLines: CommandOutputLine[] = [];

    for (let i = 0; i < result.lines.length; i++) {
      if (abortControllerRef.current) {
        streamLines.push({
          text: '^C (Process interrupted by user)',
          type: 'warning',
        });
        break;
      }

      const line = result.lines[i];
      streamLines.push(line);
      setActiveStreamingLines([...streamLines]);

      if (line.highlightDeviceId) {
        onHopActive?.(line.highlightDeviceId);
      }

      const delay = Math.min(line.delayMs || 35, 300);
      await new Promise((r) => setTimeout(r, delay));
    }

    onHopActive?.(undefined);

    setHistory((prev) => [
      ...prev,
      {
        id: currentEntryId,
        prompt: promptText,
        input: trimmed,
        lines: streamLines,
      },
    ]);
    setActiveStreamingLines([]);
    setIsRunning(false);
  };

  const handleStop = () => {
    abortControllerRef.current = true;
    setIsRunning(false);
    onHopActive?.(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isRunning) {
        execute(inputValue);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputValue(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdHistory.length === 0 || historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIndex(-1);
        setInputValue('');
      } else {
        setHistoryIndex(nextIdx);
        setInputValue(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const current = inputValue.trim().toLowerCase();
      if (!current) return;

      const match = SUPPORTED_COMMANDS.find((c) => c.startsWith(current));
      if (match) {
        setInputValue(match);
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      if (isRunning) {
        handleStop();
      }
    }
  };

  return (
    <div
      onClick={focusInput}
      className={`relative bg-[#070c09] border border-[#78b496]/20 rounded-[2rem] flex flex-col overflow-hidden shadow-2xl font-mono text-xs sm:text-sm ${className}`}
    >
      {/* Terminal Title Bar */}
      <div className="px-5 py-3 border-b border-[#78b496]/15 flex flex-wrap items-center justify-between gap-3 bg-[#0a0f0d]/90 backdrop-blur-md select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90 inline-block border border-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90 inline-block border border-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90 inline-block border border-[#27c93f]" />
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-[#78b496]/20 text-[#78b496] font-display text-xs">
            <TerminalIcon className="w-3.5 h-3.5 text-[#34d399]" />
            <span>TERMINAL // EMULATOR</span>
          </div>
        </div>

        {/* Device Selector & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {allowDeviceSelect && (
            <div className="flex items-center gap-1.5 bg-[#101713] border border-[#78b496]/20 px-2.5 py-1 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-[#78b496]/70">Node:</span>
              <select
                value={currentDevice}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="bg-transparent text-[#e8f2ec] font-mono text-xs focus:outline-none cursor-pointer"
              >
                <option value="PC1" className="bg-[#0a0f0d] text-[#e8f2ec]">PC1 (192.168.1.10)</option>
                <option value="PC2" className="bg-[#0a0f0d] text-[#e8f2ec]">PC2 (192.168.1.11)</option>
                <option value="R1" className="bg-[#0a0f0d] text-[#e8f2ec]">R1 (Gateway)</option>
                <option value="WEB" className="bg-[#0a0f0d] text-[#e8f2ec]">WEB (172.16.0.80)</option>
              </select>
            </div>
          )}

          {/* Stop / Running Button */}
          {isRunning ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStop();
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#f87171]/20 border border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/30 transition-colors text-xs font-semibold cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCheatSheet(!showCheatSheet);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1f7a4d]/20 border border-[#34d399]/30 text-[#34d399] hover:text-white hover:bg-[#1f7a4d]/40 transition-colors text-xs cursor-pointer font-sans"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cheat Sheet</span>
            </button>
          )}
        </div>
      </div>

      {/* Cheat Sheet Drawer */}
      {showCheatSheet && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0a0f0d] border-b border-[#78b496]/20 p-4 sm:p-5 text-xs select-text animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-[#34d399] uppercase tracking-wider text-[11px]">
              Command Quick Reference & Diagnostics
            </span>
            <button
              onClick={() => setShowCheatSheet(false)}
              className="text-[#78b496]/70 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div data-lenis-prevent className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {COMMAND_CHEAT_SHEET.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setInputValue(item.example);
                  focusInput();
                }}
                className="p-2.5 rounded-xl border border-[#78b496]/15 bg-[#101713]/80 hover:border-[#34d399]/40 hover:bg-[#13231a] cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#34d399] text-xs font-mono">{item.cmd}</span>
                  <span className="text-[10px] text-[#78b496]/60 underline">Insert</span>
                </div>
                <p className="text-[11px] text-[#78b496]/80 mt-1 leading-snug">{item.question}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terminal Output Body */}
      <div data-lenis-prevent className="flex-1 p-5 sm:p-6 overflow-y-auto min-h-[300px] max-h-[460px] space-y-4 select-text leading-relaxed [scrollbar-width:thin] [scrollbar-color:#1a2e22_transparent]">
        {/* Welcome message */}
        {history.length === 0 && activeStreamingLines.length === 0 && (
          <div className="text-[#78b496]/60 space-y-1.5 py-2 font-mono text-xs">
            <div>Somaiya Virtual Diagnostics Kernel [Version 10.0.19045]</div>
            <div>(c) Network Diagnostics & Simulation Lab. Department of Computer Engineering.</div>
            <div className="pt-2 text-[#78b496]/80">
              Type <span className="text-[#34d399] font-bold">help</span> to view all commands, or click commands from the cheat sheet.
            </div>
          </div>
        )}

        {/* Prior history entries */}
        {history.map((entry) => (
          <div key={entry.id} className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#78b496]">
              <span className="text-[#34d399] font-semibold">{entry.prompt}</span>
              <span className="text-white font-bold">{entry.input}</span>
            </div>
            <div className="space-y-0.5 pl-2 sm:pl-3">
              {entry.lines.map((l, lIdx) => (
                <div
                  key={lIdx}
                  className={`${
                    l.type === 'error'
                      ? 'text-[#f87171]'
                      : l.type === 'success'
                      ? 'text-[#34d399]'
                      : l.type === 'warning'
                      ? 'text-[#c8b27a]'
                      : l.type === 'header'
                      ? 'text-white font-semibold'
                      : l.type === 'info'
                      ? 'text-[#78b496]'
                      : 'text-[#c9dccf]'
                  }`}
                >
                  {l.text || '\u00A0'}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Currently streaming active command lines */}
        {isRunning && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#78b496]">
              <span className="text-[#34d399] font-semibold">{getPrompt(currentDevice)}</span>
              <span className="text-white font-bold">{inputValue}</span>
            </div>
            <div className="space-y-0.5 pl-2 sm:pl-3">
              {activeStreamingLines.map((l, lIdx) => (
                <div
                  key={lIdx}
                  className={`${
                    l.type === 'error'
                      ? 'text-[#f87171]'
                      : l.type === 'success'
                      ? 'text-[#34d399]'
                      : l.type === 'warning'
                      ? 'text-[#c8b27a]'
                      : l.type === 'header'
                      ? 'text-white font-semibold'
                      : l.type === 'info'
                      ? 'text-[#78b496]'
                      : 'text-[#c9dccf]'
                  }`}
                >
                  {l.text || '\u00A0'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active command line input prompt */}
        {!isRunning && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[#34d399] font-semibold select-none">
              {getPrompt(currentDevice)}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              className="flex-1 bg-transparent text-white font-mono text-xs sm:text-sm focus:outline-none border-none p-0 tracking-wide"
            />
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
