import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        base: {
          950: "#05060a",
          900: "#0a0c14",
          850: "#0e111b",
          800: "#131722",
          700: "#1b2030",
          600: "#262c40",
          500: "#3a4258",
        },
        accent: {
          400: "#8b8cf9",
          500: "#6d6ff7",
          600: "#5457e0",
          glow: "#7c7ef8",
        },
        risk: {
          low: "#34d399",
          medium: "#fbbf24",
          high: "#fb923c",
          critical: "#f87171",
        },
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(124,126,248,0.06), transparent 60%), radial-gradient(circle at 20% 0%, rgba(124,126,248,0.12), transparent 40%)",
        "mesh-glow":
          "radial-gradient(600px circle at 0% 0%, rgba(109,111,247,0.15), transparent 40%), radial-gradient(600px circle at 100% 0%, rgba(52,211,153,0.08), transparent 40%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,126,248,0.15), 0 8px 30px -8px rgba(124,126,248,0.35)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        shimmer: "shimmer 2s infinite linear",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
} satisfies Config;
