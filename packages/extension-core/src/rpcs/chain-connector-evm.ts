import { ChainConnectorEth } from "@taostats/chain-connectors"

import { chaindataProvider } from "./chaindata"

export const chainConnectorEvm = new ChainConnectorEth(chaindataProvider)
