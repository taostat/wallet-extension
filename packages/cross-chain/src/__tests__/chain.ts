import { readFileSync } from "node:fs"
import path from "node:path"

import type { SubstrateCall } from "@tao.com/intents-sdk"
import { Binary } from "@polkadot-api/substrate-bindings"
import { TypeRegistry } from "@polkadot/types"
import { Metadata } from "@polkadot/types/metadata"
import { expandMetadata } from "@polkadot/types/metadata/decorate"
import { getScaleApi } from "@taostats-wallet/sapi"

/**
 * Test fixtures for encoding: one metadata file, read by both implementations.
 *
 * - sapi: the extension's real `getScaleApi`, with a connector that answers the few RPC reads
 *   `getExtrinsicPayload` makes (finalized head, nonce, genesis hash, block number).
 * - polkadot-js: a `TypeRegistry` with the same metadata, and `expandMetadata(...).tx`, the call
 *   constructors `api.tx` is made of (`api.tx[section][method](...args)` is what the SDK's own
 *   `polkadotSigner` calls).
 *
 * The metadata defaults to the repo's `.papi/scale/bittensor.scale`. `CROSS_CHAIN_METADATA_FILE`
 * points the tests at another raw metadata file (e.g. one fetched from mainnet).
 */
export const METADATA_FILE =
  process.env.CROSS_CHAIN_METADATA_FILE ??
  path.resolve(__dirname, "../../../../.papi/scale/bittensor.scale")

const metadataBytes = () => new Uint8Array(readFileSync(METADATA_FILE))

export const FINALIZED_HEAD = `0x${"11".repeat(32)}` as const
export const GENESIS_HASH =
  "0x2f0555cc76fc2840a25a6ea3b9637146806f1f44b090c175ffde2a7e5ab36c03" as const
export const BLOCK_NUMBER = 4_000_000
export const NONCE = 7

export const createTestSapi = () => {
  const storage: Record<string, string> = {}
  const send = async (method: string, params: unknown[]) => {
    switch (method) {
      case "chain_getFinalizedHead":
        return FINALIZED_HEAD
      case "system_accountNextIndex":
        return NONCE
      case "state_getStorage": {
        const value = storage[params[0] as string]
        if (value !== undefined) return value
        break
      }
    }
    throw new Error(`unexpected RPC ${method} ${JSON.stringify(params)}`)
  }

  const sapi = getScaleApi(
    { chainId: "bittensor", send },
    Binary.fromBytes(metadataBytes()).asHex() as `0x${string}`,
    { symbol: "TAO", decimals: 9 },
    false,
  )

  const { builder } = sapi.chain
  const number = builder.buildStorage("System", "Number")
  storage[number.keys.enc()] = Binary.fromBytes(number.value.enc(BLOCK_NUMBER)).asHex()
  storage[builder.buildStorage("System", "BlockHash").keys.enc(0)] = GENESIS_HASH

  return sapi
}

export type TestSapi = ReturnType<typeof createTestSapi>

export const createPolkadotJs = () => {
  const registry = new TypeRegistry()
  const metadata = new Metadata(registry, metadataBytes())
  // Only the call types matter here: silence setMetadata's notice about Bittensor's own signed
  // extensions ("Unknown signed extensions ... treating them as no-effect").
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
  try {
    registry.setMetadata(metadata)
  } finally {
    warn.mockRestore()
  }
  const { tx } = expandMetadata(registry, metadata)

  const call = ({ section, method, args }: SubstrateCall) => {
    const fn = tx[section]?.[method]
    if (!fn) throw new Error(`polkadot-js has no ${section}.${method}`)
    return fn(...args)
  }

  return {
    registry,
    /** The call's bytes, as polkadot-js encodes the SDK's positional args. */
    callHex: (c: SubstrateCall) => call(c).toHex(),
    /** `utility.batchAll` of the calls, as the SDK's `polkadotSigner` builds it. */
    batchHex: (calls: SubstrateCall[]) => tx.utility.batchAll(calls.map(call)).toHex(),
  }
}
