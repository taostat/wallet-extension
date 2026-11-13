import type { Log } from "viem"
import { Blake2256 } from "@polkadot-api/substrate-bindings"
import {
  intentsAbi,
  KNOWN_SETTLERS,
  parseSubstrateAddress,
  SUBTENSOR_EVM,
} from "@tao.com/intents-sdk"
import { bytesToHex, hexToBytes, parseEventLogs } from "viem"

import type { SellOrderRef, SellRecordInput, UnconfirmedSellOutcome } from "./sell-records"
import { BITTENSOR_CHAIN_ID } from "./sell"

/**
 * "Check again" for a sell sent but not seen in a block: find its extrinsic on Bittensor by hash and
 * read what it did. Only reads; nothing is ever sent again.
 *
 * The batch is mortal: sapi signs it for `SELL_EXTRINSIC_ERA_PERIOD` blocks from the block its
 * payload was built at (the History entry's `payload.blockNumber`), so it can only be in one of
 * those blocks. Once the chain is past them and it wasn't found, it never will be: nothing moved.
 */

type Hex = `0x${string}`

/** sapi's `ERA_PERIOD`: a sell batch is valid for this many blocks. */
export const SELL_EXTRINSIC_ERA_PERIOD = 64

/** The blocks to look in, and whether they cover every block the extrinsic could be in. */
export type ExtrinsicSearchRange = {
  from: number
  to: number
  /** `true` when the chain is past the last block it could be in. */
  isComplete: boolean
  /** The one block History saw it in: not finding it there proves nothing. */
  isHistoryBlock: boolean
}

/**
 * Where to look: the block History already saw it in, else the blocks its era allows that exist
 * yet (from its birth block, inclusive, `eraPeriod` blocks on), up to `headBlock`.
 */
export function extrinsicSearchRange({
  birthBlock,
  includedBlock,
  headBlock,
  eraPeriod = SELL_EXTRINSIC_ERA_PERIOD,
}: {
  /** The block the payload was built at. */
  birthBlock: number
  /** The block History saw it in, if any. */
  includedBlock?: number
  /** The chain's latest block. */
  headBlock: number
  eraPeriod?: number
}): ExtrinsicSearchRange {
  if (includedBlock !== undefined)
    return { from: includedBlock, to: includedBlock, isComplete: true, isHistoryBlock: true }
  const last = birthBlock + eraPeriod
  return {
    from: birthBlock,
    to: Math.min(last, headBlock),
    isComplete: headBlock >= last,
    isHistoryBlock: false,
  }
}

/** What reading one block of the range found. */
export type BlockSearchResult =
  | { kind: "found"; blockHash: Hex; extrinsicIndex: number }
  /** Read in full, and the extrinsic isn't in it. */
  | { kind: "absent" }
  /** Its hash or its body couldn't be read (an RPC that failed or answered nothing). */
  | { kind: "unreadable" }

/** What a search of the range proves. */
export type ExtrinsicSearchVerdict =
  | { kind: "found"; blockHash: Hex; extrinsicIndex: number }
  /** Every block it could ever be in was read, and it is in none: it was never included. */
  | { kind: "notIncluded" }
  /** Every block so far was read and it isn't there yet, but later ones still could have it. */
  | { kind: "pending" }
  /** Nothing can be proven: a block couldn't be read, or wasn't looked at. */
  | { kind: "unknown" }

/**
 * What the blocks read (`results`, in range order, stopping at the first found) prove about the
 * extrinsic. Only a range read in full can prove it absent: a block that couldn't be read might be
 * the one that holds it, so any unreadable block, or one not read at all, gives `unknown`, never
 * `notIncluded` (which would tell the user nothing moved, and invite them to sell again). Not
 * finding it in the block History saw it in is `unknown` too.
 */
export function extrinsicSearchVerdict(
  range: ExtrinsicSearchRange,
  results: readonly BlockSearchResult[],
): ExtrinsicSearchVerdict {
  const found = results.find(
    (result): result is Extract<BlockSearchResult, { kind: "found" }> => result.kind === "found",
  )
  if (found) return found
  const blockCount = Math.max(0, range.to - range.from + 1)
  if (results.length < blockCount || results.some((result) => result.kind === "unreadable"))
    return { kind: "unknown" }
  if (range.isHistoryBlock) return { kind: "unknown" }
  return range.isComplete ? { kind: "notIncluded" } : { kind: "pending" }
}

/** The index in a block of the extrinsic whose hash (blake2-256 of its bytes) is `hash`, or -1. */
export function findExtrinsicIndex(extrinsics: readonly string[], hash: string): number {
  const wanted = hash.toLowerCase()
  return extrinsics.findIndex(
    (extrinsic) => bytesToHex(Blake2256(hexToBytes(extrinsic as Hex))).toLowerCase() === wanted,
  )
}

/** An EVM log as an event of the batch carries it. */
export type SellEvmLog = { address: Hex; topics: Hex[]; data: Hex }

/** What one extrinsic's events say. */
export type SellExtrinsicEvents = {
  /** `System.ExtrinsicSuccess`: the batch went through. */
  succeeded: boolean
  /** `System.ExtrinsicFailed`: the batch failed and was rolled back. */
  failed: boolean
  /** `EVM.ExecutedFailed`: an EVM call inside the batch reverted (the batch still went through). */
  evmFailed: boolean
  /** `EVM.Log`s, in order. */
  logs: SellEvmLog[]
}

type Variant = { type?: unknown; value?: unknown }

const asVariant = (value: unknown): Variant =>
  value !== null && typeof value === "object" ? (value as Variant) : {}

/** A decoded hex value: sapi gives `Binary` / `FixedSizeBinary` (`asHex()`), or hex text. */
const toHex = (value: unknown): Hex | undefined => {
  if (typeof value === "string") return /^0x[0-9a-fA-F]*$/.test(value) ? (value as Hex) : undefined
  if (value instanceof Uint8Array) return bytesToHex(value)
  if (value !== null && typeof value === "object") {
    const { asHex } = value as { asHex?: unknown }
    if (typeof asHex === "function") return toHex(asHex.call(value))
  }
  return undefined
}

const isNamed = (value: unknown, name: string) =>
  typeof value === "string" && value.toLowerCase() === name.toLowerCase()

/**
 * The events of the extrinsic at `extrinsicIndex`, from the block's `System.Events` as sapi decodes
 * them (`{ phase: { type: "ApplyExtrinsic", value }, event: { type: <pallet>, value: { type:
 * <event>, value } } }`). Records of other extrinsics, and anything that doesn't read, are skipped.
 */
export function extrinsicEventsFromRecords(
  records: unknown,
  extrinsicIndex: number,
): SellExtrinsicEvents {
  const result: SellExtrinsicEvents = {
    succeeded: false,
    failed: false,
    evmFailed: false,
    logs: [],
  }
  if (!Array.isArray(records)) return result
  for (const record of records) {
    const { phase, event } = (record ?? {}) as { phase?: unknown; event?: unknown }
    const phaseVariant = asVariant(phase)
    if (!isNamed(phaseVariant.type, "ApplyExtrinsic") || phaseVariant.value !== extrinsicIndex)
      continue
    const pallet = asVariant(event)
    const inner = asVariant(pallet.value)
    if (isNamed(pallet.type, "System") && isNamed(inner.type, "ExtrinsicSuccess"))
      result.succeeded = true
    if (isNamed(pallet.type, "System") && isNamed(inner.type, "ExtrinsicFailed"))
      result.failed = true
    if (!isNamed(pallet.type, "EVM")) continue
    if (isNamed(inner.type, "ExecutedFailed")) result.evmFailed = true
    if (!isNamed(inner.type, "Log")) continue
    const { log } = (inner.value ?? {}) as { log?: unknown }
    const { address, topics, data } = (log ?? {}) as Record<string, unknown>
    const addressHex = toHex(address)
    const dataHex = toHex(data)
    const topicHexes = Array.isArray(topics) ? topics.map(toHex) : undefined
    if (!addressHex || !dataHex || !topicHexes || topicHexes.some((topic) => topic === undefined))
      continue
    result.logs.push({ address: addressHex, topics: topicHexes as Hex[], data: dataHex })
  }
  return result
}

/**
 * Every Intents contract on Subtensor EVM the SDK knows, of every order format (`KNOWN_SETTLERS`).
 * The SDK (1.5.1) opens a sell's order on the one its quote was priced for, which it takes from the
 * Quoter (`settlerLookup`) only when it is in this list: TAO.com's 9737 contract since 2026-11-12,
 * the 16AE one for a sell sent before then.
 */
export const BITTENSOR_INTENTS_CONTRACTS: readonly string[] = Object.values(KNOWN_SETTLERS).flatMap(
  (byChain) => byChain[SUBTENSOR_EVM] ?? [],
)

/**
 * The order an `Open` log of an Intents contract on Subtensor EVM (any of `settlers`) announces, as
 * the SDK reads it from a transaction's receipt; `null` when there is none. The `Open` event is the
 * same on every contract; a 9737 order's longer `originData` (it ends with `refundTo`) isn't read.
 */
export function openedOrderFromLogs(
  logs: readonly SellEvmLog[],
  settlers: readonly string[] = BITTENSOR_INTENTS_CONTRACTS,
): SellOrderRef | null {
  const events = parseEventLogs({
    abi: intentsAbi,
    eventName: "Open",
    logs: logs as unknown as Log[],
  })
  const known = new Set(settlers.map((settler) => settler.toLowerCase()))
  const open = events.find((event) => known.has(event.address.toLowerCase()))
  const resolved = open?.args.resolvedOrder
  const destinationChainId = resolved?.fillInstructions[0]?.destinationChainId
  if (!open || !resolved || destinationChainId === undefined) return null
  return {
    orderId: open.args.orderId,
    originChainId: BITTENSOR_CHAIN_ID,
    destinationChainId: Number(destinationChainId),
    fillDeadline: Number(resolved.fillDeadline),
  }
}

/** A hotkey (SS58 or 32-byte hex) as the 32-byte hex `recoverStake` names it; `undefined` if unreadable. */
const hotkeyAccountId = (hotkey: string): Hex | undefined => {
  try {
    return parseSubstrateAddress(hotkey)?.accountId
  } catch {
    // A bad SS58 checksum.
    return undefined
  }
}

/**
 * Whether the extrinsic's events were read at all: every applied extrinsic ends with
 * `System.ExtrinsicSuccess` or `System.ExtrinsicFailed`. Without either (the block's state is
 * pruned, or `System.Events` read as nothing), the absence of an `Open` log proves nothing.
 */
export const hasExtrinsicOutcome = (events: SellExtrinsicEvents): boolean =>
  events.succeeded || events.failed

/**
 * What a sell's extrinsic, found in a block, did, or `null` when its events can't tell
 * (`hasExtrinsicOutcome`):
 *
 * - failed on chain: rolled back, nothing moved (`notIncluded`);
 * - an `Open` log from one of the Intents contracts (`BITTENSOR_INTENTS_CONTRACTS`): the order is
 *   open;
 * - otherwise the batch went through but the swap didn't open, as the SDK reads it: for alpha, the
 *   stake now sits at the account's EVM mirror on the sold subnet and hotkey.
 */
export function sellExtrinsicOutcome(
  events: SellExtrinsicEvents,
  input: SellRecordInput,
): UnconfirmedSellOutcome | null {
  if (!hasExtrinsicOutcome(events)) return null
  if (events.failed) return { kind: "notIncluded" }
  const order = events.evmFailed ? null : openedOrderFromLogs(events.logs)
  if (order) return { kind: "opened", order }
  if (input.kind !== "alpha") return { kind: "notOpened" }
  const hotkey = hotkeyAccountId(input.hotkey)
  return hotkey
    ? { kind: "notOpened", strandedAlpha: { netuid: input.netuid, hotkey } }
    : { kind: "notOpened" }
}
