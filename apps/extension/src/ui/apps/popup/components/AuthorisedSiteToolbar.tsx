import { useMemo } from "react"

import { ConnectedAccountsPill } from "@ui/domains/Site/ConnectedAccountsPill"
import { useCurrentSite } from "@ui/hooks/useCurrentSite"
import { useAuthorisedSites } from "@ui/state"

export const AuthorisedSiteToolbar = () => {
  const currentSite = useCurrentSite()
  const authorisedSites = useAuthorisedSites()
  const isAuthorised = useMemo(
    () => Boolean(currentSite?.id && authorisedSites[currentSite?.id]),
    [authorisedSites, currentSite?.id],
  )

  if (!isAuthorised) return null

  return <ConnectedAccountsPill />
}
