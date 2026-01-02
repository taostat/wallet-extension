import { DotNetworkId } from "@taostats/chaindata-provider"
import { SubstrateAppParams } from "@zondax/ledger-substrate/dist/common"

import { LedgerAccountDefSubstrate } from "../AccountAdd/AccountAddLedger/context"
import { DerivedAccountBase } from "../DerivedAccountPickerBase"

export type LedgerPolkadotGenericAccountPickerProps = {
  onChange?: (accounts: LedgerAccountDefSubstrate[]) => void
  app?: SubstrateAppParams | null
  chainId?: DotNetworkId
}

export type LedgerPolkadotAccountPickerDef = DerivedAccountBase & LedgerAccountDefSubstrate
