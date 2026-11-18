import type { KeypairCurve } from "../types"
import { deriveKeypair } from "."
import { addressEncodingFromCurve, addressFromPublicKey } from "../address"
import { entropyToSeed, mnemonicToEntropy } from "../mnemonic"

const POLKADOT_MNEMONIC = "bottom drive obey lake curtain smoke basket hold race lonely fit walk"
const POLKADOT_ALICE_DP = "//Alice"
const POLKADOT_ALICE_ADDRESS_SR25519 = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
const POLKADOT_ALICE_ADDRESS_ED25519 = "5FA9nQDVg267DEd8m1ZypXLBnvN7SFxYwV7ndqSYGiN9TTpu"
const POLKADOT_ALICE_ADDRESS_ECDSA = "5C7C2Z5sWbytvHpuLTvzKunnnRwQxft1jiqrLD5rhucQ5S9X"

const checkDerivedAddress = async (
  mnemonic: string,
  derivationPath: string,
  curve: KeypairCurve,
  address: string,
) => {
  const entropy = mnemonicToEntropy(mnemonic)
  const seed = await entropyToSeed(entropy, curve)
  const secret = deriveKeypair(seed, derivationPath, curve)
  const format = addressEncodingFromCurve(curve)
  expect(address).toEqual(addressFromPublicKey(secret.publicKey, format))
}

describe("deriveKeyPair", () => {
  it("sr25519", async () => {
    await checkDerivedAddress(
      POLKADOT_MNEMONIC,
      POLKADOT_ALICE_DP,
      "sr25519",
      POLKADOT_ALICE_ADDRESS_SR25519,
    )
  })

  it("ed25519", async () => {
    await checkDerivedAddress(
      POLKADOT_MNEMONIC,
      POLKADOT_ALICE_DP,
      "ed25519",
      POLKADOT_ALICE_ADDRESS_ED25519,
    )
  })

  it("ecdsa", async () => {
    await checkDerivedAddress(
      POLKADOT_MNEMONIC,
      POLKADOT_ALICE_DP,
      "ecdsa",
      POLKADOT_ALICE_ADDRESS_ECDSA,
    )
  })

  // Ethereum and Solana support was removed; seed derivation must refuse them
  // rather than silently produce a substrate-derived key.
  it.each(["ethereum", "solana"] as const)("rejects %s", async (curve) => {
    await expect(entropyToSeed(mnemonicToEntropy(POLKADOT_MNEMONIC), curve)).rejects.toThrow(
      "Unsupported curve",
    )
  })
})
