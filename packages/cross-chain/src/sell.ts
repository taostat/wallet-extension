import type { QuoteParams } from "@tao.com/intents-sdk"

import { ALPHA_DECIMALS, formatRawAmount, parseAmountToRaw, TAO_DECIMALS } from "./amounts"
import { evmRecipientProblem } from "./recipient"

/**
 * A sell: TAO or one subnet alpha position of a wallet account (a Bittensor coldkey), for USDC or
 * ETH delivered to an Ethereum address. The rules are the website's cross-chain swap's, for this
 * one route shape.
 */

/** Ethereum mainnet, as the SDK names it. */
export const ETHEREUM_CHAIN_ID = 1
/** Subtensor EVM (Bittensor mainnet), as the SDK names it. */
export const BITTENSOR_CHAIN_ID = 964

/** Highest netuid the SDK accepts (`MAX_NETUID`). Netuid 0 (root) is not sold here. */
export const MAX_SELL_NETUID = 10_000

/** What is sold: the account's TAO, or its alpha on one subnet and hotkey. */
export type SellInput =
  | { kind: "tao" }
  | {
      kind: "alpha"
      netuid: number
      /** The hotkey the stake sits on (SS58): the settler can only unstake from it. */
      hotkey: string
    }

/** What is delivered on Ethereum. */
export type SellOutput = "USDC" | "ETH"

export const SELL_OUTPUTS: readonly SellOutput[] = ["USDC", "ETH"]

/** Whether `netuid` can be sold: a whole number from 1 to 10 000. */
export const isSellNetuid = (netuid: number): boolean =>
  Number.isInteger(netuid) && netuid >= 1 && netuid <= MAX_SELL_NETUID

/** The SDK's `inputToken`: `TAO` or `SN<netuid>`. */
export const sellInputToken = (input: SellInput): string =>
  input.kind === "tao" ? "TAO" : `SN${input.netuid}`

/** Decimals of the amount typed: TAO and alpha are both in rao. */
export const sellInputDecimals = (input: SellInput): number =>
  input.kind === "tao" ? TAO_DECIMALS : ALPHA_DECIMALS

/** Decimals of `quote.outputAmount`: USDC 6, ETH 18. */
export const sellOutputDecimals = (output: SellOutput): number => (output === "USDC" ? 6 : 18)

// ------------------------------------------------------------------ max and balance checks

/**
 * TAO a coldkey's batch spends on top of a TAO amount: the extrinsic fee (~0.0067 TAO measured by
 * the SDK) plus the EVM gas the batch funds for `open`, with headroom. The website's
 * `TAO_NATIVE_BATCH_FEE_RAO`.
 */
export const TAO_NATIVE_BATCH_FEE_RAO = 20_000_000n // 0.02 TAO

/**
 * Free TAO a coldkey needs to sell alpha: the batch with the staking-precompile approval costs
 * ~0.027 TAO (SDK measurement). Not taken off the alpha (alpha is not TAO): checked against the free
 * TAO balance. The website's `ALPHA_INPUT_TAO_FEE_RAO`.
 */
export const ALPHA_INPUT_TAO_FEE_RAO = 30_000_000n // 0.03 TAO

/** The website's site-wide fee reserve (`FEE_RESERVE_TAO`, 0.05 TAO). */
export const TAO_FEE_RESERVE_RAO = 50_000_000n

/** TAO Max leaves on the account: the fee reserve plus the batch fee (0.07 TAO). */
export const TAO_MAX_RESERVE_RAO = TAO_FEE_RESERVE_RAO + TAO_NATIVE_BATCH_FEE_RAO

/**
 * The most that can be sold from `balanceRaw`:
 *
 * - TAO: the balance less `TAO_MAX_RESERVE_RAO`, never below 0;
 * - alpha: the whole position (the SDK trims a whole-stake sale by the 2 rao it needs itself).
 */
export function maxSellRaw(kind: SellInput["kind"], balanceRaw: bigint): bigint {
  if (kind === "alpha") return balanceRaw > 0n ? balanceRaw : 0n
  const max = balanceRaw - TAO_MAX_RESERVE_RAO
  return max > 0n ? max : 0n
}

/**
 * What stops the account selling `amountRaw`, or `null`. Only certain failures, and only against
 * balances that are known (`undefined` while loading):
 *
 * - `balance`: more than the TAO available, or than the alpha position;
 * - `fee`: TAO must leave `TAO_NATIVE_BATCH_FEE_RAO` on top of the amount; alpha needs
 *   `ALPHA_INPUT_TAO_FEE_RAO` of free TAO for its batch.
 */
export function sellShortfall({
  kind,
  amountRaw,
  balanceRaw,
  freeTaoRaw,
}: {
  kind: SellInput["kind"]
  amountRaw: bigint
  /** The sold asset's balance: available TAO, or the alpha position (rao). */
  balanceRaw: bigint | undefined
  /** The account's available TAO (rao), for an alpha sale's fee. */
  freeTaoRaw?: bigint
}): "balance" | "fee" | null {
  if (balanceRaw !== undefined && amountRaw > balanceRaw) return "balance"
  if (kind === "tao")
    return balanceRaw !== undefined && balanceRaw - amountRaw < TAO_NATIVE_BATCH_FEE_RAO
      ? "fee"
      : null
  return freeTaoRaw !== undefined && freeTaoRaw < ALPHA_INPUT_TAO_FEE_RAO ? "fee" : null
}

// --------------------------------------------------------------------------- quote params

/**
 * Stand-in for a recipient that isn't typed yet (or isn't valid yet), so the form can show an
 * estimate: `0x…dEaD`, the conventional burn address, which nobody holds a key for. A quote built
 * with it is never opened (`isIndicative`). The website's `PLACEHOLDER_EVM_ADDRESS`.
 */
export const PLACEHOLDER_EVM_ADDRESS = "0x000000000000000000000000000000000000dEaD"

/** Why no quote can be asked for yet. */
export type SellQuoteBlocker =
  /** No amount, or zero. */
  | "missingAmount"
  /** The amount is not a dot-decimal number. */
  | "invalidAmount"
  /** Netuid 0 or out of range, or no hotkey for an alpha sale. */
  | "invalidInput"
  /** No paying account. */
  | "missingAccount"

/** A stable, serialisable query key: strings only. */
export type SellQuoteKey = readonly [
  "crossChainSellQuote",
  inputToken: string,
  outputToken: string,
  amount: string,
  substrateAccount: string,
  recipient: string,
  alphaHotkey: string,
]

export type SellQuoteParamsResult =
  | {
      ok: true
      params: QuoteParams
      /** The recipient is a placeholder: an estimate, never to be opened. */
      isIndicative: boolean
      queryKey: SellQuoteKey
    }
  | { ok: false; reason: SellQuoteBlocker }

/**
 * The SDK's `QuoteParams` for a sell: Subtensor EVM (964) → Ethereum (1), `TAO` or `SN<netuid>`
 * with the position's `alphaHotkey`, paid by `substrateAccount` (the coldkey), delivered to the
 * typed EVM `recipient`. A recipient that is empty or not valid yet is replaced by
 * `PLACEHOLDER_EVM_ADDRESS` and the result is `isIndicative`.
 */
export function buildSellQuoteParams({
  input,
  output,
  amount,
  coldkey,
  recipient,
}: {
  input: SellInput
  output: SellOutput
  /** Dot-decimal amount, as typed. */
  amount: string
  /** The paying account (SS58). */
  coldkey: string | null | undefined
  /** The typed Ethereum recipient. */
  recipient: string | null | undefined
}): SellQuoteParamsResult {
  if (input.kind === "alpha" && (!isSellNetuid(input.netuid) || !input.hotkey.trim()))
    return { ok: false, reason: "invalidInput" }

  const amountText = amount.trim()
  if (amountText === "") return { ok: false, reason: "missingAmount" }
  const decimals = sellInputDecimals(input)
  const raw = parseAmountToRaw(amountText, decimals)
  if (raw === null) return { ok: false, reason: "invalidAmount" }
  if (raw === 0n) return { ok: false, reason: "missingAmount" }

  const substrateAccount = coldkey?.trim()
  if (!substrateAccount) return { ok: false, reason: "missingAccount" }

  const typed = recipient?.trim() ?? ""
  const isRealRecipient = typed !== "" && evmRecipientProblem(typed) === null
  const to = isRealRecipient ? typed : PLACEHOLDER_EVM_ADDRESS
  const alphaHotkey = input.kind === "alpha" ? input.hotkey.trim() : undefined

  const params: QuoteParams = {
    originChainId: BITTENSOR_CHAIN_ID,
    destinationChainId: ETHEREUM_CHAIN_ID,
    inputToken: sellInputToken(input),
    outputToken: output,
    amount: formatRawAmount(raw, decimals),
    substrateAccount,
    recipient: to,
    ...(alphaHotkey !== undefined && { alphaHotkey }),
  }

  return {
    ok: true,
    params,
    isIndicative: !isRealRecipient,
    queryKey: [
      "crossChainSellQuote",
      sellInputToken(input),
      output,
      params.amount ?? "",
      substrateAccount,
      to,
      alphaHotkey ?? "",
    ],
  }
}
