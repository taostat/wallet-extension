import type { QuoteParams } from "@tao.com/intents-sdk"

import {
  buildExecuteParams,
  hasPayerChanged,
  MAX_SWAP_SLIPPAGE_BPS,
  MIN_SWAP_SLIPPAGE_BPS,
  swapSlippageFor,
} from "../execute-params"
import { ALICE, ALICE_ID, BOB } from "./sdk-calls"

const EVM = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
const HOTKEY = "5HK5tp6t2S59DywmHRWPBVJeJ86T61KjurYqeooqj8sREpeN"

describe("swapSlippageFor", () => {
  it("uses the user's slippage within 0.5% to 3%", () => {
    expect(swapSlippageFor(100)).toBe(100)
    expect(swapSlippageFor(1)).toBe(MIN_SWAP_SLIPPAGE_BPS)
    expect(swapSlippageFor(1_000)).toBe(MAX_SWAP_SLIPPAGE_BPS)
    expect(MIN_SWAP_SLIPPAGE_BPS).toBe(50)
    expect(MAX_SWAP_SLIPPAGE_BPS).toBe(300)
  })
})

describe("buildExecuteParams", () => {
  it("drops the quote's payer and adds the guards (TAO sell)", () => {
    const result = buildExecuteParams({
      params: {
        originChainId: 964,
        destinationChainId: 1,
        inputToken: "TAO",
        outputToken: "USDC",
        amount: "1.5",
        recipient: EVM,
        substrateAccount: ALICE,
      },
      minOutputAmount: 1n,
      slippageBps: 10,
      partnerId: undefined,
    })
    expect(result).toEqual({
      originChainId: 964,
      destinationChainId: 1,
      inputToken: "TAO",
      outputToken: "USDC",
      amount: "1.5",
      recipient: EVM,
      minOutputAmount: 1n,
      slippageBps: 10,
      swapSlippageBps: 50,
    })
    expect(result).not.toHaveProperty("substrateAccount")
    expect(result).not.toHaveProperty("partnerId")
  })

  it("keeps the alpha hotkey and adds the partner when there is one (alpha sell)", () => {
    const params: QuoteParams = {
      originChainId: 964,
      destinationChainId: 1,
      inputToken: "SN64",
      outputToken: "ETH",
      amountRaw: 1_500_000_000n,
      alphaHotkey: HOTKEY,
      recipient: EVM,
      substrateAccount: ALICE,
      user: EVM,
    }
    expect(
      buildExecuteParams({ params, minOutputAmount: 123n, slippageBps: 75, partnerId: "taostats" }),
    ).toEqual({
      originChainId: 964,
      destinationChainId: 1,
      inputToken: "SN64",
      outputToken: "ETH",
      amountRaw: 1_500_000_000n,
      alphaHotkey: HOTKEY,
      recipient: EVM,
      minOutputAmount: 123n,
      slippageBps: 75,
      swapSlippageBps: 75,
      partnerId: "taostats",
    })
  })
})

describe("hasPayerChanged", () => {
  it("is false while the same coldkey pays, whatever form it is written in", () => {
    expect(hasPayerChanged({ reviewedColdkey: ALICE, coldkey: ALICE })).toBe(false)
    expect(hasPayerChanged({ reviewedColdkey: ALICE, coldkey: ALICE_ID })).toBe(false)
    // Alice written for Polkadot (prefix 0).
    expect(
      hasPayerChanged({
        reviewedColdkey: ALICE,
        coldkey: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
      }),
    ).toBe(false)
  })

  it("is true for another account, none, or something that isn't one", () => {
    expect(hasPayerChanged({ reviewedColdkey: ALICE, coldkey: BOB })).toBe(true)
    expect(hasPayerChanged({ reviewedColdkey: ALICE, coldkey: null })).toBe(true)
    expect(hasPayerChanged({ reviewedColdkey: undefined, coldkey: ALICE })).toBe(true)
    expect(hasPayerChanged({ reviewedColdkey: "nonsense", coldkey: "nonsense" })).toBe(true)
    expect(hasPayerChanged({ reviewedColdkey: ALICE, coldkey: `${ALICE.slice(0, -1)}Z` })).toBe(
      true,
    )
  })
})
