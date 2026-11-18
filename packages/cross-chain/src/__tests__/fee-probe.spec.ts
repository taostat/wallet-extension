import type { Quote, SubstrateCall, SubstrateOpenParams } from "@tao.com/intents-sdk"
import { AbortedError, InsufficientBalanceError, SubstrateError } from "@tao.com/intents-sdk"

import type { SapiCall } from "../calls"
import type { FeeProbeIntents } from "../fee-probe"
import { BATCH_METHOD, BATCH_PALLET } from "../calls"
import { BatchFeeProbeStop, estimateSellBatchFee } from "../fee-probe"
import {
  ALICE,
  approveCall,
  evmCall,
  evmWithdraw,
  openCall,
  SETTLER,
  taoSellBatch,
  transferKeepAlive,
  transferStake,
} from "./sdk-calls"

type Payload = { payload: { method: string; gasLimit: bigint } }

const quote = { user: "0x1", recipient: "0x2" } as unknown as Quote

/**
 * A sapi whose `query_info` fee is linear in the batch's EVM gas limits, as mainnet's is:
 * `140_306 + 10 × gas limit` rao reproduces the real TAO sell of 2026-11-16 (block 9519234), whose
 * batch was withheld 6 740 306 rao at the SDK's 660 000 gas limit.
 */
const setup = ({ failFee = false }: { failFee?: boolean } = {}) => {
  const sapi = {
    getExtrinsicPayload: jest.fn(
      async (_pallet: string, _method: string, args: unknown): Promise<Payload> => ({
        payload: {
          method: "0xbatch",
          gasLimit: (args as { calls: SapiCall[] }).calls
            .filter((call) => call.type === "EVM" && call.value.type === "call")
            .reduce((sum, call) => sum + (call.value.value.gas_limit as bigint), 0n),
        },
      }),
    ),
    getFeeEstimate: jest.fn(async ({ gasLimit }: Payload["payload"]) => {
      if (failFee) throw new Error("query_info failed")
      return 140_306n + 10n * gasLimit
    }),
  }
  return { sapi }
}

const GWEI = 1_000_000_000n

/** The real TAO sell's batch: `open` with the SDK's 660 000 gas limit, at 5 gwei. */
const realTaoSellBatch = (): SubstrateCall[] => [
  transferKeepAlive(),
  evmCall(
    SETTLER,
    openCall().args[2] as `0x${string}`,
    50_000_000_000_000_000n,
    660_000n,
    5n * GWEI,
  ),
  evmWithdraw(),
]

/** An alpha sell with the approval, at the SDK's gas limits (`approve` 80 000, `open` 2 600 000). */
const alphaSellBatchAtSdkLimits = (): SubstrateCall[] => [
  transferStake(),
  transferKeepAlive(),
  approveCall(),
  evmCall(SETTLER, openCall().args[2] as `0x${string}`, 0n, 2_600_000n, 10n * GWEI),
  evmWithdraw(),
]

/**
 * `open` as SDK 1.5.1 runs it on the substrate path, cut down to what the probe meets: it asks
 * `spendableAfterFee` (ignoring anything but an abort it throws), then signs and sends the batch.
 */
const sdkLikeOpen =
  (calls: SubstrateCall[], log: string[] = []): FeeProbeIntents["open"] =>
  async ({ substrate }: SubstrateOpenParams) => {
    try {
      const spendable = await substrate.spendableAfterFee?.(calls)
      if (spendable !== undefined && spendable < 1n)
        throw new InsufficientBalanceError(1n, spendable, "TAO", 9)
    } catch (error) {
      if (error instanceof AbortedError || error instanceof InsufficientBalanceError) throw error
    }
    log.push("signAndSendBatch")
    try {
      return await substrate.signAndSendBatch(calls)
    } catch (error) {
      throw new SubstrateError("Couldn't send the batch", { cause: error })
    }
  }

const estimate = (open: FeeProbeIntents["open"], sapi: ReturnType<typeof setup>["sapi"]) =>
  estimateSellBatchFee({
    intents: { open },
    quote,
    address: ALICE,
    sapi,
    swapSlippageBps: 100,
    partnerId: "c36059",
  })

describe("estimateSellBatchFee", () => {
  it("prices the batch the SDK built for this account, with sapi", async () => {
    const { sapi } = setup()
    expect(await estimate(sdkLikeOpen(taoSellBatch()), sapi)).toBeDefined()
    expect(sapi.getExtrinsicPayload).toHaveBeenCalledWith(
      BATCH_PALLET,
      BATCH_METHOD,
      expect.objectContaining({ calls: expect.any(Array) }),
      { address: ALICE },
    )
    expect(sapi.getFeeEstimate).toHaveBeenCalledWith(expect.objectContaining({ method: "0xbatch" }))
  })

  it("is a TAO sell's expected cost: the fee at the expected gas, plus that gas", async () => {
    const { sapi } = setup()
    // Fee at 300 000 gas (3 140 306) + 300 000 gas × 5 gwei (1 500 000). Not the 6 740 306 withheld.
    expect(await estimate(sdkLikeOpen(realTaoSellBatch()), sapi)).toBe(4_640_306n)
    expect(sapi.getFeeEstimate).toHaveBeenCalledWith(
      expect.objectContaining({ gasLimit: 300_000n }),
    )
  })

  it("is an alpha sell's expected cost: open at its expected gas, approve at half its limit", async () => {
    const { sapi } = setup()
    // Gas: approve 40 000 + open 460 000 = 500 000. Fee 140 306 + 5 000 000, gas 500 000 × 10 gwei.
    expect(await estimate(sdkLikeOpen(alphaSellBatchAtSdkLimits()), sapi)).toBe(
      5_140_306n + 5_000_000n,
    )
    expect(sapi.getFeeEstimate).toHaveBeenCalledWith(
      expect.objectContaining({ gasLimit: 500_000n }),
    )
  })

  it("never prices a call above its own gas limit", async () => {
    const { sapi } = setup()
    // This alpha open has a 400 000 limit, under the 460 000 expected: 400 000 is used.
    // Gas: approve 40 000 + open 400 000 = 440 000, at 10 gwei.
    const calls = [
      transferStake(),
      transferKeepAlive(),
      approveCall(),
      evmCall(SETTLER, openCall().args[2] as `0x${string}`, 0n, 400_000n, 10n * GWEI),
      evmWithdraw(),
    ]
    expect(await estimate(sdkLikeOpen(calls), sapi)).toBe(140_306n + 4_400_000n + 4_400_000n)
    expect(sapi.getFeeEstimate).toHaveBeenCalledWith(
      expect.objectContaining({ gasLimit: 440_000n }),
    )
  })

  it("leaves the batch the SDK built, the one that would be signed, untouched", async () => {
    const { sapi } = setup()
    const calls = realTaoSellBatch()
    await estimate(sdkLikeOpen(calls), sapi)
    expect(calls).toEqual(realTaoSellBatch())
  })

  it("hands open the execute settings, and a signer that can never sign", async () => {
    const { sapi } = setup()
    const log: string[] = []
    const open = jest.fn(sdkLikeOpen(taoSellBatch(), log))
    await estimate(open, sapi)
    const params = open.mock.calls[0]?.[0]
    expect(params).toMatchObject({ quote, swapSlippageBps: 100, partnerId: "c36059" })
    expect(params?.substrate.address).toBe(ALICE)
    // The SDK carries on past a failed spendable check: the probe's "signer" only throws.
    expect(log).toEqual(["signAndSendBatch"])
    await expect(params?.substrate.signAndSendBatch([])).rejects.toBeInstanceOf(BatchFeeProbeStop)
  })

  it("is unknown when open stops before building a batch", async () => {
    const { sapi } = setup()
    const open: FeeProbeIntents["open"] = async () => {
      throw new InsufficientBalanceError(10n, 1n, "SN64 alpha (on that hotkey)", 9)
    }
    expect(await estimate(open, sapi)).toBeUndefined()
    expect(sapi.getFeeEstimate).not.toHaveBeenCalled()
  })

  it("is unknown when the fee can't be read, or the batch can't be mapped", async () => {
    // Never the withheld fee, nor the EVM gas alone.
    const { sapi } = setup({ failFee: true })
    expect(await estimate(sdkLikeOpen(taoSellBatch()), sapi)).toBeUndefined()

    const unmapped: SubstrateCall[] = [{ section: "system", method: "remark", args: ["0x00"] }]
    const { sapi: other } = setup()
    expect(await estimate(sdkLikeOpen(unmapped), other)).toBeUndefined()
    expect(other.getFeeEstimate).not.toHaveBeenCalled()
  })
})
