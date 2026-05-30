/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        luxury: {
          base: "#121212",
          surface: "#1A1A1A",
          border: "#262626",
          hover: "#222222",
          lightBase: "#FAFAFA",
          lightSurface: "#FFFFFF",
          lightBorder: "#E5E5E5",
          lightHover: "#F5F5F5",
        },
        crimson: {
          bg: "#2A1111",
          border: "#7F1D1D",
          text: "#FCA5A5",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-glow": "pulseGlow 2s infinite",
        "route-1": "route-packet 2s linear infinite",
        "route-2": "route-packet 2s linear infinite 0.7s",
        "route-3": "route-packet 2s linear infinite 1.4s",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "route-packet": {
          "0%": { left: "0%", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { left: "calc(100% - 6px)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
