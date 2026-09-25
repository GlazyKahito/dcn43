import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050807",
        surface: "#0a0f0d",
        card: "#101713",
        "card-elevated": "#141e18",
        hairline: "rgba(120, 180, 150, 0.14)",
        "hairline-bright": "rgba(52, 211, 153, 0.3)",
        emerald: {
          solid: "#1f7a4d",
          hover: "#25935c",
          glow: "#34d399",
          bright: "#10b981",
          deep: "#0b2519",
          tint: "rgba(52, 211, 153, 0.08)",
        },
        paper: {
          bg: "#c9dccf",
          fg: "#050807",
          border: "#a8c0af",
        },
        gold: {
          from: "#c8b27a",
          to: "#8a7440",
          fg: "#1a1505",
        },
        status: {
          red: "#ff453a",
          amber: "#ff9f0a",
          green: "#34d399",
          blue: "#38bdf8",
        },
      },
      fontFamily: {
        homevideo: ["HomeVideo", "monospace"],
        display: ["HomeVideo", "monospace"],
        vintage: ["HomeVideo", "monospace"],
        sans: ["'Space Grotesk'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: [
          "'JetBrains Mono'",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      keyframes: {
        grid: {
          "0%": { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
        beamFlow: {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.08)" },
        },
      },
      animation: {
        grid: "grid 20s linear infinite",
        "beam-flow": "beamFlow 2s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
