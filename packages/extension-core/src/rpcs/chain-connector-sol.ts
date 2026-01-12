import { ChainConnectorSol } from "@taostats-wallet/chain-connectors"

import { chaindataProvider } from "./chaindata"

export const chainConnectorSol = new ChainConnectorSol(chaindataProvider)
