import { isAddressEqual } from "@taostats-wallet/crypto"
import { Account, AuthorizedSite } from "extension-core"
import { FC, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { api } from "@ui/api"
import { useCurrentSite } from "@ui/hooks/useCurrentSite"
import { useInjectableAccounts } from "@ui/hooks/useInjectableAccounts"
import { useAuthorisedSites } from "@ui/state"

import { ConnectAccountsContainer } from "./ConnectAccountsContainer"
import { ConnectedAccountsPolkadot } from "./ConnectedAccountsPolkadot"

const isMatch = (acc: Account) => (address: string) => isAddressEqual(acc.address, address)

const SubAccounts: FC<{ site: AuthorizedSite }> = ({ site }) => {
  const accounts = useInjectableAccounts(site.url, "polkadot")

  // using a local state allows for optimistic updates
  const [activeAccounts, setActiveAccounts] = useState(() =>
    accounts.map((acc) => [acc, site.addresses?.some(isMatch(acc))] as [Account, boolean]),
  )

  const handleUpdateAccounts = useCallback(
    (addresses: string[]) => {
      setActiveAccounts(
        accounts.map((acc) => [acc, addresses.some(isMatch(acc))] as [Account, boolean]),
      )
      api.authorizedSiteUpdate(site.id, {
        addresses,
      })
    },
    [accounts, site.id],
  )

  return (
    <ConnectedAccountsPolkadot
      activeAccounts={activeAccounts}
      onUpdateAccounts={handleUpdateAccounts}
    />
  )
}

export const ConnectedAccounts: FC = () => {
  const { t } = useTranslation()

  const currentSite = useCurrentSite()
  const authorisedSites = useAuthorisedSites()
  const site = useMemo(
    () => (currentSite?.id ? authorisedSites[currentSite?.id] : null),
    [authorisedSites, currentSite?.id],
  )

  return (
    <div className="flex w-full flex-col gap-6 pb-12">
      <div className="text-body-secondary my-2 text-xs">
        {t("Select which account(s) to connect to")}{" "}
        <span className="text-body font-bold">{site?.id}</span>
      </div>
      {site?.addresses && (
        <ConnectAccountsContainer
          label={t("Polkadot")}
          status={site.addresses.length ? "connected" : "disconnected"}
          connectedAddresses={site.addresses}
          isSingleProvider={!site.ethAddresses}
          infoText={t("Accounts connected via the Polkadot provider")}
        >
          <SubAccounts site={site} />
        </ConnectAccountsContainer>
      )}
    </div>
  )
}
