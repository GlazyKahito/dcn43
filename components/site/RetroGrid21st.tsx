'use client';

import React from 'react';

interface RetroGridProps {
  className?: string;
  angle?: number;
  cellSize?: number;
  opacity?: number;
}

/**
 * 21st.dev Signature Retro Grid & Cyber Horizon Background
 * Contained strictly within 100vw to eliminate any zoom/viewport blowout.
 */
export function RetroGrid21st({
  className = '',
  angle = 60,
  cellSize = 60,
  opacity = 0.5,
}: RetroGridProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden w-full max-w-[100vw] h-full z-0 [perspective:300px] ${className}`}
      aria-hidden="true"
    >
      {/* 3D Perspective Plane */}
      <div className="absolute inset-0 [transform-origin:50%_0%] overflow-hidden w-full max-w-full h-full">
        <div
          className="absolute -top-[50%] left-[-50%] w-[200%] h-[200%] animate-grid [background-repeat:repeat] [background-size:60px_60px] [transform:rotateX(60deg)] [transform-origin:50%_0%]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(52, 211, 153, 0.25) 1px, transparent 0), linear-gradient(to bottom, rgba(31, 122, 77, 0.2) 1px, transparent 0)`,
            opacity,
          }}
        />
      </div>

      {/* Luminous Cyber Horizon Fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050807] via-[#050807]/50 to-[#050807]/90 pointer-events-none" />

      {/* Center Horizon Light Ray */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(52,211,153,0.22),transparent_70%)] pointer-events-none" />

      {/* Vintage CRT Scanlines (21st.dev / Retro Terminal Aesthetic) */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #34d399, #34d399 1px, transparent 1px, transparent 3px)',
        }}
      />
    </div>
  );
}
