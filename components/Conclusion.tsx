'use client';

import React from 'react';
import { CheckCircle2, Check, ArrowUp, ExternalLink, ShieldCheck } from 'lucide-react';
import { DotMatrixCube } from './site/DotMatrixCube';
import { LAB_CONFIG } from '../lib/config';
import { MetalButton } from './ui/liquid-glass-button';

export function Conclusion() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="conclusion" className="relative scroll-mt-24 pt-16 pb-20 overflow-hidden">
      {/* Background Gradient into Deep Emerald */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#071710] to-[#050e09] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
        {/* Conclusion Card */}
        <div className="border border-white/10 bg-[#0a0f0d]/65 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-12 space-y-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#34d399]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1f7a4d]/20 border border-[#34d399]/30 flex items-center justify-center text-[#34d399] shadow-[0_0_12px_rgba(52,211,153,0.25)]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#34d399] font-semibold">
              Laboratory Findings &bull; Synthesis
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-4xl font-sans font-semibold tracking-tight text-white mb-4">
              Conclusion
            </h3>
            <div className="p-6 sm:p-8 rounded-2xl border-l-4 border-[#34d399] bg-[#070c09]/70 backdrop-blur-xl text-sm sm:text-base text-[#c9dccf] font-sans font-normal leading-relaxed space-y-4 shadow-inner">
              <p>
                Systematic network troubleshooting replaces erratic guesswork with a disciplined, reproducible engineering methodology. By climbing the Open Systems Interconnection (OSI) stack from Physical Layer 1 through Application Layer 7, each diagnostic utility—<strong>ping</strong> for Layer 3 reachability, <strong>tracert</strong> for transit hop localization, <strong>ipconfig</strong> for interface parameters, <strong>arp -a</strong> for Layer 2 MAC resolution, <strong>telnet</strong> for Layer 4 port accessibility, and <strong>nslookup</strong> for Layer 7 DNS translation—rules in root causes while ruling out healthy subsystems.
              </p>
              <p className="text-xs sm:text-sm text-[#78b496]/90">
                Through the eight simulated fault conditions, students demonstrated that physical link carrier status, correct subnet mask calculation, default gateway validity, asymmetric routing return paths, and host firewall access control lists (ACLs) are each essential prerequisites for end-to-end network communication.
              </p>
            </div>
          </div>
        </div>

        {/* 3D Rotating Dot Matrix Cube with Experiment Complete Status */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 pt-4">
          <DotMatrixCube className="mx-auto" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1f7a4d]/20 border border-[#34d399]/40 text-[#34d399] text-xs font-mono tracking-widest uppercase shadow-[0_0_20px_rgba(52,211,153,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse shadow-[0_0_8px_#34d399]" />
            Experiment 10 &bull; Laboratory Complete
          </div>
          <h4 className="text-xl sm:text-2xl font-sans font-semibold text-white tracking-tight">
            Network Diagnostic Session Concluded
          </h4>
          <p className="text-xs sm:text-sm text-[#78b496]/80 font-sans max-w-md">
            All telemetry metrics, simulated packet captures, and fault triage verifications have been synthesized into client state.
          </p>
        </div>

        {/* 3-Column lab0-style Footer */}
        <div className="pt-12 border-t border-[#78b496]/15">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
            {/* Col 1: LAB */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#34d399] block font-semibold">
                01 &bull; Laboratory Specification
              </span>
              <h5 className="text-sm font-sans font-semibold text-white">
                {LAB_CONFIG.experimentTitle}
              </h5>
              <p className="text-xs text-[#78b496]/70 leading-relaxed font-sans">
                Interactive client-side simulation suite covering OSI Layer 1-7 diagnostic tools, fault injection scenarios, and live packet path tracing.
              </p>
              <div className="pt-1 font-mono text-[11px] text-[#78b496]/60">
                COURSE: <span className="text-white font-medium">{LAB_CONFIG.courseCode} — {LAB_CONFIG.courseName}</span>
              </div>
            </div>

            {/* Col 2: RESOURCES */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#34d399] block font-semibold">
                02 &bull; Standards &amp; RFCs
              </span>
              <ul className="space-y-2 text-xs font-mono text-[#c9dccf]">
                <li className="flex items-center gap-1.5 hover:text-[#34d399] transition-colors">
                  <span>&bull;</span>
                  <span>RFC 792 — Internet Control Message Protocol (ICMP)</span>
                </li>
                <li className="flex items-center gap-1.5 hover:text-[#34d399] transition-colors">
                  <span>&bull;</span>
                  <span>RFC 826 — Ethernet Address Resolution Protocol (ARP)</span>
                </li>
                <li className="flex items-center gap-1.5 hover:text-[#34d399] transition-colors">
                  <span>&bull;</span>
                  <span>RFC 1035 — Domain Names: Implementation & Spec</span>
                </li>
                <li className="flex items-center gap-1.5 hover:text-[#34d399] transition-colors">
                  <span>&bull;</span>
                  <span>RFC 1122 — Requirements for Internet Hosts</span>
                </li>
              </ul>
            </div>

            {/* Col 3: INSTITUTE */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#34d399] block font-semibold">
                03 &bull; Academic Department
              </span>
              <div className="text-xs text-[#c9dccf] space-y-1 font-sans">
                <div className="font-semibold text-white">{LAB_CONFIG.institution}</div>
                <div className="text-[#78b496]/80">{LAB_CONFIG.department}</div>
                <div className="text-[#78b496]/60 text-[11px]">Vidyavihar (East), Mumbai - 400 077, India</div>
              </div>
              <div className="pt-2">
                <MetalButton
                  variant="success"
                  onClick={scrollToTop}
                  className="font-mono text-xs h-8 px-3.5 flex items-center gap-2"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Back to Top</span>
                </MetalButton>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-6 border-t border-[#78b496]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78b496]/60 font-mono">
            <div>
              &copy; {new Date().getFullYear()} {LAB_CONFIG.institutionShort}. Built for Virtual Lab curriculum.
            </div>
            <div className="flex items-center gap-4">
              <span>Interactive Simulator</span>
              <span>&bull;</span>
              <span>Client-Side Execution</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
