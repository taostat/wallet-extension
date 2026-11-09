import { SignerPayloadJSON } from "@polkadot/types/types"
import { useQuery } from "@tanstack/react-query"
import { ScaleApi } from "@taostats-wallet/sapi"

type GetNomPoolFeeEstimate = {
  sapi: ScaleApi | undefined | null
  payload: SignerPayloadJSON | undefined
  retry?: boolean | number
}

export const useGetFeeEstimate = ({ sapi, payload, retry }: GetNomPoolFeeEstimate) => {
  return useQuery({
    queryKey: ["feeEstimate", sapi?.id, payload],
    queryFn: () => {
      if (!sapi || !payload) return null
      return sapi.getFeeEstimate(payload)
    },
    enabled: !!sapi && !!payload,
    retry,
  })
}
