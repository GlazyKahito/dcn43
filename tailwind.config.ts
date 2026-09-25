import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0b0c',
        graphite: '#121416',
        gunmetal: '#1a1d20',
        steel: '#262a2e',
        silver: '#b9bcbd',
        paper: '#e8e4da',
        muted: '#a09e97',
        dim: '#6f6f6a',
        hair: 'rgba(232, 228, 218, 0.1)',
        'hair-strong': 'rgba(232, 228, 218, 0.2)',
        signal: { DEFAULT: '#5fae8a', deep: '#123126', soft: 'rgba(95, 174, 138, 0.12)' },
        amber: { DEFAULT: '#d6a24e', soft: 'rgba(214, 162, 78, 0.12)' },
        alarm: { DEFAULT: '#d0584b', soft: 'rgba(208, 88, 75, 0.12)' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.18em',
      },
      keyframes: {
        blink: { '0%, 49%': { opacity: '1' }, '50%, 100%': { opacity: '0' } },
        sweep: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
      },
      animation: {
        blink: 'blink 1.1s steps(1) infinite',
        sweep: 'sweep 2.4s cubic-bezier(0.6, 0, 0.4, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
