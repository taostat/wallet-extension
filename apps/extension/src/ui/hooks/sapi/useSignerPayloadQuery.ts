import { SignerPayloadJSON } from "@polkadot/types/types"
import { keepPreviousData, QueryKey, useQuery } from "@tanstack/react-query"
import { ERA_PERIOD, ScaleApi } from "@taostats-wallet/sapi"
import { useEffect, useState } from "react"

// Bittensor target block time. Used to refresh a mortal payload before the node rejects it.
const BITTENSOR_BLOCK_TIME_MS = 12_000

// The payload era is anchored on the finalized head, which can sit up to half an era behind.
const WORST_CASE_ERA_BLOCKS_LEFT = ERA_PERIOD / 2

type PayloadAge = { builtAt: number; eraBlocksLeft: number }

type SignerPayloadResult = { payload: SignerPayloadJSON }

// Rebuild well within the mortal era so a form left open does not submit an expired payload.
const getPayloadRefreshIntervalMs = (blockTimeMs: number, eraBlocksLeft: number) =>
  blockTimeMs * Math.max(1, eraBlocksLeft / 4)

// A stalled rebuild (background tab, failed refresh) withholds the payload past this time.
const getPayloadExpiresAt = ({ builtAt, eraBlocksLeft }: PayloadAge, blockTimeMs: number) =>
  builtAt + (blockTimeMs * eraBlocksLeft) / 2

const getEraBlocksLeft = async (
  sapi: ScaleApi | null | undefined,
  payload: SignerPayloadJSON,
): Promise<number> => {
  try {
    if (!sapi) return WORST_CASE_ERA_BLOCKS_LEFT
    const headRaw = await sapi.getStorage<number | bigint>("System", "Number", [])
    const head = Number(headRaw)
    const birth = Number(payload.blockNumber)
    if (!Number.isFinite(head) || !Number.isFinite(birth)) return WORST_CASE_ERA_BLOCKS_LEFT
    return Math.max(0, ERA_PERIOD - (head - birth))
  } catch {
    return WORST_CASE_ERA_BLOCKS_LEFT
  }
}

const useIsPast = (deadline: number | null) => {
  const [passedDeadline, setPassedDeadline] = useState<number | null>(null)
  useEffect(() => {
    if (deadline === null) return
    const timeout = setTimeout(() => setPassedDeadline(deadline), deadline - Date.now())
    return () => clearTimeout(timeout)
  }, [deadline])
  return deadline !== null && (passedDeadline === deadline || Date.now() > deadline)
}

type UseSignerPayloadQueryOptions<T extends SignerPayloadResult> = {
  sapi: ScaleApi | null | undefined
  queryKey: QueryKey
  queryFn: () => Promise<T | null>
  enabled?: boolean
  blockTimeMs?: number
}

/**
 * Builds a substrate signer payload and keeps it inside its mortal era.
 * A payload too old to sign is withheld until a fresh one is ready.
 * Previous data stays mounted while a new amount is fetched (`isPlaceholderData`).
 */
export const useSignerPayloadQuery = <T extends SignerPayloadResult>({
  sapi,
  queryKey,
  queryFn,
  enabled,
  blockTimeMs = BITTENSOR_BLOCK_TIME_MS,
}: UseSignerPayloadQueryOptions<T>) => {
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const builtAt = Date.now()
      const result = await queryFn()
      if (!result) return null
      return { ...result, builtAt, eraBlocksLeft: await getEraBlocksLeft(sapi, result.payload) }
    },
    enabled,
    placeholderData: keepPreviousData,
    retry: false,
    refetchInterval: (current) =>
      current.state.data
        ? getPayloadRefreshIntervalMs(blockTimeMs, current.state.data.eraBlocksLeft)
        : false,
    refetchIntervalInBackground: true,
  })

  const expiresAt =
    query.data && !query.isPlaceholderData ? getPayloadExpiresAt(query.data, blockTimeMs) : null
  const isExpired = useIsPast(expiresAt)

  return {
    data: isExpired ? undefined : query.data,
    isPlaceholderData: query.isPlaceholderData,
    isLoading: query.isLoading || isExpired,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
