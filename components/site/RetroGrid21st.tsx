'use client';

import React from 'react';

interface RetroGridProps {
  className?: string;
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lightLineColor?: string;
  darkLineColor?: string;
}

/**
 * 21st.dev Inspired Retro Grid & Cybernetic Horizon Background
 * Provides an authentic retro-computing / cyber-horizon aesthetic with 3D perspective.
 */
export function RetroGrid21st({
  className = '',
  angle = 65,
  cellSize = 55,
  opacity = 0.45,
  lightLineColor = 'rgba(52, 211, 153, 0.22)',
  darkLineColor = 'rgba(31, 122, 77, 0.18)',
}: RetroGridProps) {
  const gridStyles = {
    '--grid-angle': `${angle}deg`,
    '--cell-size': `${cellSize}px`,
    '--opacity': opacity,
    '--light-line': lightLineColor,
    '--dark-line': darkLineColor,
  } as React.CSSProperties;

  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden z-0 [perspective:240px] ${className}`}
      style={gridStyles}
    >
      {/* 3D Perspective Plane */}
      <div className="absolute inset-0 [transform-origin:100%_0_0]">
        <div
          className="absolute -inset-[100%] w-[300%] h-[300%] animate-grid [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [transform:rotateX(var(--grid-angle))] [width:600vw]"
          style={{
            backgroundImage: `linear-gradient(to right, var(--light-line) 1px, transparent 0), linear-gradient(to bottom, var(--dark-line) 1px, transparent 0)`,
            opacity: 'var(--opacity)',
          }}
        />
      </div>

      {/* Luminous Cyber Horizon Fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050807] via-transparent to-[#050807]/90 pointer-events-none" />

      {/* Center Horizon Light Ray */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(52,211,153,0.18),transparent_70%)] pointer-events-none" />

      {/* Vintage CRT Scanlines (21st.dev / Retro Terminal Aesthetic) */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #34d399, #34d399 1px, transparent 1px, transparent 3px)',
        }}
      />
    </div>
  );
}
