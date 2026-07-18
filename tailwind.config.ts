import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#07100e",
        surface: "#0c1714",
        panel: "#101e1a",
        accent: "#77e6be",
        "accent-strong": "#35c998",
        ink: {
          muted: "#8da39b",
          faint: "#5d746c",
        },
      },
      boxShadow: {
        panel: "0 24px 80px -36px rgba(0, 0, 0, 0.8)",
        glow: "0 0 40px rgba(119, 230, 190, 0.12)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        mono: [
          '"SFMono-Regular"',
          "Consolas",
          '"Liberation Mono"',
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;

