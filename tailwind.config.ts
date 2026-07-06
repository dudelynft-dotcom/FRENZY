import type { Config } from "tailwindcss";

/**
 * FEEDING FRENZY design tokens — "private-bank aquarium".
 *
 * The default Tailwind palette is intentionally removed. Every color in the
 * app must be one of these tokens; a default-palette class (e.g. `bg-blue-500`)
 * failing to compile is a feature, not a bug.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    // ---- full replacements (no default palette leaks through) ----
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",

      // page background — warm porcelain, not pure white
      porcelain: { DEFAULT: "#F7F8F6", deep: "#EFF1ED" },
      // primary text — deep ocean ink, not black
      ink: { DEFAULT: "#10222E", soft: "#28414F" },
      // secondary text
      tide: { DEFAULT: "#5A6B75", faint: "#8C99A1" },
      // 1px borders everywhere, instead of shadows
      hairline: { DEFAULT: "#E3E7E4", strong: "#D2D8D3" },
      // primary accent — deep institutional blue
      depth: { DEFAULT: "#0E4DA4", deep: "#0A3B80", tint: "#E8EEF8" },
      // success / growth numbers
      kelp: { DEFAULT: "#1E6B4F", deep: "#15503B", tint: "#E7F0EC" },
      // danger / under attack — used sparingly so it lands hard
      coral: { DEFAULT: "#C2452D", deep: "#A23823", tint: "#F9ECE7" },
      // tier 5–6 badges only
      gold: { DEFAULT: "#8A6D2F", deep: "#6E5726", tint: "#F5F0E1" },
    },
    fontFamily: {
      display: ["var(--font-display)", "system-ui", "sans-serif"],
      sans: ["var(--font-body)", "system-ui", "sans-serif"],
      mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
    },
    // The ONLY shadow in the product. Floating elements only (modal, toast, popover).
    boxShadow: {
      none: "none",
      float: "0 8px 30px rgb(16 34 46 / 0.08)",
    },
    // Small, precise radii. Nothing pill-shaped except where deliberate (`rounded-full`).
    borderRadius: {
      none: "0",
      xs: "2px",
      sm: "3px",
      DEFAULT: "4px",
      md: "6px",
      lg: "8px",
      full: "9999px",
    },
    fontSize: {
      "2xs": ["11px", { lineHeight: "16px" }],
      xs: ["12px", { lineHeight: "18px" }],
      sm: ["13px", { lineHeight: "20px" }],
      base: ["15px", { lineHeight: "24px" }],
      lg: ["17px", { lineHeight: "26px" }],
      xl: ["20px", { lineHeight: "28px" }],
      "2xl": ["24px", { lineHeight: "31px" }],
      "3xl": ["30px", { lineHeight: "37px" }],
      "4xl": ["38px", { lineHeight: "44px" }],
      "5xl": ["48px", { lineHeight: "53px" }],
      "6xl": ["60px", { lineHeight: "64px" }],
    },
    extend: {
      letterSpacing: {
        display: "-0.02em",
      },
      maxWidth: {
        shell: "72rem", // page container
      },
      keyframes: {
        // the single coral pulse for cards under attack — border only, no glow
        "coral-pulse": {
          "0%, 100%": { borderColor: "#C2452D" },
          "50%": { borderColor: "#E8B4A8" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "coral-pulse": "coral-pulse 2s ease-in-out infinite",
        "rise-in": "rise-in 180ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
