import type { Config } from "tailwindcss";

// Reads an "R G B" triplet from a CSS custom property (defined in app/globals.css's
// :root, optionally overridden per-request by a developer-set color.<token>
// SiteSetting — see colorOverrideStyle() in app/layout.tsx) instead of a bare hex
// value, so Tailwind's opacity-modifier classes (bg-poly-orange/25, etc., used
// throughout the app) keep working: those need a var Tailwind can slot an alpha
// value into, which a plain `var(--x, #hex)` string can't provide.
// Tailwind's shipped Config type predates this recipe and only types color values as
// strings, but its runtime resolver checks `typeof value === "function"` and calls it
// with `{ opacityValue }` when it sees one — this cast just satisfies the type without
// changing the actual (function) value Tailwind receives at build time.
function withOpacity(variable: string): string {
  return ((opts: { opacityValue?: string }) =>
    opts.opacityValue === undefined
      ? `rgb(var(${variable}))`
      : `rgb(var(${variable}) / ${opts.opacityValue})`) as unknown as string;
}

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: withOpacity("--color-ink-50"),
          100: withOpacity("--color-ink-100"),
          200: withOpacity("--color-ink-200"),
          300: withOpacity("--color-ink-300"),
          400: withOpacity("--color-ink-400"),
          500: withOpacity("--color-ink-500"),
          600: withOpacity("--color-ink-600"),
          700: withOpacity("--color-ink-700"),
          800: withOpacity("--color-ink-800"),
          900: withOpacity("--color-ink-900"),
          950: withOpacity("--color-ink-950"),
        },
        poly: {
          orange: withOpacity("--color-poly-orange"),
          orangeDark: withOpacity("--color-poly-orangeDark"),
          orangeSoft: withOpacity("--color-poly-orangeSoft"),
          navy: withOpacity("--color-poly-navy"),
          navyDark: withOpacity("--color-poly-navyDark"),
          navySoft: withOpacity("--color-poly-navySoft"),
          green: withOpacity("--color-poly-green"),
          amber: withOpacity("--color-poly-amber"),
        },
        class: {
          "27": "#E15A1F",
          "28": "#5D6FB8",
          "29": "#C68A1E",
          "30": "#7BB66B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out",
        "slide-up": "slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "page-in": "page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "page-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
