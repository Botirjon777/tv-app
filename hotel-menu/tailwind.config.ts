import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(249, 115, 22, 0.5)" },
          "70%": { boxShadow: "0 0 0 12px rgba(249, 115, 22, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(249, 115, 22, 0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "pulse-ring": "pulse-ring 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
