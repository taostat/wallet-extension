import { fetchTaostats } from "@ui/domains/Staking/hooks/bittensor/dTao/fetchTaostats"

export type TaoPriceResponse = {
  price: string
  percent_change_24h: string
}

export const taoPriceApi = {
  getTaoPrice: () => fetchTaostats<TaoPriceResponse>({ path: "/tao-price" }),
}
