import { isAddressEqual } from "@taostats-wallet/crypto"
import { classNames, isNotNil } from "@taostats-wallet/util"
import { ChevronDown } from "@untitledui/icons/ChevronDown"
import { Account } from "extension-core"
import { uniq } from "lodash-es"
import { FC, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import ConnectedAccountsDrawer from "@ui/domains/Site/ConnectedAccountsDrawer"
import { useCurrentSite } from "@ui/hooks/useCurrentSite"
import { useAccounts, useAuthorisedSites } from "@ui/state"

import { ConnectedSiteIndicator } from "./ConnectedSiteIndicator"

export const ConnectedAccountsPill: FC = () => {
  const { t } = useTranslation()
  const currentSite = useCurrentSite()
  const accounts = useAccounts("all")
  const authorisedSites = useAuthorisedSites()
  const site = useMemo(
    () => (currentSite?.id ? authorisedSites[currentSite?.id] : null),
    [authorisedSites, currentSite?.id],
  )

  const [showConnectedAccounts, setShowConnectedAccounts] = useState(false)

  const { count, label } = useMemo(() => {
    const { addresses = [] } = site || {}
    const connected: Account[] = uniq([...addresses])
      .map((a) => accounts.find(({ address }) => isAddressEqual(address, a)))
      .filter(isNotNil)

    if (connected.length === 0) return { count: 0, label: t("Not connected") }

    const count = connected.length
    const label =
      connected.length === 1
        ? (connected[0]?.name ?? t("Connected"))
        : t(`{{length}} connected`, { length: count })

    return { count, label }
  }, [accounts, site, t])

  const host = useMemo(() => {
    try {
      if (!currentSite.url) return null
      const typedUrl = new URL(currentSite.url)
      return typedUrl.hostname
    } catch (err) {
      return null
    }
  }, [currentSite.url])

  if (!site?.addresses) return null

  const isConnected = count > 0

  return (
    <>
      <button
        type="button"
        className={classNames(
          "group flex h-9 w-full items-center gap-2 overflow-hidden rounded-md border px-2.5 text-left",
          "bg-secondary-solid transition-colors duration-700 ease-out",
          "hover:bg-white/[0.06] active:bg-white/[0.08]",
          isConnected ? "border-fg-brand/25" : "border-accent-2/25",
        )}
        onClick={() => setShowConnectedAccounts(true)}
      >
        <ConnectedSiteIndicator status={isConnected ? "connected" : "disconnected"} />
        <div className="flex min-w-0 grow items-center gap-2 truncate">
          <div className="text-fg-primary max-w-[50%] shrink-0 truncate text-sm font-medium">
            {label}
          </div>
          <div className="bg-tertiary h-3 w-px shrink-0" />
          <div className="text-fg-secondary min-w-0 grow truncate text-xs">{host}</div>
        </div>
        <ChevronDown className="text-fg-tertiary size-4 shrink-0" />
      </button>
      <ConnectedAccountsDrawer
        open={showConnectedAccounts}
        onClose={() => setShowConnectedAccounts(false)}
      />
    </>
  )
}
