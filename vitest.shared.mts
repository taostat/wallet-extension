import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

import type { Alias } from "vite"

const packagesDir = path.resolve(import.meta.dirname, "packages")

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * Resolves every workspace package to its source, so tests never pick up a stale `dist/` build:
 * `pkg` → `src/index`, `pkg/src/x` → `src/x`, and preconstruct entrypoints like `pkg/config` →
 * `src/config`.
 */
export const workspaceAliases: Alias[] = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => {
    const dir = path.join(packagesDir, entry.name)
    let name: string
    try {
      name = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8")).name
    } catch {
      return []
    }
    const src = path.join(dir, "src")
    return [
      { find: new RegExp(`^${escape(name)}/src/`), replacement: `${src}/` },
      { find: new RegExp(`^${escape(name)}/`), replacement: `${src}/` },
      { find: new RegExp(`^${escape(name)}$`), replacement: src },
    ]
  })
