import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"

import { AnalyticsPage } from "@ui/api/analytics"
import { SendFundsProgress } from "@ui/domains/SendFunds/SendFundsProgress"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"
import { closeWalletSurface } from "@ui/util/closeWalletSurface"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Popup",
  feature: "Send Funds",
  featureVersion: 2,
  page: "Pending Transfer Page",
}

export const SendFundsSubmitted = () => {
  const [searchParams] = useSearchParams()

  useAnalyticsPageView(ANALYTICS_PAGE)

  const [txId, networkId] = useMemo(
    () => [
      (searchParams.get("txId") as string) ?? undefined,
      (searchParams.get("networkId") as string) ?? undefined,
    ],
    [searchParams],
  )

  const handleClose = useCallback(() => {
    void closeWalletSurface()
  }, [])

  return (
    <div id="main" className="relative h-full w-full px-6 py-4">
      <SendFundsProgress txId={txId} networkId={networkId} onClose={handleClose} />
    </div>
  )
}
