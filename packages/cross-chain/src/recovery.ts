import type { PublicClient } from "viem"
import { DEFAULT_CHAINS, substrateEvmAddress, SUBTENSOR_EVM } from "@tao.com/intents-sdk"
import { erc20Abi } from "viem"

import type { CrossChainErrorCode, CrossChainErrorDetails } from "./error-codes"
import type { EvmRecipientProblem } from "./recipient"
import { evmRecipientProblem } from "./recipient"
import { BITTENSOR_CHAIN_ID } from "./sell"

/**
 * Bringing a sell's funds back out of the EVM address a coldkey acts as on Bittensor, each one
 * batch signed by that coldkey (the website's `use-recover-funds.ts`):
 *
 * - `recoverRefund`: an unfilled order's USDC refund, to an EVM address the user controls. It
 *   arrives there as USDC on Bittensor EVM (not Ethereum).
 * - `recoverStake`: alpha a batch left staked at the account's EVM mirror when its `open` reverted,
 *   back to the coldkey.
 */

type Hex = `0x${string}`

/** `recoverRefund`'s parameters, less the signer. */
export type RecoverRefundRequest = { originChainId: number; to: Hex }

/** `recoverStake`'s parameters, less the signer. */
export type RecoverStakeRequest = { originChainId: number; netuid: number; hotkey: Hex }

export type RecoverRefundRequestResult =
  | { ok: true; request: RecoverRefundRequest }
  | { ok: false; problem: EvmRecipientProblem | "missing" }

/** The refund's move to `to` (typed or prefilled), or why `to` can't receive it. */
export function buildRecoverRefundRequest(to: string): RecoverRefundRequestResult {
  const address = to.trim()
  if (address === "") return { ok: false, problem: "missing" }
  const problem = evmRecipientProblem(address)
  if (problem !== null) return { ok: false, problem }
  return { ok: true, request: { originChainId: BITTENSOR_CHAIN_ID, to: address as Hex } }
}

const HASH = /^0x[0-9a-fA-F]{64}$/

/**
 * The return of alpha left at the mirror (`EvmCallFailedError.strandedAlpha`), or `null` when the
 * subnet or hotkey can't name a stake.
 */
export function buildRecoverStakeRequest(strandedAlpha: {
  netuid: number
  hotkey: string
}): RecoverStakeRequest | null {
  const { netuid, hotkey } = strandedAlpha
  if (!Number.isInteger(netuid) || netuid < 1 || !HASH.test(hotkey)) return null
  return { originChainId: BITTENSOR_CHAIN_ID, netuid, hotkey: hotkey as Hex }
}

/** The EVM address a coldkey acts as on Bittensor, where its unfilled orders are refunded. */
export const refundMirrorAddress = (coldkey: string): Hex => substrateEvmAddress(coldkey)

/**
 * The USDC (base units, 6 decimals) at a coldkey's EVM address on Bittensor EVM: what
 * `recoverRefund` moves, read the way it reads it (`balanceOf` on the chain's USDC).
 */
export async function readRefundAtMirror(
  client: Pick<PublicClient, "readContract">,
  coldkey: string,
): Promise<bigint> {
  return client.readContract({
    address: DEFAULT_CHAINS[SUBTENSOR_EVM].usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [refundMirrorAddress(coldkey)],
  })
}

/** Where a failed recovery leaves its screen. */
export type RecoveryFailure =
  /** The user's own cancel, or ours: nothing to say. */
  | { kind: "cancelled" }
  /** There is nothing there to move: it was moved already (from here or elsewhere). */
  | { kind: "nothingLeft" }
  /** Sent, outcome unknown: it may still be included. Not a failure, and no retry. */
  | { kind: "unconfirmed"; code: CrossChainErrorCode; txHash: Hex }
  /** Nothing moved: say why; it can be tried again. */
  | { kind: "error"; code: CrossChainErrorCode }

/**
 * A failed `recoverRefund` / `recoverStake`, as the sell's failures are read
 * (`resolveSellFailure`): a batch that was sent and then lost track of is `unconfirmed`, never a
 * failure, unless the chain rolled it back. The differences:
 *
 * - `INVALID_PARAMS` here means the mirror holds nothing to move (the SDK raises it only for a
 *   signer, address, subnet or hotkey it can't read, which the request builders check first), as
 *   the website reads it for SDK 1.5.1.
 * - `EVM_CALL_FAILED` means the transfer reverted inside a batch that went through: nothing moved,
 *   so it is an error that can be retried.
 * - Not enough TAO for the batch reads as the network fee it is.
 */
export function resolveRecoveryFailure(
  details: CrossChainErrorDetails,
  { submittedHash }: { submittedHash: Hex | undefined },
): RecoveryFailure {
  const { code } = details
  if (details.silent) return { kind: "cancelled" }
  if (code === "invalidParams") return { kind: "nothingLeft" }
  if (code === "evmCallFailed") return { kind: "error", code }

  const isCleanRollback = code === "substrateError" && details.rolledBack === true
  const sentHash = submittedHash ?? (code === "substrateError" ? details.txHash : undefined)
  if (sentHash !== undefined && !isCleanRollback)
    return { kind: "unconfirmed", code, txHash: sentHash }

  if (isCleanRollback) return { kind: "error", code: "substrateError" }
  return { kind: "error", code: code === "insufficientBalance" ? "insufficientGas" : code }
}
