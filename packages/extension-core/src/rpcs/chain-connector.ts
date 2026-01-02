import { ChainConnectorDot } from "@taostats/chain-connectors"
import { connectionMetaDb } from "@taostats/connection-meta"

import { chaindataProvider } from "./chaindata"

export const chainConnector = new ChainConnectorDot(chaindataProvider, connectionMetaDb)
