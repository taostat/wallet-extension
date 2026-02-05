import { Token } from "@taostats-wallet/chaindata-provider"

export const isTransferableToken = (t: Token) => {
  if (t.type === "substrate-dtao") {
    return t.isTransferable
  }

  return true
}
