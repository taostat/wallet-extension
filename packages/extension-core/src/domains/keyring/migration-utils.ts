import { KeypairType } from "@polkadot/util-crypto/types"
import { KeypairCurve } from "@taostats-wallet/crypto"

export const pjsKeypairTypeToCurve = (type: KeypairType): KeypairCurve => {
  switch (type) {
    case "ed25519":
    case "sr25519":
    case "ecdsa":
      return type
    default:
      throw new Error("Unsupported keypair type")
  }
}

export const curveToPjsKeypairType = (curve: KeypairCurve): KeypairType => {
  switch (curve) {
    case "ed25519":
    case "sr25519":
    case "ecdsa":
      return curve
    default:
      throw new Error("Unsupported curve")
  }
}
