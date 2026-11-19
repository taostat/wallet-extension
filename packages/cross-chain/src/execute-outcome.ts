import type { CrossChainErrorCode, CrossChainErrorDetails } from "./error-codes"
import type { ExecutionStop } from "./execution-steps"

/**
 * Where a failed sell leaves the review. A pure function of the error and how far the run got, so
 * every case is decided in one tested place. Ported from the website's `execute-outcome.ts` for
 * the coldkey path, with the sent-but-unknown case as its own outcome:
 *
 * - `review`: nothing was sent, or the batch failed on chain and was rolled back. Back to the
 *   review (which keeps refreshing its price), with what to say about it.
 * - `failed`: the batch is in a block but the swap didn't open (`EVM_CALL_FAILED`). For alpha, the
 *   stake now sits at the account's EVM mirror. No retry.
 * - `unconfirmed`: the batch was signed and handed to the chain (`onSigned` gave its hash), then
 *   something other than a clean on-chain failure went wrong: the submit failed, or it wasn't seen in
 *   a block within the service worker's 90 s. Not a failure: it may still be included. No retry.
 */

/** What the review says after a failed attempt. */
export type ReviewFeedback = {
  /** The error to show. Never set for the user's own cancel. */
  error?: {
    code: CrossChainErrorCode
    /** `INSUFFICIENT_BALANCE`: what was needed and found, in base units. */
    shortfall?: { required: bigint; available: bigint }
  }
  /**
   * When `OUTPUT_BELOW_MINIMUM` stopped the swap (ms): the price moved past the accepted floor
   * before signing. The review asks for a new price.
   */
  priceMovedAt?: number
}

export type ExecuteFailureOutcome =
  | { kind: "review"; feedback: ReviewFeedback }
  | {
      kind: "failed"
      code: CrossChainErrorCode
      /** Alpha the batch left at the account's EVM mirror. */
      strandedAlpha?: { netuid: number; hotkey: `0x${string}` }
      /** The extrinsic that went through. */
      txHash?: `0x${string}`
    }
  | {
      kind: "unconfirmed"
      code: CrossChainErrorCode
      /** The extrinsic that was sent. */
      txHash: `0x${string}`
    }

export function resolveSellFailure(
  details: CrossChainErrorDetails,
  {
    submittedHash,
    now,
    batchRolledBack = false,
  }: {
    /** The batch's extrinsic hash, once `onSigned` reported it. */
    submittedHash: `0x${string}` | undefined
    now: number
    /**
     * The signer saw the batch fail on chain with a dispatch error, so the atomic batch was rolled
     * back and nothing moved. The SDK reports some of those (a gas sweep that can't clear) as
     * `EVM_CALL_FAILED`, the same code as a batch that went through without opening the swap.
     */
    batchRolledBack?: boolean
  },
): ExecuteFailureOutcome {
  const { code } = details

  // A rolled-back batch moved nothing: back to the review, as for any failed Bittensor transaction.
  if (code === "evmCallFailed" && batchRolledBack)
    return { kind: "review", feedback: { error: { code: "substrateError" } } }

  // The batch committed but `open` reverted: nothing was opened, and for alpha the stake now sits
  // at the account's EVM mirror.
  if (code === "evmCallFailed") {
    const txHash = details.txHash ?? submittedHash
    return {
      kind: "failed",
      code,
      ...(details.strandedAlpha && { strandedAlpha: details.strandedAlpha }),
      ...(txHash !== undefined && { txHash }),
    }
  }

  // Sent, and anything but a clean on-chain failure went wrong: it may still land and open the
  // order. Only a dispatch error proves the atomic batch rolled back.
  const isCleanRollback = code === "substrateError" && details.rolledBack === true
  const sentHash = submittedHash ?? (code === "substrateError" ? details.txHash : undefined)
  if (sentHash !== undefined && !isCleanRollback)
    return { kind: "unconfirmed", code, txHash: sentHash }

  if (details.silent) return { kind: "review", feedback: {} }
  if (code === "outputBelowMinimum") return { kind: "review", feedback: { priceMovedAt: now } }
  return {
    kind: "review",
    feedback: {
      error: { code, ...(details.shortfall && { shortfall: details.shortfall }) },
    },
  }
}

/** How the stepper ends for an outcome that isn't back to the review. */
export const executionStopFor = (outcome: ExecuteFailureOutcome): ExecutionStop => {
  switch (outcome.kind) {
    case "failed":
      return "notOpened"
    case "unconfirmed":
      return "unconfirmed"
    case "review":
      return "failed"
  }
}

/** Whether a failure is worth reporting: not the user's own cancel. */
export const isReportedFailure = (details: Pick<CrossChainErrorDetails, "silent">) =>
  !details.silent
