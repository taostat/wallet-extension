import { useQuery } from "@tanstack/react-query"
// The SDK-free entrypoint: this module is in the side panel's and dashboard's first load, so it
// must not pull in the swap SDK or viem (they load with the sell modal's content only).
import { fetchCrossChainConfig } from "@taostats-wallet/cross-chain/config"
import { Account, isAccountAddressSs58, isAccountOfType } from "extension-core"
import { log, TAOSTATS_API_URL } from "extension-shared"

/**
 * Cross-chain sells (TAO or alpha for USDC / ETH on Ethereum) are behind two gates:
 *
 * - the build: `process.env.CROSS_CHAIN_SELL`, on in every debug build and in any other built with
 *   `CROSS_CHAIN_SELL=true` (webpack's `DefinePlugin`);
 * - our API's cross-chain config (`GET ${TAOSTATS_API_URL}/cross-chain/config`), whose `enabled` is
 *   the kill switch. A config that can't be had falls back to the built-in one, which is on.
 *
 * An entry point also needs an account that can sign without a prompt (a local keypair).
 */
export const IS_CROSS_CHAIN_SELL_BUILD = process.env.CROSS_CHAIN_SELL === "true"

const CROSS_CHAIN_CONFIG_STALE_TIME = 5 * 60_000

/** Our API's cross-chain config (or the built-in one, with the reason logged). */
export const useCrossChainConfig = () =>
  useQuery({
    queryKey: ["crossChainConfig", TAOSTATS_API_URL],
    queryFn: async () => {
      const result = await fetchCrossChainConfig(TAOSTATS_API_URL ?? "")
      if (result.problem) log.debug("[cross-chain] Using the built-in config:", result.problem)
      return result
    },
    enabled: IS_CROSS_CHAIN_SELL_BUILD,
    staleTime: CROSS_CHAIN_CONFIG_STALE_TIME,
    // `fetchCrossChainConfig` never throws: it falls back to the defaults itself.
    retry: false,
    refetchOnWindowFocus: false,
  })

/** Both gates are on. `false` while our API's config is loading. */
export const useIsCrossChainSellEnabled = () => {
  const { data } = useCrossChainConfig()
  return IS_CROSS_CHAIN_SELL_BUILD && data?.config.enabled === true
}

/**
 * Whether `account` can sell: a local keypair with an SS58 address, the accounts
 * `useCrossChainSigner` makes a signer for (no Ledger, Vault, Signet or watched account).
 */
export const canAccountSellCrossChain = (account: Account | null | undefined): account is Account =>
  isAccountOfType(account, "keypair") && isAccountAddressSs58(account)
