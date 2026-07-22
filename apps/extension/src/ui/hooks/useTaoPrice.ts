import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { taoPriceApi } from "@ui/domains/Portfolio/taoPriceApi"

const BLOCK_STALE_TIME = 12_000

export const useTaoPrice = () =>
  useQuery({
    queryKey: ["tao-price"],
    queryFn: () => taoPriceApi.getTaoPrice(),
    refetchInterval: BLOCK_STALE_TIME / 2,
    staleTime: BLOCK_STALE_TIME,
    placeholderData: keepPreviousData,
  })
