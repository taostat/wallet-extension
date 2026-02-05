import { detectAddressEncoding } from "../address"
import { AccountPlatform, AddressEncoding, KeypairCurve } from "../types"

export const getAccountPlatformFromCurve = (curve: KeypairCurve): AccountPlatform => {
  switch (curve) {
    case "sr25519":
    case "ed25519":
    case "ecdsa":
      return "polkadot"
    case "bitcoin-ecdsa":
    case "bitcoin-ed25519":
      return "bitcoin"
    default:
      throw new Error("Unsupported curve")
  }
}

export const getAccountPlatformFromEncoding = (encoding: AddressEncoding): AccountPlatform => {
  switch (encoding) {
    case "ss58":
      return "polkadot"
    case "bech32m":
    case "bech32":
    case "base58check":
      return "bitcoin"
    default:
      throw new Error("Unsupported encoding")
  }
}

export const getAccountPlatformFromAddress = (address: string): AccountPlatform => {
  const encoding = detectAddressEncoding(address)
  return getAccountPlatformFromEncoding(encoding)
}
