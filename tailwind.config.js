/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/renderer/**/*.{ts,tsx,html}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SF Mono", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      colors: {
        mac: {
          bg: "#1d1d1f",
          text: "#f5f5f7",
          accent: "#0a84ff",
          red: "#ff5f57",
          yellow: "#febc2e",
          green: "#28c840",
        },
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "scale-in": "scaleIn 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        "dock-bounce": "dockBounce 600ms cubic-bezier(0.36, 0, 0.66, -0.56)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        dockBounce: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-18px)" },
        },
      },
    },
  },
  plugins: [],
};
