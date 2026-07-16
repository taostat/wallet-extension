import { classNames, isNotNil } from "@taostats-wallet/util"
import { ArrowDown } from "@untitledui/icons/ArrowDown"
import { Eye } from "@untitledui/icons/Eye"
import { EyeOff } from "@untitledui/icons/EyeOff"
import { Send01 } from "@untitledui/icons/Send01"
import { FC, MouseEventHandler, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { api } from "@ui/api"
import { AnalyticsEventName, AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { currencyConfig } from "@ui/domains/Asset/currencyConfig"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { useCopyAddressModal } from "@ui/domains/CopyAddress"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { usePortfolioAccounts } from "@ui/hooks/usePortfolioAccounts"
import { useToggleCurrency } from "@ui/hooks/useToggleCurrency"
import { useAccounts, useSelectedCurrency, useSetting } from "@ui/state"

type Props = {
  className?: string
  mouseOver: boolean
  disabled?: boolean
}

export const TotalFiatBalance = ({ className, mouseOver, disabled }: Props) => {
  const { t } = useTranslation()
  const { portfolioTotal } = usePortfolioAccounts()
  const currency = useSelectedCurrency()
  const toggleCurrency = useToggleCurrency()

  const [hideBalances, setHideBalances] = useSetting("hideBalances")
  const { genericEvent } = useAnalytics()

  const toggleHideBalance: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      event.stopPropagation()
      genericEvent("toggle hide balance")
      setHideBalances((prev) => !prev)
    },
    [genericEvent, setHideBalances],
  )

  return (
    <div className={classNames("flex flex-col items-start justify-between gap-2", className)}>
      <div className="flex flex-col gap-1">
        <div className="text-fg-primary flex gap-2 text-xs">
          <div className="leading-10 tracking-[0.06px]">{t("Total Portfolio")}</div>
          <button
            className={classNames(
              "focus:text-fg-primary text-fg-tertiary hover:text-fg-primary pointer-events-auto opacity-0 transition-opacity",
              (hideBalances || mouseOver) && "opacity-100",
            )}
            onClick={toggleHideBalance}
          >
            {hideBalances ? <Eye /> : <EyeOff />}
          </button>
        </div>
        <div className="flex w-full max-w-full items-center gap-1">
          <button
            className={classNames(
              "bg-tertiary/20 text-fg-tertiary hover:text-fg-primary hover:bg-fg-primary/10 pointer-events-auto flex size-8 shrink-0 items-center justify-center rounded-full text-center shadow-[inset_0px_0px_1px_rgb(228_228_228_/_1)] transition-[box-shadow,color,background-color] duration-200 ease-out hover:shadow-[inset_0px_0px_2px_rgb(250_250_250_/_1)]",
              currencyConfig[currency]?.symbol?.length === 2 && "text-xs",
              currencyConfig[currency]?.symbol?.length > 2 && "text-[10px]",
            )}
            onClick={(event) => {
              event.stopPropagation()
              toggleCurrency()
            }}
          >
            {currencyConfig[currency]?.symbol}
          </button>
          <Fiat
            className={classNames(
              "overflow-hidden text-ellipsis whitespace-pre pr-5 text-[24px] font-bold leading-[28px] tracking-[0.016px]",
              disabled && "text-fg-secondary",
            )}
            amount={portfolioTotal}
            isBalance
            currencyDisplay="code"
          />
        </div>
      </div>
      <TopActions disabled={disabled} />
    </div>
  )
}

type ActionProps = {
  analyticsName: AnalyticsEventName
  analyticsAction?: string
  label: string
  tooltip?: string
  icon: FC<{ className?: string }>
  onClick: () => void
  disabled: boolean
  disabledReason?: string
}

const Action: FC<ActionProps> = ({
  analyticsName,
  analyticsAction,
  label,
  tooltip,
  icon: Icon,
  onClick,
  disabled,
  disabledReason,
}) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      event.stopPropagation()
      sendAnalyticsEvent({
        ...ANALYTICS_PAGE,
        name: analyticsName,
        action: analyticsAction,
      })
      onClick()
    },
    [onClick, analyticsAction, analyticsName],
  )

  return (
    <Tooltip placement="bottom-start">
      <TooltipTrigger asChild>
        <button
          type="button"
          className={classNames(
            "text-fg-secondary pointer-events-auto flex h-5 items-center gap-1 rounded-full bg-white/5 px-1.5 text-[10px] opacity-90 backdrop-blur-sm",
            "enabled:hover:text-fg-primary enabled:hover:bg-white/10",
          )}
          onClick={handleClick}
          disabled={disabled}
        >
          <div>
            <Icon className="size-3" />
          </div>
          <div>{label}</div>
        </button>
      </TooltipTrigger>
      {(!!disabledReason || !!tooltip) && (
        <TooltipContent>{disabledReason || tooltip}</TooltipContent>
      )}
    </Tooltip>
  )
}

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Popup",
  feature: "Portfolio",
  featureVersion: 2,
  page: "Portfolio Home",
}

const TopActions = ({ disabled }: { disabled?: boolean }) => {
  const { t } = useTranslation()
  const { open: openCopyAddressModal } = useCopyAddressModal()
  const ownedAccounts = useAccounts("owned")

  const { disableActions, disabledReason } = useMemo(() => {
    const disableActions = disabled || !ownedAccounts.length
    const disabledReason = disableActions ? t("Add an account to send or receive funds") : undefined
    return { disableActions, disabledReason }
  }, [disabled, ownedAccounts.length, t])

  const topActions = useMemo<ActionProps[]>(
    () =>
      [
        {
          analyticsName: "Goto" as const,
          analyticsAction: "Send Funds button",
          label: t("Send"),
          icon: Send01,
          onClick: () => api.sendFundsOpen().then(() => window.close()),
          disabled: disableActions,
          disabledReason,
        },
        {
          analyticsName: "Goto" as const,
          analyticsAction: "open receive",
          label: t("Receive"),
          icon: ArrowDown,
          onClick: () => openCopyAddressModal(),
          disabled: disableActions,
          disabledReason,
        },
      ].filter(isNotNil),
    [disableActions, disabledReason, openCopyAddressModal, t],
  )

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex justify-center gap-2">
        {topActions.map((action, index) => (
          <Action key={index} {...action} />
        ))}
      </div>
    </div>
  )
}
