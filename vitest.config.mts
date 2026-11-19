import { defineConfig } from "vitest/config"

// `pnpm test` runs every package's tests in one Vitest process. Each package keeps its own
// vitest.config.mts, so `pnpm test` inside a package (or `pnpm vitest --project <name>`) works too.
export default defineConfig({
  test: {
    projects: ["packages/*/vitest.config.mts", "apps/*/vitest.config.mts"],
  },
})
