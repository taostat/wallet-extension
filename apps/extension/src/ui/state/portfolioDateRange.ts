import { atomWithStorage } from "jotai/utils"

export type PortfolioDateRange = "1d" | "1w" | "1m" | "1y"

const STORAGE_KEY = "portfolio-date-range"

export const portfolioDateRangeAtom = atomWithStorage<PortfolioDateRange>(
  STORAGE_KEY,
  "1m",
  {
    getItem: (key) => {
      try {
        const stored = localStorage.getItem(key)
        if (stored === "1d" || stored === "1w" || stored === "1m" || stored === "1y") {
          return stored
        }
      } catch {
        // ignore
      }
      return "1m"
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value)
      } catch {
        // ignore
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key)
      } catch {
        // ignore
      }
    },
  },
)
