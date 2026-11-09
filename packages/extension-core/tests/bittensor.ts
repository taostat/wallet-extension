import { readFileSync } from "node:fs"
import path from "node:path"

import { Metadata, TypeRegistry } from "@polkadot/types"
import { expandMetadata } from "@polkadot/types/metadata/decorate"
import { Binary, FixedSizeBinary, parseMetadataRpc } from "@taostats-wallet/scale"

/**
 * Bittensor fixtures for tests: the repo's `.papi/scale/bittensor.scale` metadata, read by
 * polkadot-js (the registry the service worker decodes blocks and events with) and by papi (to
 * encode `System.Events` exactly as the chain stores them).
 *
 * Well-known public dev accounts only (Alice, Bob).
 */

export const METADATA_FILE = path.resolve(__dirname, "../../../.papi/scale/bittensor.scale")

export const metadataHex = Binary.fromBytes(
  new Uint8Array(readFileSync(METADATA_FILE)),
).asHex() as `0x${string}`

export const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
export const BOB = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
export const GENESIS_HASH =
  "0x2f0555cc76fc2840a25a6ea3b9637146806f1f44b090c175ffde2a7e5ab36c03" as const

/** A polkadot-js registry with Bittensor's metadata, and its call constructors (`tx`). */
export const createBittensorRegistry = () => {
  const registry = new TypeRegistry()
  const metadata = new Metadata(registry, metadataHex)
  // silence setMetadata's notice about Bittensor's own signed extensions
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {})
  try {
    registry.setMetadata(metadata)
  } finally {
    warn.mockRestore()
  }
  return { registry, tx: expandMetadata(registry, metadata).tx }
}

export type BittensorRegistry = ReturnType<typeof createBittensorRegistry>["registry"]

const { builder } = parseMetadataRpc(metadataHex)

/** The storage key of `System.Events`. */
export const EVENTS_KEY = builder.buildStorage("System", "Events").keys.enc()

/** One event as the chain stores it (SCALE): pallet index, variant index, then its fields. */
export type TestEvent = Uint8Array

/** An event from papi values, `pallet` and `name` as the metadata names them (`EVM`, `Log`). */
export const encodeEvent = (pallet: string, name: string, value: unknown): TestEvent => {
  const { location, codec } = builder.buildEvent(pallet, name)
  return new Uint8Array([...location, ...codec.enc(value)])
}

export type TestEventRecord = {
  /** `ApplyExtrinsic(index)`, or the block's initialization / finalization. */
  phase: number | "Initialization" | "Finalization"
  event: TestEvent
}

const u32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]
// FrameSystemPhase: ApplyExtrinsic(u32) = 0, Finalization = 1, Initialization = 2
const phaseBytes = (phase: TestEventRecord["phase"]) =>
  typeof phase === "number" ? [0, ...u32(phase)] : phase === "Finalization" ? [1] : [2]

/** `System.Events` as stored on chain (`Vec<EventRecord>`, no topics), in hex. */
export const encodeEvents = (records: TestEventRecord[]) => {
  if (records.length >= 64) throw new Error("the fixture only encodes fewer than 64 records")
  const bytes = [records.length << 2] // compact length
  for (const { phase, event } of records) bytes.push(...phaseBytes(phase), ...event, 0)
  return Binary.fromBytes(new Uint8Array(bytes)).asHex()
}

/** Decode `System.Events` the way `watchSubstrateTransaction` does. */
export const decodeEvents = (registry: BittensorRegistry, hex: string) =>
  registry.createType("Vec<FrameSystemEventRecord>", hex)

const unit = (type: string) => ({ type, value: undefined })

const DISPATCH_INFO = {
  weight: { ref_time: 1n, proof_size: 2n },
  class: unit("Normal"),
  pays_fee: unit("Yes"),
}

/** Where an error is in the metadata: its pallet's index, and its own index there. */
const moduleErrorIndex = (registry: BittensorRegistry, pallet: string, error: string) => {
  const meta = registry.metadata.pallets.find((p) => p.name.eq(pallet))
  if (!meta || meta.errors.isNone) throw new Error(`no errors for ${pallet}`)
  const variant = registry.lookup
    .getSiType(meta.errors.unwrap().type)
    .def.asVariant.variants.find((v) => v.name.eq(error))
  if (!variant) throw new Error(`no ${pallet}.${error}`)
  return { index: meta.index.toNumber(), error: variant.index.toNumber() }
}

/** Dispatch errors as papi values, for `events.failed`. */
export const dispatchErrors = {
  token: (variant: string) => ({ type: "Token", value: unit(variant) }),
  arithmetic: (variant: string) => ({ type: "Arithmetic", value: unit(variant) }),
  other: (variant: string) => unit(variant),
}

export const events = {
  success: () => encodeEvent("System", "ExtrinsicSuccess", { dispatch_info: DISPATCH_INFO }),
  failed: (dispatchError: unknown) =>
    encodeEvent("System", "ExtrinsicFailed", {
      dispatch_error: dispatchError,
      dispatch_info: DISPATCH_INFO,
    }),
  /**
   * `System.ExtrinsicFailed` with a module error. papi decodes a module error as `<Pallet>.<Error>`
   * and can't encode its 4 bytes back, so the error is encoded by polkadot-js.
   */
  failedInModule: (registry: BittensorRegistry, pallet: string, error: string) => {
    const withBadOrigin = events.failed(unit("BadOrigin")) // location (2), BadOrigin (1), info
    const { index, error: errorIndex } = moduleErrorIndex(registry, pallet, error)
    const dispatchError = registry
      .createType("SpRuntimeDispatchError", {
        Module: { index, error: new Uint8Array([errorIndex, 0, 0, 0]) },
      })
      .toU8a()
    return new Uint8Array([
      ...withBadOrigin.slice(0, 2),
      ...dispatchError,
      ...withBadOrigin.slice(3),
    ])
  },
  evmLog: (address: `0x${string}`, topics: `0x${string}`[], data: `0x${string}`) =>
    encodeEvent("EVM", "Log", {
      log: {
        address: FixedSizeBinary.fromHex(address),
        topics: topics.map((t) => FixedSizeBinary.fromHex(t)),
        data: Binary.fromHex(data),
      },
    }),
  evmExecutedFailed: (address: `0x${string}`) =>
    encodeEvent("EVM", "ExecutedFailed", { address: FixedSizeBinary.fromHex(address) }),
  withdraw: (who: string, amount: bigint) => encodeEvent("Balances", "Withdraw", { who, amount }),
}
