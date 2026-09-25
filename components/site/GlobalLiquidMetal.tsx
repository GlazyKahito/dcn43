'use client';

import React from 'react';
import { LiquidMetal } from '../smoothui/liquid-metal';

/**
 * Global Liquid Metal Background System
 * 
 * - Full viewport fixed backdrop (100vw, 100vh, fixed inset-0, z-0)
 * - Authentic WebGL2 domain-warped shader effect from 21st.dev / SmoothUI
 * - Interactive pointer flow tracking across the whole window without blocking clicks
 * - Subtle dark vignette and contrast veil ensuring 100% text readability
 * - Zero layout shift, no scrollbars, hardware-accelerated
 */
export function GlobalLiquidMetal() {
  return (
    <div
      className="fixed inset-0 w-screen h-screen -z-10 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* 1. Authentic WebGL2 Liquid Metal Canvas */}
      <LiquidMetal
        variant="chrome"
        speed={0.65}
        distortion={1.1}
        globalTracking={true}
        className="w-full h-full bg-[#050807]"
      />

      {/* 2. Soft Dark Obsidian & Emerald Atmospheric Veil */}
      {/* Ensures all text, badges, cards, and buttons remain ultra-high contrast and readable */}
      <div className="absolute inset-0 bg-[#030605]/50 backdrop-blur-[0.5px] pointer-events-none" />

      {/* 3. Deep Vignette and Ambient Radial Shadows */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#030605]/40 to-[#020403]/90 pointer-events-none" />

      {/* 4. Subtle Emerald Light Pool (Harmonizes with Somaiya brand & cybersecurity theme) */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-teal-500/08 rounded-full blur-[160px] pointer-events-none" />
    </div>
  );
}

export default GlobalLiquidMetal;
