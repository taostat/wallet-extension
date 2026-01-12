import { ChainConnectorDot } from "@taostats-wallet/chain-connectors"
import { connectionMetaDb } from "@taostats-wallet/connection-meta"

import { chaindataProvider } from "./chaindata"

export const chainConnector = new ChainConnectorDot(chaindataProvider, connectionMetaDb)
