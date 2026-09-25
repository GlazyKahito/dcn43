'use client';

import React from 'react';
import { SteelFluidCanvas } from './SteelFluidCanvas';

/**
 * Premium Steel Fluid / Liquid Metal Background
 * 
 * Layer Hierarchy:
 * 1. Base Dark Canvas
 * 2. WebGL Steel Fluid (molten chrome / gunmetal / silver reflections)
 * 3. Atmospheric Graphite Veil & Radial Vignette (for ultra-crisp UI contrast)
 * 4. Micro-noise texture for brushed tactile depth
 * 
 * All elements are pointer-events-none and positioned behind all UI layers (-z-10).
 */
export function SteelFluidBackground() {
  return (
    <div
      className="fixed inset-0 w-screen h-screen -z-10 overflow-hidden pointer-events-none select-none bg-[#030507]"
      aria-hidden="true"
    >
      {/* 1. Interactive WebGL Molten Steel Fluid Surface */}
      <SteelFluidCanvas
        speed={0.45}
        distortion={1.12}
        className="w-full h-full"
      />

      {/* 2. Dark Gunmetal & Graphite Atmospheric Veil */}
      {/* Keeps text, cards, and interactive elements with 100% readability */}
      <div className="absolute inset-0 bg-[#020406]/45 backdrop-blur-[0.5px] pointer-events-none" />

      {/* 3. Deep Radial Vignette Shadow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 20%, rgba(2, 4, 6, 0.75) 75%, rgba(0, 0, 0, 0.95) 100%)',
        }}
      />

      {/* 4. Subtle Steel Light Ambient Pool (Monochrome Silver/Steel, No Neon) */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[500px] bg-slate-300/[0.035] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-slate-400/[0.025] rounded-full blur-[160px] pointer-events-none" />
    </div>
  );
}

export default SteelFluidBackground;
