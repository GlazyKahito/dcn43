'use client';

import { useEffect, useRef, useState } from 'react';

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

// Domain-warped fbm shaded as a reflective surface: brushed steel, gunmetal and graphite.
const frag = (octaves: number) => `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 r = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < ${octaves}; i++){ v += a * noise(p); p = r * p; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.1;
  float t = uTime * 0.045;
  vec2 push = uPointer * 0.12;
  vec2 q = vec2(fbm(p + push + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - push - vec2(t * 0.7, 0.0)));
  vec2 r = vec2(fbm(p + 2.4 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p + 2.4 * q + vec2(8.3, 2.8) - t * 0.5));
  vec2 b = p + 2.0 * r;
  float e = 0.01;
  float h = fbm(b);
  vec3 n = normalize(vec3((h - fbm(b + vec2(e, 0.0))) / e * 0.05, (h - fbm(b + vec2(0.0, e))) / e * 0.05, 1.0));
  vec3 refl = reflect(normalize(vec3((uv - 0.5), 1.0)), n);
  float f = clamp(refl.y * 0.5 + 0.5, 0.0, 1.0);

  vec3 graphite = vec3(0.045, 0.05, 0.052);
  vec3 gunmetal = vec3(0.2, 0.215, 0.22);
  vec3 silver = vec3(0.78, 0.8, 0.79);
  vec3 col = mix(graphite, gunmetal, smoothstep(0.15, 0.65, f));
  col = mix(col, silver, smoothstep(0.7, 1.0, f) * 0.8);
  float spec = pow(max(dot(n, normalize(vec3(0.3, 0.8, 0.5))), 0.0), 40.0);
  col += spec * vec3(0.85, 0.86, 0.84) * 0.7;
  col += pow(1.0 - n.z, 2.5) * vec3(0.05, 0.09, 0.075);
  // brushed grain
  col += (hash(vec2(uv.x * 900.0, uv.y * 3.0)) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;

/** Liquid-steel WebGL field. Falls back to a static gradient without WebGL; renders one still frame under reduced motion. */
export function SteelField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 767px)').matches || navigator.maxTouchPoints > 0;
    const scale = mobile ? 0.45 : Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
    const frameBudget = mobile ? 1000 / 30 : 0;

    const gl = canvas.getContext('webgl', { antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) {
      setFallback(true);
      return;
    }
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, frag(mobile ? 3 : 5));
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      setFallback(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFallback(true);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uPointer = gl.getUniformLocation(prog, 'uPointer');

    const resize = () => {
      canvas.width = Math.max(1, Math.floor(window.innerWidth * scale));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = 1 - (e.clientY / window.innerHeight) * 2;
    };
    if (!mobile) window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    let time = 20;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden || now - lastDraw < frameBudget) return;
      time += Math.min((now - last) / 1000, 0.05);
      last = now;
      lastDraw = now;
      pointer.x += (pointer.tx - pointer.x) * 0.03;
      pointer.y += (pointer.ty - pointer.y) * 0.03;
      gl.uniform1f(uTime, time);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    if (reduced) {
      gl.uniform1f(uTime, time);
      gl.uniform2f(uPointer, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  if (fallback) {
    return (
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 80% at 30% 20%, #2a2f31 0%, #121516 45%, #070808 100%)' }}
      />
    );
  }
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
