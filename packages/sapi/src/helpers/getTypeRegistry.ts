import { Metadata, TypeRegistry } from "@polkadot/types"
import { RegistryTypes, SignerPayloadJSON } from "@polkadot/types/types"

import log from "../log"
import { Chain } from "./types"

// Parsing metadata into a registry is expensive and the result only depends on the chain
// metadata plus the signed-extension set. Payloads for the same chain reuse one registry.
const registryCache = new WeakMap<Chain, Map<string, TypeRegistry>>()

export const getTypeRegistry = (chain: Chain, payload: SignerPayloadJSON) => {
  const extensionsKey = payload.signedExtensions.join("\0")
  let byExtensions = registryCache.get(chain)
  if (!byExtensions) {
    byExtensions = new Map()
    registryCache.set(chain, byExtensions)
  }

  const cached = byExtensions.get(extensionsKey)
  if (cached) return cached

  log.log(`[sapi] getTypeRegistry begin: ${Date.now()}`)
  const registry = new TypeRegistry()

  if (chain.registryTypes) registry.register(chain.registryTypes as RegistryTypes)

  const meta = new Metadata(registry, chain.hexMetadata)
  registry.setMetadata(meta, payload.signedExtensions, chain.signedExtensions) // ~30ms

  log.log(`[sapi] getTypeRegistry end: ${Date.now()}`)
  byExtensions.set(extensionsKey, registry)
  return registry
}
