import type { Quote, SubstrateCall, SubstrateOpenParams } from "@tao.com/intents-sdk"
import { AbortedError, InsufficientBalanceError, SubstrateError } from "@tao.com/intents-sdk"

import type { FeeProbeIntents } from "../fee-probe"
import { BATCH_METHOD, BATCH_PALLET } from "../calls"
import { BatchFeeProbeStop, estimateSellBatchFee } from "../fee-probe"
import { ALICE, alphaSellBatch, taoSellBatch } from "./sdk-calls"

type Payload = { payload: { method: string } }

const quote = { user: "0x1", recipient: "0x2" } as unknown as Quote

const setup = ({ fee = 6_700_000n, failFee = false }: { fee?: bigint; failFee?: boolean } = {}) => {
  const sapi = {
    getExtrinsicPayload: jest.fn(
      async (): Promise<Payload> => ({ payload: { method: "0xbatch" } }),
    ),
    getFeeEstimate: jest.fn(async () => {
      if (failFee) throw new Error("query_info failed")
      return fee
    }),
  }
  return { sapi }
}

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
    expect(await estimate(sdkLikeOpen(taoSellBatch()), sapi)).toBe(6_700_000n)
    expect(sapi.getExtrinsicPayload).toHaveBeenCalledWith(
      BATCH_PALLET,
      BATCH_METHOD,
      expect.objectContaining({ calls: expect.any(Array) }),
      { address: ALICE },
    )
    expect(sapi.getFeeEstimate).toHaveBeenCalledWith({ method: "0xbatch" })
  })

  it("prices an alpha sale's batch too", async () => {
    const { sapi } = setup({ fee: 9_000_000n })
    expect(await estimate(sdkLikeOpen(alphaSellBatch()), sapi)).toBe(9_000_000n)
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
    const { sapi } = setup({ failFee: true })
    expect(await estimate(sdkLikeOpen(taoSellBatch()), sapi)).toBeUndefined()

    const unmapped: SubstrateCall[] = [{ section: "system", method: "remark", args: ["0x00"] }]
    const { sapi: other } = setup()
    expect(await estimate(sdkLikeOpen(unmapped), other)).toBeUndefined()
    expect(other.getFeeEstimate).not.toHaveBeenCalled()
  })
})
