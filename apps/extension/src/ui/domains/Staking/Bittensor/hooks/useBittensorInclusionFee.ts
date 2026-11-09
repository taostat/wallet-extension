import { useQuery } from "@tanstack/react-query"
import { DotNetworkId } from "@taostats-wallet/chaindata-provider"
import { ScaleApi } from "@taostats-wallet/sapi"

import { useDotNetwork } from "@ui/state"

import { MEVSHIELD_SERVER_FEE_RAO } from "../utils/constants"
import { getBittensorInclusionFee } from "../utils/helpers"
import { StakeDirection } from "./types"

/** Fixed size so the fee does not refetch when the quote or the typed amount changes. */
const FEE_PROBE_AMOUNT = 1_000_000_000n

type UseBittensorInclusionFeeProps = {
  sapi: ScaleApi | undefined | null
  address: string | null
  hotkey: string | null | undefined
  netuid: number | null
  networkId: DotNetworkId | undefined
  direction: StakeDirection
  forTaostatsShield?: boolean
  hasTaostatsFee?: boolean
  enabled?: boolean
}

export const useBittensorInclusionFee = ({
  sapi,
  address,
  hotkey,
  netuid,
  networkId,
  direction,
  forTaostatsShield,
  hasTaostatsFee,
  enabled = true,
}: UseBittensorInclusionFeeProps) => {
  const chain = useDotNetwork(networkId)
  const genesisHash = chain?.genesisHash?.startsWith("0x")
    ? (chain.genesisHash as `0x${string}`)
    : undefined
  const isRoot = netuid === 0

  return useQuery({
    queryKey: [
      "bittensorInclusionFee",
      sapi?.id,
      direction,
      isRoot,
      !!forTaostatsShield,
      !!hasTaostatsFee,
    ],
    retry: false,
    enabled:
      !!enabled && !!sapi && !!address && !!hotkey && typeof netuid === "number" && !!genesisHash,
    queryFn: () => {
      if (!sapi || !address || !hotkey || typeof netuid !== "number" || !genesisHash)
        throw new Error("Fee estimate is not ready")

      return getBittensorInclusionFee({
        sapi,
        address,
        hotkey,
        netuid,
        amount: FEE_PROBE_AMOUNT,
        priceLimit: FEE_PROBE_AMOUNT,
        taostatsFee: hasTaostatsFee ? 1n : 0n,
        serverFeeForShieldRao: forTaostatsShield ? MEVSHIELD_SERVER_FEE_RAO : undefined,
        genesisHash,
        action: direction === "taoToAlpha" ? "stake" : "unstake",
      })
    },
  })
}
