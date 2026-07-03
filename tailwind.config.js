import { tokens } from "./src/themes/tokens.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: tokens.colors.sidebar,
        brand: tokens.colors.brand,
        primary: tokens.colors.primary,
      },
      fontFamily: {
        sans: [
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: tokens.typography.sizes,
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,.04)",
        cardhover: "0 18px 40px -22px rgba(15,23,42,.28)",
        float: "0 12px 36px -14px rgba(15,23,42,.28)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "none" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-468px 0" },
          "100%": { backgroundPosition: "468px 0" },
        },
        pulseRing: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(16,185,129,.55)" },
          "70%": { boxShadow: "0 0 0 6px rgba(16,185,129,0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fadeUp .5s cubic-bezier(.22,.61,.36,1) both",
        shimmer: "shimmer 1.3s infinite linear",
        "pulse-ring": "pulseRing 2s infinite",
        "slide-in-right": "slideInRight .25s cubic-bezier(.22,.61,.36,1) both",
      },
    },
  },
  plugins: [],
};
