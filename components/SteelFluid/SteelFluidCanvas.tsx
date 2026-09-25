'use client';

import React, { useEffect, useRef, useState } from 'react';

const VERTEX_SHADER = `#version 300 es
in vec2 a;
void main() {
  gl_Position = vec4(a, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uDistortion;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = rot * p;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (uv - 0.5) * aspect * 2.3;
  
  // Subtle mouse displacement
  vec2 push = uPointer * 0.18;
  float warp = clamp(uDistortion, 0.2, 2.5);

  // Hypnotic, slow time evolution
  float t = uTime * 0.07;

  // Domain warping layer 1: slow fluid swirling
  vec2 q = vec2(
    fbm(p + push + vec2(0.0, t * 0.55)),
    fbm(p + vec2(4.7, 1.9) - push - vec2(t * 0.35, 0.0))
  );

  // Domain warping layer 2: molten metallic flow
  vec2 flow = p + warp * 2.7 * q;
  vec2 r = vec2(
    fbm(flow + vec2(1.7, 9.2) + t * 0.75),
    fbm(flow + vec2(8.3, 2.8) - t * 0.65)
  );

  vec2 base = p + warp * 2.3 * r;

  // Normal calculation via finite differences for 3D metallic curvature
  float eps = 0.005;
  float h = fbm(base);
  float hx = fbm(base + vec2(eps, 0.0));
  float hy = fbm(base + vec2(0.0, eps));
  vec3 n = normalize(vec3((h - hx) / eps * 0.045, (h - hy) / eps * 0.045, 1.0));

  // Reflection vector
  vec3 view = normalize(vec3((uv - 0.5) * aspect, 1.0));
  vec3 refl = reflect(view, n);

  // Curvature shading
  float f = clamp(refl.y * 0.5 + 0.5, 0.0, 1.0);
  float sideways = clamp(refl.x * 0.5 + 0.5, 0.0, 1.0);

  // Steel / Gunmetal / Liquid Chrome Palette (No neon colors)
  vec3 darkGraphite = vec3(0.032, 0.038, 0.045);
  vec3 gunmetal = vec3(0.16, 0.18, 0.22);
  vec3 brightSilver = vec3(0.85, 0.88, 0.94);
  vec3 specularWhite = vec3(0.98, 0.99, 1.0);

  // Blend base metal tones
  vec3 col = mix(darkGraphite, gunmetal, smoothstep(0.12, 0.65, f));
  col = mix(col, brightSilver, smoothstep(0.65, 0.98, f));

  // Subtle metallic directional reflection
  col = mix(col, gunmetal * 1.25, pow(sideways, 2.5) * 0.32);

  // Primary directional specular light
  vec3 lightDir = normalize(vec3(0.35, 0.80, 0.50));
  float spec = pow(max(dot(n, lightDir), 0.0), 38.0);

  // Secondary soft ambient specular highlight
  vec3 lightDir2 = normalize(vec3(-0.6, -0.4, 0.7));
  float spec2 = pow(max(dot(n, lightDir2), 0.0), 16.0);

  // Rim / Fresnel lighting
  float fresnel = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.8);

  col += spec * specularWhite * 0.80;
  col += spec2 * gunmetal * 0.40;
  col += fresnel * brightSilver * 0.20;

  // Add subtle micro-brushed steel texture
  float grain = (hash(uv * 700.0) - 0.5) * 0.015;
  col += grain;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const STRIP = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

export interface SteelFluidCanvasProps {
  speed?: number;
  distortion?: number;
  className?: string;
}

export function SteelFluidCanvas({
  speed = 0.5,
  distortion = 1.15,
  className,
}: SteelFluidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Use lower DPR on mobile for 60fps performance
    const isMobile = window.innerWidth < 768;
    const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);

    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      });
    } catch {
      gl = null;
    }

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const compileShader = (type: number, src: string) => {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglSupported(false);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      setWebglSupported(false);
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, STRIP, gl.STATIC_DRAW);

    const locA = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(locA);
    gl.vertexAttribPointer(locA, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'uRes');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uPointer = gl.getUniformLocation(program, 'uPointer');
    const uDistortion = gl.getUniformLocation(program, 'uDistortion');

    let w = 0;
    let h = 0;

    const resize = () => {
      if (!canvas || !gl) return;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Smooth pointer tracking across window
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    if (!isMobile) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    let animationFrameId = 0;
    let lastTime = performance.now();
    let simTime = 0;

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (!gl) return;

      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!prefersReduced) {
        simTime += delta * speed;
      }

      // Smooth pointer interpolation
      pointer.x += (pointer.targetX - pointer.x) * 0.04;
      pointer.y += (pointer.targetY - pointer.y) * 0.04;

      gl.uniform1f(uTime, simTime);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.uniform1f(uDistortion, distortion);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (!isMobile) {
        window.removeEventListener('pointermove', onPointerMove);
      }
      if (gl) {
        gl.deleteBuffer(buffer);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteProgram(program);
        const loseExt = gl.getExtension('WEBGL_lose_context');
        loseExt?.loseContext();
      }
    };
  }, [speed, distortion]);

  return (
    <div className={`relative w-full h-full ${className || ''}`}>
      {webglSupported ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full block object-cover"
        />
      ) : (
        /* CSS Fallback when WebGL is unavailable */
        <div
          className="w-full h-full bg-[#05080a] animate-pulse"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 50% 40%, rgba(180, 195, 215, 0.15) 0%, transparent 70%),
              radial-gradient(circle at 30% 70%, rgba(90, 105, 125, 0.12) 0%, transparent 60%),
              conic-gradient(from 210deg at 50% 50%, #06090c, #2b333e, #6e7c8e, #1a2028, #4f5b6b, #0a0d11, #2b333e, #06090c)
            `,
            filter: 'blur(30px)',
          }}
        />
      )}
    </div>
  );
}
