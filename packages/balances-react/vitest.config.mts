import { defineConfig } from "vitest/config"

import { workspaceAliases } from "../../vitest.shared.mts"

export default defineConfig({
  resolve: { alias: workspaceAliases },
  test: {
    environment: "node",
    globals: true,
  },
})
