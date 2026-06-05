import { SignerPayloadJSON } from "@polkadot/types/types"

import { Chain } from "./types"

export type ScaleApiSubmitMode =
  | "default"
  | "bittensor-mev-shield"
  | "bittensor-taostats-shield"

export const submit = async (
  chain: Chain,
  payload: SignerPayloadJSON,
  signature?: `0x${string}`,
  txInfo?: unknown,
  mode?: ScaleApiSubmitMode,
  signedInnerTxHex?: `0x${string}`,
) => {
  switch (mode) {
    case "bittensor-mev-shield":
      if (signature)
        throw new Error("Signature should not be provided when using bittensor-mev-shield mode")
      return chain.connector.submitWithBittensorMevShield(payload, txInfo)

    case "bittensor-taostats-shield":
      if (signedInnerTxHex) {
        return chain.connector.submitWithTaostatsShield(payload, txInfo, signedInnerTxHex)
      }
      if (signature) {
        throw new Error(
          "Signed inner extrinsic hex is required when using bittensor-taostats-shield mode with a hardware wallet",
        )
      }
      return chain.connector.submitWithTaostatsShield(payload, txInfo)

    default:
      return chain.connector.submit(payload, signature, txInfo)
  }
}
