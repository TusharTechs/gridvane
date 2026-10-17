import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        grid: {
          bg: "#040812",
          panel: "#091122",
          border: "#182642",
          accent: "#10B981",
          cyan: "#06B6D4",
          amber: "#F59E0B",
          rose: "#F43F5E",
          violet: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        "glow-emerald": "0 0 30px -5px rgba(16, 185, 129, 0.25)",
        "glow-cyan": "0 0 30px -5px rgba(6, 182, 212, 0.25)",
        "glow-amber": "0 0 30px -5px rgba(245, 158, 11, 0.25)",
        "glow-rose": "0 0 30px -5px rgba(244, 63, 94, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
