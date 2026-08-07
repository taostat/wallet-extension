import { urlToDomain } from "../../util/urlToDomain"
import sitesAuthorisedStore from "./store"
import type { AuthorizedSite } from "./types"

export const siteHasConnectedAccounts = (site: AuthorizedSite | undefined): boolean =>
  Boolean(site?.addresses?.length)

/** Whether a dapp `enable()` call will need the connect approval UI. */
export const siteNeedsConnectAuthorization = (pageUrl: string | undefined): boolean => {
  if (!pageUrl) return true

  const { ok, val: domain } = urlToDomain(pageUrl)
  if (!ok) return true

  const site = sitesAuthorisedStore.getSiteSnapshot(domain)
  return !siteHasConnectedAccounts(site)
}
