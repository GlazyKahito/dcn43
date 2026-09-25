'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { LAB_CONFIG } from '../lib/config';
import { RollText } from './site/RollText';
import { LiquidButton } from './ui/liquid-glass-button';
import {
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Layers,
  Terminal,
  ShieldAlert,
  BookOpen,
  HelpCircle,
  Activity,
  CheckCircle2,
  Gamepad2,
} from 'lucide-react';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Background Dim & Blur overlay when dropdown is open (matches lab0.ai 09-nav-dropdown-blur.png) */}
      {activeDropdown && (
        <div
          onClick={() => setActiveDropdown(null)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Floating Inset Navbar (Glass UI) */}
      <div className="sticky top-0 z-50 w-full px-4 sm:px-6 pt-3 pointer-events-none">
        <header
          className={`pointer-events-auto max-w-5xl mx-auto rounded-2xl transition-all duration-300 border ${
            isScrolled || activeDropdown
              ? 'bg-[#0a0f0d]/80 backdrop-blur-3xl border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.12)]'
              : 'bg-[#080d0b]/65 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]'
          }`}
        >
          <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/95 border border-hairline flex items-center justify-center p-1 shadow-sm overflow-hidden shrink-0">
                <Image
                  src="/somaiya-logo.png"
                  alt="Somaiya Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <a href="#" className="flex items-center gap-1.5 font-mono text-sm tracking-tight text-white group">
                <span className="font-bold text-white tracking-wider">&gt;_ vlab</span>
                <span className="text-[#34d399] font-medium">.troubleshoot</span>
                <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-homevideo font-normal bg-emerald-solid/30 border border-emerald-glow/30 text-[#34d399] tracking-wider">
                  EXP {LAB_CONFIG.experimentNumber}
                </span>
              </a>
            </div>

            {/* Desktop Center Nav with Interactive Dropdowns */}
            <nav className="hidden lg:flex items-center gap-1">
              <a
                href="#aim"
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                <RollText text="Aim" />
              </a>

              {/* Theory Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'theory' ? null : 'theory')
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    activeDropdown === 'theory'
                      ? 'text-white bg-white/[0.08]'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <RollText text="Theory" />
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-neutral-400 ${
                      activeDropdown === 'theory' ? 'rotate-180 text-[#34d399]' : ''
                    }`}
                  />
                </button>

                {activeDropdown === 'theory' && (
                  <div className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl bg-[#0a0f0d]/85 backdrop-blur-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-1 animate-in slide-in-from-top-2 duration-150">
                    <a
                      href="#module-01"
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-xl hover:bg-white/[0.08] backdrop-blur-md transition-all flex items-start gap-2.5 group"
                    >
                      <Layers className="w-4 h-4 text-[#34d399] mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#34d399] transition-colors">
                          01 The Layered Approach
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          OSI L1-L7 bottom-up methodology
                        </div>
                      </div>
                    </a>
                    <a
                      href="#module-02"
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-all flex items-start gap-2.5 group"
                    >
                      <Terminal className="w-4 h-4 text-[#34d399] mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#34d399] transition-colors">
                          02 Diagnostic Toolbox
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          ping, tracert, ipconfig, nslookup, arp
                        </div>
                      </div>
                    </a>
                    <a
                      href="#module-03"
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-all flex items-start gap-2.5 group"
                    >
                      <ShieldAlert className="w-4 h-4 text-[#34d399] mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#34d399] transition-colors">
                          03 Common Fault Matrix
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Signatures, symptoms, and fixes
                        </div>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Simulation Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'sims' ? null : 'sims')
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    activeDropdown === 'sims'
                      ? 'text-white bg-white/[0.08]'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <RollText text="Simulations" />
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-neutral-400 ${
                      activeDropdown === 'sims' ? 'rotate-180 text-[#34d399]' : ''
                    }`}
                  />
                </button>

                {activeDropdown === 'sims' && (
                  <div className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl bg-[#0a0f0d]/85 backdrop-blur-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-1 animate-in slide-in-from-top-2 duration-150">
                    <a
                      href="#simulation"
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-xl hover:bg-white/[0.08] backdrop-blur-md transition-all flex items-start gap-2.5 group"
                    >
                      <Terminal className="w-4 h-4 text-[#34d399] mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#34d399]">
                          Sim 01 • Virtual Terminal
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Live path tracing & command console
                        </div>
                      </div>
                    </a>
                    <a
                      href="#simulation"
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-all flex items-start gap-2.5 group"
                    >
                      <ShieldAlert className="w-4 h-4 text-[#ff9f0a] mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#ff9f0a]">
                          Sim 02 • Fault Injection Lab
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          8 pre-built faults & root cause triage
                        </div>
                      </div>
                    </a>
                    <a
                      href="#simulation"
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-all flex items-start gap-2.5 group"
                    >
                      <Layers className="w-4 h-4 text-[#34d399] mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#34d399]">
                          Sim 03 • OSI Walkthrough
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Bottom-up layer step evaluator
                        </div>
                      </div>
                    </a>
                    <a
                      href="#simulation"
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-all flex items-start gap-2.5 group"
                    >
                      <Gamepad2 className="w-4 h-4 text-[#c8b27a] mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#c8b27a]">
                          Sim 04 • Packet X-Flow (Mini-Game)
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Vintage arcade net defender
                        </div>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Assessments Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'tests' ? null : 'tests')
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    activeDropdown === 'tests'
                      ? 'text-white bg-white/[0.08]'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <RollText text="Assessments" />
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-neutral-400 ${
                      activeDropdown === 'tests' ? 'rotate-180 text-[#34d399]' : ''
                    }`}
                  />
                </button>

                {activeDropdown === 'tests' && (
                  <div className="absolute top-full left-0 mt-2 w-64 p-2 rounded-2xl bg-[#0a0f0d]/85 backdrop-blur-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-1 animate-in slide-in-from-top-2 duration-150">
                    <a
                      href="#pre-test"
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-xl hover:bg-white/[0.08] backdrop-blur-md transition-all flex items-start gap-2.5 group"
                    >
                      <HelpCircle className="w-4 h-4 text-[#38bdf8] mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#38bdf8]">
                          Phase 1 • Pre-Test
                        </div>
                        <div className="text-[10px] text-neutral-400">10 baseline diagnostic MCQs</div>
                      </div>
                    </a>
                    <a
                      href="#post-test"
                      onClick={() => setActiveDropdown(null)}
                      className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-all flex items-start gap-2.5 group"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#34d399] mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#34d399]">
                          Phase 2 • Post-Test
                        </div>
                        <div className="text-[10px] text-neutral-400">10 advanced scenario MCQs</div>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              <a
                href="#minigame"
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#c8b27a] hover:text-white bg-[#c8b27a]/10 hover:bg-[#c8b27a]/20 border border-[#c8b27a]/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(200,178,122,0.15)]"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-[#c8b27a]" />
                <span>Mini-Game</span>
              </a>

              <a
                href="#conclusion"
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                <RollText text="Conclusion" />
              </a>
            </nav>

            {/* Right Action Button with Liquid Glass */}
            <div className="flex items-center gap-3">
              <LiquidButton
                type="button"
                onClick={() => {
                  const el = document.getElementById('simulation');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                size="default"
                className="hidden sm:inline-flex text-white font-display text-xs cursor-pointer group"
              >
                <span className="inline-flex items-center gap-2">
                  <span>Launch Lab</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 text-[#34d399]" />
                </span>
              </LiquidButton>

              {/* Mobile menu trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer (Glass UI) */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-white/10 px-6 py-4 space-y-2 bg-[#0a0f0d]/90 backdrop-blur-3xl rounded-b-2xl">
              <a
                href="#aim"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-medium text-neutral-300 hover:text-white"
              >
                Aim
              </a>
              <a
                href="#theory"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-medium text-neutral-300 hover:text-white"
              >
                Theory Reference
              </a>
              <a
                href="#pre-test"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-medium text-neutral-300 hover:text-white"
              >
                Pre-Test Assessment
              </a>
              <a
                href="#simulation"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-medium text-[#34d399]"
              >
                Interactive Simulations
              </a>
              <a
                href="#minigame"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-medium text-[#c8b27a] font-bold"
              >
                🎮 Packet X-Flow Mini-Game
              </a>
              <a
                href="#post-test"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-medium text-neutral-300 hover:text-white"
              >
                Post-Test Assessment
              </a>
              <a
                href="#conclusion"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-xs font-medium text-neutral-300 hover:text-white"
              >
                Conclusion
              </a>
            </div>
          )}
        </header>
      </div>
    </>
  );
}
