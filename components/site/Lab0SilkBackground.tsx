'use client';

import React from 'react';

/**
 * Authentic lab0.ai Silk Wave Ribbon Background
 * Directly modeled from lab0.ai reference (media_1790315320872.png):
 * - Pitch obsidian base (#030705 / #050807)
 * - Cascading Emerald Aurora Silk Ribbon sweeping diagonally from top-right across the canvas
 * - Glowing white-mint radiant core filament with soft bloom
 * - Soft layered translucent silk folds and radial green atmospheric lighting
 * - 100% responsive, hardware-accelerated, zero-layout-shift, pointer-events-none
 */
export function Lab0SilkBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden w-full h-full select-none"
      aria-hidden="true"
    >
      {/* 1. Deep Obsidian Base Layer */}
      <div className="absolute inset-0 bg-[#030605]" />

      {/* 2. Soft Atmospheric Radial Green Glows */}
      {/* Upper-right dominant bloom */}
      <div
        className="absolute -top-20 -right-20 w-[800px] h-[800px] rounded-full blur-[140px] opacity-60 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.15) 45%, transparent 70%)',
        }}
      />
      {/* Mid-screen ambient glow */}
      <div
        className="absolute top-1/3 right-1/4 w-[650px] h-[650px] rounded-full blur-[160px] opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, rgba(6, 78, 59, 0.12) 50%, transparent 75%)',
        }}
      />
      {/* Lower subtle floor glow */}
      <div
        className="absolute bottom-10 left-1/3 w-[600px] h-[500px] rounded-full blur-[150px] opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
        }}
      />

      {/* 3. The Cascading Emerald Silk Ribbon Wave (SVG Vector with Precision Gradients) */}
      <svg
        className="absolute right-0 top-0 w-[110vw] max-w-[1400px] h-full object-cover opacity-90 transition-opacity duration-1000"
        viewBox="0 0 1200 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMaxYMin slice"
      >
        <defs>
          {/* Luminous Glow Filter for Core Beam */}
          <filter id="silk-beam-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft Blur for secondary silk folds */}
          <filter id="silk-soft-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
          </filter>

          {/* Core Beam Gradient: Pure Luminous Mint to Emerald */}
          <linearGradient id="beam-gradient" x1="1200" y1="50" x2="450" y2="950" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#ecfdf5" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#34d399" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
          </linearGradient>

          {/* Silk Veil 1 (Upper Arc Folds) */}
          <linearGradient id="silk-veil-1" x1="1100" y1="0" x2="600" y2="800" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#059669" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#047857" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
          </linearGradient>

          {/* Silk Veil 2 (Lower Arc Sweeps) */}
          <linearGradient id="silk-veil-2" x1="1200" y1="200" x2="400" y2="1000" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
            <stop offset="40%" stopColor="#10b981" stopOpacity="0.18" />
            <stop offset="80%" stopColor="#064e3b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
          </linearGradient>

          {/* Translucent Highlight Shimmer */}
          <linearGradient id="silk-shimmer" x1="950" y1="150" x2="550" y2="850" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Back Silk Fold 1 (Wide Diffuse Ambient Ribbon) */}
        <path
          d="M 1200 0 
             C 1050 120, 880 320, 820 480 
             C 760 640, 710 820, 480 1000
             L 750 1000
             C 950 820, 1020 620, 1100 420
             C 1150 280, 1200 160, 1200 0 Z"
          fill="url(#silk-veil-1)"
          filter="url(#silk-soft-blur)"
        />

        {/* Middle Silk Fold 2 (Flowing Curved Veil) */}
        <path
          d="M 1200 80
             C 1080 190, 920 380, 860 520
             C 800 660, 760 840, 520 1000
             L 620 1000
             C 840 820, 890 650, 960 480
             C 1030 310, 1120 180, 1200 80 Z"
          fill="url(#silk-veil-2)"
        />

        {/* Shimmering Fold Accent */}
        <path
          d="M 1200 120
             C 1100 220, 960 400, 900 540
             C 840 680, 800 850, 580 1000
             L 630 1000
             C 830 840, 880 670, 940 520
             C 1000 370, 1100 220, 1200 120 Z"
          fill="url(#silk-shimmer)"
        />

        {/* Radiant Luminous Emerald Core Light Beam (The signature bright line from media_1790315320872.png) */}
        <path
          d="M 1200 100
             C 1080 200, 940 390, 880 530
             C 820 670, 780 845, 540 1000"
          stroke="url(#beam-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#silk-beam-glow)"
        />

        {/* Intense Center White/Mint Filament Core */}
        <path
          d="M 1200 100
             C 1080 200, 940 390, 880 530
             C 820 670, 780 845, 540 1000"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Soft Secondary Whispering Light Stream */}
        <path
          d="M 1200 20
             C 1020 150, 860 360, 800 500
             C 740 640, 680 820, 420 1000"
          stroke="rgba(52, 211, 153, 0.4)"
          strokeWidth="2"
          strokeDasharray="8 6"
          opacity="0.6"
        />
      </svg>

      {/* 4. Fine Subtle Vignette / Edge Softening */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#030605] via-transparent to-transparent pointer-events-none w-1/3" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030605] pointer-events-none h-full" />
    </div>
  );
}
