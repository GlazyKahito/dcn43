'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { LAB_CONFIG } from '../lib/config';
import { ArrowUp, Menu, X } from 'lucide-react';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { href: '#aim', label: 'Aim' },
    { href: '#theory', label: 'Theory' },
    { href: '#pre-test', label: 'Pre-Test' },
    { href: '#simulation', label: 'Simulation' },
    { href: '#post-test', label: 'Post-Test' },
    { href: '#conclusion', label: 'Conclusion' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-black/85 backdrop-blur-2xl border-neutral-800 shadow-xl'
          : 'bg-black/60 backdrop-blur-md border-neutral-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand & Experiment metadata */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-neutral-700/80 flex items-center justify-center p-1 shadow-sm overflow-hidden shrink-0">
            <Image
              src="/somaiya-logo.png"
              alt="Somaiya Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs tracking-wider uppercase text-[#2997ff] font-medium block">
                VLab &bull; Experiment {LAB_CONFIG.experimentNumber}
              </span>
              <span className="hidden md:inline-block text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
                {LAB_CONFIG.institutionShort}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-white hidden sm:block">
              {LAB_CONFIG.experimentTitle}
            </h1>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={scrollToTop}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-1.5 cursor-pointer"
            title="Scroll to top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Top</span>
          </button>

          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={scrollToTop}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/60"
            title="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/60"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-800 bg-black/95 px-6 py-4 space-y-2 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-neutral-300 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
