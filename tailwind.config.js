/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "hsl(var(--ink) / <alpha-value>)",
        haze: "hsl(var(--surface-soft) / <alpha-value>)",
        ember: "hsl(var(--accent) / <alpha-value>)",
        tide: "hsl(var(--tide) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        surfaceStrong: "hsl(var(--surface-strong) / <alpha-value>)",
        surfaceSoft: "hsl(var(--surface-soft) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)"
      }
    }
  },
  plugins: []
};
