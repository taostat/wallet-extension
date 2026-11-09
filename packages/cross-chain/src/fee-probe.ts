import type {
  Quote,
  SubstrateCall,
  SubstrateOpenParams,
  SubstrateSigner,
} from "@tao.com/intents-sdk"

import type { ExtensionSignerSapi, SapiExtrinsicPayload } from "./extension-signer"
import { toSapiCalls } from "./calls"
import { buildSapiBatchPayload } from "./substrate-signer"

/**
 * The network fee of the batch a sell would sign, before anything is signed: the SDK builds the
 * batch inside `open`, so the review runs `open` with a probe in place of the signer. The probe
 * has no way to sign: when the SDK asks it what the account can spend after the batch's fee
 * (`spendableAfterFee`, the same check the real signer answers), it prices that batch with sapi
 * (`TransactionPaymentApi.query_info`'s `partial_fee`) and stops the run; `signAndSendBatch` only
 * ever throws. Nothing reaches the chain: `open` only reads (the stake, the gas price, the mirror
 * account, a simulation) before it asks.
 *
 * The fee is the extrinsic's own, in rao. The EVM gas the batch funds for `open` is not part of it.
 */

/** The slice of `TaoIntents` the probe uses. */
export type FeeProbeIntents = {
  open: (params: SubstrateOpenParams) => Promise<unknown>
}

/** Thrown by the probe to stop `open` once the batch is priced. */
export class BatchFeeProbeStop extends Error {
  constructor() {
    super("Cross-chain: fee probe, not a signer")
    this.name = "BatchFeeProbeStop"
  }
}

export type EstimateSellBatchFeeOptions<TPayload extends SapiExtrinsicPayload<unknown>> = {
  intents: FeeProbeIntents
  /** A firm quote for `address` (`substrateAccount`), not expired. */
  quote: Quote
  /** The paying coldkey (SS58). */
  address: string
  sapi: Pick<ExtensionSignerSapi<TPayload>, "getExtrinsicPayload" | "getFeeEstimate">
  /** As `execute` will get it, so the batch is the one that would be signed. */
  swapSlippageBps: number
  partnerId: string | undefined
  signal?: AbortSignal
}

/**
 * The batch's fee in rao, or `undefined` when `open` stopped before building it (an expired quote,
 * not enough stake, a failed read or simulation) or the fee couldn't be read.
 */
export async function estimateSellBatchFee<TPayload extends SapiExtrinsicPayload<unknown>>({
  intents,
  quote,
  address,
  sapi,
  swapSlippageBps,
  partnerId,
  signal,
}: EstimateSellBatchFeeOptions<TPayload>): Promise<bigint | undefined> {
  let fee: bigint | undefined

  const probe: SubstrateSigner = {
    address,
    signAndSendBatch: async () => {
      throw new BatchFeeProbeStop()
    },
    spendableAfterFee: async (calls: SubstrateCall[]) => {
      try {
        const payload = await buildSapiBatchPayload(sapi, address, toSapiCalls(calls))
        fee = await sapi.getFeeEstimate(payload.payload)
      } catch {
        // A batch that doesn't map or price: the fee stays unknown.
      }
      throw new BatchFeeProbeStop()
    },
  }

  try {
    await intents.open({
      quote,
      substrate: probe,
      swapSlippageBps,
      ...(partnerId !== undefined && { partnerId }),
      ...(signal && { signal }),
    })
  } catch {
    // Expected: the probe stops every run. Whatever else stopped it, the fee is unknown.
  }
  return typeof fee === "bigint" && fee >= 0n ? fee : undefined
}
