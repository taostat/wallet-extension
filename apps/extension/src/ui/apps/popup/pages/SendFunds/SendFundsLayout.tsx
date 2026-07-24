import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { FC, ReactNode, useCallback } from "react"
import { useNavigate } from "react-router-dom"

import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"

type SendFundsLayoutProps = {
  title?: ReactNode
  withBackLink?: boolean
  backTo?: string
  children?: ReactNode
  analytics: AnalyticsPage
}

export const SendFundsLayout: FC<SendFundsLayoutProps> = ({
  title,
  children,
  withBackLink,
  backTo,
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

    if (backTo) {
      navigate(backTo)
      return
    }

    if (withBackLink && window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate("/portfolio")
  }, [analytics, backTo, navigate, withBackLink])

  const showBackButton = withBackLink || !!backTo

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <div className="text-fg-secondary flex h-16 min-h-[64px] w-full items-center px-2">
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
