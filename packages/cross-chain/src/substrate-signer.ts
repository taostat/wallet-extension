import type {
  SubstrateBatchResult,
  SubstrateCall,
  SubstrateEvent,
  SubstrateSigner,
  SubstrateSignOptions,
} from "@tao.com/intents-sdk"
import {
  parseSubstrateAddress,
  SubstrateError,
  TaoIntentsError,
  UserRejectedError,
} from "@tao.com/intents-sdk"

import type { Hex, SapiCall } from "./calls"
import { BATCH_METHOD, BATCH_PALLET, toBatchAllArgs, toSapiCalls } from "./calls"
import { eventsProblem, isEvent } from "./events"

/** What signing the batch payload returns. */
export type SignedBatch = {
  /** The signature `submitAndWatch` broadcasts the payload with. */
  signature: Hex
  /** Hash of the signed extrinsic (blake2-256 of its bytes), known before it is broadcast. */
  extrinsicHash: Hex
}

/** What watching the submitted batch returns, once it is in a block. */
export type SubmitAndWatchResult = {
  /** The block that included the extrinsic (in a best block is enough, as for the SDK's `polkadotSigner`). */
  blockHash: Hex
  /** The extrinsic's own events, normalised as described in `events.ts` (the SDK's `SubstrateEvent`). */
  events: SubstrateEvent[]
  /** `false` when the extrinsic failed on chain (`system.ExtrinsicFailed`). A reverted EVM call does not fail it. */
  ok: boolean
  /**
   * When `ok` is `false`: the dispatch error, written as polkadot-js describes it, so the SDK can
   * recognise it. A `Module` error is `<pallet in lower camel case>.<Error>`, optionally followed
   * by `: <docs>` (`balances.InsufficientBalance`, `subtensorModule.NotEnoughStakeToWithdraw`, as
   * `registry.findMetaError` gives them); a `Token` / `Arithmetic` / `Transactional` error is
   * `token.<Variant>` / `arithmetic.<Variant>` / `transactional.<Variant>`
   * (`token.FundsUnavailable`); any other variant is its name (`BadOrigin`). The SDK turns
   * `token.FundsUnavailable` and `balances.InsufficientBalance` into `EvmCallFailedError` (that is
   * how a reverted `open` looks once the closing gas sweep can't clear).
   */
  error?: string
}

/**
 * What the signer needs from the wallet. The UI builds the payload with sapi; the service worker
 * signs and submits it (its messages implement `sign` and `submitAndWatch`).
 *
 * `TPayload` is whatever `buildBatchPayload` returns: for sapi, `getExtrinsicPayload`'s
 * `{ payload, txMetadata, shortMetadata }` (see `buildSapiBatchPayload`).
 */
export type SapiSubstrateSignerDeps<TPayload> = {
  /** The coldkey that signs (SS58). */
  address: string
  /** A payload for `Utility.batch_all` of these calls (`buildSapiBatchPayload`). */
  buildBatchPayload: (calls: SapiCall[]) => Promise<TPayload>
  /** Ask the user to sign. A rejection whose message says cancel / reject / denied / declined is the user saying no. */
  sign: (payload: TPayload) => Promise<SignedBatch>
  /** Broadcast the signed payload and resolve once it is in a block. Reject if it is dropped, invalid or usurped. */
  submitAndWatch: (payload: TPayload, signature: Hex) => Promise<SubmitAndWatchResult>
  /** Optional: the rao the coldkey can move after this payload's fee (free − max(frozen, ED) − fee, at least 0). */
  getSpendableAfterFee?: (payload: TPayload) => Promise<bigint>
}

/** The slice of sapi's `ScaleApi` the batch payload needs. */
export type SapiPayloadBuilder<TPayload> = {
  getExtrinsicPayload: (
    pallet: string,
    method: string,
    args: unknown,
    config: { address: string },
  ) => Promise<TPayload>
}

/** `buildBatchPayload` with sapi: `Utility.batch_all` of the mapped calls, for `address`. */
export const buildSapiBatchPayload = <TPayload>(
  sapi: SapiPayloadBuilder<TPayload>,
  address: string,
  calls: SapiCall[],
) => sapi.getExtrinsicPayload(BATCH_PALLET, BATCH_METHOD, toBatchAllArgs(calls), { address })

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))

const isRejection = (error: unknown) => /cancel|reject|denied|declin/i.test(messageOf(error))

/**
 * The SDK's `SubstrateSigner` for a coldkey in this wallet, with payloads built by sapi.
 *
 * `signAndSendBatch(calls, { onSigned, beforeSubmit })`:
 * 1. maps the SDK's calls to sapi call values and builds the `Utility.batch_all` payload;
 * 2. signs it;
 * 3. runs `beforeSubmit()`, the SDK's last veto: if it throws, nothing is submitted and the error
 *    propagates;
 * 4. calls `onSigned(extrinsicHash)` (the SDK reports `substrate-submitted`);
 * 5. submits and watches;
 * 6. resolves `{ extrinsicHash, blockHash, events }`, or rejects with a `SubstrateError` (with
 *    `dispatchError` and `extrinsicHash`) when the extrinsic failed on chain.
 *
 * Steps 3 and 4 run in the order of the SDK's own `polkadotSigner`, so a vetoed batch is never
 * reported as submitted.
 */
export const createSapiSubstrateSigner = <TPayload>(
  deps: SapiSubstrateSignerDeps<TPayload>,
): SubstrateSigner => {
  const { address, buildBatchPayload, sign, submitAndWatch, getSpendableAfterFee } = deps
  if (!parseSubstrateAddress(address))
    throw new SubstrateError("The signing account must be an SS58 address.")

  const build = (calls: SubstrateCall[]) => buildBatchPayload(toSapiCalls(calls))

  const signAndSendBatch = async (
    calls: SubstrateCall[],
    options: SubstrateSignOptions = {},
  ): Promise<SubstrateBatchResult> => {
    const payload = await build(calls)

    let signed: SignedBatch
    try {
      signed = await sign(payload)
    } catch (cause) {
      if (cause instanceof TaoIntentsError) throw cause
      throw isRejection(cause)
        ? new UserRejectedError(cause)
        : new SubstrateError(`Couldn't sign the batch: ${messageOf(cause)}`, { cause })
    }
    const { signature, extrinsicHash } = signed

    options.beforeSubmit?.()
    options.onSigned?.(extrinsicHash)

    let result: SubmitAndWatchResult
    try {
      result = await submitAndWatch(payload, signature)
    } catch (cause) {
      if (cause instanceof TaoIntentsError) throw cause
      throw new SubstrateError(`Couldn't submit the batch: ${messageOf(cause)}`, {
        cause,
        extrinsicHash,
      })
    }

    const problem = eventsProblem(result.events)
    if (problem)
      throw new SubstrateError(
        `The batch is in block ${result.blockHash}, but its events can't be read (${problem}). Check the account's history before trying again.`,
        { extrinsicHash },
      )

    if (!result.ok || result.events.some((e) => isEvent(e, "system", "ExtrinsicFailed"))) {
      const dispatchError = result.error || undefined
      throw new SubstrateError(dispatchError ?? "The batch failed on chain.", {
        dispatchError,
        extrinsicHash,
      })
    }

    return { extrinsicHash, blockHash: result.blockHash, events: result.events }
  }

  const signer: SubstrateSigner = { address, signAndSendBatch }
  if (getSpendableAfterFee)
    return {
      ...signer,
      spendableAfterFee: async (calls) => getSpendableAfterFee(await build(calls)),
    }
  return signer
}
