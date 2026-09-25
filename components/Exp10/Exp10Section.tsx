'use client';

import React from 'react';
import { BookOpen, CheckCircle, Cpu, Network, ShieldCheck, Terminal, Award } from 'lucide-react';
import { LAB_CONFIG } from '../../lib/config';

export function Exp10Section() {
  return (
    <section id="exp10" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      {/* Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[#34d399] font-mono text-xs uppercase tracking-widest">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curriculum Specification &bull; Course {LAB_CONFIG.courseCode}</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white">
          Experiment 10: {LAB_CONFIG.shortTitle}
        </h2>
        <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed">
          Intelligent Network Design, Simulation &amp; Fault Diagnosis System developed for {LAB_CONFIG.institution}, {LAB_CONFIG.department}.
        </p>
      </div>

      {/* Main Spec Card */}
      <div className="rounded-[2.5rem] bg-[#0a0f0d]/85 backdrop-blur-2xl border border-white/10 p-6 sm:p-10 shadow-[0_16px_48px_rgba(0,0,0,0.6)] space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block font-semibold">
              Course Details
            </span>
            <div className="text-base font-bold text-white font-sans">{LAB_CONFIG.courseName}</div>
            <div className="text-xs text-neutral-400 font-mono">Code: {LAB_CONFIG.courseCode} &bull; Term: Spring 2026</div>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block font-semibold">
              Pedagogical Objective
            </span>
            <div className="text-xs text-neutral-200 leading-relaxed font-sans">
              Climb the OSI stack systematically from Physical Layer 1 through Application Layer 7 to isolate root cause faults deterministically.
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block font-semibold">
              Platform Architecture
            </span>
            <div className="text-xs text-neutral-200 leading-relaxed font-sans">
              100% in-browser client-side simulation engine, zero cloud dependencies, WebGL2 steel fluid backdrop, and interactive terminal state machines.
            </div>
          </div>
        </div>

        {/* Learning Outcomes List */}
        <div className="space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-semibold block">
            Key Learning Outcomes &amp; Technical Competencies:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans text-neutral-200">
            <div className="p-4 rounded-xl bg-[#070b09] border border-white/10 space-y-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <div className="font-semibold text-white">Utility Internals</div>
              <p className="text-neutral-400 text-[11px] leading-snug">
                Deep packet inspection of ICMP Type 8/0, TTL decrements, ARP cache mapping, and TCP 3-way handshakes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#070b09] border border-white/10 space-y-1.5">
              <Network className="w-4 h-4 text-sky-400" />
              <div className="font-semibold text-white">Layered Isolation</div>
              <p className="text-neutral-400 text-[11px] leading-snug">
                Eliminating false theories by verifying lower layers before debugging high-level socket software.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#070b09] border border-white/10 space-y-1.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              <div className="font-semibold text-white">Fault Signature Triage</div>
              <p className="text-neutral-400 text-[11px] leading-snug">
                Differentiating between ARP timeouts, gateway unreachable, APIPA 169.254, and firewall drops.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#070b09] border border-white/10 space-y-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <div className="font-semibold text-white">Systems Programming</div>
              <p className="text-neutral-400 text-[11px] leading-snug">
                Building non-blocking reachability socket probes in C, C++, Python, and Java with RTT instrumentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
