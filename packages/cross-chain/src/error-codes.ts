/**
 * Errors of a cross-chain sell as codes the UI translates. The SDK's messages are English and
 * never shown. Ported from the website.
 *
 * Errors are read by their fields (`code`, `status`, `paused`, `blocked`, `apiError`,
 * `strandedAlpha`…), not by `instanceof`, so an error from another copy of the SDK (a second
 * bundle, a test double) maps the same way. No runtime import of the SDK.
 */

export type CrossChainErrorCode =
  /** Quoter 429: too many quotes from this IP. Not retried automatically. */
  | "rateLimited"
  /** Quoter 503 `SETTLER_PAUSED`: the Intents contract is paused (maintenance). */
  | "paused"
  /** No answer from the Quoter (offline, or this origin blocked), or a 403. */
  | "unreachable"
  /** The Quoter is up but couldn't quote right now (503 / 502 fan-out). Retry shortly. */
  | "serviceUnavailable"
  /** 502 / 422 `ALL_SOLVERS_FAILED`: no solver for this route and amount. Try another amount. */
  | "noRoute"
  | "invalidParams"
  | "unsupportedRoute"
  /** The TAO or alpha could not be priced into USDC (no pool liquidity). */
  | "swapQuoteFailed"
  | "quoteExpired"
  /** `required` / `available` in the details when the SDK gave them. */
  | "insufficientBalance"
  /** Not enough native token to pay gas. */
  | "insufficientGas"
  /** A wallet prompt was dismissed. Silent. */
  | "userRejected"
  /** A simulation reverted. */
  | "contractRevert"
  /** EVM only: mined but reverted. */
  | "transactionReverted"
  /** EVM only: cancelled or sped up in the wallet. */
  | "transactionReplaced"
  | "walletError"
  | "substrateError"
  /** The coldkey's batch ran but `open` didn't; `strandedAlpha` may be set. */
  | "evmCallFailed"
  /** The quote got worse than the accepted price less slippage. Nothing was sent. */
  | "outputBelowMinimum"
  | "orderNotFound"
  /** Stopped by our own signal. Silent. */
  | "aborted"
  | "timeout"
  | "unknown"

const ALL_CODES: ReadonlySet<string> = new Set<CrossChainErrorCode>([
  "rateLimited",
  "paused",
  "unreachable",
  "serviceUnavailable",
  "noRoute",
  "invalidParams",
  "unsupportedRoute",
  "swapQuoteFailed",
  "quoteExpired",
  "insufficientBalance",
  "insufficientGas",
  "userRejected",
  "contractRevert",
  "transactionReverted",
  "transactionReplaced",
  "walletError",
  "substrateError",
  "evmCallFailed",
  "outputBelowMinimum",
  "orderNotFound",
  "aborted",
  "timeout",
  "unknown",
])

export const isCrossChainErrorCode = (value: string): value is CrossChainErrorCode =>
  ALL_CODES.has(value)

/** Every code. */
export const CROSS_CHAIN_ERROR_CODES = [...ALL_CODES] as CrossChainErrorCode[]

/** Codes the UI does not report: the user did it, or we did. */
const SILENT_CODES: ReadonlySet<CrossChainErrorCode> = new Set(["userRejected", "aborted"])

/** Fields the SDK's errors may carry. Everything optional: read defensively. */
type ErrorFields = {
  code?: unknown
  name?: unknown
  status?: unknown
  apiError?: unknown
  paused?: unknown
  blocked?: unknown
  cause?: unknown
}

const fieldsOf = (error: unknown): ErrorFields | null =>
  error !== null && typeof error === "object" ? (error as ErrorFields) : null

const SDK_CODES: Record<string, CrossChainErrorCode> = {
  INVALID_PARAMS: "invalidParams",
  UNSUPPORTED_ROUTE: "unsupportedRoute",
  SWAP_QUOTE_FAILED: "swapQuoteFailed",
  QUOTE_EXPIRED: "quoteExpired",
  INSUFFICIENT_BALANCE: "insufficientBalance",
  INSUFFICIENT_GAS: "insufficientGas",
  USER_REJECTED: "userRejected",
  CONTRACT_REVERT: "contractRevert",
  TRANSACTION_REVERTED: "transactionReverted",
  TRANSACTION_REPLACED: "transactionReplaced",
  WALLET_ERROR: "walletError",
  SUBSTRATE_ERROR: "substrateError",
  EVM_CALL_FAILED: "evmCallFailed",
  OUTPUT_BELOW_MINIMUM: "outputBelowMinimum",
  ORDER_NOT_FOUND: "orderNotFound",
  ABORTED: "aborted",
  TIMEOUT: "timeout",
  // A quote without `user` reached `open`: our bug, not the user's.
  INDICATIVE_QUOTE: "unknown",
}

/** A Quoter failure (`QuoterError`), by its HTTP status and API error. */
function quoterErrorCode(fields: ErrorFields): CrossChainErrorCode {
  const status = typeof fields.status === "number" ? fields.status : undefined
  const apiError = typeof fields.apiError === "string" ? fields.apiError : undefined

  if (status === 429 || apiError === "RATE_LIMITED") return "rateLimited"
  if (fields.paused === true || apiError === "SETTLER_PAUSED") return "paused"
  if (
    fields.blocked === true ||
    fields.code === "QUOTER_FORBIDDEN" ||
    fields.code === "QUOTER_UNREACHABLE"
  )
    return "unreachable"
  // Status 0 without `blocked` is the SDK's own request timeout.
  if (status === 0 || status === 504) return "timeout"
  if (apiError === "ALL_SOLVERS_FAILED" || status === 422) return "noRoute"
  if (status === 400) return "invalidParams"
  if (status === 502 || status === 503) return "serviceUnavailable"
  return "unknown"
}

/** True for a wallet's "user rejected" anywhere in the cause chain (EIP-1193 4001, viem, ethers). */
function isWalletRejection(error: unknown): boolean {
  let current: unknown = error
  for (let depth = 0; depth < 8; depth++) {
    const fields = fieldsOf(current)
    if (!fields) return false
    if (
      fields.code === 4001 ||
      fields.code === "ACTION_REJECTED" ||
      fields.name === "UserRejectedRequestError"
    )
      return true
    current = fields.cause
  }
  return false
}

/** The code for any thrown value. */
export function toCrossChainErrorCode(error: unknown): CrossChainErrorCode {
  const fields = fieldsOf(error)
  if (!fields) return "unknown"

  const code = typeof fields.code === "string" ? fields.code : undefined
  if (code?.startsWith("QUOTER_")) return quoterErrorCode(fields)
  if (code !== undefined && Object.prototype.hasOwnProperty.call(SDK_CODES, code))
    return SDK_CODES[code]

  // Not the SDK's: a fetch / React Query cancellation, or a wallet's own error.
  if (fields.name === "AbortError" || fields.name === "CancelledError") return "aborted"
  if (isWalletRejection(error)) return "userRejected"
  return "unknown"
}

/** Whether the UI should stay quiet about an error (or a code). */
export function isSilentError(error: unknown): boolean {
  const code =
    typeof error === "string" && isCrossChainErrorCode(error) ? error : toCrossChainErrorCode(error)
  return SILENT_CODES.has(code)
}

const isHash = (value: unknown): value is `0x${string}` =>
  typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value)

/**
 * Alpha left at the coldkey's EVM mirror by a batch whose `open` reverted
 * (`EvmCallFailedError.strandedAlpha`): what `recoverStake` takes.
 */
export function getStrandedAlpha(
  error: unknown,
): { netuid: number; hotkey: `0x${string}` } | undefined {
  const value = (error as { strandedAlpha?: unknown } | null)?.strandedAlpha
  const stranded = fieldsOf(value) as { netuid?: unknown; hotkey?: unknown } | null
  if (
    !stranded ||
    typeof stranded.netuid !== "number" ||
    !Number.isInteger(stranded.netuid) ||
    !isHash(stranded.hotkey)
  )
    return undefined
  return { netuid: stranded.netuid, hotkey: stranded.hotkey }
}

/** What an `InsufficientBalanceError` needed and found, in base units, when it says. */
export function getBalanceShortfall(
  error: unknown,
): { required: bigint; available: bigint } | undefined {
  const fields = fieldsOf(error) as { required?: unknown; available?: unknown } | null
  if (typeof fields?.required !== "bigint" || typeof fields.available !== "bigint") return undefined
  return { required: fields.required, available: fields.available }
}

/** A transaction or extrinsic hash the error names (`txHash`, `extrinsicHash`). */
export function getErrorTxHash(error: unknown): `0x${string}` | undefined {
  const fields = fieldsOf(error) as { txHash?: unknown; extrinsicHash?: unknown } | null
  if (isHash(fields?.txHash)) return fields.txHash
  if (isHash(fields?.extrinsicHash)) return fields.extrinsicHash
  return undefined
}

export type CrossChainErrorDetails = {
  code: CrossChainErrorCode
  silent: boolean
  strandedAlpha?: { netuid: number; hotkey: `0x${string}` }
  shortfall?: { required: bigint; available: bigint }
  txHash?: `0x${string}`
  /**
   * The extrinsic failed on chain with a dispatch error, so its atomic `utility.batchAll` was
   * rolled back. A `SUBSTRATE_ERROR` without one (a submit that failed, or wasn't seen in a block in
   * time) may still have landed.
   */
  rolledBack?: boolean
}

/** The SDK's `SubstrateError.dispatchError`: set only for an on-chain failure. */
const hasDispatchError = (error: unknown): boolean => {
  if (error === null || typeof error !== "object") return false
  const { dispatchError } = error as { dispatchError?: unknown }
  return typeof dispatchError === "string" && dispatchError.length > 0
}

/** Everything the UI may need from an error, in one read. */
export function describeCrossChainError(error: unknown): CrossChainErrorDetails {
  const code = toCrossChainErrorCode(error)
  const strandedAlpha = getStrandedAlpha(error)
  const shortfall = getBalanceShortfall(error)
  const txHash = getErrorTxHash(error)
  return {
    code,
    silent: SILENT_CODES.has(code),
    ...(strandedAlpha && { strandedAlpha }),
    ...(shortfall && { shortfall }),
    ...(txHash && { txHash }),
    ...(hasDispatchError(error) && { rolledBack: true }),
  }
}

const GENERIC_MESSAGE = "Something went wrong. Try again."

/**
 * The message for each code, as the extension's i18n key (natural English, translated with `t()`).
 * The website's English. Codes a sell from a coldkey never meets (EVM wallet only) and the silent
 * ones get the generic message: they are never shown for a sell.
 */
export const CROSS_CHAIN_ERROR_MESSAGES: Readonly<Record<CrossChainErrorCode, string>> = {
  rateLimited: "Too many price requests. Wait a moment and try again.",
  paused: "Cross-chain swaps are paused for maintenance. Nothing has been sent; try again shortly.",
  unreachable: "Couldn't get a price. Check your connection and try again.",
  serviceUnavailable: "Couldn't price this swap just now. Try again in a moment.",
  noRoute: "No one can fill a swap of this size right now. Try a smaller or larger amount.",
  invalidParams: "Something in this swap isn't valid. Check the amount and the addresses.",
  unsupportedRoute: "This pair can't be swapped yet.",
  swapQuoteFailed: "There isn't enough liquidity to swap this amount. Try a smaller amount.",
  quoteExpired: "The price expired. Get a new price and try again.",
  insufficientBalance: "You don't have enough to pay for this swap.",
  insufficientGas: "You don't have enough to pay the network fee.",
  contractRevert: "The swap contract refused this transaction. Nothing was sent.",
  walletError: "Your wallet couldn't complete the request. Try again.",
  substrateError: "The Bittensor transaction failed. Try again.",
  evmCallFailed: "Your Bittensor transaction went through, but the swap couldn't be opened.",
  outputBelowMinimum:
    "The price moved past your max slippage. Nothing was sent: get a new price and try again.",
  timeout: "This is taking longer than expected. Try again.",
  // EVM wallet only, or silent: never shown for a sell.
  transactionReverted: GENERIC_MESSAGE,
  transactionReplaced: GENERIC_MESSAGE,
  orderNotFound: GENERIC_MESSAGE,
  userRejected: GENERIC_MESSAGE,
  aborted: GENERIC_MESSAGE,
  unknown: GENERIC_MESSAGE,
}

/** The i18n key of an error code's message. */
export const crossChainErrorMessageKey = (code: CrossChainErrorCode): string =>
  CROSS_CHAIN_ERROR_MESSAGES[code]
