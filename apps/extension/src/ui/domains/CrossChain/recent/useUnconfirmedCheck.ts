import { useQuery } from "@tanstack/react-query"
import {
  BlockSearchResult,
  CrossChainSellRecord,
  extrinsicEventsFromRecords,
  extrinsicSearchRange,
  extrinsicSearchVerdict,
  findExtrinsicIndex,
  sellAnalyticsContext,
  sellExtrinsicOutcome,
  swapFailedEvent,
  swapSubmittedEvent,
  UnconfirmedSellOutcome,
} from "@taostats-wallet/cross-chain"
import { ScaleApi } from "@taostats-wallet/sapi"
import { db } from "extension-core"
import { log } from "extension-shared"

import { api } from "@ui/api"
import { useScaleApi } from "@ui/hooks/sapi/useScaleApi"
import { useNetworkById } from "@ui/state"

import { BITTENSOR_MAINNET_ID } from "../constants"
import { captureCrossChainEvent } from "../crossChainAnalytics"
import { resolveCrossChainUnconfirmedSell } from "../records/sellRecordsStore"

/** Blocks read at once while looking for the extrinsic. */
const BLOCKS_PER_BATCH = 4

/** What a look found. */
export type UnconfirmedCheck =
  /** It was found and the record now says how it ended. */
  | "resolved"
  /** Not in a block yet, and it still could be. */
  | "pending"
  /** It can't be told from here (not in History, or its block can't be read). */
  | "unknown"

type Block = { block?: { extrinsics?: unknown } } | null

const HASH = /^0x[0-9a-fA-F]{64}$/

/**
 * Reads one block and looks for the extrinsic in it. A block whose hash or body can't be had (an
 * RPC that failed or answered nothing) is `unreadable`, never `absent`: it might be the one.
 */
const searchBlock = async (number: number, extrinsicHash: string): Promise<BlockSearchResult> => {
  try {
    const blockHash = await api.subSend<string | null>(BITTENSOR_MAINNET_ID, "chain_getBlockHash", [
      number,
    ])
    if (typeof blockHash !== "string" || !HASH.test(blockHash)) return { kind: "unreadable" }
    const block = await api.subSend<Block>(BITTENSOR_MAINNET_ID, "chain_getBlock", [blockHash])
    const extrinsics = block?.block?.extrinsics
    if (!Array.isArray(extrinsics) || extrinsics.some((item) => typeof item !== "string"))
      return { kind: "unreadable" }
    const extrinsicIndex = findExtrinsicIndex(extrinsics as string[], extrinsicHash)
    return extrinsicIndex === -1
      ? { kind: "absent" }
      : { kind: "found", blockHash: blockHash as `0x${string}`, extrinsicIndex }
  } catch (error) {
    log.debug("[cross-chain] Couldn't read a block", { number, error })
    return { kind: "unreadable" }
  }
}

/**
 * Finds a sell's extrinsic on Bittensor by its hash and reads what it did. Only reads: nothing is
 * ever sent again. The blocks it could be in come from its History entry (the block History saw it
 * in, else the blocks its mortal era allows: `extrinsicSearchRange`).
 */
export const lookUpSellExtrinsic = async (
  record: CrossChainSellRecord,
  sapi: ScaleApi,
): Promise<UnconfirmedSellOutcome | "pending" | "unknown"> => {
  const hash = record.extrinsicHash
  if (!hash) return "unknown"
  const tx = (await db.transactionsV2.get(record.id)) ?? (await db.transactionsV2.get(hash))
  const birthBlock = tx ? Number(tx.payload.blockNumber) : NaN
  if (!tx || !Number.isSafeInteger(birthBlock)) return "unknown"
  const seenBlock =
    (tx.status === "success" || tx.status === "error") && tx.blockNumber !== undefined
      ? Number(tx.blockNumber)
      : undefined
  const includedBlock = Number.isSafeInteger(seenBlock) ? seenBlock : undefined

  const header = await api.subSend<{ number?: string } | null>(
    BITTENSOR_MAINNET_ID,
    "chain_getHeader",
    [],
  )
  const headBlock = Number(header?.number)
  if (!Number.isSafeInteger(headBlock)) return "unknown"
  const range = extrinsicSearchRange({ birthBlock, includedBlock, headBlock })

  // In range order, a few blocks at a time, stopping at the block that has it or at the first that
  // can't be read (nothing can be proven past it).
  const results: BlockSearchResult[] = []
  for (let from = range.from; from <= range.to; from += BLOCKS_PER_BATCH) {
    const numbers = Array.from(
      { length: Math.min(BLOCKS_PER_BATCH, range.to - from + 1) },
      (_, i) => from + i,
    )
    results.push(...(await Promise.all(numbers.map((number) => searchBlock(number, hash)))))
    if (results.some((result) => result.kind !== "absent")) break
  }

  const verdict = extrinsicSearchVerdict(range, results)
  switch (verdict.kind) {
    case "found": {
      const events = await sapi.getStorage<unknown>("System", "Events", [], verdict.blockHash)
      // Its events must be readable (pruned state reads as nothing): without them, no `Open` log
      // proves nothing.
      return (
        sellExtrinsicOutcome(
          extrinsicEventsFromRecords(events, verdict.extrinsicIndex),
          record.from,
        ) ?? "unknown"
      )
    }
    case "notIncluded":
      return { kind: "notIncluded" }
    case "pending":
      return "pending"
    case "unknown":
      return "unknown"
  }
}

/**
 * "Check again" for a sell sent but not seen in a block: looks it up when shown and on each
 * `check()`, and saves what it finds. Whoever resolves the record first reports it (analytics),
 * so two pages checking the same send report it once.
 */
export const useUnconfirmedCheck = (record: CrossChainSellRecord, isInFlight: boolean) => {
  const network = useNetworkById(BITTENSOR_MAINNET_ID, "polkadot")
  const { data: sapi } = useScaleApi(network?.genesisHash)

  const query = useQuery({
    queryKey: ["crossChainUnconfirmedSell", record.id],
    queryFn: async (): Promise<UnconfirmedCheck> => {
      if (!sapi) return "unknown"
      const outcome = await lookUpSellExtrinsic(record, sapi)
      log.debug("[cross-chain] Checked an unconfirmed sell", {
        extrinsicHash: record.extrinsicHash,
        outcome: typeof outcome === "string" ? outcome : outcome.kind,
      })
      if (typeof outcome === "string") return outcome
      const { resolved } = await resolveCrossChainUnconfirmedSell(record.id, outcome)
      if (resolved) {
        const context = sellAnalyticsContext(record)
        captureCrossChainEvent(
          outcome.kind === "opened"
            ? swapSubmittedEvent(context)
            : swapFailedEvent(
                context,
                outcome.kind === "notOpened" ? "evmCallFailed" : "substrateError",
              ),
        )
      }
      return "resolved"
    },
    // Not while this page's run is still deciding how it ended.
    enabled: !!sapi && record.status === "unconfirmed" && !isInFlight,
    // Only "Check again" reads it again.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  })

  return {
    result: query.data,
    isChecking: query.isFetching,
    hasFailed: query.isError,
    check: () => void query.refetch(),
  }
}
