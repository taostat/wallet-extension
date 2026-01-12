import { Connection } from "@solana/web3.js"
import { SolNetworkId } from "@taostats-wallet/chaindata-provider"

export interface IChainConnectorSol {
  getConnection: (networkId: SolNetworkId) => Promise<Connection>
}
