import { isAddress, zeroAddress } from "viem"

/**
 * Who receives a sell's output on Ethereum: an EVM address, picked from the user's own accounts or
 * typed. Checked the way the SDK will take it: viem's `isAddress` (mixed case must carry a valid
 * EIP-55 checksum, all lower case is accepted). The zero address is refused: nothing sent there can
 * ever be spent.
 */

/** Why a typed address can't receive the output. */
export type EvmRecipientProblem = "tooShort" | "tooLong" | "badChecksum" | "zeroAddress" | "invalid"

const EVM_ADDRESS_LENGTH = 42

/** Why `text` can't receive the output, or `null` when it can (or when it is empty: nothing to say yet). */
export function evmRecipientProblem(text: string): EvmRecipientProblem | null {
  const address = text.trim()
  if (address === "") return null
  if (isAddress(address)) return address.toLowerCase() === zeroAddress ? "zeroAddress" : null
  // Right characters, wrong mixed case: a mistyped letter somewhere.
  if (isAddress(address, { strict: false })) return "badChecksum"
  if (/^0x[0-9a-f]*$/i.test(address)) {
    if (address.length < EVM_ADDRESS_LENGTH) return "tooShort"
    if (address.length > EVM_ADDRESS_LENGTH) return "tooLong"
  }
  return "invalid"
}

/** Whether two valid EVM addresses are the same account (case-insensitive). */
export function isSameEvmAddress(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

export type ResolvedEvmRecipient =
  /** The selected own account receives. */
  | { status: "wallet"; address: string }
  /** A valid typed address; `isOwn` when it is one of the user's accounts. */
  | { status: "custom"; address: string; isOwn: boolean }
  /** Something typed that isn't a valid recipient. */
  | { status: "invalid"; problem: EvmRecipientProblem }
  /** No account selected and nothing typed. */
  | { status: "missing" }

export function resolveEvmRecipient({
  typed,
  walletAddress,
  ownAddresses,
}: {
  /** The typed recipient: `null` for "the selected account". */
  typed: string | null
  /** The user's selected EVM account, if any. */
  walletAddress: string | null | undefined
  /** Every EVM address the user holds. */
  ownAddresses: readonly string[]
}): ResolvedEvmRecipient {
  if (typed === null) {
    if (!walletAddress) return { status: "missing" }
    const problem = evmRecipientProblem(walletAddress)
    return problem === null
      ? { status: "wallet", address: walletAddress.trim() }
      : { status: "invalid", problem }
  }
  const address = typed.trim()
  if (address === "") return { status: "missing" }
  const problem = evmRecipientProblem(address)
  if (problem !== null) return { status: "invalid", problem }
  return {
    status: "custom",
    address,
    isOwn: ownAddresses.some((own) => isSameEvmAddress(own, address)),
  }
}
