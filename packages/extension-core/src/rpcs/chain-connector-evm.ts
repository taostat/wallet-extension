import { ChainConnectorEth } from "@taostats-wallet/chain-connectors"

import { chaindataProvider } from "./chaindata"

export const chainConnectorEvm = new ChainConnectorEth(chaindataProvider)
