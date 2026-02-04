import { encodeAnyAddress } from "@taostats-wallet/crypto"
import { classNames } from "@taostats-wallet/util"
import { FC, useMemo } from "react"

import { WithTooltip } from "@taostats/components/Tooltip"
import { shortenAddress } from "@taostats/util/shortenAddress"
import { useNetworkByGenesisHash } from "@ui/state"

type AddressProps = {
  address?: string
  genesisHash?: `0x${string}` | null
  startCharCount?: number
  endCharCount?: number
  as?: "span" | "div"
  className?: string
  noTooltip?: boolean
  noOnChainId?: boolean
  noShorten?: boolean
}

export const Address: FC<AddressProps> = ({
  address,
  genesisHash,
  startCharCount = 4,
  endCharCount = 4,
  as: Component = "span",
  className,
  noTooltip,
  noShorten,
}) => {
  // if we're not in a popup, no need to wrap
  const noWrap = useMemo(() => !document.getElementById("main"), [])

  const chain = useNetworkByGenesisHash(genesisHash)

  const formatted = useMemo(() => {
    const addressWithPrefix =
      address && chain ? encodeAnyAddress(address, { ss58Format: chain.prefix }) : address
    if (noShorten) return addressWithPrefix
    if (!addressWithPrefix) return addressWithPrefix
    return shortenAddress(addressWithPrefix, startCharCount, endCharCount)
  }, [address, chain, noShorten, startCharCount, endCharCount])
  if (!formatted) return null

  const display = (
    <span
      className={classNames(
        // don't wrap shortenedAddresses onto two lines when low on space
        "whitespace-nowrap",
      )}
    >
      {formatted}
    </span>
  )

  if (noTooltip) return <Component className={className}>{display}</Component>
  return (
    <WithTooltip as={Component} className={className} tooltip={address} noWrap={noWrap}>
      {display}
    </WithTooltip>
  )
}
