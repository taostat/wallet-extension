import { useCallback, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { AnalyticsPage } from "@ui/api/analytics"
import { SendFundsProgress } from "@ui/domains/SendFunds/SendFundsProgress"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Popup",
  feature: "Send Funds",
  featureVersion: 2,
  page: "Pending Transfer Page",
}

export const SendFundsSubmitted = () => {
  const navigate = useNavigate()
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
    navigate("/portfolio")
  }, [navigate])

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col px-6 py-4">
      <SendFundsProgress txId={txId} networkId={networkId} onClose={handleClose} />
    </div>
  )
}
