import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { FC, ReactNode, useCallback } from "react"
import { useNavigate } from "react-router-dom"

import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"

type SendFundsLayoutProps = {
  title?: ReactNode
  withBackLink?: boolean
  children?: ReactNode
  analytics: AnalyticsPage
}

export const SendFundsLayout: FC<SendFundsLayoutProps> = ({
  title,
  children,
  withBackLink,
  analytics,
}) => {
  const navigate = useNavigate()

  useAnalyticsPageView(analytics)

  const handleBackClick = useCallback(() => {
    sendAnalyticsEvent({
      ...analytics,
      name: "Goto",
      action: "Back",
    })
    navigate(-1)
  }, [analytics, navigate])

  const showBackButton = withBackLink && window.history.length > 1

  return (
    <div id="main" className="relative flex h-full w-full flex-col">
      <div className="text-fg-secondary flex h-16 min-h-[64px] w-full items-center px-6">
        {showBackButton ? (
          <button
            type="button"
            className="text-fg-secondary hover:text-fg-primary flex cursor-pointer items-center text-lg"
            onClick={handleBackClick}
          >
            <ChevronLeft />
          </button>
        ) : (
          <div className="w-6">&nbsp;</div>
        )}
        <div className="grow text-center">{title}</div>
        <div className="w-6">&nbsp;</div>
      </div>
      <div className="w-full grow overflow-hidden">{children}</div>
    </div>
  )
}
