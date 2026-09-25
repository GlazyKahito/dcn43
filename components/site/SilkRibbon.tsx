'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function SilkRibbon({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Background radial emerald burst */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_45%,rgba(52,211,153,0.18)_0%,transparent_65%)]" />

      {/* Atmospheric deep glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#1f7a4d]/20 blur-[130px] -right-20 top-1/4 pointer-events-none" />

      {/* Layered Silk Wave SVG */}
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-2xl transform rotate-[-8deg] scale-110 opacity-90"
      >
        <defs>
          <linearGradient id="silk-grad-1" x1="100" y1="0" x2="700" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.0" />
            <stop offset="35%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="80%" stopColor="#059669" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="silk-grad-2" x1="200" y1="50" x2="600" y2="550" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.0" />
            <stop offset="45%" stopColor="#34d399" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#6ee7b7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.0" />
          </linearGradient>

          <filter id="silk-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer ambient wave */}
        <motion.path
          d="M 50 480 C 220 540, 360 380, 520 220 C 640 100, 750 80, 800 120"
          stroke="url(#silk-grad-2)"
          strokeWidth="60"
          strokeLinecap="round"
          filter="url(#silk-blur)"
          opacity="0.45"
          animate={{
            d: [
              "M 50 480 C 220 540, 360 380, 520 220 C 640 100, 750 80, 800 120",
              "M 50 460 C 240 500, 380 420, 540 240 C 660 120, 740 60, 800 140",
              "M 50 480 C 220 540, 360 380, 520 220 C 640 100, 750 80, 800 120",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Core luminous ribbon */}
        <motion.path
          d="M 100 450 C 260 490, 370 330, 530 190 C 620 110, 720 70, 780 90"
          stroke="url(#silk-grad-1)"
          strokeWidth="32"
          strokeLinecap="round"
          animate={{
            d: [
              "M 100 450 C 260 490, 370 330, 530 190 C 620 110, 720 70, 780 90",
              "M 100 440 C 270 470, 390 350, 550 200 C 630 90, 710 80, 780 110",
              "M 100 450 C 260 490, 370 330, 530 190 C 620 110, 720 70, 780 90",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Highlight razor thread */}
        <motion.path
          d="M 140 440 C 280 475, 380 325, 540 185 C 630 105, 710 75, 760 92"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.9"
          filter="url(#silk-blur)"
          animate={{
            d: [
              "M 140 440 C 280 475, 380 325, 540 185 C 630 105, 710 75, 760 92",
              "M 140 435 C 290 460, 400 340, 560 195 C 640 95, 700 85, 760 105",
              "M 140 440 C 280 475, 380 325, 540 185 C 630 105, 710 75, 760 92",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}
