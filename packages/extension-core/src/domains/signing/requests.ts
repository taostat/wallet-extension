import { Account } from "@taostats-wallet/keyring"

import type { Port } from "../../types/base"
import type { SubstrateSigningRequest } from "./types"
import { requestStore } from "../../libs/requests/store"

export const signSubstrate = (
  url: string,
  request: SubstrateSigningRequest["request"],
  account: Account,
  port: Port,
) => {
  return requestStore.createRequest(
    {
      type: "substrate-sign",
      url,
      request,
      account,
    },
    port,
  )
}
