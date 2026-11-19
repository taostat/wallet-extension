import path from "node:path"

import { defineConfig } from "vitest/config"

import { workspaceAliases } from "../../vitest.shared.mts"

const src = path.resolve(import.meta.dirname, "src")
// the browser globals and jsdom environment are shared with extension-core
const coreTests = path.resolve(import.meta.dirname, "../../packages/extension-core/tests")

export default defineConfig({
  resolve: {
    alias: [
      ...workspaceAliases,
      // tsconfig.json paths (baseUrl: src)
      ...Object.entries({
        "@common": "common",
        "@taostats": "@taostats",
        "@ui": "ui",
        "@tests": "tests",
      }).map(([name, dir]) => ({
        find: new RegExp(`^${name}(?=/|$)`),
        replacement: path.join(src, dir),
      })),
    ],
  },
  test: {
    environment: path.join(coreTests, "env.ts"),
    globals: true,
    testTimeout: 20_000,
    env: { PORT_PREFIX: "taostats" },
    setupFiles: ["fake-indexeddb/auto", path.join(coreTests, "setup.ts"), "./tests/mocks/index.ts"],
  },
})
