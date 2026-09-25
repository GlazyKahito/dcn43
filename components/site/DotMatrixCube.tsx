'use client';

import React, { useEffect, useRef } from 'react';

export function DotMatrixCube({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const size = 240;
    canvas.width = size;
    canvas.height = size;

    // Generate cube points on 6 faces (grid of dots)
    const points: { x: number; y: number; z: number; isSymbol?: boolean }[] = [];
    const gridSize = 9;
    const half = 65;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const u = -half + (i / (gridSize - 1)) * (half * 2);
        const v = -half + (j / (gridSize - 1)) * (half * 2);

        // Front & Back faces (Z = ±half)
        points.push({ x: u, y: v, z: half });
        points.push({ x: u, y: v, z: -half });

        // Left & Right faces (X = ±half)
        points.push({ x: half, y: u, z: v });
        points.push({ x: -half, y: u, z: v });

        // Top & Bottom faces (Y = ±half)
        points.push({ x: u, y: half, z: v });
        points.push({ x: u, y: -half, z: v });
      }
    }

    let angleX = 0.4;
    let angleY = 0.6;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      angleX += 0.007;
      angleY += 0.009;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const fov = 260;
      const cx = size / 2;
      const cy = size / 2;

      // Transform, project and sort by depth
      const projected = points.map((p) => {
        // Rotate Y
        let x1 = p.x * cosY + p.z * sinY;
        let z1 = -p.x * sinY + p.z * cosY;

        // Rotate X
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        const scale = fov / (fov + z2 + 100);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;
        const alpha = Math.max(0.12, Math.min(0.9, (z2 + half) / (half * 2)));

        return { px, py, z: z2, alpha };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.px, p.py, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${p.alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(52,211,153,0.15)_0%,transparent_70%)] pointer-events-none" />
      <canvas ref={canvasRef} className="w-48 h-48 sm:w-56 sm:h-56" />
    </div>
  );
}
