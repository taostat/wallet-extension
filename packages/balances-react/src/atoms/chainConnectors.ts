import { ChainConnectors } from "@taostats-wallet/balances"
import {
  ChainConnectorDot,
  ChainConnectorEth,
  ChainConnectorSol,
} from "@taostats-wallet/chain-connectors"
import { connectionMetaDb } from "@taostats-wallet/connection-meta"
import { atom } from "jotai"

import { chaindataProviderAtom } from "./chaindataProvider"

export const chainConnectorsAtom = atom<ChainConnectors>((get) => {
  const chaindataProvider = get(chaindataProviderAtom)

  const substrate = new ChainConnectorDot(chaindataProvider, connectionMetaDb)
  const evm = new ChainConnectorEth(chaindataProvider)
  const solana = new ChainConnectorSol(chaindataProvider)

  return { substrate, evm, solana }
})
