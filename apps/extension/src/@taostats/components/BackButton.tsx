import { classNames } from "@taostats-wallet/util"
import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { ButtonHTMLAttributes, DetailedHTMLProps, FC, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { To, useNavigate } from "react-router-dom"

import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"

type BackButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  to?: string
  analytics?: AnalyticsPage
}

export const BackButton: FC<BackButtonProps> = ({ analytics, children, to, ...props }) => {
  const navigate = useNavigate()

  const handleBackClick = useCallback(() => {
    if (analytics) {
      sendAnalyticsEvent({
        ...analytics,
        name: "Goto",
        action: "Back",
      })
    }
    navigate(to ?? (-1 as To))
  }, [analytics, navigate, to])

  const { t } = useTranslation()

  return (
    <button
      type="button"
      {...props}
      onClick={handleBackClick}
      className={classNames(
        "allow-focus bg-secondary hover:bg-tertiary text-fg-tertiary hover:text-fg-secondary gap-xxs py-xs pl-xxs pr-xs inline-flex items-center rounded-sm text-sm",
        props.className,
      )}
    >
      <ChevronLeft />
      <span>{children ?? t("Back")}</span>
    </button>
  )
}
