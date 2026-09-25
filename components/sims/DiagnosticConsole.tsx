'use client';

import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, ShieldCheck } from 'lucide-react';

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  type: 'info' | 'fault' | 'check' | 'success' | 'error' | 'osi';
  message: string;
}

interface DiagnosticConsoleProps {
  logs: DiagnosticLog[];
  onClear?: () => void;
  className?: string;
  title?: string;
}

export function DiagnosticConsole({
  logs,
  onClear,
  className = '',
  title = 'Diagnostic Console',
}: DiagnosticConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeColor = (type: DiagnosticLog['type']) => {
    switch (type) {
      case 'fault':
        return 'text-[#ff453a] bg-[#ff453a]/10 border-[#ff453a]/30';
      case 'check':
        return 'text-[#2997ff] bg-[#2997ff]/10 border-[#2997ff]/30';
      case 'success':
        return 'text-[#30d158] bg-[#30d158]/10 border-[#30d158]/30';
      case 'error':
        return 'text-[#ff453a] bg-[#ff453a]/10 border-[#ff453a]/30';
      case 'osi':
        return 'text-[#ff9f0a] bg-[#ff9f0a]/10 border-[#ff9f0a]/30';
      default:
        return 'text-neutral-400 bg-neutral-800/40 border-neutral-700/50';
    }
  };

  const getBadgeText = (type: DiagnosticLog['type']) => {
    switch (type) {
      case 'fault':
        return '[FAULT]';
      case 'check':
        return '[CHECK]';
      case 'success':
        return '[PASS]';
      case 'error':
        return '[FAIL]';
      case 'osi':
        return '[OSI]';
      default:
        return '[INFO]';
    }
  };

  return (
    <div
      className={`bg-[#161617] border border-neutral-800 rounded-[1.75rem] flex flex-col overflow-hidden shadow-2xl ${className}`}
    >
      {/* Console Header */}
      <div className="px-5 py-3.5 border-b border-neutral-800/90 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-neutral-400" />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-neutral-400">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse"></span>
            <span>Live Kernel</span>
          </div>
          {onClear && (
            <button
              onClick={onClear}
              title="Clear Console Log"
              className="text-neutral-500 hover:text-neutral-300 transition-colors p-1 rounded-lg hover:bg-neutral-800/50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-5 font-mono text-[11px] leading-relaxed space-y-2 min-h-[140px] max-h-[220px] select-text bg-[#0e0e10]/80 [scrollbar-width:thin] [scrollbar-color:#333_transparent]"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-600 text-xs italic font-sans py-8">
            Diagnostic events and telemetry logs will stream here...
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 text-zinc-300 font-mono tracking-tight group hover:bg-white/[0.02] p-0.5 rounded transition-colors"
            >
              <span className="text-neutral-600 text-[10px] shrink-0 select-none pt-0.5">
                {log.timestamp}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold shrink-0 uppercase tracking-wider ${getTypeColor(
                  log.type
                )}`}
              >
                {getBadgeText(log.type)}
              </span>
              <span className="break-all flex-1 text-zinc-300 font-normal">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
