import { DotNetworkId, TokenId } from "@taostats-wallet/chaindata-provider"
import { DEFAULT_TOKEN_RATES_CONFIG, TokenRatesApiConfig } from "@taostats-wallet/token-rates"
import { atom } from "jotai"

const innerCoinsApiConfigAtom = atom<TokenRatesApiConfig>(DEFAULT_TOKEN_RATES_CONFIG)
export const coinsApiConfigAtom = atom<TokenRatesApiConfig, [Partial<TokenRatesApiConfig>], void>(
  (get) => get(innerCoinsApiConfigAtom),
  (_get, set, options) =>
    set(innerCoinsApiConfigAtom, {
      apiUrl: options.apiUrl ?? DEFAULT_TOKEN_RATES_CONFIG.apiUrl,
    }),
)

export const enableTestnetsAtom = atom<boolean>(false)

export const enabledChainsAtom = atom<DotNetworkId[] | undefined>(undefined)
export const enabledTokensAtom = atom<TokenId[] | undefined>(undefined)
