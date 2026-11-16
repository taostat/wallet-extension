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
 * What the batch a sell would sign is expected to cost, before anything is signed: the SDK builds
 * the batch inside `open`, so the review runs `open` with a probe in place of the signer. The probe
 * has no way to sign: when the SDK asks it what the account can spend after the batch's fee
 * (`spendableAfterFee`, the same check the real signer answers), it prices the batch with sapi
 * (`TransactionPaymentApi.query_info`'s `partial_fee`) and stops the run; `signAndSendBatch` only
 * ever throws. Nothing reaches the chain: `open` only reads (the stake, the gas price, the mirror
 * account, a simulation) before it asks.
 *
 * The batch's `partial_fee` is what the chain withholds up front, not what the sell costs: it is
 * priced on each `evm.call`'s gas limit (twice the SDK's expected gas), and the chain refunds the
 * fee for the gas a call didn't use. It also leaves out the EVM gas itself, which the batch funds
 * from the coldkey. So the probe prices its own copy of the batch with each `evm.call`'s gas limit
 * set to the gas it is expected to use (the fee is linear in the gas limit), and adds that gas at
 * the call's `maxFeePerGas`. The batch the SDK built, the one that would be signed, is unchanged.
 */

/**
 * The gas a TAO sell's `open` is expected to use: 285 526 measured on mainnet on 2026-11-16 (block
 * 9519234), rounded up. Repricing that batch with this gas limit predicted its real fee.
 */
export const TAO_OPEN_EXPECTED_GAS = 300_000n

/**
 * The gas an alpha sell's `open` is expected to use: the SDK's own bound for it (1.5.1:
 * `MEASURED_ALPHA_GAS` 460 000 × `SWEEP_GAS_SAFETY_FACTOR` 2), not a measurement of ours. To be
 * replaced by one from a real alpha sell on mainnet.
 */
export const ALPHA_OPEN_EXPECTED_GAS = 920_000n

/** EVM wei per rao: TAO has 18 decimals on the EVM side and 9 on the Substrate side. */
const WEI_PER_RAO = 1_000_000_000n

/** `evm.call`'s positional args (calls.ts): `[source, target, input, value, gasLimit, maxFeePerGas, ...]`. */
const EVM_CALL_GAS_LIMIT_ARG = 4
const EVM_CALL_MAX_FEE_PER_GAS_ARG = 5

const isEvmCall = (call: SubstrateCall) => call?.section === "evm" && call?.method === "call"

/** A non-negative integer arg as a bigint (the SDK passes bigints), or a throw. */
const toGasBigint = (value: unknown): bigint => {
  const n =
    typeof value === "bigint"
      ? value
      : typeof value === "number" && Number.isSafeInteger(value)
        ? BigInt(value)
        : undefined
  if (n === undefined || n < 0n) throw new Error("Cross-chain: not a gas amount")
  return n
}

/**
 * A copy of the batch with each `evm.call`'s gas limit set to the gas it is expected to use, never
 * above its own limit, and the EVM gas those calls are expected to pay, in rao (rounded up):
 *
 * - the `open` call (the batch's last `evm.call`): `TAO_OPEN_EXPECTED_GAS`, or
 *   `ALPHA_OPEN_EXPECTED_GAS` when the batch moves stake (`subtensorModule.transferStake`);
 * - any other `evm.call` (an alpha sell's `approve`): half its gas limit, the SDK's expected gas
 *   before its headroom (`GAS_LIMIT_HEADROOM` 2).
 *
 * Throws for an `evm.call` whose gas limit or `maxFeePerGas` isn't a gas amount.
 */
const withExpectedGas = (calls: SubstrateCall[]): { calls: SubstrateCall[]; evmGasRao: bigint } => {
  const isAlpha = calls.some(
    (call) => call?.section === "subtensorModule" && call?.method === "transferStake",
  )
  const openIndex = calls.reduce((last, call, index) => (isEvmCall(call) ? index : last), -1)
  let evmGasWei = 0n
  const repriced = calls.map((call, index) => {
    if (!isEvmCall(call)) return call
    const gasLimit = toGasBigint(call.args[EVM_CALL_GAS_LIMIT_ARG])
    const maxFeePerGas = toGasBigint(call.args[EVM_CALL_MAX_FEE_PER_GAS_ARG])
    const expected =
      index === openIndex
        ? isAlpha
          ? ALPHA_OPEN_EXPECTED_GAS
          : TAO_OPEN_EXPECTED_GAS
        : gasLimit / 2n
    const gas = expected < gasLimit ? expected : gasLimit
    evmGasWei += gas * maxFeePerGas
    const args = [...call.args]
    args[EVM_CALL_GAS_LIMIT_ARG] = gas
    return { ...call, args }
  })
  return { calls: repriced, evmGasRao: (evmGasWei + WEI_PER_RAO - 1n) / WEI_PER_RAO }
}

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
 * What the batch is expected to cost, in rao: its extrinsic fee priced at the gas its `evm.call`s
 * are expected to use, plus that EVM gas. `undefined` when `open` stopped before building the
 * batch (an expired quote, not enough stake, a failed read or simulation) or the batch couldn't be
 * priced; never the fee the chain withholds up front.
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
        // A copy: the SDK's own batch is the one that would be signed.
        const expected = withExpectedGas(calls)
        const payload = await buildSapiBatchPayload(sapi, address, toSapiCalls(expected.calls))
        const extrinsicFee = await sapi.getFeeEstimate(payload.payload)
        if (typeof extrinsicFee === "bigint" && extrinsicFee >= 0n)
          fee = extrinsicFee + expected.evmGasRao
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
