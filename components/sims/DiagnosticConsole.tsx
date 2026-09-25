'use client';

import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

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
        return 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/30';
      case 'check':
        return 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/30';
      case 'success':
        return 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/30';
      case 'error':
        return 'text-[#f87171] bg-[#f87171]/10 border-[#f87171]/30';
      case 'osi':
        return 'text-[#c8b27a] bg-[#c8b27a]/10 border-[#c8b27a]/30';
      default:
        return 'text-[#78b496] bg-[#78b496]/10 border-[#78b496]/20';
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
      className={`bg-[#0a0f0d] border border-[#78b496]/20 rounded-[1.75rem] flex flex-col overflow-hidden shadow-2xl ${className}`}
    >
      {/* Console Header */}
      <div className="px-5 py-3 border-b border-[#78b496]/15 flex items-center justify-between bg-[#101713]/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-[#34d399]" />
          <span className="text-[11px] font-display uppercase tracking-widest text-[#78b496]">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#101713] border border-[#78b496]/20 text-[10px] font-mono text-[#78b496]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse shadow-[0_0_6px_#34d399]"></span>
            <span>Live Kernel</span>
          </div>
          {onClear && (
            <button
              onClick={onClear}
              title="Clear Console Log"
              className="text-[#78b496]/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1f7a4d]/20 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-5 font-mono text-[11px] leading-relaxed space-y-2 min-h-[140px] max-h-[220px] select-text bg-[#070c09]/90 [scrollbar-width:thin] [scrollbar-color:#1a2e22_transparent]"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#78b496]/50 text-xs italic font-sans py-8">
            Diagnostic events and telemetry logs will stream here...
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 text-[#c9dccf] font-mono tracking-tight group hover:bg-[#34d399]/[0.03] p-0.5 rounded transition-colors"
            >
              <span className="text-[#78b496]/50 text-[10px] shrink-0 select-none pt-0.5">
                {log.timestamp}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold shrink-0 uppercase tracking-wider ${getTypeColor(
                  log.type
                )}`}
              >
                {getBadgeText(log.type)}
              </span>
              <span className="break-all flex-1 text-[#c9dccf] font-normal">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
