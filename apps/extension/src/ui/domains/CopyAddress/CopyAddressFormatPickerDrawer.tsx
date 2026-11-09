import { DotNetworkId } from "@taostats-wallet/chaindata-provider"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { log } from "extension-shared"
import { FC, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, Drawer } from "taostats-ui"

import { shortenAddress } from "@taostats/util/shortenAddress"
import { useNetworkById, useRemoteConfig } from "@ui/state"

import { NetworkLogo } from "../Networks/NetworkLogo"

// should only be used here and in CopyAddressChainForm
export type ChainFormat = {
  key: string
  chainId: DotNetworkId | null
  prefix: number | null
  oldPrefix?: number
  name: string
  address: string
  oldAddress?: string
}

export type MigratedChainFormat = {
  key: string
  chainId: DotNetworkId
  prefix: number
  oldPrefix: number
  name: string
  address: string
  oldAddress: string
}

export const isMigratedFormat = (format: ChainFormat): format is MigratedChainFormat => {
  const { prefix, oldPrefix } = format
  return typeof oldPrefix === "number" && typeof prefix === "number" && oldPrefix !== prefix
}

export const CopyAddressFormatPickerDrawer: FC<{
  format?: MigratedChainFormat
  onDismiss: () => void
  onSelect: (legacyFormat: boolean) => void
}> = ({ format, onDismiss, onSelect }) => {
  // keep a copy here to be able to keep rendering content while drawer is closing
  const [data, setData] = useState<MigratedChainFormat>()

  useEffect(() => {
    if (format) setData(format)
  }, [format])

  return (
    <Drawer
      containerId="copy-address-modal"
      isOpen={!!format}
      anchor="bottom"
      onDismiss={onDismiss}
    >
      {!!data && <DrawerContent format={data} onSelect={onSelect} />}
    </Drawer>
  )
}

const DrawerContent: FC<{
  format: MigratedChainFormat
  onSelect: (legacyFormat: boolean) => void
}> = ({ format, onSelect }) => {
  const { t } = useTranslation()
  const chain = useNetworkById(format.chainId, "polkadot")

  const handleSelect = useCallback(
    (legacyFormat: boolean) => () => {
      onSelect(legacyFormat)
    },
    [onSelect],
  )

  return (
    <div className="bg-secondary flex w-full flex-col items-center gap-3 rounded-t-xl p-6">
      <div className="text-md text-fg-primary font-bold">{t("Select Address Format")}</div>
      <div className="text-fg-secondary text-center text-sm">
        {t("Legacy format may be needed when sending from some exchanges.")} <LearnMore />
      </div>
      <div></div>
      <FormatRow
        chainId={format.chainId}
        chainName={chain?.name ?? t("Unknown network")}
        address={format.address}
        label={t("New format")}
        onSelect={handleSelect(false)}
      />
      <FormatRow
        chainId={format.chainId}
        chainName={chain?.name ?? t("Unknown network")}
        address={format.oldAddress}
        label={t("Legacy format")}
        onSelect={handleSelect(true)}
      />
    </div>
  )
}

const LearnMore = () => {
  const { t } = useTranslation()
  const remoteConfig = useRemoteConfig()

  const handleClick = useCallback(() => {
    try {
      window.open(
        remoteConfig.documentation.unifiedAddressDocsUrl,
        "_blank",
        "nooppener noreferrer",
      )
    } catch (err) {
      log.error("Unable to open unified address docs", { cause: err })
    }
  }, [remoteConfig.documentation.unifiedAddressDocsUrl])

  return (
    <button
      type="button"
      className="text-fg-primary bg-tertiary hover:bg-tertiary inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-xs"
      onClick={handleClick}
    >
      <InfoCircle />
      <span>{t("Learn more")}</span>
    </button>
  )
}

const FormatRow: FC<{
  chainId: DotNetworkId
  chainName: string
  address: string
  label: string
  onSelect: () => void
}> = ({ chainId, chainName, address, label, onSelect }) => {
  const { t } = useTranslation()

  return (
    <div className="border-primary flex h-[68px] w-full items-center gap-3 rounded-lg border px-4">
      <div className="size-8 shrink-0">
        <NetworkLogo networkId={chainId} className="shrink-0 text-xl" />
      </div>
      <div className="flex grow flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="text-fg-primary truncate text-sm">{chainName}</div>
          <div className="text-fg-tertiary text-tiny rounded-xs border-primary shrink-0 border px-1 py-0.5">
            {label}
          </div>
        </div>
        <div className="text-fg-secondary text-xs">{shortenAddress(address, 8, 8)}</div>
      </div>
      <Button primary small onClick={onSelect}>
        {t("Select")}
      </Button>
    </div>
  )
}
