import { defineConfig } from "vitest/config"

import { workspaceAliases } from "../../vitest.shared.mts"

export default defineConfig({
  resolve: { alias: workspaceAliases },
  test: {
    environment: "./tests/env.ts",
    globals: true,
    testTimeout: 20_000,
    env: { PORT_PREFIX: "taostats" },
    setupFiles: ["fake-indexeddb/auto", "./tests/setup.ts", "./tests/mocks/index.ts"],
  },
})
