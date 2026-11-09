import { evmRecipientProblem, isSameEvmAddress, resolveEvmRecipient } from "../recipient"
import { ALICE } from "./sdk-calls"

// Checksummed public Ethereum addresses.
const EVM = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
const OTHER_EVM = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
const ZERO = "0x0000000000000000000000000000000000000000"

describe("evmRecipientProblem", () => {
  it("accepts an EVM address, checksummed or all lower case, with spaces around it", () => {
    expect(evmRecipientProblem(EVM)).toBeNull()
    expect(evmRecipientProblem(EVM.toLowerCase())).toBeNull()
    expect(evmRecipientProblem(` ${EVM} `)).toBeNull()
  })

  it("says why an address is refused", () => {
    // One letter's case changed: the EIP-55 checksum fails.
    expect(evmRecipientProblem(EVM.replace("dA6", "Da6"))).toBe("badChecksum")
    expect(evmRecipientProblem(EVM.toUpperCase().replace("0X", "0x"))).toBe("badChecksum")
    expect(evmRecipientProblem(EVM.slice(0, 30))).toBe("tooShort")
    expect(evmRecipientProblem(`${EVM}00`)).toBe("tooLong")
    expect(evmRecipientProblem(ALICE)).toBe("invalid")
    expect(evmRecipientProblem(`0x${"zz".repeat(20)}`)).toBe("invalid")
  })

  it("refuses the zero address: nothing sent there can be spent", () => {
    expect(evmRecipientProblem(ZERO)).toBe("zeroAddress")
    expect(evmRecipientProblem(` ${ZERO}`)).toBe("zeroAddress")
  })

  it("has nothing to say about an empty field", () => {
    expect(evmRecipientProblem("  ")).toBeNull()
    expect(evmRecipientProblem("")).toBeNull()
  })
})

describe("isSameEvmAddress", () => {
  it("compares addresses ignoring case and spaces", () => {
    expect(isSameEvmAddress(EVM, ` ${EVM.toLowerCase()}`)).toBe(true)
    expect(isSameEvmAddress(EVM, OTHER_EVM)).toBe(false)
  })
})

describe("resolveEvmRecipient", () => {
  const base = { ownAddresses: [EVM] }

  it("pays the selected account when nothing is typed", () => {
    expect(resolveEvmRecipient({ ...base, typed: null, walletAddress: EVM })).toEqual({
      status: "wallet",
      address: EVM,
    })
  })

  it("is missing with no account and nothing typed", () => {
    expect(resolveEvmRecipient({ ...base, typed: null, walletAddress: null })).toEqual({
      status: "missing",
    })
    expect(resolveEvmRecipient({ ...base, typed: "  ", walletAddress: EVM })).toEqual({
      status: "missing",
    })
  })

  it("takes a valid typed address and says whether it is the user's own", () => {
    expect(resolveEvmRecipient({ ...base, typed: OTHER_EVM, walletAddress: EVM })).toEqual({
      status: "custom",
      address: OTHER_EVM,
      isOwn: false,
    })
    expect(
      resolveEvmRecipient({ ...base, typed: ` ${EVM.toLowerCase()}`, walletAddress: null }),
    ).toEqual({ status: "custom", address: EVM.toLowerCase(), isOwn: true })
  })

  it("reports a typed address that can't receive", () => {
    expect(resolveEvmRecipient({ ...base, typed: ALICE, walletAddress: EVM })).toEqual({
      status: "invalid",
      problem: "invalid",
    })
    expect(resolveEvmRecipient({ ...base, typed: ZERO, walletAddress: EVM })).toEqual({
      status: "invalid",
      problem: "zeroAddress",
    })
  })
})
