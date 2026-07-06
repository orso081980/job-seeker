/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Clash Display", "Space Grotesk", "ui-sans-serif", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        canvas: {
          50: "#FFFFFF",
          100: "#f4f5f5",
          200: "#e7e9e8",
        },
        ink: {
          400: "#8a8f8d",
          700: "#3f4442",
          800: "#262928",
          900: "#18191a",
          950: "#0c0d0d",
        },
      },
      boxShadow: {
        glow: "0 1px 2px rgba(16,24,20,0.06), 0 8px 20px -8px rgba(16,185,129,0.25)",
        "glow-sm": "0 1px 2px rgba(16,24,20,0.05)",
      },
    },
  },
  plugins: [],
};
