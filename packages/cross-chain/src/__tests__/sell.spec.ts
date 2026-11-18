import {
  ALPHA_INPUT_TAO_FEE_RAO,
  BITTENSOR_CHAIN_ID,
  buildSellQuoteParams,
  ETHEREUM_CHAIN_ID,
  isSellNetuid,
  maxSellRaw,
  PLACEHOLDER_EVM_ADDRESS,
  sellInputDecimals,
  sellInputToken,
  sellOutputDecimals,
  sellShortfall,
  TAO_MAX_RESERVE_RAO,
  TAO_NATIVE_BATCH_FEE_RAO,
} from "../sell"

const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
const HOTKEY = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
const RECIPIENT = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
const TAO = { kind: "tao" } as const
const SN64 = { kind: "alpha", netuid: 64, hotkey: HOTKEY } as const

describe("sell assets", () => {
  it("names the SDK's tokens and decimals", () => {
    expect(sellInputToken(TAO)).toBe("TAO")
    expect(sellInputToken(SN64)).toBe("SN64")
    expect(sellInputDecimals(TAO)).toBe(9)
    expect(sellInputDecimals(SN64)).toBe(9)
    expect(sellOutputDecimals("USDC")).toBe(6)
    expect(sellOutputDecimals("ETH")).toBe(18)
  })

  it("sells netuids 1 to 10 000 only: root stake is not an alpha asset here", () => {
    expect(isSellNetuid(1)).toBe(true)
    expect(isSellNetuid(10_000)).toBe(true)
    expect(isSellNetuid(0)).toBe(false)
    expect(isSellNetuid(10_001)).toBe(false)
    expect(isSellNetuid(1.5)).toBe(false)
  })
})

describe("maxSellRaw", () => {
  it("keeps 0.07 TAO back (0.05 fee reserve + 0.02 batch fee)", () => {
    expect(TAO_MAX_RESERVE_RAO).toBe(70_000_000n)
    expect(maxSellRaw("tao", 1_000_000_000n)).toBe(930_000_000n)
    expect(maxSellRaw("tao", 50_000_000n)).toBe(0n)
    expect(maxSellRaw("tao", 0n)).toBe(0n)
  })

  it("offers the whole alpha position: the SDK keeps its own 2 rao", () => {
    expect(maxSellRaw("alpha", 5_000_000_000n)).toBe(5_000_000_000n)
    expect(maxSellRaw("alpha", 0n)).toBe(0n)
  })
})

describe("sellShortfall", () => {
  it("reports more than the balance first", () => {
    expect(sellShortfall({ kind: "tao", amountRaw: 11n, balanceRaw: 10n })).toBe("balance")
    expect(sellShortfall({ kind: "alpha", amountRaw: 11n, balanceRaw: 10n, freeTaoRaw: 0n })).toBe(
      "balance",
    )
  })

  it("checks nothing while the balance is unknown", () => {
    expect(sellShortfall({ kind: "tao", amountRaw: 11n, balanceRaw: undefined })).toBeNull()
    expect(
      sellShortfall({
        kind: "alpha",
        amountRaw: 11n,
        balanceRaw: undefined,
        freeTaoRaw: undefined,
      }),
    ).toBeNull()
  })

  it("keeps the batch fee on top of a TAO amount", () => {
    const balanceRaw = 1_000_000_000n // 1 TAO
    expect(TAO_NATIVE_BATCH_FEE_RAO).toBe(20_000_000n)
    expect(sellShortfall({ kind: "tao", amountRaw: 990_000_000n, balanceRaw })).toBe("fee")
    expect(sellShortfall({ kind: "tao", amountRaw: 980_000_000n, balanceRaw })).toBeNull()
  })

  it("needs free TAO for an alpha sale's batch", () => {
    expect(ALPHA_INPUT_TAO_FEE_RAO).toBe(30_000_000n)
    const sale = { kind: "alpha", amountRaw: 5n, balanceRaw: 10n } as const
    expect(sellShortfall({ ...sale, freeTaoRaw: 29_999_999n })).toBe("fee")
    expect(sellShortfall({ ...sale, freeTaoRaw: 30_000_000n })).toBeNull()
  })
})

describe("buildSellQuoteParams", () => {
  const base = {
    input: TAO,
    output: "USDC",
    amount: "1.5",
    coldkey: ALICE,
    recipient: RECIPIENT,
  } as const

  it("quotes TAO from the coldkey to an Ethereum address", () => {
    const result = buildSellQuoteParams(base)
    expect(result).toEqual({
      ok: true,
      isIndicative: false,
      params: {
        originChainId: BITTENSOR_CHAIN_ID,
        destinationChainId: ETHEREUM_CHAIN_ID,
        inputToken: "TAO",
        outputToken: "USDC",
        amount: "1.5",
        substrateAccount: ALICE,
        recipient: RECIPIENT,
      },
      queryKey: ["crossChainSellQuote", "TAO", "USDC", "1.5", ALICE, RECIPIENT, ""],
    })
    expect(BITTENSOR_CHAIN_ID).toBe(964)
    expect(ETHEREUM_CHAIN_ID).toBe(1)
  })

  it("sells alpha off the position's hotkey, for ETH", () => {
    const result = buildSellQuoteParams({ ...base, input: SN64, output: "ETH", amount: "12.000" })
    expect(result.ok && result.params).toEqual({
      originChainId: 964,
      destinationChainId: 1,
      inputToken: "SN64",
      outputToken: "ETH",
      amount: "12",
      substrateAccount: ALICE,
      recipient: RECIPIENT,
      alphaHotkey: HOTKEY,
    })
    expect(result.ok && result.queryKey[6]).toBe(HOTKEY)
  })

  it("estimates with a placeholder until a valid recipient is typed, and says so", () => {
    for (const recipient of [null, "", "  ", "0x1234", RECIPIENT.toLowerCase().slice(0, 41)]) {
      const result = buildSellQuoteParams({ ...base, recipient })
      expect(result.ok && result.isIndicative).toBe(true)
      expect(result.ok && result.params.recipient).toBe(PLACEHOLDER_EVM_ADDRESS)
    }
    const lower = buildSellQuoteParams({ ...base, recipient: ` ${RECIPIENT.toLowerCase()} ` })
    expect(lower.ok && lower.isIndicative).toBe(false)
    expect(lower.ok && lower.params.recipient).toBe(RECIPIENT.toLowerCase())
  })

  it("never quotes for the zero address or a bad checksum", () => {
    const zero = buildSellQuoteParams({
      ...base,
      recipient: "0x0000000000000000000000000000000000000000",
    })
    expect(zero.ok && zero.isIndicative).toBe(true)
    const typo = buildSellQuoteParams({ ...base, recipient: RECIPIENT.replace("d8dA", "d8Da") })
    expect(typo.ok && typo.isIndicative).toBe(true)
  })

  it("truncates the amount to rao", () => {
    const result = buildSellQuoteParams({ ...base, amount: "0.1234567891" })
    expect(result.ok && result.params.amount).toBe("0.123456789")
  })

  it("says why nothing can be quoted", () => {
    expect(buildSellQuoteParams({ ...base, amount: "" })).toEqual({
      ok: false,
      reason: "missingAmount",
    })
    expect(buildSellQuoteParams({ ...base, amount: "0" })).toEqual({
      ok: false,
      reason: "missingAmount",
    })
    expect(buildSellQuoteParams({ ...base, amount: "0.0000000001" })).toEqual({
      ok: false,
      reason: "missingAmount",
    })
    expect(buildSellQuoteParams({ ...base, amount: "1,5" })).toEqual({
      ok: false,
      reason: "invalidAmount",
    })
    expect(buildSellQuoteParams({ ...base, coldkey: undefined })).toEqual({
      ok: false,
      reason: "missingAccount",
    })
    expect(
      buildSellQuoteParams({ ...base, input: { kind: "alpha", netuid: 0, hotkey: HOTKEY } }),
    ).toEqual({ ok: false, reason: "invalidInput" })
    expect(
      buildSellQuoteParams({ ...base, input: { kind: "alpha", netuid: 64, hotkey: " " } }),
    ).toEqual({ ok: false, reason: "invalidInput" })
  })
})
