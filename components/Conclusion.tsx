import React from 'react';
import { CheckCircle2, Check } from 'lucide-react';

export function Conclusion() {
  return (
    <section id="conclusion" className="scroll-mt-24 max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Conclusion Card */}
      <div className="border border-neutral-800 bg-[#161617] rounded-[2.25rem] p-6 sm:p-10 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#30d158]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/20 flex items-center justify-center text-[#30d158]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#30d158] font-bold">
            Lab Outcome & Synthesis
          </span>
        </div>

        <div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
            Conclusion
          </h3>
          <div className="p-5 sm:p-6 rounded-2xl border-l-4 border-[#30d158] bg-black/40 text-sm sm:text-base text-zinc-200 font-medium leading-relaxed space-y-3">
            <p>
              Systematic network troubleshooting replaces erratic guesswork with a disciplined, reproducible engineering methodology. By climbing the Open Systems Interconnection (OSI) stack from Physical Layer 1 through Application Layer 7, each diagnostic utility—<strong>ping</strong> for Layer 3 reachability, <strong>tracert</strong> for transit hop localization, <strong>ipconfig</strong> for interface parameters, <strong>arp -a</strong> for Layer 2 MAC resolution, <strong>telnet</strong> for Layer 4 port accessibility, and <strong>nslookup</strong> for Layer 7 DNS translation—rules in root causes while ruling out healthy subsystems.
            </p>
            <p className="text-xs sm:text-sm text-neutral-400">
              Through the eight simulated fault conditions, students demonstrated that physical link carrier status, correct subnet mask calculation, default gateway validity, asymmetric routing return paths, and host firewall access control lists (ACLs) are each essential prerequisites for end-to-end network communication.
            </p>
          </div>
        </div>
      </div>

      {/* Experiment Complete Badge */}
      <div className="flex flex-col items-center justify-center text-center pt-2 pb-24">
        <div className="w-12 h-12 rounded-full bg-[#30d158]/10 border border-[#30d158]/25 flex items-center justify-center mb-3 text-[#30d158] shadow-[0_0_20px_rgba(48,209,88,0.2)]">
          <Check className="w-6 h-6 stroke-[2.5]" />
        </div>
        <p className="text-base font-semibold text-white tracking-tight">
          Experiment Complete.
        </p>
        <p className="text-xs font-mono text-neutral-500 mt-1">
          K J Somaiya School of Engineering &bull; Department of Computer Engineering
        </p>
      </div>
    </section>
  );
}
