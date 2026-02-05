import type { AddressEncoding } from "../types"
import { encodeAddressSs58 } from "./encoding"

export type EncodeAddressOptions = {
  ss58Prefix?: number
}

export const addressFromPublicKey = (
  publicKey: Uint8Array,
  encoding: AddressEncoding,
  options?: EncodeAddressOptions,
): string => {
  switch (encoding) {
    case "ss58":
      return encodeAddressSs58(publicKey, options?.ss58Prefix)
    case "bech32m":
    case "bech32":
    case "base58check":
      throw new Error("addressFromPublicKey is not implemented for Bitcoin")
    default:
      throw new Error("Unsupported encoding in addressFromPublicKey")
  }
}
