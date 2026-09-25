"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Aceternity UI Lamp Component
 * Upstream Reference: https://github.com/aceternity-ui/aceternity-ui
 * 21st.dev Reference: https://21st.dev/@manuarora700/components/lamp
 * 
 * Optimized for seamless layering above Global Liquid Metal:
 * - Conic gradient light beams animated with Framer Motion
 * - Emerald & cyan luminous emitters matching Somaiya / cybersecurity theme
 * - Translucent blending masks allowing the Liquid Metal fluid surface to shine through
 * - Hardware-accelerated and fully responsive
 */
export const LampContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex min-h-[600px] sm:min-h-[700px] flex-col items-center justify-start overflow-hidden w-full z-0 bg-transparent pointer-events-none select-none",
        className
      )}
    >
      <div className="relative flex w-full flex-1 scale-y-110 sm:scale-y-125 items-center justify-center isolate z-0 pointer-events-none">
        {/* Left Conic Gradient Light Beam */}
        <motion.div
          initial={{ opacity: 0.4, width: "16rem" }}
          whileInView={{ opacity: 0.9, width: "32rem" }}
          transition={{
            delay: 0.2,
            duration: 0.9,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[32rem] bg-gradient-conic from-emerald-400 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          {/* Soft Bottom & Side Feathering */}
          <div className="absolute w-[100%] left-0 bg-gradient-to-t from-[#030605] via-[#030605]/50 to-transparent h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-40 h-[100%] left-0 bg-gradient-to-r from-[#030605] via-[#030605]/50 to-transparent bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>

        {/* Right Conic Gradient Light Beam */}
        <motion.div
          initial={{ opacity: 0.4, width: "16rem" }}
          whileInView={{ opacity: 0.9, width: "32rem" }}
          transition={{
            delay: 0.2,
            duration: 0.9,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[32rem] bg-gradient-conic from-transparent via-transparent to-emerald-400 text-white [--conic-position:from_290deg_at_center_top]"
        >
          {/* Soft Bottom & Side Feathering */}
          <div className="absolute w-40 h-[100%] right-0 bg-gradient-to-l from-[#030605] via-[#030605]/50 to-transparent bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-gradient-to-t from-[#030605] via-[#030605]/50 to-transparent h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>

        {/* Center Horizon Bloom */}
        <div className="absolute top-1/2 h-44 w-full translate-y-12 scale-x-150 bg-gradient-to-t from-transparent via-emerald-950/20 to-transparent blur-2xl pointer-events-none" />

        {/* Diffuse Core Sphere Halo */}
        <div className="absolute inset-auto z-30 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-emerald-500/30 opacity-70 blur-3xl pointer-events-none" />

        {/* Inner Bright Spot */}
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "18rem" }}
          transition={{
            delay: 0.2,
            duration: 0.9,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-36 w-72 -translate-y-[6rem] rounded-full bg-emerald-400/40 blur-2xl pointer-events-none"
        />

        {/* Razor-sharp Emitter Light Line */}
        <motion.div
          initial={{ width: "16rem" }}
          whileInView={{ width: "32rem" }}
          transition={{
            delay: 0.2,
            duration: 0.9,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-40 h-0.5 w-[32rem] -translate-y-[7rem] bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_15px_#34d399]"
        />

        {/* Top Fade Mask */}
        <div className="absolute inset-auto z-30 h-36 w-full -translate-y-[12rem] bg-gradient-to-b from-[#030605]/90 via-transparent to-transparent pointer-events-none" />
      </div>

      {children && (
        <div className="relative z-10 w-full pointer-events-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export default LampContainer;
