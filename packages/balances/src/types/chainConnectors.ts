import {
  IChainConnectorDot,
  IChainConnectorEth,
  IChainConnectorSol,
} from "@taostats/chain-connectors"

export type ChainConnectors = {
  substrate?: IChainConnectorDot
  evm?: IChainConnectorEth
  solana?: IChainConnectorSol
}
