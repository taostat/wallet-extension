/** @type {const} */
const SPACING_SCALE = {
  none: "0px",
  xxs: "2px",
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  "3xl": "24px",
  "4xl": "32px",
  "5xl": "40px",
  "6xl": "48px",
  "7xl": "64px",
  "8xl": "80px",
  "9xl": "96px",
  "10xl": "128px",
  "11xl": "160px",
}

const FONT_SIZE_SCALE = {
  md: ["1rem", { lineHeight: "1.5rem" }],
  "display-xs": ["1.5rem", { lineHeight: "2rem" }],
  "display-sm": ["1.875rem", { lineHeight: "2.375rem" }],
  "display-md": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.02em" }],
  "display-lg": ["3rem", { lineHeight: "3.75rem", letterSpacing: "-0.02em" }],
  "display-xl": ["3.75rem", { lineHeight: "4.5rem", letterSpacing: "-0.02em" }],
  "display-2xl": ["4.5rem", { lineHeight: "5.625rem", letterSpacing: "-0.02em" }],
  xxs: "10px",
  smt: ["0.9375rem", { lineHeight: "1.125rem" }],
  "3xxl": ["2rem", { lineHeight: "2.64rem" }],
  "4xxl": ["2.5rem", { lineHeight: "3.3rem" }],
}

const TAILWIND_MERGE_SPACING_KEYS = Object.keys(SPACING_SCALE)
const TAILWIND_MERGE_FONT_SIZE_KEYS = Object.keys(FONT_SIZE_SCALE)

module.exports = {
  SPACING_SCALE,
  FONT_SIZE_SCALE,
  TAILWIND_MERGE_SPACING_KEYS,
  TAILWIND_MERGE_FONT_SIZE_KEYS,
}
