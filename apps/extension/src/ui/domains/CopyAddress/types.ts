import { Address } from "@taostats-wallet/balances"
import { NetworkId } from "@taostats-wallet/chaindata-provider"

export type CopyAddressWizardInputs = {
  networkId?: NetworkId | null
  address?: Address
  qr?: boolean
  legacyFormat?: boolean
  addresses?: Address[]
}
