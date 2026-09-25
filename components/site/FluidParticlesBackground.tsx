'use client';

import React, { useEffect, useRef } from 'react';

export function FluidParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates with smooth damping
    const mouse = {
      x: width / 2,
      y: height / 3,
      targetX: width / 2,
      targetY: height / 3,
      radius: 180,
      active: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    // Radar ping waves emitted on click or periodically
    interface RadarPing {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
    }
    const pings: RadarPing[] = [];

    const triggerPing = (x: number, y: number) => {
      pings.push({
        x,
        y,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.45,
        alpha: 0.6,
      });
    };

    const handleClick = (e: MouseEvent) => {
      triggerPing(e.clientX, e.clientY);
    };

    // Auto-ping periodically for that alive heartbeat
    const pingInterval = setInterval(() => {
      if (!document.hidden) {
        triggerPing(
          width * (0.3 + Math.random() * 0.4),
          height * (0.2 + Math.random() * 0.3)
        );
      }
    }, 8000);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // Particle constellation system in 3D-feeling space
    const numParticles = Math.min(Math.floor((width * height) / 16000), 85);
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      baseAlpha: number;
      pulseSpeed: number;
      pulseOffset: number;
    }[] = [];

    for (let i = 0; i < numParticles; i++) {
      const baseAlpha = 0.12 + Math.random() * 0.4;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.85,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 1.2 + Math.random() * 2.2,
        alpha: baseAlpha,
        baseAlpha,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // Perspective Cyber-Grid parameters
    let gridOffset = 0;
    let time = 0;

    const draw = () => {
      time += 0.015;
      gridOffset = (gridOffset + 0.6) % 40;

      // Smooth mouse damping
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Deep Cyber Horizon Grid in Lower Screen
      const horizonY = height * 0.58;
      const fov = 320;
      const numLines = 36;
      const gridWidth = width * 1.8;
      const gridLeft = (width - gridWidth) / 2;

      // Subtle mouse tilt for parallax
      const tiltX = (mouse.x - width / 2) * 0.08;

      ctx.save();
      // Transverse receding grid lines
      for (let z = 40; z < 700; z += 38) {
        const adjustedZ = z - (gridOffset % 38);
        if (adjustedZ <= 20) continue;

        const k = fov / adjustedZ;
        const lineY = horizonY + (adjustedZ * 0.45);
        if (lineY > height) continue;

        // Depth fog opacity
        const progress = (lineY - horizonY) / (height - horizonY);
        const alpha = Math.sin(progress * Math.PI) * 0.22;

        ctx.beginPath();
        // Slight wave undulation
        const wave = Math.sin(time + z * 0.02) * 4;
        ctx.moveTo(gridLeft + tiltX * (1 - progress), lineY + wave);
        ctx.lineTo(gridLeft + gridWidth + tiltX * (1 - progress), lineY + wave);
        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha * 0.7})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Longitudinal perspective lines radiating from vanishing point
      const vanishingX = width / 2 + tiltX;
      for (let i = 0; i <= numLines; i++) {
        const bottomX = gridLeft + (gridWidth / numLines) * i;
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizonY);
        ctx.lineTo(bottomX, height + 20);

        const distFromCenter = Math.abs(i - numLines / 2) / (numLines / 2);
        const alpha = (1 - distFromCenter * 0.6) * 0.16;
        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // 2. Horizon Glow Line & Core Light
      const gradHorizon = ctx.createRadialGradient(
        vanishingX,
        horizonY,
        0,
        vanishingX,
        horizonY,
        width * 0.6
      );
      gradHorizon.addColorStop(0, 'rgba(52, 211, 153, 0.28)');
      gradHorizon.addColorStop(0.3, 'rgba(31, 122, 77, 0.12)');
      gradHorizon.addColorStop(1, 'transparent');
      ctx.fillStyle = gradHorizon;
      ctx.fillRect(0, horizonY - 40, width, 120);

      // 3. Draw and Update Particles (Data Nodes)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Bounce gently at screen borders
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height * 0.9) p.vy *= -1;

        // Mouse interaction & dynamic glow
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && mouse.active) {
          const force = (1 - dist / mouse.radius) * 0.9;
          p.x -= (dx / dist) * force;
          p.y -= (dy / dist) * force;
          p.alpha = Math.min(0.95, p.baseAlpha + 0.45);
        } else {
          // Subtle breathing pulse
          const pulse = Math.sin(time * 3 + p.pulseOffset) * 0.08;
          p.alpha += (p.baseAlpha + pulse - p.alpha) * 0.05;
        }

        // Draw particle dot with soft core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${p.alpha})`;
        ctx.fill();

        // Connect nearby particles with luminous filaments (Mesh)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 125) {
            const filamentAlpha = (1 - dist2 / 125) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${filamentAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      // 4. Update and Draw Expanding Radar Pings
      for (let k = pings.length - 1; k >= 0; k--) {
        const ping = pings[k];
        ping.radius += 3.5;
        ping.alpha *= 0.975;

        if (ping.radius > ping.maxRadius || ping.alpha < 0.01) {
          pings.splice(k, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52, 211, 153, ${ping.alpha * 0.7})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Secondary subtle inner echo ring
        if (ping.radius > 30) {
          ctx.beginPath();
          ctx.arc(ping.x, ping.y, ping.radius * 0.82, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(52, 211, 153, ${ping.alpha * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // 5. Soft Cursor Follower Halo
      if (mouse.active) {
        const cursorGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          180
        );
        cursorGlow.addColorStop(0, 'rgba(52, 211, 153, 0.08)');
        cursorGlow.addColorStop(0.5, 'rgba(31, 122, 77, 0.03)');
        cursorGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = cursorGlow;
        ctx.fillRect(mouse.x - 180, mouse.y - 180, 360, 360);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(pingInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Ambient Radial Backdrops */}
      <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-[#1f7a4d]/10 rounded-full blur-[160px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-[#34d399]/08 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-[#0c2a1a]/40 rounded-full blur-[180px] pointer-events-none" />

      {/* Cybernetic Subtle Scanline Texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #34d399, #34d399 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-80 transition-opacity duration-1000"
      />
    </div>
  );
}
