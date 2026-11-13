import type {
  ProgressEvent,
  SubstrateCall,
  SubstrateEvent,
  SubstrateSigner,
} from "@tao.com/intents-sdk"
import {
  DEFAULT_CHAINS,
  EvmCallFailedError,
  InsufficientBalanceError,
  SubstrateError,
  SUBTENSOR_EVM,
  UserRejectedError,
} from "@tao.com/intents-sdk"
import { encodeAbiParameters, numberToHex } from "viem"

import type {
  SapiSubstrateSignerDeps,
  SignedBatch,
  SubmitAndWatchResult,
} from "../substrate-signer"
import type { TestSapi } from "./chain"
import { DEFAULT_CROSS_CHAIN_CONFIG } from "../config"
import { createTaoIntents } from "../intents-client"
import { buildSapiBatchPayload, createSapiSubstrateSigner } from "../substrate-signer"
import { createPolkadotJs, createTestSapi } from "./chain"
import { mockJsonRpcFetch } from "./rpc-mock"
import { ALICE, GAS_PRICE, MIRROR, SOURCE } from "./sdk-calls"

/**
 * The real SDK driving our signer: `recoverRefund` (a batch of `balances.transferKeepAlive`,
 * `evm.call` and `evm.withdraw`, built by the SDK from its own chain reads), with the EVM reads
 * answered at the config's RPC URLs (the keyless Blockmachine defaults) and the batch encoded by
 * the real sapi. Shows that the calls the SDK actually builds map and encode like polkadot-js's,
 * and that the SDK reads our results and errors the way the contract says.
 */

const CONFIG = DEFAULT_CROSS_CHAIN_CONFIG
const { ethereum: ETHEREUM_RPC, bittensor: BITTENSOR_RPC } = CONFIG.evmRpcUrls
const USDC = DEFAULT_CHAINS[SUBTENSOR_EVM].usdc
const ADDRESS_MAPPING_PRECOMPILE = "0x000000000000000000000000000000000000080c"
const BALANCE_OF = "0x70a08231"
const REFUND = 5_000_000n // 5 USDC
const TO = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

const EXTRINSIC_HASH = `0x${"e1".repeat(32)}` as const
const BLOCK_HASH = `0x${"b1".repeat(32)}` as const
const SIGNATURE = `0x01${"5a".repeat(64)}` as const

const success: SubstrateEvent = { section: "system", method: "ExtrinsicSuccess", data: [{}] }
const executed: SubstrateEvent = { section: "evm", method: "Executed", data: [USDC.toLowerCase()] }

const answerEvmReads = (method: string, params: unknown[]) => {
  switch (method) {
    case "eth_call": {
      const { to, data } = params[0] as { to: string; data: string }
      if (to.toLowerCase() === USDC.toLowerCase() && data.startsWith(BALANCE_OF))
        return encodeAbiParameters([{ type: "uint256" }], [REFUND])
      if (to.toLowerCase() === ADDRESS_MAPPING_PRECOMPILE) return MIRROR
      return undefined
    }
    case "eth_gasPrice":
      return numberToHex(GAS_PRICE)
    case "eth_getBalance":
      return "0x0" // the mirror holds no gas yet: the batch funds it
  }
  return undefined
}

/** sapi's `getExtrinsicPayload` result, as the UI will hand it to the signer. */
type Payload = Awaited<ReturnType<TestSapi["getExtrinsicPayload"]>>

const setup = (overrides: Partial<SapiSubstrateSignerDeps<Payload>> = {}) => {
  const sapi = createTestSapi()
  const rpc = mockJsonRpcFetch(answerEvmReads, { urls: [ETHEREUM_RPC, BITTENSOR_RPC] })
  const signed: string[] = []
  let sdkCalls: SubstrateCall[] = []

  const signer = createSapiSubstrateSigner<Payload>({
    address: ALICE,
    buildBatchPayload: (calls) => buildSapiBatchPayload(sapi, ALICE, calls),
    sign: jest.fn(async ({ payload }): Promise<SignedBatch> => {
      signed.push(payload.method)
      return { signature: SIGNATURE, extrinsicHash: EXTRINSIC_HASH }
    }),
    submitAndWatch: jest.fn(
      async (): Promise<SubmitAndWatchResult> => ({
        blockHash: BLOCK_HASH,
        events: [executed, success],
        ok: true,
      }),
    ),
    getSpendableAfterFee: jest.fn(async () => 10n ** 12n),
    ...overrides,
  })
  // Record what the SDK hands the signer.
  const substrate: SubstrateSigner = {
    ...signer,
    signAndSendBatch: (calls, options) => {
      sdkCalls = calls
      return signer.signAndSendBatch(calls, options)
    },
  }

  const progress: ProgressEvent["step"][] = []
  const recover = () =>
    createTaoIntents({ config: CONFIG }).recoverRefund({
      substrate,
      originChainId: SUBTENSOR_EVM,
      to: TO,
      onProgress: (event) => progress.push(event.step),
    })

  return { recover, rpc, signed, sdkCalls: () => sdkCalls, progress }
}

let restore: (() => void) | undefined
afterEach(() => restore?.())

const run = (overrides?: Partial<SapiSubstrateSignerDeps<Payload>>) => {
  const s = setup(overrides)
  restore = s.rpc.restore
  return s
}

describe("the SDK's recoverRefund through our signer", () => {
  it("signs exactly the bytes polkadot-js would build from the SDK's calls", async () => {
    const { recover, rpc, signed, sdkCalls, progress } = run()

    await expect(recover()).resolves.toEqual({
      extrinsicHash: EXTRINSIC_HASH,
      blockHash: BLOCK_HASH,
      amount: REFUND,
    })

    const calls = sdkCalls()
    expect(calls.map((c) => `${c.section}.${c.method}`)).toEqual([
      "balances.transferKeepAlive",
      "evm.call",
      "evm.withdraw",
    ])
    // The SDK's own shapes: 0x account id, checksummed H160, bigints, nulls and empty lists.
    expect(calls[0].args[0]).toBe(MIRROR)
    expect(calls[1].args[0]).toBe(SOURCE)
    expect(calls[1].args.slice(6)).toEqual([null, null, [], []])

    expect(signed).toEqual([createPolkadotJs().batchHex(calls)])
    expect(progress).toEqual(["awaiting-signature", "substrate-submitted"])
    // USDC balance and mirror account, gas price, mirror's balance: all on Subtensor EVM, at the
    // config's URL.
    expect(rpc.requests.map((r) => r.method).sort()).toEqual([
      "eth_call",
      "eth_call",
      "eth_gasPrice",
      "eth_getBalance",
    ])
    expect(rpc.requests.every((r) => r.url === BITTENSOR_RPC)).toBe(true)
  })

  it("is refused before signing when the coldkey can't pay for the gas it funds", async () => {
    const sign = jest.fn()
    const { recover } = run({ getSpendableAfterFee: jest.fn(async () => 0n), sign })
    await expect(recover()).rejects.toBeInstanceOf(InsufficientBalanceError)
    expect(sign).not.toHaveBeenCalled()
  })

  it("reports a reverted EVM call (evm.ExecutedFailed) as EvmCallFailedError", async () => {
    const { recover } = run({
      submitAndWatch: jest.fn(async () => ({
        blockHash: BLOCK_HASH,
        events: [{ section: "evm", method: "ExecutedFailed", data: [USDC.toLowerCase()] }, success],
        ok: true,
      })),
    })
    const error = await recover().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(EvmCallFailedError)
    expect(error).toMatchObject({ code: "EVM_CALL_FAILED", extrinsicHash: EXTRINSIC_HASH })
  })

  it.each(["balances.InsufficientBalance", "token.FundsUnavailable"])(
    "reads a failed gas sweep (%s) as EvmCallFailedError, as it does from polkadotSigner",
    async (dispatchError) => {
      const { recover } = run({
        submitAndWatch: jest.fn(async () => ({
          blockHash: BLOCK_HASH,
          events: [],
          ok: false,
          error: dispatchError,
        })),
      })
      const error = await recover().catch((e: unknown) => e)
      expect(error).toBeInstanceOf(EvmCallFailedError)
      expect((error as Error).message).toContain(dispatchError)
    },
  )

  it("passes any other on-chain failure through as SubstrateError with its dispatch error", async () => {
    const { recover } = run({
      submitAndWatch: jest.fn(async () => ({
        blockHash: BLOCK_HASH,
        events: [],
        ok: false,
        error: "evm.GasPriceTooLow",
      })),
    })
    const error = await recover().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(SubstrateError)
    expect(error).toMatchObject({
      code: "SUBSTRATE_ERROR",
      dispatchError: "evm.GasPriceTooLow",
      extrinsicHash: EXTRINSIC_HASH,
    })
  })

  it("reports a signing failure as SubstrateError, never as the user declining", async () => {
    const { recover, progress } = run({
      sign: jest.fn(async () => Promise.reject(new Error("Cancelled"))),
    })
    const error = await recover().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(SubstrateError)
    expect(error).not.toBeInstanceOf(UserRejectedError)
    expect(error).toMatchObject({ message: "Couldn't sign the batch: Cancelled" })
    expect(progress).toEqual(["awaiting-signature"])
  })

  it("passes a UserRejectedError thrown by the wallet through", async () => {
    const { recover, progress } = run({
      sign: jest.fn(async () => Promise.reject(new UserRejectedError())),
    })
    await expect(recover()).rejects.toBeInstanceOf(UserRejectedError)
    expect(progress).toEqual(["awaiting-signature"])
  })
})
