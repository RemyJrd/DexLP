import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b1120",
        card: "#111827",
        accent: "#38bdf8",
        muted: "#1f2937",
      },
      boxShadow: {
        soft: "0 10px 30px -15px rgba(15, 23, 42, 0.7)",
      },
      borderRadius: {
        '2xl': '1.5rem'
      }
    },
  },
  plugins: [],
};

export default config;
