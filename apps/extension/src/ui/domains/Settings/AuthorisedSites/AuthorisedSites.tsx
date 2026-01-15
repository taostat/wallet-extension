import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Spacer } from "@taostats/components/Spacer"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAuthorisedSites } from "@ui/state"

import { AuthorizedSite } from "./AuthorisedSite"
import { AuthorisedSitesBatchActions } from "./AuthorisedSiteBatchActions"

const providerType = "polkadot"

export const AuthorisedSites = () => {
  const { t } = useTranslation()
  const sites = useAuthorisedSites()

  const siteIds = useMemo(() => {
    if (!sites) return []
    return Object.keys(sites).filter((id: string) => {
      const site = sites[id]
      switch (providerType) {
        case "polkadot":
          return !!site.addresses
        default:
          return false
      }
    })
  }, [sites])

  const [hasPolkadotSites] = useMemo(
    () => [Object.values(sites).some((site) => !!site.addresses)],
    [sites],
  )

  const showBatchActions = hasPolkadotSites

  return (
    <>
      <HeaderBlock
        title={t("Connected Sites")}
        text={t("Manage the sites that have access to your accounts")}
      />
      <Spacer large />
      <div className="flex items-center justify-between">
        {showBatchActions && <AuthorisedSitesBatchActions providerType={providerType} />}
      </div>
      <Spacer small />
      <div className="flex flex-col gap-4">
        {siteIds.map((id) => (
          <AuthorizedSite key={`${providerType}-${id}`} id={id} provider={providerType} />
        ))}
        {providerType === "polkadot" && !hasPolkadotSites && (
          <div className="bg-grey-850 text-body-secondary w-full rounded p-8">
            {t("You haven't connected to any sites yet.")}
          </div>
        )}
      </div>
    </>
  )
}
