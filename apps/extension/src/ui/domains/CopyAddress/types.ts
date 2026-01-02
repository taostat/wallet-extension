import { Address } from "@taostats/balances"
import { NetworkId } from "@taostats/chaindata-provider"

export type CopyAddressWizardInputs = {
  networkId?: NetworkId | null
  address?: Address
  qr?: boolean
  legacyFormat?: boolean
  addresses?: Address[]
}
