import {
  IChainConnectorDot,
  IChainConnectorEth,
  IChainConnectorSol,
} from "@taostats-wallet/chain-connectors"

export type ChainConnectors = {
  substrate?: IChainConnectorDot
  evm?: IChainConnectorEth
  solana?: IChainConnectorSol
}
