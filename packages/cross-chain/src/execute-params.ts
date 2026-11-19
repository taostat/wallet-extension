import type { QuoteParams, SubstrateExecuteParams } from "@tao.com/intents-sdk"
import { parseSubstrateAddress } from "@tao.com/intents-sdk"

/**
 * What `execute` is called with, from the review's firm quote params. The signer (`substrate`),
 * `signal` and `onProgress` are added by whatever runs it.
 */
export type CrossChainExecuteParams = Omit<
  SubstrateExecuteParams,
  "substrate" | "wallet" | "signal" | "onProgress"
>

/**
 * The swap of a non-USDC input (TAO, alpha) into the USDC the order escrows may return at most
 * this much less than priced (`swapSlippageBps`). The user's slippage setting, kept within these
 * bounds:
 *
 * - at least 0.5%: below that the on-chain swap reverts on ordinary pool movement, and for a
 *   coldkey's batch a revert strands the alpha at the account's EVM mirror (`EVM_CALL_FAILED`);
 * - at most 3%: the swap leg is public, and a loose floor invites sandwiching.
 *
 * The output itself is guarded by `minOutputAmount`, whatever this is.
 */
export const MIN_SWAP_SLIPPAGE_BPS = 50
export const MAX_SWAP_SLIPPAGE_BPS = 300

export const swapSlippageFor = (slippageBps: number): number =>
  Math.min(MAX_SWAP_SLIPPAGE_BPS, Math.max(MIN_SWAP_SLIPPAGE_BPS, slippageBps))

/**
 * `execute`'s parameters for the review's firm quote params: the same route, amount, recipient and
 * alpha hotkey the review priced, without the quote's payer (`execute` takes the signer instead),
 * plus the guards:
 *
 * - `minOutputAmount`: the accepted output less slippage, so nothing worse than what the user
 *   accepted is signed;
 * - `slippageBps`: how far the SDK's own re-quote (after an expiry) may fall below its first one;
 * - `swapSlippageBps`: see `swapSlippageFor`;
 * - `partnerId`: TAO.com attribution, when the caller has one.
 */
export function buildExecuteParams({
  params,
  minOutputAmount,
  slippageBps,
  partnerId,
}: {
  params: QuoteParams
  minOutputAmount: bigint
  slippageBps: number
  partnerId: string | undefined
}): CrossChainExecuteParams {
  const { user: _user, substrateAccount: _substrateAccount, ...route } = params
  return {
    ...route,
    minOutputAmount,
    slippageBps,
    swapSlippageBps: swapSlippageFor(slippageBps),
    ...(partnerId !== undefined && { partnerId }),
  }
}

/** The 32-byte account id behind an SS58 address or `0x` key (lower case), or `undefined`. */
const substrateAccountId = (address: string): string | undefined => {
  try {
    return parseSubstrateAddress(address.trim())?.accountId.toLowerCase()
  } catch {
    return undefined
  }
}

/**
 * The paying coldkey changed since the review was opened (another account selected, or none):
 * what the review priced is no longer what would be signed, so it can't be confirmed. Accounts are
 * compared by key, whatever their SS58 format.
 */
export function hasPayerChanged({
  reviewedColdkey,
  coldkey,
}: {
  /** The coldkey the review's quote was requested for (`substrateAccount`). */
  reviewedColdkey: string | null | undefined
  /** The coldkey selected now. */
  coldkey: string | null | undefined
}): boolean {
  if (!reviewedColdkey || !coldkey) return true
  const reviewed = substrateAccountId(reviewedColdkey)
  return reviewed === undefined || reviewed !== substrateAccountId(coldkey)
}
