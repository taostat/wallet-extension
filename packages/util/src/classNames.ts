import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Keep in sync with packages/taostats-ui/src/config/design-tokens.cjs
const TAILWIND_MERGE_SPACING_KEYS = [
  "none",
  "xxs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
  "10xl",
  "11xl",
]

const TAILWIND_MERGE_FONT_SIZE_KEYS = [
  "md",
  "display-xs",
  "display-sm",
  "display-md",
  "display-lg",
  "display-xl",
  "display-2xl",
  "xxs",
  "smt",
  "3xxl",
  "4xxl",
]

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [...TAILWIND_MERGE_SPACING_KEYS],
    },
    classGroups: {
      "font-size": [{ text: [...TAILWIND_MERGE_FONT_SIZE_KEYS] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const classNames = cn
