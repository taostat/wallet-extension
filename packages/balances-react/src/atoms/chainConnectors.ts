import { ChainConnectors } from "@taostats-wallet/balances"
import { ChainConnectorDot } from "@taostats-wallet/chain-connectors"
import { connectionMetaDb } from "@taostats-wallet/connection-meta"
import { atom } from "jotai"

import { chaindataProviderAtom } from "./chaindataProvider"

export const chainConnectorsAtom = atom<ChainConnectors>((get) => {
  const chaindataProvider = get(chaindataProviderAtom)

  const substrate = new ChainConnectorDot(chaindataProvider, connectionMetaDb)

  return { substrate }
})
